import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Divider,
  Card,
  CardBody,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  IconButton,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import {
  InfoIcon,
  TimeIcon,
  RepeatIcon,
  ViewIcon
} from '@chakra-ui/icons';
import {
  FaRoute,
  FaMapMarkerAlt,
  FaCar,
  FaUser,
  FaClock,
  FaRoad,
  FaDollarSign,
  FaGasPump,
  FaExclamationTriangle
} from 'react-icons/fa';
import GoogleMap from './GoogleMap';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';

const TripMapModal = ({ isOpen, onClose, trip }) => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeService, setRouteService] = useState(null);
  const toast = useToast();

  // Initialize Google Maps services
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadGoogleMapsAPI();
        if (window.google && window.google.maps) {
          setRouteService(new window.google.maps.DirectionsService());
          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast({
          title: 'Map Error',
          description: 'Failed to load Google Maps. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (isOpen && trip) {
      initializeMap();
    }
  }, [isOpen, trip, toast]);

  // Calculate routes when modal opens
  const calculateRoutes = useCallback(async () => {
    if (!routeService || !trip?.pickupLocation?.address || !trip?.dropoffLocation?.address) {
      return;
    }

    setLoading(true);
    setRoutes([]);

    try {
      // Request multiple route alternatives
      const request = {
        origin: trip.pickupLocation.address,
        destination: trip.dropoffLocation.address,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        avoidHighways: false,
        avoidTolls: false
      };

      routeService.route(request, (result, status) => {
        if (status === 'OK') {
          const routeData = result.routes.map((route, index) => ({
            id: index,
            route: route,
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            durationValue: route.legs[0].duration.value,
            summary: route.summary,
            warnings: route.warnings,
            copyrights: route.copyrights,
            fare: route.fare?.text || null,
            type: index === 0 ? 'Recommended' : `Alternative ${index}`
          }));
          
          setRoutes(routeData);
          setSelectedRoute(0);
        } else {
          console.error('Directions request failed due to ' + status);
          toast({
            title: 'Route Error',
            description: 'Failed to calculate routes. Please check the addresses.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error calculating routes:', error);
      setLoading(false);
    }
  }, [routeService, trip, toast]);

  useEffect(() => {
    if (mapLoaded && trip) {
      calculateRoutes();
    }
  }, [mapLoaded, trip, calculateRoutes]);

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

  const getRouteColor = (index) => {
    const colors = ['blue', 'green', 'orange', 'purple', 'red'];
    return colors[index % colors.length];
  };

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

  const estimatedFare = (durationMinutes) => {
    // Simple fare calculation: base fare + time-based rate
    const baseFare = 5.00;
    const perMinuteRate = 0.50;
    return (baseFare + (durationMinutes * perMinuteRate)).toFixed(2);
  };

  if (!trip) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", lg: "6xl" }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH={{ base: "100vh", lg: "90vh" }} m={{ base: 0, lg: 4 }}>
        <ModalHeader>
          <HStack>
            <FaRoute color="blue" />
            <VStack align="start" spacing={0}>
              <Text>{trip.riderName}'s Trip Route</Text>
              <Text fontSize="sm" color="gray.600" fontWeight="normal">
                {new Date(trip.scheduledDate).toLocaleDateString()} at {formatTime(trip.scheduledTime)}
              </Text>
            </VStack>
            <Badge colorScheme={getStatusColor(trip.status)} ml={2}>
              {trip.status}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody p={{ base: 2, lg: 0 }}>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 350px" }} h={{ base: "calc(100vh - 200px)", lg: "70vh" }}>
            {/* Map Section */}
            <GridItem>
              <Box h="full" position="relative">
                {loading && (
                  <Center
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="rgba(255,255,255,0.8)"
                    zIndex={10}
                  >
                    <VStack>
                      <Spinner size="lg" color="blue.500" />
                      <Text>Calculating routes...</Text>
                    </VStack>
                  </Center>
                )}
                
                {mapLoaded && routes.length > 0 ? (
                  <GoogleMap
                    height="100%"
                    width="100%"
                    origin={trip.pickupLocation.address}
                    destination={trip.dropoffLocation.address}
                    directionsResult={routes[selectedRoute]?.route}
                    showRouteInfo={false}
                  />
                ) : (
                  <Center h="full" bg="gray.50">
                    <VStack>
                      <FaRoute size={40} color="gray" />
                      <Text color="gray.600">
                        {mapLoaded ? 'No route data available' : 'Loading map...'}
                      </Text>
                    </VStack>
                  </Center>
                )}
              </Box>
            </GridItem>

            {/* Route Information Panel */}
            <GridItem bg="gray.50" overflowY="auto" display={{ base: routes.length === 0 ? 'none' : 'block', lg: 'block' }}>
              <VStack spacing={4} p={{ base: 3, lg: 4 }} align="stretch">
                {/* Trip Details */}
                <Card size="sm">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <FaUser color="blue" />
                        <Text fontWeight="bold">{trip.riderName}</Text>
                      </HStack>
                      
                      <VStack align="start" spacing={2} w="full">
                        <HStack w="full">
                          <FaMapMarkerAlt color="green" size={12} />
                          <Text fontSize="sm" noOfLines={2}>
                            {trip.pickupLocation?.address}
                          </Text>
                        </HStack>
                        <Box ml={4} h="20px" w="2px" bg="gray.300" />
                        <HStack w="full">
                          <FaMapMarkerAlt color="red" size={12} />
                          <Text fontSize="sm" noOfLines={2}>
                            {trip.dropoffLocation?.address}
                          </Text>
                        </HStack>
                      </VStack>

                      {trip.assignedDriver && (
                        <HStack>
                          <FaCar color="blue" size={12} />
                          <Text fontSize="sm">
                            Driver: {typeof trip.assignedDriver === 'object' 
                              ? (trip.assignedDriver.name || `${trip.assignedDriver.firstName || ''} ${trip.assignedDriver.lastName || ''}`.trim() || trip.assignedDriver.email || 'Unnamed Driver')
                              : trip.assignedDriver
                            }
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Route Options */}
                {routes.length > 0 && (
                  <Card size="sm">
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack>
                          <FaRoad color="orange" />
                          <Text fontWeight="bold">Route Options</Text>
                          <IconButton
                            icon={<RepeatIcon />}
                            size="xs"
                            onClick={calculateRoutes}
                            title="Recalculate routes"
                          />
                        </HStack>

                        <Tabs
                          orientation="vertical"
                          variant="soft-rounded"
                          colorScheme="blue"
                          size="sm"
                          index={selectedRoute}
                          onChange={setSelectedRoute}
                        >
                          <TabList>
                            {routes.map((route, index) => (
                              <Tab key={route.id} justifyContent="start" w="full">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Badge
                                      colorScheme={getRouteColor(index)}
                                      size="sm"
                                    >
                                      {route.type}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs">
                                    {route.distance} • {route.duration}
                                  </Text>
                                </VStack>
                              </Tab>
                            ))}
                          </TabList>

                          <TabPanels>
                            {routes.map((route) => (
                              <TabPanel key={route.id} p={2}>
                                <VStack align="start" spacing={3}>
                                  <Grid templateColumns="repeat(2, 1fr)" gap={2} w="full">
                                    <Stat size="sm">
                                      <StatLabel fontSize="xs">Distance</StatLabel>
                                      <StatNumber fontSize="sm">{route.distance}</StatNumber>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel fontSize="xs">Duration</StatLabel>
                                      <StatNumber fontSize="sm">{route.duration}</StatNumber>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel fontSize="xs">Est. Fare</StatLabel>
                                      <StatNumber fontSize="sm" color="green.600">
                                        ${estimatedFare(route.durationValue / 60)}
                                      </StatNumber>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel fontSize="xs">Route</StatLabel>
                                      <StatNumber fontSize="xs">{route.summary}</StatNumber>
                                    </Stat>
                                  </Grid>

                                  {route.warnings && route.warnings.length > 0 && (
                                    <Alert status="warning" size="sm">
                                      <AlertIcon />
                                      <Text fontSize="xs">
                                        {route.warnings[0]}
                                      </Text>
                                    </Alert>
                                  )}
                                </VStack>
                              </TabPanel>
                            ))}
                          </TabPanels>
                        </Tabs>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Live Updates */}
                <Card size="sm">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <FaClock color="green" />
                        <Text fontWeight="bold" fontSize="sm">Live Updates</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        Last updated: {new Date().toLocaleTimeString()}
                      </Text>
                      <HStack>
                        <Badge colorScheme="green" size="sm">
                          GPS Tracking Active
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Legend */}
                <Card size="sm">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold" fontSize="sm">Map Legend</Text>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Box w={3} h={3} bg="green.500" borderRadius="full" />
                          <Text fontSize="xs">Pickup Location</Text>
                        </HStack>
                        <HStack>
                          <Box w={3} h={3} bg="red.500" borderRadius="full" />
                          <Text fontSize="xs">Dropoff Location</Text>
                        </HStack>
                        <HStack>
                          <Box w={3} h={3} bg="blue.500" borderRadius="full" />
                          <Text fontSize="xs">Selected Route</Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </GridItem>
          </Grid>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              leftIcon={<ViewIcon />}
              size="sm"
              variant="ghost"
              onClick={() => window.open(`https://maps.google.com/maps/dir/${encodeURIComponent(trip.pickupLocation?.address)}/${encodeURIComponent(trip.dropoffLocation?.address)}`, '_blank')}
            >
              Open in Google Maps
            </Button>
            <Button onClick={onClose}>Close</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TripMapModal;