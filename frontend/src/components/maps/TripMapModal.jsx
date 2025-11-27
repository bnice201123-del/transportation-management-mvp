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
  FaExclamationTriangle,
  FaMapMarkedAlt
} from 'react-icons/fa';
import GoogleMap from './GoogleMap';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';

const TripMapModal = ({ isOpen, onClose, trip }) => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeService, setRouteService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const toast = useToast();

  // Initialize Google Maps services
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadGoogleMapsAPI();
        if (window.google && window.google.maps) {
          setRouteService(new window.google.maps.DirectionsService());
          
          // Create a custom DirectionsRenderer with enhanced styling
          const renderer = new window.google.maps.DirectionsRenderer({
            suppressMarkers: false,  // Show default markers
            draggable: false,
            polylineOptions: {
              strokeColor: '#2563EB',  // Bold blue color
              strokeOpacity: 0.95,
              strokeWeight: 8,  // Extra thick line
              zIndex: 100,
              geodesic: true  // Follow Earth's curvature for accuracy
            },
            markerOptions: {
              zIndex: 200,
              animation: window.google.maps.Animation.DROP
            }
          });
          
          setDirectionsRenderer(renderer);
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
            // Create a complete directions result with just this route
            directions: {
              ...result,
              routes: [route]
            },
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

  // Update directions renderer when selected route changes
  useEffect(() => {
    if (directionsRenderer && routes.length > 0 && routes[selectedRoute]) {
      const selectedRouteData = routes[selectedRoute];
      if (selectedRouteData && selectedRouteData.directions) {
        // Use the complete directions result object from the API
        directionsRenderer.setDirections(selectedRouteData.directions);
      }
    }
  }, [selectedRoute, routes, directionsRenderer]);

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

  // Helper function to safely get rider name
  const getRiderName = (trip) => {
    if (!trip) return 'Unknown';
    if (typeof trip.riderName === 'string') return trip.riderName;
    if (trip.riderName && typeof trip.riderName === 'object') {
      const rider = trip.riderName;
      return `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || rider.email || 'Unknown';
    }
    return 'Unknown';
  };

  // Helper function to safely get driver name
  const getDriverName = (trip) => {
    if (!trip || !trip.assignedDriver) return 'Unassigned';
    if (typeof trip.assignedDriver === 'string') return trip.assignedDriver;
    if (typeof trip.assignedDriver === 'object') {
      const driver = trip.assignedDriver;
      return `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email || 'Unassigned';
    }
    return 'Unassigned';
  };

  // Function to open in Google Maps
  const openInGoogleMaps = () => {
    const origin = encodeURIComponent(trip.pickupLocation?.address || '');
    const destination = encodeURIComponent(trip.dropoffLocation?.address || '');
    window.open(`https://www.google.com/maps/dir/${origin}/${destination}`, '_blank');
  };

  if (!trip) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", lg: "6xl" }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH={{ base: "100vh", lg: "90vh" }} m={{ base: 0, lg: 4 }}>
        <ModalHeader>
          <HStack justify="space-between" w="full" pr={8}>
            <HStack>
              <FaRoute color="blue" />
              <VStack align="start" spacing={0}>
                <Text>{getRiderName(trip)}'s Trip Route</Text>
                <Text fontSize="sm" color="gray.600" fontWeight="normal">
                  {new Date(trip.scheduledDate).toLocaleDateString()} at {formatTime(trip.scheduledTime)}
                </Text>
              </VStack>
              <Badge colorScheme={getStatusColor(trip.status)} ml={2}>
                {trip.status}
              </Badge>
            </HStack>
            <Button
              leftIcon={<FaMapMarkedAlt />}
              size="md"
              bg="linear-gradient(135deg, #4285F4 0%, #34A853 100%)"
              color="white"
              onClick={openInGoogleMaps}
              display={{ base: 'none', md: 'flex' }}
              borderRadius="full"
              px={6}
              fontWeight="semibold"
              fontSize="sm"
              boxShadow="md"
              _hover={{
                bg: 'linear-gradient(135deg, #3367D6 0%, #2D8F47 100%)',
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              _active={{
                transform: 'translateY(0)',
                boxShadow: 'md'
              }}
              transition="all 0.2s"
            >
              View Route in Google Maps
            </Button>
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
                    directionsResult={routes[selectedRoute]?.directions}
                    directionsRenderer={directionsRenderer}
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
                <Card size="sm" borderWidth="2px" borderColor="blue.200">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <HStack>
                          <FaUser color="blue" />
                          <Text fontWeight="bold">{getRiderName(trip)}</Text>
                        </HStack>
                        <Badge colorScheme={getStatusColor(trip.status)} fontSize="xs">
                          {trip.status}
                        </Badge>
                      </HStack>

                      {/* Distance Display - Prominent */}
                      {routes.length > 0 && routes[selectedRoute] && (
                        <Box 
                          w="full" 
                          p={3} 
                          bg="blue.50" 
                          borderRadius="md" 
                          borderWidth="2px" 
                          borderColor="blue.300"
                        >
                          <HStack justify="center" spacing={4}>
                            <VStack spacing={0}>
                              <HStack>
                                <FaRoute color="blue" size={16} />
                                <Text fontSize="lg" fontWeight="bold" color="blue.700">
                                  {routes[selectedRoute].distance}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.600">
                                Total Distance
                              </Text>
                            </VStack>
                            <Divider orientation="vertical" h="40px" />
                            <VStack spacing={0}>
                              <HStack>
                                <FaClock color="green" size={16} />
                                <Text fontSize="lg" fontWeight="bold" color="green.700">
                                  {routes[selectedRoute].duration}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.600">
                                Est. Time
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      )}
                      
                      <Divider />

                      <VStack align="start" spacing={2} w="full">
                        <HStack w="full">
                          <Box 
                            w={4} 
                            h={4} 
                            bg="green.500" 
                            borderRadius="full" 
                            border="3px solid white"
                            boxShadow="0 0 0 2px green.500"
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="xs" color="gray.600" fontWeight="bold">
                              PICKUP
                            </Text>
                            <Text fontSize="sm" noOfLines={2}>
                              {trip.pickupLocation?.address}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <Box ml={2} h="30px" w="3px" bg="blue.400" borderRadius="full" />
                        
                        <HStack w="full">
                          <Box 
                            w={4} 
                            h={4} 
                            bg="red.500" 
                            borderRadius="full" 
                            border="3px solid white"
                            boxShadow="0 0 0 2px red.500"
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="xs" color="gray.600" fontWeight="bold">
                              DROP-OFF
                            </Text>
                            <Text fontSize="sm" noOfLines={2}>
                              {trip.dropoffLocation?.address}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>

                      <Divider />

                      {trip.assignedDriver && (
                        <HStack>
                          <FaCar color="blue" size={12} />
                          <Text fontSize="sm">
                            Driver: {getDriverName(trip)}
                          </Text>
                        </HStack>
                      )}

                      {trip.riderPhone && (
                        <HStack>
                          <FaClock color="gray" size={12} />
                          <Text fontSize="sm">
                            Contact: {trip.riderPhone}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Route Options */}
                {routes.length > 0 && (
                  <Card size="sm">
                    <CardBody p={3}>
                      <VStack align="start" spacing={3}>
                        <HStack justify="space-between" w="full">
                          <HStack spacing={2}>
                            <FaRoad color="orange" size={14} />
                            <Text fontWeight="bold" fontSize="sm">Route Options</Text>
                          </HStack>
                          <Tooltip label="Recalculate routes">
                            <IconButton
                              icon={<RepeatIcon />}
                              size="xs"
                              variant="ghost"
                              onClick={calculateRoutes}
                              aria-label="Recalculate routes"
                            />
                          </Tooltip>
                        </HStack>

                        {/* Compact Route Cards */}
                        <VStack spacing={2} w="full">
                          {routes.map((route, index) => (
                            <Box
                              key={route.id}
                              w="full"
                              p={3}
                              borderRadius="lg"
                              borderWidth="2px"
                              borderColor={selectedRoute === index ? 'blue.400' : 'gray.200'}
                              bg={selectedRoute === index ? 'blue.50' : 'white'}
                              cursor="pointer"
                              onClick={() => setSelectedRoute(index)}
                              transition="all 0.2s"
                              _hover={{
                                borderColor: 'blue.300',
                                transform: 'translateY(-2px)',
                                shadow: 'md'
                              }}
                            >
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack>
                                    <Badge
                                      colorScheme={getRouteColor(index)}
                                      fontSize="xs"
                                      px={2}
                                      py={0.5}
                                      borderRadius="full"
                                    >
                                      {route.type}
                                    </Badge>
                                    {selectedRoute === index && (
                                      <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                        Selected
                                      </Badge>
                                    )}
                                  </HStack>
                                  
                                  <HStack spacing={3} fontSize="xs" color="gray.700">
                                    <HStack spacing={1}>
                                      <FaRoute size={10} color="#4299E1" />
                                      <Text fontWeight="semibold">{route.distance}</Text>
                                    </HStack>
                                    <Text color="gray.400">•</Text>
                                    <HStack spacing={1}>
                                      <FaClock size={10} color="#48BB78" />
                                      <Text fontWeight="semibold">{route.duration}</Text>
                                    </HStack>
                                    <Text color="gray.400">•</Text>
                                    <HStack spacing={1}>
                                      <FaDollarSign size={10} color="#38A169" />
                                      <Text fontWeight="semibold">${estimatedFare(route.durationValue / 60)}</Text>
                                    </HStack>
                                  </HStack>

                                  {route.summary && (
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                      via {route.summary}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>

                              {route.warnings && route.warnings.length > 0 && (
                                <Alert status="warning" size="xs" mt={2} py={1} borderRadius="md">
                                  <AlertIcon boxSize={3} />
                                  <Text fontSize="xs">
                                    {route.warnings[0]}
                                  </Text>
                                </Alert>
                              )}
                            </Box>
                          ))}
                        </VStack>

                        {/* Detailed info for selected route */}
                        {routes[selectedRoute]?.route?.legs[0]?.steps && (
                          <Box w="full" mt={2}>
                            <Divider mb={3} />
                            <Text fontWeight="semibold" fontSize="sm" mb={2} color="gray.700">
                              Turn-by-Turn Directions
                            </Text>
                            <VStack align="start" spacing={1.5} maxH="180px" overflowY="auto" pr={1}>
                              {routes[selectedRoute].route.legs[0].steps.map((step, idx) => (
                                <HStack 
                                  key={idx} 
                                  align="start" 
                                  w="full" 
                                  p={2} 
                                  bg="gray.50" 
                                  borderRadius="md"
                                  spacing={2}
                                >
                                  <Badge 
                                    colorScheme="blue" 
                                    minW="20px" 
                                    h="20px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    borderRadius="full"
                                    fontSize="xs"
                                  >
                                    {idx + 1}
                                  </Badge>
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Text 
                                      fontSize="xs" 
                                      dangerouslySetInnerHTML={{ 
                                        __html: step.instructions 
                                      }}
                                    />
                                    <Text fontSize="xs" color="gray.500">
                                      {step.distance.text} • {step.duration.text}
                                    </Text>
                                  </VStack>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
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

        <ModalFooter flexDirection={{ base: 'column', md: 'row' }} gap={3} pt={4}>
          <Button
            leftIcon={<FaMapMarkedAlt />}
            bg="linear-gradient(135deg, #4285F4 0%, #34A853 100%)"
            color="white"
            onClick={openInGoogleMaps}
            w={{ base: 'full', md: 'auto' }}
            flex={{ base: 1, md: 0 }}
            borderRadius="full"
            px={6}
            h="48px"
            fontWeight="semibold"
            fontSize={{ base: 'md', md: 'sm' }}
            boxShadow="md"
            _hover={{
              bg: 'linear-gradient(135deg, #3367D6 0%, #2D8F47 100%)',
              transform: 'translateY(-2px)',
              boxShadow: 'lg'
            }}
            _active={{
              transform: 'translateY(0)',
              boxShadow: 'md'
            }}
            transition="all 0.2s"
          >
            View Route in Google Maps
          </Button>
          <Button 
            onClick={onClose}
            w={{ base: 'full', md: 'auto' }}
            variant="outline"
            borderRadius="full"
            h="48px"
            px={6}
            fontWeight="semibold"
            fontSize={{ base: 'md', md: 'sm' }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TripMapModal;