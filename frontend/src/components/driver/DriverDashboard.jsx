import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Spinner,
  Center,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  IconButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { SearchIcon, ExternalLinkIcon, PhoneIcon, CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { user } = useAuth();
  const toast = useToast();

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/trips');
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trips',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAvailability = async (available) => {
    setUpdating(true);
    try {
      await axios.patch(`/users/${user._id}/availability`, { 
        isAvailable: available 
      });
      setIsAvailable(available);
      toast({
        title: 'Success',
        description: `You are now ${available ? 'available' : 'unavailable'} for trips`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateTripStatus = async (tripId, status) => {
    try {
      await axios.patch(`/trips/${tripId}/status`, { 
        status,
        location: currentLocation 
      });
      
      toast({
        title: 'Success',
        description: `Trip status updated to ${status.replace('_', ' ')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTrips();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update trip status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateDriverLocation = useCallback(async (location) => {
    try {
      await axios.patch(`/users/${user._id}/location`, location);
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }, [user._id]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateDriverLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Unable to get your current location',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  }, [toast, updateDriverLocation]);

  useEffect(() => {
    fetchTrips();
    getCurrentLocation();
    
    // Update location every 2 minutes when available
    const locationInterval = setInterval(() => {
      if (isAvailable) {
        getCurrentLocation();
      }
    }, 120000);

    // Refresh trips every 30 seconds
    const tripsInterval = setInterval(fetchTrips, 30000);

    return () => {
      clearInterval(locationInterval);
      clearInterval(tripsInterval);
    };
  }, [fetchTrips, isAvailable, user._id]);

  const openGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'assigned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box>
        <Navbar title="Driver Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  // Filter trips for this driver
  const myTrips = trips.filter(trip => 
    trip.assignedDriver && trip.assignedDriver._id === user._id
  );
  const activeTrips = myTrips.filter(trip => 
    ['assigned', 'in_progress'].includes(trip.status)
  );
  const completedTrips = myTrips.filter(trip => trip.status === 'completed');

  return (
    <Box>
      <Navbar title="Driver Dashboard" />
      
      <Container maxW="container.xl" py={6}>
        {/* Driver Status Card */}
        <Card mb={6}>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color={isAvailable ? 'green.500' : 'red.500'}>
                  {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                </Text>
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="availability" mb="0">
                    Available for trips
                  </FormLabel>
                  <Switch
                    id="availability"
                    isChecked={isAvailable}
                    onChange={(e) => updateAvailability(e.target.checked)}
                    isDisabled={updating}
                    colorScheme="green"
                  />
                </FormControl>
              </VStack>
              
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {activeTrips.length}
                </Text>
                <Text color="gray.600">Active Trips</Text>
              </VStack>
              
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {completedTrips.length}
                </Text>
                <Text color="gray.600">Completed Today</Text>
              </VStack>
              
              <VStack>
                <Button
                  leftIcon={<ExternalLinkIcon />}
                  colorScheme="blue"
                  onClick={getCurrentLocation}
                  size="sm"
                >
                  Update Location
                </Button>
                {currentLocation && (
                  <Text fontSize="xs" color="gray.500">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Text>
                )}
              </VStack>
            </Grid>
          </CardBody>
        </Card>

        {/* Active Trips */}
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Active Trips ({activeTrips.length})</Heading>
          </CardHeader>
          <CardBody>
            {activeTrips.length === 0 ? (
              <Center py={8}>
                <VStack>
                  <Text color="gray.500">No active trips assigned</Text>
                  {!isAvailable && (
                    <Alert status="info" rounded="md">
                      <AlertIcon />
                      Set your status to available to receive trip assignments
                    </Alert>
                  )}
                </VStack>
              </Center>
            ) : (
              <Accordion allowMultiple>
                {activeTrips.map((trip) => (
                  <AccordionItem key={trip._id}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack justify="space-between">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{trip.tripId}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {trip.riderName}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={0}>
                            <Badge colorScheme={getStatusColor(trip.status)}>
                              {trip.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(trip.scheduledDate)}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        {/* Trip Details */}
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <Box>
                            <Text fontWeight="bold" color="green.600" mb={2}>
                              Pickup Location
                            </Text>
                            <Text fontSize="sm" mb={2}>
                              {trip.pickupLocation.address}
                            </Text>
                            <Button
                              leftIcon={<SearchIcon />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => openGoogleMaps(trip.pickupLocation.address)}
                            >
                              Navigate
                            </Button>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="bold" color="red.600" mb={2}>
                              Dropoff Location
                            </Text>
                            <Text fontSize="sm" mb={2}>
                              {trip.dropoffLocation.address}
                            </Text>
                            <Button
                              leftIcon={<SearchIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => openGoogleMaps(trip.dropoffLocation.address)}
                            >
                              Navigate
                            </Button>
                          </Box>
                        </Grid>

                        <Divider />

                        {/* Rider Information */}
                        <Box>
                          <Text fontWeight="bold" mb={2}>Rider Information</Text>
                          <HStack>
                            <Text>Name: {trip.riderName}</Text>
                            {trip.riderPhone && (
                              <HStack>
                                <Text>Phone: {trip.riderPhone}</Text>
                                <IconButton
                                  icon={<PhoneIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  aria-label="Call rider"
                                  onClick={() => window.open(`tel:${trip.riderPhone}`)}
                                />
                              </HStack>
                            )}
                          </HStack>
                          {trip.notes && (
                            <Text mt={2} fontSize="sm" color="gray.600">
                              <strong>Notes:</strong> {trip.notes}
                            </Text>
                          )}
                        </Box>

                        <Divider />

                        {/* Action Buttons */}
                        <HStack spacing={4}>
                          {trip.status === 'assigned' && (
                            <Button
                              colorScheme="blue"
                              onClick={() => updateTripStatus(trip._id, 'in_progress')}
                            >
                              Start Trip
                            </Button>
                          )}
                          
                          {trip.status === 'in_progress' && (
                            <Button
                              colorScheme="green"
                              leftIcon={<CheckCircleIcon />}
                              onClick={() => updateTripStatus(trip._id, 'completed')}
                            >
                              Complete Trip
                            </Button>
                          )}
                        </HStack>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardBody>
        </Card>

        {/* Recent Completed Trips */}
        {completedTrips.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">Recent Completed Trips</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                {completedTrips.slice(0, 5).map((trip) => (
                  <Box key={trip._id} p={4} bg="green.50" rounded="md">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{trip.tripId}</Text>
                        <Text fontSize="sm">{trip.riderName}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {trip.pickupLocation.address} → {trip.dropoffLocation.address}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Badge colorScheme="green">COMPLETED</Badge>
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(trip.actualDropoffTime || trip.scheduledDate)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default DriverDashboard;