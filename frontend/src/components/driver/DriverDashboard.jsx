import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
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
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  CheckCircleIcon,
  TruckIcon,
  MapPinIcon,
  ArrowPathIcon,
  ClockIcon,
  MapIcon,
  PlayIcon,
  StopIcon,
  UserIcon,
  BellIcon,
  HomeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  TruckIcon as TruckIconSolid,
  MapPinIcon as MapPinIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';
import { FaNavigation } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';
import GoogleMap from '../maps/GoogleMap';
import TripMap from '../maps/TripMap';

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [navigationModal, setNavigationModal] = useState({ isOpen: false, address: '', coordinates: null });
  const { user } = useAuth();
  const toast = useToast();

  // Responsive design variables
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const cardSpacing = { base: 4, md: 6 };
  const buttonSize = { base: "md", md: "lg" };

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.data?.trips || []);
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
      await axios.patch(`/api/users/${user._id}/availability`, { 
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
      await axios.patch(`/api/users/${user._id}/location`, location);
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
  }, [fetchTrips, isAvailable, user._id, getCurrentLocation]);

  const openGoogleMaps = (address, coordinates = null) => {
    setNavigationModal({ isOpen: true, address, coordinates });
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
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Driver Dashboard" />
      
      {/* Enhanced Driver Dashboard Layout */}
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="full" py={cardSpacing} px={cardSpacing}>
          {/* Enhanced Header with Breadcrumbs */}
          <Card 
            mb={cardSpacing} 
            shadow="lg"
            bg={cardBg}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
          >
            <CardHeader bg={headerBg} borderTopRadius="xl">
              <VStack spacing={4} align="stretch">
                {/* Header with User Greeting and Status */}
                <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align={{ base: 'start', lg: 'center' }}>
                  <VStack align="start" spacing={2} flex={1}>
                    <HStack spacing={3}>
                      <Box as={UserIconSolid} w={8} h={8} color="blue.600" />
                      <VStack align="start" spacing={0}>
                        <Heading size={{ base: "md", md: "lg" }} color="blue.700">
                          Welcome back, {user?.firstName || 'Driver'}!
                        </Heading>
                        <Text color={mutedColor} fontSize={{ base: "sm", md: "md" }}>
                          Your personalized driver dashboard and trip management
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {/* Enhanced Status Display */}
                    <HStack spacing={6} fontSize="sm" flexWrap="wrap">
                      <HStack>
                        <Box 
                          as={isAvailable ? CheckCircleIconSolid : ExclamationTriangleIcon} 
                          w={4} h={4} 
                          color={isAvailable ? 'green.500' : 'red.500'} 
                        />
                        <Text fontWeight="medium" color={isAvailable ? 'green.600' : 'red.600'}>
                          {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </Text>
                      </HStack>
                      <HStack>
                        <Box as={ClockIconSolid} w={4} h={4} color="blue.500" />
                        <Text fontWeight="medium">{activeTrips.length} Active Trips</Text>
                      </HStack>
                      <HStack>
                        <Box as={CheckCircleIconSolid} w={4} h={4} color="green.500" />
                        <Text fontWeight="medium">{completedTrips.length} Completed</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Flex>
              </VStack>
            </CardHeader>

            {/* Enhanced Statistics Dashboard */}
            <CardBody>
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
              <Stat>
                <StatLabel>Status</StatLabel>
                <StatNumber fontSize="lg" color={isAvailable ? 'green.500' : 'red.500'}>
                  {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                </StatNumber>
                <StatHelpText>
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      id="availability"
                      isChecked={isAvailable}
                      onChange={(e) => updateAvailability(e.target.checked)}
                      isDisabled={updating}
                      colorScheme="green"
                      size="sm"
                    />
                    <FormLabel htmlFor="availability" mb="0" ml={2} fontSize="sm">
                      Available
                    </FormLabel>
                  </FormControl>
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Active Trips</StatLabel>
                <StatNumber color="blue.500">{activeTrips.length}</StatNumber>
                <StatHelpText>Currently assigned</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Completed Today</StatLabel>
                <StatNumber color="green.500">{completedTrips.length}</StatNumber>
                <StatHelpText>Total completed</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Location</StatLabel>
                <StatNumber fontSize="sm">
                  {currentLocation ? 'GPS Active' : 'No Signal'}
                </StatNumber>
                <StatHelpText>
                  <Button
                    leftIcon={<Box as={MapIcon} w={3} h={3} />}
                    size="xs"
                    colorScheme="blue"
                    onClick={getCurrentLocation}
                  >
                    Update
                  </Button>
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Total Trips</StatLabel>
                <StatNumber color="purple.500">{myTrips.length}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs>
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Box as={TruckIconSolid} w={4} h={4} />
                <Text>Active Trips ({activeTrips.length})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Box as={MapIcon} w={4} h={4} />
                <Text>Route Map</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <CheckCircleIcon />
                <Text>Completed ({completedTrips.length})</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Active Trips Tab */}
            <TabPanel px={0}>
              <Card>
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
                    <VStack spacing={4} align="stretch">
                      {activeTrips.map((trip) => (
                        <Card key={trip._id} variant="outline">
                          <CardHeader pb={2}>
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={0}>
                                <Heading size="md">{trip.tripId}</Heading>
                                <Text color="gray.600">{trip.riderName}</Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Badge colorScheme={getStatusColor(trip.status)} fontSize="sm" p={1}>
                                  {trip.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Text fontSize="sm" color="gray.600">
                                  {formatDate(trip.scheduledDate)}
                                </Text>
                              </VStack>
                            </Flex>
                          </CardHeader>
                          
                          <CardBody pt={0}>
                            <VStack align="stretch" spacing={4}>
                              {/* Route Map for this trip */}
                              {trip.pickupLocation?.coordinates && trip.dropoffLocation?.coordinates && (
                                <Box borderRadius="md" overflow="hidden" border="1px" borderColor="gray.200">
                                  <TripMap
                                    pickup={{
                                      lat: trip.pickupLocation.coordinates[1],
                                      lng: trip.pickupLocation.coordinates[0],
                                      address: trip.pickupLocation.address
                                    }}
                                    dropoff={{
                                      lat: trip.dropoffLocation.coordinates[1],
                                      lng: trip.dropoffLocation.coordinates[0],
                                      address: trip.dropoffLocation.address
                                    }}
                                    height="200px"
                                  />
                                </Box>
                              )}

                              {/* Location Details */}
                              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                                <Box>
                                  <HStack spacing={2} mb={2}>
                                    <FaMapMarkerAlt color="green" />
                                    <Text fontWeight="bold" color="green.600">
                                      Pickup Location
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" mb={3} color="gray.700">
                                    {trip.pickupLocation.address}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Button
                                      leftIcon={<FaNavigation />}
                                      size="sm"
                                      colorScheme="green"
                                      onClick={() => openGoogleMaps(
                                        trip.pickupLocation.address,
                                        trip.pickupLocation.coordinates ? {
                                          lat: trip.pickupLocation.coordinates[1],
                                          lng: trip.pickupLocation.coordinates[0]
                                        } : null
                                      )}
                                    >
                                      Navigate
                                    </Button>
                                    <Button
                                      leftIcon={<PhoneIcon />}
                                      size="sm"
                                      variant="outline"
                                      colorScheme="green"
                                      onClick={() => window.open(`tel:${trip.riderPhone || ''}`)}
                                      isDisabled={!trip.riderPhone}
                                    >
                                      Call
                                    </Button>
                                  </HStack>
                                </Box>
                                
                                <Box>
                                  <HStack spacing={2} mb={2}>
                                    <FaMapMarkerAlt color="red" />
                                    <Text fontWeight="bold" color="red.600">
                                      Dropoff Location
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" mb={3} color="gray.700">
                                    {trip.dropoffLocation.address}
                                  </Text>
                                  <Button
                                    leftIcon={<FaNavigation />}
                                    size="sm"
                                    colorScheme="red"
                                    onClick={() => openGoogleMaps(
                                      trip.dropoffLocation.address,
                                      trip.dropoffLocation.coordinates ? {
                                        lat: trip.dropoffLocation.coordinates[1],
                                        lng: trip.dropoffLocation.coordinates[0]
                                      } : null
                                    )}
                                  >
                                    Full Route
                                  </Button>
                                </Box>
                              </Grid>

                              {/* Rider Information */}
                              <Box bg="gray.50" p={4} borderRadius="md">
                                <Text fontWeight="bold" mb={2}>Rider Information</Text>
                                <HStack justify="space-between" wrap="wrap">
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="sm">
                                      <strong>Name:</strong> {trip.riderName}
                                    </Text>
                                    {trip.riderPhone && (
                                      <Text fontSize="sm">
                                        <strong>Phone:</strong> {trip.riderPhone}
                                      </Text>
                                    )}
                                    {trip.scheduledDate && (
                                      <Text fontSize="sm">
                                        <strong>Scheduled:</strong> {formatDate(trip.scheduledDate)}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                                {trip.notes && (
                                  <Text mt={2} fontSize="sm" color="gray.600" fontStyle="italic">
                                    <strong>Notes:</strong> {trip.notes}
                                  </Text>
                                )}
                              </Box>

                              {/* Action Buttons */}
                              <HStack spacing={4} justify="center">
                                {trip.status === 'assigned' && (
                                  <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => updateTripStatus(trip._id, 'in_progress')}
                                    leftIcon={<Box as={PlayIcon} w={5} h={5} />}
                                  >
                                    Start Trip
                                  </Button>
                                )}
                                
                                {trip.status === 'in_progress' && (
                                  <Button
                                    colorScheme="green"
                                    size="lg"
                                    leftIcon={<CheckCircleIcon />}
                                    onClick={() => updateTripStatus(trip._id, 'completed')}
                                  >
                                    Complete Trip
                                  </Button>
                                )}
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Route Map Tab */}
            <TabPanel px={0}>
              <Card>
                <CardHeader>
                  <Heading size="md">All Active Routes</Heading>
                </CardHeader>
                <CardBody>
                  {activeTrips.length === 0 ? (
                    <Center py={8}>
                      <VStack>
                        <FaMap size={48} color="gray" />
                        <Text color="gray.500">No active routes to display</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Box borderRadius="md" overflow="hidden">
                      <GoogleMap
                        center={currentLocation || { lat: 40.7589, lng: -73.9851 }}
                        zoom={12}
                        markers={activeTrips.flatMap(trip => {
                          if (!trip.pickupLocation?.coordinates || !trip.dropoffLocation?.coordinates) return [];
                          return [
                            {
                              position: {
                                lat: trip.pickupLocation.coordinates[1],
                                lng: trip.pickupLocation.coordinates[0]
                              },
                              title: `Pickup - ${trip.riderName}`,
                              info: trip.pickupLocation.address
                            },
                            {
                              position: {
                                lat: trip.dropoffLocation.coordinates[1],
                                lng: trip.dropoffLocation.coordinates[0]
                              },
                              title: `Dropoff - ${trip.riderName}`,
                              info: trip.dropoffLocation.address
                            }
                          ];
                        })}
                        height="500px"
                      />
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Completed Trips Tab */}
            <TabPanel px={0}>
              <Card>
                <CardHeader>
                  <Heading size="md">Recent Completed Trips</Heading>
                </CardHeader>
                <CardBody>
                  {completedTrips.length === 0 ? (
                    <Center py={8}>
                      <Text color="gray.500">No completed trips yet</Text>
                    </Center>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      {completedTrips.slice(0, 10).map((trip) => (
                        <Box key={trip._id} p={4} bg="green.50" rounded="md" border="1px" borderColor="green.100">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">{trip.tripId}</Text>
                              <Text fontSize="sm" color="gray.700">{trip.riderName}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {trip.pickupLocation.address} → {trip.dropoffLocation.address}
                              </Text>
                            </VStack>
                            <VStack align="end" spacing={1}>
                              <Badge colorScheme="green" fontSize="sm">COMPLETED</Badge>
                              <Text fontSize="sm" color="gray.600">
                                {formatDate(trip.actualDropoffTime || trip.scheduledDate)}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
        </Container>
      </Box>

      {/* Navigation Modal */}
      <Modal 
        isOpen={navigationModal.isOpen} 
        onClose={() => setNavigationModal({ isOpen: false, address: '', coordinates: null })}
        size="6xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>Navigate to {navigationModal.address}</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            <GoogleMap
              center={navigationModal.coordinates || { lat: 40.7589, lng: -73.9851 }}
              zoom={15}
              markers={navigationModal.coordinates ? [{
                position: navigationModal.coordinates,
                title: navigationModal.address
              }] : []}
              height="70vh"
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={() => {
                // Open in external Google Maps as fallback
                const encodedAddress = encodeURIComponent(navigationModal.address);
                const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                window.open(url, '_blank');
              }}
            >
              Open in Google Maps
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setNavigationModal({ isOpen: false, address: '', coordinates: null })}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DriverDashboard;