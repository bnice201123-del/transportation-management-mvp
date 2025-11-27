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
  ButtonGroup,
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
  Spinner,
  Center,
  useToast,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Flex,
  Spacer,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  CalendarIcon,
  ViewIcon,
  RepeatIcon,
  TimeIcon,
  SearchIcon
} from '@chakra-ui/icons';
import {
  FaRoute,
  FaMapMarkerAlt,
  FaCar,
  FaUser,
  FaPhone,
  FaClock,
  FaMap,
  FaFilter,
  FaCalendarDay
} from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';
import TripMapModal from './TripMapModal';

const TripMaps = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch trips data
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      
      // Ensure response.data.data.trips is an array
      const tripsData = Array.isArray(response.data.data?.trips) ? response.data.data.trips : [];
      setTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips:', error);
      // Set empty array on error
      setTrips([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch trips data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Filter trips based on selected criteria
  useEffect(() => {
    // Ensure trips is an array before filtering
    const tripsArray = Array.isArray(trips) ? trips : [];
    let filtered = [...tripsArray];

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(trip => {
        if (!trip || !trip.scheduledDate) return false;
        try {
          const tripDate = new Date(trip.scheduledDate).toISOString().split('T')[0];
          return tripDate === selectedDate;
        } catch (error) {
          console.error('Error parsing trip date:', error);
          return false;
        }
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip && trip.status === statusFilter);
    }

    // Filter by time (upcoming trips)
    if (timeFilter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(trip => {
        if (!trip || !trip.scheduledDate || !trip.scheduledTime) return false;
        try {
          const tripDateTime = new Date(`${trip.scheduledDate}T${trip.scheduledTime}`);
          return tripDateTime > now;
        } catch (error) {
          console.error('Error parsing trip datetime:', error);
          return false;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(trip => {
        if (!trip) return false;
        const riderName = getRiderName(trip).toLowerCase();
        const driverName = getDriverName(trip).toLowerCase();
        return (
          riderName.includes(searchLower) ||
          driverName.includes(searchLower) ||
          trip.pickupLocation?.address?.toLowerCase().includes(searchLower) ||
          trip.dropoffLocation?.address?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredTrips(filtered);
  }, [trips, selectedDate, statusFilter, timeFilter, searchTerm]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'yellow',
      confirmed: 'blue',
      'in-progress': 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return statusColors[status] || 'gray';
  };

  // Helper function to safely get rider name (handles both string and object)
  const getRiderName = (trip) => {
    if (!trip) return 'Unknown';
    
    // If riderName is a string, return it
    if (typeof trip.riderName === 'string') {
      return trip.riderName;
    }
    
    // If riderName is an object (populated rider), extract the name
    if (trip.riderName && typeof trip.riderName === 'object') {
      const rider = trip.riderName;
      return `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || rider.email || 'Unknown';
    }
    
    // If rider is populated instead
    if (trip.rider && typeof trip.rider === 'object') {
      const rider = trip.rider;
      return `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || rider.email || 'Unknown';
    }
    
    return 'Unknown';
  };

  // Helper function to safely get driver name (handles both string and object)
  const getDriverName = (trip) => {
    if (!trip || !trip.assignedDriver) return 'Unassigned';
    
    // If assignedDriver is a string, return it
    if (typeof trip.assignedDriver === 'string') {
      return trip.assignedDriver;
    }
    
    // If assignedDriver is an object (populated driver), extract the name
    if (typeof trip.assignedDriver === 'object') {
      const driver = trip.assignedDriver;
      return `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email || 'Unassigned';
    }
    
    return 'Unassigned';
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewMap = (trip) => {
    setSelectedTrip(trip);
    onOpen();
  };

  const getTripStats = () => {
    // Ensure trips is an array before filtering
    const tripsArray = Array.isArray(trips) ? trips : [];
    const filteredTripsArray = Array.isArray(filteredTrips) ? filteredTrips : [];
    
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = tripsArray.filter(trip => {
      if (!trip || !trip.scheduledDate) return false;
      try {
        const tripDate = new Date(trip.scheduledDate).toISOString().split('T')[0];
        return tripDate === today;
      } catch (error) {
        console.error('Error parsing date in getTripStats:', error);
        return false;
      }
    });

    const upcomingTrips = todayTrips.filter(trip => {
      if (!trip || !trip.scheduledDate || !trip.scheduledTime) return false;
      try {
        const now = new Date();
        const tripDateTime = new Date(`${trip.scheduledDate}T${trip.scheduledTime}`);
        return tripDateTime > now;
      } catch (error) {
        console.error('Error parsing datetime in getTripStats:', error);
        return false;
      }
    });

    return {
      total: filteredTripsArray.length,
      today: todayTrips.length,
      upcoming: upcomingTrips.length,
      completed: filteredTripsArray.filter(trip => trip && trip.status === 'completed').length
    };
  };

  let stats;
  try {
    stats = getTripStats();
  } catch (error) {
    console.error('Error getting trip stats:', error);
    stats = { total: 0, today: 0, upcoming: 0, completed: 0 };
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxW="container.xl" py={8}>
          <Center>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text>Loading trip schedules...</Text>
            </VStack>
          </Center>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card>
            <CardHeader>
              <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={4}>
                <HStack>
                  <FaMap size={24} color="blue" />
                  <Box>
                    <Heading size="lg">Trip Maps</Heading>
                    <Text color="gray.600">
                      View scheduled trips on interactive maps with route alternatives
                    </Text>
                  </Box>
                </HStack>

                {/* View Mode Toggle */}
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">View:</Text>
                  <ButtonGroup size="sm" isAttached variant="outline">
                    <IconButton
                      icon={<ViewIcon />}
                      aria-label="Table view"
                      colorScheme={viewMode === 'table' ? 'blue' : 'gray'}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    />
                    <IconButton
                      icon={<FaFilter />}
                      aria-label="Card view"
                      colorScheme={viewMode === 'card' ? 'blue' : 'gray'}
                      onClick={() => setViewMode('card')}
                      title="Card View"
                    />
                  </ButtonGroup>
                </HStack>
              </Flex>
            </CardHeader>
          </Card>

          {/* Quick Date Filters */}
          <Card bg="gray.50">
            <CardBody>
              <VStack spacing={3}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Quick Date Filters</Text>
                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  >
                    Today
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow.toISOString().split('T')[0]);
                    }}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => {
                      const weekFromNow = new Date();
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      setSelectedDate(weekFromNow.toISOString().split('T')[0]);
                    }}
                  >
                    Next Week
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSelectedDate(yesterday.toISOString().split('T')[0]);
                    }}
                  >
                    Yesterday
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
          <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
            <GridItem>
              <Stat>
                <StatLabel>Total Trips</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>For selected date</StatHelpText>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Today's Trips</StatLabel>
                <StatNumber>{stats.today}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  All scheduled
                </StatHelpText>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Upcoming</StatLabel>
                <StatNumber>{stats.upcoming}</StatNumber>
                <StatHelpText>Not yet started</StatHelpText>
              </Stat>
            </GridItem>
            <GridItem>
              <Stat>
                <StatLabel>Completed</StatLabel>
                <StatNumber>{stats.completed}</StatNumber>
                <StatHelpText>Successfully finished</StatHelpText>
              </Stat>
            </GridItem>
          </Grid>

          {/* Filters */}
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Flex w="full" direction={{ base: "column", md: "row" }} gap={4}>
                  <FormControl maxW={{ base: "full", md: "200px" }}>
                    <FormLabel fontSize="sm">Select Date</FormLabel>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      size="sm"
                    />
                  </FormControl>

                  <FormControl maxW={{ base: "full", md: "150px" }}>
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FormControl>

                  <FormControl maxW={{ base: "full", md: "150px" }}>
                    <FormLabel fontSize="sm">Time Filter</FormLabel>
                    <Select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Times</option>
                      <option value="upcoming">Upcoming Only</option>
                    </Select>
                  </FormControl>

                  <FormControl flex="1" minW={{ base: "full", md: "200px" }}>
                    <FormLabel fontSize="sm">Search</FormLabel>
                    <InputGroup size="sm">
                      <InputLeftElement>
                        <SearchIcon color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search by rider, location, or driver..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>

                  <Box alignSelf={{ base: "stretch", md: "flex-end" }}>
                    <Button
                      leftIcon={<RepeatIcon />}
                      onClick={fetchTrips}
                      size="sm"
                      w={{ base: "full", md: "auto" }}
                      mt={{ base: 0, md: 6 }}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          {/* Trips Display */}
          <Card>
            <CardHeader>
              <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={4}>
                <HStack>
                  <FaCalendarDay />
                  <Heading size="md">
                    Trip Schedule - {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Heading>
                </HStack>
                <Badge colorScheme="blue" fontSize="sm">
                  {filteredTrips.length} trips found
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              {filteredTrips.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  No trips found for the selected criteria. Try adjusting your filters.
                </Alert>
              ) : viewMode === 'table' ? (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Time</Th>
                        <Th>Rider</Th>
                        <Th>Route</Th>
                        <Th>Driver</Th>
                        <Th>Status</Th>
                        <Th>Map</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.isArray(filteredTrips) && filteredTrips.map((trip) => {
                        // Skip if trip is invalid
                        if (!trip || !trip._id) return null;
                        
                        return (
                          <Tr key={trip._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <TimeIcon boxSize={3} color="blue.500" />
                                  <Text fontSize="sm" fontWeight="medium">
                                    {formatTime(trip.scheduledTime)}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.600">
                                  {trip.scheduledDate ? 
                                    new Date(trip.scheduledDate).toLocaleDateString() : 
                                    'N/A'
                                  }
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <FaUser size={12} color="green" />
                                  <Text fontSize="sm" fontWeight="medium">
                                    {getRiderName(trip)}
                                  </Text>
                                </HStack>
                                {trip.riderPhone && (
                                  <HStack>
                                    <FaPhone size={10} color="gray" />
                                    <Text fontSize="xs" color="gray.600">
                                      {trip.riderPhone}
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <FaMapMarkerAlt size={12} color="green" />
                                  <Text fontSize="xs" noOfLines={1}>
                                    {trip.pickupLocation?.address || 'N/A'}
                                  </Text>
                                </HStack>
                                <Box h="2px" w="20px" bg="gray.300" />
                                <HStack>
                                  <FaMapMarkerAlt size={12} color="red" />
                                  <Text fontSize="xs" noOfLines={1}>
                                    {trip.dropoffLocation?.address || 'N/A'}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Td>
                            <Td>
                              <HStack>
                                <FaCar size={12} color="blue" />
                                <Text fontSize="sm">
                                  {getDriverName(trip)}
                                </Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getStatusColor(trip.status)}
                                variant="subtle"
                                fontSize="xs"
                              >
                                {trip.status || 'unknown'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Tooltip label="View route on map with turn-by-turn directions">
                                  <Button
                                    size="sm"
                                    leftIcon={<FaRoute />}
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={() => handleViewMap(trip)}
                                    isDisabled={
                                      !trip.pickupLocation?.address || 
                                      !trip.dropoffLocation?.address
                                    }
                                  >
                                    View Map
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Open directly in Google Maps">
                                  <IconButton
                                    size="sm"
                                    icon={<FaMap />}
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => {
                                      const origin = encodeURIComponent(trip.pickupLocation?.address || '');
                                      const destination = encodeURIComponent(trip.dropoffLocation?.address || '');
                                      window.open(`https://www.google.com/maps/dir/${origin}/${destination}`, '_blank');
                                    }}
                                    isDisabled={
                                      !trip.pickupLocation?.address || 
                                      !trip.dropoffLocation?.address
                                    }
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                /* Card View for Mobile */
                <VStack spacing={4} align="stretch">
                  {Array.isArray(filteredTrips) && filteredTrips.map((trip) => {
                    if (!trip || !trip._id) return null;
                    
                    return (
                      <Card key={trip._id} shadow="sm" _hover={{ shadow: "md" }}>
                        <CardBody p={4}>
                          <VStack align="stretch" spacing={3}>
                            {/* Header with Time and Status */}
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <TimeIcon boxSize={4} color="blue.500" />
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {formatTime(trip.scheduledTime)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {trip.scheduledDate ? 
                                      new Date(trip.scheduledDate).toLocaleDateString() : 
                                      'N/A'
                                    }
                                  </Text>
                                </VStack>
                              </HStack>
                              <HStack>
                                <Badge
                                  colorScheme={getStatusColor(trip.status)}
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {trip.status || 'unknown'}
                                </Badge>
                                <Tooltip label="View route with turn-by-turn directions">
                                  <IconButton
                                    icon={<FaRoute />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={() => handleViewMap(trip)}
                                    isDisabled={
                                      !trip.pickupLocation?.address || 
                                      !trip.dropoffLocation?.address
                                    }
                                  />
                                </Tooltip>
                                <Tooltip label="Open in Google Maps">
                                  <IconButton
                                    icon={<FaMap />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => {
                                      const origin = encodeURIComponent(trip.pickupLocation?.address || '');
                                      const destination = encodeURIComponent(trip.dropoffLocation?.address || '');
                                      window.open(`https://www.google.com/maps/dir/${origin}/${destination}`, '_blank');
                                    }}
                                    isDisabled={
                                      !trip.pickupLocation?.address || 
                                      !trip.dropoffLocation?.address
                                    }
                                  />
                                </Tooltip>
                              </HStack>
                            </Flex>

                            {/* Rider Info */}
                            <Box>
                              <HStack mb={1}>
                                <FaUser size={14} color="green" />
                                <Text fontSize="sm" fontWeight="medium">
                                  {getRiderName(trip)}
                                </Text>
                              </HStack>
                              {trip.riderPhone && (
                                <HStack>
                                  <FaPhone size={12} color="gray" />
                                  <Text fontSize="xs" color="gray.600">
                                    {trip.riderPhone}
                                  </Text>
                                </HStack>
                              )}
                            </Box>

                            {/* Route Info */}
                            <Box>
                              <Text fontSize="xs" color="gray.600" mb={2}>Route</Text>
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <FaMapMarkerAlt size={12} color="green" />
                                  <Text fontSize="xs" noOfLines={2}>
                                    {trip.pickupLocation?.address || 'N/A'}
                                  </Text>
                                </HStack>
                                <HStack>
                                  <FaMapMarkerAlt size={12} color="red" />
                                  <Text fontSize="xs" noOfLines={2}>
                                    {trip.dropoffLocation?.address || 'N/A'}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>

                            {/* Driver Info */}
                            <Box>
                              <HStack>
                                <FaCar size={14} color="blue" />
                                <Text fontSize="sm">
                                  Driver: {getDriverName(trip)}
                                </Text>
                              </HStack>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>

        {/* Trip Map Modal */}
        <TripMapModal
          isOpen={isOpen}
          onClose={onClose}
          trip={selectedTrip}
        />
      </Container>
    </>
  );
};

export default TripMaps;