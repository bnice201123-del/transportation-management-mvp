import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Box,
  Divider,
  Badge,
  SimpleGrid,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  CheckboxGroup,
  Checkbox,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  CalendarIcon,
  SearchIcon,
  TimeIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaMapMarkerAlt,
  FaFilter
} from 'react-icons/fa';
import axios from '../../config/axios';

const RiderHistoryFilterModal = ({ 
  isOpen, 
  onClose, 
  onApplyFilter, 
  initialFilters = {} 
}) => {
  const toast = useToast();
  
  // Filter states
  const [filters, setFilters] = useState({
    riderName: '',
    startDate: '',
    endDate: '',
    status: 'all',
    tripType: 'all',
    assignedDriver: '',
    pickupLocation: '',
    dropoffLocation: '',
    ...initialFilters
  });

  const [availableRiders, setAvailableRiders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Set default date range (last 30 days)
  useEffect(() => {
    if (isOpen && !filters.endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setFilters(prev => ({
        ...prev,
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  // Load available riders and drivers
  useEffect(() => {
    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  const loadFilterData = async () => {
    try {
      setLoadingData(true);
      
      // Get unique riders and drivers from trips
      const response = await axios.get('/api/trips', {
        params: {
          limit: 1000, // Get more trips to extract unique values
          status: 'all'
        }
      });

      if (response.data.success) {
        const trips = response.data.data.trips || [];
        
        // Extract unique riders
        const uniqueRiders = [...new Set(trips.map(trip => trip.riderName))].filter(Boolean);
        setAvailableRiders(uniqueRiders);

        // Extract unique drivers
        const uniqueDrivers = [...new Set(
          trips
            .filter(trip => trip.assignedDriver)
            .map(trip => {
              if (typeof trip.assignedDriver === 'object') {
                return `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`;
              }
              return trip.assignedDriver;
            })
        )].filter(Boolean);
        setAvailableDrivers(uniqueDrivers);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter options',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilter = async () => {
    try {
      setLoading(true);
      
      // Validate date range
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (start > end) {
          toast({
            title: 'Invalid Date Range',
            description: 'Start date must be before end date',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }

      // Pass filters to parent component
      await onApplyFilter(filters);
      
      toast({
        title: 'Filter Applied',
        description: 'Rider history has been filtered successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error applying filter:', error);
      toast({
        title: 'Filter Error',
        description: 'Failed to apply filter. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilters({
      riderName: '',
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      status: 'all',
      tripType: 'all',
      assignedDriver: '',
      pickupLocation: '',
      dropoffLocation: ''
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="4xl">
        <ModalHeader>
          <HStack>
            <FaFilter color="purple" />
            <Text>Filter Rider History</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Box bg="purple.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="purple.500">
              <Text fontSize="sm" color="purple.700">
                Use the filters below to find specific trips. You can filter by rider, date range, 
                trip status, and locations to narrow down your search.
              </Text>
            </Box>

            {loadingData ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="purple.500" />
                <Text mt={2} color="gray.500">Loading filter options...</Text>
              </Box>
            ) : (
              <>
                {/* Date Range Filter */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="purple.600">
                    📅 Date Range
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Start Date</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <CalendarIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          placeholder="Select start date"
                        />
                      </InputGroup>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">End Date</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <CalendarIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          placeholder="Select end date"
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Rider Information */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="blue.600">
                    👤 Rider Information
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Rider Name</FormLabel>
                      <Select
                        value={filters.riderName}
                        onChange={(e) => handleFilterChange('riderName', e.target.value)}
                        placeholder="Select rider"
                      >
                        {availableRiders.map((rider, index) => (
                          <option key={index} value={rider}>
                            {rider}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Assigned Driver</FormLabel>
                      <Select
                        value={filters.assignedDriver}
                        onChange={(e) => handleFilterChange('assignedDriver', e.target.value)}
                        placeholder="Select driver"
                      >
                        {availableDrivers.map((driver, index) => (
                          <option key={index} value={driver}>
                            {driver}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Trip Details */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="green.600">
                    🚗 Trip Details
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Trip Status</FormLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Trip Type</FormLabel>
                      <Select
                        value={filters.tripType}
                        onChange={(e) => handleFilterChange('tripType', e.target.value)}
                      >
                        <option value="all">All Types</option>
                        <option value="regular">Regular</option>
                        <option value="medical">Medical</option>
                        <option value="urgent">Urgent</option>
                        <option value="recurring">Recurring</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Location Filters */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="orange.600">
                    📍 Location Filters
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Pickup Location (contains)</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FaMapMarkerAlt color="blue" />
                        </InputLeftElement>
                        <Input
                          value={filters.pickupLocation}
                          onChange={(e) => handleFilterChange('pickupLocation', e.target.value)}
                          placeholder="Enter pickup location keywords"
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Dropoff Location (contains)</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FaMapMarkerAlt color="red" />
                        </InputLeftElement>
                        <Input
                          value={filters.dropoffLocation}
                          onChange={(e) => handleFilterChange('dropoffLocation', e.target.value)}
                          placeholder="Enter dropoff location keywords"
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                {/* Filter Summary */}
                {(filters.riderName || filters.startDate || filters.endDate || 
                  filters.status !== 'all' || filters.tripType !== 'all' ||
                  filters.assignedDriver || filters.pickupLocation || filters.dropoffLocation) && (
                  <Box bg="gray.50" p={3} borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Active Filters:</Text>
                    <HStack wrap="wrap" spacing={2}>
                      {filters.riderName && (
                        <Badge colorScheme="blue">Rider: {filters.riderName}</Badge>
                      )}
                      {filters.startDate && (
                        <Badge colorScheme="purple">From: {filters.startDate}</Badge>
                      )}
                      {filters.endDate && (
                        <Badge colorScheme="purple">To: {filters.endDate}</Badge>
                      )}
                      {filters.status !== 'all' && (
                        <Badge colorScheme="green">Status: {filters.status}</Badge>
                      )}
                      {filters.tripType !== 'all' && (
                        <Badge colorScheme="cyan">Type: {filters.tripType}</Badge>
                      )}
                      {filters.assignedDriver && (
                        <Badge colorScheme="teal">Driver: {filters.assignedDriver}</Badge>
                      )}
                      {filters.pickupLocation && (
                        <Badge colorScheme="orange">Pickup: {filters.pickupLocation}</Badge>
                      )}
                      {filters.dropoffLocation && (
                        <Badge colorScheme="red">Dropoff: {filters.dropoffLocation}</Badge>
                      )}
                    </HStack>
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClearFilters} isDisabled={loading || loadingData}>
              Clear All
            </Button>
            <Button variant="outline" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleApplyFilter}
              isLoading={loading}
              loadingText="Applying Filter..."
              isDisabled={loadingData}
            >
              Apply Filter & View Results
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RiderHistoryFilterModal;