import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Grid,
  SimpleGrid,
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Button,
  Spinner,
  Center,
  Icon,
  Badge,
  Flex,
  useToast,
  Avatar,
  AvatarGroup,
  Divider,
  Stack,
  Wrap,
  WrapItem,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  CircularProgress,
  CircularProgressLabel,
  Tag,
  TagLabel,
  TagLeftIcon,
  useBreakpointValue,
  Tooltip,
  Image,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { 
  ViewIcon, 
  SearchIcon, 
  SettingsIcon, 
  TimeIcon,
  StarIcon,
  ChevronDownIcon,
  AddIcon,
  RepeatIcon,
  ExternalLinkIcon
} from '@chakra-ui/icons';
import { 
  FaUsers, 
  FaRoute, 
  FaCar, 
  FaUser,
  FaTachometerAlt,
  FaChartLine,
  FaMapMarkedAlt,
  FaClipboardList,
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaDownload,
  FaEye,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUserPlus,
  FaFileExport,
  FaFilter,
  FaCalendarAlt,
  FaLocationArrow,
  FaPhoneAlt,
  FaEnvelope,
  FaShieldAlt,
  FaDollarSign,
  FaTruck,
  FaGasPump
} from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';

const AdminOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterView, setFilterView] = useState('all'); // 'all', 'active', 'pending', 'completed'
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Responsive values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const progressBg = useColorModeValue('gray.100', 'gray.600');
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  
  const columnsCount = useBreakpointValue({ base: 1, sm: 2, md: 2, lg: 4 });
  const cardSpacing = useBreakpointValue({ base: 3, md: 4 });
  const containerPadding = useBreakpointValue({ base: 3, md: 4 });

  const fetchOverviewData = useCallback(async () => {
    if (!loading) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [usersRes, tripsRes, analyticsRes, healthRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/trips'),
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/health')
      ]);

      const users = Array.isArray(usersRes.data.users) ? usersRes.data.users : [];
      const trips = Array.isArray(tripsRes.data.trips) ? tripsRes.data.trips : [];
      const analytics = analyticsRes.data || {};

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overviewMetrics = {
        totalUsers: users.length || 0,
        activeUsers: users.filter(u => {
          if (!u || !u.lastActive) return false;
          try {
            const lastActive = new Date(u.lastActive);
            const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceActive <= 7;
          } catch {
            return false;
          }
        }).length || 0,
        totalTrips: trips.length || 0,
        todayTrips: trips.filter(t => {
          if (!t || !t.createdAt) return false;
          try {
            const tripDate = new Date(t.createdAt);
            tripDate.setHours(0, 0, 0, 0);
            return tripDate.getTime() === today.getTime();
          } catch {
            return false;
          }
        }).length || 0,
        activeDrivers: users.filter(u => u && u.role === 'driver' && u.isActive !== false).length || 0,
        totalDrivers: users.filter(u => u && u.role === 'driver').length || 0,
        pendingTrips: trips.filter(t => t && t.status === 'pending').length || 0,
        completedTrips: trips.filter(t => t && t.status === 'completed').length || 0,
        cancelledTrips: trips.filter(t => t && t.status === 'cancelled').length || 0,
        inProgressTrips: trips.filter(t => t && t.status === 'in-progress').length || 0,
        recentActivity: (analytics?.recentActivity && Array.isArray(analytics.recentActivity)) 
          ? analytics.recentActivity.slice(0, 8) 
          : [],
        usersByRole: {
          admin: users.filter(u => u && u.role === 'admin').length || 0,
          scheduler: users.filter(u => u && u.role === 'scheduler').length || 0,
          dispatcher: users.filter(u => u && u.role === 'dispatcher').length || 0,
          driver: users.filter(u => u && u.role === 'driver').length || 0,
          rider: users.filter(u => u && u.role === 'rider').length || 0
        },
        recentUsers: users.slice(-5).reverse(),
        systemStats: {
          avgTripDuration: analytics?.avgTripDuration || 0,
          totalRevenue: analytics?.totalRevenue || 0,
          fuelEfficiency: analytics?.fuelEfficiency || 0,
          customerSatisfaction: analytics?.customerSatisfaction || 0
        }
      };

      setOverviewData(overviewMetrics);
      setSystemHealth(healthRes.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError(error.message || 'Failed to load overview data');
      
      // Set fallback data to prevent crashes
      setOverviewData({
        totalUsers: 0,
        activeUsers: 0,
        totalTrips: 0,
        todayTrips: 0,
        activeDrivers: 0,
        totalDrivers: 0,
        pendingTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        inProgressTrips: 0,
        recentActivity: [],
        usersByRole: {
          admin: 0,
          scheduler: 0,
          dispatcher: 0,
          driver: 0,
          rider: 0
        },
        recentUsers: [],
        systemStats: {
          avgTripDuration: 0,
          totalRevenue: 0,
          fuelEfficiency: 0,
          customerSatisfaction: 0
        }
      });
      
      setSystemHealth({ 
        status: 'Error', 
        message: 'System health check unavailable',
        uptime: '0h 0m',
        memory: 0,
        cpu: 0
      });

      toast({
        title: 'Error loading overview',
        description: 'Using fallback data. Please check your connection.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, loading]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Export Data Function
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = {
        overview: {
          totalUsers: overviewData?.totalUsers || 0,
          activeUsers: overviewData?.activeUsers || 0,
          totalTrips: overviewData?.totalTrips || 0,
          todayTrips: overviewData?.todayTrips || 0,
          activeDrivers: overviewData?.activeDrivers || 0,
          pendingTrips: overviewData?.pendingTrips || 0,
          completedTrips: overviewData?.completedTrips || 0,
          cancelledTrips: overviewData?.cancelledTrips || 0,
          inProgressTrips: overviewData?.inProgressTrips || 0
        },
        usersByRole: overviewData?.usersByRole || {},
        systemStats: overviewData?.systemStats || {},
        systemHealth: systemHealth || {},
        exportDate: new Date().toISOString(),
        exportedBy: 'Admin'
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-overview-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also create CSV format
      const csvData = [
        ['Metric', 'Value'],
        ['Total Users', overviewData?.totalUsers || 0],
        ['Active Users', overviewData?.activeUsers || 0],
        ['Total Trips', overviewData?.totalTrips || 0],
        ['Today Trips', overviewData?.todayTrips || 0],
        ['Active Drivers', overviewData?.activeDrivers || 0],
        ['Pending Trips', overviewData?.pendingTrips || 0],
        ['Completed Trips', overviewData?.completedTrips || 0],
        ['Cancelled Trips', overviewData?.cancelledTrips || 0],
        ['In Progress Trips', overviewData?.inProgressTrips || 0],
        ['', ''],
        ['Users by Role', ''],
        ['Admin', overviewData?.usersByRole?.admin || 0],
        ['Scheduler', overviewData?.usersByRole?.scheduler || 0],
        ['Dispatcher', overviewData?.usersByRole?.dispatcher || 0],
        ['Driver', overviewData?.usersByRole?.driver || 0],
        ['Rider', overviewData?.usersByRole?.rider || 0]
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement('a');
      csvLink.href = csvUrl;
      csvLink.download = `admin-overview-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);
      URL.revokeObjectURL(csvUrl);

      toast({
        title: 'Export Successful',
        description: 'Data exported as JSON and CSV files',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter View Function
  const handleFilterView = (filter) => {
    setFilterView(filter);
    toast({
      title: 'Filter Applied',
      description: `Now showing ${filter} view`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Get filtered data based on current filter
  const getFilteredData = () => {
    if (!overviewData) return null;

    switch (filterView) {
      case 'active':
        return {
          ...overviewData,
          displayTrips: overviewData.inProgressTrips,
          displayLabel: 'Active Trips'
        };
      case 'pending':
        return {
          ...overviewData,
          displayTrips: overviewData.pendingTrips,
          displayLabel: 'Pending Trips'
        };
      case 'completed':
        return {
          ...overviewData,
          displayTrips: overviewData.completedTrips,
          displayLabel: 'Completed Trips'
        };
      default:
        return {
          ...overviewData,
          displayTrips: overviewData.totalTrips,
          displayLabel: 'All Trips'
        };
    }
  };

  const filteredData = getFilteredData();

  // Enhanced Stat Card Component - Compact Design
  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    trend, 
    trendValue, 
    onClick,
    isClickable = false,
    loading: cardLoading = false
  }) => {
    const colorScheme = {
      blue: { bg: 'blue.500', light: 'blue.50', dark: 'blue.900' },
      green: { bg: 'green.500', light: 'green.50', dark: 'green.900' },
      purple: { bg: 'purple.500', light: 'purple.50', dark: 'purple.900' },
      orange: { bg: 'orange.500', light: 'orange.50', dark: 'orange.900' },
      teal: { bg: 'teal.500', light: 'teal.50', dark: 'teal.900' },
      yellow: { bg: 'yellow.500', light: 'yellow.50', dark: 'yellow.900' },
      red: { bg: 'red.500', light: 'red.50', dark: 'red.900' }
    };

    const colors = colorScheme[color] || colorScheme.blue;

    return (
      <Card 
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        shadow="sm"
        height="100%"
        _hover={isClickable ? { 
          shadow: 'xl', 
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease'
        } : {}}
        transition="all 0.3s ease"
        cursor={isClickable ? 'pointer' : 'default'}
        onClick={onClick}
      >
        <CardBody p={{ base: 3, md: 4 }}>
          {cardLoading ? (
            <VStack spacing={2} align="stretch">
              <Skeleton height="20px" />
              <Skeleton height="32px" />
              <Skeleton height="16px" />
            </VStack>
          ) : (
            <HStack spacing={3} justify="space-between">
              <VStack align="start" spacing={1} flex="1">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {title}
                </Text>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={headingColor}>
                  {value}
                </Text>
                {subtitle && (
                  <Text fontSize="xs" color={textColor}>
                    {subtitle}
                  </Text>
                )}
                {trend && trendValue && (
                  <HStack spacing={1}>
                    <Icon 
                      as={trend === 'up' ? FaArrowUp : FaArrowDown} 
                      color={trend === 'up' ? 'green.500' : 'red.500'}
                      boxSize={3}
                    />
                    <Text fontSize="xs" color={trend === 'up' ? 'green.500' : 'red.500'} fontWeight="medium">
                      {trendValue}
                    </Text>
                  </HStack>
                )}
              </VStack>
              <Box
                p={3}
                borderRadius="lg"
                bg={useColorModeValue(colors.light, colors.dark)}
              >
                <Icon as={icon} boxSize={{ base: 6, md: 7 }} color={colors.bg} />
              </Box>
            </HStack>
          )}
        </CardBody>
      </Card>
    );
  };

  // Enhanced System Health Card
  const SystemHealthCard = () => {
    const healthStatus = systemHealth?.status || 'Unknown';
    const isHealthy = healthStatus === 'OK';
    
    return (
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
        <CardHeader pb={2}>
          <HStack justify="space-between">
            <Heading size="sm" display="flex" alignItems="center" gap={2}>
              <Icon as={FaTachometerAlt} color="blue.500" />
              System Health
            </Heading>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<RepeatIcon />}
              onClick={() => fetchOverviewData()}
              isLoading={refreshing}
              aria-label="Refresh system health"
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="stretch" spacing={3}>
            <Alert 
              status={isHealthy ? 'success' : 'warning'} 
              borderRadius="lg"
              variant="left-accent"
            >
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm" mb={1}>
                  Backend Status: {healthStatus}
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  {systemHealth?.message || 'Status unavailable'}
                </AlertDescription>
              </Box>
            </Alert>
            
            <VStack spacing={2}>
              <Box width="full">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">CPU Usage</Text>
                  <Text fontSize="sm" color={textColor}>
                    {systemHealth?.cpu || 0}%
                  </Text>
                </HStack>
                <Progress 
                  value={systemHealth?.cpu || 0} 
                  colorScheme={systemHealth?.cpu > 80 ? 'red' : systemHealth?.cpu > 60 ? 'orange' : 'green'}
                  size="sm"
                  borderRadius="md"
                />
              </Box>
              
              <Box width="full">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">Memory Usage</Text>
                  <Text fontSize="sm" color={textColor}>
                    {systemHealth?.memory || 0}%
                  </Text>
                </HStack>
                <Progress 
                  value={systemHealth?.memory || 0} 
                  colorScheme={systemHealth?.memory > 80 ? 'red' : systemHealth?.memory > 60 ? 'orange' : 'green'}
                  size="sm"
                  borderRadius="md"
                />
              </Box>
              
              <Box width="full">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">Uptime</Text>
                  <Text fontSize="sm" color={textColor}>
                    {systemHealth?.uptime || '0h 0m'}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Enhanced Quick Actions Card
  const QuickActionsCard = () => (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaCog} color="purple.500" />
          Quick Actions
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2}>
          <Button 
            size="md" 
            width="full" 
            leftIcon={<Icon as={FaUserPlus} />}
            colorScheme="blue"
            variant="outline"
            onClick={() => navigate('/admin/register')}
            _hover={{ bg: 'blue.50' }}
          >
            Add New User
          </Button>
          <Button 
            size="md" 
            width="full" 
            leftIcon={<Icon as={FaChartLine} />}
            colorScheme="green"
            variant="outline"
            onClick={() => navigate('/admin/analytics')}
            _hover={{ bg: 'green.50' }}
          >
            View Analytics
          </Button>
          <Button 
            size="md" 
            width="full" 
            leftIcon={<Icon as={FaFileExport} />}
            colorScheme="orange"
            variant="outline"
            onClick={() => navigate('/admin/reports')}
            _hover={{ bg: 'orange.50' }}
          >
            Export Reports
          </Button>
          <Button 
            size="md" 
            width="full" 
            leftIcon={<Icon as={FaCog} />}
            colorScheme="gray"
            variant="outline"
            onClick={() => navigate('/admin/settings')}
            _hover={{ bg: 'gray.50' }}
          >
            System Settings
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  // Enhanced Recent Activity Card
  const RecentActivityCard = () => (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="sm" display="flex" alignItems="center" gap={2}>
            <Icon as={TimeIcon} color="orange.500" />
            Recent Activity
          </Heading>
          <Button 
            size="sm" 
            variant="ghost" 
            rightIcon={<ExternalLinkIcon />}
            onClick={() => navigate('/admin/activity')}
          >
            View All
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
          {overviewData?.recentActivity && Array.isArray(overviewData.recentActivity) && overviewData.recentActivity.length > 0 ? (
            overviewData.recentActivity.map((activity, index) => {
              if (!activity || typeof activity !== 'object') return null;
              
              const getActivityColor = (action) => {
                switch (action?.toLowerCase()) {
                  case 'login': return 'green';
                  case 'logout': return 'gray';
                  case 'trip_created': return 'blue';
                  case 'trip_completed': return 'green';
                  case 'trip_cancelled': return 'red';
                  case 'user_registered': return 'purple';
                  default: return 'blue';
                }
              };
              
              return (
                <Box 
                  key={activity.id || index} 
                  p={3} 
                  bg={statBg} 
                  rounded="lg" 
                  borderLeft="4px solid" 
                  borderLeftColor={`${getActivityColor(activity.action)}.400`}
                  _hover={{ bg: hoverBg }}
                  transition="background 0.2s"
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Avatar 
                          size="xs" 
                          name={
                            activity.userId && activity.userId.firstName && activity.userId.lastName 
                              ? `${activity.userId.firstName} ${activity.userId.lastName}` 
                              : 'System'
                          }
                          bg={`${getActivityColor(activity.action)}.500`}
                        />
                        <Text fontSize="sm" fontWeight="semibold">
                          {activity.userId && activity.userId.firstName && activity.userId.lastName ? 
                            `${activity.userId.firstName} ${activity.userId.lastName}` : 
                            'System'}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>
                        {activity.description || 'No description available'}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Tag 
                        size="sm" 
                        colorScheme={getActivityColor(activity.action)}
                        variant="solid"
                      >
                        {activity.action ? activity.action.replace('_', ' ').toUpperCase() : 'ACTION'}
                      </Tag>
                      <Text fontSize="xs" color={textColor}>
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              );
            }).filter(Boolean)
          ) : (
            <Box textAlign="center" py={8}>
              <Icon as={FaClipboardList} boxSize={12} color="gray.300" mb={3} />
              <Text fontSize="sm" color={textColor}>
                No recent activity
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  // Enhanced User Distribution Card
  const UserDistributionCard = () => (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaUsers} color="teal.500" />
          User Distribution
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2}>
          {overviewData?.usersByRole && typeof overviewData.usersByRole === 'object' ? 
            Object.entries(overviewData.usersByRole).map(([role, count]) => {
              const safeCount = typeof count === 'number' ? count : 0;
              const totalUsers = typeof overviewData.totalUsers === 'number' && overviewData.totalUsers > 0 
                ? overviewData.totalUsers 
                : 1;
              
              const getRoleColor = (role) => {
                switch (role) {
                  case 'admin': return 'red';
                  case 'scheduler': return 'blue';
                  case 'dispatcher': return 'green';
                  case 'driver': return 'purple';
                  case 'rider': return 'orange';
                  default: return 'gray';
                }
              };
              
              const percentage = safeCount > 0 ? Math.min((safeCount / totalUsers) * 100, 100) : 0;
              
              return (
                <Box key={role} width="full">
                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Box 
                        w={3} 
                        h={3} 
                        borderRadius="full" 
                        bg={`${getRoleColor(role)}.500`} 
                      />
                      <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                        {role}s
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color={textColor}>
                        {percentage.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {safeCount}
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress 
                    value={percentage}
                    colorScheme={getRoleColor(role)}
                    size="md"
                    borderRadius="full"
                    bg={progressBg}
                  />
                </Box>
              );
            }) : (
              <Box textAlign="center" py={8}>
                <Icon as={FaUsers} boxSize={12} color="gray.300" mb={3} />
                <Text fontSize="sm" color={textColor}>
                  No user data available
                </Text>
              </Box>
            )
          }
        </VStack>
      </CardBody>
    </Card>
  );

  // Trip Status Overview Card
  const TripStatusCard = () => {
    const tripData = [
      { 
        label: 'Pending', 
        value: overviewData?.pendingTrips || 0, 
        color: 'orange',
        icon: FaClock
      },
      { 
        label: 'In Progress', 
        value: overviewData?.inProgressTrips || 0, 
        color: 'blue',
        icon: FaRoute
      },
      { 
        label: 'Completed', 
        value: overviewData?.completedTrips || 0, 
        color: 'green',
        icon: FaCheckCircle
      },
      { 
        label: 'Cancelled', 
        value: overviewData?.cancelledTrips || 0, 
        color: 'red',
        icon: FaExclamationTriangle
      }
    ];

    const totalTrips = tripData.reduce((sum, item) => sum + item.value, 0);

    return (
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
        <CardHeader>
          <Heading size="sm" display="flex" alignItems="center" gap={2}>
            <Icon as={FaRoute} color="blue.500" />
            Trip Status Overview
          </Heading>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={3}>
            <Box textAlign="center">
              <CircularProgress 
                value={totalTrips > 0 ? ((overviewData?.completedTrips || 0) / totalTrips) * 100 : 0} 
                color="green.400"
                size="100px"
                thickness="6px"
              >
                <CircularProgressLabel>
                  <VStack spacing={0}>
                    <Text fontSize="lg" fontWeight="bold">
                      {totalTrips > 0 ? Math.round(((overviewData?.completedTrips || 0) / totalTrips) * 100) : 0}%
                    </Text>
                    <Text fontSize="2xs" color={textColor}>
                      Success Rate
                    </Text>
                  </VStack>
                </CircularProgressLabel>
              </CircularProgress>
            </Box>
            
            <SimpleGrid columns={2} spacing={2} width="full">
              {tripData.map((item) => (
                <Box 
                  key={item.label}
                  p={2}
                  bg={statBg}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Icon as={item.icon} color={`${item.color}.500`} boxSize={4} mb={1} />
                  <Text fontSize="md" fontWeight="bold">
                    {item.value}
                  </Text>
                  <Text fontSize="2xs" color={textColor} noOfLines={1}>
                    {item.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Recent Users Card
  const RecentUsersCard = () => (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="sm" display="flex" alignItems="center" gap={2}>
            <Icon as={FaUserPlus} color="purple.500" />
            Recent Users
          </Heading>
          <Button 
            size="sm" 
            variant="ghost" 
            rightIcon={<ExternalLinkIcon />}
            onClick={() => navigate('/admin/users')}
          >
            View All
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2}>
          {overviewData?.recentUsers && overviewData.recentUsers.length > 0 ? (
            overviewData.recentUsers.map((user) => {
              if (!user) return null;
              
              const getRoleColor = (role) => {
                switch (role) {
                  case 'admin': return 'red';
                  case 'scheduler': return 'blue';
                  case 'dispatcher': return 'green';
                  case 'driver': return 'purple';
                  case 'rider': return 'orange';
                  default: return 'gray';
                }
              };
              
              return (
                <HStack 
                  key={user._id || user.id} 
                  width="full" 
                  p={2} 
                  bg={statBg} 
                  borderRadius="lg"
                  justify="space-between"
                >
                  <HStack spacing={2}>
                    <Avatar 
                      size="sm" 
                      name={`${user.firstName || ''} ${user.lastName || ''}`}
                      bg={`${getRoleColor(user.role)}.500`}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                      </Text>
                      <Text fontSize="xs" color={textColor}>
                        {user.email || 'No email'}
                      </Text>
                    </VStack>
                  </HStack>
                  <Tag 
                    size="sm" 
                    colorScheme={getRoleColor(user.role)}
                    textTransform="capitalize"
                  >
                    {user.role || 'Unknown'}
                  </Tag>
                </HStack>
              );
            }).filter(Boolean)
          ) : (
            <Box textAlign="center" py={8}>
              <Icon as={FaUser} boxSize={12} color="gray.300" mb={3} />
              <Text fontSize="sm" color={textColor}>
                No recent users
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
            <VStack spacing={4}>
              <Box width="full">
                <SkeletonText noOfLines={2} spacing={3} skeletonHeight={6} />
              </Box>
              <SimpleGrid columns={columnsCount} spacing={cardSpacing} width="full">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height="120px" borderRadius="lg" />
                ))}
              </SimpleGrid>
              <Grid 
                templateColumns={{ base: "1fr", lg: "2fr 1fr" }} 
                gap={cardSpacing} 
                width="full"
              >
                <VStack spacing={cardSpacing}>
                  <Skeleton height="400px" width="full" borderRadius="lg" />
                  <Skeleton height="300px" width="full" borderRadius="lg" />
                </VStack>
                <VStack spacing={cardSpacing}>
                  <Skeleton height="250px" width="full" borderRadius="lg" />
                  <Skeleton height="200px" width="full" borderRadius="lg" />
                </VStack>
              </Grid>
            </VStack>
        </Box>
      </Box>
    );
  }

  if (error && !overviewData) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
            <Center minH="400px">
              <VStack spacing={4} textAlign="center">
                <Icon as={FaExclamationTriangle} boxSize={16} color="red.400" />
                <Alert status="error" borderRadius="lg" maxW="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle mb={2}>Failed to Load Overview!</AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Box>
                </Alert>
                <Button 
                  colorScheme="blue"
                  leftIcon={<RepeatIcon />}
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchOverviewData();
                  }}
                >
                  Try Again
                </Button>
              </VStack>
            </Center>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bg={mainBg}>
      <Navbar />
      <Box flex="1" p={{ base: 3, md: 4 }} w="100%" overflowX="hidden">
        <VStack align="stretch" spacing={{ base: 4, md: 5 }}>
            {/* Header Section - Compact */}
            <Box>
              <HStack justify="space-between" mb={2} flexWrap="wrap" gap={3}>
                <VStack align="start" spacing={0}>
                  <Heading size={{ base: 'lg', md: 'xl' }} color={headingColor}>
                    System Overview
                  </Heading>
                  <Text color={textColor} fontSize="sm">
                    Key metrics and system performance indicators
                  </Text>
                </VStack>
                <HStack spacing={2}>
                  <Tooltip label="Refresh Data">
                    <IconButton
                      icon={<RepeatIcon />}
                      onClick={() => fetchOverviewData()}
                      isLoading={refreshing}
                      colorScheme="blue"
                      variant="outline"
                      size={{ base: 'sm', md: 'md' }}
                      aria-label="Refresh dashboard data"
                    />
                  </Tooltip>
                  <Menu>
                    <MenuButton 
                      as={Button} 
                      rightIcon={<ChevronDownIcon />} 
                      variant="outline"
                      size={{ base: 'sm', md: 'md' }}
                    >
                      Actions
                    </MenuButton>
                    <MenuList>
                      <MenuItem 
                        icon={<FaDownload />} 
                        onClick={handleExportData}
                        isDisabled={isExporting}
                      >
                        {isExporting ? 'Exporting...' : 'Export Data'}
                      </MenuItem>
                      <MenuItem icon={<FaFilter />} onClick={() => handleFilterView('all')}>
                        Show All
                      </MenuItem>
                      <MenuItem icon={<FaFilter />} onClick={() => handleFilterView('active')}>
                        Show Active Only
                      </MenuItem>
                      <MenuItem icon={<FaFilter />} onClick={() => handleFilterView('pending')}>
                        Show Pending Only
                      </MenuItem>
                      <MenuItem icon={<FaFilter />} onClick={() => handleFilterView('completed')}>
                        Show Completed Only
                      </MenuItem>
                      <MenuItem icon={<FaCog />} onClick={() => navigate('/admin/settings')}>
                        Settings
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </HStack>
            </Box>

            {/* Filter Status Badge */}
            {filterView !== 'all' && (
              <Alert status="info" variant="left-accent" borderRadius="lg">
                <AlertIcon />
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">
                    Showing {filterView} items only • {filteredData?.displayLabel}: {filteredData?.displayTrips || 0}
                  </Text>
                  <Button size="sm" variant="ghost" onClick={() => handleFilterView('all')}>
                    Clear Filter
                  </Button>
                </HStack>
              </Alert>
            )}

            {/* Key Metrics Grid - Compact Design */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
              <StatCard
                title="Total Users"
                value={overviewData?.totalUsers || 0}
                subtitle={`${overviewData?.activeUsers || 0} active`}
                icon={FaUsers}
                color="blue"
                trend="up"
                trendValue="12%"
                isClickable
                onClick={() => navigate('/admin/users')}
                loading={loading}
              />
              <StatCard
                title="Today's Trips"
                value={overviewData?.todayTrips || 0}
                subtitle={`${overviewData?.totalTrips || 0} total`}
                icon={FaRoute}
                color="green"
                trend="up"
                trendValue="8%"
                isClickable
                onClick={() => navigate('/scheduler')}
                loading={loading}
              />
              <StatCard
                title="Active Drivers"
                value={`${overviewData?.activeDrivers || 0}/${overviewData?.totalDrivers || 0}`}
                subtitle="Available now"
                icon={FaCar}
                color="purple"
                trend="down"
                trendValue="3%"
                isClickable
                onClick={() => navigate('/admin/drivers')}
                loading={loading}
              />
              <StatCard
                title="System Health"
                value={systemHealth?.status === 'OK' ? '100%' : '75%'}
                subtitle={`${overviewData?.pendingTrips || 0} pending`}
                icon={FaTachometerAlt}
                color="orange"
                trend="up"
                trendValue="5%"
                isClickable
                onClick={() => navigate('/admin/system')}
                loading={loading}
              />
            </SimpleGrid>

            {/* Main Content Grid - Improved Layout */}
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                lg: "2fr 1fr" 
              }} 
              gap={{ base: 3, md: 4 }}
            >
              {/* Left Column - Activity & Distribution */}
              <VStack spacing={{ base: 3, md: 4 }}>
                <RecentActivityCard />
                <UserDistributionCard />
              </VStack>
              
              {/* Right Column - Status & Actions */}
              <VStack spacing={{ base: 3, md: 4 }}>
                <TripStatusCard />
                <SystemHealthCard />
                <QuickActionsCard />
              </VStack>
            </Grid>

            {/* Recent Users Section - Full Width */}
            <RecentUsersCard />

            {/* Bottom Statistics Row - System Performance */}
            <Box>
              <Heading size="md" color={headingColor} mb={3}>
                System Performance
              </Heading>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
                <StatCard
                  title="Avg Duration"
                  value={`${overviewData?.systemStats?.avgTripDuration || 0}m`}
                  icon={FaClock}
                  color="teal"
                  loading={loading}
                />
                <StatCard
                  title="Revenue"
                  value={`$${(overviewData?.systemStats?.totalRevenue || 0).toLocaleString()}`}
                  icon={FaDollarSign}
                  color="green"
                  loading={loading}
                />
                <StatCard
                  title="Fuel Efficiency"
                  value={`${overviewData?.systemStats?.fuelEfficiency || 0}`}
                  subtitle="MPG"
                  icon={FaGasPump}
                  color="blue"
                  loading={loading}
                />
                <StatCard
                  title="Rating"
                  value={`${overviewData?.systemStats?.customerSatisfaction || 0}/5`}
                  icon={StarIcon}
                  color="yellow"
                  loading={loading}
                />
              </SimpleGrid>
            </Box>
          </VStack>
      </Box>
    </Box>
  );
};

export default AdminOverview;