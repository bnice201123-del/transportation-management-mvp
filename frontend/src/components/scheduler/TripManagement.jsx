import React, { useState, useEffect, useCallback } from 'react';
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
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Switch,
  SimpleGrid,
  Divider,
  useBreakpointValue,
  Checkbox
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  ViewIcon,
  DeleteIcon,
  RepeatIcon,
  SearchIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  SettingsIcon,
  InfoIcon,
  TimeIcon,
  PhoneIcon,
  EmailIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaRoute,
  FaFilter,
  FaSort,
  FaCalendarPlus,
  FaCalendarCheck,
  FaCalendarTimes,
  FaSync,
  FaFileExport,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import axios from '../../config/axios';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const TripManagement = ({ onTripUpdate }) => {
  // State Management
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('scheduledTime');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form State
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    riderEmail: '',
    pickupLocation: '',
    dropoffLocation: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedDriver: '',
    status: 'scheduled',
    priority: 'medium',
    estimatedDuration: '',
    estimatedDistance: '',
    fare: ''
  });

  // Modal Controls
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Data Fetching
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const tripsData = response.data?.trips || [];
      setTrips(tripsData);
      setFilteredTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips:', error);
      // Mock data for development
      const mockTrips = [
        {
          _id: '1',
          riderName: 'John Smith',
          riderPhone: '(555) 123-4567',
          riderEmail: 'john.smith@email.com',
          pickupLocation: '123 Main St, Downtown',
          dropoffLocation: '456 Oak Ave, Uptown',
          scheduledDate: '2025-11-04',
          scheduledTime: '09:00',
          status: 'scheduled',
          priority: 'high',
          assignedDriver: 'Driver A',
          estimatedDuration: '30 min',
          estimatedDistance: '5.2 miles',
          fare: '$15.50',
          notes: 'Airport pickup',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          riderName: 'Sarah Johnson',
          riderPhone: '(555) 987-6543',
          riderEmail: 'sarah.j@email.com',
          pickupLocation: '789 Pine St, Westside',
          dropoffLocation: '321 Elm Dr, Eastside',
          scheduledDate: '2025-11-04',
          scheduledTime: '14:30',
          status: 'in-progress',
          priority: 'medium',
          assignedDriver: 'Driver B',
          estimatedDuration: '45 min',
          estimatedDistance: '8.1 miles',
          fare: '$22.75',
          notes: 'Medical appointment',
          createdAt: new Date().toISOString()
        }
      ];
      setTrips(mockTrips);
      setFilteredTrips(mockTrips);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/drivers');
      setDrivers(response.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([
        { _id: '1', firstName: 'Mike', lastName: 'Wilson', phone: '(555) 111-2222' },
        { _id: '2', firstName: 'Lisa', lastName: 'Anderson', phone: '(555) 333-4444' }
      ]);
    }
  }, []);

  // Filter and Sort Logic
  const applyFilters = useCallback(() => {
    let filtered = [...trips];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.riderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.riderPhone.includes(searchTerm) ||
        (typeof trip.pickupLocation === 'object' ? trip.pickupLocation.address : trip.pickupLocation).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof trip.dropoffLocation === 'object' ? trip.dropoffLocation.address : trip.dropoffLocation).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // Driver filter
    if (driverFilter !== 'all') {
      filtered = filtered.filter(trip => {
        const driverName = typeof trip.assignedDriver === 'object' && trip.assignedDriver 
          ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
          : trip.assignedDriver;
        return driverName === driverFilter;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() + 7);
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= today && tripDate <= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() + 1);
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= today && tripDate <= filterDate;
          });
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'scheduledTime' || sortBy === 'scheduledDate') {
        aValue = new Date(`${a.scheduledDate} ${a.scheduledTime}`);
        bValue = new Date(`${b.scheduledDate} ${b.scheduledTime}`);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTrips(filtered);
  }, [trips, searchTerm, statusFilter, driverFilter, dateFilter, sortBy, sortOrder]);

  // Effects
  useEffect(() => {
    fetchTrips();
    fetchDrivers();
  }, [fetchTrips, fetchDrivers]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Form Handlers
  const resetForm = () => {
    setFormData({
      riderName: '',
      riderPhone: '',
      riderEmail: '',
      pickupLocation: '',
      dropoffLocation: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      assignedDriver: '',
      status: 'scheduled',
      priority: 'medium',
      estimatedDuration: '',
      estimatedDistance: '',
      fare: ''
    });
  };

  const handleAddTrip = () => {
    resetForm();
    onAddOpen();
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setFormData({
      ...trip,
      scheduledDate: trip.scheduledDate.split('T')[0], // Format for date input
      assignedDriver: typeof trip.assignedDriver === 'object' && trip.assignedDriver 
        ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
        : trip.assignedDriver || ''
    });
    onEditOpen();
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  const handleDeleteTrip = (trip) => {
    setSelectedTrip(trip);
    onDeleteOpen();
  };

  const submitTrip = async (isEdit = false) => {
    try {
      setIsSubmitting(true);
      
      const tripData = {
        ...formData,
        scheduledDateTime: new Date(`${formData.scheduledDate} ${formData.scheduledTime}`)
      };

      let response;
      if (isEdit) {
        response = await axios.put(`/api/trips/${selectedTrip._id}`, tripData);
        toast({
          title: 'Success',
          description: 'Trip updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        response = await axios.post('/api/trips', tripData);
        toast({
          title: 'Success',
          description: 'Trip created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      await fetchTrips();
      onTripUpdate && onTripUpdate();
      isEdit ? onEditClose() : onAddClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting trip:', error);
      
      // Mock success for development
      if (isEdit) {
        const updatedTrips = (trips || []).map(trip => 
          trip._id === selectedTrip._id ? { ...trip, ...formData } : trip
        );
        setTrips(updatedTrips);
        toast({
          title: 'Success',
          description: 'Trip updated successfully (Demo Mode)',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
      } else {
        const newTrip = {
          _id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        setTrips([...trips, newTrip]);
        toast({
          title: 'Success',
          description: 'Trip created successfully (Demo Mode)',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onAddClose();
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await axios.delete(`/trips/${selectedTrip._id}`);
      
      toast({
        title: 'Success',
        description: 'Trip deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchTrips();
      onTripUpdate && onTripUpdate();
    } catch (error) {
      console.error('Error deleting trip:', error);
      
      // Mock success for development
      const updatedTrips = (trips || []).filter(trip => trip._id !== selectedTrip._id);
      setTrips(updatedTrips);
      
      toast({
        title: 'Success',
        description: 'Trip deleted successfully (Demo Mode)',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      onDeleteClose();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'blue',
      'in-progress': 'orange',
      completed: 'green',
      cancelled: 'red',
      pending: 'yellow'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'red',
      medium: 'yellow',
      low: 'green'
    };
    return colors[priority] || 'gray';
  };

  const exportTrips = () => {
    const csvContent = [
      ['Rider Name', 'Phone', 'Email', 'Pickup', 'Dropoff', 'Date', 'Time', 'Status', 'Driver', 'Fare'].join(','),
      ...(filteredTrips || []).map(trip => [
        trip.riderName,
        trip.riderPhone,
        trip.riderEmail || '',
        typeof trip.pickupLocation === 'object' ? trip.pickupLocation.address : trip.pickupLocation,
        typeof trip.dropoffLocation === 'object' ? trip.dropoffLocation.address : trip.dropoffLocation,
        trip.scheduledDate,
        trip.scheduledTime,
        trip.status,
        typeof trip.assignedDriver === 'object' && trip.assignedDriver 
          ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
          : trip.assignedDriver || 'Unassigned',
        trip.fare || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      description: 'Trips data has been exported to CSV',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading trips...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header Section with Actions */}
      <Card mb={6} shadow="sm">
        <CardHeader>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="lg" color="blue.600">
                🚗 Trip Management Center
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Create, view, edit, and delete trips - All-in-one management hub
              </Text>
            </VStack>
            
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={handleAddTrip}
                size="sm"
              >
                New Trip
              </Button>
              
              <Button
                leftIcon={<FaFileExport />}
                variant="outline"
                colorScheme="green"
                onClick={exportTrips}
                size="sm"
              >
                Export
              </Button>
              
              <Button
                leftIcon={<FaSync />}
                variant="outline"
                onClick={fetchTrips}
                size="sm"
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card mb={6} shadow="sm">
        <CardBody>
          <VStack spacing={4}>
            {/* Search Bar */}
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by rider name, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
              />
            </InputGroup>

            {/* Filters Row */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} w="full">
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="sm"
                  bg="white"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Driver</FormLabel>
                <Select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  size="sm"
                  bg="white"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={`${driver.firstName} ${driver.lastName}`}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Date Range</FormLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  size="sm"
                  bg="white"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Sort By</FormLabel>
                <HStack>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    size="sm"
                    bg="white"
                  >
                    <option value="scheduledTime">Date & Time</option>
                    <option value="riderName">Rider Name</option>
                    <option value="status">Status</option>
                    <option value="createdAt">Created</option>
                  </Select>
                  <IconButton
                    size="sm"
                    icon={<FaSort />}
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    variant="outline"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  />
                </HStack>
              </FormControl>
            </SimpleGrid>

            {/* Results Count */}
            <Flex w="full" justify="space-between" align="center" fontSize="sm" color="gray.600">
              <Text>
                Showing {filteredTrips?.length || 0} of {trips?.length || 0} trips
              </Text>
              <HStack>
                <Badge colorScheme="blue" variant="subtle">
                  {(trips || []).filter(t => t.status === 'scheduled').length} Scheduled
                </Badge>
                <Badge colorScheme="orange" variant="subtle">
                  {(trips || []).filter(t => t.status === 'in-progress').length} In Progress
                </Badge>
                <Badge colorScheme="green" variant="subtle">
                  {(trips || []).filter(t => t.status === 'completed').length} Completed
                </Badge>
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* Trips Table */}
      <Card shadow="sm">
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Rider Information</Th>
                  <Th>Route</Th>
                  <Th>Schedule</Th>
                  <Th>Status</Th>
                  <Th>Driver</Th>
                  <Th>Details</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(filteredTrips || []).length > 0 ? (
                  (filteredTrips || []).map((trip) => (
                    <Tr key={trip._id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" fontSize="sm">
                            {trip.riderName}
                          </Text>
                          <HStack spacing={2}>
                            <PhoneIcon boxSize={3} color="blue.400" />
                            <Text fontSize="xs" color="gray.600">
                              {trip.riderPhone}
                            </Text>
                          </HStack>
                          {trip.riderEmail && (
                            <HStack spacing={2}>
                              <EmailIcon boxSize={3} color="gray.400" />
                              <Text fontSize="xs" color="gray.600">
                                {trip.riderEmail}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Box w={2} h={2} bg="green.400" rounded="full" />
                            <Text fontSize="xs" color="gray.700" noOfLines={1}>
                              {typeof trip.pickupLocation === 'object' ? trip.pickupLocation.address : trip.pickupLocation}
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Box w={2} h={2} bg="red.400" rounded="full" />
                            <Text fontSize="xs" color="gray.700" noOfLines={1}>
                              {typeof trip.dropoffLocation === 'object' ? trip.dropoffLocation.address : trip.dropoffLocation}
                            </Text>
                          </HStack>
                          {trip.estimatedDistance && (
                            <Text fontSize="xs" color="gray.500">
                              📏 {trip.estimatedDistance}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <CalendarIcon boxSize={3} color="blue.400" />
                            <Text fontSize="sm" fontWeight="medium">
                              {new Date(trip.scheduledDate).toLocaleDateString()}
                            </Text>
                          </HStack>
                          <HStack>
                            <TimeIcon boxSize={3} color="orange.400" />
                            <Text fontSize="sm">
                              {trip.scheduledTime}
                            </Text>
                          </HStack>
                          {trip.estimatedDuration && (
                            <Text fontSize="xs" color="gray.500">
                              ⏱️ {trip.estimatedDuration}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Badge 
                            colorScheme={getStatusColor(trip.status)} 
                            size="sm"
                            textTransform="capitalize"
                          >
                            {trip.status.replace('-', ' ')}
                          </Badge>
                          {trip.priority && (
                            <Badge 
                              colorScheme={getPriorityColor(trip.priority)} 
                              variant="outline" 
                              size="sm"
                            >
                              {trip.priority} priority
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {typeof trip.assignedDriver === 'object' && trip.assignedDriver 
                            ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
                            : trip.assignedDriver || 'Unassigned'}
                        </Text>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          {trip.fare && (
                            <Text fontSize="sm" fontWeight="bold" color="green.600">
                              {trip.fare}
                            </Text>
                          )}
                          {trip.notes && (
                            <Text fontSize="xs" color="gray.600" noOfLines={1}>
                              💬 {trip.notes}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            size="sm"
                            icon={<ViewIcon />}
                            variant="ghost"
                            colorScheme="blue"
                            title="View Details"
                            onClick={() => handleViewTrip(trip)}
                          />
                          <IconButton
                            size="sm"
                            icon={<EditIcon />}
                            variant="ghost"
                            colorScheme="orange"
                            title="Edit Trip"
                            onClick={() => handleEditTrip(trip)}
                          />
                          <IconButton
                            size="sm"
                            icon={<DeleteIcon />}
                            variant="ghost"
                            colorScheme="red"
                            title="Delete Trip"
                            onClick={() => handleDeleteTrip(trip)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7}>
                      <Center py={8}>
                        <VStack>
                          <FaRoute size={40} color="gray.300" />
                          <Text color="gray.500">
                            {searchTerm || statusFilter !== 'all' || driverFilter !== 'all' || dateFilter !== 'all'
                              ? 'No trips match your current filters'
                              : 'No trips found. Create your first trip!'}
                          </Text>
                          {!searchTerm && statusFilter === 'all' && driverFilter === 'all' && dateFilter === 'all' && (
                            <Button
                              leftIcon={<AddIcon />}
                              colorScheme="blue"
                              variant="outline"
                              onClick={handleAddTrip}
                              size="sm"
                            >
                              Create First Trip
                            </Button>
                          )}
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Add Trip Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaCalendarPlus color="blue" />
              <Text>Create New Trip</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Rider Information */}
              <Box>
                <Heading size="sm" mb={3} color="blue.600">
                  👤 Rider Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Rider Name</FormLabel>
                    <Input
                      value={formData.riderName}
                      onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                      placeholder="Enter rider's full name"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      type="tel"
                      value={formData.riderPhone}
                      onChange={(e) => setFormData({ ...formData, riderPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={formData.riderEmail}
                      onChange={(e) => setFormData({ ...formData, riderEmail: e.target.value })}
                      placeholder="rider@email.com"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Route Information */}
              <Box>
                <Heading size="sm" mb={3} color="green.600">
                  🗺️ Route Information
                </Heading>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Pickup Location</FormLabel>
                    <PlacesAutocomplete
                      value={formData.pickupLocation}
                      onChange={(address) => setFormData({ ...formData, pickupLocation: address })}
                      onPlaceSelected={(place) => setFormData({ ...formData, pickupLocation: place.address })}
                      placeholder="Enter pickup address"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Drop-off Location</FormLabel>
                    <PlacesAutocomplete
                      value={formData.dropoffLocation}
                      onChange={(address) => setFormData({ ...formData, dropoffLocation: address })}
                      onPlaceSelected={(place) => setFormData({ ...formData, dropoffLocation: place.address })}
                      placeholder="Enter destination address"
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Estimated Distance</FormLabel>
                      <Input
                        value={formData.estimatedDistance}
                        onChange={(e) => setFormData({ ...formData, estimatedDistance: e.target.value })}
                        placeholder="5.2 miles"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Estimated Duration</FormLabel>
                      <Input
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                        placeholder="30 minutes"
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </Box>

              <Divider />

              {/* Schedule Information */}
              <Box>
                <Heading size="sm" mb={3} color="orange.600">
                  📅 Schedule Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Scheduled Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Scheduled Time</FormLabel>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Assign Driver</FormLabel>
                    <Select
                      value={formData.assignedDriver}
                      onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={`${driver.firstName} ${driver.lastName}`}>
                          {driver.firstName} {driver.lastName}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Additional Information */}
              <Box>
                <Heading size="sm" mb={3} color="purple.600">
                  💼 Additional Information
                </Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Fare Amount</FormLabel>
                    <Input
                      value={formData.fare}
                      onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                      placeholder="$15.50"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special instructions, medical equipment, etc."
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => submitTrip(false)}
              isLoading={isSubmitting}
              loadingText="Creating..."
            >
              Create Trip
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Trip Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <EditIcon color="orange" />
              <Text>Edit Trip</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Same form as Add Trip Modal but with existing data */}
            <VStack spacing={4} align="stretch">
              {/* Rider Information */}
              <Box>
                <Heading size="sm" mb={3} color="blue.600">
                  👤 Rider Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Rider Name</FormLabel>
                    <Input
                      value={formData.riderName}
                      onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                      placeholder="Enter rider's full name"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      type="tel"
                      value={formData.riderPhone}
                      onChange={(e) => setFormData({ ...formData, riderPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={formData.riderEmail}
                      onChange={(e) => setFormData({ ...formData, riderEmail: e.target.value })}
                      placeholder="rider@email.com"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Route Information */}
              <Box>
                <Heading size="sm" mb={3} color="green.600">
                  🗺️ Route Information
                </Heading>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Pickup Location</FormLabel>
                    <PlacesAutocomplete
                      value={formData.pickupLocation}
                      onChange={(address) => setFormData({ ...formData, pickupLocation: address })}
                      onPlaceSelected={(place) => setFormData({ ...formData, pickupLocation: place.address })}
                      placeholder="Enter pickup address"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Drop-off Location</FormLabel>
                    <PlacesAutocomplete
                      value={formData.dropoffLocation}
                      onChange={(address) => setFormData({ ...formData, dropoffLocation: address })}
                      onPlaceSelected={(place) => setFormData({ ...formData, dropoffLocation: place.address })}
                      placeholder="Enter destination address"
                    />
                  </FormControl>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Estimated Distance</FormLabel>
                      <Input
                        value={formData.estimatedDistance}
                        onChange={(e) => setFormData({ ...formData, estimatedDistance: e.target.value })}
                        placeholder="5.2 miles"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Estimated Duration</FormLabel>
                      <Input
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                        placeholder="30 minutes"
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </Box>

              <Divider />

              {/* Schedule Information */}
              <Box>
                <Heading size="sm" mb={3} color="orange.600">
                  📅 Schedule Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Scheduled Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Scheduled Time</FormLabel>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Assign Driver</FormLabel>
                    <Select
                      value={formData.assignedDriver}
                      onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={`${driver.firstName} ${driver.lastName}`}>
                          {driver.firstName} {driver.lastName}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Fare Amount</FormLabel>
                    <Input
                      value={formData.fare}
                      onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                      placeholder="$15.50"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Notes */}
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions, updates, etc."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={() => submitTrip(true)}
              isLoading={isSubmitting}
              loadingText="Updating..."
            >
              Update Trip
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Trip Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <ViewIcon color="blue" />
              <Text>Trip Details</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={6} align="stretch">
                {/* Trip Status Header */}
                <Flex justify="space-between" align="center" p={4} bg="gray.50" rounded="md">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold">
                      Trip #{selectedTrip._id?.slice(-8) || '12345678'}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Created: {new Date(selectedTrip.createdAt || new Date()).toLocaleDateString()}
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Badge 
                      colorScheme={getStatusColor(selectedTrip.status)} 
                      size="lg" 
                      px={3} 
                      py={1}
                      textTransform="capitalize"
                    >
                      {selectedTrip.status?.replace('-', ' ')}
                    </Badge>
                    {selectedTrip.priority && (
                      <Badge 
                        colorScheme={getPriorityColor(selectedTrip.priority)} 
                        variant="outline" 
                        size="sm"
                      >
                        {selectedTrip.priority} priority
                      </Badge>
                    )}
                  </VStack>
                </Flex>

                {/* Rider Information */}
                <Box p={4} border="1px" borderColor="blue.200" rounded="md" bg="blue.50">
                  <Heading size="sm" mb={3} color="blue.700">
                    👤 Rider Information
                  </Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Name</Text>
                      <Text fontWeight="medium">{selectedTrip.riderName}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Phone</Text>
                      <HStack>
                        <FaPhone size={12} />
                        <Text fontWeight="medium">{selectedTrip.riderPhone}</Text>
                      </HStack>
                    </Box>
                    {selectedTrip.riderEmail && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Email</Text>
                        <HStack>
                          <FaEnvelope size={12} />
                          <Text fontWeight="medium">{selectedTrip.riderEmail}</Text>
                        </HStack>
                      </Box>
                    )}
                  </SimpleGrid>
                </Box>

                {/* Route Information */}
                <Box p={4} border="1px" borderColor="green.200" rounded="md" bg="green.50">
                  <Heading size="sm" mb={3} color="green.700">
                    🗺️ Route Information
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <HStack mb={1}>
                        <Box w={3} h={3} bg="green.500" rounded="full" />
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Pickup Location</Text>
                      </HStack>
                      <Text pl={5}>{selectedTrip.pickupLocation}</Text>
                    </Box>
                    <Box>
                      <HStack mb={1}>
                        <Box w={3} h={3} bg="red.500" rounded="full" />
                        <Text fontSize="sm" color="gray.600" fontWeight="medium">Drop-off Location</Text>
                      </HStack>
                      <Text pl={5}>{selectedTrip.dropoffLocation}</Text>
                    </Box>
                    {(selectedTrip.estimatedDistance || selectedTrip.estimatedDuration) && (
                      <SimpleGrid columns={2} spacing={4}>
                        {selectedTrip.estimatedDistance && (
                          <Box>
                            <Text fontSize="sm" color="gray.600">Distance</Text>
                            <Text fontWeight="medium">📏 {selectedTrip.estimatedDistance}</Text>
                          </Box>
                        )}
                        {selectedTrip.estimatedDuration && (
                          <Box>
                            <Text fontSize="sm" color="gray.600">Duration</Text>
                            <Text fontWeight="medium">⏱️ {selectedTrip.estimatedDuration}</Text>
                          </Box>
                        )}
                      </SimpleGrid>
                    )}
                  </VStack>
                </Box>

                {/* Schedule Information */}
                <Box p={4} border="1px" borderColor="orange.200" rounded="md" bg="orange.50">
                  <Heading size="sm" mb={3} color="orange.700">
                    📅 Schedule Information
                  </Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Date</Text>
                      <HStack>
                        <CalendarIcon boxSize={3} />
                        <Text fontWeight="medium">
                          {new Date(selectedTrip.scheduledDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Time</Text>
                      <HStack>
                        <TimeIcon boxSize={3} />
                        <Text fontWeight="medium">{selectedTrip.scheduledTime}</Text>
                      </HStack>
                    </Box>
                    {selectedTrip.assignedDriver && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Assigned Driver</Text>
                        <HStack>
                          <FaUser size={12} />
                          <Text fontWeight="medium">
                            {typeof selectedTrip.assignedDriver === 'object' && selectedTrip.assignedDriver 
                              ? `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}` 
                              : selectedTrip.assignedDriver}
                          </Text>
                        </HStack>
                      </Box>
                    )}
                    {selectedTrip.fare && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Fare</Text>
                        <Text fontWeight="bold" color="green.600" fontSize="lg">
                          {selectedTrip.fare}
                        </Text>
                      </Box>
                    )}
                  </SimpleGrid>
                </Box>

                {/* Notes */}
                {selectedTrip.notes && (
                  <Box p={4} border="1px" borderColor="gray.200" rounded="md">
                    <Heading size="sm" mb={2} color="gray.700">
                      💬 Notes
                    </Heading>
                    <Text>{selectedTrip.notes}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Close
            </Button>
            <Button
              colorScheme="orange"
              leftIcon={<EditIcon />}
              onClick={() => {
                onViewClose();
                handleEditTrip(selectedTrip);
              }}
            >
              Edit Trip
            </Button>
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
              Delete Trip
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this trip for{' '}
              <Text as="span" fontWeight="bold" color="red.600">
                {selectedTrip?.riderName}
              </Text>
              ? This action cannot be undone.
              
              <Box mt={4} p={3} bg="red.50" rounded="md" border="1px" borderColor="red.200">
                <Text fontSize="sm">
                  <strong>Trip Details:</strong><br />
                  📍 {selectedTrip?.pickupLocation} → {selectedTrip?.dropoffLocation}<br />
                  📅 {selectedTrip && new Date(selectedTrip.scheduledDate).toLocaleDateString()} at {selectedTrip?.scheduledTime}
                </Text>
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDelete} 
                ml={3}
                isLoading={isSubmitting}
                loadingText="Deleting..."
              >
                Delete Trip
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default TripManagement;