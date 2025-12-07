import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Spinner,
  Center,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Flex,
  SimpleGrid,
  useColorModeValue,
  CircularProgress,
  CircularProgressLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import TripManagementModal from './TripManagementModal';

const SchedulerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Color mode
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.data?.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trips',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Auto-open modal if URL parameter present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openModal') === 'true') {
      onOpen();
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('openModal');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, onOpen]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });

    const upcomingTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      return tripDate >= tomorrow;
    });

    const pendingTrips = trips.filter(trip => trip.status === 'pending');
    const completedTrips = trips.filter(trip => trip.status === 'completed');

    const completionRate = trips.length > 0 
      ? ((completedTrips.length / trips.length) * 100).toFixed(1)
      : 0;

    return {
      todaysTrips: todaysTrips.length,
      upcomingTrips: upcomingTrips.length,
      pendingTrips: pendingTrips.length,
      completedTrips: completedTrips.length,
      completionRate
    };
  }, [trips]);

  // Filtered trips based on tab and search
  const filteredTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = trips;

    // Filter by tab
    switch (activeTab) {
      case 0: // Today
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate.getTime() === today.getTime();
        });
        break;
      case 1: // Upcoming
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          return tripDate >= tomorrow;
        });
        break;
      case 2: // Pending
        filtered = filtered.filter(trip => trip.status === 'pending');
        break;
      case 3: // All
      default:
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.riderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickupLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.dropoffLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    return filtered;
  }, [trips, activeTab, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Center h="50vh">
          <Spinner size="xl" color="green.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar />
      
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Scheduler Control Center</Heading>
            <Text color="gray.600">
              Schedule trips, manage bookings, and coordinate transportation operations
            </Text>
          </Box>

          {/* Quick Actions Dropdown */}
          <Box>
            <Menu>
              <Tooltip label="Quick Actions" placement="right">
                <MenuButton
                  as={Button}
                  rightIcon={<Box as={ChevronDownIcon} w={5} h={5} />}
                  leftIcon={<Box as={Cog6ToothIcon} w={5} h={5} />}
                  size="md"
                  variant="solid"
                  colorScheme="green"
                >
                  Quick Actions
                </MenuButton>
              </Tooltip>
              <MenuList>
                <MenuItem 
                  icon={<Box as={PlusIcon} w={5} h={5} />}
                  onClick={onOpen}
                >
                  Schedule New Trip
                </MenuItem>
                <MenuItem 
                  icon={<Box as={CalendarDaysIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler/calendar')}
                >
                  Calendar View
                </MenuItem>
                <MenuItem 
                  icon={<Box as={MapPinIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler/recurring-trips')}
                >
                  Recurring Trips
                </MenuItem>
                
                <MenuDivider />
                
                <MenuItem 
                  icon={<Box as={UserGroupIcon} w={5} h={5} />}
                  onClick={() => navigate('/riders?tab=all-riders')}
                >
                  All Riders
                </MenuItem>
                <MenuItem 
                  icon={<Box as={ArrowPathIcon} w={5} h={5} />}
                  onClick={fetchTrips}
                >
                  Refresh Data
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>

          {/* Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={cardBg} borderLeft="4px solid" borderLeftColor="green.500">
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <Box as={CalendarDaysIconSolid} w={5} h={5} color="green.500" />
                    <CircularProgress 
                      value={stats.todaysTrips > 0 ? 100 : 0} 
                      size="32px" 
                      color="green.500"
                    />
                  </HStack>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="green.600">
                    {stats.todaysTrips}
                  </StatNumber>
                  <StatLabel fontSize="sm" color="gray.600">
                    Today's Trips
                  </StatLabel>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderLeft="4px solid" borderLeftColor="blue.500">
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <Box as={ClockIconSolid} w={5} h={5} color="blue.500" />
                  </HStack>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="blue.600">
                    {stats.upcomingTrips}
                  </StatNumber>
                  <StatLabel fontSize="sm" color="gray.600">
                    Upcoming Trips
                  </StatLabel>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderLeft="4px solid" borderLeftColor="orange.500">
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <Box as={ClockIcon} w={5} h={5} color="orange.500" />
                  </HStack>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="orange.600">
                    {stats.pendingTrips}
                  </StatNumber>
                  <StatLabel fontSize="sm" color="gray.600">
                    Pending Trips
                  </StatLabel>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderLeft="4px solid" borderLeftColor="green.400">
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <Box as={CheckCircleIconSolid} w={5} h={5} color="green.400" />
                  </HStack>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="green.500">
                    {stats.completedTrips}
                  </StatNumber>
                  <StatLabel fontSize="sm" color="gray.600">
                    Completed
                  </StatLabel>
                  <StatHelpText fontSize="xs" color="green.500">
                    {stats.completionRate}% rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters and Search */}
          <Card bg={cardBg}>
            <CardBody>
              <Flex gap={4} flexWrap="wrap">
                <InputGroup flex={1} minW="200px">
                  <InputLeftElement>
                    <Box as={MagnifyingGlassIcon} w={4} h={4} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  w={{ base: 'full', md: '200px' }}
                  icon={<Box as={FunnelIcon} w={4} h={4} />}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </Flex>
            </CardBody>
          </Card>

          {/* Trips Table with Tabs */}
          <Card bg={cardBg}>
            <CardBody>
              <Tabs index={activeTab} onChange={setActiveTab} colorScheme="green">
                <TabList>
                  <Tab>Today ({stats.todaysTrips})</Tab>
                  <Tab>Upcoming ({stats.upcomingTrips})</Tab>
                  <Tab>Pending ({stats.pendingTrips})</Tab>
                  <Tab>All Trips ({trips.length})</Tab>
                </TabList>

                <TabPanels>
                  {[0, 1, 2, 3].map((tabIndex) => (
                    <TabPanel key={tabIndex} px={0}>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Date/Time</Th>
                              <Th>Rider</Th>
                              <Th>Pickup</Th>
                              <Th>Dropoff</Th>
                              <Th>Status</Th>
                              <Th>Driver</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredTrips.length === 0 ? (
                              <Tr>
                                <Td colSpan={6} textAlign="center" py={8}>
                                  <Text color="gray.500">No trips found</Text>
                                </Td>
                              </Tr>
                            ) : (
                              filteredTrips.map((trip) => (
                                <Tr key={trip._id} _hover={{ bg: 'gray.50' }}>
                                  <Td>
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="medium">
                                        {formatDate(trip.scheduledDate)}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {formatTime(trip.scheduledTime)}
                                      </Text>
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm">{trip.riderName || 'N/A'}</Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1} maxW="150px">
                                      {trip.pickupLocation?.address || 'N/A'}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" noOfLines={1} maxW="150px">
                                      {trip.dropoffLocation?.address || 'N/A'}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={getStatusColor(trip.status)} fontSize="xs">
                                      {trip.status}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm">{trip.assignedDriver?.name || 'Unassigned'}</Text>
                                  </Td>
                                </Tr>
                              ))
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Trip Management Modal */}
      <TripManagementModal
        isOpen={isOpen}
        onClose={onClose}
        onTripUpdate={fetchTrips}
      />
    </Box>
  );
};

export default SchedulerDashboard;
