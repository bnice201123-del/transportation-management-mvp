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
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  useToast,
  HStack,
  VStack,
  Button,
  Select,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  GridItem,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { RepeatIcon, PhoneIcon, SearchIcon, AddIcon, EditIcon, ViewIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import TripManagementModal from '../scheduler/TripManagementModal';

const DispatcherDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    pickupLocation: { address: '', lat: 0, lng: 0 },
    dropoffLocation: { address: '', lat: 0, lng: 0 },
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedDriver: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtering state - New dispatch landing page requirements
  const [displayedTrips, setDisplayedTrips] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Today, 1: Upcoming, 2: Past, 3: All
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredTrips, setFilteredTrips] = useState([]);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose
  } = useDisclosure();
  const {
    isOpen: isTripManagementOpen,
    onOpen: onTripManagementOpen,
    onClose: onTripManagementClose
  } = useDisclosure();
  
  const [tripToAssign, setTripToAssign] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const cancelRef = React.useRef();
  const toast = useToast();

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.trips || []);
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
      setRefreshing(false);
    }
  }, [toast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users?role=driver&isActive=true');
      setDrivers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchTrips();
      await fetchDrivers();
    };
    loadData();

    // Set up real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTrips();
      fetchDrivers();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTrips, fetchDrivers]);

  // Filter trips based on active tab - Dispatch Landing Page Requirements
  useEffect(() => {
    if ((trips || []).length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let filtered = [];

      switch (activeTab) {
        case 0: // Today
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
            return tripDateOnly.getTime() === today.getTime();
          });
          break;
        case 1: // Upcoming
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= tomorrow;
          });
          
          // Apply date range filter if set
          if (dateRange.start || dateRange.end) {
            filtered = filtered.filter(trip => {
              const tripDate = new Date(trip.scheduledDate);
              const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
              
              if (dateRange.start && dateRange.end) {
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                return tripDateOnly >= startDate && tripDateOnly <= endDate;
              } else if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                return tripDateOnly >= startDate;
              } else if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                return tripDateOnly <= endDate;
              }
              
              return true;
            });
          }
          break;
        case 2: // Past
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
            return tripDateOnly < today.getTime();
          });
          break;
        case 3: // All
          filtered = trips;
          break;
        default:
          filtered = trips;
      }

      // Sort by scheduled date (chronological order)
      filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      setDisplayedTrips(filtered);
    }
  }, [trips, activeTab, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    await fetchDrivers();
  };

  const assignDriver = async (tripId, driverId) => {
    try {
      await axios.post(`/trips/${tripId}/assign`, { driverId });
      toast({
        title: 'Success',
        description: 'Driver assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tripData = {
        ...formData,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
        estimatedDuration: 30, // Default 30 minutes
        // Add mock coordinates for now (will integrate with Google Maps API later)
        pickupLocation: {
          ...formData.pickupLocation,
          lat: formData.pickupLocation.lat || 40.7128, // Default to NYC coordinates
          lng: formData.pickupLocation.lng || -74.0060
        },
        dropoffLocation: {
          ...formData.dropoffLocation,
          lat: formData.dropoffLocation.lat || 40.7580, // Default to NYC coordinates  
          lng: formData.dropoffLocation.lng || -73.9855
        }
      };

      if (selectedTrip) {
        await axios.put(`/trips/${selectedTrip._id}`, tripData);
        toast({
          title: 'Success',
          description: 'Trip updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.post('/trips', tripData);
        toast({
          title: 'Success',
          description: 'Trip created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchTrips();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
    setFormData({
      riderName: '',
      riderPhone: '',
      pickupLocation: { address: '', lat: 0, lng: 0 },
      dropoffLocation: { address: '', lat: 0, lng: 0 },
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      assignedDriver: ''
    });
    setError('');
    onClose();
  };

  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    const scheduledDate = new Date(trip.scheduledDate);
    setFormData({
      riderName: trip.riderName,
      riderPhone: trip.riderPhone,
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5),
      notes: trip.notes || '',
      assignedDriver: trip.assignedDriver?._id || ''
    });
    onOpen();
  };

  const handleView = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  const handleDeleteClick = (trip) => {
    setTripToDelete(trip);
    onDeleteOpen();
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/trips/${tripToDelete._id}`);
      toast({
        title: 'Success',
        description: 'Trip cancelled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
      onDeleteClose();
      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel trip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignClick = (trip) => {
    setTripToAssign(trip);
    // Pre-select current driver if reassigning
    setSelectedDriverId(trip.assignedDriver?._id || '');
    onAssignOpen();
  };

  const handleAssignDriver = async () => {
    if (!tripToAssign || !selectedDriverId) return;
    
    setIsAssigning(true);
    try {
      await axios.post(`/trips/${tripToAssign._id}/assign`, { driverId: selectedDriverId });
      toast({
        title: 'Success',
        description: 'Driver assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
      onAssignClose();
      setTripToAssign(null);
      setSelectedDriverId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'assigned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLocationText = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) return location.address;
    return 'Location not specified';
  };

  if (loading) {
    return (
      <Box>
        <Navbar title="Dispatcher Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  // Filter trips by status for statistics
  const activeTrips = (trips || []).filter(trip => 
    ['pending', 'assigned', 'in_progress'].includes(trip.status)
  );
  const completedTrips = (trips || []).filter(trip => trip.status === 'completed');
  const availableDrivers = (drivers || []).filter(driver => driver.isAvailable);
  const busyDrivers = (drivers || []).filter(driver => !driver.isAvailable);
  
  // Statistics for displayed trips only
  const displayedActiveTrips = (displayedTrips || []).filter(trip => 
    ['pending', 'assigned', 'in_progress'].includes(trip.status)
  );
  const displayedAssignedTrips = (displayedTrips || []).filter(trip => trip.assignedDriver);
  const displayedUnassignedTrips = (displayedTrips || []).filter(trip => !trip.assignedDriver);

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Dispatcher Dashboard" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
        {/* Statistics Cards - Dispatch Landing Page */}
        <Grid templateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap={6} mb={8}>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {trips.length}
              </Text>
              <Text color="gray.600" fontSize="sm">Total Trips</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {trips.filter(trip => trip.status === 'completed').length}
              </Text>
              <Text color="gray.600" fontSize="sm">Completed</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {trips.filter(trip => trip.status === 'in_progress').length}
              </Text>
              <Text color="gray.600" fontSize="sm">In Progress</Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {availableDrivers.length}
              </Text>
              <Text color="gray.600" fontSize="sm">Available Drivers</Text>
            </CardBody>
          </Card>
        </Grid>

        {/* Dispatch Landing Page Header */}
        <Card mb={6} bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
          <CardBody>
            <VStack align="start" spacing={3}>
              <Heading size="lg" color="blue.700">
                Dispatch Control Center
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Manage today's rides, assign drivers, and track trip status
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Tabbed Interface */}
        <Tabs index={activeTab} onChange={setActiveTab} mb={6}>
          <TabList>
            <Tab>Today</Tab>
            <Tab>Upcoming</Tab>
            <Tab>Past</Tab>
            <Tab>All</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {/* Today's Dashboard */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Today's Rides</Heading>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} rides
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Today's Statistics */}
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                      <Card bg="green.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'completed').length}
                          </Text>
                          <Text fontSize="sm" color="green.700">Completed Today</Text>
                        </CardBody>
                      </Card>
                      <Card bg="orange.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'in_progress').length}
                          </Text>
                          <Text fontSize="sm" color="orange.700">In Progress</Text>
                        </CardBody>
                      </Card>
                      <Card bg="blue.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'assigned').length}
                          </Text>
                          <Text fontSize="sm" color="blue.700">Assigned</Text>
                        </CardBody>
                      </Card>
                      <Card bg="red.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="red.600">
                            {(displayedTrips || []).filter(trip => !trip.assignedDriver).length}
                          </Text>
                          <Text fontSize="sm" color="red.700">Need Driver</Text>
                        </CardBody>
                      </Card>
                    </Grid>

                    {/* Today's Trips Table */}
                    <Card>
                      <CardBody p={0}>
                        <TableContainer overflowX="auto">
                          <Table variant="simple" size={{ base: "sm", md: "md" }}>
                            <Thead>
                              <Tr>
                                <Th minW="80px">Trip ID</Th>
                                <Th minW="120px">Rider</Th>
                                <Th minW="200px" display={{ base: "none", md: "table-cell" }}>Route</Th>
                                <Th minW="140px" display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                                <Th minW="120px">Driver</Th>
                                <Th minW="100px">Status</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {displayedTrips.map((trip) => (
                                <Tr key={trip._id}>
                                  <Td>{trip.tripId}</Td>
                                  <Td>
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm">{trip.riderName}</Text>
                                      {trip.riderPhone && (
                                        <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                          {trip.riderPhone}
                                        </Text>
                                      )}
                                    </VStack>
                                  </Td>
                                  <Td display={{ base: "none", md: "table-cell" }}>
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                      <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                                    </VStack>
                                  </Td>
                                  <Td display={{ base: "none", lg: "table-cell" }}>
                                    <Text fontSize="xs">
                                      {formatDate(trip.scheduledDate)}
                                    </Text>
                                  </Td>
                                  <Td>
                                    {trip.assignedDriver ? (
                                      <VStack align="start" spacing={1}>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm">
                                            {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                          </Text>
                                          {trip.assignedDriver.phone && (
                                            <Text fontSize="xs" color="gray.500">
                                              {trip.assignedDriver.phone}
                                            </Text>
                                          )}
                                        </VStack>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          colorScheme="blue"
                                          onClick={() => handleAssignClick(trip)}
                                        >
                                          Reassign
                                        </Button>
                                      </VStack>
                                    ) : (
                                      <Button
                                        size="sm"
                                        colorScheme="green"
                                        onClick={() => handleAssignClick(trip)}
                                        disabled={availableDrivers.length === 0}
                                      >
                                        Assign Driver
                                      </Button>
                                    )}
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                      {trip.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                      <IconButton
                                        icon={<ViewIcon />}
                                        size="xs"
                                        colorScheme="blue"
                                        onClick={() => handleView(trip)}
                                        aria-label="View trip"
                                        title="View trip details"
                                      />
                                      <IconButton
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme="yellow"
                                        onClick={() => handleEdit(trip)}
                                        aria-label="Edit trip"
                                        title="Edit trip"
                                      />
                                      {!trip.assignedDriver && (
                                        <Button
                                          size="xs"
                                          colorScheme="green"
                                          onClick={() => handleAssignClick(trip)}
                                          disabled={availableDrivers.length === 0}
                                        >
                                          Assign
                                        </Button>
                                      )}
                                      <IconButton
                                        icon={<DeleteIcon />}
                                        size="xs"
                                        colorScheme="red"
                                        onClick={() => handleDeleteClick(trip)}
                                        aria-label="Cancel trip"
                                        title="Cancel trip"
                                      />
                                      {trip.riderPhone && (
                                        <IconButton
                                          icon={<PhoneIcon />}
                                          size="xs"
                                          colorScheme="green"
                                          aria-label="Call rider"
                                          title="Call rider"
                                        />
                                      )}
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                        {displayedTrips.length === 0 && (
                          <Center py={8}>
                            <VStack spacing={3}>
                              <Text color="gray.500" fontSize="lg">No rides scheduled for today</Text>
                              <Text color="gray.400" fontSize="sm">Today's rides will appear here</Text>
                            </VStack>
                          </Center>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* Upcoming Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Upcoming Trips</Heading>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto">
                    <Table variant="simple" size={{ base: "sm", md: "md" }}>
                      <Thead>
                        <Tr>
                          <Th minW="80px">Trip ID</Th>
                          <Th minW="120px">Rider</Th>
                          <Th minW="200px" display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th minW="140px" display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th minW="120px">Driver</Th>
                          <Th minW="100px">Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>{trip.tripId}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{trip.riderName}</Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={1}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">
                                      {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                    </Text>
                                    {trip.assignedDriver.phone && (
                                      <Text fontSize="xs" color="gray.500">
                                        {trip.assignedDriver.phone}
                                      </Text>
                                    )}
                                  </VStack>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleAssignClick(trip)}
                                  >
                                    Reassign
                                  </Button>
                                </VStack>
                              ) : (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleAssignClick(trip)}
                                  disabled={availableDrivers.length === 0}
                                >
                                  Assign Driver
                                </Button>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                                <IconButton
                                  icon={<EditIcon />}
                                  size="xs"
                                  colorScheme="yellow"
                                  onClick={() => handleEdit(trip)}
                                  aria-label="Edit trip"
                                  title="Edit trip"
                                />
                                {!trip.assignedDriver && (
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAssignClick(trip)}
                                    disabled={availableDrivers.length === 0}
                                  >
                                    Assign
                                  </Button>
                                )}
                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => handleDeleteClick(trip)}
                                  aria-label="Cancel trip"
                                  title="Cancel trip"
                                />
                                {trip.riderPhone && (
                                  <IconButton
                                    icon={<PhoneIcon />}
                                    size="xs"
                                    colorScheme="green"
                                    aria-label="Call rider"
                                    title="Call rider"
                                  />
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No upcoming trips found</Text>
                        <Text color="gray.400" fontSize="sm">Future trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* Past Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Past Trips</Heading>
                    <Badge colorScheme="gray" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto">
                    <Table variant="simple" size={{ base: "sm", md: "md" }}>
                      <Thead>
                        <Tr>
                          <Th minW="80px">Trip ID</Th>
                          <Th minW="120px">Rider</Th>
                          <Th minW="200px" display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th minW="140px" display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th minW="120px">Driver</Th>
                          <Th minW="100px">Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>{trip.tripId}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{trip.riderName}</Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm">
                                    {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                  </Text>
                                  {trip.assignedDriver.phone && (
                                    <Text fontSize="xs" color="gray.500">
                                      {trip.assignedDriver.phone}
                                    </Text>
                                  )}
                                </VStack>
                              ) : (
                                <Text fontSize="sm" color="gray.500">No driver assigned</Text>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No past trips found</Text>
                        <Text color="gray.400" fontSize="sm">Completed trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* All Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">All Trips</Heading>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto">
                    <Table variant="simple" size={{ base: "sm", md: "md" }}>
                      <Thead>
                        <Tr>
                          <Th minW="80px">Trip ID</Th>
                          <Th minW="120px">Rider</Th>
                          <Th minW="200px" display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th minW="140px" display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th minW="120px">Driver</Th>
                          <Th minW="100px">Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>{trip.tripId}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{trip.riderName}</Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={1}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">
                                      {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                    </Text>
                                    {trip.assignedDriver.phone && (
                                      <Text fontSize="xs" color="gray.500">
                                        {trip.assignedDriver.phone}
                                      </Text>
                                    )}
                                  </VStack>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleAssignClick(trip)}
                                  >
                                    Reassign
                                  </Button>
                                </VStack>
                              ) : (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleAssignClick(trip)}
                                  disabled={availableDrivers.length === 0}
                                >
                                  Assign Driver
                                </Button>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                                <IconButton
                                  icon={<EditIcon />}
                                  size="xs"
                                  colorScheme="yellow"
                                  onClick={() => handleEdit(trip)}
                                  aria-label="Edit trip"
                                  title="Edit trip"
                                />
                                {!trip.assignedDriver && (
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAssignClick(trip)}
                                    disabled={availableDrivers.length === 0}
                                  >
                                    Assign
                                  </Button>
                                )}
                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => handleDeleteClick(trip)}
                                  aria-label="Cancel trip"
                                  title="Cancel trip"
                                />
                                {trip.riderPhone && (
                                  <IconButton
                                    icon={<PhoneIcon />}
                                    size="xs"
                                    colorScheme="green"
                                    aria-label="Call rider"
                                    title="Call rider"
                                  />
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No trips found</Text>
                        <Text color="gray.400" fontSize="sm">All trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Action Buttons */}
        <HStack mb={6} justify="space-between" wrap="wrap">
          <HStack>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
              Create New Trip
            </Button>
            <Button
              leftIcon={<SearchIcon />}
              colorScheme="green"
              variant="outline"
              onClick={onTripManagementOpen}
            >
              Manage Trips
            </Button>
            <Button
              leftIcon={<RepeatIcon />}
              onClick={handleRefresh}
              isLoading={refreshing}
              loadingText="Refreshing..."
            >
              Refresh
            </Button>
          </HStack>
          
          {/* Date Filter for Upcoming Tab */}
          {activeTab === 1 && (
            <HStack>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>From Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </FormControl>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={1}>To Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </FormControl>
              <Button
                size="sm"
                colorScheme="gray"
                variant="outline"
                onClick={() => setDateRange({ start: '', end: '' })}
              >
                Clear
              </Button>
            </HStack>
          )}
        </HStack>

        {/* Driver Status - Full Width Row */}
        <Card>
          <CardHeader>
            <Heading size="md">Driver Status</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={{ base: 4, md: 6 }}>
              {/* Available Drivers */}
              <Box>
                <Text fontWeight="bold" color="green.600" mb={4} fontSize={{ base: "md", md: "lg" }}>
                  Available Drivers ({availableDrivers.length})
                </Text>
                <VStack spacing={3} align="stretch">
                  {availableDrivers.map((driver) => (
                    <Box key={driver._id} p={3} bg="green.50" rounded="lg" border="1px solid" borderColor="green.200">
                      <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                        <VStack align="start" spacing={1} flex="1" minW="0">
                          <Text fontSize="sm" fontWeight="medium" isTruncated>
                            {driver.firstName} {driver.lastName}
                          </Text>
                          <Text fontSize="xs" color="gray.600" isTruncated>
                            {driver.email}
                          </Text>
                          {driver.vehicleInfo && (
                            <Text fontSize="xs" color="gray.600" isTruncated>
                              {driver.vehicleInfo.make} {driver.vehicleInfo.model}
                            </Text>
                          )}
                        </VStack>
                        {driver.phone && (
                          <IconButton
                            icon={<PhoneIcon />}
                            size="sm"
                            colorScheme="green"
                            flexShrink={0}
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                          />
                        )}
                      </HStack>
                    </Box>
                  ))}
                  {availableDrivers.length === 0 && (
                    <Box p={4} bg="gray.50" rounded="lg" textAlign="center">
                      <Text fontSize="sm" color="gray.500">No available drivers</Text>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Busy Drivers */}
              <Box>
                <Text fontWeight="bold" color="orange.600" mb={4} fontSize="lg">
                  Busy Drivers ({busyDrivers.length})
                </Text>
                <VStack spacing={3} align="stretch">
                  {busyDrivers.map((driver) => (
                    <Box key={driver._id} p={3} bg="orange.50" rounded="lg" border="1px solid" borderColor="orange.200">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {driver.firstName} {driver.lastName}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {driver.email}
                          </Text>
                          {driver.vehicleInfo && (
                            <Text fontSize="xs" color="gray.600">
                              {driver.vehicleInfo.make} {driver.vehicleInfo.model}
                            </Text>
                          )}
                        </VStack>
                        {driver.phone && (
                          <IconButton
                            icon={<PhoneIcon />}
                            size="sm"
                            colorScheme="orange"
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                          />
                        )}
                      </HStack>
                    </Box>
                  ))}
                  {busyDrivers.length === 0 && (
                    <Box p={4} bg="gray.50" rounded="lg" textAlign="center">
                      <Text fontSize="sm" color="gray.500">No busy drivers</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Grid>
          </CardBody>
        </Card>

        {/* Create/Edit Trip Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {selectedTrip ? 'Edit Trip' : 'Create New Trip'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {error && (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Rider Name</FormLabel>
                      <Input
                        value={formData.riderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, riderName: e.target.value }))}
                        placeholder="Enter rider name"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Rider Phone</FormLabel>
                      <Input
                        value={formData.riderPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, riderPhone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl isRequired mt={4}>
                  <FormLabel>Pickup Location</FormLabel>
                  <Input
                    value={formData.pickupLocation.address}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      pickupLocation: { ...prev.pickupLocation, address: e.target.value }
                    }))}
                    placeholder="Enter pickup address"
                  />
                </FormControl>

                <FormControl isRequired mt={4}>
                  <FormLabel>Dropoff Location</FormLabel>
                  <Input
                    value={formData.dropoffLocation.address}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dropoffLocation: { ...prev.dropoffLocation, address: e.target.value }
                    }))}
                    placeholder="Enter dropoff address"
                  />
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={4}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Scheduled Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Scheduled Time</FormLabel>
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl mt={4}>
                  <FormLabel>Assign Driver</FormLabel>
                  <Select
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedDriver: e.target.value }))}
                    placeholder="Select a driver (optional)"
                  >
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.firstName} {driver.lastName} - {driver.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText={selectedTrip ? "Updating..." : "Creating..."}
                >
                  {selectedTrip ? 'Update Trip' : 'Create Trip'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* View Trip Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Trip Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedTrip && (
                <VStack align="start" spacing={3}>
                  <Text><strong>Trip ID:</strong> {selectedTrip.tripId}</Text>
                  <Text><strong>Rider:</strong> {selectedTrip.riderName}</Text>
                  {selectedTrip.riderPhone && (
                    <Text><strong>Phone:</strong> {selectedTrip.riderPhone}</Text>
                  )}
                  <Text><strong>Pickup:</strong> {selectedTrip.pickupLocation.address}</Text>
                  <Text><strong>Dropoff:</strong> {selectedTrip.dropoffLocation.address}</Text>
                  <Text><strong>Scheduled:</strong> {formatDate(selectedTrip.scheduledDate)}</Text>
                  <Text><strong>Assigned Driver:</strong> {
                    selectedTrip.assignedDriver ? 
                      `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}` : 
                      'Unassigned'
                  }</Text>
                  <Text><strong>Status:</strong> 
                    <Badge ml={2} colorScheme={getStatusColor(selectedTrip.status)}>
                      {selectedTrip.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </Text>
                  {selectedTrip.notes && (
                    <Text><strong>Notes:</strong> {selectedTrip.notes}</Text>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onViewClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Cancel Trip
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to cancel this trip for{" "}
                <strong>{tripToDelete?.riderName}</strong>?
                <br />
                <br />
                <strong>Trip ID:</strong> {tripToDelete?.tripId}
                <br />
                <br />
                This will mark the trip as cancelled and cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteTrip} 
                  ml={3}
                  isLoading={isDeleting}
                  loadingText="Cancelling..."
                >
                  Cancel Trip
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Assign Driver Modal */}
        <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {tripToAssign?.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {tripToAssign && (
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg="gray.50" rounded="md">
                    <Text><strong>Trip ID:</strong> {tripToAssign.tripId}</Text>
                    <Text><strong>Rider:</strong> {tripToAssign.riderName}</Text>
                    <Text><strong>Pickup:</strong> {tripToAssign.pickupLocation.address}</Text>
                    <Text><strong>Dropoff:</strong> {tripToAssign.dropoffLocation.address}</Text>
                    <Text><strong>Scheduled:</strong> {formatDate(tripToAssign.scheduledDate)}</Text>
                  </Box>
                  
                  {tripToAssign?.assignedDriver && (
                    <Box p={3} bg="blue.50" rounded="md">
                      <Text fontSize="sm" fontWeight="medium" color="blue.700">
                        Currently assigned to: {tripToAssign.assignedDriver.firstName} {tripToAssign.assignedDriver.lastName}
                      </Text>
                    </Box>
                  )}
                  
                  <FormControl isRequired>
                    <FormLabel>Select Driver</FormLabel>
                    <Select
                      placeholder="Choose a driver"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                    >
                      {/* Show available drivers first */}
                      {availableDrivers.length > 0 && (
                        <optgroup label="Available Drivers">
                          {availableDrivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.firstName} {driver.lastName} - {driver.email}
                              {driver.vehicleInfo && ` (${driver.vehicleInfo.make} ${driver.vehicleInfo.model})`}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {/* Show all drivers for reassignment */}
                      {tripToAssign?.assignedDriver && (
                        <optgroup label="All Drivers">
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.firstName} {driver.lastName} - {driver.email}
                              {driver.vehicleInfo && ` (${driver.vehicleInfo.make} ${driver.vehicleInfo.model})`}
                              {!driver.isAvailable ? ' (Busy)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </Select>
                  </FormControl>
                  
                  {!tripToAssign?.assignedDriver && availableDrivers.length === 0 && (
                    <Alert status="warning">
                      <AlertIcon />
                      No available drivers at this time.
                    </Alert>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAssignClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleAssignDriver}
                isLoading={isAssigning}
                loadingText={tripToAssign?.assignedDriver ? "Reassigning..." : "Assigning..."}
                disabled={!selectedDriverId || (!tripToAssign?.assignedDriver && availableDrivers.length === 0)}
              >
                {tripToAssign?.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Trip Management Modal */}
        <TripManagementModal
          isOpen={isTripManagementOpen}
          onClose={onTripManagementClose}
          onTripUpdate={fetchTrips}
        />
        </Container>
      </Box>
    </Box>
  );
};

export default DispatcherDashboard;