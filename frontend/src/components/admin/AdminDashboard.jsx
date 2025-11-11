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

const AdminDashboard = () => {
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
      const response = await axios.get(`/analytics/dashboard?range=${dateRange}`);
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
  }, [dateRange, toast]);

  const fetchDriverStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/analytics/drivers');
      setDriverStats(response.data);
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips/recent?limit=10');
      setRecentTrips(response.data);
    } catch (error) {
      console.error('Error fetching recent trips:', error);
    }
  }, []);

  const fetchSystemAlerts = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/alerts');
      setSystemAlerts(response.data);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
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

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, fetchAnalytics]);

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
      <Box bg="gray.50">
        <Navbar title="Transportation Management - Admin Dashboard" />
        <Box pt={{ base: 4, md: 0 }}>
          <Container maxW="container.xl" py={8}>
            <Center h="60vh">
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <Text>Loading dashboard data...</Text>
              </VStack>
            </Center>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="gray.50">
      <Navbar title="Transportation Management - Admin Dashboard" />
      
      <Box pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
        {analytics && (
          <>
            {/* Overview Statistics - Responsive Grid */}
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                sm: "repeat(2, 1fr)", 
                lg: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)"
              }} 
              gap={{ base: 4, md: 6 }} 
              mb={{ base: 6, md: 8 }}
            >
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Trips</StatLabel>
                    <StatNumber>{analytics.tripStats.total}</StatNumber>
                    <StatHelpText>
                      {analytics.tripStats.today} today
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Completed Trips</StatLabel>
                    <StatNumber>{analytics.tripStats.completed}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Success rate: {analytics.tripStats.total > 0 ? 
                        Math.round((analytics.tripStats.completed / analytics.tripStats.total) * 100) : 0}%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Active Trips</StatLabel>
                    <StatNumber>
                      {analytics.tripStats.pending + analytics.tripStats.inProgress}
                    </StatNumber>
                    <StatHelpText>
                      {analytics.tripStats.pending} pending, {analytics.tripStats.inProgress} in progress
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Drivers</StatLabel>
                    <StatNumber>{analytics.driverStats.total}</StatNumber>
                    <StatHelpText>
                      {analytics.driverStats.available} available, {analytics.driverStats.active} active
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <HStack spacing={4} mb={6}>
              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                onClick={onTripManagementOpen}
                size="md"
              >
                Manage Trips
              </Button>
              <Button
                leftIcon={<RepeatIcon />}
                variant="outline"
                onClick={() => fetchAnalytics(true)}
                isLoading={refreshing}
                size="md"
              >
                Refresh Data
              </Button>
            </HStack>

            <Tabs>
              <TabList>
                <Tab>Trip Analytics</Tab>
                <Tab>Driver Performance</Tab>
                <Tab>Recent Activity</Tab>
              </TabList>

              <TabPanels>
                {/* Trip Analytics Tab */}
                <TabPanel>
                  <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {/* Weekly Stats Chart (Simple display) */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Weekly Trip Statistics</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          {analytics.weeklyStats.map((stat) => (
                            <Box key={stat._id}>
                              <HStack justify="space-between" mb={2}>
                                <Text>{formatDate(stat._id)}</Text>
                                <Text fontWeight="bold">
                                  {stat.completed}/{stat.count} completed
                                </Text>
                              </HStack>
                              <Progress 
                                value={stat.count > 0 ? (stat.completed / stat.count) * 100 : 0}
                                colorScheme="green"
                                size="sm"
                              />
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Trip Status Breakdown</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between">
                            <Text>Completed</Text>
                            <Badge colorScheme="green" variant="solid">
                              {analytics.tripStats.completed}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>In Progress</Text>
                            <Badge colorScheme="blue" variant="solid">
                              {analytics.tripStats.inProgress}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Pending</Text>
                            <Badge colorScheme="orange" variant="solid">
                              {analytics.tripStats.pending}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Cancelled</Text>
                            <Badge colorScheme="red" variant="solid">
                              {analytics.tripStats.cancelled}
                            </Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>

                {/* Driver Performance Tab */}
                <TabPanel>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Driver Performance Metrics</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Total Trips</Th>
                              <Th>Completed</Th>
                              <Th>Completion Rate</Th>
                              <Th>Vehicle</Th>
                              <Th>Rating</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {driverStats.map((driver) => (
                              <Tr key={driver._id}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">
                                      {driver.driver.firstName} {driver.driver.lastName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                      {driver.driver.phone}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>{driver.totalTrips}</Td>
                                <Td>{driver.completedTrips}</Td>
                                <Td>
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
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.driver.vehicleInfo?.make} {driver.driver.vehicleInfo?.model}
                                  </Text>
                                </Td>
                                <Td>
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
                <TabPanel>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Recent System Activity</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        {analytics.recentActivity.map((activity) => (
                          <Box key={activity._id} p={4} bg="gray.50" rounded="md">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">
                                  {activity.userId ? 
                                    `${activity.userId.firstName} ${activity.userId.lastName}` : 
                                    'System'}
                                </Text>
                                <Text fontSize="sm">{activity.description}</Text>
                              </VStack>
                              <VStack align="end" spacing={0}>
                                <Badge colorScheme="blue">
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}

        {/* Trip Management Modal */}
        <TripManagementModal
          isOpen={isTripManagementOpen}
          onClose={onTripManagementClose}
          onTripUpdate={() => fetchAnalytics(false)}
        />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;