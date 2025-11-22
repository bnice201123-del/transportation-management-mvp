import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useColorModeValue,
  Wrap,
  WrapItem
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
  UserGroupIcon,
  BellIcon,
  HomeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  TruckIcon as TruckIconSolid,
  MapPinIcon as MapPinIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';
import GoogleMap from '../maps/GoogleMap';
import TripMap from '../maps/TripMap';
import DriveMode from './DriveMode';
import VehicleQuickView from '../shared/VehicleQuickView';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeDriveTrip, setActiveDriveTrip] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { user } = useAuth();
  const toast = useToast();

  // Responsive design variables
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const cardSpacing = { base: 4, md: 6 };
  const buttonSize = { base: "md", md: "lg" };

  const fetchAssignedVehicle = useCallback(async () => {
    try {
      const response = await axios.get('/api/vehicles');
      const vehicles = response.data.vehicles || [];
      // Find vehicle where currentDriver matches the logged-in user
      const myVehicle = vehicles.find(v => v.currentDriver?._id === user._id || v.currentDriver === user._id);
      setAssignedVehicle(myVehicle || null);
    } catch (error) {
      console.error('Error fetching assigned vehicle:', error);
    }
  }, [user._id]);

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

  const updateTripStatus = async (tripId, status, tripData = null) => {
    try {
      console.log('updateTripStatus called with:', { tripId, status, tripData });
      
      const payload = { 
        status,
        location: currentLocation
      };

      // If trip data is provided (from Drive Mode), include it
      if (tripData) {
        payload.tripMetrics = {
          completionTime: tripData.completionTime,
          startTime: tripData.startTime,
          durationMinutes: tripData.durationMinutes,
          distanceTraveled: tripData.distanceTraveled,
          averageSpeed: tripData.averageSpeed,
          finalLocation: tripData.currentLocation,
          finalHeading: tripData.finalHeading,
          cancellationReason: tripData.cancellationReason || null
        };
      }

      console.log('Sending payload to backend:', payload);
      
      const response = await axios.patch(`/trips/${tripId}/status`, payload);
      
      console.log('Backend response:', response.data);
      
      toast({
        title: 'Success',
        description: tripData 
          ? `Trip ${status}: ${tripData.durationMinutes} min, ${tripData.distanceTraveled} mi`
          : `Trip status updated to ${status.replace('_', ' ')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTrips();
    } catch (error) {
      console.error('Error in updateTripStatus:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to update trip status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error; // Re-throw so DriveMode can catch it
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
    fetchAssignedVehicle();
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
  }, [fetchTrips, fetchAssignedVehicle, isAvailable, user._id, getCurrentLocation]);

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
                <StatLabel>Assigned Vehicle</StatLabel>
                <StatNumber fontSize="sm" color={assignedVehicle ? 'green.500' : 'gray.500'}>
                  {assignedVehicle ? (
                    <VehicleQuickView vehicle={assignedVehicle}>
                      {`${assignedVehicle.year} ${assignedVehicle.make} ${assignedVehicle.model}`}
                    </VehicleQuickView>
                  ) : (
                    'Not Assigned'
                  )}
                </StatNumber>
                <StatHelpText>
                  {assignedVehicle ? (
                    <Text 
                      fontSize="xs" 
                      color="blue.500"
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={() => navigate(`/vehicles/${assignedVehicle._id}`)}
                    >
                      {assignedVehicle.licensePlate}
                    </Text>
                  ) : (
                    <Text fontSize="xs">Contact dispatcher</Text>
                  )}
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

        {/* Quick Actions Section - Conditional for admins/dispatchers/schedulers */}
        {user?.role && ['admin', 'dispatcher', 'scheduler'].includes(user.role) && (
          <Card mb={cardSpacing} bg={cardBg}>
            <CardHeader>
              <Heading size="md" display="flex" alignItems="center" gap={3}>
                <Box as={Cog6ToothIcon} w={5} h={5} color="blue.500" />
                Quick Actions
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Wrap spacing={4}>
                <WrapItem>
                  <Button
                    leftIcon={<Box as={UserGroupIconSolid} w={4} h={4} />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={() => navigate('/riders')}
                    size={{ base: "md", md: "md" }}
                  >
                    All Riders
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button
                    leftIcon={<Box as={ArrowPathIcon} w={4} h={4} />}
                    onClick={fetchTrips}
                    size={{ base: "md", md: "md" }}
                    variant="outline"
                  >
                    Refresh Trips
                  </Button>
                </WrapItem>
              </Wrap>
            </CardBody>
          </Card>
        )}

        {/* Main Content with Tabs */}
        <Tabs index={activeTabIndex} onChange={setActiveTabIndex}>
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Box as={TruckIconSolid} w={4} h={4} />
                <Text>Active Trips ({activeTrips.length})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Box as={PlayIcon} w={4} h={4} />
                <Text>Drive Mode</Text>
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
                              <HStack spacing={2}>
                                <VStack align="end" spacing={1}>
                                  <Badge colorScheme={getStatusColor(trip.status)} fontSize="sm" p={1}>
                                    {trip.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  <Text fontSize="sm" color="gray.600">
                                    {formatDate(trip.scheduledDate)}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon={<Box as={ChevronRightIcon} w={7} h={7} />}
                                  colorScheme="green"
                                  variant="solid"
                                  size="lg"
                                  aria-label="Enter Drive Mode"
                                  onClick={() => {
                                    setActiveDriveTrip(trip);
                                    setActiveTabIndex(1);
                                  }}
                                  _hover={{
                                    bg: 'green.600',
                                    transform: 'translateX(3px) scale(1.05)',
                                    boxShadow: 'lg'
                                  }}
                                  transition="all 0.2s"
                                  boxShadow="md"
                                />
                              </HStack>
                            </Flex>
                          </CardHeader>
                          
                          <CardBody pt={0}>
                            <VStack align="stretch" spacing={4}>
                              {/* Route Map for this trip */}
                              {trip.pickupLocation?.coordinates && trip.dropoffLocation?.coordinates && (
                                <Box borderRadius="md" overflow="hidden" border="1px" borderColor="gray.200">
                                  <TripMap
                                    trip={trip}
                                    height="200px"
                                    showRoute={true}
                                    showControls={false}
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
                                  <>
                                    <Button
                                      colorScheme="blue"
                                      size="lg"
                                      onClick={() => updateTripStatus(trip._id, 'in_progress')}
                                      leftIcon={<Box as={PlayIcon} w={5} h={5} />}
                                    >
                                      Start Trip
                                    </Button>
                                    <Button
                                      colorScheme="green"
                                      variant="outline"
                                      size="lg"
                                      onClick={() => {
                                        setActiveDriveTrip(trip);
                                        setActiveTabIndex(1); // Switch to Drive Mode tab
                                      }}
                                      leftIcon={<Box as={MapIcon} w={5} h={5} />}
                                    >
                                      Enter Drive Mode
                                    </Button>
                                  </>
                                )}
                                
                                {trip.status === 'in_progress' && (
                                  <>
                                    <Button
                                      colorScheme="green"
                                      size="lg"
                                      leftIcon={<CheckCircleIcon />}
                                      onClick={() => updateTripStatus(trip._id, 'completed')}
                                    >
                                      Complete Trip
                                    </Button>
                                    <Button
                                      colorScheme="blue"
                                      variant="outline"
                                      size="lg"
                                      onClick={() => {
                                        setActiveDriveTrip(trip);
                                        setActiveTabIndex(1); // Switch to Drive Mode tab
                                      }}
                                      leftIcon={<Box as={MapIcon} w={5} h={5} />}
                                    >
                                      Enter Drive Mode
                                    </Button>
                                  </>
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

            {/* Drive Mode Tab */}
            <TabPanel px={0}>
              <DriveMode 
                trip={activeDriveTrip}
                onComplete={async (tripData) => {
                  if (activeDriveTrip) {
                    await updateTripStatus(activeDriveTrip._id, 'completed', tripData);
                    setActiveDriveTrip(null);
                    // Add delay before tab switch to prevent navigation flooding
                    setTimeout(() => {
                      setActiveTabIndex(0);
                    }, 100);
                  }
                }}
                onCancel={async (tripData) => {
                  if (activeDriveTrip) {
                    await updateTripStatus(activeDriveTrip._id, 'cancelled', tripData);
                    setActiveDriveTrip(null);
                    // Add delay before tab switch to prevent navigation flooding
                    setTimeout(() => {
                      setActiveTabIndex(0);
                    }, 100);
                  }
                }}
              />
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
    </Box>
  );
};

export default DriverDashboard;