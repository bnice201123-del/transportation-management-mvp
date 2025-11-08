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
  TableContainer
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

  // Check authorization
  if (!user || !['admin', 'dispatcher'].includes(user.role)) {
    return (
      <Box>
        <Navbar />
        <Container maxW="7xl" py={6}>
          <Alert status="error">
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

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Responsive values
  const cardColumns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 });
  const metricColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 5 });
  const chartColumns = useBreakpointValue({ base: 1, lg: 2 });

  // Enhanced mock data with more comprehensive statistics
  const mockStatistics = {
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
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

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
  }, [viewMode, timeRange]);

  const fetchStatistics = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(`/analytics/statistics?range=${timeRange}`);
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
      setLastUpdated(new Date());
      
      toast({
        title: 'Using offline data',
        description: 'Connected to local data while server is unavailable',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  const StatCard = ({ title, value, subtitle, icon, color, trend, isLoading }) => (
    <ScaleFade initialScale={0.9} in={!isLoading}>
      <Card 
        bg={cardBg} 
        borderColor={borderColor}
        shadow="md"
        _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
        transition="all 0.2s"
      >
        <CardBody p={5}>
          <Stat>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1} flex={1}>
                <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
                  {title}
                </StatLabel>
                {isLoading ? (
                  <Skeleton height="32px" width="80px" />
                ) : (
                  <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                    {value}
                  </StatNumber>
                )}
                {subtitle && !isLoading && (
                  <StatHelpText mb={0} fontSize="sm">
                    <HStack spacing={1}>
                      {trend && (
                        <Icon 
                          as={trend > 0 ? TriangleUpIcon : TriangleDownIcon} 
                          color={trend > 0 ? 'green.500' : 'red.500'}
                          boxSize={3}
                        />
                      )}
                      <Text color={trend > 0 ? 'green.500' : 'red.500'}>
                        {subtitle}
                      </Text>
                    </HStack>
                  </StatHelpText>
                )}
              </VStack>
              <Box>
                {isLoading ? (
                  <Skeleton boxSize={8} borderRadius="md" />
                ) : (
                  <Tooltip label={title} placement="top">
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg={`${color.split('.')[0]}.50`}
                    >
                      <Icon as={icon} boxSize={6} color={color} />
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
    <Box bg={bgColor}>
      <Navbar />
      
      {/* Scrollable Container */}
      <Box 
        ref={scrollRef}
        maxH="calc(100vh - 80px)" 
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
        <Container maxW="7xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="gray.700">
              System Statistics
            </Heading>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              width="200px"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </Select>
          </Flex>

          {/* Key Metrics Overview */}
          <Card>
            <CardHeader>
              <Heading size="md">Key Metrics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
                <StatCard
                  title="Total Trips"
                  value={statistics.overview?.totalTrips?.toLocaleString()}
                  subtitle="+12% from last period"
                  icon={FaRoute}
                  color="blue.500"
                  trend={12}
                />
                <StatCard
                  title="Active Users"
                  value={statistics.overview?.totalUsers}
                  subtitle="+8% from last period"
                  icon={FaUser}
                  color="green.500"
                  trend={8}
                />
                <StatCard
                  title="Revenue"
                  value={`$${statistics.overview?.revenue?.toLocaleString()}`}
                  subtitle="+15% from last period"
                  icon={FaDollarSign}
                  color="purple.500"
                  trend={15}
                />
                <StatCard
                  title="Active Drivers"
                  value={statistics.overview?.totalDrivers}
                  subtitle="+3% from last period"
                  icon={FaCar}
                  color="orange.500"
                  trend={3}
                />
                <StatCard
                  title="Efficiency"
                  value={`${statistics.overview?.efficiency}%`}
                  subtitle="+2.1% from last period"
                  icon={FaChartLine}
                  color="teal.500"
                  trend={2.1}
                />
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Performance Metrics - Optimized Layout */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Heading size="md" color={textColor}>Performance Dashboard</Heading>
                  <Text fontSize="xs" color="gray.500">Real-time operational metrics</Text>
                </VStack>
                <HStack spacing={2}>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    leftIcon={<RepeatIcon />}
                    onClick={handleRefresh}
                    isLoading={refreshing}
                    loadingText="Refreshing"
                  >
                    Refresh
                  </Button>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    leftIcon={<DownloadIcon />}
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>

            <CardBody pt={2}>
              {/* Compact Metrics Grid */}
              <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mb={4}>
                <Box p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" fontWeight="medium" color="blue.600">Trip Duration</Text>
                      <HStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="blue.700">
                          {loading ? '-' : (statistics.performance?.avgTripDuration || '25')}
                        </Text>
                        <Text fontSize="xs" color="blue.500">min</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="blue.400" />
                    ) : (
                      <CircularProgress value={75} color="blue.400" size="32px" thickness="6px">
                        <CircularProgressLabel fontSize="2xs" fontWeight="medium" color="blue.600">
                          75%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                  </HStack>
                </Box>

                <Box p={3} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" fontWeight="medium" color="orange.600">Wait Time</Text>
                      <HStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="orange.700">
                          {loading ? '-' : (statistics.performance?.avgWaitTime || '8')}
                        </Text>
                        <Text fontSize="xs" color="orange.500">min</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="orange.400" />
                    ) : (
                      <CircularProgress value={65} color="orange.400" size="32px" thickness="6px">
                        <CircularProgressLabel fontSize="2xs" fontWeight="medium" color="orange.600">
                          65%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                  </HStack>
                </Box>

                <Box p={3} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" fontWeight="medium" color="green.600">Rating</Text>
                      <HStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="green.700">
                          {loading ? '-' : (statistics.performance?.customerSatisfaction || '4.8')}
                        </Text>
                        <Text fontSize="xs" color="green.500">/5</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="green.400" />
                    ) : (
                      <CircularProgress value={92} color="green.400" size="32px" thickness="6px">
                        <CircularProgressLabel fontSize="2xs" fontWeight="medium" color="green.600">
                          92%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                  </HStack>
                </Box>

                <Box p={3} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" fontWeight="medium" color="purple.600">On-Time</Text>
                      <HStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="purple.700">
                          {loading ? '-' : (statistics.performance?.onTimePercentage || '88')}
                        </Text>
                        <Text fontSize="xs" color="purple.500">%</Text>
                      </HStack>
                    </VStack>
                    {loading ? (
                      <Spinner size="sm" color="purple.400" />
                    ) : (
                      <CircularProgress 
                        value={statistics.performance?.onTimePercentage || 88} 
                        color="purple.400" 
                        size="32px" 
                        thickness="6px"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="medium" color="purple.600">
                          {statistics.performance?.onTimePercentage || 88}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    )}
                  </HStack>
                </Box>
              </SimpleGrid>

              {/* Quick Stats Row */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={2}>Today's Activity</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    <HStack spacing={1}>
                      <Icon as={FaCar} color="blue.500" boxSize={3} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textColor}>Active</Text>
                        <Text fontSize="sm" fontWeight="bold" color="blue.600">
                          {loading ? '-' : (statistics.overview?.activeTrips || '12')}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <HStack spacing={1}>
                      <Icon as={FaUser} color="green.500" boxSize={3} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textColor}>Drivers</Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          {loading ? '-' : (statistics.overview?.activeDrivers || '18')}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <HStack spacing={1}>
                      <Icon as={FaRoute} color="orange.500" boxSize={3} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textColor}>Avg Dist</Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.600">
                          {loading ? '-' : `${(statistics.performance?.avgDistance || 12.5)}mi`}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <HStack spacing={1}>
                      <Icon as={FaDollarSign} color="purple.500" boxSize={3} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textColor}>Revenue</Text>
                        <Text fontSize="sm" fontWeight="bold" color="purple.600">
                          {loading ? '-' : `$${(statistics.financial?.totalRevenue || 1247).toLocaleString()}`}
                        </Text>
                      </VStack>
                    </HStack>
                  </SimpleGrid>
                </Box>

                <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={2}>Performance Trends</Text>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color={textColor}>vs Yesterday</Text>
                      <HStack spacing={1}>
                        <TriangleUpIcon color="green.500" boxSize={2} />
                        <Text fontSize="xs" fontWeight="bold" color="green.600">+12%</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="xs" color={textColor}>vs Last Week</Text>
                      <HStack spacing={1}>
                        <TriangleUpIcon color="green.500" boxSize={2} />
                        <Text fontSize="xs" fontWeight="bold" color="green.600">+8%</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="xs" color={textColor}>vs Last Month</Text>
                      <HStack spacing={1}>
                        <TriangleDownIcon color="red.500" boxSize={2} />
                        <Text fontSize="xs" fontWeight="bold" color="red.600">-3%</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </Grid>
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
                    <Text fontWeight="bold">
                      {loading ? <Skeleton height="20px" width="30px" /> : (statistics.overview?.activeTrips || '0')}
                    </Text>
                    <Text fontSize="sm" color="gray.500">Active Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={CalendarIcon} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      {loading ? <Skeleton height="20px" width="30px" /> : (statistics.overview?.completedTrips || '0')}
                    </Text>
                    <Text fontSize="sm" color="gray.500">Completed Today</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      {loading ? <Skeleton height="20px" width="30px" /> : (statistics.overview?.cancelledTrips || '0')}
                    </Text>
                    <Text fontSize="sm" color="gray.500">Cancelled Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={FaCar} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      {loading ? <Skeleton height="20px" width="30px" /> : (statistics.overview?.totalDrivers || '0')}
                    </Text>
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