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
  FaChartLine
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import DriverReportFilterModal from './DriverReportFilterModal';

const DriverReport = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  
  // State management
  const [driverTrips, setDriverTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [totalTrips, setTotalTrips] = useState(0);
  const [viewMode, setViewMode] = useState('cards'); // cards or table
  const [hasFiltered, setHasFiltered] = useState(false);
  
  // Current filters
  const [currentFilters, setCurrentFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    tripType: 'all',
    riderName: '',
    pickupLocation: '',
    dropoffLocation: '',
    vehicleType: 'all'
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalDistance: 0,
    totalDuration: 0,
    averageRating: 0,
    totalEarnings: 0
  });

  // Check if modal should open on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openFilter') === 'true') {
      onFilterOpen();
      // Clean up URL without replacing history
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location, onFilterOpen]);

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadDriverTrips();
    }
  }, [user]);

  const loadDriverTrips = async (filters = null) => {
    try {
      setLoading(true);
      setError('');

      if (!user?.email) {
        setError('User not authenticated');
        return;
      }

      // Set default date range if no filters provided
      // Backend automatically filters by driver role, so no need to add assignedDriver filter
      const filtersToUse = filters || currentFilters;

      // If no date range set, use last 30 days
      if (!filtersToUse.startDate || !filtersToUse.endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        filtersToUse.startDate = thirtyDaysAgo.toISOString().split('T')[0];
        filtersToUse.endDate = today.toISOString().split('T')[0];
      }

      // Build query parameters
      // Backend automatically filters by driver role, so no need to add assignedDriver filter
      const params = {
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

      console.log('Loading driver trips with params:', params);

      const response = await axios.get('/api/trips', { params });

      if (response.data.success) {
        const trips = response.data.data.trips || [];
        setDriverTrips(trips);
        setTotalTrips(response.data.data.total || trips.length);
        
        // Calculate statistics
        calculateStatistics(trips);
        
        console.log(`Loaded ${trips.length} trips for driver`);
      } else {
        setError('Failed to load driver trips');
      }
    } catch (error) {
      console.error('Error loading driver trips:', error);
      setError('Failed to load trip data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load your trip history',
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
      averageRating: 0,
      totalEarnings: 0
    };

    let totalRating = 0;
    let ratedTrips = 0;

    trips.forEach(trip => {
      // Calculate distance (if available)
      if (trip.distance) {
        stats.totalDistance += parseFloat(trip.distance) || 0;
      }

      // Calculate duration (if available)
      if (trip.estimatedDuration) {
        stats.totalDuration += parseInt(trip.estimatedDuration) || 0;
      }

      // Calculate ratings (if available)
      if (trip.driverRating) {
        totalRating += parseFloat(trip.driverRating);
        ratedTrips++;
      }

      // Calculate earnings (if available)
      if (trip.fare) {
        stats.totalEarnings += parseFloat(trip.fare) || 0;
      }
    });

    // Calculate average rating
    if (ratedTrips > 0) {
      stats.averageRating = totalRating / ratedTrips;
    }

    setStatistics(stats);
  };

  const handleFilterApply = async (filters) => {
    try {
      setCurrentFilters(filters);
      setHasFiltered(true);
      
      // Load the filtered trips
      await loadDriverTrips(filters);
      
      // Small delay to ensure data is loaded before navigation feedback
      setTimeout(() => {
        // Ensure we're on the driver report page (without query params)
        navigate('/driver/report', { replace: true });
        
        // Show success feedback
        toast({
          title: 'Filters Applied Successfully',
          description: `Found ${driverTrips.length} trips matching your criteria`,
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
    if (driverTrips.length === 0) {
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
      'Rider',
      'Pickup Location',
      'Dropoff Location', 
      'Status',
      'Trip Type',
      'Distance',
      'Duration',
      'Fare',
      'Rating'
    ];

    const csvData = driverTrips.map(trip => [
      new Date(trip.createdAt).toLocaleDateString(),
      new Date(trip.createdAt).toLocaleTimeString(),
      trip.riderName || 'N/A',
      getLocationText(trip.pickupLocation),
      getLocationText(trip.dropoffLocation),
      trip.status || 'N/A',
      trip.tripType || 'N/A',
      trip.distance ? `${trip.distance} km` : 'N/A',
      trip.estimatedDuration ? `${trip.estimatedDuration} min` : 'N/A',
      trip.fare ? `$${trip.fare}` : 'N/A',
      trip.driverRating ? `${trip.driverRating}/5` : 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `driver-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Driver report exported to CSV file',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your driver report.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

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
                    <Icon as={FaTruck} mr={3} color="blue.500" />
                    Driver Report
                  </Heading>
                  <Text color={textColor} fontSize="md">
                    View and analyze your trip history and performance metrics
                  </Text>
                </VStack>
                
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaFilter />}
                    colorScheme="blue"
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
                    isDisabled={driverTrips.length === 0}
                  >
                    Export CSV
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Statistics Section */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
          <Stat>
            <StatLabel>Total Trips</StatLabel>
            <StatNumber color="blue.500">{statistics.totalTrips}</StatNumber>
            <StatHelpText>All time</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Completed</StatLabel>
            <StatNumber color="green.500">{statistics.completedTrips}</StatNumber>
            <StatHelpText>
              {statistics.totalTrips > 0 
                ? `${Math.round((statistics.completedTrips / statistics.totalTrips) * 100)}%` 
                : '0%'
              }
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Total Distance</StatLabel>
            <StatNumber color="purple.500">{statistics.totalDistance.toFixed(1)} km</StatNumber>
            <StatHelpText>Driven</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Total Time</StatLabel>
            <StatNumber color="orange.500">{Math.round(statistics.totalDuration / 60)} hrs</StatNumber>
            <StatHelpText>On trips</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Average Rating</StatLabel>
            <StatNumber color="yellow.500">
              {statistics.averageRating > 0 ? statistics.averageRating.toFixed(1) : 'N/A'}
            </StatNumber>
            <StatHelpText>Out of 5.0</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Total Earnings</StatLabel>
            <StatNumber color="green.600">${statistics.totalEarnings.toFixed(2)}</StatNumber>
            <StatHelpText>Gross fare</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Active Filters Display */}
        {hasFiltered && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Filters Applied</Text>
              <Text fontSize="sm">
                Showing trips from {currentFilters.startDate} to {currentFilters.endDate}
                {currentFilters.status !== 'all' && ` • Status: ${currentFilters.status}`}
                {currentFilters.riderName && ` • Rider: ${currentFilters.riderName}`}
              </Text>
            </Box>
            <Button
              size="sm"
              ml="auto"
              onClick={() => {
                setHasFiltered(false);
                setCurrentFilters({
                  startDate: '',
                  endDate: '',
                  status: 'all',
                  tripType: 'all',
                  riderName: '',
                  pickupLocation: '',
                  dropoffLocation: '',
                  vehicleType: 'all'
                });
                loadDriverTrips();
              }}
            >
              Clear Filters
            </Button>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg" color={textColor}>
              Loading your trip history...
            </Text>
          </VStack>
        ) : error ? (
          /* Error State */
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error Loading Trips</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button ml="auto" onClick={() => loadDriverTrips()} size="sm">
              Retry
            </Button>
          </Alert>
        ) : driverTrips.length === 0 ? (
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
                      ? 'Try adjusting your filters to see more trips'
                      : 'You haven\'t completed any trips yet'
                    }
                  </Text>
                </VStack>
                {hasFiltered && (
                  <Button colorScheme="blue" onClick={onFilterOpen}>
                    Adjust Filters
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {driverTrips.map((trip) => (
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

                    {/* Rider Info */}
                    <HStack>
                      <Icon as={FaUser} color="blue.400" />
                      <Text fontSize="sm" fontWeight="medium">
                        {trip.riderName || 'Unknown Rider'}
                      </Text>
                    </HStack>

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
                          <Icon as={FaCar} color="purple.400" size="xs" />
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
                      {trip.fare && (
                        <HStack>
                          <Icon as={FaChartLine} color="green.400" size="xs" />
                          <Text fontSize="xs" color={textColor}>
                            ${trip.fare}
                          </Text>
                        </HStack>
                      )}
                      {trip.driverRating && (
                        <HStack>
                          <Text fontSize="xs" color="yellow.500">
                            ★ {trip.driverRating}/5
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
                      <Th>Rider</Th>
                      <Th>Route</Th>
                      <Th>Status</Th>
                      <Th>Distance</Th>
                      <Th>Duration</Th>
                      <Th>Fare</Th>
                      <Th>Rating</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {driverTrips.map((trip) => (
                      <Tr key={trip._id}>
                        <Td>
                          <Text fontSize="sm">
                            {formatDate(trip.createdAt)}
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
                          <Text fontSize="sm" color="green.600">
                            {trip.fare ? `$${trip.fare}` : 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="yellow.500">
                            {trip.driverRating ? `★ ${trip.driverRating}/5` : 'N/A'}
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
        {driverTrips.length > 0 && (
          <Text textAlign="center" fontSize="sm" color={textColor}>
            Showing {driverTrips.length} of {totalTrips} trips
          </Text>
        )}
      </VStack>

      {/* Filter Modal */}
      <DriverReportFilterModal
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        onApplyFilter={handleFilterApply}
        initialFilters={currentFilters}
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
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Rider</Text>
                    <Text>{selectedTrip.riderName || 'Unknown'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Trip Type</Text>
                    <Text>{selectedTrip.tripType || 'N/A'}</Text>
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
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Fare</Text>
                    <Text color="green.600">{selectedTrip.fare ? `$${selectedTrip.fare}` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Rating</Text>
                    <Text color="yellow.500">
                      {selectedTrip.driverRating ? `★ ${selectedTrip.driverRating}/5` : 'Not rated'}
                    </Text>
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

export default DriverReport;