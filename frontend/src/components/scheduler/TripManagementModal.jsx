import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Badge,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer,
  SimpleGrid,
  Divider,
  useToast,
  useDisclosure,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Checkbox,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Card,
  CardBody,
  CardHeader
} from '@chakra-ui/react';
import {
  SearchIcon,
  EditIcon,
  ViewIcon,
  DeleteIcon,
  AddIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  RepeatIcon,
  TimeIcon,
  PhoneIcon,
  EmailIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaMapMarkerAlt,
  FaCar,
  FaRoute,
  FaClock,
  FaFilter,
  FaSort,
  FaFileExport,
  FaSync,
  FaCalendarCheck,
  FaCalendarTimes,
  FaPhone,
  FaEnvelope,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus
} from 'react-icons/fa';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import TripDetailsModal from './TripDetailsModal';
import TripEditModal from './TripEditModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const TripManagementModal = ({ isOpen, onClose, onTripUpdate }) => {
  const { user } = useAuth();
  const toast = useToast();

  // State management
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [riderFilter, setRiderFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [fareRange, setFareRange] = useState([0, 1000]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('scheduledDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal controls
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Fetch trips with filters
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (driverFilter !== 'all') params.append('driver', driverFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await axios.get(`/api/trips?${params}`);
      
      if (response.data) {
        setTrips(response.data.data?.trips || []);
        setTotalPages(response.data.data?.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trips',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, statusFilter, driverFilter, dateRange, toast]);

  // Apply local filters
  useEffect(() => {
    let filtered = [...trips];

    // Apply rider filter
    if (riderFilter) {
      filtered = filtered.filter(trip => 
        trip.riderName?.toLowerCase().includes(riderFilter.toLowerCase()) ||
        trip.riderPhone?.includes(riderFilter) ||
        trip.riderEmail?.toLowerCase().includes(riderFilter.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(trip => 
        trip.pickupLocation?.address?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        trip.dropoffLocation?.address?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply fare range filter
    filtered = filtered.filter(trip => {
      if (!trip.fare) return true;
      const fare = parseFloat(trip.fare.replace(/[^0-9.-]+/g, ''));
      return fare >= fareRange[0] && fare <= fareRange[1];
    });

    // Apply date filter for specific periods
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.scheduledDate);
        
        switch (dateFilter) {
          case 'today':
            return tripDate >= today && tripDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tripDate >= tomorrow && tripDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return tripDate >= weekStart && tripDate < weekEnd;
          case 'next_week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
            return tripDate >= nextWeekStart && tripDate < nextWeekEnd;
          case 'this_month':
            return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredTrips(filtered);
  }, [trips, riderFilter, locationFilter, fareRange, dateFilter]);

  // Load trips when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTrips();
    }
  }, [isOpen, fetchTrips]);

  // Handle trip actions
  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    onDetailsOpen();
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    onEditOpen();
  };

  const handleDeleteTrip = (trip) => {
    setSelectedTrip(trip);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedTrip) return;

    try {
      await axios.delete(`/api/trips/${selectedTrip._id}`);
      
      toast({
        title: 'Trip Deleted',
        description: 'The trip has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
      fetchTrips();
      
      if (onTripUpdate) onTripUpdate();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete trip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle bulk operations
  const handleBulkSelect = (tripId, isSelected) => {
    if (isSelected) {
      setBulkSelected([...bulkSelected, tripId]);
    } else {
      setBulkSelected(bulkSelected.filter(id => id !== tripId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setBulkSelected(filteredTrips.map(trip => trip._id));
    } else {
      setBulkSelected([]);
    }
  };

  const handleBulkAction = async (action) => {
    if (bulkSelected.length === 0) return;

    try {
      let endpoint = '';
      let method = 'put';
      let data = { ids: bulkSelected };

      switch (action) {
        case 'cancel':
          data.status = 'cancelled';
          endpoint = '/api/trips/bulk-update';
          break;
        case 'complete':
          data.status = 'completed';
          endpoint = '/api/trips/bulk-update';
          break;
        case 'delete':
          method = 'delete';
          endpoint = '/api/trips/bulk-delete';
          break;
        default:
          return;
      }

      await axios[method](endpoint, data);
      
      toast({
        title: 'Bulk Operation Complete',
        description: `Successfully ${action}ed ${bulkSelected.length} trips`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setBulkSelected([]);
      fetchTrips();
      
      if (onTripUpdate) onTripUpdate();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast({
        title: 'Error',
        description: `Failed to ${action} selected trips`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Export trips
  const handleExport = () => {
    const csvData = filteredTrips.map(trip => ({
      'Trip ID': trip.tripId || trip._id,
      'Rider Name': trip.riderName,
      'Rider Phone': trip.riderPhone,
      'Pickup Location': trip.pickupLocation?.address,
      'Dropoff Location': trip.dropoffLocation?.address,
      'Scheduled Date': new Date(trip.scheduledDate).toLocaleDateString(),
      'Scheduled Time': trip.scheduledTime,
      'Status': trip.status,
      'Assigned Driver': trip.assignedDriver?.name || 'Unassigned',
      'Fare': trip.fare,
      'Notes': trip.notes,
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
    link.download = `trips_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setDriverFilter('all');
    setRiderFilter('');
    setLocationFilter('');
    setFareRange([0, 1000]);
    setDateRange({ start: '', end: '' });
    setSortBy('scheduledDate');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'cancelled': return 'red';
      case 'scheduled': return 'orange';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Paginated trips
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredTrips.length / itemsPerPage);

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size={{ base: "full", md: "full" }}
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent 
          maxH={{ base: "100vh", md: "95vh" }} 
          maxW={{ base: "100%", md: "98vw" }}
          m={{ base: 0, md: 4 }}
          borderRadius={{ base: 0, md: "lg" }}
          borderTopRadius={{ base: "xl", md: "lg" }}
        >
          <ModalHeader>
            <Flex align="center" gap={4}>
              <Box>
                <HStack>
                  <FaRoute color="blue" />
                  <Text fontSize="xl" fontWeight="bold">Trip Management Center</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Advanced filtering and management for all trips
                </Text>
              </Box>
              <Spacer />
              <HStack spacing={2}>
                <Button
                  size="sm"
                  leftIcon={<FaSync />}
                  variant="outline"
                  onClick={fetchTrips}
                  isLoading={loading}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaFileExport />}
                  colorScheme="green"
                  variant="outline"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </HStack>
            </Flex>
          </ModalHeader>
          
          <ModalCloseButton />
          
          <ModalBody p={6}>
            <VStack spacing={6} align="stretch">
              {/* Search and Quick Filters */}
              <Card>
                <CardBody>
                  <VStack spacing={4}>
                    {/* Main Search Bar */}
                    <InputGroup size="lg">
                      <InputLeftElement>
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search trips by rider name, phone, location, or trip ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="white"
                      />
                    </InputGroup>

                    {/* Quick Filters Row */}
                    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={3} w="full">
                      <FormControl>
                        <FormLabel fontSize="sm">Status</FormLabel>
                        <Select
                          size="sm"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          bg="white"
                        >
                          <option value="all">All Status</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="pending">Pending</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Date Filter</FormLabel>
                        <Select
                          size="sm"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          bg="white"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="tomorrow">Tomorrow</option>
                          <option value="this_week">This Week</option>
                          <option value="next_week">Next Week</option>
                          <option value="this_month">This Month</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Driver</FormLabel>
                        <Select
                          size="sm"
                          value={driverFilter}
                          onChange={(e) => setDriverFilter(e.target.value)}
                          bg="white"
                        >
                          <option value="all">All Drivers</option>
                          <option value="assigned">Assigned</option>
                          <option value="unassigned">Unassigned</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Sort By</FormLabel>
                        <Select
                          size="sm"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          bg="white"
                        >
                          <option value="scheduledDate">Schedule Date</option>
                          <option value="createdAt">Created Date</option>
                          <option value="riderName">Rider Name</option>
                          <option value="status">Status</option>
                          <option value="fare">Fare</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Order</FormLabel>
                        <Select
                          size="sm"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          bg="white"
                        >
                          <option value="desc">Newest First</option>
                          <option value="asc">Oldest First</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Per Page</FormLabel>
                        <Select
                          size="sm"
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          bg="white"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>

                    {/* Advanced Filters Toggle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<SettingsIcon />}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                    </Button>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50" w="full">
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          <FormControl>
                            <FormLabel fontSize="sm">Rider Filter</FormLabel>
                            <Input
                              size="sm"
                              placeholder="Search by rider name, phone, email..."
                              value={riderFilter}
                              onChange={(e) => setRiderFilter(e.target.value)}
                              bg="white"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Location Filter</FormLabel>
                            <Input
                              size="sm"
                              placeholder="Search pickup or dropoff location..."
                              value={locationFilter}
                              onChange={(e) => setLocationFilter(e.target.value)}
                              bg="white"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Date Range</FormLabel>
                            <HStack>
                              <Input
                                size="sm"
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                bg="white"
                              />
                              <Text fontSize="sm">to</Text>
                              <Input
                                size="sm"
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                bg="white"
                              />
                            </HStack>
                          </FormControl>
                        </SimpleGrid>

                        <Box mt={4}>
                          <FormControl>
                            <FormLabel fontSize="sm">Fare Range: ${fareRange[0]} - ${fareRange[1]}</FormLabel>
                            <RangeSlider
                              value={fareRange}
                              onChange={setFareRange}
                              min={0}
                              max={1000}
                              step={10}
                            >
                              <RangeSliderTrack>
                                <RangeSliderFilledTrack />
                              </RangeSliderTrack>
                              <RangeSliderThumb index={0} />
                              <RangeSliderThumb index={1} />
                            </RangeSlider>
                          </FormControl>
                        </Box>

                        <Flex mt={4} gap={2}>
                          <Button size="sm" onClick={clearFilters} variant="outline">
                            Clear All Filters
                          </Button>
                        </Flex>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Bulk Actions */}
              {bulkSelected.length > 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <HStack spacing={4} flex={1}>
                    <Text>{bulkSelected.length} trips selected</Text>
                    <Button size="sm" colorScheme="orange" onClick={() => handleBulkAction('cancel')}>
                      Cancel Selected
                    </Button>
                    <Button size="sm" colorScheme="green" onClick={() => handleBulkAction('complete')}>
                      Complete Selected
                    </Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleBulkAction('delete')}>
                      Delete Selected
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setBulkSelected([])}>
                      Clear Selection
                    </Button>
                  </HStack>
                </Alert>
              )}

              {/* Results Summary */}
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTrips.length)} of {filteredTrips.length} trips
                  {filteredTrips.length !== trips.length && ` (filtered from ${trips.length} total)`}
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Text fontSize="sm">
                    Page {currentPage} of {totalFilteredPages}
                  </Text>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalFilteredPages, currentPage + 1))}
                    isDisabled={currentPage === totalFilteredPages}
                  >
                    Next
                  </Button>
                </HStack>
              </Flex>

              {/* Trips Table */}
              <Card>
                <CardBody p={0}>
                  {loading ? (
                    <Center p={8}>
                      <VStack>
                        <Spinner size="xl" color="blue.500" />
                        <Text>Loading trips...</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>
                              <Checkbox
                                isChecked={bulkSelected.length === filteredTrips.length && filteredTrips.length > 0}
                                isIndeterminate={bulkSelected.length > 0 && bulkSelected.length < filteredTrips.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                            </Th>
                            <Th>Rider & Contact</Th>
                            <Th>Route</Th>
                            <Th>Schedule</Th>
                            <Th>Status</Th>
                            <Th>Driver/Vehicle</Th>
                            <Th>Fare</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {paginatedTrips.length > 0 ? (
                            paginatedTrips.map((trip) => (
                              <Tr key={trip._id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <Checkbox
                                    isChecked={bulkSelected.includes(trip._id)}
                                    onChange={(e) => handleBulkSelect(trip._id, e.target.checked)}
                                  />
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="semibold" fontSize="sm">
                                      👤 {trip.riderName}
                                    </Text>
                                    {trip.riderPhone && (
                                      <Text fontSize="xs" color="gray.600">
                                        📞 {trip.riderPhone}
                                      </Text>
                                    )}
                                    {trip.riderEmail && (
                                      <Text fontSize="xs" color="gray.600">
                                        📧 {trip.riderEmail}
                                      </Text>
                                    )}
                                  </VStack>
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="xs" color="green.600">
                                      📍 {trip.pickupLocation?.address?.substring(0, 40)}
                                      {trip.pickupLocation?.address?.length > 40 ? '...' : ''}
                                    </Text>
                                    <Text fontSize="xs" color="red.600">
                                      🎯 {trip.dropoffLocation?.address?.substring(0, 40)}
                                      {trip.dropoffLocation?.address?.length > 40 ? '...' : ''}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="sm" fontWeight="medium">
                                      📅 {formatDate(trip.scheduledDate)}
                                    </Text>
                                    {trip.scheduledTime && (
                                      <Text fontSize="xs" color="gray.600">
                                        🕐 {trip.scheduledTime}
                                      </Text>
                                    )}
                                    {trip.isRecurring && (
                                      <Badge size="sm" colorScheme="purple">
                                        🔄 Recurring
                                      </Badge>
                                    )}
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                    {trip.status?.charAt(0)?.toUpperCase() + trip.status?.slice(1)}
                                  </Badge>
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="xs">
                                      🚗 {trip.assignedDriver?.name || 'Unassigned'}
                                    </Text>
                                    {trip.assignedVehicle && (
                                      <Text fontSize="xs" color="gray.600">
                                        🚙 {trip.assignedVehicle}
                                      </Text>
                                    )}
                                  </VStack>
                                </Td>
                                <Td>
                                  {trip.fare && (
                                    <Text fontSize="sm" fontWeight="semibold" color="green.600">
                                      💰 {trip.fare}
                                    </Text>
                                  )}
                                </Td>
                                <Td>
                                  <HStack spacing={1}>
                                    <Tooltip label="View Details">
                                      <IconButton
                                        size="xs"
                                        icon={<FaEye />}
                                        variant="ghost"
                                        colorScheme="blue"
                                        onClick={() => handleViewTrip(trip)}
                                      />
                                    </Tooltip>
                                    <Tooltip label={trip.status === 'completed' ? "Completed trips cannot be edited" : "Edit Trip"}>
                                      <IconButton
                                        size="xs"
                                        icon={<FaEdit />}
                                        variant="ghost"
                                        colorScheme="orange"
                                        isDisabled={trip.status === 'completed'}
                                        onClick={() => handleEditTrip(trip)}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Delete Trip">
                                      <IconButton
                                        size="xs"
                                        icon={<FaTrash />}
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => handleDeleteTrip(trip)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={8}>
                                <Center py={8}>
                                  <VStack>
                                    <FaRoute size={40} color="gray.300" />
                                    <Text color="gray.500">
                                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || riderFilter || locationFilter
                                        ? 'No trips match your current filters'
                                        : 'No trips found'}
                                    </Text>
                                    {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || riderFilter || locationFilter) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={clearFilters}
                                      >
                                        Clear Filters
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
                  )}
                </CardBody>
              </Card>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Text fontSize="sm" color="gray.600">
              {filteredTrips.length} trips • {bulkSelected.length} selected
            </Text>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <TripDetailsModal
          isOpen={isDetailsOpen}
          onClose={onDetailsClose}
          trip={selectedTrip}
        />
      )}

      {/* Trip Edit Modal */}
      {selectedTrip && (
        <TripEditModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          trip={selectedTrip}
          onSave={() => {
            fetchTrips();
            if (onTripUpdate) onTripUpdate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        title="Delete Trip"
        message={`Are you sure you want to delete the trip for ${selectedTrip?.riderName}? This action cannot be undone.`}
      />
    </>
  );
};

export default TripManagementModal;