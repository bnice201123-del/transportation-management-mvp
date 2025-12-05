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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  useToast,
  useDisclosure,
  VStack,
  HStack,
  Badge,
  Progress,
  Button,
  ButtonGroup,
  IconButton,
  Flex,
  Spacer,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CircularProgress,
  CircularProgressLabel,
  Tooltip,
  useBreakpointValue,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon
} from '@chakra-ui/react';
import {
  CalendarIcon,
  SearchIcon,
  DownloadIcon,
  RepeatIcon,
  SettingsIcon,
  ViewIcon,
  InfoIcon,
  WarningIcon,
  CheckCircleIcon,
  TimeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  ExternalLinkIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaUser,
  FaRoute,
  FaChartLine,
  FaExclamationTriangle,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFilter,
  FaFileExport
} from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import TripManagementModal from '../scheduler/TripManagementModal';
import { useSidebar } from '../../contexts/SidebarContext';

const AdminDashboard = () => {
  // Sidebar auto-close on mobile/tablet
  const { isSidebarVisible, hideSidebar } = useSidebar();
  const shouldAutoClose = useBreakpointValue({ base: true, md: true, lg: false });
  
  const [analytics, setAnalytics] = useState(null);
  const [driverStats, setDriverStats] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const { 
    isOpen: isTripManagementOpen, 
    onOpen: onTripManagementOpen, 
    onClose: onTripManagementClose 
  } = useDisclosure();
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const isMobile = useBreakpointValue({ base: true, md: false });

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
        description: 'Failed to fetch analytics data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  }, [toast]);

  const fetchDriverStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/analytics/drivers');
      setDriverStats(response.data);
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      // Set empty array to prevent errors
      setDriverStats([]);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips?sort=createdAt&order=desc&limit=10');
      setRecentTrips(response.data.trips || []);
    } catch (error) {
      console.error('Error fetching recent trips:', error);
      // Set empty array to prevent errors
      setRecentTrips([]);
    }
  }, []);

  const fetchSystemAlerts = useCallback(async () => {
    try {
      // Since alerts endpoint doesn't exist, create mock alerts from analytics
      setSystemAlerts([]);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      setSystemAlerts([]);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAnalytics(false),
        fetchDriverStats(),
        fetchRecentTrips(),
        fetchSystemAlerts()
      ]);
      toast({
        title: 'Success',
        description: 'Dashboard data refreshed successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnalytics, fetchDriverStats, fetchRecentTrips, fetchSystemAlerts, toast]);

  const exportData = useCallback(async (type) => {
    try {
      const response = await axios.get(`/admin/export/${type}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `${type} data exported successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: `Failed to export ${type} data`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAnalytics(false),
          fetchDriverStats(),
          fetchRecentTrips(),
          fetchSystemAlerts()
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAnalytics, fetchDriverStats, fetchRecentTrips, fetchSystemAlerts]);

  // Remove the dateRange effect since we don't use it anymore
  // useEffect(() => {
  //   fetchAnalytics();
  // }, [dateRange, fetchAnalytics]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [handleRefresh]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      'in-progress': 'blue',
      pending: 'orange',
      cancelled: 'red',
      scheduled: 'purple'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'green'
    };
    return colors[priority] || 'gray';
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
    };
  };

  const filteredDrivers = driverStats.filter(driver => {
    const matchesSearch = searchTerm === '' || 
      `${driver.driver?.firstName} ${driver.driver?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && driver.totalTrips > 0;
    if (filterStatus === 'inactive') return matchesSearch && driver.totalTrips === 0;
    return matchesSearch;
  });



  if (loading) {
    return (
      <>
        <Navbar title="Admin Dashboard" />
        <Center h="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text>Loading dashboard data...</Text>
          </VStack>
        </Center>
      </>
    );
  }

  // Handle clicking on main content to close sidebar on mobile/tablet
  const handleContentClick = () => {
    if (shouldAutoClose && isSidebarVisible) {
      hideSidebar();
    }
  };

  return (
    <>
      <Navbar title="Admin Dashboard" />
      {analytics && (
        <Box p={{ base: 3, md: 4 }} w="100%" overflowX="hidden" onClick={handleContentClick}>
          <VStack spacing={6} mb={6} align="left">
            {/* Page Header with Responsive Typography */}
            <Heading
              fontSize={['xl', '2xl', '3xl']}
              color="blue.600"
              textAlign={{ base: 'center', md: 'left' }}
            >
              Admin Dashboard
            </Heading>
            
            {/* Date Range Selector */}
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 3, md: 4 }}
              justify={{ base: 'center', md: 'space-between' }}
              align={{ base: 'stretch', md: 'center' }}
            >
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600">
                Last updated: {formatDateTime(lastRefresh)}
              </Text>
              <HStack spacing={3}>
                <Select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  size={{ base: 'sm', md: 'md' }}
                  maxW={{ base: '100%', md: '200px' }}
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </Select>
                <IconButton
                  icon={<RepeatIcon />}
                  onClick={handleRefresh}
                  isLoading={refreshing}
                  size={{ base: 'sm', md: 'md' }}
                  colorScheme="blue"
                  aria-label="Refresh data"
                />
              </HStack>
            </Flex>
          </VStack>

          {/* Overview Statistics - Responsive Grid with Enhanced Cards */}
          <SimpleGrid 
            templateColumns={{
              base: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)'
            }}
            spacing={{ base: 4, md: 4 }} 
            mb={{ base: 6, md: 6 }}
            w="100%"
          >
              <Card 
                borderRadius="xl" 
                boxShadow="sm"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stat>
                    <StatLabel fontSize={{ base: "xs", md: "sm" }}>Total Trips</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                      {analytics.tripStats.total}
                    </StatNumber>
                    <StatHelpText fontSize={{ base: "2xs", md: "xs" }}>
                      {analytics.tripStats.today} today
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card 
                borderRadius="xl" 
                boxShadow="sm"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stat>
                    <StatLabel fontSize={{ base: "xs", md: "sm" }}>Completed Trips</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="green.500">
                      {analytics.tripStats.completed}
                    </StatNumber>
                    <StatHelpText fontSize={{ base: "2xs", md: "xs" }}>
                      <StatArrow type="increase" />
                      {analytics.tripStats.total > 0 ? 
                        Math.round((analytics.tripStats.completed / analytics.tripStats.total) * 100) : 0}% success rate
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card 
                borderRadius="xl" 
                boxShadow="sm"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stat>
                    <StatLabel fontSize={{ base: "xs", md: "sm" }}>Active Trips</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.500">
                      {analytics.tripStats.pending + analytics.tripStats.inProgress}
                    </StatNumber>
                    <StatHelpText fontSize={{ base: "2xs", md: "xs" }}>
                      {analytics.tripStats.pending} pending, {analytics.tripStats.inProgress} in progress
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card 
                borderRadius="xl" 
                boxShadow="sm"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stat>
                    <StatLabel fontSize={{ base: "xs", md: "sm" }}>Total Drivers</StatLabel>
                    <StatNumber fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="purple.500">
                      {analytics.driverStats.total}
                    </StatNumber>
                    <StatHelpText fontSize={{ base: "2xs", md: "xs" }}>
                      {analytics.driverStats.available} available, {analytics.driverStats.active} active
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Quick Actions - Responsive */}
            <Flex 
              direction={{ base: "column", sm: "row" }}
              gap={{ base: 3, md: 4 }}
              mb={{ base: 4, md: 6 }}
              flexWrap="wrap"
            >
              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                onClick={onTripManagementOpen}
                size={{ base: "sm", md: "md" }}
                flex={{ base: "1", sm: "0" }}
              >
                Manage Trips
              </Button>
              <Button
                leftIcon={<RepeatIcon />}
                variant="outline"
                onClick={() => fetchAnalytics(true)}
                isLoading={refreshing}
                size={{ base: "sm", md: "md" }}
                flex={{ base: "1", sm: "0" }}
              >
                Refresh Data
              </Button>
              <Spacer display={{ base: "none", sm: "block" }} />
              <HStack spacing={3} display={{ base: "none", md: "flex" }}>
                <Button size="sm" variant="outline" leftIcon={<DownloadIcon />}>
                  Export
                </Button>
              </HStack>
            </Flex>

            <Tabs variant="enclosed" colorScheme="blue">
              <TabList 
                flexWrap={{ base: "wrap", md: "nowrap" }}
                borderBottom="2px solid"
                borderColor="gray.200"
              >
                <Tab 
                  fontSize={{ base: "sm", md: "md" }}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  _selected={{ 
                    color: "blue.600", 
                    borderColor: "blue.600",
                    fontWeight: "bold"
                  }}
                >
                  Trip Analytics
                </Tab>
                <Tab 
                  fontSize={{ base: "sm", md: "md" }}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  _selected={{ 
                    color: "blue.600", 
                    borderColor: "blue.600",
                    fontWeight: "bold"
                  }}
                >
                  Driver Performance
                </Tab>
                <Tab 
                  fontSize={{ base: "sm", md: "md" }}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  _selected={{ 
                    color: "blue.600", 
                    borderColor: "blue.600",
                    fontWeight: "bold"
                  }}
                >
                  Recent Activity
                </Tab>
              </TabList>

              <TabPanels>
                {/* Trip Analytics Tab */}
                <TabPanel px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
                  <Grid 
                    templateColumns={{ 
                      base: '1fr', 
                      lg: 'repeat(2, 1fr)' 
                    }} 
                    gap={{ base: 4, md: 6, lg: 8 }}
                    w="100%"
                  >
                    {/* Weekly Stats Chart (Simple display) */}
                    <Card 
                      borderRadius="lg"
                      boxShadow="sm"
                      _hover={{ boxShadow: "md" }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={{ base: 2, md: 3 }}>
                        <Heading size={{ base: "sm", md: "md" }}>Weekly Trip Statistics</Heading>
                      </CardHeader>
                      <CardBody pt={{ base: 2, md: 4 }}>
                        <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                          {analytics.weeklyStats.map((stat) => (
                            <Box key={stat._id}>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize={{ base: "xs", md: "sm" }}>{formatDate(stat._id)}</Text>
                                <Text fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                                  {stat.completed}/{stat.count} completed
                                </Text>
                              </HStack>
                              <Progress 
                                value={stat.count > 0 ? (stat.completed / stat.count) * 100 : 0}
                                colorScheme="green"
                                size={{ base: "sm", md: "md" }}
                                borderRadius="full"
                              />
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Status Breakdown */}
                    <Card 
                      borderRadius="lg"
                      boxShadow="sm"
                      _hover={{ boxShadow: "md" }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={{ base: 2, md: 3 }}>
                        <Heading size={{ base: "sm", md: "md" }}>Trip Status Breakdown</Heading>
                      </CardHeader>
                      <CardBody pt={{ base: 2, md: 4 }}>
                        <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                          <HStack justify="space-between">
                            <Text fontSize={{ base: "sm", md: "md" }}>Completed</Text>
                            <Badge 
                              colorScheme="green" 
                              variant="solid"
                              fontSize={{ base: "xs", md: "sm" }}
                              px={{ base: 2, md: 3 }}
                              py={{ base: 0.5, md: 1 }}
                            >
                              {analytics.tripStats.completed}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize={{ base: "sm", md: "md" }}>In Progress</Text>
                            <Badge 
                              colorScheme="blue" 
                              variant="solid"
                              fontSize={{ base: "xs", md: "sm" }}
                              px={{ base: 2, md: 3 }}
                              py={{ base: 0.5, md: 1 }}
                            >
                              {analytics.tripStats.inProgress}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize={{ base: "sm", md: "md" }}>Pending</Text>
                            <Badge 
                              colorScheme="orange" 
                              variant="solid"
                              fontSize={{ base: "xs", md: "sm" }}
                              px={{ base: 2, md: 3 }}
                              py={{ base: 0.5, md: 1 }}
                            >
                              {analytics.tripStats.pending}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize={{ base: "sm", md: "md" }}>Cancelled</Text>
                            <Badge 
                              colorScheme="red" 
                              variant="solid"
                              fontSize={{ base: "xs", md: "sm" }}
                              px={{ base: 2, md: 3 }}
                              py={{ base: 0.5, md: 1 }}
                            >
                              {analytics.tripStats.cancelled}
                            </Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>

                {/* Driver Performance Tab */}
                <TabPanel px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
                  <Card 
                    borderRadius="lg"
                    boxShadow="sm"
                    _hover={{ boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardHeader pb={{ base: 2, md: 3 }}>
                      <Heading size={{ base: "sm", md: "md" }}>Driver Performance Metrics</Heading>
                    </CardHeader>
                    <CardBody pt={{ base: 2, md: 4 }}>
                      <TableContainer overflowX="auto" w="100%">
                        <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                          <Thead bg="gray.50">
                            <Tr>
                              <Th fontSize={{ base: "xs", md: "sm" }}>Driver</Th>
                              <Th isNumeric fontSize={{ base: "xs", md: "sm" }}>Total Trips</Th>
                              <Th isNumeric display={{ base: "none", md: "table-cell" }} fontSize={{ base: "xs", md: "sm" }}>Completed</Th>
                              <Th display={{ base: "none", lg: "table-cell" }} fontSize={{ base: "xs", md: "sm" }}>Completion Rate</Th>
                              <Th display={{ base: "none", lg: "table-cell" }} fontSize={{ base: "xs", md: "sm" }}>Vehicle</Th>
                              <Th display={{ base: "none", md: "table-cell" }} fontSize={{ base: "xs", md: "sm" }}>Rating</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {driverStats.map((driver) => (
                              <Tr key={driver._id}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                                      {driver.driver.firstName} {driver.driver.lastName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                      {driver.completedTrips}/{driver.totalTrips} trips
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td isNumeric>{driver.totalTrips}</Td>
                                <Td isNumeric display={{ base: "none", md: "table-cell" }}>
                                  {driver.completedTrips}
                                </Td>
                                <Td display={{ base: "none", lg: "table-cell" }}>
                                  <HStack>
                                    <Text>{Math.round(driver.completionRate)}%</Text>
                                    <Progress
                                      value={driver.completionRate}
                                      size="sm"
                                      colorScheme={driver.completionRate > 90 ? 'green' : 
                                                driver.completionRate > 70 ? 'yellow' : 'red'}
                                      width="60px"
                                    />
                                  </HStack>
                                </Td>
                                <Td display={{ base: "none", lg: "table-cell" }}>
                                  <Text fontSize="sm">
                                    {driver.driver.vehicleInfo?.make} {driver.driver.vehicleInfo?.model}
                                  </Text>
                                </Td>
                                <Td display={{ base: "none", md: "table-cell" }}>
                                  {driver.averageRating ? (
                                    <Badge colorScheme="yellow">
                                      ⭐ {driver.averageRating}
                                    </Badge>
                                  ) : (
                                    <Text fontSize="sm" color="gray.500">No ratings</Text>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Recent Activity Tab */}
                <TabPanel px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
                  <Card 
                    borderRadius="lg"
                    boxShadow="sm"
                    _hover={{ boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardHeader pb={{ base: 2, md: 3 }}>
                      <Heading size={{ base: "sm", md: "md" }}>Recent System Activity</Heading>
                    </CardHeader>
                    <CardBody pt={{ base: 2, md: 4 }}>
                      <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
                        {analytics.recentActivity.map((activity) => (
                          <Box 
                            key={activity._id} 
                            p={{ base: 3, md: 4 }} 
                            bg="gray.50" 
                            rounded="lg"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            <Flex 
                              direction={{ base: "column", sm: "row" }}
                              justify={{ base: "start", sm: "space-between" }}
                              gap={{ base: 2, sm: 0 }}
                            >
                              <VStack align="start" spacing={0} flex={1}>
                                <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                                  {activity.userId ? 
                                    `${activity.userId.firstName} ${activity.userId.lastName}` : 
                                    'System'}
                                </Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                                  {activity.description}
                                </Text>
                              </VStack>
                              <VStack 
                                align={{ base: "start", sm: "end" }} 
                                spacing={1}
                                minW={{ base: "auto", sm: "150px" }}
                              >
                                <Badge 
                                  colorScheme="blue"
                                  fontSize={{ base: "2xs", md: "xs" }}
                                  px={{ base: 2, md: 2 }}
                                >
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.500">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </Text>
                              </VStack>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {/* Trip Management Modal */}
      <TripManagementModal
        isOpen={isTripManagementOpen}
        onClose={onTripManagementClose}
        onTripUpdate={() => fetchAnalytics(false)}
      />
    </>
  );
};

export default AdminDashboard;