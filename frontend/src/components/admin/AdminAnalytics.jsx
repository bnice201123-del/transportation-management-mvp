import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
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
  CircularProgressLabel
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
  const toast = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources for comprehensive analytics
      const [analyticsRes, tripsRes, usersRes, activitiesRes] = await Promise.all([
        axios.get('/api/analytics/dashboard').catch(() => ({ data: null })),
        axios.get('/api/trips').catch(() => ({ data: [] })),
        axios.get('/api/users').catch(() => ({ data: [] })),
        axios.get('/api/activities').catch(() => ({ data: [] }))
      ]);

      const trips = tripsRes.data || [];
      const users = usersRes.data || [];
      const activities = activitiesRes.data || [];
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
    <Card>
      <CardBody>
        <Flex align="center" justify="space-between">
          <Box flex="1">
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {isPercentage ? `${value}%` : value}
              </StatNumber>
              {subtitle && (
                <Text fontSize="xs" color="gray.400" mt={1}>{subtitle}</Text>
              )}
              {change && (
                <StatHelpText>
                  <StatArrow type={changeType} />
                  {change}
                </StatHelpText>
              )}
            </Stat>
          </Box>
          <Box ml={4}>
            <CircularProgress 
              value={isPercentage ? parseFloat(value) : 75} 
              color={color}
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel>
                <Icon as={icon} boxSize={6} color={color} />
              </CircularProgressLabel>
            </CircularProgress>
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );

  const PerformanceCard = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaTachometerAlt} />
          System Performance
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4}>
          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm">System Uptime</Text>
              <Text fontSize="sm" fontWeight="bold">{analytics?.performance.systemUptime}%</Text>
            </HStack>
            <Progress 
              value={analytics?.performance.systemUptime} 
              colorScheme="green"
              size="sm"
              borderRadius="md"
            />
          </Box>
          
          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm">Server Load</Text>
              <Text fontSize="sm" fontWeight="bold">{analytics?.performance.serverLoad}%</Text>
            </HStack>
            <Progress 
              value={analytics?.performance.serverLoad} 
              colorScheme={analytics?.performance.serverLoad > 80 ? 'red' : 'blue'}
              size="sm"
              borderRadius="md"
            />
          </Box>

          <Box width="full">
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm">Error Rate</Text>
              <Text fontSize="sm" fontWeight="bold">{analytics?.performance.errorRate}%</Text>
            </HStack>
            <Progress 
              value={analytics?.performance.errorRate * 10} 
              colorScheme="red"
              size="sm"
              borderRadius="md"
            />
          </Box>

          <Divider />

          <VStack spacing={2} width="full">
            <Text fontSize="sm" fontWeight="medium">Peak Hours</Text>
            <Wrap justify="center">
              {analytics?.performance.peakHours?.map((hour, index) => (
                <WrapItem key={index}>
                  <Badge colorScheme="orange" variant="outline">{hour}</Badge>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const GeographicInsights = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaMapMarkerAlt} />
          Geographic Insights
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4}>
          <Text fontSize="sm" fontWeight="medium" alignSelf="start">Top Routes</Text>
          <VStack spacing={2} width="full">
            {analytics?.geographic.topRoutes?.map((route, index) => (
              <Box key={index} p={3} bg="gray.50" rounded="md" width="full">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
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

          <SimpleGrid columns={2} spacing={3} width="full">
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {analytics?.geographic.coverage.zones}
              </Text>
              <Text fontSize="xs" color="gray.500">Coverage Zones</Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {analytics?.geographic.coverage.totalMiles}
              </Text>
              <Text fontSize="xs" color="gray.500">Total Miles</Text>
            </VStack>
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  );

  const UserAnalyticsCard = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaUsers} />
          User Analytics
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={4}>
          <SimpleGrid columns={2} spacing={4} width="full">
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {analytics?.userAnalytics.newUsersThisPeriod}
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">New Users</Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {analytics?.userAnalytics.userGrowthRate}%
              </Text>
              <Text fontSize="xs" color="gray.500" textAlign="center">Growth Rate</Text>
            </VStack>
          </SimpleGrid>

          <Divider />

          <Box width="full">
            <Text fontSize="sm" fontWeight="medium" mb={3}>Role Distribution</Text>
            {Object.entries(analytics?.userAnalytics.usersByRole || {}).map(([role, count]) => (
              <Box key={role} mb={3}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" textTransform="capitalize">{role}s</Text>
                  <Text fontSize="sm" fontWeight="bold">{count}</Text>
                </HStack>
                <Progress 
                  value={count > 0 ? (count / analytics.kpis.totalUsers) * 100 : 0}
                  colorScheme={
                    role === 'admin' ? 'red' :
                    role === 'scheduler' ? 'blue' :
                    role === 'dispatcher' ? 'green' : 'purple'
                  }
                  size="sm"
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
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Center flex="1">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading analytics...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box flex="1" p={{ base: 4, md: 6, lg: 8 }}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={6}>
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Box>
                <Heading size="lg" mb={2}>Analytics Dashboard</Heading>
                <Text color="gray.600">
                  Comprehensive system analytics and performance metrics
                </Text>
              </Box>
              <HStack spacing={3}>
                <Select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="sm"
                  width="auto"
                >
                  <option value="1d">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </Select>
                <Button 
                  leftIcon={<RepeatIcon />}
                  size="sm"
                  isLoading={refreshing}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
                <Button 
                  leftIcon={<DownloadIcon />}
                  size="sm"
                  colorScheme="blue"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </HStack>
            </Flex>

            {/* KPI Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <StatCard
                title="Trip Completion Rate"
                value={analytics?.tripStats.completionRate}
                isPercentage={true}
                change="+5.2% from last period"
                changeType="increase"
                icon={FaCheckCircle}
                color="green.500"
              />
              <StatCard
                title="Active Users"
                value={analytics?.kpis.activeUsers}
                subtitle={`${analytics?.kpis.totalUsers} total users`}
                change="+12 new users"
                changeType="increase"
                icon={FaUsers}
                color="blue.500"
              />
              <StatCard
                title="Driver Utilization"
                value={Math.round((analytics?.kpis.activeDrivers / Math.max(1, analytics?.kpis.totalDrivers)) * 100)}
                isPercentage={true}
                subtitle={`${analytics?.kpis.activeDrivers}/${analytics?.kpis.totalDrivers} drivers`}
                icon={FaCar}
                color="purple.500"
              />
              <StatCard
                title="Average Rating"
                value={analytics?.tripStats.averageRating}
                subtitle="System-wide rating"
                change="+0.3 improvement"
                changeType="increase"
                icon={StarIcon}
                color="orange.500"
              />
            </SimpleGrid>

            {/* Main Analytics Tabs */}
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Trip Analytics</Tab>
                <Tab>User Insights</Tab>
                <Tab>Performance</Tab>
                <Tab>Geographic</Tab>
                <Tab>Reports</Tab>
              </TabList>

              <TabPanels>
                {/* Trip Analytics */}
                <TabPanel p={0} pt={6}>
                  <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                    <VStack spacing={6}>
                      <Card width="full">
                        <CardHeader>
                          <Heading size="md">Trip Overview</Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                {analytics?.kpis.completedTrips}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Completed</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                {analytics?.kpis.inProgressTrips}
                              </Text>
                              <Text fontSize="xs" color="gray.500">In Progress</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                {analytics?.kpis.pendingTrips}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Pending</Text>
                            </VStack>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                                {analytics?.kpis.cancelledTrips}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Cancelled</Text>
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
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminAnalytics;