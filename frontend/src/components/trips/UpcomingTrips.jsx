import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Spinner,
  Center,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Flex,
  Input,
  Select,
  Tooltip,
  Divider,
  Grid
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const UpcomingTrips = () => {
  const navigate = useNavigate();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [selectedRider, setSelectedRider] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [riders, setRiders] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Fetch upcoming trips
  const fetchUpcomingTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const allTrips = response.data.data?.trips || [];
      
      // Filter for upcoming trips (future pickup date)
      const now = new Date();
      const upcomingTrips = allTrips.filter(trip => {
        const tripDate = new Date(trip.pickupDateTime || trip.scheduledPickupTime);
        return tripDate > now && trip.status !== 'completed' && trip.status !== 'cancelled';
      });
      
      setTrips(upcomingTrips);
    } catch (error) {
      console.error('Error fetching upcoming trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch riders and drivers for filter dropdowns
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [ridersRes, driversRes] = await Promise.all([
        axios.get('/api/riders'),
        axios.get('/api/users?role=driver')
      ]);
      setRiders(ridersRes.data.data?.riders || ridersRes.data.riders || []);
      setDrivers(driversRes.data.data?.users || driversRes.data.users || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingTrips();
    fetchFilterOptions();
  }, [fetchUpcomingTrips, fetchFilterOptions]);

  // Apply filters
  const applyFilters = (tripsToFilter) => {
    let filtered = [...tripsToFilter];

    if (dateRangeStart) {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.pickupDateTime || trip.scheduledPickupTime);
        return tripDate >= new Date(dateRangeStart);
      });
    }

    if (dateRangeEnd) {
      filtered = filtered.filter(trip => {
        const tripDate = new Date(trip.pickupDateTime || trip.scheduledPickupTime);
        return tripDate <= new Date(dateRangeEnd);
      });
    }

    if (selectedRider) {
      filtered = filtered.filter(trip => trip.riderId === selectedRider);
    }

    if (selectedDriver) {
      filtered = filtered.filter(trip => trip.driverId === selectedDriver);
    }

    if (selectedStatus) {
      filtered = filtered.filter(trip => trip.status === selectedStatus);
    }

    setFilteredTrips(filtered);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeStart, dateRangeEnd, selectedRider, selectedDriver, selectedStatus, trips]);

  const handleEditTrip = (tripId) => {
    navigate(`/scheduler?tripId=${tripId}&action=edit`);
  };

  const handleViewDetails = (tripId) => {
    navigate(`/trips/upcoming/${tripId}`);
  };

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <>
        <Navbar title="Upcoming Trips" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Navbar title="Upcoming Trips" />
      <Container maxW={{ base: "full", lg: "full" }} px={{ base: 4, lg: 8 }} py={8}>
        {/* Process Menu at Top */}
        <Flex justify="center" mb={6}>
          <Box 
            position="relative" 
            onMouseLeave={() => {
              processMenuTimeoutRef.current = setTimeout(() => {
                setIsProcessMenuOpen(false);
              }, 150);
            }}
            onMouseEnter={() => {
              if (processMenuTimeoutRef.current) {
                clearTimeout(processMenuTimeoutRef.current);
              }
              setIsProcessMenuOpen(true);
            }}
          >
            <Tooltip label="View process options" placement="bottom">
              <Button
                variant="outline"
                size={{ base: "sm", md: "md" }}
                colorScheme="blue"
                _hover={{ bg: "blue.50" }}
                onClick={() => setIsProcessMenuOpen(!isProcessMenuOpen)}
              >
                Process
              </Button>
            </Tooltip>
            
            {/* Process Menu Dropdown */}
            {isProcessMenuOpen && (
              <Box
                position="absolute"
                top="100%"
                left="50%"
                transform="translateX(-50%)"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                boxShadow="0 10px 25px rgba(0,0,0,0.15)"
                p={6}
                mt={2}
                minW="600px"
                zIndex={1000}
                pointerEvents="auto"
                onMouseEnter={() => {
                  if (processMenuTimeoutRef.current) {
                    clearTimeout(processMenuTimeoutRef.current);
                  }
                }}
              >
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {/* Column 1 - TRIPS */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                      TRIPS
                    </Text>
                    <Divider my={1} />
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full" 
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/scheduler')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Create Trip
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full" 
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/scheduler')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Manage Trips
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/maps/tracking')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      View Map
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/trips/completed')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Completed
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/trips/all')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      All Trips
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      minH="44px"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/trips/active')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Active
                    </Button>
                  </VStack>
                  
                  {/* Column 2 - NAVIGATE */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                      NAVIGATE
                    </Text>
                    <Divider my={1} />
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/riders')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      All Riders
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/users')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      All Users
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/drivers')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Drivers
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/tracking')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Tracking
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/profile')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/schedule')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Schedule
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/scheduler?view=manage')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Trip Management
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/scheduler?view=calendar')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Calendar View
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/search')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Search
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/trips/recurring')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Recurring Trips
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      fontWeight="normal"
                      onClick={() => handleProcessMenuNavigation('/admin/analytics')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      📊 Analytics Dashboard
                    </Button>
                  </VStack>
                </Grid>
              </Box>
            )}
          </Box>
        </Flex>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Upcoming Trips
            </Heading>
            <Text color="gray.600">
              View and manage all upcoming trips. Use filters to find specific trips.
            </Text>
          </Box>

          {/* Filters */}
          <Box bg="white" p={6} borderRadius="lg" borderWidth="1px">
            <Heading size="md" mb={4}>
              Filters
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Date Range Start
                </Text>
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Date Range End
                </Text>
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Rider
                </Text>
                <Select
                  placeholder="Select rider"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                >
                  {riders.map(rider => (
                    <option key={rider._id} value={rider._id}>
                      {rider.name}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Driver
                </Text>
                <Select
                  placeholder="Select driver"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name}
                    </option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Status
                </Text>
                <Select
                  placeholder="Select status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                </Select>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Trips Grid */}
          {filteredTrips.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {filteredTrips.map(trip => (
                <Card key={trip._id} variant="outline">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold" fontSize="lg">
                          Trip #{trip._id?.slice(-6).toUpperCase()}
                        </Text>
                        <Badge colorScheme={trip.status === 'assigned' ? 'blue' : 'gray'}>
                          {trip.status}
                        </Badge>
                      </HStack>

                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Rider
                        </Text>
                        <Text fontWeight="bold">
                          {trip.riderName || 'N/A'}
                        </Text>
                      </Box>

                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Pickup
                        </Text>
                        <Text fontWeight="bold">
                          {new Date(trip.pickupDateTime || trip.scheduledPickupTime).toLocaleDateString()} at{' '}
                          {new Date(trip.pickupDateTime || trip.scheduledPickupTime).toLocaleTimeString()}
                        </Text>
                      </Box>

                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Location
                        </Text>
                        <Text fontWeight="bold" noOfLines={2}>
                          {trip.pickupLocation || 'N/A'}
                        </Text>
                      </Box>

                      <Flex gap={2} w="full" pt={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleViewDetails(trip._id)}
                          flex={1}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTrip(trip._id)}
                          flex={1}
                        >
                          Edit
                        </Button>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Center h="30vh">
              <Text color="gray.500">No upcoming trips found</Text>
            </Center>
          )}
        </VStack>
      </Container>
    </>
  );
};

export default UpcomingTrips;
