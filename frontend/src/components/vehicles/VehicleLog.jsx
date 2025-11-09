import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Button,
  SimpleGrid,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Icon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import {
  CalendarIcon,
  TimeIcon,
  ViewIcon,
  DownloadIcon,
  ChevronDownIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import {
  FaMapMarkerAlt,
  FaUser,
  FaClock,
  FaRoute,
  FaCalendarDay,
  FaCar,
  FaFilter,
  FaFileExport,
  FaHistory,
  FaEye,
  FaTruck,
  FaChartLine,
  FaGasPump,
  FaRoad
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import VehicleLogFilterModal from './VehicleLogFilterModal';

const VehicleLog = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('purple.50', 'purple.900');
  
  // State management
  const [vehicleTrips, setVehicleTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [totalTrips, setTotalTrips] = useState(0);
  const [viewMode, setViewMode] = useState('cards'); // cards or table
  const [hasFiltered, setHasFiltered] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  
  // Current filters
  const [currentFilters, setCurrentFilters] = useState({
    vehicleId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    tripType: 'all',
    riderName: '',
    driverName: '',
    pickupLocation: '',
    dropoffLocation: ''
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalDistance: 0,
    totalDuration: 0,
    uniqueDrivers: 0,
    uniqueRiders: 0,
    averageTripDistance: 0,
    utilizationRate: 0
  });

  // Check if modal should open on mount or if vehicle ID is provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vehicleId = params.get('vehicleId');
    const openFilter = params.get('openFilter') === 'true';
    
    if (vehicleId) {
      setCurrentFilters(prev => ({ ...prev, vehicleId }));
      setCurrentVehicle(vehicleId);
      loadVehicleTrips({ ...currentFilters, vehicleId });
    } else if (openFilter) {
      onFilterOpen();
      // Clean up URL without replacing history
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else {
      // No vehicle selected, show filter modal
      onFilterOpen();
    }
  }, [location, onFilterOpen]);

  const loadVehicleTrips = async (filters = null) => {
    try {
      setLoading(true);
      setError('');

      // Set default date range if no filters provided
      const filtersToUse = filters || currentFilters;

      if (!filtersToUse.vehicleId) {
        setError('No vehicle selected');
        return;
      }

      // If no date range set, use last 30 days
      if (!filtersToUse.startDate || !filtersToUse.endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        filtersToUse.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        filtersToUse.endDate = today.toISOString().split('T')[0];
      }

      // Build query parameters
      const params = {
        vehicleId: filtersToUse.vehicleId,
        ...filtersToUse,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Remove empty/default values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      console.log('Loading vehicle trips with params:', params);

      const response = await axios.get('/api/trips', { params });

      if (response.data.success) {
        const trips = response.data.data.trips || [];
        setVehicleTrips(trips);
        setTotalTrips(response.data.data.total || trips.length);
        setCurrentVehicle(filtersToUse.vehicleId);
        
        // Calculate statistics
        calculateStatistics(trips);
        
        console.log(`Loaded ${trips.length} trips for vehicle ${filtersToUse.vehicleId}`);
      } else {
        setError('Failed to load vehicle trips');
      }
    } catch (error) {
      console.error('Error loading vehicle trips:', error);
      setError('Failed to load trip data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load vehicle trip history',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (trips) => {
    const stats = {
      totalTrips: trips.length,
      completedTrips: trips.filter(trip => trip.status === 'completed').length,
      totalDistance: 0,
      totalDuration: 0,
      uniqueDrivers: 0,
      uniqueRiders: 0,
      averageTripDistance: 0,
      utilizationRate: 0
    };

    const uniqueDriverSet = new Set();
    const uniqueRiderSet = new Set();

    trips.forEach(trip => {
      // Calculate distance (if available)
      if (trip.distance) {
        stats.totalDistance += parseFloat(trip.distance) || 0;
      }

      // Calculate duration (if available)
      if (trip.estimatedDuration) {
        stats.totalDuration += parseInt(trip.estimatedDuration) || 0;
      }

      // Count unique drivers
      if (trip.assignedDriver) {
        if (typeof trip.assignedDriver === 'object') {
          uniqueDriverSet.add(`${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`);
        } else {
          uniqueDriverSet.add(trip.assignedDriver);
        }
      }

      // Count unique riders
      if (trip.riderName) {
        uniqueRiderSet.add(trip.riderName);
      }
    });

    stats.uniqueDrivers = uniqueDriverSet.size;
    stats.uniqueRiders = uniqueRiderSet.size;

    // Calculate average trip distance
    if (stats.totalTrips > 0) {
      stats.averageTripDistance = stats.totalDistance / stats.totalTrips;
    }

    // Calculate utilization rate (completed trips / total trips)
    if (stats.totalTrips > 0) {
      stats.utilizationRate = (stats.completedTrips / stats.totalTrips) * 100;
    }

    setStatistics(stats);
  };

  const handleFilterApply = async (filters) => {
    try {
      setCurrentFilters(filters);
      setHasFiltered(true);
      
      // Load the filtered trips
      await loadVehicleTrips(filters);
      
      // Small delay to ensure data is loaded before navigation feedback
      setTimeout(() => {
        // Ensure we're on the vehicle log page (without query params)
        navigate('/vehicles/log', { replace: true });
        
        // Show success feedback
        toast({
          title: 'Filters Applied Successfully',
          description: `Found ${vehicleTrips.length} trips for vehicle ${currentVehicle}`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      }, 100);
      
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply filters. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    onDetailOpen();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'scheduled': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getLocationText = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.address) return location.address;
    return 'Location not specified';
  };

  const exportToCSV = () => {
    if (vehicleTrips.length === 0) {
      toast({
        title: 'No Data',
        description: 'No trips available to export',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const csvHeaders = [
      'Date',
      'Time',
      'Vehicle',
      'Driver',
      'Rider',
      'Pickup Location',
      'Dropoff Location', 
      'Status',
      'Trip Type',
      'Distance',
      'Duration'
    ];

    const csvData = vehicleTrips.map(trip => [
      new Date(trip.createdAt).toLocaleDateString(),
      new Date(trip.createdAt).toLocaleTimeString(),
      currentVehicle || 'N/A',
      trip.assignedDriver ? 
        (typeof trip.assignedDriver === 'object' ? 
          `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 
          trip.assignedDriver) : 'N/A',
      trip.riderName || 'N/A',
      getLocationText(trip.pickupLocation),
      getLocationText(trip.dropoffLocation),
      trip.status || 'N/A',
      trip.tripType || 'N/A',
      trip.distance ? `${trip.distance} km` : 'N/A',
      trip.estimatedDuration ? `${trip.estimatedDuration} min` : 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-log-${currentVehicle}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Vehicle log exported to CSV file',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Card bg={headerBg} borderRadius="lg">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" align="center" wrap="wrap">
                <VStack align="start" spacing={1}>
                  <Heading size="lg" display="flex" alignItems="center">
                    <Icon as={FaTruck} mr={3} color="purple.500" />
                    Vehicle Log
                    {currentVehicle && (
                      <Badge ml={3} colorScheme="purple" fontSize="sm">
                        {currentVehicle}
                      </Badge>
                    )}
                  </Heading>
                  <Text color={textColor} fontSize="md">
                    {currentVehicle 
                      ? `View trip history and performance metrics for vehicle ${currentVehicle}`
                      : 'Select a vehicle to view its trip history and performance metrics'
                    }
                  </Text>
                </VStack>
                
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaFilter />}
                    colorScheme="purple"
                    onClick={onFilterOpen}
                    size="sm"
                  >
                    Filter Trips
                  </Button>
                  
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<ChevronDownIcon />}
                      size="sm"
                      variant="outline"
                    >
                      View: {viewMode === 'cards' ? 'Cards' : 'Table'}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setViewMode('cards')}>
                        <ViewIcon mr={2} />
                        Card View
                      </MenuItem>
                      <MenuItem onClick={() => setViewMode('table')}>
                        <Icon as={FaHistory} mr={2} />
                        Table View
                      </MenuItem>
                    </MenuList>
                  </Menu>

                  <Button
                    leftIcon={<DownloadIcon />}
                    onClick={exportToCSV}
                    size="sm"
                    variant="outline"
                    isDisabled={vehicleTrips.length === 0}
                  >
                    Export CSV
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Statistics Section */}
        {currentVehicle && vehicleTrips.length > 0 && (
          <SimpleGrid columns={{ base: 2, md: 4, lg: 8 }} spacing={4}>
            <Stat>
              <StatLabel>Total Trips</StatLabel>
              <StatNumber color="purple.500">{statistics.totalTrips}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Completed</StatLabel>
              <StatNumber color="green.500">{statistics.completedTrips}</StatNumber>
              <StatHelpText>
                {statistics.totalTrips > 0 
                  ? `${Math.round(statistics.utilizationRate)}%` 
                  : '0%'
                }
              </StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Total Distance</StatLabel>
              <StatNumber color="blue.500">{statistics.totalDistance.toFixed(1)} km</StatNumber>
              <StatHelpText>Traveled</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Total Time</StatLabel>
              <StatNumber color="orange.500">{Math.round(statistics.totalDuration / 60)} hrs</StatNumber>
              <StatHelpText>In service</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Avg Distance</StatLabel>
              <StatNumber color="cyan.500">{statistics.averageTripDistance.toFixed(1)} km</StatNumber>
              <StatHelpText>Per trip</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Unique Drivers</StatLabel>
              <StatNumber color="teal.500">{statistics.uniqueDrivers}</StatNumber>
              <StatHelpText>Operated</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Unique Riders</StatLabel>
              <StatNumber color="pink.500">{statistics.uniqueRiders}</StatNumber>
              <StatHelpText>Served</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Utilization</StatLabel>
              <StatNumber color="green.600">{statistics.utilizationRate.toFixed(1)}%</StatNumber>
              <StatHelpText>Success rate</StatHelpText>
            </Stat>
          </SimpleGrid>
        )}

        {/* Active Filters Display */}
        {hasFiltered && currentVehicle && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Filters Applied</Text>
              <Text fontSize="sm">
                Showing trips for vehicle {currentVehicle} from {currentFilters.startDate} to {currentFilters.endDate}
                {currentFilters.status !== 'all' && ` • Status: ${currentFilters.status}`}
                {currentFilters.riderName && ` • Rider: ${currentFilters.riderName}`}
                {currentFilters.driverName && ` • Driver: ${currentFilters.driverName}`}
              </Text>
            </Box>
            <Button
              size="sm"
              ml="auto"
              onClick={() => {
                setHasFiltered(false);
                onFilterOpen();
              }}
            >
              Change Filters
            </Button>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text fontSize="lg" color={textColor}>
              Loading vehicle trip history...
            </Text>
          </VStack>
        ) : error ? (
          /* Error State */
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error Loading Trips</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button ml="auto" onClick={onFilterOpen} size="sm">
              Select Vehicle
            </Button>
          </Alert>
        ) : !currentVehicle ? (
          /* No Vehicle Selected State */
          <Card borderRadius="lg">
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaTruck} fontSize="4xl" color="gray.400" />
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="gray.500">
                    No vehicle selected
                  </Text>
                  <Text color="gray.400">
                    Please select a vehicle to view its trip log
                  </Text>
                </VStack>
                <Button colorScheme="purple" onClick={onFilterOpen}>
                  Select Vehicle
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : vehicleTrips.length === 0 ? (
          /* No Data State */
          <Card borderRadius="lg">
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaHistory} fontSize="4xl" color="gray.400" />
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="gray.500">
                    No trips found
                  </Text>
                  <Text color="gray.400">
                    {hasFiltered 
                      ? `No trips found for vehicle ${currentVehicle} with the current filters`
                      : `Vehicle ${currentVehicle} has no recorded trips yet`
                    }
                  </Text>
                </VStack>
                <Button colorScheme="purple" onClick={onFilterOpen}>
                  Adjust Filters
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {vehicleTrips.map((trip) => (
              <Card key={trip._id} bg={cardBg} borderRadius="lg" _hover={{ shadow: 'md' }}>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {/* Trip Header */}
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(trip.createdAt)}
                        </Text>
                        <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                          {trip.status || 'Unknown'}
                        </Badge>
                      </VStack>
                      <Tooltip label="View Details">
                        <IconButton
                          icon={<FaEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewTrip(trip)}
                        />
                      </Tooltip>
                    </HStack>

                    <Divider />

                    {/* Driver and Rider Info */}
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={FaUser} color="blue.400" />
                        <Text fontSize="sm" fontWeight="medium">
                          Driver: {trip.assignedDriver ? 
                            (typeof trip.assignedDriver === 'object' ? 
                              `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 
                              trip.assignedDriver) : 'Unassigned'}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaUser} color="green.400" />
                        <Text fontSize="sm">
                          Rider: {trip.riderName || 'Unknown Rider'}
                        </Text>
                      </HStack>
                    </VStack>

                    {/* Route Info */}
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="green.400" />
                        <Text fontSize="sm" noOfLines={1}>
                          {getLocationText(trip.pickupLocation) || 'Pickup location not specified'}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaRoute} color="red.400" />
                        <Text fontSize="sm" noOfLines={1}>
                          {getLocationText(trip.dropoffLocation) || 'Dropoff location not specified'}
                        </Text>
                      </HStack>
                    </VStack>

                    {/* Trip Stats */}
                    <SimpleGrid columns={2} spacing={2}>
                      {trip.distance && (
                        <HStack>
                          <Icon as={FaRoad} color="purple.400" size="xs" />
                          <Text fontSize="xs" color={textColor}>
                            {trip.distance} km
                          </Text>
                        </HStack>
                      )}
                      {trip.estimatedDuration && (
                        <HStack>
                          <Icon as={FaClock} color="orange.400" size="xs" />
                          <Text fontSize="xs" color={textColor}>
                            {trip.estimatedDuration} min
                          </Text>
                        </HStack>
                      )}
                      {trip.tripType && (
                        <HStack>
                          <Icon as={FaChartLine} color="cyan.400" size="xs" />
                          <Text fontSize="xs" color={textColor}>
                            {trip.tripType}
                          </Text>
                        </HStack>
                      )}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          /* Table View */
          <Card>
            <CardBody>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date & Time</Th>
                      <Th>Driver</Th>
                      <Th>Rider</Th>
                      <Th>Route</Th>
                      <Th>Status</Th>
                      <Th>Distance</Th>
                      <Th>Duration</Th>
                      <Th>Type</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {vehicleTrips.map((trip) => (
                      <Tr key={trip._id}>
                        <Td>
                          <Text fontSize="sm">
                            {formatDate(trip.createdAt)}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" noOfLines={1}>
                            {trip.assignedDriver ? 
                              (typeof trip.assignedDriver === 'object' ? 
                                `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 
                                trip.assignedDriver) : 'Unassigned'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" noOfLines={1}>
                            {trip.riderName || 'Unknown'}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" noOfLines={1} color="green.600">
                              From: {getLocationText(trip.pickupLocation)}
                            </Text>
                            <Text fontSize="xs" noOfLines={1} color="red.600">
                              To: {getLocationText(trip.dropoffLocation)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                            {trip.status || 'Unknown'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {trip.distance ? `${trip.distance} km` : 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {trip.estimatedDuration ? `${trip.estimatedDuration} min` : 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {trip.tripType || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewTrip(trip)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        {/* Show total count */}
        {vehicleTrips.length > 0 && (
          <Text textAlign="center" fontSize="sm" color={textColor}>
            Showing {vehicleTrips.length} of {totalTrips} trips for vehicle {currentVehicle}
          </Text>
        )}
      </VStack>

      {/* Filter Modal */}
      <VehicleLogFilterModal
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        onApplyFilter={handleFilterApply}
        initialFilters={currentFilters}
        selectedVehicleId={currentVehicle}
      />

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Trip Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Date & Time</Text>
                    <Text>{formatDate(selectedTrip.createdAt)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedTrip.status)}>
                      {selectedTrip.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Vehicle</Text>
                    <Text>{currentVehicle || 'Unknown'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Trip Type</Text>
                    <Text>{selectedTrip.tripType || 'N/A'}</Text>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Driver</Text>
                    <Text>{selectedTrip.assignedDriver ? 
                      (typeof selectedTrip.assignedDriver === 'object' ? 
                        `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}` : 
                        selectedTrip.assignedDriver) : 'Unassigned'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Rider</Text>
                    <Text>{selectedTrip.riderName || 'Unknown'}</Text>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500" mb={2}>Route</Text>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="green.400" />
                      <Text fontSize="sm">{getLocationText(selectedTrip.pickupLocation)}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaRoute} color="red.400" />
                      <Text fontSize="sm">{getLocationText(selectedTrip.dropoffLocation)}</Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Divider />
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Distance</Text>
                    <Text>{selectedTrip.distance ? `${selectedTrip.distance} km` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Duration</Text>
                    <Text>{selectedTrip.estimatedDuration ? `${selectedTrip.estimatedDuration} min` : 'N/A'}</Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onDetailClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default VehicleLog;