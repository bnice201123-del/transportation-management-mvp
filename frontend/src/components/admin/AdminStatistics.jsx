import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Progress,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  useToast,
  Select,
  Flex,
  Icon,
  SimpleGrid,
  CircularProgress,
  CircularProgressLabel,
  Button,
  ButtonGroup,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Fade,
  ScaleFade,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  useBreakpointValue,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  AvatarGroup,
  Stack,
  Wrap,
  WrapItem,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  Image,

  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  TimeIcon, 
  CheckCircleIcon, 
  WarningIcon,
  DownloadIcon,
  RepeatIcon,
  InfoIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  ArrowUpIcon
} from '@chakra-ui/icons';
import { FaCar, FaUser, FaRoute, FaDollarSign, FaChartLine, FaClock, FaMapMarkerAlt, FaLeaf } from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const AdminStatistics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7days');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, realtime
  const [statistics, setStatistics] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const scrollRef = useRef(null);
  const toast = useToast();

  // Color mode values - must be before early returns
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  // Responsive values - must be before early returns
  const metricColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 5 });
  const chartColumns = useBreakpointValue({ base: 1, lg: 2 });

  // Additional UI values
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Enhanced mock data with more comprehensive statistics
  const mockStatistics = React.useMemo(() => ({
    overview: {
      totalTrips: 1247,
      totalUsers: 89,
      totalDrivers: 23,
      totalVehicles: 18,
      activeTrips: 12,
      completedTrips: 1198,
      cancelledTrips: 37,
      revenue: 45678.90,
      efficiency: 94.2,
      avgRating: 4.6,
      totalDistance: 15420,
      fuelSaved: 342,
      co2Reduced: 890
    },
    performance: {
      avgTripDuration: 35.5,
      avgWaitTime: 8.2,
      customerSatisfaction: 4.6,
      fuelEfficiency: 12.8,
      onTimePercentage: 92.3,
      peakHours: '8-10 AM, 5-7 PM',
      avgSpeed: 45.2
    },
    trends: {
      tripsByDay: [
        { day: 'Mon', trips: 45, revenue: 1250, completed: 42, cancelled: 3 },
        { day: 'Tue', trips: 52, revenue: 1430, completed: 48, cancelled: 4 },
        { day: 'Wed', trips: 48, revenue: 1320, completed: 46, cancelled: 2 },
        { day: 'Thu', trips: 61, revenue: 1680, completed: 58, cancelled: 3 },
        { day: 'Fri', trips: 58, revenue: 1590, completed: 55, cancelled: 3 },
        { day: 'Sat', trips: 73, revenue: 2010, completed: 70, cancelled: 3 },
        { day: 'Sun', trips: 67, revenue: 1840, completed: 64, cancelled: 3 }
      ],
      hourlyData: [
        { hour: '6 AM', trips: 5 }, { hour: '7 AM', trips: 12 }, { hour: '8 AM', trips: 25 },
        { hour: '9 AM', trips: 35 }, { hour: '10 AM', trips: 28 }, { hour: '11 AM', trips: 22 },
        { hour: '12 PM', trips: 30 }, { hour: '1 PM', trips: 18 }, { hour: '2 PM', trips: 15 },
        { hour: '3 PM', trips: 20 }, { hour: '4 PM', trips: 28 }, { hour: '5 PM', trips: 40 },
        { hour: '6 PM', trips: 38 }, { hour: '7 PM', trips: 32 }, { hour: '8 PM', trips: 25 }
      ]
    },
    alerts: {
      critical: 2,
      warnings: 5,
      info: 12,
      recent: [
        { type: 'warning', message: 'High wait times in downtown area', time: '10 min ago' },
        { type: 'info', message: 'New driver registered', time: '25 min ago' },
        { type: 'critical', message: 'Vehicle V-001 requires maintenance', time: '1 hour ago' }
      ]
    }
  }), []);

  const fetchStatistics = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(`/api/analytics/statistics?range=${timeRange}`);
      setStatistics(response.data);
      setLastUpdated(new Date());
      
      if (showRefresh) {
        toast({
          title: 'Statistics refreshed',
          description: 'Data has been updated successfully',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // Fallback to mock data if API fails
      setStatistics(mockStatistics);
      
      if (showRefresh) {
        toast({
          title: 'Using sample data',
          description: 'Could not connect to server. Displaying sample statistics.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, toast, mockStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Auto-refresh every 30 seconds when view is active
  useEffect(() => {
    let interval;
    if (viewMode === 'realtime') {
      interval = setInterval(() => {
        fetchStatistics(true);
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewMode, fetchStatistics]);

  // Check authorization after hooks
  const isAuthorized = user && ['admin', 'dispatcher'].includes(user.role);

  if (!isAuthorized) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Container maxW="7xl" py={6}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Access Denied!</AlertTitle>
            <AlertDescription>
              You don't have permission to view analytics data.
            </AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }





  const handleRefresh = () => {
    fetchStatistics(true);
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const csvContent = [
        // Header
        ['Metric', 'Value', 'Period', 'Timestamp'],
        // Performance metrics
        ['Average Trip Duration', `${statistics.performance?.avgTripDuration || 'N/A'} min`, timeRange, new Date().toISOString()],
        ['Average Wait Time', `${statistics.performance?.avgWaitTime || 'N/A'} min`, timeRange, new Date().toISOString()],
        ['Customer Satisfaction', `${statistics.performance?.customerSatisfaction || 'N/A'}/5`, timeRange, new Date().toISOString()],
        ['On-Time Percentage', `${statistics.performance?.onTimePercentage || 'N/A'}%`, timeRange, new Date().toISOString()],
        // Overview metrics
        ['Total Trips', statistics.overview?.totalTrips || 'N/A', timeRange, new Date().toISOString()],
        ['Active Trips', statistics.overview?.activeTrips || 'N/A', timeRange, new Date().toISOString()],
        ['Active Drivers', statistics.overview?.activeDrivers || 'N/A', timeRange, new Date().toISOString()],
        ['Total Revenue', `$${statistics.financial?.totalRevenue || 'N/A'}`, timeRange, new Date().toISOString()]
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export completed',
        description: 'Statistics report has been downloaded',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export statistics report',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    trend, 
    isLoading,
    bgGradient,
    borderColor: customBorderColor,
    description
  }) => (
    <ScaleFade initialScale={0.9} in={!isLoading}>
      <Card 
        bg={bgGradient ? undefined : cardBg}
        bgGradient={bgGradient}
        borderColor={customBorderColor || borderColor}
        borderWidth="1px"
        shadow="md"
        _hover={{ 
          shadow: 'xl', 
          transform: 'translateY(-4px)',
          borderColor: color || 'blue.300'
        }}
        transition="all 0.3s"
        position="relative"
        overflow="hidden"
      >
        {/* Subtle Background Pattern */}
        {bgGradient && (
          <Box
            position="absolute"
            top={0}
            right={0}
            width="60px"
            height="60px"
            opacity={0.1}
            transform="translate(20px, -20px)"
          >
            <Icon as={icon} boxSize={12} color={color} />
          </Box>
        )}
        
        <CardBody p={{ base: 4, md: 5 }} position="relative" zIndex={1}>
          <Stat>
            <HStack justify="space-between" align="start" spacing={3}>
              <VStack align="start" spacing={1} flex={1} minW={0}>
                <StatLabel 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="gray.500" 
                  fontWeight="medium"
                  noOfLines={1}
                >
                  {title}
                </StatLabel>
                {isLoading ? (
                  <VStack align="start" spacing={2} width="full">
                    <Skeleton height="32px" width="80px" />
                    <Skeleton height="16px" width="120px" />
                  </VStack>
                ) : (
                  <>
                    <StatNumber 
                      fontSize={{ base: "xl", md: "2xl" }} 
                      fontWeight="bold" 
                      color={bgGradient ? "white" : textColor}
                      noOfLines={1}
                    >
                      {value || '0'}
                    </StatNumber>
                    {description && (
                      <Text 
                        fontSize="xs" 
                        color={bgGradient ? "whiteAlpha.800" : "gray.600"} 
                        noOfLines={1}
                      >
                        {description}
                      </Text>
                    )}
                    {subtitle && (
                      <StatHelpText mb={0} fontSize="xs">
                        <HStack spacing={1}>
                          {trend && (
                            <Icon 
                              as={trend > 0 ? TriangleUpIcon : TriangleDownIcon} 
                              color={trend > 0 ? 'green.400' : 'red.400'}
                              boxSize={3}
                            />
                          )}
                          <Text 
                            color={
                              bgGradient 
                                ? "whiteAlpha.900"
                                : trend > 0 ? 'green.500' : 'red.500'
                            }
                            fontWeight="medium"
                          >
                            {subtitle}
                          </Text>
                        </HStack>
                      </StatHelpText>
                    )}
                  </>
                )}
              </VStack>
              <Box flexShrink={0}>
                {isLoading ? (
                  <Skeleton boxSize={8} borderRadius="md" />
                ) : (
                  <Tooltip label={`${title}${description ? ` - ${description}` : ''}`} placement="top">
                    <Box
                      p={{ base: 2, md: 3 }}
                      borderRadius="lg"
                      bg={bgGradient ? "whiteAlpha.200" : `${color?.split('.')[0] || 'blue'}.50`}
                      backdropFilter={bgGradient ? "blur(10px)" : undefined}
                    >
                      <Icon 
                        as={icon} 
                        boxSize={{ base: 5, md: 6 }} 
                        color={bgGradient ? "white" : color || "blue.500"} 
                      />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </HStack>
          </Stat>
        </CardBody>
      </Card>
    </ScaleFade>
  );



  const ChartPlaceholder = ({ title, description }) => (
    <Card>
      <CardHeader>
        <Heading size="md">{title}</Heading>
      </CardHeader>
      <CardBody>
        <Box
          height={300}
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          border="2px dashed"
          borderColor="gray.300"
        >
          <VStack>
            <Icon as={FaChartLine} boxSize={12} color="gray.400" />
            <Text color="gray.500" textAlign="center">
              {description || 'Chart visualization coming soon'}
            </Text>
          </VStack>
        </Box>
      </CardBody>
    </Card>
  );

  const AlertsCard = () => (
    <Card bg={cardBg} borderColor={borderColor} shadow="sm">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" color={textColor}>Recent Alerts</Heading>
          <HStack>
            <Badge colorScheme="red" variant="solid">{statistics.alerts?.critical || 0}</Badge>
            <Badge colorScheme="orange" variant="solid">{statistics.alerts?.warnings || 0}</Badge>
            <Badge colorScheme="blue" variant="solid">{statistics.alerts?.info || 0}</Badge>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={3} align="stretch">
          {statistics.alerts?.recent?.map((alert, index) => (
            <Alert key={index} status={alert.type === 'critical' ? 'error' : alert.type} borderRadius="md">
              <AlertIcon />
              <Box flex={1}>
                <AlertDescription fontSize="sm">
                  {alert.message}
                </AlertDescription>
              </Box>
              <Text fontSize="xs" color="gray.500">{alert.time}</Text>
            </Alert>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );

  const HourlyTrafficCard = () => (
    <Card bg={cardBg} borderColor={borderColor} shadow="sm">
      <CardHeader>
        <Heading size="md" color={textColor}>Hourly Traffic</Heading>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={3} spacing={2}>
          {statistics.trends?.hourlyData?.slice(0, 9).map((hour, index) => (
            <VStack key={index} spacing={1}>
              <Text fontSize="xs" color="gray.500">{hour.hour}</Text>
              <Progress 
                value={(hour.trips / 40) * 100} 
                size="sm" 
                colorScheme="blue" 
                width="100%"
              />
              <Text fontSize="xs" fontWeight="bold">{hour.trips}</Text>
            </VStack>
          ))}
        </SimpleGrid>
      </CardBody>
    </Card>
  );

  const LoadingSkeleton = () => (
    <VStack spacing={6} align="stretch">
      <Skeleton height="60px" borderRadius="md" />
      <SimpleGrid columns={metricColumns} spacing={6}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} bg={cardBg}>
            <CardBody p={5}>
              <VStack spacing={2}>
                <Skeleton height="20px" width="80%" />
                <Skeleton height="32px" width="60%" />
                <Skeleton height="16px" width="90%" />
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
      <Navbar />
      
      {/* Enhanced Scrollable Container */}
      <Box 
        ref={scrollRef}
        flex="1"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '4px',
          },
        }}
      >
        <Container maxW="7xl" p={{ base: 4, md: 6, lg: 8 }}>
        <VStack spacing={{ base: 4, md: 6, lg: 8 }} align="stretch">
          {/* Enhanced Header with Mobile Responsive Design */}
          <Box>
            <Flex 
              justify="space-between" 
              align={{ base: "start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={{ base: 3, md: 4 }}
              mb={4}
            >
              <VStack align="start" spacing={2}>
                <Heading 
                  size={{ base: "md", md: "lg", lg: "xl" }}
                  color="teal.600" 
                  fontWeight="bold"
                >
                  📊 System Statistics
                </Heading>
                <HStack spacing={2} align="center" flexWrap="wrap">
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Text>
                  {refreshing && (
                    <HStack spacing={1}>
                      <Spinner size="sm" color="blue.500" />
                      <Text fontSize="xs" color="blue.500">Refreshing...</Text>
                    </HStack>
                  )}
                  <Badge 
                    colorScheme={viewMode === 'realtime' ? 'green' : 'blue'} 
                    variant="subtle"
                    fontSize="xs"
                  >
                    {timeRange.replace('hours', 'h').replace('days', 'd').replace('30d', '30 days')}
                  </Badge>
                </HStack>
              </VStack>
              
              <Stack 
                direction={{ base: "column", sm: "row" }} 
                spacing={3} 
                align="stretch"
                width={{ base: "full", md: "auto" }}
              >
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="md"
                  minW={{ base: "full", sm: "200px" }}
                  bg={cardBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: 'blue.300' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                >
                  <option value="24hours">📅 Last 24 Hours</option>
                  <option value="7days">📅 Last 7 Days</option>
                  <option value="30days">📅 Last 30 Days</option>
                  <option value="90days">📅 Last 90 Days</option>
                  <option value="1year">📅 Last Year</option>
                </Select>
                <ButtonGroup size="md" isAttached variant="outline">
                  <Button 
                    variant={viewMode === 'overview' ? 'solid' : 'outline'}
                    colorScheme={viewMode === 'overview' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('overview')}
                    size={{ base: "sm", md: "md" }}
                  >
                    📋 Overview
                  </Button>
                  <Button 
                    variant={viewMode === 'detailed' ? 'solid' : 'outline'}
                    colorScheme={viewMode === 'detailed' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('detailed')}
                    size={{ base: "sm", md: "md" }}
                  >
                    📊 Detailed
                  </Button>
                  <Button 
                    variant={viewMode === 'realtime' ? 'solid' : 'outline'}
                    colorScheme={viewMode === 'realtime' ? 'green' : 'gray'}
                    onClick={() => setViewMode('realtime')}
                    size={{ base: "sm", md: "md" }}
                  >
                    🔴 Live
                  </Button>
                </ButtonGroup>
              </Stack>
            </Flex>
            <Divider />
          </Box>

          {/* Enhanced Key Metrics Overview with Animation and Better UX */}
          <Card 
            bg={cardBg} 
            borderColor={borderColor} 
            shadow="md" 
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{ shadow: 'xl' }}
          >
            <CardHeader pb={2}>
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <VStack align="start" spacing={1}>
                  <Heading size={{ base: "sm", md: "md", lg: "lg" }} color="teal.600">
                    📊 Key Performance Metrics
                  </Heading>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                    Real-time insights • Updated {lastUpdated.toLocaleTimeString()}
                  </Text>
                </VStack>
                <HStack spacing={2}>
                  {refreshing && (
                    <HStack spacing={1}>
                      <Spinner size="sm" color="blue.500" />
                      <Text fontSize="xs" color="blue.500">Live</Text>
                    </HStack>
                  )}
                  <Badge 
                    colorScheme="green" 
                    variant="subtle" 
                    fontSize="xs"
                    px={2} 
                    py={1}
                    borderRadius="md"
                  >
                    ✅ Active
                  </Badge>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody pt={2} p={{ base: 4, md: 5, lg: 6 }}>
              <SimpleGrid 
                columns={{ base: 1, sm: 2, md: 3, lg: 5 }} 
                spacing={{ base: 3, md: 4, lg: 6 }}
              >
                <StatCard
                  title="Total Trips"
                  value={statistics.overview?.totalTrips?.toLocaleString() || '0'}
                  subtitle={`+${statistics.tripGrowth || 12}% from last period`}
                  icon={FaRoute}
                  color="blue.500"
                  trend={statistics.tripGrowth || 12}
                  bgGradient="linear(to-r, blue.50, blue.100)"
                  borderColor="blue.200"
                  isLoading={loading}
                />
                <StatCard
                  title="Active Users"
                  value={statistics.overview?.totalUsers?.toLocaleString() || statistics.totalUsers?.toString() || '0'}
                  subtitle={`+${statistics.userGrowth || 8}% from last period`}
                  icon={FaUser}
                  color="green.500"
                  trend={statistics.userGrowth || 8}
                  bgGradient="linear(to-r, green.50, green.100)"
                  borderColor="green.200"
                  isLoading={loading}
                />
                <StatCard
                  title="Revenue"
                  value={`₦${(statistics.overview?.revenue || statistics.revenue || 0).toLocaleString()}`}
                  subtitle={`+${statistics.revenueGrowth || 15}% from last period`}
                  icon={FaDollarSign}
                  color="purple.500"
                  trend={statistics.revenueGrowth || 15}
                  bgGradient="linear(to-r, purple.50, purple.100)"
                  borderColor="purple.200"
                  isLoading={loading}
                />
                <StatCard
                  title="Active Vehicles"
                  value={statistics.overview?.totalDrivers?.toString() || statistics.activeVehicles?.toString() || '0'}
                  subtitle={`+${statistics.vehicleGrowth || 3}% from last period`}
                  icon={FaCar}
                  color="orange.500"
                  trend={statistics.vehicleGrowth || 3}
                  bgGradient="linear(to-r, orange.50, orange.100)"
                  borderColor="orange.200"
                  isLoading={loading}
                />
                <StatCard
                  title="System Efficiency"
                  value={`${statistics.overview?.efficiency || statistics.successRate || '98.5'}%`}
                  subtitle={`+${statistics.efficiencyGrowth || 2.1}% from last period`}
                  icon={FaChartLine}
                  color="teal.500"
                  trend={statistics.efficiencyGrowth || 2.1}
                  bgGradient="linear(to-r, teal.50, teal.100)"
                  borderColor="teal.200"
                  isLoading={loading}
                />
              </SimpleGrid>

              {/* Quick Action Metrics - Mobile Responsive */}
              <Divider my={6} />
              <VStack align="start" spacing={3} mb={4}>
                <Heading size="sm" color={textColor}>⚡ Quick Insights</Heading>
                <SimpleGrid 
                  columns={{ base: 2, sm: 4 }} 
                  spacing={{ base: 3, md: 4 }}
                  width="full"
                >
                  <Box 
                    p={{ base: 3, md: 4 }}
                    bg={cardBg}
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor={borderColor}
                    textAlign="center"
                    transition="all 0.2s"
                    _hover={{ 
                      transform: "translateY(-2px)", 
                      shadow: "md",
                      borderColor: "blue.300"
                    }}
                  >
                    <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>⚡</Text>
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor}>
                      {statistics.avgResponseTime || '2.3s'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Response Time</Text>
                  </Box>
                  
                  <Box 
                    p={{ base: 3, md: 4 }}
                    bg={cardBg}
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor={borderColor}
                    textAlign="center"
                    transition="all 0.2s"
                    _hover={{ 
                      transform: "translateY(-2px)", 
                      shadow: "md",
                      borderColor: "green.300"
                    }}
                  >
                    <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>🎯</Text>
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor}>
                      {statistics.successRate || '98.5%'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Success Rate</Text>
                  </Box>
                  
                  <Box 
                    p={{ base: 3, md: 4 }}
                    bg={cardBg}
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor={borderColor}
                    textAlign="center"
                    transition="all 0.2s"
                    _hover={{ 
                      transform: "translateY(-2px)", 
                      shadow: "md",
                      borderColor: "purple.300"
                    }}
                  >
                    <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>⭐</Text>
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor}>
                      {statistics.avgRating || '4.8'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Avg Rating</Text>
                  </Box>
                  
                  <Box 
                    p={{ base: 3, md: 4 }}
                    bg={cardBg}
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor={borderColor}
                    textAlign="center"
                    transition="all 0.2s"
                    _hover={{ 
                      transform: "translateY(-2px)", 
                      shadow: "md",
                      borderColor: "orange.300"
                    }}
                  >
                    <Text fontSize={{ base: "xl", md: "2xl" }} mb={1}>🔄</Text>
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor}>
                      {statistics.activeTrips || statistics.ongoingTrips || '12'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">Active Now</Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Enhanced Performance Metrics - Mobile Responsive */}
          <Card 
            bg={cardBg} 
            shadow="md" 
            borderRadius="lg" 
            borderColor={borderColor}
            transition="all 0.2s"
            _hover={{ shadow: 'xl' }}
          >
            <CardHeader pb={3}>
              <Flex 
                justify="space-between" 
                align={{ base: "start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={{ base: 3, md: 4 }}
              >
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Text fontSize={{ base: "xl", md: "2xl" }}>📈</Text>
                    <Heading size={{ base: "sm", md: "md", lg: "lg" }} color="teal.600">
                      Performance Dashboard
                    </Heading>
                  </HStack>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                    Real-time operational metrics • Last updated {lastUpdated.toLocaleTimeString()}
                  </Text>
                </VStack>
                <HStack 
                  spacing={2} 
                  flexWrap="wrap" 
                  justify={{ base: "start", md: "end" }}
                >
                  <ButtonGroup size={{ base: "sm", md: "md" }} isAttached variant="outline">
                    <Button 
                      leftIcon={<RepeatIcon />}
                      onClick={handleRefresh}
                      isLoading={refreshing}
                      loadingText="Refreshing"
                      colorScheme="teal"
                      variant={refreshing ? "solid" : "outline"}
                    >
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                    <Button 
                      leftIcon={<DownloadIcon />}
                      onClick={handleExport}
                      colorScheme="green"
                    >
                      Export
                    </Button>
                  </ButtonGroup>
                  <Badge 
                    colorScheme={viewMode === 'realtime' ? 'green' : 'blue'} 
                    variant="subtle"
                    fontSize="xs"
                    px={2} 
                    py={1}
                  >
                    {viewMode === 'realtime' ? '🔴 Live Data' : '📊 Historical'}
                  </Badge>
                </HStack>
              </Flex>
            </CardHeader>

            <CardBody pt={3}>
              {/* Enhanced Performance Metrics Grid - Mobile Responsive & Compact */}
              <SimpleGrid 
                columns={{ base: 2, md: 4 }} 
                spacing={{ base: 3, md: 4 }} 
                mb={6}
              >
                {/* Trip Duration Metric */}
                <Box 
                  p={{ base: 3, md: 4 }}
                  bg="linear-gradient(135deg, blue.50 0%, blue.100 100%)"
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="blue.200"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ 
                    transform: "translateY(-2px)", 
                    shadow: "lg",
                    borderColor: "blue.300"
                  }}
                  minH={{ base: "120px", md: "140px" }}
                >
                  <VStack align="center" spacing={2} h="full" justify="space-between">
                    <VStack spacing={1} align="center">
                      <HStack spacing={1}>
                        <Text fontSize={{ base: "sm", md: "md" }}>🕒</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="blue.600" textAlign="center">
                          Trip Duration
                        </Text>
                      </HStack>
                      <HStack spacing={1} align="baseline">
                        <Text 
                          fontSize={{ base: "lg", md: "xl" }} 
                          fontWeight="bold" 
                          color="blue.800"
                        >
                          {loading ? '-' : (statistics.performance?.avgTripDuration || '25')}
                        </Text>
                        <Text fontSize="xs" color="blue.600">min</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="blue.500" thickness="3px" />
                    ) : (
                      <CircularProgress 
                        value={((statistics.performance?.avgTripDuration || 25) / 30) * 100} 
                        color="blue.500" 
                        size="32px" 
                        thickness="6px"
                        trackColor="blue.100"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="bold" color="blue.700">
                          {((statistics.performance?.avgTripDuration || 25) / 30 * 100).toFixed(0)}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                    <Text fontSize="2xs" color="blue.500" textAlign="center" noOfLines={1}>
                      Target: 30min
                    </Text>
                  </VStack>
                </Box>

                {/* Wait Time Metric */}
                <Box 
                  p={{ base: 3, md: 4 }}
                  bg="linear-gradient(135deg, orange.50 0%, orange.100 100%)"
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="orange.200"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ 
                    transform: "translateY(-2px)", 
                    shadow: "lg",
                    borderColor: "orange.300"
                  }}
                  minH={{ base: "120px", md: "140px" }}
                >
                  <VStack align="center" spacing={2} h="full" justify="space-between">
                    <VStack spacing={1} align="center">
                      <HStack spacing={1}>
                        <Text fontSize={{ base: "sm", md: "md" }}>⏱️</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="orange.600" textAlign="center">
                          Wait Time
                        </Text>
                      </HStack>
                      <HStack spacing={1} align="baseline">
                        <Text 
                          fontSize={{ base: "lg", md: "xl" }} 
                          fontWeight="bold" 
                          color="orange.800"
                        >
                          {loading ? '-' : (statistics.performance?.avgWaitTime || '8')}
                        </Text>
                        <Text fontSize="xs" color="orange.600">min</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="orange.500" thickness="3px" />
                    ) : (
                      <CircularProgress 
                        value={100 - ((statistics.performance?.avgWaitTime || 8) / 10) * 100} 
                        color="orange.500" 
                        size="32px" 
                        thickness="6px"
                        trackColor="orange.100"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="bold" color="orange.700">
                          {(100 - (statistics.performance?.avgWaitTime || 8) / 10 * 100).toFixed(0)}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                    <Text fontSize="2xs" color="orange.500" textAlign="center" noOfLines={1}>
                      Target: &lt;10min
                    </Text>
                  </VStack>
                </Box>

                {/* Customer Rating Metric */}
                <Box 
                  p={{ base: 3, md: 4 }}
                  bg="linear-gradient(135deg, green.50 0%, green.100 100%)"
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="green.200"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ 
                    transform: "translateY(-2px)", 
                    shadow: "lg",
                    borderColor: "green.300"
                  }}
                  minH={{ base: "120px", md: "140px" }}
                >
                  <VStack align="center" spacing={2} h="full" justify="space-between">
                    <VStack spacing={1} align="center">
                      <HStack spacing={1}>
                        <Text fontSize={{ base: "sm", md: "md" }}>⭐</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="green.600" textAlign="center">
                          Rating
                        </Text>
                      </HStack>
                      <HStack spacing={1} align="baseline">
                        <Text 
                          fontSize={{ base: "lg", md: "xl" }} 
                          fontWeight="bold" 
                          color="green.800"
                        >
                          {loading ? '-' : (statistics.performance?.customerSatisfaction || '4.8')}
                        </Text>
                        <Text fontSize="xs" color="green.600">/5</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="green.500" thickness="3px" />
                    ) : (
                      <CircularProgress 
                        value={(statistics.performance?.customerSatisfaction || 4.8) / 5 * 100} 
                        color="green.500" 
                        size="32px" 
                        thickness="6px"
                        trackColor="green.100"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="bold" color="green.700">
                          {((statistics.performance?.customerSatisfaction || 4.8) / 5 * 100).toFixed(0)}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                    <Text fontSize="2xs" color="green.500" textAlign="center" noOfLines={1}>
                      Excellent
                    </Text>
                  </VStack>
                </Box>

                {/* On-Time Performance Metric */}
                <Box 
                  p={{ base: 3, md: 4 }}
                  bg="linear-gradient(135deg, purple.50 0%, purple.100 100%)"
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="purple.200"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ 
                    transform: "translateY(-2px)", 
                    shadow: "lg",
                    borderColor: "purple.300"
                  }}
                  minH={{ base: "120px", md: "140px" }}
                >
                  <VStack align="center" spacing={2} h="full" justify="space-between">
                    <VStack spacing={1} align="center">
                      <HStack spacing={1}>
                        <Text fontSize={{ base: "sm", md: "md" }}>🎯</Text>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="purple.600" textAlign="center">
                          On-Time
                        </Text>
                      </HStack>
                      <HStack spacing={1} align="baseline">
                        <Text 
                          fontSize={{ base: "lg", md: "xl" }} 
                          fontWeight="bold" 
                          color="purple.800"
                        >
                          {loading ? '-' : (statistics.performance?.onTimePercentage || '88')}
                        </Text>
                        <Text fontSize="xs" color="purple.600">%</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="purple.500" thickness="3px" />
                    ) : (
                      <CircularProgress 
                        value={statistics.performance?.onTimePercentage || 88}
                        color="purple.500" 
                        size="32px" 
                        thickness="6px"
                        trackColor="purple.100"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="bold" color="purple.700">
                          {statistics.performance?.onTimePercentage || 88}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                    <Text fontSize="2xs" color="purple.500" textAlign="center" noOfLines={1}>
                      Target: 90%
                    </Text>
                  </VStack>
                </Box>
              </SimpleGrid>

              {/* Compact Quick Stats Row */}
              <SimpleGrid 
                columns={{ base: 1, md: 2 }} 
                spacing={{ base: 3, md: 4 }} 
                mb={4}
              >
                <Box p={{ base: 3, md: 4 }} bg={statBg} borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <HStack justify="space-between" align="center" mb={3}>
                    <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color={textColor}>
                      📊 Today's Activity
                    </Text>
                    <Badge colorScheme="blue" variant="subtle" fontSize="2xs">Live</Badge>
                  </HStack>
                  <SimpleGrid columns={2} spacing={{ base: 2, md: 3 }}>
                    <VStack align="center" spacing={1} p={2} bg="blue.50" borderRadius="md">
                      <Icon as={FaCar} color="blue.500" boxSize={4} />
                      <Text fontSize="xs" color="gray.600" textAlign="center">Active Trips</Text>
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.600">
                        {loading ? '-' : (statistics.overview?.activeTrips || '12')}
                      </Text>
                    </VStack>
                    
                    <VStack align="center" spacing={1} p={2} bg="green.50" borderRadius="md">
                      <Icon as={FaUser} color="green.500" boxSize={4} />
                      <Text fontSize="xs" color="gray.600" textAlign="center">Drivers</Text>
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="green.600">
                        {loading ? '-' : (statistics.overview?.activeDrivers || '18')}
                      </Text>
                    </VStack>
                    
                    <VStack align="center" spacing={1} p={2} bg="orange.50" borderRadius="md">
                      <Icon as={FaRoute} color="orange.500" boxSize={4} />
                      <Text fontSize="xs" color="gray.600" textAlign="center">Avg Distance</Text>
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="orange.600">
                        {loading ? '-' : `${(statistics.performance?.avgDistance || 12.5)}mi`}
                      </Text>
                    </VStack>
                    
                    <VStack align="center" spacing={1} p={2} bg="purple.50" borderRadius="md">
                      <Icon as={FaDollarSign} color="purple.500" boxSize={4} />
                      <Text fontSize="xs" color="gray.600" textAlign="center">Revenue</Text>
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="purple.600">
                        {loading ? '-' : `$${(statistics.financial?.totalRevenue || 1247).toLocaleString()}`}
                      </Text>
                    </VStack>
                  </SimpleGrid>
                </Box>

                <Box p={{ base: 3, md: 4 }} bg={statBg} borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <HStack justify="space-between" align="center" mb={3}>
                    <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color={textColor}>
                      📈 Performance Trends
                    </Text>
                    <Badge colorScheme="green" variant="subtle" fontSize="2xs">Updated</Badge>
                  </HStack>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" color={textColor} fontWeight="medium">vs Yesterday</Text>
                      <HStack spacing={1}>
                        <TriangleUpIcon color="green.500" boxSize={3} />
                        <Text fontSize="sm" fontWeight="bold" color="green.600">+12%</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" color={textColor} fontWeight="medium">vs Last Week</Text>
                      <HStack spacing={1}>
                        <TriangleUpIcon color="green.500" boxSize={3} />
                        <Text fontSize="sm" fontWeight="bold" color="green.600">+8%</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" color={textColor} fontWeight="medium">vs Last Month</Text>
                      <HStack spacing={1}>
                        <TriangleDownIcon color="red.500" boxSize={3} />
                        <Text fontSize="sm" fontWeight="bold" color="red.600">-3%</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Charts Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <ChartPlaceholder
              title="Daily Trip Statistics"
              description="Bar chart showing trips per day"
            />
            <ChartPlaceholder
              title="Trip Status Distribution"
              description="Pie chart showing trip status breakdown"
            />
          </SimpleGrid>

          {/* Trends Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <ChartPlaceholder
              title="Revenue Trend"
              description="Area chart showing revenue over time"
            />
            <ChartPlaceholder
              title="User Growth"
              description="Line chart showing user growth trend"
            />
          </SimpleGrid>

          {/* Real-time Status */}
          <Card>
            <CardHeader>
              <Heading size="md">Real-time System Status</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <VStack align="start" spacing={0}>
                    {loading ? (
                      <Skeleton height="20px" width="30px" />
                    ) : (
                      <Text fontWeight="bold">
                        {statistics.overview?.activeTrips || '0'}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.500">Active Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={CalendarIcon} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    {loading ? (
                      <Skeleton height="20px" width="30px" />
                    ) : (
                      <Text fontWeight="bold">
                        {statistics.overview?.completedTrips || '0'}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.500">Completed Today</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <VStack align="start" spacing={0}>
                    {loading ? (
                      <Skeleton height="20px" width="30px" />
                    ) : (
                      <Text fontWeight="bold">
                        {statistics.overview?.cancelledTrips || '0'}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.500">Cancelled Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={FaCar} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    {loading ? (
                      <Skeleton height="20px" width="30px" />
                    ) : (
                      <Text fontWeight="bold">
                        {statistics.overview?.totalDrivers || '0'}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.500">Total Drivers</Text>
                  </VStack>
                </HStack>
              </SimpleGrid>
            </CardBody>
          </Card>

            {/* Header with Controls */}
            <Fade in={true}>
              <Card bg={cardBg} borderColor={borderColor} shadow="sm">
                <CardBody>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color={textColor}>
                        System Statistics Dashboard
                      </Heading>
                      <Text fontSize="sm" color="gray.500">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </Text>
                    </VStack>
                    
                    <HStack spacing={4} wrap="wrap">
                      <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        width="200px"
                        size="sm"
                      >
                        <option value="24hours">Last 24 Hours</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="1year">Last Year</option>
                      </Select>
                      
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <Button
                          colorScheme={viewMode === 'overview' ? 'blue' : 'gray'}
                          onClick={() => setViewMode('overview')}
                        >
                          Overview
                        </Button>
                        <Button
                          colorScheme={viewMode === 'detailed' ? 'blue' : 'gray'}
                          onClick={() => setViewMode('detailed')}
                        >
                          Detailed
                        </Button>
                        <Button
                          colorScheme={viewMode === 'realtime' ? 'blue' : 'gray'}
                          onClick={() => setViewMode('realtime')}
                        >
                          Real-time
                        </Button>
                      </ButtonGroup>
                      
                      <ButtonGroup size="sm">
                        <Button
                          leftIcon={<RepeatIcon />}
                          onClick={handleRefresh}
                          isLoading={refreshing}
                          loadingText="Refreshing"
                        >
                          Refresh
                        </Button>
                        <Button
                          leftIcon={<DownloadIcon />}
                          onClick={handleExport}
                          variant="outline"
                        >
                          Export
                        </Button>
                      </ButtonGroup>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            </Fade>

            {/* Key Metrics Overview */}
            <Card bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Heading size="md" color={textColor}>Key Performance Indicators</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={metricColumns} spacing={6}>
                  <StatCard
                    title="Total Trips"
                    value={loading ? '' : statistics.overview?.totalTrips?.toLocaleString()}
                    subtitle="+12% from last period"
                    icon={FaRoute}
                    color="blue.500"
                    trend={12}
                    isLoading={loading}
                  />
                  <StatCard
                    title="Active Users"
                    value={loading ? '' : statistics.overview?.totalUsers}
                    subtitle="+8% from last period"
                    icon={FaUser}
                    color="green.500"
                    trend={8}
                    isLoading={loading}
                  />
                  <StatCard
                    title="Revenue"
                    value={loading ? '' : `$${statistics.overview?.revenue?.toLocaleString()}`}
                    subtitle="+15% from last period"
                    icon={FaDollarSign}
                    color="purple.500"
                    trend={15}
                    isLoading={loading}
                  />
                  <StatCard
                    title="Fleet Size"
                    value={loading ? '' : `${statistics.overview?.totalVehicles} vehicles`}
                    subtitle="+2 new vehicles"
                    icon={FaCar}
                    color="orange.500"
                    trend={2}
                    isLoading={loading}
                  />
                  <StatCard
                    title="Efficiency"
                    value={loading ? '' : `${statistics.overview?.efficiency}%`}
                    subtitle="+2.1% improvement"
                    icon={FaChartLine}
                    color="teal.500"
                    trend={2.1}
                    isLoading={loading}
                  />
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Environmental Impact */}
            <Card bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Heading size="md" color={textColor}>Environmental Impact</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <HStack>
                    <Icon as={FaLeaf} color="green.500" boxSize={6} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {loading ? '-' : `${statistics.overview?.fuelSaved} L`}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Fuel Saved</Text>
                    </VStack>
                  </HStack>
                  <HStack>
                    <Icon as={FaMapMarkerAlt} color="blue.500" boxSize={6} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        {loading ? '-' : `${statistics.overview?.totalDistance?.toLocaleString()} km`}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Distance Traveled</Text>
                    </VStack>
                  </HStack>
                  <HStack>
                    <Icon as={FaLeaf} color="teal.500" boxSize={6} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                        {loading ? '-' : `${statistics.overview?.co2Reduced} kg`}
                      </Text>
                      <Text fontSize="sm" color="gray.500">CO₂ Reduced</Text>
                    </VStack>
                  </HStack>
                </SimpleGrid>
              </CardBody>
            </Card>



            {/* Charts and Additional Data */}
            <SimpleGrid columns={chartColumns} spacing={6}>
              <ChartPlaceholder
                title="Daily Trip Statistics"
                description="Interactive bar chart showing trips, revenue, and completion rates per day"
                isLoading={loading}
              />
              <VStack spacing={6}>
                <AlertsCard />
                <HourlyTrafficCard />
              </VStack>
            </SimpleGrid>

            {/* Weekly Performance Breakdown */}
            <Card bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Heading size="md" color={textColor}>Weekly Performance Breakdown</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Day</Th>
                        <Th isNumeric>Total Trips</Th>
                        <Th isNumeric>Completed</Th>
                        <Th isNumeric>Cancelled</Th>
                        <Th isNumeric>Revenue</Th>
                        <Th>Success Rate</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {statistics.trends?.tripsByDay?.map((day, index) => (
                        <Tr key={index}>
                          <Td fontWeight="bold">{day.day}</Td>
                          <Td isNumeric>{day.trips}</Td>
                          <Td isNumeric color="green.500">{day.completed}</Td>
                          <Td isNumeric color="red.500">{day.cancelled}</Td>
                          <Td isNumeric fontWeight="bold">${day.revenue}</Td>
                          <Td>
                            <Progress
                              value={(day.completed / day.trips) * 100}
                              size="sm"
                              colorScheme="green"
                              width="60px"
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Scroll to Top Button */}
            <Box position="fixed" bottom="20px" right="20px" zIndex={10}>
              <Button
                colorScheme="blue"
                size="sm"
                borderRadius="full"
                onClick={scrollToTop}
                leftIcon={<ArrowUpIcon />}
                shadow="lg"
              >
                Top
              </Button>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminStatistics;