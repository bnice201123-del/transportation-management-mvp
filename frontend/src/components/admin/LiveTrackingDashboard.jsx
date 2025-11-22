import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Select,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Switch,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { ViewIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaMapMarkedAlt, FaRoute, FaCar, FaClock } from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import GoogleMap from '../maps/GoogleMap';
import VehicleQuickView from '../shared/VehicleQuickView';

const LiveTrackingDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const toast = useToast();

  const fetchTrips = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const tripsData = response.data || [];
      
      // Filter trips that have coordinates and are active
      const activeTrips = tripsData.filter(trip => 
        trip.pickupLocation?.coordinates && 
        trip.dropoffLocation?.coordinates &&
        ['scheduled', 'in-progress', 'assigned'].includes(trip.status)
      );
      
      setTrips(activeTrips);
      setError('');
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load trips');
      toast({
        title: 'Error',
        description: 'Failed to load trips',
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

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrips();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTrips]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in-progress': return 'blue';
      case 'assigned': return 'orange';
      case 'scheduled': return 'green';
      default: return 'gray';
    }
  };

  const filteredTrips = statusFilter === 'all' 
    ? trips 
    : trips.filter(trip => trip.status === statusFilter);

  // Create markers for map
  const mapMarkers = filteredTrips.map(trip => {
    const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
    const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
    
    return [
      {
        position: { lat: pickupLat, lng: pickupLng },
        title: `Pickup - ${trip.riderName}`,
        type: 'pickup',
        tripId: trip._id,
        info: `Pickup: ${trip.pickupLocation.address}`
      },
      {
        position: { lat: dropoffLat, lng: dropoffLng },
        title: `Dropoff - ${trip.riderName}`,
        type: 'dropoff',
        tripId: trip._id,
        info: `Dropoff: ${trip.dropoffLocation.address}`
      }
    ];
  }).flat();

  // Calculate center of all trips
  const getMapCenter = () => {
    if (filteredTrips.length === 0) {
      return { lat: 40.7589, lng: -73.9851 }; // Default to NYC
    }
    
    const allCoordinates = [];
    filteredTrips.forEach(trip => {
      const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
      const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
      allCoordinates.push({ lat: pickupLat, lng: pickupLng });
      allCoordinates.push({ lat: dropoffLat, lng: dropoffLng });
    });
    
    const avgLat = allCoordinates.reduce((sum, coord) => sum + coord.lat, 0) / allCoordinates.length;
    const avgLng = allCoordinates.reduce((sum, coord) => sum + coord.lng, 0) / allCoordinates.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  return (
    <Box>
      <Navbar />
      <Container maxW="full" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card>
            <CardHeader>
              <Flex align="center" justify="space-between">
                <HStack>
                  <FaMapMarkedAlt color="blue" size="24" />
                  <Heading size="lg">Live Trip Tracking</Heading>
                  <Badge colorScheme="blue" ml={2}>
                    {filteredTrips.length} Active Trips
                  </Badge>
                </HStack>
                
                <HStack spacing={4}>
                  <FormControl display="flex" alignItems="center" maxW="200px">
                    <FormLabel mb={0} fontSize="sm">Auto Refresh:</FormLabel>
                    <Switch
                      isChecked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  {autoRefresh && (
                    <Select
                      size="sm"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      maxW="100px"
                    >
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                    </Select>
                  )}
                  
                  <Button
                    leftIcon={<RepeatIcon />}
                    size="sm"
                    onClick={fetchTrips}
                    isLoading={loading}
                  >
                    Refresh
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
          </Card>

          {/* Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Total Active</StatLabel>
              <StatNumber>{trips.length}</StatNumber>
              <StatHelpText>Live trips</StatHelpText>
            </Stat>
            
            <Stat>
              <StatLabel>In Progress</StatLabel>
              <StatNumber>{trips.filter(t => t.status === 'in-progress').length}</StatNumber>
              <StatHelpText>Currently moving</StatHelpText>
            </Stat>
            
            <Stat>
              <StatLabel>Assigned</StatLabel>
              <StatNumber>{trips.filter(t => t.status === 'assigned').length}</StatNumber>
              <StatHelpText>Driver assigned</StatHelpText>
            </Stat>
            
            <Stat>
              <StatLabel>Scheduled</StatLabel>
              <StatNumber>{trips.filter(t => t.status === 'scheduled').length}</StatNumber>
              <StatHelpText>Upcoming</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={6}>
            {/* Trip List */}
            <GridItem>
              <Card>
                <CardHeader>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Active Trips</Heading>
                    </HStack>
                    
                    <Select
                      size="sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="in-progress">In Progress</option>
                      <option value="assigned">Assigned</option>
                      <option value="scheduled">Scheduled</option>
                    </Select>
                  </VStack>
                </CardHeader>
                
                <CardBody maxH="600px" overflowY="auto">
                  {loading ? (
                    <Center py={8}>
                      <Spinner size="lg" />
                    </Center>
                  ) : error ? (
                    <Alert status="error" size="sm">
                      <AlertIcon />
                      {error}
                    </Alert>
                  ) : filteredTrips.length === 0 ? (
                    <Center py={8}>
                      <Text color="gray.500">No active trips found</Text>
                    </Center>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {filteredTrips.map((trip) => (
                        <Card
                          key={trip._id}
                          variant={selectedTrip?._id === trip._id ? "filled" : "outline"}
                          cursor="pointer"
                          onClick={() => setSelectedTrip(trip)}
                          _hover={{ shadow: "md" }}
                          size="sm"
                        >
                          <CardBody p={3}>
                            <VStack align="start" spacing={2}>
                              <HStack justify="space-between" w="100%">
                                <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                  {trip.riderName}
                                </Text>
                                <Badge colorScheme={getStatusColor(trip.status)} size="xs">
                                  {trip.status}
                                </Badge>
                              </HStack>
                              
                              <VStack align="start" spacing={1} fontSize="xs">
                                <HStack>
                                  <FaMapMarkedAlt color="green" />
                                  <Text noOfLines={1} color="green.600">
                                    {trip.pickupLocation.address.substring(0, 30)}...
                                  </Text>
                                </HStack>
                                
                                <HStack>
                                  <FaMapMarkedAlt color="red" />
                                  <Text noOfLines={1} color="red.600">
                                    {trip.dropoffLocation.address.substring(0, 30)}...
                                  </Text>
                                </HStack>
                                
                                {trip.scheduledDateTime && (
                                  <HStack>
                                    <FaClock />
                                    <Text color="blue.600">
                                      {new Date(trip.scheduledDateTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Text>
                                  </HStack>
                                )}
                                
                                {trip.assignedDriver && (
                                  <HStack>
                                    <FaCar />
                                    <Text color="orange.600">
                                      {typeof trip.assignedDriver === 'object' 
                                        ? (trip.assignedDriver.name || `${trip.assignedDriver.firstName || ''} ${trip.assignedDriver.lastName || ''}`.trim() || trip.assignedDriver.email || 'Unnamed Driver')
                                        : trip.assignedDriver
                                      }
                                    </Text>
                                  </HStack>
                                )}
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </GridItem>

            {/* Map View */}
            <GridItem>
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Live Map View</Heading>
                    {selectedTrip && (
                      <Badge colorScheme="blue">
                        Viewing: {selectedTrip.riderName}
                      </Badge>
                    )}
                  </HStack>
                </CardHeader>
                
                <CardBody>
                  {filteredTrips.length === 0 ? (
                    <Center h="500px">
                      <VStack>
                        <ViewIcon boxSize={12} color="gray.400" />
                        <Text color="gray.500" textAlign="center">
                          No active trips to display
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Box borderRadius="md" overflow="hidden">
                      <GoogleMap
                        center={getMapCenter()}
                        zoom={selectedTrip ? 13 : 10}
                        markers={mapMarkers}
                        height="500px"
                        onMarkerClick={(marker) => {
                          const trip = filteredTrips.find(t => t._id === marker.tripId);
                          if (trip) setSelectedTrip(trip);
                        }}
                      />
                    </Box>
                  )}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Selected Trip Details */}
          {selectedTrip && (
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Selected Trip Details</Heading>
                  <Button
                    size="sm"
                    leftIcon={<FaRoute />}
                    colorScheme="blue"
                    onClick={() => {
                      const pickup = encodeURIComponent(selectedTrip.pickupLocation.address);
                      const dropoff = encodeURIComponent(selectedTrip.dropoffLocation.address);
                      window.open(`https://www.google.com/maps/dir/${pickup}/${dropoff}`, '_blank');
                    }}
                  >
                    View Route in Google Maps
                  </Button>
                </HStack>
              </CardHeader>
              
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Rider</Text>
                    <Text fontSize="lg" fontWeight="semibold">{selectedTrip.riderName}</Text>
                    {selectedTrip.riderPhone && (
                      <Text fontSize="sm" color="blue.600">{selectedTrip.riderPhone}</Text>
                    )}
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedTrip.status)} fontSize="md" p={1}>
                      {selectedTrip.status}
                    </Badge>
                    {selectedTrip.scheduledDateTime && (
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {new Date(selectedTrip.scheduledDateTime).toLocaleString()}
                      </Text>
                    )}
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600">Pickup</Text>
                    <Text fontSize="sm">{selectedTrip.pickupLocation.address}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600">Dropoff</Text>
                    <Text fontSize="sm">{selectedTrip.dropoffLocation.address}</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default LiveTrackingDashboard;