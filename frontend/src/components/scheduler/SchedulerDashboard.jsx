import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
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
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
import { AddIcon, EditIcon, ViewIcon, DeleteIcon, RepeatIcon, SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import axios from 'axios';
import '../../config/axios';
import Navbar from '../shared/Navbar';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import TripManagement from './TripManagement';
import TripManagementModal from './TripManagementModal';
import CalendarOverview from './CalendarOverview';

const SchedulerDashboard = ({ view }) => {
  const location = useLocation();
  const isManageView = view === 'manage' || location.pathname.includes('/manage') || location.search.includes('view=manage');
  const isCalendarView = view === 'calendar' || location.pathname.includes('/calendar') || location.search.includes('view=calendar');
  
  const [trips, setTrips] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  // Fixed: removed drivers state as schedulers now only assign to dispatchers
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedDriver: '',

  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    isOpen: isTripManagementOpen,
    onOpen: onTripManagementOpen,
    onClose: onTripManagementClose
  } = useDisclosure();
  
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  
  // Filtering state
  const [activeTab, setActiveTab] = useState(0); // 0: Today, 1: Upcoming, 2: Past, 3: All
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredTrips, setFilteredTrips] = useState([]);
  
  const cancelRef = React.useRef();
  const toast = useToast();



  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.trips);
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

  const fetchDispatchers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/dispatchers/available');
      setDispatchers(response.data);
    } catch (error) {
      console.error('Error fetching dispatchers:', error);
    }
  }, []);



  useEffect(() => {
    const loadData = async () => {
      await fetchTrips();
      await fetchDispatchers();
    };
    loadData();
  }, [fetchTrips, fetchDispatchers]);

  // Update date and time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Filter trips based on selected tab and filters
  useEffect(() => {
    const filterTrips = () => {
      let filtered = [...(trips || [])];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter by tab (time period)
      switch (activeTab) {
        case 0: // Today
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= today && tripDate < tomorrow;
          });
          break;
        case 1: // Upcoming (future)
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= tomorrow;
          });
          break;
        case 2: // Past
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate < today;
          });
          break;
        case 3: // All trips
        default:
          // No time filtering
          break;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(trip => 
          trip.riderName?.toLowerCase().includes(searchLower) ||
          trip.tripId?.toLowerCase().includes(searchLower) ||
          trip.riderPhone?.includes(searchTerm) ||
          trip.pickupLocation?.address?.toLowerCase().includes(searchLower) ||
          trip.dropoffLocation?.address?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by status
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(trip => trip.status === statusFilter);
      }

      // Filter by date range
      if (dateRange.start || dateRange.end) {
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          const startDate = dateRange.start ? new Date(dateRange.start) : null;
          const endDate = dateRange.end ? new Date(dateRange.end) : null;
          
          if (startDate && endDate) {
            return tripDate >= startDate && tripDate <= endDate;
          } else if (startDate) {
            return tripDate >= startDate;
          } else if (endDate) {
            return tripDate <= endDate;
          }
          return true;
        });
      }

      setFilteredTrips(filtered);
    };

    filterTrips();
  }, [trips, activeTab, searchTerm, statusFilter, dateRange]);

  // Trips Table Component
  const TripsTable = ({ trips, showPattern, onView, onEdit, onDelete, formatDate, getStatusColor }) => (
    <TableContainer overflowX="auto">
      <Table variant="simple" size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>Trip ID</Th>
            <Th>Rider</Th>
            <Th>Pickup</Th>
            <Th>Dropoff</Th>
            <Th>{showPattern ? "Pattern" : "Scheduled"}</Th>
            <Th>Dispatcher</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {(trips || []).length === 0 ? (
            <Tr>
              <Td colSpan={8} textAlign="center" py={8}>
                <Text color="gray.500">No trips found</Text>
              </Td>
            </Tr>
          ) : (
            (trips || []).map((trip) => (
              <Tr key={trip._id}>
                <Td>{trip.tripId?.substring(0, 8)}</Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text>{trip.riderName}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {trip.riderPhone}
                    </Text>
                  </VStack>
                </Td>
                <Td>{trip.pickupLocation.address}</Td>
                <Td>{trip.dropoffLocation.address}</Td>
                <Td>
                  {showPattern && trip.patternDescription ? (
                    <Text fontSize="sm" color="blue.600">
                      {trip.patternDescription}
                    </Text>
                  ) : (
                    formatDate(trip.scheduledDate)
                  )}
                </Td>
                <Td>
                  {trip.assignedDriver ? 
                    `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 
                    'Unassigned'
                  }
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(trip.status)}>
                    {trip.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={{ base: 1, md: 2 }}>
                    <IconButton
                      icon={<ViewIcon />}
                      size="sm"
                      onClick={() => onView(trip)}
                      aria-label="View trip"
                    />
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => onEdit(trip)}
                      aria-label="Edit trip"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => onDelete(trip)}
                      aria-label="Delete trip"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );

  const formatDateTime = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
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
      pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      assignedDriver: ''
    });
    setError('');
    onClose();
  };

  const openEditModal = (trip) => {
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

  const openViewModal = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  const openDeleteDialog = (trip) => {
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
      fetchTrips(); // Refresh the trips list
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

  if (loading) {
    return (
      <Box>
        <Navbar title="Scheduler Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  // Get today's and upcoming trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrips = (trips || []).filter(trip => {
    const tripDate = new Date(trip.scheduledDate);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate.getTime() === today.getTime();
  });

  const pendingTrips = (trips || []).filter(trip => trip.status === 'pending');
  const completedTrips = (trips || []).filter(trip => trip.status === 'completed');

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Scheduler Dashboard" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container 
          maxW="container.xl" 
          py={{ base: 4, md: 6 }} 
          px={{ base: 4, md: 6, lg: 8 }}
        >
          {/* Conditional rendering for different views */}
          {isManageView ? (
            <TripManagement onTripUpdate={fetchTrips} />
          ) : isCalendarView ? (
            <CalendarOverview onTripUpdate={fetchTrips} />
          ) : (
            <>
          {/* Scheduler Landing Page Header */}
          <Card mb={6} bg="green.50" borderLeft="4px solid" borderLeftColor="green.500">
            <CardBody>
              <VStack align="start" spacing={3}>
                <Heading size="lg" color="green.700">
                  Scheduler Control Center
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Create, schedule, and manage all transportation trips. Access recurring trips and ride history from here.
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          {/* Date and Time Display */}
          <Heading 
            as="h3" 
            size={{ base: "sm", sm: "md", lg: "lg" }} 
            textAlign="center" 
            mb={{ base: 4, md: 6 }} 
            color="gray.600"
            fontWeight="medium"
          >
            {formatDateTime(currentDateTime)}
          </Heading>
          
          {/* Statistics Cards - Responsive Grid */}
          <Grid 
            templateColumns={{ 
              base: "1fr", 
              sm: "repeat(2, 1fr)", 
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)"
            }} 
            gap={{ base: 3, md: 6 }} 
            mb={{ base: 6, md: 8 }}
          >
            <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack align="start" spacing={2}>
                  <Text 
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} 
                    fontWeight="bold" 
                    color="blue.500"
                  >
                    {todayTrips.length}
                  </Text>
                  <Text 
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="medium"
                  >
                    Today's Trips
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack align="start" spacing={2}>
                  <Text 
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} 
                    fontWeight="bold" 
                    color="orange.500"
                  >
                    {pendingTrips.length}
                  </Text>
                  <Text 
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="medium"
                  >
                    Pending Trips
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack align="start" spacing={2}>
                  <Text 
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} 
                    fontWeight="bold" 
                    color="green.500"
                  >
                    {completedTrips.length}
                  </Text>
                  <Text 
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="medium"
                  >
                    Completed Trips
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack align="start" spacing={2}>
                  <Text 
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} 
                    fontWeight="bold" 
                    color="purple.500"
                  >
                    {dispatchers.length}
                  </Text>
                  <Text 
                    fontSize={{ base: "sm", md: "md" }}
                    color="gray.600"
                    fontWeight="medium"
                  >
                    Available Dispatchers
                  </Text>
                </VStack>
              </CardBody>
            </Card>
        </Grid>

          {/* Action Buttons - Responsive Stack */}
          <Flex 
            direction={{ base: "column", sm: "row" }}
            gap={{ base: 3, md: 4 }}
            mb={{ base: 6, md: 8 }}
            wrap="wrap"
          >
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="blue" 
              onClick={onOpen}
              size={{ base: "md", md: "lg" }}
              flex={{ base: "1", sm: "none" }}
            >
              <Text display={{ base: "none", sm: "block" }}>Create New Trip</Text>
              <Text display={{ base: "block", sm: "none" }}>New Trip</Text>
            </Button>

            <Button 
              leftIcon={<SearchIcon />} 
              colorScheme="green" 
              variant="outline"
              onClick={onTripManagementOpen}
              size={{ base: "md", md: "lg" }}
              flex={{ base: "1", sm: "none" }}
            >
              <Text display={{ base: "none", sm: "block" }}>Manage Trips</Text>
              <Text display={{ base: "block", sm: "none" }}>Manage</Text>
            </Button>

            <Button 
              leftIcon={<RepeatIcon />} 
              colorScheme="purple" 
              variant="outline"
              onClick={() => window.location.href = '/scheduler/recurring'}
              size={{ base: "md", md: "lg" }}
              flex={{ base: "1", sm: "none" }}
            >
              <Text display={{ base: "none", sm: "block" }}>Recurring Trips</Text>
              <Text display={{ base: "block", sm: "none" }}>Recurring</Text>
            </Button>

            <Button 
              leftIcon={<CalendarIcon />} 
              colorScheme="orange" 
              variant="outline"
              onClick={() => window.location.href = '/scheduler/history'}
              size={{ base: "md", md: "lg" }}
              flex={{ base: "1", sm: "none" }}
            >
              <Text display={{ base: "none", sm: "block" }}>Ride History</Text>
              <Text display={{ base: "block", sm: "none" }}>History</Text>
            </Button>

          </Flex>

          {/* Enhanced Trips Management with Filtering */}
          <Card shadow="md">
            <CardHeader pb={{ base: 2, md: 4 }}>
              <Flex 
                direction={{ base: "column", lg: "row" }}
                justify="space-between" 
                align={{ base: "start", lg: "center" }}
                gap={{ base: 3, lg: 4 }}
              >
                <Heading size={{ base: "md", md: "lg" }}>Trip Management</Heading>
                
                {/* Search and Filters - Responsive Layout */}
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                
                <Select
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW="150px"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </HStack>
            </Flex>
            
            {/* Date Range Filter */}
            <HStack mt={4} spacing={4} flexWrap="wrap">
              <HStack>
                <CalendarIcon color="gray.500" />
                <Text fontSize="sm" color="gray.600">Date Range:</Text>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  size="sm"
                  maxW="150px"
                />
                <Text fontSize="sm" color="gray.500">to</Text>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  size="sm"
                  maxW="150px"
                />
              </HStack>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
              >
                Clear Filters
              </Button>
            </HStack>
          </CardHeader>
          
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
              <TabList>
                <Tab>Today ({(trips || []).filter(trip => {
                  const tripDate = new Date(trip.scheduledDate);
                  const today = new Date();
                  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const todayEnd = new Date(todayStart);
                  todayEnd.setDate(todayEnd.getDate() + 1);
                  return tripDate >= todayStart && tripDate < todayEnd;
                }).length})</Tab>
                <Tab>Upcoming ({(trips || []).filter(trip => {
                  const tripDate = new Date(trip.scheduledDate);
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tripDate >= tomorrow;
                }).length})</Tab>
                <Tab>Past ({(trips || []).filter(trip => {
                  const tripDate = new Date(trip.scheduledDate);
                  const today = new Date();
                  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  return tripDate < todayStart;
                }).length})</Tab>
                <Tab>All Trips ({(trips || []).length})</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
            </>
          )}
        </Container>
      </Box>

      {/* Create/Edit Trip Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTrip ? `Edit Trip - ${selectedTrip.tripId}` : 'Create New Trip'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              <VStack spacing={4}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
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

                <FormControl isRequired>
                  <FormLabel>Pickup Location</FormLabel>
                  <PlacesAutocomplete
                    value={formData.pickupLocation.address}
                    onChange={(address) => setFormData(prev => ({ 
                      ...prev, 
                      pickupLocation: { ...prev.pickupLocation, address }
                    }))}
                    onPlaceSelected={(place) => setFormData(prev => ({ 
                      ...prev, 
                      pickupLocation: { 
                        address: place.address,
                        lat: place.location.lat,
                        lng: place.location.lng,
                        placeId: place.placeId
                      }
                    }))}
                    placeholder="Enter pickup address"
                    isRequired
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Dropoff Location</FormLabel>
                  <PlacesAutocomplete
                    value={formData.dropoffLocation.address}
                    onChange={(address) => setFormData(prev => ({ 
                      ...prev, 
                      dropoffLocation: { ...prev.dropoffLocation, address }
                    }))}
                    onPlaceSelected={(place) => setFormData(prev => ({ 
                      ...prev, 
                      dropoffLocation: { 
                        address: place.address,
                        lat: place.location.lat,
                        lng: place.location.lng,
                        placeId: place.placeId
                      }
                    }))}
                    placeholder="Enter dropoff address"
                    isRequired
                  />
                </FormControl>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Time</FormLabel>
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Assign Dispatcher</FormLabel>
                  <Select
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedDriver: e.target.value }))}
                    placeholder="Select a dispatcher (optional)"
                  >
                    {dispatchers.map((dispatcher) => (
                      <option key={dispatcher._id} value={dispatcher._id}>
                        {dispatcher.firstName} {dispatcher.lastName} - {dispatcher.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={isSubmitting}
                loadingText={selectedTrip ? 'Updating...' : 'Creating...'}
              >
                {selectedTrip ? 'Update Trip' : 'Create Trip'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Trip Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size={{ base: "full", md: "lg" }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Trip Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack align="start" spacing={4}>
                <Text><strong>Trip ID:</strong> {selectedTrip.tripId}</Text>
                <Text><strong>Rider:</strong> {selectedTrip.riderName}</Text>
                <Text><strong>Phone:</strong> {selectedTrip.riderPhone}</Text>
                <Text><strong>Pickup:</strong> {selectedTrip.pickupLocation.address}</Text>
                <Text><strong>Dropoff:</strong> {selectedTrip.dropoffLocation.address}</Text>
                <Text><strong>Scheduled:</strong> {formatDate(selectedTrip.scheduledDate)}</Text>
                <Text><strong>Dispatcher:</strong> {
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

      {/* Trip Management Modal */}
      <TripManagementModal
        isOpen={isTripManagementOpen}
        onClose={onTripManagementClose}
        onTripUpdate={fetchTrips}
      />
    </Box>
  );
};

export default SchedulerDashboard;