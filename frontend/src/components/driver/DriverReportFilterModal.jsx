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
  FaFilter,
  FaCar
} from 'react-icons/fa';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

const DriverReportFilterModal = ({ 
  isOpen, 
  onClose, 
  onApplyFilter, 
  initialFilters = {} 
}) => {
  const toast = useToast();
  const { user } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    tripType: 'all',
    riderName: '',
    pickupLocation: '',
    dropoffLocation: '',
    vehicleType: 'all',
    ...initialFilters
  });

  const [availableRiders, setAvailableRiders] = useState([]);
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

  // Load available data for filters
  useEffect(() => {
    if (isOpen && user) {
      loadFilterData();
    }
  }, [isOpen, user]);

  const loadFilterData = async () => {
    try {
      setLoadingData(true);
      
      // Get trips for this specific driver (backend automatically filters by driver role)
      const response = await axios.get('/trips', {
        params: {
          limit: 1000,
          status: 'all'
        }
      });

      if (response.data.success) {
        const trips = response.data.data.trips || [];
        
        // Extract unique riders from driver's trips
        const uniqueRiders = [...new Set(trips.map(trip => trip.riderName))].filter(Boolean);
        setAvailableRiders(uniqueRiders);
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

      // Backend automatically filters by driver role, so no need to add assignedDriver filter
      // Pass filters to parent component
      await onApplyFilter(filters);

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
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      status: 'all',
      tripType: 'all',
      riderName: '',
      pickupLocation: '',
      dropoffLocation: '',
      vehicleType: 'all'
    });
  };

  // Get count of active filters (excluding date range which is always set)
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.tripType !== 'all') count++;
    if (filters.riderName) count++;
    if (filters.pickupLocation) count++;
    if (filters.dropoffLocation) count++;
    if (filters.vehicleType !== 'all') count++;
    return count;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FaFilter />
            <Text>Filter Driver Report</Text>
            {getActiveFiltersCount() > 0 && (
              <Badge colorScheme="blue" borderRadius="full">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loadingData ? (
            <VStack spacing={4} py={8}>
              <Spinner size="lg" color="blue.500" />
              <Text>Loading filter options...</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              
              {/* Date Range Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <CalendarIcon mr={2} />
                  Date Range
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Start Date</FormLabel>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">End Date</FormLabel>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Trip Details Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <TimeIcon mr={2} />
                  Trip Details
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Trip Status</FormLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Trip Type</FormLabel>
                    <Select
                      value={filters.tripType}
                      onChange={(e) => handleFilterChange('tripType', e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="one-way">One Way</option>
                      <option value="round-trip">Round Trip</option>
                      <option value="recurring">Recurring</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Rider and Location Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <FaUser style={{ marginRight: '8px' }} />
                  Rider & Location
                </Text>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Rider Name</FormLabel>
                    <Select
                      value={filters.riderName}
                      onChange={(e) => handleFilterChange('riderName', e.target.value)}
                      placeholder="All Riders"
                    >
                      {availableRiders.map((rider, index) => (
                        <option key={index} value={rider}>{rider}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <SimpleGrid columns={2} spacing={4} width="100%">
                    <FormControl>
                      <FormLabel fontSize="sm">Pickup Location</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FaMapMarkerAlt color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search pickup location..."
                          value={filters.pickupLocation}
                          onChange={(e) => handleFilterChange('pickupLocation', e.target.value)}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Dropoff Location</FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FaMapMarkerAlt color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search dropoff location..."
                          value={filters.dropoffLocation}
                          onChange={(e) => handleFilterChange('dropoffLocation', e.target.value)}
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </Box>

              <Divider />

              {/* Vehicle Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <FaCar style={{ marginRight: '8px' }} />
                  Vehicle
                </Text>
                <FormControl>
                  <FormLabel fontSize="sm">Vehicle Type</FormLabel>
                  <Select
                    value={filters.vehicleType}
                    onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                  >
                    <option value="all">All Vehicle Types</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van</option>
                    <option value="wheelchair">Wheelchair Accessible</option>
                  </Select>
                </FormControl>
              </Box>

              {/* Active Filters Summary */}
              {getActiveFiltersCount() > 0 && (
                <Box>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      {getActiveFiltersCount()} filter(s) active. 
                      Use "Clear Filters" to reset all filters except date range.
                    </Text>
                  </Alert>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClearFilters} size="sm">
              Clear Filters
            </Button>
            <Button variant="ghost" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleApplyFilter} 
              isLoading={loading}
              loadingText="Applying..."
              size="sm"
            >
              Apply Filter
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DriverReportFilterModal;