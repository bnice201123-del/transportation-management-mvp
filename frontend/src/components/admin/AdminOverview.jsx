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
  Portal,
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
  ExternalLinkIcon,
  CheckCircleIcon,
  CheckIcon,
  ArrowBackIcon
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
import useCloseOnScroll from '../../hooks/useCloseOnScroll';

const AdminOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterView, setFilterView] = useState('all'); // 'all', 'active', 'pending', 'completed'
  const [isExporting, setIsExporting] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
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

  // Close Actions dropdown on scroll (desktop only)
  useCloseOnScroll(isActionsMenuOpen, () => setIsActionsMenuOpen(false));

  const fetchOnlineStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/users/online-status');
      if (response.data.success) {
        setOnlineStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
      // Don't show error toast for this non-critical feature
    }
  }, []);

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

      // Fetch online status separately (non-blocking)
      fetchOnlineStatus();

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
  }, [toast, loading, fetchOnlineStatus]);

  useEffect(() => {
    fetchOverviewData();
    
    // Refresh online status every 30 seconds
    const onlineInterval = setInterval(() => {
      fetchOnlineStatus();
    }, 30000);

    return () => clearInterval(onlineInterval);
  }, [fetchOverviewData, fetchOnlineStatus]);

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

  // Online Presence Widget Component
  const OnlinePresenceWidget = () => {
    const onlineData = [
      {
        label: 'Total Users Online',
        value: onlineStatus?.totalOnline || 0,
        icon: FaUsers,
        color: 'blue',
        bgGradient: 'linear(to-br, blue.400, blue.600)'
      },
      {
        label: 'Drivers Online',
        value: onlineStatus?.driversOnline || 0,
        icon: FaCar,
        color: 'green',
        bgGradient: 'linear(to-br, green.400, green.600)'
      },
      {
        label: 'Schedulers Online',
        value: onlineStatus?.schedulersOnline || 0,
        icon: FaCalendarAlt,
        color: 'purple',
        bgGradient: 'linear(to-br, purple.400, purple.600)'
      },
      {
        label: 'Dispatchers Online',
        value: onlineStatus?.dispatchersOnline || 0,
        icon: FaMapMarkedAlt,
        color: 'orange',
        bgGradient: 'linear(to-br, orange.400, orange.600)'
      }
    ];

    return (
      <Card 
        bg={cardBg} 
        border="1px solid" 
        borderColor={borderColor} 
        shadow="lg"
        borderRadius="2xl"
        overflow="hidden"
      >
        <Box 
          bgGradient="linear(to-r, cyan.500, blue.500)"
          p={4}
        >
          <HStack justify="space-between" color="white">
            <HStack spacing={3}>
              <Box position="relative">
                <Icon as={FaUsers} boxSize={6} />
                <Box 
                  position="absolute" 
                  top="-1" 
                  right="-1" 
                  w={3} 
                  h={3} 
                  bg="green.400" 
                  borderRadius="full"
                  border="2px solid white"
                  animation="pulse 2s infinite"
                />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="sm">Online Presence</Heading>
                <Text fontSize="xs" opacity={0.9}>
                  Real-time user status
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Box 
                w={2} 
                h={2} 
                bg="green.300" 
                borderRadius="full"
                animation="pulse 2s infinite"
              />
              <Text fontSize="xs" fontWeight="medium">Live</Text>
            </HStack>
          </HStack>
        </Box>
        
        <CardBody p={5}>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            {onlineData.map((item) => (
              <VStack
                key={item.label}
                p={4}
                bg={statBg}
                borderRadius="xl"
                border="1px solid"
                borderColor={borderColor}
                spacing={3}
                position="relative"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'md',
                  borderColor: `${item.color}.300`
                }}
              >
                <Box 
                  position="absolute" 
                  top="-10px" 
                  right="-10px" 
                  opacity="0.1"
                >
                  <Icon as={item.icon} boxSize="60px" />
                </Box>
                
                <Box 
                  p={2} 
                  bgGradient={item.bgGradient}
                  borderRadius="lg"
                  position="relative"
                  zIndex="1"
                >
                  <Icon as={item.icon} color="white" boxSize={5} />
                </Box>
                
                <VStack spacing={1} zIndex="1">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color={headingColor}
                  >
                    {item.value}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color={textColor} 
                    textAlign="center"
                    noOfLines={2}
                    lineHeight="1.2"
                  >
                    {item.label}
                  </Text>
                </VStack>
              </VStack>
            ))}
          </SimpleGrid>
          
          <HStack 
            mt={4} 
            pt={4} 
            borderTop="1px solid"
            borderColor={borderColor}
            justify="space-between"
          >
            <HStack spacing={2}>
              <Icon as={FaClock} color={textColor} boxSize={3} />
              <Text fontSize="xs" color={textColor}>
                Last updated: {onlineStatus?.timestamp 
                  ? new Date(onlineStatus.timestamp).toLocaleTimeString()
                  : 'Loading...'}
              </Text>
            </HStack>
            <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="full">
              Auto-refresh: 30s
            </Badge>
          </HStack>
        </CardBody>
        
        <style>
          {`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}
        </style>
      </Card>
    );
  };

  // Modern Enhanced Stat Card Component
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
      blue: { bg: 'blue.500', light: 'blue.50', dark: 'blue.900', gradient: 'linear(to-br, blue.400, blue.600)' },
      green: { bg: 'green.500', light: 'green.50', dark: 'green.900', gradient: 'linear(to-br, green.400, green.600)' },
      purple: { bg: 'purple.500', light: 'purple.50', dark: 'purple.900', gradient: 'linear(to-br, purple.400, purple.600)' },
      orange: { bg: 'orange.500', light: 'orange.50', dark: 'orange.900', gradient: 'linear(to-br, orange.400, orange.600)' },
      teal: { bg: 'teal.500', light: 'teal.50', dark: 'teal.900', gradient: 'linear(to-br, teal.400, teal.600)' },
      yellow: { bg: 'yellow.500', light: 'yellow.50', dark: 'yellow.900', gradient: 'linear(to-br, yellow.400, yellow.600)' },
      red: { bg: 'red.500', light: 'red.50', dark: 'red.900', gradient: 'linear(to-br, red.400, red.600)' }
    };

    const colors = colorScheme[color] || colorScheme.blue;

    return (
      <Card 
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        shadow="lg"
        borderRadius="2xl"
        height="100%"
        overflow="hidden"
        _hover={isClickable ? { 
          shadow: '2xl', 
          transform: 'translateY(-6px)',
          borderColor: colors.bg,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        } : {}}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        cursor={isClickable ? 'pointer' : 'default'}
        onClick={onClick}
        position="relative"
      >
        {/* Decorative gradient background */}
        <Box
          position="absolute"
          top="0"
          right="0"
          width="100px"
          height="100px"
          bgGradient={colors.gradient}
          opacity="0.05"
          borderRadius="full"
          filter="blur(40px)"
        />
        
        <CardBody p={{ base: 5, md: 6 }} position="relative">
          {cardLoading ? (
            <VStack spacing={3} align="stretch">
              <Skeleton height="20px" borderRadius="md" />
              <Skeleton height="40px" borderRadius="md" />
              <Skeleton height="16px" borderRadius="md" width="60%" />
            </VStack>
          ) : (
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={1} flex="1">
                  <Text 
                    fontSize="xs" 
                    fontWeight="600" 
                    color={textColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {title}
                  </Text>
                  <Text 
                    fontSize={{ base: '2xl', md: '3xl' }} 
                    fontWeight="bold" 
                    color={headingColor}
                    lineHeight="1"
                  >
                    {value}
                  </Text>
                </VStack>
                <Box
                  p={3}
                  borderRadius="xl"
                  bgGradient={colors.gradient}
                  shadow="md"
                >
                  <Icon as={icon} boxSize={{ base: 5, md: 6 }} color="white" />
                </Box>
              </HStack>
              
              <HStack justify="space-between" align="center">
                {subtitle && (
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {subtitle}
                  </Text>
                )}
                {trend && trendValue && (
                  <HStack 
                    spacing={1} 
                    bg={trend === 'up' ? 'green.50' : 'red.50'}
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    <Icon 
                      as={trend === 'up' ? FaArrowUp : FaArrowDown} 
                      color={trend === 'up' ? 'green.500' : 'red.500'}
                      boxSize={3}
                    />
                    <Text 
                      fontSize="xs" 
                      color={trend === 'up' ? 'green.600' : 'red.600'} 
                      fontWeight="bold"
                    >
                      {trendValue}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </VStack>
          )}
        </CardBody>
        
        {/* Bottom accent line */}
        <Box 
          height="4px" 
          bgGradient={colors.gradient}
          opacity={isClickable ? 1 : 0.3}
        />
      </Card>
    );
  };

  // Modern Enhanced System Health Card
  const SystemHealthCard = () => {
    const healthStatus = systemHealth?.status || 'Unknown';
    const isHealthy = healthStatus === 'OK';
    const cpuUsage = systemHealth?.cpu || 0;
    const memoryUsage = systemHealth?.memory || 0;
    
    return (
      <Card 
        bg={cardBg} 
        border="1px solid" 
        borderColor={borderColor} 
        shadow="lg"
        borderRadius="2xl"
        overflow="hidden"
        display={{ base: 'none', md: 'block' }}
      >
        <Box 
          bgGradient={isHealthy ? "linear(to-r, green.400, teal.500)" : "linear(to-r, orange.400, red.500)"}
          p={4}
        >
          <HStack justify="space-between" color="white">
            <HStack spacing={3}>
              <Icon as={FaShieldAlt} boxSize={6} />
              <VStack align="start" spacing={0}>
                <Heading size="sm">System Health</Heading>
                <Text fontSize="xs" opacity={0.9}>Real-time monitoring</Text>
              </VStack>
            </HStack>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<RepeatIcon />}
              onClick={() => fetchOverviewData()}
              isLoading={refreshing}
              aria-label="Refresh system health"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          </HStack>
        </Box>
        
        <CardBody p={5}>
          <VStack align="stretch" spacing={4}>
            {/* Status Badge */}
            <HStack 
              p={3} 
              bg={isHealthy ? 'green.50' : 'orange.50'}
              borderRadius="xl"
              justify="space-between"
            >
              <HStack>
                <Icon 
                  as={isHealthy ? FaCheckCircle : FaExclamationTriangle} 
                  color={isHealthy ? 'green.500' : 'orange.500'}
                  boxSize={5}
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                    {healthStatus}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    {systemHealth?.message || 'All systems operational'}
                  </Text>
                </VStack>
              </HStack>
              <Badge 
                colorScheme={isHealthy ? 'green' : 'orange'}
                borderRadius="full"
                px={3}
                py={1}
              >
                {isHealthy ? 'Healthy' : 'Warning'}
              </Badge>
            </HStack>
            
            {/* Resource Usage */}
            <VStack spacing={4}>
              {/* CPU Usage */}
              <Box width="full">
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={FaTachometerAlt} color="blue.500" boxSize={4} />
                    <Text fontSize="sm" fontWeight="600">CPU Usage</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                    {cpuUsage}%
                  </Text>
                </HStack>
                <Box position="relative">
                  <Progress 
                    value={cpuUsage} 
                    colorScheme={cpuUsage > 80 ? 'red' : cpuUsage > 60 ? 'orange' : 'green'}
                    size="md"
                    borderRadius="full"
                    hasStripe
                    isAnimated
                  />
                </Box>
              </Box>
              
              {/* Memory Usage */}
              <Box width="full">
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={FaTachometerAlt} color="purple.500" boxSize={4} />
                    <Text fontSize="sm" fontWeight="600">Memory Usage</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                    {memoryUsage}%
                  </Text>
                </HStack>
                <Box position="relative">
                  <Progress 
                    value={memoryUsage} 
                    colorScheme={memoryUsage > 80 ? 'red' : memoryUsage > 60 ? 'orange' : 'green'}
                    size="md"
                    borderRadius="full"
                    hasStripe
                    isAnimated
                  />
                </Box>
              </Box>
              
              {/* Uptime */}
              <HStack 
                width="full" 
                justify="space-between"
                p={3}
                bg={statBg}
                borderRadius="lg"
              >
                <HStack>
                  <Icon as={FaClock} color="teal.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="600">System Uptime</Text>
                </HStack>
                <Badge colorScheme="teal" fontSize="sm" px={3} py={1} borderRadius="full">
                  {systemHealth?.uptime || '0h 0m'}
                </Badge>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Modern Enhanced Quick Actions Card
  const QuickActionsCard = () => (
    <Card 
      bg={cardBg} 
      border="1px solid" 
      borderColor={borderColor} 
      shadow="lg"
      borderRadius="2xl"
      overflow="hidden"
      display={{ base: 'none', md: 'block' }}
    >
      <Box 
        bgGradient="linear(to-r, purple.500, pink.500)"
        p={4}
      >
        <HStack spacing={3} color="white">
          <Icon as={FaCog} boxSize={6} />
          <VStack align="start" spacing={0}>
            <Heading size="sm">Quick Actions</Heading>
            <Text fontSize="xs" opacity={0.9}>Common tasks</Text>
          </VStack>
        </HStack>
      </Box>
      
      <CardBody p={5}>
        <VStack spacing={3}>
          <Button 
            size="lg" 
            width="full" 
            leftIcon={<Icon as={FaUserPlus} />}
            colorScheme="blue"
            bgGradient="linear(to-r, blue.400, blue.600)"
            _hover={{ bgGradient: 'linear(to-r, blue.500, blue.700)' }}
            onClick={() => navigate('/admin/register')}
            borderRadius="xl"
            shadow="md"
            color="white"
          >
            Add New User
          </Button>
          <Button 
            size="lg" 
            width="full" 
            leftIcon={<Icon as={AddIcon} />}
            colorScheme="green"
            bgGradient="linear(to-r, green.400, green.600)"
            _hover={{ bgGradient: 'linear(to-r, green.500, green.700)' }}
            onClick={() => navigate('/scheduler')}
            borderRadius="xl"
            shadow="md"
            color="white"
          >
            Create Trip
          </Button>
          <Button 
            size="lg" 
            width="full" 
            leftIcon={<Icon as={FaFileExport} />}
            colorScheme="purple"
            variant="outline"
            onClick={handleExportData}
            isLoading={isExporting}
            loadingText="Exporting..."
            borderRadius="xl"
            borderWidth="2px"
            _hover={{ bg: 'purple.50' }}
          >
            Export Report
          </Button>
          <Button 
            size="lg" 
            width="full" 
            leftIcon={<Icon as={FaCog} />}
            colorScheme="gray"
            variant="outline"
            onClick={() => navigate('/admin/settings')}
            borderRadius="xl"
            borderWidth="2px"
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
            
            <VStack spacing={2} width="full">
              {tripData.map((item) => (
                <HStack 
                  key={item.label}
                  p={3}
                  bg={statBg}
                  borderRadius="lg"
                  width="full"
                  justify="space-between"
                >
                  <HStack spacing={3}>
                    <Icon as={item.icon} color={`${item.color}.500`} boxSize={5} />
                    <Text fontSize="sm" color={textColor}>
                      {item.label}
                    </Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {item.value}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Modern Enhanced Recent Users Card - Full Width
  const RecentUsersCard = () => (
    <Card 
      bg={cardBg} 
      border="1px solid" 
      borderColor={borderColor} 
      shadow="lg"
      borderRadius="2xl"
      overflow="hidden"
    >
      <Box 
        bgGradient="linear(to-r, purple.500, blue.500)"
        p={4}
      >
        <HStack justify="space-between" color="white">
          <HStack spacing={3}>
            <Icon as={FaUserPlus} boxSize={6} />
            <VStack align="start" spacing={0}>
              <Heading size="sm">Recent Users</Heading>
              <Text fontSize="xs" opacity={0.9}>
                {overviewData?.recentUsers?.length || 0} new members
              </Text>
            </VStack>
          </HStack>
          <Button 
            size="sm" 
            rightIcon={<ExternalLinkIcon />}
            onClick={() => navigate('/admin/users')}
            colorScheme="whiteAlpha"
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: 'whiteAlpha.300' }}
            borderRadius="full"
          >
            View All
          </Button>
        </HStack>
      </Box>
      
      <CardBody p={5}>
        {overviewData?.recentUsers && overviewData.recentUsers.length > 0 ? (
          <Grid 
            templateColumns={{ 
              base: "1fr", 
              md: "repeat(2, 1fr)", 
              lg: "repeat(5, 1fr)" 
            }} 
            gap={4}
          >
            {overviewData.recentUsers.map((user) => {
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
                <Box
                  key={user._id || user.id}
                  p={4}
                  bg={statBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                  _hover={{
                    shadow: 'md',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => navigate('/admin/users')}
                >
                  <VStack spacing={3} align="center">
                    <Avatar 
                      size="lg" 
                      name={`${user.firstName || ''} ${user.lastName || ''}`}
                      bg={`${getRoleColor(user.role)}.500`}
                      color="white"
                    />
                    <VStack spacing={1} align="center" w="full">
                      <Text 
                        fontSize="sm" 
                        fontWeight="bold" 
                        textAlign="center"
                        noOfLines={1}
                      >
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color={textColor}
                        noOfLines={1}
                        w="full"
                        textAlign="center"
                      >
                        {user.email || 'No email'}
                      </Text>
                    </VStack>
                    <Badge 
                      colorScheme={getRoleColor(user.role)}
                      textTransform="capitalize"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      {user.role || 'Unknown'}
                    </Badge>
                  </VStack>
                </Box>
              );
            }).filter(Boolean)}
          </Grid>
        ) : (
          <Box textAlign="center" py={12}>
            <Icon as={FaUser} boxSize={16} color="gray.300" mb={4} />
            <Text fontSize="md" fontWeight="semibold" color={headingColor} mb={2}>
              No Recent Users
            </Text>
            <Text fontSize="sm" color={textColor}>
              New users will appear here when they register
            </Text>
          </Box>
        )}
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
      <Box flex="1" p={{ base: 4, md: 6 }} w="100%" overflowX="hidden">
        <VStack align="stretch" spacing={{ base: 5, md: 6 }}>
            {/* Back to Admin Button - Desktop Only */}
            <Flex mb={2} justifyContent="flex-start" display={{ base: 'none', lg: 'flex' }}>
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                colorScheme="blue"
              >
                Back to Admin Dashboard
              </Button>
            </Flex>

            {/* Modern Header with Gradient Background */}
            <Box 
              bgGradient="linear(to-r, blue.500, purple.600)" 
              borderRadius="2xl" 
              p={{ base: 6, md: 8 }}
              shadow="xl"
              position="relative"
              overflow="hidden"
            >
              {/* Decorative background pattern */}
              <Box 
                position="absolute" 
                top="0" 
                right="0" 
                opacity="0.1"
                display={{ base: 'none', md: 'block' }}
              >
                <Icon as={FaTachometerAlt} boxSize="200px" />
              </Box>
              
              <HStack justify="space-between" position="relative" zIndex="1" flexWrap="wrap" gap={4}>
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Icon as={FaTachometerAlt} color="white" boxSize={8} />
                    <Heading size={{ base: 'xl', md: '2xl' }} color="white">
                      System Overview
                    </Heading>
                  </HStack>
                  <Text color="whiteAlpha.900" fontSize={{ base: 'sm', md: 'md' }} fontWeight="medium">
                    Real-time monitoring and performance analytics
                  </Text>
                  <HStack spacing={4} mt={2}>
                    <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                      <HStack spacing={1}>
                        <Box w={2} h={2} bg="green.300" borderRadius="full" />
                        <Text>All Systems Operational</Text>
                      </HStack>
                    </Badge>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Last updated: {new Date().toLocaleTimeString()}
                    </Text>
                  </HStack>
                </VStack>
                
                <HStack spacing={3}>
                  <Tooltip label="Refresh Data" placement="bottom">
                    <IconButton
                      icon={<RepeatIcon />}
                      onClick={() => fetchOverviewData()}
                      isLoading={refreshing}
                      colorScheme="whiteAlpha"
                      bg="whiteAlpha.200"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.300' }}
                      size="lg"
                      borderRadius="full"
                      aria-label="Refresh dashboard data"
                    />
                  </Tooltip>
                  <Menu 
                    isOpen={isActionsMenuOpen} 
                    onClose={() => setIsActionsMenuOpen(false)}
                    onOpen={() => setIsActionsMenuOpen(true)}
                    closeOnBlur={true}
                    closeOnSelect={true}
                  >
                    <MenuButton 
                      as={Button} 
                      rightIcon={<ChevronDownIcon />} 
                      colorScheme="purple"
                      bg="purple.500"
                      color="white"
                      _hover={{ bg: 'purple.600' }}
                      _active={{ bg: 'purple.700' }}
                      size="lg"
                      borderRadius="full"
                      fontWeight="semibold"
                      px={6}
                      display={{ base: 'none', md: 'flex' }}
                    >
                      Actions
                    </MenuButton>
                    <Portal>
                      <MenuList 
                        bg="white" 
                        borderColor="gray.200" 
                        shadow="xl" 
                        p={2}
                        zIndex={9999}
                      >
                        {/* Export Section */}
                        <MenuItem 
                          icon={<Icon as={FaDownload} />} 
                          onClick={handleExportData}
                          isDisabled={isExporting}
                          bg={isExporting ? 'gray.50' : 'transparent'}
                          _hover={{ bg: 'purple.50', color: 'purple.700' }}
                          borderRadius="md"
                          fontWeight="medium"
                          mb={2}
                        >
                          {isExporting ? 'Exporting Data...' : 'Export Data'}
                        </MenuItem>
                        
                        <Divider my={2} />
                        
                        {/* Filter Section */}
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} py={1}>
                        FILTER VIEW
                      </Text>
                      <MenuItem 
                        icon={<ViewIcon />} 
                        onClick={() => handleFilterView('all')}
                        _hover={{ bg: 'blue.50', color: 'blue.700' }}
                        borderRadius="md"
                        bg={filterView === 'all' ? 'blue.50' : 'transparent'}
                        fontWeight={filterView === 'all' ? 'semibold' : 'normal'}
                      >
                        All Items
                      </MenuItem>
                      <MenuItem 
                        icon={<CheckCircleIcon color="green.500" />} 
                        onClick={() => handleFilterView('active')}
                        _hover={{ bg: 'green.50', color: 'green.700' }}
                        borderRadius="md"
                        bg={filterView === 'active' ? 'green.50' : 'transparent'}
                        fontWeight={filterView === 'active' ? 'semibold' : 'normal'}
                      >
                        Active Only
                      </MenuItem>
                      <MenuItem 
                        icon={<TimeIcon color="orange.500" />} 
                        onClick={() => handleFilterView('pending')}
                        _hover={{ bg: 'orange.50', color: 'orange.700' }}
                        borderRadius="md"
                        bg={filterView === 'pending' ? 'orange.50' : 'transparent'}
                        fontWeight={filterView === 'pending' ? 'semibold' : 'normal'}
                      >
                        Pending Only
                      </MenuItem>
                      <MenuItem 
                        icon={<CheckIcon color="blue.500" />} 
                        onClick={() => handleFilterView('completed')}
                        _hover={{ bg: 'blue.50', color: 'blue.700' }}
                        borderRadius="md"
                        bg={filterView === 'completed' ? 'blue.50' : 'transparent'}
                        fontWeight={filterView === 'completed' ? 'semibold' : 'normal'}
                      >
                        Completed Only
                      </MenuItem>
                      
                      <Divider my={2} />
                      
                      {/* Settings Section */}
                      <MenuItem 
                        icon={<Icon as={FaCog} />} 
                        onClick={() => navigate('/admin/settings')}
                        _hover={{ bg: 'gray.50', color: 'gray.700' }}
                        borderRadius="md"
                      >
                        Settings
                      </MenuItem>
                    </MenuList>
                    </Portal>
                  </Menu>
                </HStack>
              </HStack>
            </Box>

            {/* Filter Status Badge */}
            {filterView !== 'all' && (
              <Alert 
                status="info" 
                variant="subtle" 
                borderRadius="xl"
                bgGradient="linear(to-r, blue.50, purple.50)"
                borderWidth="1px"
                borderColor="blue.200"
              >
                <AlertIcon color="blue.500" />
                <HStack justify="space-between" w="full">
                  <HStack>
                    <Text fontSize="sm" fontWeight="medium">
                      Showing {filterView} items only
                    </Text>
                    <Badge colorScheme="blue" borderRadius="full">
                      {filteredData?.displayTrips || 0} {filteredData?.displayLabel}
                    </Badge>
                  </HStack>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    colorScheme="blue"
                    onClick={() => handleFilterView('all')}
                    borderRadius="full"
                  >
                    Clear Filter
                  </Button>
                </HStack>
              </Alert>
            )}

            {/* Enhanced Key Metrics Grid with Modern Cards */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 4, md: 5 }}>
              <StatCard
                title="Total Users"
                value={overviewData?.totalUsers || 0}
                subtitle={`${overviewData?.activeUsers || 0} active users`}
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
                subtitle={`${overviewData?.totalTrips || 0} total trips`}
                icon={FaRoute}
                color="green"
                isClickable
                onClick={() => navigate('/admin/trips')}
                loading={loading}
              />
              <StatCard
                title="Active Drivers"
                value={overviewData?.activeDrivers || 0}
                subtitle={`${overviewData?.totalDrivers || 0} total drivers`}
                icon={FaCar}
                color="purple"
                isClickable
                onClick={() => navigate('/admin/drivers')}
                loading={loading}
              />
              <StatCard
                title="Pending Trips"
                value={overviewData?.pendingTrips || 0}
                subtitle={`${overviewData?.inProgressTrips || 0} in progress`}
                icon={FaClock}
                color="orange"
                trend="down"
                trendValue="8%"
                isClickable
                onClick={() => handleFilterView('pending')}
                loading={loading}
              />
            </SimpleGrid>

            {/* Online Presence Widget */}
            <OnlinePresenceWidget />

            {/* Modern Three-Column Layout */}
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                md: "1fr 1fr",
                lg: "2fr 1.5fr 1.5fr" 
              }} 
              gap={{ base: 4, md: 5 }}
            >
              {/* Left Column - Recent Activity */}
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <RecentActivityCard />
              </VStack>
              
              {/* Middle Column - Trip Status & Distribution */}
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <TripStatusCard />
                <UserDistributionCard />
              </VStack>
              
              {/* Right Column - System Health & Quick Actions */}
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <SystemHealthCard />
                <QuickActionsCard />
              </VStack>
            </Grid>

            {/* Recent Users Section - Full Width with Modern Design */}
            <RecentUsersCard />

            {/* Enhanced System Performance Section */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <HStack spacing={3}>
                  <Icon as={FaChartLine} color="purple.500" boxSize={6} />
                  <Heading size="md" color={headingColor}>
                    System Performance Metrics
                  </Heading>
                </HStack>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  rightIcon={<ExternalLinkIcon />}
                  onClick={() => navigate('/admin/analytics')}
                >
                  View Details
                </Button>
              </HStack>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 4, md: 5 }}>
                <StatCard
                  title="Avg Trip Duration"
                  value={`${overviewData?.systemStats?.avgTripDuration || 0}m`}
                  subtitle="Per trip"
                  icon={FaClock}
                  color="teal"
                  loading={loading}
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${(overviewData?.systemStats?.totalRevenue || 0).toLocaleString()}`}
                  subtitle="This month"
                  icon={FaDollarSign}
                  color="green"
                  loading={loading}
                />
                <StatCard
                  title="Fuel Efficiency"
                  value={`${overviewData?.systemStats?.fuelEfficiency || 0}`}
                  subtitle="Miles per gallon"
                  icon={FaGasPump}
                  color="blue"
                  loading={loading}
                />
                <StatCard
                  title="Customer Rating"
                  value={`${overviewData?.systemStats?.customerSatisfaction || 0}/5`}
                  subtitle="Average rating"
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