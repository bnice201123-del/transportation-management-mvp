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
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer,
  SimpleGrid,
  Divider,
  Checkbox,
  CheckboxGroup,
  Stack,
  Switch,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip
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
  CheckIcon,
  WarningIcon
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
  FaEnvelope,
  FaPlay,
  FaPause,
  FaStop,
  FaCalendarWeek,
  FaInfinity
} from 'react-icons/fa';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const RecurringTrips = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // State management
  const [recurringTrips, setRecurringTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  
  // Form data for creating/editing recurring trips
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    riderName: '',
    riderPhone: '',
    riderEmail: '',
    pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    frequency: 'weekly', // daily, weekly, monthly, custom
    daysOfWeek: [], // For weekly frequency
    dayOfMonth: 1, // For monthly frequency
    customInterval: 1, // For custom frequency
    customUnit: 'days', // days, weeks, months
    startDate: '',
    endDate: '',
    startTime: '',
    duration: 30, // minutes
    maxOccurrences: null,
    assignedDriver: '',
    assignedVehicle: '',
    fare: '',
    notes: '',
    isActive: true,
    skipHolidays: true,
    skipWeekends: false,
    autoAssign: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal controls
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  // Fetch recurring trips
  const fetchRecurringTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/recurring-trips');
      setRecurringTrips(response.data || []);
    } catch (err) {
      console.error('Error fetching recurring trips:', err);
      setError('Failed to load recurring trips. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load recurring trips',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecurringTrips();
  }, [fetchRecurringTrips]);

  // Filter recurring trips
  const filteredRecurringTrips = recurringTrips.filter(trip => {
    const matchesSearch = 
      trip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.riderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickupLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.dropoffLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesFrequency = frequencyFilter === 'all' || trip.frequency === frequencyFilter;
    
    return matchesSearch && matchesStatus && matchesFrequency;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.riderName || !formData.startDate || !formData.startTime) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.pickupLocation.address || !formData.dropoffLocation.address) {
        throw new Error('Please select both pickup and dropoff locations');
      }

      const url = selectedTrip 
        ? `/api/recurring-trips/${selectedTrip._id}`
        : '/api/recurring-trips';
      
      const method = selectedTrip ? 'put' : 'post';
      
      const response = await axios[method](url, formData);
      
      if (response.data) {
        toast({
          title: selectedTrip ? 'Recurring Trip Updated' : 'Recurring Trip Created',
          description: selectedTrip 
            ? 'The recurring trip has been updated successfully'
            : 'The recurring trip has been created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form and close modal
        resetForm();
        selectedTrip ? onEditClose() : onAddClose();
        
        // Refresh the trips list
        fetchRecurringTrips();
      }
    } catch (err) {
      console.error('Error saving recurring trip:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save recurring trip';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      riderName: '',
      riderPhone: '',
      riderEmail: '',
      pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      frequency: 'weekly',
      daysOfWeek: [],
      dayOfMonth: 1,
      customInterval: 1,
      customUnit: 'days',
      startDate: '',
      endDate: '',
      startTime: '',
      duration: 30,
      maxOccurrences: null,
      assignedDriver: '',
      assignedVehicle: '',
      fare: '',
      notes: '',
      isActive: true,
      skipHolidays: true,
      skipWeekends: false,
      autoAssign: true
    });
    setSelectedTrip(null);
    setError('');
  };

  // Handle add new recurring trip
  const handleAdd = () => {
    resetForm();
    onAddOpen();
  };

  // Handle edit recurring trip
  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    setFormData({
      title: trip.title || '',
      description: trip.description || '',
      riderName: trip.riderName || '',
      riderPhone: trip.riderPhone || '',
      riderEmail: trip.riderEmail || '',
      pickupLocation: trip.pickupLocation || { address: '', lat: 0, lng: 0, placeId: '' },
      dropoffLocation: trip.dropoffLocation || { address: '', lat: 0, lng: 0, placeId: '' },
      frequency: trip.frequency || 'weekly',
      daysOfWeek: trip.daysOfWeek || [],
      dayOfMonth: trip.dayOfMonth || 1,
      customInterval: trip.customInterval || 1,
      customUnit: trip.customUnit || 'days',
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
      startTime: trip.startTime || '',
      duration: trip.duration || 30,
      maxOccurrences: trip.maxOccurrences || null,
      assignedDriver: trip.assignedDriver || '',
      assignedVehicle: trip.assignedVehicle || '',
      fare: trip.fare || '',
      notes: trip.notes || '',
      isActive: trip.isActive !== undefined ? trip.isActive : true,
      skipHolidays: trip.skipHolidays !== undefined ? trip.skipHolidays : true,
      skipWeekends: trip.skipWeekends !== undefined ? trip.skipWeekends : false,
      autoAssign: trip.autoAssign !== undefined ? trip.autoAssign : true
    });
    onEditOpen();
  };

  // Handle view recurring trip
  const handleView = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  // Handle delete recurring trip
  const handleDelete = (trip) => {
    setSelectedTrip(trip);
    onDeleteOpen();
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedTrip) return;

    try {
      await axios.delete(`/api/recurring-trips/${selectedTrip._id}`);
      
      toast({
        title: 'Recurring Trip Deleted',
        description: 'The recurring trip has been deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onDeleteClose();
      fetchRecurringTrips();
    } catch (err) {
      console.error('Error deleting recurring trip:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete recurring trip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (trip) => {
    try {
      const response = await axios.put(`/api/recurring-trips/${trip._id}`, {
        ...trip,
        isActive: !trip.isActive
      });
      
      toast({
        title: 'Status Updated',
        description: `Recurring trip ${trip.isActive ? 'deactivated' : 'activated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchRecurringTrips();
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Generate trips preview
  const handlePreview = (trip) => {
    setSelectedTrip(trip);
    onPreviewOpen();
  };

  // Export recurring trips
  const exportRecurringTrips = () => {
    const csvData = filteredRecurringTrips.map(trip => ({
      Title: trip.title,
      'Rider Name': trip.riderName,
      'Pickup Location': trip.pickupLocation?.address,
      'Dropoff Location': trip.dropoffLocation?.address,
      Frequency: trip.frequency,
      'Start Date': new Date(trip.startDate).toLocaleDateString(),
      'End Date': trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'No end date',
      Status: trip.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(trip.createdAt).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recurring_trips_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      description: 'Recurring trips data has been exported to CSV',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Format frequency display
  const formatFrequency = (trip) => {
    switch (trip.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${trip.daysOfWeek?.join(', ') || 'No days selected'})`;
      case 'monthly':
        return `Monthly (Day ${trip.dayOfMonth})`;
      case 'custom':
        return `Every ${trip.customInterval} ${trip.customUnit}`;
      default:
        return trip.frequency;
    }
  };

  // Get status color
  const getStatusColor = (trip) => {
    if (!trip.isActive) return 'gray';
    
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    
    if (now < startDate) return 'yellow'; // Pending
    if (endDate && now > endDate) return 'red'; // Expired
    return 'green'; // Active
  };

  // Get status text
  const getStatusText = (trip) => {
    if (!trip.isActive) return 'Inactive';
    
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    
    if (now < startDate) return 'Pending';
    if (endDate && now > endDate) return 'Expired';
    return 'Active';
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading recurring trips...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Card mb={6} shadow="sm">
        <CardHeader>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="lg" color="purple.600">
                🔄 Recurring Trips Management
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Create and manage recurring trip patterns for regular schedules
              </Text>
            </VStack>
            
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="purple"
                onClick={handleAdd}
                size="sm"
              >
                New Recurring Trip
              </Button>
              
              <Button
                leftIcon={<FaFileExport />}
                variant="outline"
                colorScheme="green"
                onClick={exportRecurringTrips}
                size="sm"
              >
                Export
              </Button>
              
              <Button
                leftIcon={<FaSync />}
                variant="outline"
                onClick={fetchRecurringTrips}
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
                placeholder="Search by title, rider name, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
              />
            </InputGroup>

            {/* Filters Row */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="full">
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="sm"
                  bg="white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Frequency</FormLabel>
                <Select
                  value={frequencyFilter}
                  onChange={(e) => setFrequencyFilter(e.target.value)}
                  size="sm"
                  bg="white"
                >
                  <option value="all">All Frequencies</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Actions</FormLabel>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setFrequencyFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </FormControl>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Recurring Trips Table */}
      <Card shadow="sm">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">
              Recurring Trips ({filteredRecurringTrips.length})
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Total: {recurringTrips.length} patterns
            </Text>
          </Flex>
        </CardHeader>
        <CardBody p={0}>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Title & Rider</Th>
                  <Th>Route</Th>
                  <Th>Frequency</Th>
                  <Th>Schedule</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRecurringTrips.length > 0 ? (
                  filteredRecurringTrips.map((trip) => (
                    <Tr key={trip._id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="sm">
                            {trip.title}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            👤 {trip.riderName}
                          </Text>
                          {trip.riderPhone && (
                            <Text fontSize="xs" color="gray.500">
                              📞 {trip.riderPhone}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="green.600">
                            📍 {trip.pickupLocation?.address?.substring(0, 30)}
                            {trip.pickupLocation?.address?.length > 30 ? '...' : ''}
                          </Text>
                          <Text fontSize="xs" color="red.600">
                            🎯 {trip.dropoffLocation?.address?.substring(0, 30)}
                            {trip.dropoffLocation?.address?.length > 30 ? '...' : ''}
                          </Text>
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Badge colorScheme="blue" size="sm">
                            {formatFrequency(trip)}
                          </Badge>
                          <Text fontSize="xs" color="gray.600">
                            🕐 {trip.startTime}
                          </Text>
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs">
                            📅 Start: {new Date(trip.startDate).toLocaleDateString()}
                          </Text>
                          {trip.endDate && (
                            <Text fontSize="xs" color="gray.600">
                              📅 End: {new Date(trip.endDate).toLocaleDateString()}
                            </Text>
                          )}
                          {!trip.endDate && (
                            <Text fontSize="xs" color="blue.600">
                              ♾️ No end date
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      
                      <Td>
                        <VStack align="start" spacing={2}>
                          <Badge colorScheme={getStatusColor(trip)} size="sm">
                            {getStatusText(trip)}
                          </Badge>
                          <Switch 
                            size="sm" 
                            isChecked={trip.isActive}
                            onChange={() => toggleActiveStatus(trip)}
                            colorScheme="green"
                          />
                        </VStack>
                      </Td>
                      
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="View Details">
                            <IconButton
                              size="sm"
                              icon={<ViewIcon />}
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleView(trip)}
                            />
                          </Tooltip>
                          <Tooltip label="Edit Pattern">
                            <IconButton
                              size="sm"
                              icon={<EditIcon />}
                              variant="ghost"
                              colorScheme="orange"
                              onClick={() => handleEdit(trip)}
                            />
                          </Tooltip>
                          <Tooltip label="Preview Generated Trips">
                            <IconButton
                              size="sm"
                              icon={<FaCalendarWeek />}
                              variant="ghost"
                              colorScheme="green"
                              onClick={() => handlePreview(trip)}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Pattern">
                            <IconButton
                              size="sm"
                              icon={<DeleteIcon />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(trip)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6}>
                      <Center py={8}>
                        <VStack>
                          <RepeatIcon size={40} color="gray.300" />
                          <Text color="gray.500">
                            {searchTerm || statusFilter !== 'all' || frequencyFilter !== 'all'
                              ? 'No recurring trips match your current filters'
                              : 'No recurring trips found. Create your first recurring pattern!'}
                          </Text>
                          {!searchTerm && statusFilter === 'all' && frequencyFilter === 'all' && (
                            <Button
                              leftIcon={<AddIcon />}
                              colorScheme="purple"
                              variant="outline"
                              onClick={handleAdd}
                              size="sm"
                            >
                              Create First Recurring Trip
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

      {/* Add/Edit Modal */}
      <Modal isOpen={isAddOpen || isEditOpen} onClose={isAddOpen ? onAddClose : onEditClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="4xl">
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              <HStack>
                <RepeatIcon color="purple" />
                <Text>{selectedTrip ? 'Edit Recurring Trip' : 'Create New Recurring Trip'}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                {/* Basic Information */}
                <Box>
                  <Heading size="sm" mb={4} color="purple.600">
                    📋 Basic Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Trip Title</FormLabel>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Daily Commute to Office"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Rider Information */}
                <Box>
                  <Heading size="sm" mb={4} color="blue.600">
                    👤 Rider Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Rider Name</FormLabel>
                      <Input
                        value={formData.riderName}
                        onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                        placeholder="Enter rider's full name"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Phone Number</FormLabel>
                      <Input
                        value={formData.riderPhone}
                        onChange={(e) => setFormData({ ...formData, riderPhone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Email Address</FormLabel>
                      <Input
                        type="email"
                        value={formData.riderEmail}
                        onChange={(e) => setFormData({ ...formData, riderEmail: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Route Information */}
                <Box>
                  <Heading size="sm" mb={4} color="green.600">
                    🗺️ Route Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Pickup Location</FormLabel>
                      <PlacesAutocomplete
                        onPlaceSelect={(location) => 
                          setFormData({ ...formData, pickupLocation: location })
                        }
                        placeholder="Enter pickup address"
                        value={formData.pickupLocation.address}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Dropoff Location</FormLabel>
                      <PlacesAutocomplete
                        onPlaceSelect={(location) => 
                          setFormData({ ...formData, dropoffLocation: location })
                        }
                        placeholder="Enter dropoff address"
                        value={formData.dropoffLocation.address}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Frequency Configuration */}
                <Box>
                  <Heading size="sm" mb={4} color="orange.600">
                    🔄 Frequency Configuration
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Frequency Type</FormLabel>
                      <Select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom Interval</option>
                      </Select>
                    </FormControl>

                    {/* Days of Week for Weekly frequency */}
                    {formData.frequency === 'weekly' && (
                      <FormControl>
                        <FormLabel>Days of Week</FormLabel>
                        <CheckboxGroup
                          value={formData.daysOfWeek}
                          onChange={(values) => setFormData({ ...formData, daysOfWeek: values })}
                        >
                          <Stack direction={['column', 'row']} wrap="wrap">
                            <Checkbox value="Monday">Monday</Checkbox>
                            <Checkbox value="Tuesday">Tuesday</Checkbox>
                            <Checkbox value="Wednesday">Wednesday</Checkbox>
                            <Checkbox value="Thursday">Thursday</Checkbox>
                            <Checkbox value="Friday">Friday</Checkbox>
                            <Checkbox value="Saturday">Saturday</Checkbox>
                            <Checkbox value="Sunday">Sunday</Checkbox>
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>
                    )}

                    {/* Day of Month for Monthly frequency */}
                    {formData.frequency === 'monthly' && (
                      <FormControl>
                        <FormLabel>Day of Month</FormLabel>
                        <NumberInput
                          min={1}
                          max={31}
                          value={formData.dayOfMonth}
                          onChange={(value) => setFormData({ ...formData, dayOfMonth: parseInt(value) || 1 })}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Select which day of the month (1-31)</FormHelperText>
                      </FormControl>
                    )}

                    {/* Custom Interval */}
                    {formData.frequency === 'custom' && (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Every</FormLabel>
                          <NumberInput
                            min={1}
                            value={formData.customInterval}
                            onChange={(value) => setFormData({ ...formData, customInterval: parseInt(value) || 1 })}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Unit</FormLabel>
                          <Select
                            value={formData.customUnit}
                            onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                          >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                          </Select>
                        </FormControl>
                      </SimpleGrid>
                    )}
                  </VStack>
                </Box>

                {/* Schedule Configuration */}
                <Box>
                  <Heading size="sm" mb={4} color="teal.600">
                    📅 Schedule Configuration
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>End Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                      <FormHelperText>Leave empty for no end date</FormHelperText>
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Start Time</FormLabel>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <NumberInput
                        min={15}
                        max={480}
                        value={formData.duration}
                        onChange={(value) => setFormData({ ...formData, duration: parseInt(value) || 30 })}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Advanced Options */}
                <Box>
                  <Heading size="sm" mb={4} color="red.600">
                    ⚙️ Advanced Options
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Maximum Occurrences</FormLabel>
                        <NumberInput
                          min={1}
                          value={formData.maxOccurrences || ''}
                          onChange={(value) => setFormData({ ...formData, maxOccurrences: value ? parseInt(value) : null })}
                        >
                          <NumberInputField placeholder="Leave empty for unlimited" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Limit total number of generated trips</FormHelperText>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Fare Amount</FormLabel>
                        <Input
                          value={formData.fare}
                          onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                          placeholder="Enter fare amount (optional)"
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Skip Holidays</FormLabel>
                        <Switch
                          isChecked={formData.skipHolidays}
                          onChange={(e) => setFormData({ ...formData, skipHolidays: e.target.checked })}
                          colorScheme="blue"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Skip Weekends</FormLabel>
                        <Switch
                          isChecked={formData.skipWeekends}
                          onChange={(e) => setFormData({ ...formData, skipWeekends: e.target.checked })}
                          colorScheme="orange"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Auto Assign</FormLabel>
                        <Switch
                          isChecked={formData.autoAssign}
                          onChange={(e) => setFormData({ ...formData, autoAssign: e.target.checked })}
                          colorScheme="green"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">Active</FormLabel>
                        <Switch
                          isChecked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          colorScheme="purple"
                        />
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Notes</FormLabel>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes or special instructions..."
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>

                {/* Error Display */}
                {error && (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={isAddOpen ? onAddClose : onEditClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                colorScheme="purple" 
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                {selectedTrip ? 'Update Pattern' : 'Create Pattern'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <ViewIcon color="blue" />
              <Text>Recurring Trip Details</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>{selectedTrip.title}</Heading>
                  {selectedTrip.description && (
                    <Text color="gray.600" mb={4}>{selectedTrip.description}</Text>
                  )}
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Rider Information</Text>
                    <VStack align="start" spacing={1}>
                      <Text>👤 {selectedTrip.riderName}</Text>
                      {selectedTrip.riderPhone && <Text>📞 {selectedTrip.riderPhone}</Text>}
                      {selectedTrip.riderEmail && <Text>📧 {selectedTrip.riderEmail}</Text>}
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2}>Status</Text>
                    <VStack align="start" spacing={1}>
                      <Badge colorScheme={getStatusColor(selectedTrip)}>
                        {getStatusText(selectedTrip)}
                      </Badge>
                      <Text fontSize="sm">
                        {selectedTrip.isActive ? '✅ Active' : '❌ Inactive'}
                      </Text>
                    </VStack>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontWeight="bold" mb={2}>Route</Text>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">
                      📍 <strong>From:</strong> {selectedTrip.pickupLocation?.address}
                    </Text>
                    <Text fontSize="sm">
                      🎯 <strong>To:</strong> {selectedTrip.dropoffLocation?.address}
                    </Text>
                  </VStack>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Frequency</Text>
                    <Text>{formatFrequency(selectedTrip)}</Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2}>Schedule</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">
                        📅 Start: {new Date(selectedTrip.startDate).toLocaleDateString()}
                      </Text>
                      {selectedTrip.endDate ? (
                        <Text fontSize="sm">
                          📅 End: {new Date(selectedTrip.endDate).toLocaleDateString()}
                        </Text>
                      ) : (
                        <Text fontSize="sm" color="blue.600">♾️ No end date</Text>
                      )}
                      <Text fontSize="sm">🕐 Time: {selectedTrip.startTime}</Text>
                      <Text fontSize="sm">⏱️ Duration: {selectedTrip.duration} minutes</Text>
                    </VStack>
                  </Box>
                </SimpleGrid>

                {selectedTrip.notes && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Notes</Text>
                    <Text fontSize="sm" color="gray.600">{selectedTrip.notes}</Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="bold" mb={2}>Options</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    <Text fontSize="sm">
                      {selectedTrip.skipHolidays ? '✅' : '❌'} Skip Holidays
                    </Text>
                    <Text fontSize="sm">
                      {selectedTrip.skipWeekends ? '✅' : '❌'} Skip Weekends
                    </Text>
                    <Text fontSize="sm">
                      {selectedTrip.autoAssign ? '✅' : '❌'} Auto Assign
                    </Text>
                    <Text fontSize="sm">
                      {selectedTrip.maxOccurrences ? `🔢 Max: ${selectedTrip.maxOccurrences}` : '♾️ Unlimited'}
                    </Text>
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Close
            </Button>
            {selectedTrip && (
              <Button colorScheme="orange" onClick={() => {
                onViewClose();
                handleEdit(selectedTrip);
              }}>
                Edit
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Recurring Trip Pattern
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this recurring trip pattern?
              <br /><br />
              <strong>"{selectedTrip?.title}"</strong>
              <br /><br />
              This action cannot be undone. All future trips generated from this pattern will be removed.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default RecurringTrips;