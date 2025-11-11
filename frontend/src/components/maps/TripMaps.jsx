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
        return (
          trip.riderName?.toLowerCase().includes(searchLower) ||
          trip.pickupLocation?.address?.toLowerCase().includes(searchLower) ||
          trip.dropoffLocation?.address?.toLowerCase().includes(searchLower) ||
          trip.assignedDriver?.toLowerCase().includes(searchLower)
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
      const tripDate = new Date(trip.scheduledDate).toISOString().split('T')[0];
      return tripDate === today;
    });

    const upcomingTrips = todayTrips.filter(trip => {
      if (!trip || !trip.scheduledDate || !trip.scheduledTime) return false;
      const now = new Date();
      const tripDateTime = new Date(`${trip.scheduledDate}T${trip.scheduledTime}`);
      return tripDateTime > now;
    });

    return {
      total: filteredTripsArray.length,
      today: todayTrips.length,
      upcoming: upcomingTrips.length,
      completed: filteredTripsArray.filter(trip => trip && trip.status === 'completed').length
    };
  };

  const stats = getTripStats();

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
              <HStack>
                <FaMap size={24} color="blue" />
                <Box>
                  <Heading size="lg">Trip Maps</Heading>
                  <Text color="gray.600">
                    View scheduled trips on interactive maps with route alternatives
                  </Text>
                </Box>
              </HStack>
            </CardHeader>
          </Card>

          {/* Statistics Cards */}
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
                <HStack w="full" spacing={4} flexWrap="wrap">
                  <FormControl maxW="200px">
                    <FormLabel fontSize="sm">Select Date</FormLabel>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      size="sm"
                    />
                  </FormControl>

                  <FormControl maxW="150px">
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

                  <FormControl maxW="150px">
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

                  <FormControl flex="1" minW="200px">
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

                  <Button
                    leftIcon={<RepeatIcon />}
                    onClick={fetchTrips}
                    size="sm"
                    mt={6}
                  >
                    Refresh
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Trips Table */}
          <Card>
            <CardHeader>
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
                <Spacer />
                <Badge colorScheme="blue" fontSize="sm">
                  {filteredTrips.length} trips found
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {filteredTrips.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  No trips found for the selected criteria. Try adjusting your filters.
                </Alert>
              ) : (
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
                                    {trip.riderName || 'Unknown'}
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
                                  {trip.assignedDriver || 'Unassigned'}
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
                              <Tooltip label="View route on map with alternatives">
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
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
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