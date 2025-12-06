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
import UnifiedTripManagement from '../shared/UnifiedTripManagement';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isManageView, setIsManageView] = useState(false);
  const [trips, setTrips] = useState([]);
  
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

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data?.data?.trips || response.data?.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  }, []);

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

  // Quick Stat Card Component - Compact & Modern
  const QuickStatCard = ({ title, value, subtitle, icon, color, trend, onClick, isClickable = true }) => (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.2s"
      _hover={isClickable ? { 
        shadow: 'lg', 
        transform: 'translateY(-2px)',
        borderColor: `${color}.400`
      } : {}}
      cursor={isClickable ? 'pointer' : 'default'}
      onClick={isClickable ? onClick : undefined}
      height="100%"
    >
      <CardBody p={{ base: 3, md: 4 }}>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Box
              p={2}
              borderRadius="md"
              bg={`${color}.50`}
              color={`${color}.600`}
            >
              <Icon as={icon} boxSize={{ base: 4, md: 5 }} />
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
                  fontWeight="bold"
                >
                  {trend.value}%
                </Text>
              </HStack>
            )}
          </HStack>
          <VStack align="start" spacing={0}>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={headingColor} lineHeight="1.2">
              {value}
            </Text>
            <Text fontSize="xs" color={textColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="xs" color={textColor} mt={1}>
                {subtitle}
              </Text>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Navigation Card Component - Enhanced Design
  const NavigationCard = ({ title, description, icon, color, path, count, onClick }) => (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{
        shadow: 'xl',
        transform: 'translateY(-4px)',
        borderColor: `${color}.500`,
        bg: `${color}.50`
      }}
      cursor="pointer"
      onClick={onClick || (() => navigate(path))}
      height="100%"
    >
      <CardBody p={{ base: 4, md: 5 }}>
        <VStack align="start" spacing={3} height="100%">
          <HStack justify="space-between" w="full">
            <Box
              p={3}
              borderRadius="lg"
              bg={`${color}.50`}
              color={`${color}.600`}
              transition="all 0.3s"
              _groupHover={{ bg: `${color}.100` }}
            >
              <Icon as={icon} boxSize={{ base: 5, md: 6 }} />
            </Box>
            {count !== undefined && (
              <Badge 
                colorScheme={color} 
                fontSize={{ base: 'sm', md: 'md' }} 
                px={3} 
                py={1} 
                borderRadius="full"
                fontWeight="bold"
              >
                {count}
              </Badge>
            )}
          </HStack>
          <VStack align="start" spacing={1} w="full" flex="1">
            <Heading size={{ base: 'sm', md: 'md' }} color={headingColor}>
              {title}
            </Heading>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color={textColor} lineHeight="1.4">
              {description}
            </Text>
          </VStack>
          <HStack w="full" justify="space-between" pt={2} borderTop="1px" borderColor={borderColor}>
            <Text fontSize="xs" color={`${color}.600`} fontWeight="semibold">
              View Details
            </Text>
            <Icon as={ExternalLinkIcon} color={`${color}.500`} boxSize={4} />
          </HStack>
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
      <Box flex="1" w="100%" overflowX="hidden">
        {/* Conditional rendering for different views */}
        {isManageView ? (
          <Box px={{ base: 3, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
            <UnifiedTripManagement onTripUpdate={fetchTrips} initialTrips={trips} />
            <Button 
              mt={4} 
              onClick={() => setIsManageView(false)}
              leftIcon={<RepeatIcon />}
              variant="outline"
              colorScheme="blue"
            >
              Back to Admin Dashboard
            </Button>
          </Box>
        ) : (
          <Box p={{ base: 3, md: 4 }}>
            <VStack align="stretch" spacing={{ base: 4, md: 5 }}>
          {/* Header */}
          <Box>
            <HStack justify="space-between" mb={2} flexWrap="wrap" gap={3}>
              <VStack align="start" spacing={0}>
                <Heading size={{ base: 'lg', md: 'xl' }} color={headingColor}>
                  Admin Dashboard
                </Heading>
                <Text color={textColor} fontSize="sm">
                  System overview and management center • Last updated: {formatDateTime(lastRefresh)}
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
                  display={{ base: 'none', md: 'flex' }}
                >
                  Settings
                </Button>
                <IconButton
                  icon={<SettingsIcon />}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/settings')}
                  display={{ base: 'flex', md: 'none' }}
                  aria-label="Settings"
                />
              </HStack>
            </HStack>
          </Box>

          {/* Key Metrics - Compact Design */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
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
              subtitle={`${analytics?.userStats?.total || 0} total`}
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

          {/* Section Heading */}
          <Box>
            <Heading size="md" color={headingColor} mb={1}>
              Management Sections
            </Heading>
            <Text fontSize="sm" color={textColor}>
              Navigate to different areas of the admin panel
            </Text>
          </Box>

          {/* Main Navigation Grid - Enhanced */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={{ base: 3, md: 4 }}
          >
            <NavigationCard
              title="Trip Management"
              description="Create, schedule, edit, and manage all transportation trips"
              icon={FaRoute}
              color="purple"
              onClick={() => setIsManageView(true)}
              count={analytics?.tripStats?.total}
            />
            <NavigationCard
              title="Analytics Dashboard"
              description="Performance metrics, trends analysis, and data visualization"
              icon={FaChartLine}
              color="cyan"
              path="/admin/analytics"
            />
            <NavigationCard
              title="Reports Center"
              description="Generate detailed reports, export data, and access archives"
              icon={FaFileAlt}
              color="orange"
              path="/admin/reports"
            />
            <NavigationCard
              title="Statistical Analysis"
              description="Comprehensive stats, comparative data, and insights"
              icon={FaChartBar}
              color="teal"
              path="/admin/statistics"
            />
            <NavigationCard
              title="Live GPS Tracking"
              description="Real-time vehicle monitoring and trip progress tracking"
              icon={FaCarAlt}
              color="green"
              path="/admin/live-tracking"
              count={analytics?.tripStats?.inProgress}
            />
            <NavigationCard
              title="User Management"
              description="Manage users, assign roles, configure permissions and access"
              icon={FaUserShield}
              color="red"
              path="/system-admin"
              count={analytics?.userStats?.total}
            />
            <NavigationCard
              title="System Settings"
              description="Configure system preferences, security, and global settings"
              icon={SettingsIcon}
              color="gray"
              path="/admin/settings"
            />
          </Grid>

          {/* Bottom Row - Activity Feed & Quick Actions */}
          <Grid
            templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
            gap={{ base: 3, md: 4 }}
          >
            {/* Recent Activity Feed */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" shadow="sm">
              <CardHeader pb={3}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FaClock} color="blue.500" boxSize={5} />
                    <Heading size="md">Recent Activity</Heading>
                  </HStack>
                  <Badge colorScheme="blue" fontSize="xs">Live</Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={2} maxH="280px" overflowY="auto">
                  {analytics?.recentActivity?.slice(0, 6).map((activity, index) => (
                    <Box
                      key={index}
                      p={3}
                      bg={hoverBg}
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderLeftColor="blue.400"
                      transition="all 0.2s"
                      _hover={{ shadow: 'sm', borderLeftColor: 'blue.600' }}
                    >
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                            {activity.description || 'System Activity'}
                          </Text>
                          <Text fontSize="xs" color={textColor}>
                            {activity.userId ? 
                              `${activity.userId.firstName} ${activity.userId.lastName}` : 
                              'System'}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color={textColor} whiteSpace="nowrap" ml={2}>
                          {formatDateTime(activity.createdAt)}
                        </Text>
                      </HStack>
                    </Box>
                  )) || (
                    <Center py={10}>
                      <VStack spacing={2}>
                        <Icon as={FaClock} boxSize={8} color="gray.300" />
                        <Text fontSize="sm" color={textColor}>No recent activity</Text>
                      </VStack>
                    </Center>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Right Sidebar - Status & Actions */}
            <VStack spacing={{ base: 3, md: 4 }}>
              <SystemStatusCard />
              <QuickActionsCard />
            </VStack>
          </Grid>

          {/* Alert Banners */}
          <VStack spacing={2}>
            {analytics?.tripStats?.pending > 10 && (
              <Alert status="warning" borderRadius="xl" variant="left-accent">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="sm" fontWeight="bold">High Pending Trips</AlertTitle>
                  <AlertDescription fontSize="xs">
                    {analytics.tripStats.pending} trips are pending assignment and need immediate attention
                  </AlertDescription>
                </Box>
                <Button size="sm" colorScheme="orange" onClick={() => navigate('/dispatcher')}>
                  Review Now
                </Button>
              </Alert>
            )}
            
            {analytics?.tripStats?.inProgress > 15 && (
              <Alert status="info" borderRadius="xl" variant="left-accent">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="sm" fontWeight="bold">High Activity</AlertTitle>
                  <AlertDescription fontSize="xs">
                    {analytics.tripStats.inProgress} trips currently in progress across the system
                  </AlertDescription>
                </Box>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/live-tracking')}>
                  Track Live
                </Button>
              </Alert>
            )}
          </VStack>
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
