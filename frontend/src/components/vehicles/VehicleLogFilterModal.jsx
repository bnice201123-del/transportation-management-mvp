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
  FaCar,
  FaTruck
} from 'react-icons/fa';
import axios from '../../config/axios';

const VehicleLogFilterModal = ({ 
  isOpen, 
  onClose, 
  onApplyFilter, 
  initialFilters = {},
  selectedVehicleId = null 
}) => {
  const toast = useToast();
  
  // Filter states
  const [filters, setFilters] = useState({
    vehicleId: selectedVehicleId || '',
    startDate: '',
    endDate: '',
    status: 'all',
    tripType: 'all',
    riderName: '',
    driverName: '',
    pickupLocation: '',
    dropoffLocation: '',
    ...initialFilters
  });

  const [availableVehicles, setAvailableVehicles] = useState([]);
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

  // Update vehicleId when selectedVehicleId changes
  useEffect(() => {
    if (selectedVehicleId) {
      setFilters(prev => ({ ...prev, vehicleId: selectedVehicleId }));
    }
  }, [selectedVehicleId]);

  // Load available data for filters
  useEffect(() => {
    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  const loadFilterData = async () => {
    try {
      setLoadingData(true);
      
      // Get all trips to extract filter options
      const tripsResponse = await axios.get('/api/trips', {
        params: {
          limit: 1000,
          status: 'all'
        }
      });

      if (tripsResponse.data.success) {
        const trips = tripsResponse.data.data.trips || [];
        
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

        // Extract unique vehicles from trips
        const uniqueVehicles = [...new Set(
          trips
            .filter(trip => trip.vehicleId || (trip.assignedDriver && trip.assignedDriver.vehicleInfo))
            .map(trip => {
              if (trip.vehicleId) {
                return trip.vehicleId;
              }
              if (trip.assignedDriver && trip.assignedDriver.vehicleInfo) {
                return trip.assignedDriver.vehicleInfo.vehicleId || trip.assignedDriver.vehicleInfo.licensePlate;
              }
              return null;
            })
        )].filter(Boolean);
        setAvailableVehicles(uniqueVehicles);
      }

      // Also try to get vehicles from a dedicated vehicles endpoint if it exists
      try {
        const vehiclesResponse = await axios.get('/api/vehicles');
        if (vehiclesResponse.data.success) {
          const vehicles = vehiclesResponse.data.data || vehiclesResponse.data.vehicles || [];
          const vehicleOptions = vehicles.map(vehicle => ({
            id: vehicle._id || vehicle.vehicleId,
            label: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` || vehicle.vehicleId || vehicle.id,
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model
          }));
          setAvailableVehicles(prev => {
            const combined = [...prev, ...vehicleOptions.map(v => v.id)];
            return [...new Set(combined)];
          });
        }
      } catch (vehicleError) {
        // Vehicles endpoint might not exist, that's okay
        console.log('No dedicated vehicles endpoint available');
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

      // Validate vehicle selection
      if (!filters.vehicleId) {
        toast({
          title: 'Vehicle Required',
          description: 'Please select a vehicle to view its log',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

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
      vehicleId: selectedVehicleId || '',
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      status: 'all',
      tripType: 'all',
      riderName: '',
      driverName: '',
      pickupLocation: '',
      dropoffLocation: ''
    });
  };

  // Get count of active filters (excluding date range and vehicle which are required)
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.tripType !== 'all') count++;
    if (filters.riderName) count++;
    if (filters.driverName) count++;
    if (filters.pickupLocation) count++;
    if (filters.dropoffLocation) count++;
    return count;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FaFilter />
            <Text>Filter Vehicle Log</Text>
            {getActiveFiltersCount() > 0 && (
              <Badge colorScheme="purple" borderRadius="full">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loadingData ? (
            <VStack spacing={4} py={8}>
              <Spinner size="lg" color="purple.500" />
              <Text>Loading filter options...</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              
              {/* Vehicle Selection Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <FaTruck style={{ marginRight: '8px' }} />
                  Vehicle Selection
                </Text>
                <FormControl>
                  <FormLabel fontSize="sm">Select Vehicle *</FormLabel>
                  <Select
                    value={filters.vehicleId}
                    onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
                    placeholder="Choose a vehicle..."
                  >
                    {availableVehicles.map((vehicleId, index) => (
                      <option key={index} value={vehicleId}>
                        {vehicleId}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Divider />

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
                      <option value="scheduled">Scheduled</option>
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

              {/* People Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <FaUser style={{ marginRight: '8px' }} />
                  People
                </Text>
                <SimpleGrid columns={2} spacing={4}>
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
                  <FormControl>
                    <FormLabel fontSize="sm">Driver Name</FormLabel>
                    <Select
                      value={filters.driverName}
                      onChange={(e) => handleFilterChange('driverName', e.target.value)}
                      placeholder="All Drivers"
                    >
                      {availableDrivers.map((driver, index) => (
                        <option key={index} value={driver}>{driver}</option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Location Section */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
                  <FaMapMarkerAlt style={{ marginRight: '8px' }} />
                  Locations
                </Text>
                <SimpleGrid columns={2} spacing={4}>
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
              </Box>

              {/* Required Field Notice */}
              <Box>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    * Vehicle selection is required to view trip logs.
                  </Text>
                </Alert>
              </Box>

              {/* Active Filters Summary */}
              {getActiveFiltersCount() > 0 && (
                <Box>
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      {getActiveFiltersCount()} additional filter(s) active. 
                      Use "Clear Filters" to reset all filters except vehicle and date range.
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
              colorScheme="purple" 
              onClick={handleApplyFilter} 
              isLoading={loading}
              loadingText="Applying..."
              size="sm"
              isDisabled={!filters.vehicleId}
            >
              Apply Filter
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VehicleLogFilterModal;