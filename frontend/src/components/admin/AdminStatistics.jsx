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

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7days');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, realtime
  const [statistics, setStatistics] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const scrollRef = useRef(null);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Responsive values
  const cardColumns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 });
  const metricColumns = useBreakpointValue({ base: 2, md: 3, lg: 5 });
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

  const fetchStatistics = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Replace with actual API calls
      // const response = await axios.get(`/analytics/statistics?range=${timeRange}`);
      // setStatistics(response.data);
      
      // Using mock data for now with realistic delay
      await new Promise(resolve => setTimeout(resolve, showRefresh ? 800 : 1500));
      
      setStatistics(mockStatistics);
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
      toast({
        title: 'Error loading statistics',
        description: 'Failed to load statistics data',
        status: 'error',
        duration: 5000,
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
    toast({
      title: 'Export started',
      description: 'Statistics report will be downloaded shortly',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
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

  const MetricCard = ({ title, value, unit, progress, color, isLoading }) => (
    <Fade in={!isLoading}>
      <Card 
        bg={cardBg}
        borderColor={borderColor}
        shadow="sm"
        _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
        transition="all 0.2s"
      >
        <CardBody p={5}>
          <VStack align="center" spacing={4}>
            {isLoading ? (
              <Skeleton boxSize="60px" borderRadius="full" />
            ) : (
              <CircularProgress 
                value={progress} 
                color={color} 
                size="60px"
                thickness="8px"
              >
                <CircularProgressLabel fontSize="xs" fontWeight="bold">
                  {progress}%
                </CircularProgressLabel>
              </CircularProgress>
            )}
            <VStack spacing={1}>
              {isLoading ? (
                <SkeletonText noOfLines={2} spacing="2" skeletonHeight="2" />
              ) : (
                <>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    {value}{unit}
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {title}
                  </Text>
                </>
              )}
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Fade>
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

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <Heading size="md">Performance Metrics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
                <MetricCard
                  title="Avg Trip Duration"
                  value={statistics.performance?.avgTripDuration}
                  unit=" min"
                  progress={75}
                  color="blue.400"
                />
                <MetricCard
                  title="Avg Wait Time"
                  value={statistics.performance?.avgWaitTime}
                  unit=" min"
                  progress={65}
                  color="orange.400"
                />
                <MetricCard
                  title="Customer Rating"
                  value={statistics.performance?.customerSatisfaction}
                  unit="/5"
                  progress={92}
                  color="green.400"
                />
                <MetricCard
                  title="Fuel Efficiency"
                  value={statistics.performance?.fuelEfficiency}
                  unit=" mpg"
                  progress={80}
                  color="teal.400"
                />
                <MetricCard
                  title="On-Time Rate"
                  value={statistics.performance?.onTimePercentage}
                  unit="%"
                  progress={statistics.performance?.onTimePercentage}
                  color="purple.400"
                />
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
                    <Text fontWeight="bold">{statistics.overview?.activeTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Active Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={CalendarIcon} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.completedTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Completed Today</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.cancelledTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Cancelled Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={FaCar} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.totalVehicles}</Text>
                    <Text fontSize="sm" color="gray.500">Total Vehicles</Text>
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

            {/* Performance Metrics */}
            <Card bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Heading size="md" color={textColor}>Performance Metrics</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={metricColumns} spacing={6}>
                  <MetricCard
                    title="Avg Trip Duration"
                    value={loading ? '' : statistics.performance?.avgTripDuration}
                    unit=" min"
                    progress={75}
                    color="blue.400"
                    isLoading={loading}
                  />
                  <MetricCard
                    title="Avg Wait Time"
                    value={loading ? '' : statistics.performance?.avgWaitTime}
                    unit=" min"
                    progress={65}
                    color="orange.400"
                    isLoading={loading}
                  />
                  <MetricCard
                    title="Customer Rating"
                    value={loading ? '' : statistics.performance?.customerSatisfaction}
                    unit="/5"
                    progress={92}
                    color="green.400"
                    isLoading={loading}
                  />
                  <MetricCard
                    title="On-Time Rate"
                    value={loading ? '' : statistics.performance?.onTimePercentage}
                    unit="%"
                    progress={loading ? 0 : statistics.performance?.onTimePercentage}
                    color="purple.400"
                    isLoading={loading}
                  />
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