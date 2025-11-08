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
  FaEye
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import RiderHistoryFilterModal from './RiderHistoryFilterModal';

const RiderHistory = () => {
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
  const [riderTrips, setRiderTrips] = useState([]);
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
    riderName: '',
    status: 'all',
    tripType: 'all',
    assignedDriver: '',
    pickupLocation: '',
    dropoffLocation: ''
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    avgDuration: 0,
    uniqueDrivers: 0,
    mostFrequentPickup: '',
    mostFrequentDropoff: ''
  });

  // Check if we should open filter modal immediately (coming from sidebar)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldOpenFilter = searchParams.get('openFilter') === 'true';
    
    if (shouldOpenFilter && !hasFiltered) {
      onFilterOpen();
    } else if (!shouldOpenFilter && hasFiltered) {
      // Load trips with existing filters
      fetchRiderHistory();
    } else if (!hasFiltered) {
      // Load recent trips by default
      loadDefaultHistory();
    }
  }, [location, hasFiltered]);

  // Load default history (last 30 days)
  const loadDefaultHistory = async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const defaultFilters = {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      riderName: '',
      status: 'all',
      tripType: 'all',
      assignedDriver: '',
      pickupLocation: '',
      dropoffLocation: ''
    };
    
    setCurrentFilters(defaultFilters);
    await fetchRiderHistory(defaultFilters);
  };

  // Fetch rider history based on filters
  const fetchRiderHistory = async (filters = currentFilters) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: 1,
        limit: 100, // Get more trips for history
        sortBy: 'scheduledDate',
        sortOrder: 'desc'
      };

      // Add filters to params
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.riderName) params.riderName = filters.riderName;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.tripType && filters.tripType !== 'all') params.tripType = filters.tripType;
      if (filters.assignedDriver) params.assignedDriver = filters.assignedDriver;
      
      // Add location search as general search
      if (filters.pickupLocation || filters.dropoffLocation) {
        params.search = `${filters.pickupLocation} ${filters.dropoffLocation}`.trim();
      }

      const response = await axios.get('/trips', { params });
      
      if (response.data.success) {
        const trips = response.data.data.trips || [];
        setRiderTrips(trips);
        setTotalTrips(response.data.data.total || 0);
        calculateStats(trips);
      } else {
        throw new Error(response.data.message || 'Failed to fetch rider history');
      }
    } catch (err) {
      console.error('Error fetching rider history:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch rider history');
      setRiderTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (trips) => {
    if (!trips.length) {
      setStats({
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        avgDuration: 0,
        uniqueDrivers: 0,
        mostFrequentPickup: '',
        mostFrequentDropoff: ''
      });
      return;
    }

    const completed = trips.filter(trip => trip.status === 'completed').length;
    const cancelled = trips.filter(trip => trip.status === 'cancelled').length;

    const uniqueDrivers = new Set(
      trips.filter(trip => trip.assignedDriver)
        .map(trip => {
          if (typeof trip.assignedDriver === 'object') {
            return `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`;
          }
          return trip.assignedDriver;
        })
    ).size;

    // Calculate average duration
    const totalDuration = trips.reduce((sum, trip) => {
      if (trip.actualPickupTime && trip.actualDropoffTime) {
        return sum + (new Date(trip.actualDropoffTime) - new Date(trip.actualPickupTime));
      }
      return sum + (trip.estimatedDuration || 0) * 60000;
    }, 0);

    // Find most frequent locations
    const pickupCounts = {};
    const dropoffCounts = {};
    
    trips.forEach(trip => {
      if (trip.pickupLocation?.address) {
        pickupCounts[trip.pickupLocation.address] = (pickupCounts[trip.pickupLocation.address] || 0) + 1;
      }
      if (trip.dropoffLocation?.address) {
        dropoffCounts[trip.dropoffLocation.address] = (dropoffCounts[trip.dropoffLocation.address] || 0) + 1;
      }
    });

    const mostFrequentPickup = Object.keys(pickupCounts).reduce((a, b) => 
      pickupCounts[a] > pickupCounts[b] ? a : b, '');
    const mostFrequentDropoff = Object.keys(dropoffCounts).reduce((a, b) => 
      dropoffCounts[a] > dropoffCounts[b] ? a : b, '');
    
    setStats({
      totalTrips: trips.length,
      completedTrips: completed,
      cancelledTrips: cancelled,
      avgDuration: Math.round(totalDuration / trips.length / 60000), // minutes
      uniqueDrivers,
      mostFrequentPickup,
      mostFrequentDropoff
    });
  };

  // Handle filter application
  const handleApplyFilter = async (filters) => {
    setCurrentFilters(filters);
    setHasFiltered(true);
    
    // Update URL to remove openFilter parameter
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    
    await fetchRiderHistory(filters);
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (startTime, endTime, estimatedDuration) => {
    if (startTime && endTime) {
      const duration = Math.round((new Date(endTime) - new Date(startTime)) / 60000);
      return `${duration} min`;
    }
    return estimatedDuration ? `~${estimatedDuration} min` : 'N/A';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'in_progress': return 'blue';
      case 'pending': return 'yellow';
      case 'assigned': return 'cyan';
      default: return 'gray';
    }
  };

  // Handle view trip details
  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    onDetailOpen();
  };

  // Export trips to CSV
  const exportHistory = () => {
    try {
      const csvData = riderTrips.map(trip => ({
        'Trip ID': trip.tripId,
        'Rider Name': trip.riderName,
        'Driver': trip.assignedDriver 
          ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
          : 'Unassigned',
        'Pickup Location': trip.pickupLocation?.address || '',
        'Dropoff Location': trip.dropoffLocation?.address || '',
        'Scheduled Date': new Date(trip.scheduledDate).toLocaleDateString(),
        'Status': trip.status,
        'Trip Type': trip.tripType || 'regular',
        'Duration': formatDuration(trip.actualPickupTime, trip.actualDropoffTime, trip.estimatedDuration)
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
      link.download = `rider_history_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Export Complete',
        description: 'Rider history has been exported successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export rider history.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Trip Card Component
  const TripCard = ({ trip }) => (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="start">
          <VStack align="start" spacing={1} flex={1}>
            <HStack>
              <Badge colorScheme={getStatusColor(trip.status)} variant="subtle" borderRadius="full">
                {trip.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {trip.tripId}
              </Text>
            </HStack>
            <Heading size="sm" color="purple.600" noOfLines={1}>
              {trip.riderName}
            </Heading>
            <Text fontSize="xs" color={textColor}>
              Driver: {trip.assignedDriver 
                ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
                : 'Unassigned'}
            </Text>
          </VStack>
          <Tooltip label="View Details">
            <IconButton
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              colorScheme="purple"
              onClick={() => handleViewDetails(trip)}
            />
          </Tooltip>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {/* Route Information */}
          <Box>
            <HStack mb={2}>
              <Icon as={FaMapMarkerAlt} color="purple.500" />
              <Text fontSize="xs" fontWeight="bold" color="purple.600">
                ROUTE
              </Text>
            </HStack>
            <VStack spacing={1} pl={5}>
              <HStack w="full">
                <Box w={2} h={2} borderRadius="full" bg="blue.400" />
                <Text fontSize="xs" color={textColor} noOfLines={1}>
                  {trip.pickupLocation?.address}
                </Text>
              </HStack>
              <HStack w="full">
                <Box w={2} h={2} borderRadius="full" bg="red.400" />
                <Text fontSize="xs" color={textColor} noOfLines={1}>
                  {trip.dropoffLocation?.address}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Trip Details */}
          <SimpleGrid columns={2} spacing={3}>
            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={FaCalendarDay} color="blue.400" boxSize={3} />
                <Text fontSize="xs" fontWeight="bold">DATE</Text>
              </HStack>
              <Text fontSize="xs" color={textColor}>
                {new Date(trip.scheduledDate).toLocaleDateString()}
              </Text>
            </VStack>

            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={FaClock} color="orange.400" boxSize={3} />
                <Text fontSize="xs" fontWeight="bold">DURATION</Text>
              </HStack>
              <Text fontSize="xs" color={textColor}>
                {formatDuration(trip.actualPickupTime, trip.actualDropoffTime, trip.estimatedDuration)}
              </Text>
            </VStack>
          </SimpleGrid>

          {trip.tripType && trip.tripType !== 'regular' && (
            <HStack>
              <Badge colorScheme="cyan" size="sm">
                {trip.tripType.toUpperCase()}
              </Badge>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Container maxW="7xl" py={6}>
      {/* Header */}
      <Box bg={headerBg} p={6} borderRadius="lg" mb={6}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="purple.600">
              <FaHistory style={{ display: 'inline', marginRight: '12px' }} />
              Rider History
            </Heading>
            <Text color={textColor}>
              {hasFiltered ? 'Filtered trip history' : 'Recent trip history from the past 30 days'}
            </Text>
            {hasFiltered && (
              <HStack spacing={2} wrap="wrap">
                {currentFilters.riderName && (
                  <Badge colorScheme="blue">Rider: {currentFilters.riderName}</Badge>
                )}
                {currentFilters.startDate && (
                  <Badge colorScheme="purple">From: {currentFilters.startDate}</Badge>
                )}
                {currentFilters.endDate && (
                  <Badge colorScheme="purple">To: {currentFilters.endDate}</Badge>
                )}
                {currentFilters.status !== 'all' && (
                  <Badge colorScheme="green">Status: {currentFilters.status}</Badge>
                )}
              </HStack>
            )}
          </VStack>

          <HStack>
            <Button
              leftIcon={<FaFilter />}
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={onFilterOpen}
            >
              Filter History
            </Button>
            
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                View: {viewMode === 'cards' ? 'Cards' : 'Table'}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => setViewMode('cards')}>Card View</MenuItem>
                <MenuItem onClick={() => setViewMode('table')}>Table View</MenuItem>
              </MenuList>
            </Menu>
            
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={exportHistory}
              isDisabled={!riderTrips.length}
            >
              Export CSV
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Trips</StatLabel>
              <StatNumber color="purple.500">{stats.totalTrips}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Completed</StatLabel>
              <StatNumber color="green.500">{stats.completedTrips}</StatNumber>
              <StatHelpText>Success rate</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Cancelled</StatLabel>
              <StatNumber color="red.500">{stats.cancelledTrips}</StatNumber>
              <StatHelpText>Cancellations</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Avg Duration</StatLabel>
              <StatNumber color="blue.500">{stats.avgDuration} min</StatNumber>
              <StatHelpText>Per trip</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Drivers</StatLabel>
              <StatNumber color="cyan.500">{stats.uniqueDrivers}</StatNumber>
              <StatHelpText>Unique</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Success Rate</StatLabel>
              <StatNumber color="green.500">
                {stats.totalTrips > 0 ? Math.round((stats.completedTrips / stats.totalTrips) * 100) : 0}%
              </StatNumber>
              <StatHelpText>Completion</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Content Area */}
      {loading ? (
        <Flex justify="center" py={10}>
          <VStack>
            <Spinner size="lg" color="purple.500" />
            <Text color={textColor}>Loading rider history...</Text>
          </VStack>
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      ) : riderTrips.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={10}>
              <FaHistory size="48" color="gray.300" />
              <Text fontSize="lg" color="gray.500">
                No rider history found
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                No trips match your current filter criteria. Try adjusting your filters.
              </Text>
              <Button colorScheme="purple" variant="outline" onClick={onFilterOpen} mt={4}>
                Adjust Filters
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <HStack justify="between" mb={4}>
            <Text color={textColor}>
              Showing {riderTrips.length} of {totalTrips} trips
            </Text>
          </HStack>

          {/* Cards or Table View */}
          {viewMode === 'cards' ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {riderTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </SimpleGrid>
          ) : (
            <Card>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                      <Tr>
                        <Th>Trip ID</Th>
                        <Th>Rider</Th>
                        <Th>Driver</Th>
                        <Th>Route</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {riderTrips.map((trip) => (
                        <Tr key={trip._id}>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold">
                              {trip.tripId}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold">
                              {trip.riderName}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {trip.assignedDriver 
                                ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
                                : 'Unassigned'}
                            </Text>
                          </Td>
                          <Td maxW="200px">
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" noOfLines={1}>
                                📍 {trip.pickupLocation?.address}
                              </Text>
                              <Text fontSize="xs" noOfLines={1}>
                                🏁 {trip.dropoffLocation?.address}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(trip.scheduledDate).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(trip.status)}>
                              {trip.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              leftIcon={<ViewIcon />}
                              onClick={() => handleViewDetails(trip)}
                              variant="outline"
                              colorScheme="purple"
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Filter Modal */}
      <RiderHistoryFilterModal
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        onApplyFilter={handleApplyFilter}
        initialFilters={currentFilters}
      />

      {/* Trip Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="4xl">
          <ModalHeader>
            <HStack>
              <FaEye color="purple" />
              <Text>Trip Details - {selectedTrip?.tripId}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={6} align="stretch">
                {/* Trip Status */}
                <Box>
                  <Badge colorScheme={getStatusColor(selectedTrip.status)} size="lg" p={2} borderRadius="md">
                    {selectedTrip.status.replace('_', ' ').toUpperCase()} TRIP
                  </Badge>
                </Box>

                {/* Basic Information */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
                    <Text fontWeight="bold" mb={2} color="blue.600">👤 Rider Information</Text>
                    <VStack align="start" spacing={1}>
                      <Text><strong>Name:</strong> {selectedTrip.riderName}</Text>
                      {selectedTrip.riderPhone && (
                        <Text><strong>Phone:</strong> {selectedTrip.riderPhone}</Text>
                      )}
                      {selectedTrip.riderEmail && (
                        <Text><strong>Email:</strong> {selectedTrip.riderEmail}</Text>
                      )}
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={2} color="purple.600">🚗 Driver Information</Text>
                    <VStack align="start" spacing={1}>
                      <Text><strong>Name:</strong> {selectedTrip.assignedDriver 
                        ? `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}` 
                        : 'Unassigned'}</Text>
                      {selectedTrip.assignedDriver?.email && (
                        <Text><strong>Email:</strong> {selectedTrip.assignedDriver.email}</Text>
                      )}
                    </VStack>
                  </Box>
                </SimpleGrid>

                <Divider />

                {/* Route Information */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="green.600">🗺️ Route Information</Text>
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Box w={3} h={3} borderRadius="full" bg="blue.400" />
                      <Text flex={1}><strong>Pickup:</strong> {selectedTrip.pickupLocation?.address}</Text>
                    </HStack>
                    <HStack>
                      <Box w={3} h={3} borderRadius="full" bg="red.400" />
                      <Text flex={1}><strong>Dropoff:</strong> {selectedTrip.dropoffLocation?.address}</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                {/* Time Information */}
                <Box>
                  <Text fontWeight="bold" mb={3} color="orange.600">⏰ Time Information</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="start" spacing={2}>
                      <Text><strong>Scheduled:</strong> {formatDateTime(selectedTrip.scheduledDate)}</Text>
                      {selectedTrip.actualPickupTime && (
                        <Text><strong>Actual Pickup:</strong> {formatDateTime(selectedTrip.actualPickupTime)}</Text>
                      )}
                      {selectedTrip.actualDropoffTime && (
                        <Text><strong>Actual Dropoff:</strong> {formatDateTime(selectedTrip.actualDropoffTime)}</Text>
                      )}
                    </VStack>
                    <VStack align="start" spacing={2}>
                      <Text><strong>Duration:</strong> {formatDuration(selectedTrip.actualPickupTime, selectedTrip.actualDropoffTime, selectedTrip.estimatedDuration)}</Text>
                      <Text><strong>Trip Type:</strong> {selectedTrip.tripType || 'Regular'}</Text>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {/* Additional Information */}
                {(selectedTrip.specialInstructions || selectedTrip.driverNotes) && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={3} color="purple.600">📝 Additional Information</Text>
                      <VStack align="start" spacing={2}>
                        {selectedTrip.specialInstructions && (
                          <Text><strong>Special Instructions:</strong> {selectedTrip.specialInstructions}</Text>
                        )}
                        {selectedTrip.driverNotes && (
                          <Text><strong>Driver Notes:</strong> {selectedTrip.driverNotes}</Text>
                        )}
                      </VStack>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RiderHistory;