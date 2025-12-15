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
  Icon,
  Progress,
  Tooltip,
  Divider,
  Grid
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

const ActiveTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active trips
  const fetchActiveTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const allTrips = response.data.data?.trips || [];
      
      // Filter for active trips (in_progress status)
      const activeTrips = allTrips.filter(trip => trip.status === 'in_progress');
      setTrips(activeTrips);
    } catch (error) {
      console.error('Error fetching active trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrips();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchActiveTrips, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveTrips]);

  const handleReassignDriver = (tripId) => {
    navigate(`/scheduler?tripId=${tripId}&action=reassign`);
  };

  const handleOpenMap = (tripId) => {
    navigate(`/tracking?tripId=${tripId}`);
  };

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <>
        <Navbar title="Active Trips" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Navbar title="Active Trips" />
      
      {/* Process Menu */}
      <Flex justify="center" mt={6} mb={6}>
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
              minW={{ base: "280px", sm: "600px", md: "900px" }}
              zIndex={1000}
              pointerEvents="auto"
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                {/* Column 1: Trip Creation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/create-trip')}>
                      Create Trip
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/manage-trips')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/map')}>
                      View Map
                    </Button>
                  </VStack>
                </Box>

                {/* Column 2: Trip Views */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/upcoming')}>
                      Upcoming
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/completed')}>
                      Completed
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/all-trips')}>
                      All Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/active')}>
                      Active
                    </Button>
                  </VStack>
                </Box>

                {/* Column 3: Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    {user?.role !== 'dispatcher' && user?.role !== 'scheduler' && (
                      <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/users')}>
                        All Users
                      </Button>
                    )}
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/drivers')}>
                      Drivers
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/tracking')}>
                      Tracking
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/profile')}>
                      Profile
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Schedule
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/search')}>
                      Search
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/recurring-trips')}>
                      Recurring Trips
                    </Button>
                  </VStack>
                </Box>
              </Grid>
            </Box>
          )}
        </Box>
      </Flex>

      <Container maxW="7xl" py={8}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Active Trips
            </Heading>
            <Text color="gray.600">
              Real-time view of all in-progress trips with quick dispatch actions.
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Total Active
                  </Text>
                  <Heading size="lg">{trips.length}</Heading>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    In Progress
                  </Text>
                  <Heading size="lg">{trips.filter(t => t.status === 'in_progress').length}</Heading>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Last Updated
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {new Date().toLocaleTimeString()}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Active Trips Cards */}
          {trips.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {trips.map(trip => (
                <Card key={trip._id} variant="outline" borderLeftWidth="4px" borderLeftColor="blue.500">
                  <CardBody>
                    <VStack align="start" spacing={4}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold" fontSize="lg">
                          Trip #{trip._id?.slice(-6).toUpperCase()}
                        </Text>
                        <Badge colorScheme="blue">
                          <Icon as={ClockIcon} w={3} h={3} mr={1} />
                          Active
                        </Badge>
                      </HStack>

                      {/* Rider Info */}
                      <Box w="full">
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Rider
                        </Text>
                        <Text fontWeight="bold">{trip.riderName || 'N/A'}</Text>
                        {trip.riderPhone && (
                          <HStack fontSize="xs" mt={1}>
                            <Icon as={PhoneIcon} w={3} h={3} />
                            <Text>{trip.riderPhone}</Text>
                          </HStack>
                        )}
                      </Box>

                      {/* Driver Info */}
                      <Box w="full">
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Driver
                        </Text>
                        <Text fontWeight="bold">{trip.driverName || 'Unassigned'}</Text>
                        {trip.driverPhone && (
                          <HStack fontSize="xs" mt={1}>
                            <Icon as={PhoneIcon} w={3} h={3} />
                            <Text>{trip.driverPhone}</Text>
                          </HStack>
                        )}
                      </Box>

                      {/* Location */}
                      <Box w="full">
                        <HStack fontSize="xs" mb={1}>
                          <Icon as={MapPinIcon} w={4} h={4} color="red.500" />
                          <Text fontWeight="bold" color="red.500">
                            From
                          </Text>
                        </HStack>
                        <Text fontSize="sm" noOfLines={2}>
                          {trip.pickupLocation || 'N/A'}
                        </Text>

                        <HStack fontSize="xs" mt={3} mb={1}>
                          <Icon as={MapPinIcon} w={4} h={4} color="green.500" />
                          <Text fontWeight="bold" color="green.500">
                            To
                          </Text>
                        </HStack>
                        <Text fontSize="sm" noOfLines={2}>
                          {trip.dropoffLocation || 'N/A'}
                        </Text>
                      </Box>

                      {/* Progress */}
                      <Box w="full">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="xs" color="gray.600">
                            Trip Progress
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {trip.progressPercentage || 50}%
                          </Text>
                        </HStack>
                        <Progress
                          value={trip.progressPercentage || 50}
                          size="sm"
                          colorScheme="blue"
                          borderRadius="full"
                        />
                      </Box>

                      {/* Quick Actions */}
                      <Flex gap={2} w="full" pt={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleOpenMap(trip._id)}
                          flex={1}
                        >
                          View Map
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReassignDriver(trip._id)}
                          flex={1}
                        >
                          Reassign
                        </Button>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Center h="30vh">
              <VStack>
                <Text color="gray.500" fontSize="lg">
                  No active trips
                </Text>
                <Text color="gray.400" fontSize="sm">
                  All trips are completed or pending assignment
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Container>
    </>
  );
};

export default ActiveTrips;
