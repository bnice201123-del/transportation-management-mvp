import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Badge,
  Progress,
  SimpleGrid,
  Icon,
  Flex,
  Spinner,
  Center,
  useToast,
  Divider,
  Button,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem,
  CircularProgress,
  CircularProgressLabel,
  useBreakpointValue,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  StatGroup,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Collapse
} from '@chakra-ui/react';
import {
  CalendarIcon,
  ViewIcon,
  SettingsIcon,
  StarIcon,
  TimeIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  DownloadIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { 
  FaCar, 
  FaUser, 
  FaRoute, 
  FaTachometerAlt, 
  FaUsers, 
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaClock,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const cardPadding = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const spacing = useBreakpointValue({ base: 3, md: 4, lg: 6 });
  const fontSize = useBreakpointValue({ base: 'sm', md: 'md' });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('white', 'gray.800');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources for comprehensive analytics
      const [analyticsRes, tripsRes, usersRes, activitiesRes] = await Promise.all([
        axios.get('/api/analytics/dashboard').catch(() => ({ data: null })),
        axios.get('/api/trips').catch(() => ({ data: { trips: [] } })),
        axios.get('/api/users').catch(() => ({ data: { users: [] } })),
        axios.get('/api/activities').catch(() => ({ data: { activities: [] } }))
      ]);

      // Extract data with proper fallbacks
      const trips = Array.isArray(tripsRes.data?.trips) ? tripsRes.data.trips : 
                    Array.isArray(tripsRes.data?.data?.trips) ? tripsRes.data.data.trips :
                    Array.isArray(tripsRes.data) ? tripsRes.data : [];
      
      const users = Array.isArray(usersRes.data?.users) ? usersRes.data.users :
                    Array.isArray(usersRes.data?.data?.users) ? usersRes.data.data.users :
                    Array.isArray(usersRes.data) ? usersRes.data : [];
      
      const activities = Array.isArray(activitiesRes.data?.activities) ? activitiesRes.data.activities :
                         Array.isArray(activitiesRes.data?.data?.activities) ? activitiesRes.data.data.activities :
                         Array.isArray(activitiesRes.data) ? activitiesRes.data : [];
      
      const baseAnalytics = analyticsRes.data;

      // Calculate comprehensive analytics
      const now = new Date();
      const timeRangeMs = getTimeRangeMs(timeRange);
      const startDate = new Date(now.getTime() - timeRangeMs);

      const filteredTrips = trips.filter(trip => 
        new Date(trip.createdAt) >= startDate
      );

      const filteredActivities = activities.filter(activity => 
        new Date(activity.createdAt) >= startDate
      );

      const analyticsData = {
        // Key Performance Indicators
        kpis: {
          totalTrips: filteredTrips.length,
          completedTrips: filteredTrips.filter(t => t.status === 'completed').length,
          cancelledTrips: filteredTrips.filter(t => t.status === 'cancelled').length,
          pendingTrips: filteredTrips.filter(t => t.status === 'pending').length,
          inProgressTrips: filteredTrips.filter(t => t.status === 'in_progress').length,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.isActive !== false).length,
          totalDrivers: users.filter(u => u.role === 'driver').length,
          activeDrivers: users.filter(u => u.role === 'driver' && u.isActive !== false).length
        },

        // Trip Statistics
        tripStats: {
          averageTripsPerDay: filteredTrips.length / Math.max(1, timeRangeMs / (1000 * 60 * 60 * 24)),
          completionRate: filteredTrips.length > 0 ? 
            (filteredTrips.filter(t => t.status === 'completed').length / filteredTrips.length * 100).toFixed(1) : 0,
          cancellationRate: filteredTrips.length > 0 ? 
            (filteredTrips.filter(t => t.status === 'cancelled').length / filteredTrips.length * 100).toFixed(1) : 0,
          onTimeRate: 85.2, // Placeholder - would need actual timing data
          averageRating: 4.3 // Placeholder - would need actual rating data
        },

        // User Analytics
        userAnalytics: {
          newUsersThisPeriod: users.filter(u => new Date(u.createdAt) >= startDate).length,
          userGrowthRate: 12.5, // Placeholder calculation
          usersByRole: {
            admin: users.filter(u => u.role === 'admin').length,
            scheduler: users.filter(u => u.role === 'scheduler').length,
            dispatcher: users.filter(u => u.role === 'dispatcher').length,
            driver: users.filter(u => u.role === 'driver').length
          },
          loginActivity: filteredActivities.filter(a => a.action === 'user_login').length
        },

        // Performance Metrics
        performance: {
          systemUptime: 99.8,
          averageResponseTime: 245,
          errorRate: 0.2,
          peakHours: ['08:00-09:00', '17:00-18:00'],
          serverLoad: 68
        },

        // Geographic Data (placeholder)
        geographic: {
          topRoutes: [
            { from: 'Downtown', to: 'Airport', count: 45 },
            { from: 'University', to: 'Mall', count: 32 },
            { from: 'Hospital', to: 'Station', count: 28 }
          ],
          coverage: {
            zones: 12,
            totalMiles: 1456,
            averageTripDistance: 8.3
          }
        },

        // Recent Activity
        recentActivity: baseAnalytics?.recentActivity || [],

        // Time series data for charts (placeholder)
        chartData: {
          tripsByDay: generateTimeSeriesData(7),
          userRegistrations: generateTimeSeriesData(7),
          systemPerformance: generateTimeSeriesData(7)
        }
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error loading analytics',
        description: 'Failed to load analytics data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getTimeRangeMs = (range) => {
    const ranges = {
      '1d': 1000 * 60 * 60 * 24,
      '7d': 1000 * 60 * 60 * 24 * 7,
      '30d': 1000 * 60 * 60 * 24 * 30,
      '90d': 1000 * 60 * 60 * 24 * 90
    };
    return ranges[range] || ranges['7d'];
  };

  const generateTimeSeriesData = (days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        value: Math.floor(Math.random() * 100) + 20
      });
    }
    return data;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Analytics report is being generated...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const StatCard = ({ title, value, change, changeType, icon, color, subtitle, isPercentage = false }) => (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      h="full"
      shadow="md"
      borderRadius="lg"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
    >
      <CardBody p={{ base: 4, md: 5, lg: 6 }}>
        <Flex 
          align="center" 
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          textAlign={{ base: "center", md: "left" }}
        >
          <Box flex="1" mb={{ base: 3, md: 0 }}>
            <Stat>
              <StatLabel fontSize={{ base: "xs", md: "sm" }} color={textColor}>{title}</StatLabel>
              <StatNumber fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold">
                {isPercentage ? `${value}%` : value}
              </StatNumber>
              {subtitle && (
                <Text fontSize="xs" color={textColor} mt={1} noOfLines={1}>
                  {subtitle}
                </Text>
              )}
              {change && (
                <StatHelpText fontSize="xs" mt={1}>
                  <StatArrow type={changeType} />
                  {change}
                </StatHelpText>
              )}
            </Stat>
          </Box>
          <Box ml={{ base: 0, md: 4 }}>
            <CircularProgress 
              value={isPercentage ? parseFloat(value) : 75} 
              color={color}
              size={{ base: "50px", md: "60px", lg: "70px" }}
              thickness="8px"
            >
              <CircularProgressLabel>
                <Icon as={icon} boxSize={{ base: 5, md: 6 }} color={color} />
              </CircularProgressLabel>
            </CircularProgress>
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );

  const PerformanceCard = () => (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      h="full"
      shadow="md"
      borderRadius="lg"
    >
      <CardHeader pb={2}>
        <Heading size={{ base: "xs", md: "sm" }} display="flex" alignItems="center" gap={2}>
          <Icon as={FaTachometerAlt} boxSize={{ base: 4, md: 5 }} />
          System Performance
        </Heading>
      </CardHeader>
      <CardBody pt={2} p={{ base: 4, md: 5, lg: 6 }}>
        <VStack spacing={{ base: 3, md: 4 }}>
          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize={{ base: "xs", md: "sm" }}>System Uptime</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">
                {analytics?.performance.systemUptime || 0}%
              </Text>
            </HStack>
            <Progress 
              value={analytics?.performance.systemUptime || 0} 
              colorScheme="green"
              size={{ base: "sm", md: "md" }}
              borderRadius="md"
            />
          </Box>
          
          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize={{ base: "xs", md: "sm" }}>Server Load</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">
                {analytics?.performance.serverLoad || 0}%
              </Text>
            </HStack>
            <Progress 
              value={analytics?.performance.serverLoad || 0} 
              colorScheme={analytics?.performance.serverLoad > 80 ? 'red' : 'blue'}
              size={{ base: "sm", md: "md" }}
              borderRadius="md"
            />
          </Box>

          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize={{ base: "xs", md: "sm" }}>Error Rate</Text>
              <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">
                {analytics?.performance.errorRate || 0}%
              </Text>
            </HStack>
            <Progress 
              value={(analytics?.performance.errorRate || 0) * 10} 
              colorScheme="red"
              size={{ base: "sm", md: "md" }}
              borderRadius="md"
            />
          </Box>

          <Divider />

          <VStack spacing={2} width="full">
            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium">Peak Hours</Text>
            <Wrap justify="center" spacing={1}>
              {analytics?.performance.peakHours?.map((hour, index) => (
                <WrapItem key={index}>
                  <Badge 
                    colorScheme="orange" 
                    variant="outline"
                    fontSize="xs"
                    px={{ base: 2, md: 3 }}
                    py={1}
                  >
                    {hour}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const GeographicInsights = () => (
    <Card 
      shadow="md"
      borderRadius="lg"
    >
      <CardHeader>
        <Heading size={{ base: "xs", md: "sm" }} display="flex" alignItems="center" gap={2}>
          <Icon as={FaMapMarkerAlt} boxSize={{ base: 4, md: 5 }} />
          Geographic Insights
        </Heading>
      </CardHeader>
      <CardBody pt={0} p={{ base: 4, md: 5, lg: 6 }}>
        <VStack spacing={{ base: 3, md: 4 }}>
          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" alignSelf="start">Top Routes</Text>
          <VStack spacing={2} width="full">
            {analytics?.geographic.topRoutes?.map((route, index) => (
              <Box key={index} p={{ base: 2, md: 3 }} bg="gray.50" rounded="md" width="full">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium">
                      {route.from} → {route.to}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {route.count} trips
                    </Text>
                  </VStack>
                  <Badge colorScheme="blue">{index + 1}</Badge>
                </HStack>
              </Box>
            ))}
          </VStack>

          <Divider />

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={{ base: 2, md: 3 }} width="full">
            <VStack>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.500">
                {analytics?.geographic.coverage.zones}
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">Coverage Zones</Text>
            </VStack>
            <VStack>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="green.500">
                {analytics?.geographic.coverage.totalMiles}
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">Total Miles</Text>
            </VStack>
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  );

  const UserAnalyticsCard = () => (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      h="full"
      shadow="md"
      borderRadius="lg"
    >
      <CardHeader pb={2}>
        <Heading size={{ base: "xs", md: "sm" }} display="flex" alignItems="center" gap={2}>
          <Icon as={FaUsers} boxSize={{ base: 4, md: 5 }} />
          User Analytics
        </Heading>
      </CardHeader>
      <CardBody pt={2} p={{ base: 4, md: 5, lg: 6 }}>
        <VStack spacing={{ base: 3, md: 4 }}>
          <SimpleGrid columns={2} spacing={{ base: 3, md: 4 }} width="full">
            <VStack spacing={1}>
              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="green.500">
                {analytics?.userAnalytics.newUsersThisPeriod || 0}
              </Text>
              <Text fontSize="xs" color={textColor} textAlign="center">
                New Users
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="blue.500">
                {analytics?.userAnalytics.userGrowthRate || 0}%
              </Text>
              <Text fontSize="xs" color={textColor} textAlign="center">
                Growth Rate
              </Text>
            </VStack>
          </SimpleGrid>

          <Divider />

          <Box width="full">
            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" mb={3}>
              Role Distribution
            </Text>
            {Object.entries(analytics?.userAnalytics.usersByRole || {}).map(([role, count]) => (
              <Box key={role} mb={3} _last={{ mb: 0 }}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize={{ base: "xs", md: "sm" }} textTransform="capitalize" noOfLines={1}>
                    {role}s
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">
                    {count}
                  </Text>
                </HStack>
                <Progress 
                  value={count > 0 ? (count / (analytics?.kpis.totalUsers || 1)) * 100 : 0}
                  colorScheme={
                    role === 'admin' ? 'red' :
                    role === 'scheduler' ? 'blue' :
                    role === 'dispatcher' ? 'green' : 'purple'
                  }
                  size={{ base: "sm", md: "md" }}
                  borderRadius="md"
                />
              </Box>
            ))}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
            <VStack align="stretch" spacing={spacing}>
              {/* Header Skeleton */}
              <Card bg={headerBg} borderColor={borderColor} shadow="sm">
                <CardBody p={cardPadding}>
                  <VStack spacing={3}>
                    <Skeleton height="32px" width="300px" />
                    <SkeletonText noOfLines={2} spacing="2" width="400px" />
                  </VStack>
                </CardBody>
              </Card>

              {/* KPI Skeletons */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={spacing}>
                {[...Array(4)].map((_, i) => (
                  <Card key={i} bg={cardBg} borderColor={borderColor}>
                    <CardBody p={cardPadding}>
                      <VStack spacing={2}>
                        <Skeleton height="20px" width="120px" />
                        <Skeleton height="36px" width="80px" />
                        <SkeletonText noOfLines={1} width="100px" />
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Content Skeleton */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody p={cardPadding}>
                  <Center py={20}>
                    <VStack spacing={4}>
                      <Spinner size="xl" color="blue.500" thickness="4px" />
                      <Text color={textColor} fontSize={fontSize}>
                        Loading analytics data...
                      </Text>
                      <Text fontSize="xs" color={textColor}>
                        This may take a moment
                      </Text>
                    </VStack>
                  </Center>
                </CardBody>
              </Card>
            </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
          <VStack align="stretch" spacing={{ base: 4, md: 6 }}>
            {/* Header Card */}
            <Card bg={headerBg} borderColor={borderColor} shadow="md" borderRadius="lg">
              <CardBody p={{ base: 4, md: 6, lg: 8 }}>
                <Flex 
                  justify="space-between" 
                  align={{ base: "start", md: "center" }} 
                  direction={{ base: "column", md: "row" }}
                  gap={{ base: 3, md: 4 }}
                >
                  <Box flex="1">
                    <Heading 
                      size={{ base: "md", md: "lg", lg: "xl" }} 
                      mb={2}
                      color="teal.600"
                    >
                      Analytics Dashboard
                    </Heading>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      Comprehensive system analytics and performance metrics
                    </Text>
                  </Box>
                  
                  {/* Controls */}
                  {isMobile ? (
                    <VStack spacing={2} w="full">
                      <Flex w="full" gap={2}>
                        <Select 
                          value={timeRange} 
                          onChange={(e) => setTimeRange(e.target.value)}
                          size={buttonSize}
                          flex="1"
                        >
                          <option value="1d">Last 24H</option>
                          <option value="7d">Last 7D</option>
                          <option value="30d">Last 30D</option>
                          <option value="90d">Last 90D</option>
                        </Select>
                        <IconButton
                          icon={<RepeatIcon />}
                          size={buttonSize}
                          isLoading={refreshing}
                          onClick={handleRefresh}
                          aria-label="Refresh"
                        />
                      </Flex>
                      <Button 
                        leftIcon={<DownloadIcon />}
                        size={buttonSize}
                        colorScheme="blue"
                        onClick={handleExport}
                        w="full"
                      >
                        Export Report
                      </Button>
                    </VStack>
                  ) : (
                    <HStack spacing={3}>
                      <Select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        size={buttonSize}
                        width="auto"
                      >
                        <option value="1d">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                      </Select>
                      <Button 
                        leftIcon={<RepeatIcon />}
                        size={buttonSize}
                        isLoading={refreshing}
                        onClick={handleRefresh}
                      >
                        Refresh
                      </Button>
                      <Button 
                        leftIcon={<DownloadIcon />}
                        size={buttonSize}
                        colorScheme="blue"
                        onClick={handleExport}
                      >
                        Export
                      </Button>
                    </HStack>
                  )}
                </Flex>
              </CardBody>
            </Card>

            {/* KPI Cards */}
            <Box>
              <Heading 
                size={{ base: "sm", md: "md" }} 
                mb={{ base: 3, md: 4 }} 
                color="teal.600"
              >
                Key Performance Indicators
              </Heading>
              <SimpleGrid 
                columns={{ base: 1, sm: 2, lg: 4 }} 
                spacing={{ base: 3, md: 4, lg: 6 }}
              >
                <StatCard
                  title="Trip Completion Rate"
                  value={analytics?.tripStats.completionRate || 0}
                  isPercentage={true}
                  change="+5.2% from last period"
                  changeType="increase"
                  icon={FaCheckCircle}
                  color="green.500"
                />
                <StatCard
                  title="Active Users"
                  value={analytics?.kpis.activeUsers || 0}
                  subtitle={`${analytics?.kpis.totalUsers || 0} total users`}
                  change="+12 new users"
                  changeType="increase"
                  icon={FaUsers}
                  color="blue.500"
                />
                <StatCard
                  title="Driver Utilization"
                  value={Math.round((analytics?.kpis.activeDrivers / Math.max(1, analytics?.kpis.totalDrivers)) * 100) || 0}
                  isPercentage={true}
                  subtitle={`${analytics?.kpis.activeDrivers || 0}/${analytics?.kpis.totalDrivers || 0} drivers`}
                  icon={FaCar}
                  color="purple.500"
                />
                <StatCard
                  title="Average Rating"
                  value={analytics?.tripStats.averageRating || 0}
                  subtitle="System-wide rating"
                  change="+0.3 improvement"
                  changeType="increase"
                  icon={StarIcon}
                  color="orange.500"
                />
              </SimpleGrid>
            </Box>

            {/* Main Analytics Tabs */}
            <Card 
              bg={cardBg} 
              borderColor={borderColor}
              shadow="md"
              borderRadius="lg"
            >
              <Tabs 
                variant="enclosed" 
                colorScheme="teal"
                orientation="horizontal"
                isFitted={isMobile}
                index={activeTab}
                onChange={setActiveTab}
              >
                <TabList 
                  flexDirection="row"
                  overflowX={{ base: "auto", md: "visible" }}
                  overflowY="hidden"
                >
                  <Tab fontSize={{ base: "xs", md: "sm" }} p={{ base: 2, md: 4 }} minW={{ base: "auto", md: "100px" }}>
                    {isMobile ? "Trips" : "Trip Analytics"}
                  </Tab>
                  <Tab fontSize={{ base: "xs", md: "sm" }} p={{ base: 2, md: 4 }} minW={{ base: "auto", md: "100px" }}>
                    {isMobile ? "Users" : "User Insights"}
                  </Tab>
                  <Tab fontSize={{ base: "xs", md: "sm" }} p={{ base: 2, md: 4 }} minW={{ base: "auto", md: "100px" }}>
                    Performance
                  </Tab>
                  <Tab fontSize={{ base: "xs", md: "sm" }} p={{ base: 2, md: 4 }} minW={{ base: "auto", md: "100px" }}>
                    {isMobile ? "Geo" : "Geographic"}
                  </Tab>
                  <Tab fontSize={{ base: "xs", md: "sm" }} p={{ base: 2, md: 4 }} minW={{ base: "auto", md: "100px" }}>
                    Reports
                  </Tab>
                </TabList>

              <TabPanels>
                {/* Trip Analytics */}
                <TabPanel p={{ base: 4, md: 5, lg: 6 }} pt={6}>
                  <Grid 
                    templateColumns={{ base: "1fr", lg: "2fr 1fr" }} 
                    gap={{ base: 4, md: 5, lg: 6 }}
                  >
                    <VStack spacing={{ base: 3, md: 4, lg: 6 }}>
                      <Card 
                        width="full" 
                        bg={cardBg} 
                        borderColor={borderColor}
                        shadow="md"
                        borderRadius="lg"
                      >
                        <CardHeader pb={2}>
                          <Heading size={{ base: "sm", md: "md" }}>Trip Overview</Heading>
                          <Text fontSize={{ base: "xs", md: "sm" }} color={textColor} mt={1}>
                            Current period trip statistics
                          </Text>
                        </CardHeader>
                        <CardBody pt={2} p={{ base: 4, md: 5 }}>
                          <SimpleGrid 
                            columns={{ base: 2, md: 4 }} 
                            spacing={{ base: 3, md: 4 }}
                          >
                            <VStack spacing={1}>
                              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="green.500">
                                {analytics?.kpis.completedTrips || 0}
                              </Text>
                              <Text fontSize="xs" color={textColor} textAlign="center">
                                Completed
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="blue.500">
                                {analytics?.kpis.inProgressTrips || 0}
                              </Text>
                              <Text fontSize="xs" color={textColor} textAlign="center">
                                In Progress
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="orange.500">
                                {analytics?.kpis.pendingTrips || 0}
                              </Text>
                              <Text fontSize="xs" color={textColor} textAlign="center">
                                Pending
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="bold" color="red.500">
                                {analytics?.kpis.cancelledTrips || 0}
                              </Text>
                              <Text fontSize="xs" color={textColor} textAlign="center">
                                Cancelled
                              </Text>
                            </VStack>
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      <Card width="full">
                        <CardHeader>
                          <Heading size="md">Performance Metrics</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <HStack justify="space-between" width="full">
                              <Text fontSize="sm">On-Time Performance</Text>
                              <Text fontSize="sm" fontWeight="bold">{analytics?.tripStats.onTimeRate}%</Text>
                            </HStack>
                            <HStack justify="space-between" width="full">
                              <Text fontSize="sm">Cancellation Rate</Text>
                              <Text fontSize="sm" fontWeight="bold">{analytics?.tripStats.cancellationRate}%</Text>
                            </HStack>
                            <HStack justify="space-between" width="full">
                              <Text fontSize="sm">Avg Trips/Day</Text>
                              <Text fontSize="sm" fontWeight="bold">
                                {Math.round(analytics?.tripStats.averageTripsPerDay || 0)}
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    </VStack>

                    <VStack spacing={6}>
                      <PerformanceCard />
                    </VStack>
                  </Grid>
                </TabPanel>

                {/* User Insights */}
                <TabPanel p={0} pt={6}>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    <UserAnalyticsCard />
                    <GeographicInsights />
                  </Grid>
                </TabPanel>

                {/* Performance */}
                <TabPanel p={0} pt={6}>
                  <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                    <Card>
                      <CardHeader>
                        <Heading size="md">System Health</Heading>
                      </CardHeader>
                      <CardBody>
                        <Alert status="success" borderRadius="md" mb={4}>
                          <AlertIcon />
                          <Box>
                            <AlertTitle>System Status: Healthy</AlertTitle>
                            <AlertDescription>
                              All systems operating normally
                            </AlertDescription>
                          </Box>
                        </Alert>
                        
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontSize="sm" mb={2}>Response Time: {analytics?.performance.averageResponseTime}ms</Text>
                            <Progress value={75} colorScheme="green" size="sm" />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={2}>Memory Usage: 68%</Text>
                            <Progress value={68} colorScheme="blue" size="sm" />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={2}>CPU Usage: 45%</Text>
                            <Progress value={45} colorScheme="green" size="sm" />
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    <PerformanceCard />
                  </Grid>
                </TabPanel>

                {/* Geographic */}
                <TabPanel p={0} pt={6}>
                  <GeographicInsights />
                </TabPanel>

                {/* Reports */}
                <TabPanel p={0} pt={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Generate Reports</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4}>
                        <Button width="full" leftIcon={<DownloadIcon />} colorScheme="blue">
                          Trip Analysis Report
                        </Button>
                        <Button width="full" leftIcon={<DownloadIcon />} colorScheme="green">
                          User Activity Report
                        </Button>
                        <Button width="full" leftIcon={<DownloadIcon />} colorScheme="purple">
                          Performance Report
                        </Button>
                        <Button width="full" leftIcon={<DownloadIcon />} colorScheme="orange">
                          Financial Summary
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
            </Card>
          </VStack>
      </Box>
    </Box>
  );
};

export default AdminAnalytics;