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
  Input,
  Select,
  SimpleGrid,
  Flex,
  InputGroup,
  InputLeftElement,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import {
  SearchIcon,
  CalendarIcon,
  TimeIcon,
  CheckCircleIcon,
  ViewIcon,
  DownloadIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import {
  FaMapMarkerAlt,
  FaUser,
  FaClock,
  FaRoute,
  FaCalendarDay,
  FaCar,
  FaFilter,
  FaFileExport
} from 'react-icons/fa';
import axios from '../../config/axios';

const CompletedTrips = () => {
  const toast = useToast();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('green.50', 'green.900');
  
  // State management
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [totalTrips, setTotalTrips] = useState(0);
  const [viewMode, setViewMode] = useState('cards'); // cards or table
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    riderName: '',
    driverName: '',
    dateRange: '7', // days
    tripType: 'all',
    sortBy: 'completedDate',
    sortOrder: 'desc'
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalCompleted: 0,
    avgDuration: 0,
    avgDistance: 0,
    uniqueRiders: 0,
    uniqueDrivers: 0
  });

  // Fetch completed trips
  const fetchCompletedTrips = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange));

      const params = {
        status: 'completed',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: 1,
        limit: 100, // Get recent trips
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      // Add search filters
      if (filters.search) params.search = filters.search;
      if (filters.riderName) params.riderName = filters.riderName;
      if (filters.driverName) params.assignedDriver = filters.driverName;
      if (filters.tripType !== 'all') params.tripType = filters.tripType;

      const response = await axios.get('/api/trips', { params });
      
      if (response.data.success) {
        setCompletedTrips(response.data.data.trips || []);
        setTotalTrips(response.data.data.total || 0);
        calculateStats(response.data.data.trips || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch trips');
      }
    } catch (err) {
      console.error('Error fetching completed trips:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch completed trips');
      setCompletedTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (trips) => {
    if (!trips.length) {
      setStats({
        totalCompleted: 0,
        avgDuration: 0,
        avgDistance: 0,
        uniqueRiders: 0,
        uniqueDrivers: 0
      });
      return;
    }

    const uniqueRiders = new Set(trips.map(trip => trip.riderName)).size;
    const uniqueDrivers = new Set(
      trips.filter(trip => trip.assignedDriver)
        .map(trip => {
          if (typeof trip.assignedDriver === 'object') {
            return trip.assignedDriver.firstName + ' ' + trip.assignedDriver.lastName;
          }
          return trip.assignedDriver;
        })
    ).size;

    const totalDuration = trips.reduce((sum, trip) => {
      if (trip.actualPickupTime && trip.actualDropoffTime) {
        return sum + (new Date(trip.actualDropoffTime) - new Date(trip.actualPickupTime));
      }
      return sum + (trip.estimatedDuration || 0) * 60000;
    }, 0);

    const totalDistance = trips.reduce((sum, trip) => sum + (trip.estimatedDistance || 0), 0);
    
    setStats({
      totalCompleted: trips.length,
      avgDuration: Math.round(totalDuration / trips.length / 60000), // minutes
      avgDistance: totalDistance / trips.length,
      uniqueRiders,
      uniqueDrivers
    });
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

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle view trip details
  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    onDetailOpen();
  };

  // Export trips to CSV
  const exportTrips = () => {
    try {
      const csvData = completedTrips.map(trip => ({
        'Trip ID': trip.tripId,
        'Rider Name': trip.riderName,
        'Driver': trip.assignedDriver 
          ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` 
          : 'Unassigned',
        'Pickup Location': trip.pickupLocation?.address || '',
        'Dropoff Location': trip.dropoffLocation?.address || '',
        'Scheduled Date': new Date(trip.scheduledDate).toLocaleDateString(),
        'Completed Time': trip.actualDropoffTime ? new Date(trip.actualDropoffTime).toLocaleString() : 'N/A',
        'Duration': formatDuration(trip.actualPickupTime, trip.actualDropoffTime, trip.estimatedDuration),
        'Distance': trip.estimatedDistance ? `${trip.estimatedDistance.toFixed(2)} km` : 'N/A',
        'Trip Type': trip.tripType || 'regular',
        'Status': trip.status
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
      link.download = `completed_trips_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'Export Complete',
        description: 'Completed trips data has been exported successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export trips data.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Load data on mount and filter changes
  useEffect(() => {
    fetchCompletedTrips();
  }, [filters]);

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
              <Badge colorScheme="green" variant="subtle" borderRadius="full">
                <CheckCircleIcon mr={1} />
                Completed
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {trip.tripId}
              </Text>
            </HStack>
            <Heading size="sm" color="green.600" noOfLines={1}>
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
              colorScheme="green"
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
              <Icon as={FaMapMarkerAlt} color="green.500" />
              <Text fontSize="xs" fontWeight="bold" color="green.600">
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
                <Icon as={FaClock} color="blue.400" boxSize={3} />
                <Text fontSize="xs" fontWeight="bold">DURATION</Text>
              </HStack>
              <Text fontSize="xs" color={textColor}>
                {formatDuration(trip.actualPickupTime, trip.actualDropoffTime, trip.estimatedDuration)}
              </Text>
            </VStack>

            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={FaCalendarDay} color="purple.400" boxSize={3} />
                <Text fontSize="xs" fontWeight="bold">COMPLETED</Text>
              </HStack>
              <Text fontSize="xs" color={textColor}>
                {trip.actualDropoffTime 
                  ? new Date(trip.actualDropoffTime).toLocaleDateString()
                  : new Date(trip.scheduledDate).toLocaleDateString()
                }
              </Text>
            </VStack>
          </SimpleGrid>

          {trip.estimatedDistance && (
            <HStack>
              <Icon as={FaRoute} color="orange.400" boxSize={3} />
              <Text fontSize="xs">
                <Text as="span" fontWeight="bold">Distance:</Text>{' '}
                {trip.estimatedDistance.toFixed(2)} km
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box w="100%" py={{ base: 4, md: 6 }} px={{ base: 3, md: 4, lg: 6 }} overflowX="hidden">
      {/* Header */}
      <Box bg={headerBg} p={6} borderRadius="lg" mb={6} w="100%" maxW="100%">
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={2}>
            <Heading size="lg" color="green.600">
              <CheckCircleIcon mr={3} />
              Completed Trips
            </Heading>
            <Text color={textColor}>
              Recent completed trips from the past {filters.dateRange} days
            </Text>
          </VStack>

          <HStack>
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
              colorScheme="green"
              variant="outline"
              size="sm"
              onClick={exportTrips}
              isDisabled={!completedTrips.length}
            >
              Export CSV
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Trips</StatLabel>
              <StatNumber color="green.500">{stats.totalCompleted}</StatNumber>
              <StatHelpText>Last {filters.dateRange} days</StatHelpText>
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
              <StatLabel>Avg Distance</StatLabel>
              <StatNumber color="orange.500">
                {stats.avgDistance ? stats.avgDistance.toFixed(1) : 0} km
              </StatNumber>
              <StatHelpText>Per trip</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Unique Riders</StatLabel>
              <StatNumber color="purple.500">{stats.uniqueRiders}</StatNumber>
              <StatHelpText>Served</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Drivers</StatLabel>
              <StatNumber color="cyan.500">{stats.uniqueDrivers}</StatNumber>
              <StatHelpText>Assigned</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <VStack spacing={4}>
            <HStack w="full" align="start">
              <Icon as={FaFilter} color="gray.500" mt={1} />
              <Text fontWeight="bold" color="gray.600">Filters & Search</Text>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4} w="full">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search trips..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </InputGroup>

              <Input
                placeholder="Filter by rider name"
                value={filters.riderName}
                onChange={(e) => handleFilterChange('riderName', e.target.value)}
              />

              <Input
                placeholder="Filter by driver name"
                value={filters.driverName}
                onChange={(e) => handleFilterChange('driverName', e.target.value)}
              />

              <Select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="1">Last 24 hours</option>
                <option value="3">Last 3 days</option>
                <option value="7">Last 7 days</option>
              </Select>

              <Select
                value={filters.tripType}
                onChange={(e) => handleFilterChange('tripType', e.target.value)}
              >
                <option value="all">All Trip Types</option>
                <option value="regular">Regular</option>
                <option value="medical">Medical</option>
                <option value="urgent">Urgent</option>
                <option value="recurring">Recurring</option>
              </Select>
            </SimpleGrid>

            <HStack w="full">
              <Text fontSize="sm" color="gray.500">Sort by:</Text>
              <Select
                size="sm"
                w="200px"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="actualDropoffTime">Completion Time</option>
                <option value="scheduledDate">Scheduled Date</option>
                <option value="riderName">Rider Name</option>
                <option value="createdAt">Created Date</option>
              </Select>
              
              <Select
                size="sm"
                w="120px"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </Select>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Content Area */}
      {loading ? (
        <Flex justify="center" py={10}>
          <VStack>
            <Spinner size="lg" color="green.500" />
            <Text color={textColor}>Loading completed trips...</Text>
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
      ) : completedTrips.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={10}>
              <CheckCircleIcon boxSize={12} color="gray.300" />
              <Text fontSize="lg" color="gray.500">
                No completed trips found
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                No trips have been completed in the past {filters.dateRange} days with the current filters.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <HStack justify="between" mb={4}>
            <Text color={textColor}>
              Showing {completedTrips.length} of {totalTrips} completed trips
            </Text>
          </HStack>

          {/* Cards or Table View */}
          {viewMode === 'cards' ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {completedTrips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </SimpleGrid>
          ) : (
            <Card w="100%" maxW="100%">
              <CardBody p={0}>
                <TableContainer w="100%" overflowX="auto">
                  <Table variant="simple" w="100%">
                    <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                      <Tr>
                        <Th>Trip ID</Th>
                        <Th>Rider</Th>
                        <Th>Driver</Th>
                        <Th>Route</Th>
                        <Th>Duration</Th>
                        <Th>Completed</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {completedTrips.map((trip) => (
                        <Tr key={trip._id}>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold">
                              {trip.tripId}
                            </Text>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="bold">
                                {trip.riderName}
                              </Text>
                              {trip.riderPhone && (
                                <Text fontSize="xs" color="gray.500">
                                  {trip.riderPhone}
                                </Text>
                              )}
                            </VStack>
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
                              {formatDuration(trip.actualPickupTime, trip.actualDropoffTime, trip.estimatedDuration)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {trip.actualDropoffTime 
                                ? new Date(trip.actualDropoffTime).toLocaleDateString()
                                : new Date(trip.scheduledDate).toLocaleDateString()
                              }
                            </Text>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              leftIcon={<ViewIcon />}
                              onClick={() => handleViewDetails(trip)}
                              variant="outline"
                              colorScheme="green"
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

      {/* Trip Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="4xl">
          <ModalHeader>
            <HStack>
              <CheckCircleIcon color="green" />
              <Text>Trip Details - {selectedTrip?.tripId}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={6} align="stretch">
                {/* Trip Status */}
                <Box>
                  <Badge colorScheme="green" size="lg" p={2} borderRadius="md">
                    ✅ Completed Trip
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
                    {selectedTrip.estimatedDistance && (
                      <HStack>
                        <Icon as={FaRoute} color="orange.400" />
                        <Text><strong>Distance:</strong> {selectedTrip.estimatedDistance.toFixed(2)} km</Text>
                      </HStack>
                    )}
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
    </Box>
  );
};

export default CompletedTrips;