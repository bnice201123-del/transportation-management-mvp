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
  Spinner,
  Center,
  useToast,
  VStack,
  HStack,
  Badge,
  Button,
  IconButton,
  Flex,
  useColorModeValue,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  useBreakpointValue,
  Icon,
  Divider
} from '@chakra-ui/react';
import {
  RepeatIcon,
  ExternalLinkIcon,
  SettingsIcon,
  ViewIcon
} from '@chakra-ui/icons';
import {
  FaRoute,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaTachometerAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCarAlt,
  FaUserShield,
  FaCalendarCheck,
  FaArrowUp,
  FaArrowDown,
  FaFileAlt,
  FaChartPie,
  FaChartBar
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const toast = useToast();
  const navigate = useNavigate();
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardSpacing = useBreakpointValue({ base: 3, md: 4 });

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (showLoading) setRefreshing(true);
    try {
      const response = await axios.get('/api/analytics/dashboard');
      setAnalytics(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAnalytics(false);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAnalytics]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick Stat Card Component
  const QuickStatCard = ({ title, value, subtitle, icon, color, trend, onClick, isClickable = true }) => (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.2s"
      _hover={isClickable ? { 
        shadow: 'md', 
        transform: 'translateY(-2px)',
        borderColor: `${color}.400`
      } : {}}
      cursor={isClickable ? 'pointer' : 'default'}
      onClick={isClickable ? onClick : undefined}
    >
      <CardBody p={4}>
        <HStack justify="space-between" mb={3}>
          <Box
            p={3}
            borderRadius="lg"
            bg={`${color}.50`}
            color={`${color}.600`}
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          {trend && (
            <HStack spacing={1}>
              <Icon
                as={trend.direction === 'up' ? FaArrowUp : FaArrowDown}
                color={trend.direction === 'up' ? 'green.500' : 'red.500'}
                boxSize={3}
              />
              <Text
                fontSize="xs"
                color={trend.direction === 'up' ? 'green.500' : 'red.500'}
                fontWeight="semibold"
              >
                {trend.value}%
              </Text>
            </HStack>
          )}
        </HStack>
        <VStack align="start" spacing={1}>
          <Text fontSize="3xl" fontWeight="bold" color={headingColor}>
            {value}
          </Text>
          <Text fontSize="sm" color={textColor} fontWeight="medium">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="xs" color={textColor}>
              {subtitle}
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  // Navigation Card Component
  const NavigationCard = ({ title, description, icon, color, path, count }) => (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-4px)',
        borderColor: `${color}.400`
      }}
      cursor="pointer"
      onClick={() => navigate(path)}
    >
      <CardBody p={5}>
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Box
              p={3}
              borderRadius="lg"
              bg={`${color}.50`}
              color={`${color}.600`}
            >
              <Icon as={icon} boxSize={6} />
            </Box>
            {count !== undefined && (
              <Badge colorScheme={color} fontSize="md" px={3} py={1} borderRadius="full">
                {count}
              </Badge>
            )}
          </HStack>
          <VStack align="start" spacing={1} w="full">
            <HStack justify="space-between" w="full">
              <Heading size="md" color={headingColor}>
                {title}
              </Heading>
              <Icon as={ExternalLinkIcon} color={textColor} boxSize={4} />
            </HStack>
            <Text fontSize="sm" color={textColor}>
              {description}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // System Status Card
  const SystemStatusCard = () => (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack>
            <Icon as={FaTachometerAlt} color="green.500" boxSize={5} />
            <Heading size="md">System Status</Heading>
          </HStack>
          <Badge colorScheme="green" px={3} py={1} borderRadius="full">
            Operational
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Text fontSize="sm" color={textColor}>Active Trips</Text>
            <Text fontSize="sm" fontWeight="bold" color="blue.500">
              {analytics?.tripStats?.inProgress || 0}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={textColor}>Active Drivers</Text>
            <Text fontSize="sm" fontWeight="bold" color="green.500">
              {analytics?.driverStats?.active || 0}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color={textColor}>Pending Trips</Text>
            <Text fontSize="sm" fontWeight="bold" color="orange.500">
              {analytics?.tripStats?.pending || 0}
            </Text>
          </HStack>
          <Divider />
          <HStack justify="space-between">
            <Text fontSize="xs" color={textColor}>Last Updated</Text>
            <Text fontSize="xs" color={textColor}>
              {formatDateTime(lastRefresh)}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Quick Actions Card
  const QuickActionsCard = () => (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
      <CardHeader pb={2}>
        <HStack>
          <Icon as={FaTachometerAlt} color="purple.500" boxSize={5} />
          <Heading size="md">Quick Actions</Heading>
        </HStack>
      </CardHeader>
      <CardBody pt={2}>
        <VStack spacing={2}>
          <Button
            w="full"
            leftIcon={<Icon as={FaUsers} />}
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/register')}
          >
            Add New User
          </Button>
          <Button
            w="full"
            leftIcon={<Icon as={FaRoute} />}
            colorScheme="green"
            variant="outline"
            size="sm"
            onClick={() => navigate('/scheduler')}
          >
            Schedule Trip
          </Button>
          <Button
            w="full"
            leftIcon={<Icon as={FaFileAlt} />}
            colorScheme="orange"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/reports')}
          >
            Generate Report
          </Button>
          <Button
            w="full"
            leftIcon={<Icon as={SettingsIcon} />}
            colorScheme="gray"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/settings')}
          >
            System Settings
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Center flex="1">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={textColor}>Loading dashboard...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <Box>
            <HStack justify="space-between" mb={3} flexWrap="wrap" gap={3}>
              <VStack align="start" spacing={1}>
                <Heading size={{ base: 'lg', md: 'xl' }} color={headingColor}>
                  Admin Dashboard
                </Heading>
                <Text color={textColor} fontSize="sm">
                  Centralized system management and oversight
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Tooltip label="Refresh Data">
                  <IconButton
                    icon={<RepeatIcon />}
                    onClick={() => fetchAnalytics(true)}
                    isLoading={refreshing}
                    colorScheme="blue"
                    variant="outline"
                    size={{ base: 'sm', md: 'md' }}
                    aria-label="Refresh data"
                  />
                </Tooltip>
                <Button
                  leftIcon={<Icon as={SettingsIcon} />}
                  variant="outline"
                  size={{ base: 'sm', md: 'md' }}
                  onClick={() => navigate('/admin/settings')}
                >
                  Settings
                </Button>
              </HStack>
            </HStack>
            <Divider />
          </Box>

          {/* Key Metrics - Top Row */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={cardSpacing}>
            <QuickStatCard
              title="Total Trips"
              value={analytics?.tripStats?.total || 0}
              subtitle={`${analytics?.tripStats?.today || 0} today`}
              icon={FaRoute}
              color="blue"
              trend={{ direction: 'up', value: 12 }}
              onClick={() => navigate('/scheduler')}
            />
            <QuickStatCard
              title="Active Users"
              value={analytics?.userStats?.active || 0}
              subtitle={`${analytics?.userStats?.total || 0} total users`}
              icon={FaUsers}
              color="green"
              trend={{ direction: 'up', value: 8 }}
              onClick={() => navigate('/admin/overview')}
            />
            <QuickStatCard
              title="Success Rate"
              value={`${analytics?.tripStats?.total > 0 ?
                Math.round((analytics.tripStats.completed / analytics.tripStats.total) * 100) : 0}%`}
              subtitle={`${analytics?.tripStats?.completed || 0} completed`}
              icon={FaCheckCircle}
              color="purple"
              trend={{ direction: 'up', value: 5 }}
              onClick={() => navigate('/admin/analytics')}
            />
            <QuickStatCard
              title="Revenue"
              value={`$${(analytics?.financialStats?.totalRevenue || 0).toLocaleString()}`}
              subtitle="This month"
              icon={FaMoneyBillWave}
              color="orange"
              trend={{ direction: 'up', value: 15 }}
              onClick={() => navigate('/admin/reports')}
            />
          </SimpleGrid>

          {/* Main Navigation Grid */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={cardSpacing}
          >
            <NavigationCard
              title="Overview"
              description="System overview, user distribution, and key insights"
              icon={ViewIcon}
              color="blue"
              path="/admin/overview"
              count={analytics?.tripStats?.today}
            />
            <NavigationCard
              title="Analytics"
              description="Deep dive into performance metrics and trends"
              icon={FaChartLine}
              color="purple"
              path="/admin/analytics"
            />
            <NavigationCard
              title="Reports"
              description="Generate and export detailed system reports"
              icon={FaFileAlt}
              color="orange"
              path="/admin/reports"
            />
            <NavigationCard
              title="Statistics"
              description="Comprehensive statistical analysis and insights"
              icon={FaChartBar}
              color="teal"
              path="/admin/statistics"
            />
            <NavigationCard
              title="Live Tracking"
              description="Real-time vehicle and trip monitoring"
              icon={FaCarAlt}
              color="green"
              path="/admin/live-tracking"
              count={analytics?.tripStats?.inProgress}
            />
            <NavigationCard
              title="User Management"
              description="Manage users, roles, and permissions"
              icon={FaUserShield}
              color="red"
              path="/system-admin"
              count={analytics?.userStats?.total}
            />
          </Grid>

          {/* Bottom Row - System Status & Quick Actions */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: '2fr 1fr' }}
            gap={cardSpacing}
          >
            {/* Recent Activity / Alerts would go here */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={FaClock} color="blue.500" boxSize={5} />
                  <Heading size="md">Recent Activity</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <VStack align="stretch" spacing={2} maxH="250px" overflowY="auto">
                  {analytics?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <Box
                      key={index}
                      p={3}
                      bg={hoverBg}
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderLeftColor="blue.400"
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="semibold">
                            {activity.description || 'System Activity'}
                          </Text>
                          <Text fontSize="xs" color={textColor}>
                            {activity.userId ? 
                              `${activity.userId.firstName} ${activity.userId.lastName}` : 
                              'System'}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color={textColor}>
                          {formatDateTime(activity.createdAt)}
                        </Text>
                      </HStack>
                    </Box>
                  )) || (
                    <Center py={8}>
                      <Text fontSize="sm" color={textColor}>No recent activity</Text>
                    </Center>
                  )}
                </VStack>
              </CardBody>
            </Card>

            <VStack spacing={cardSpacing}>
              <SystemStatusCard />
              <QuickActionsCard />
            </VStack>
          </Grid>

          {/* Alerts Section */}
          {analytics?.tripStats?.pending > 10 && (
            <Alert status="warning" borderRadius="xl">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">High Pending Trips</AlertTitle>
                <AlertDescription fontSize="xs">
                  You have {analytics.tripStats.pending} pending trips that need attention
                </AlertDescription>
              </Box>
              <Button size="sm" variant="outline" onClick={() => navigate('/dispatcher')}>
                Review
              </Button>
            </Alert>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
