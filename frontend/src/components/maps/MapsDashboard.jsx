import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Text,
  Badge,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import TripMap from '../maps/TripMap';

const MapsDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const tripsWithCoords = response.data.filter(trip => 
        trip.pickupLocation?.coordinates && trip.dropoffLocation?.coordinates
      );
      setTrips(tripsWithCoords);
      if (tripsWithCoords.length > 0) {
        setSelectedTrip(tripsWithCoords[0]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setRouteInfo(null);
  };

  const handleRouteCalculated = (info) => {
    setRouteInfo(info);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in-progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Container maxW="8xl" py={8}>
          <Center>
            <VStack>
              <Spinner size="xl" />
              <Text>Loading trips...</Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Container maxW="8xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={4}>
              <Box>
                <Heading size="lg" mb={2}>Trip Maps Dashboard</Heading>
                <Text color="gray.600">
                  View and track transportation trips with real-time mapping and routing
                </Text>
              </Box>
              
              {/* View Mode Toggle */}
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">View:</Text>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <IconButton
                    icon={<ViewIcon />}
                    aria-label="Split view"
                    colorScheme={viewMode === 'split' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('split')}
                    title="Split View"
                  />
                  <Button
                    size="sm"
                    variant={viewMode === 'map-only' ? 'solid' : 'outline'}
                    colorScheme={viewMode === 'map-only' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('map-only')}
                  >
                    Map Only
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list-only' ? 'solid' : 'outline'}
                    colorScheme={viewMode === 'list-only' ? 'blue' : 'gray'}
                    onClick={() => setViewMode('list-only')}
                  >
                    List Only
                  </Button>
                </ButtonGroup>
              </HStack>
            </Flex>
          </Box>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Grid 
            templateColumns={{
              base: viewMode === 'list-only' ? "1fr" : viewMode === 'map-only' ? "1fr" : "1fr",
              xl: viewMode === 'split' ? "300px 1fr" : "1fr"
            }} 
            gap={6}
          >
            {/* Trip List Sidebar - Hide in map-only mode */}
            {(viewMode === 'split' || viewMode === 'list-only') && (
              <GridItem display={{ base: viewMode === 'map-only' ? 'none' : 'block', xl: 'block' }}>
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">Trips</Heading>
                      <Button size="sm" leftIcon={<RepeatIcon />} onClick={fetchTrips}>
                        Refresh
                      </Button>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch" maxH={{ base: "300px", md: "500px" }} overflowY="auto">
                      {trips.length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={4}>
                          No trips with coordinates found
                        </Text>
                      ) : (
                        trips.map((trip) => (
                          <Card
                            key={trip._id}
                            variant={selectedTrip?._id === trip._id ? "filled" : "outline"}
                            cursor="pointer"
                            onClick={() => handleTripSelect(trip)}
                            _hover={{ shadow: "md" }}
                            size="sm"
                          >
                            <CardBody p={3}>
                              <VStack align="start" spacing={1}>
                                <HStack justify="space-between" w="100%">
                                  <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                    {trip.riderName}
                                  </Text>
                                  <Badge 
                                    colorScheme={getStatusColor(trip.status)} 
                                    size="xs"
                                  >
                                    {trip.status}
                                  </Badge>
                                </HStack>
                                
                                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                  📍 {trip.pickupLocation.address}
                                </Text>
                                
                                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                  🏁 {trip.dropoffLocation.address}
                                </Text>
                                
                                {trip.scheduledDateTime && (
                                  <Text fontSize="xs" color="blue.600">
                                    {new Date(trip.scheduledDateTime).toLocaleDateString()} at{' '}
                                    {new Date(trip.scheduledDateTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            )}

            {/* Map Area - Hide in list-only mode */}
            {(viewMode === 'split' || viewMode === 'map-only') && (
              <GridItem display={{ base: viewMode === 'list-only' ? 'none' : 'block', xl: 'block' }}>
                {selectedTrip ? (
                  <TripMap
                    trip={selectedTrip}
                    height={{ base: "400px", md: "600px" }}
                    showRoute={true}
                    showControls={true}
                    onRouteCalculated={handleRouteCalculated}
                  />
                ) : (
                  <Card>
                    <CardBody>
                      <Center h={{ base: "400px", md: "600px" }}>
                        <VStack>
                          <ViewIcon boxSize={12} color="gray.400" />
                          <Text color="gray.500" textAlign="center">
                            Select a trip from the list to view it on the map
                          </Text>
                        </VStack>
                      </Center>
                    </CardBody>
                  </Card>
                )}
              </GridItem>
            )}
          </Grid>

          {/* Route Statistics */}
          {routeInfo && (
            <Card>
              <CardHeader>
                <Heading size="md">Route Information</Heading>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {routeInfo.distance}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Total Distance</Text>
                  </Box>
                  
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {routeInfo.duration}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Estimated Time</Text>
                  </Box>
                  
                  <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="bold" color="purple.500" noOfLines={2}>
                      {routeInfo.startAddress?.split(',')[0]}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Starting Point</Text>
                  </Box>
                  
                  <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="bold" color="orange.500" noOfLines={2}>
                      {routeInfo.endAddress?.split(',')[0]}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Destination</Text>
                  </Box>
                </Grid>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default MapsDashboard;