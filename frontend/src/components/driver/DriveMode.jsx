import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  useToast,
  Flex,
  Heading,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const DriveMode = ({ trip, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tripStartTime] = useState(new Date());
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Track location and calculate distance traveled
  useEffect(() => {
    if (navigator.geolocation) {
      let lastPosition = null;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading
          };
          
          setCurrentLocation(newLocation);

          // Calculate distance from last position
          if (lastPosition) {
            const distance = calculateDistance(
              lastPosition.lat,
              lastPosition.lng,
              newLocation.lat,
              newLocation.lng
            );
            setDistanceTraveled(prev => prev + distance);
          }

          lastPosition = newLocation;
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
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [toast]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  };

  // Collect comprehensive trip data
  const collectTripData = () => {
    const tripEndTime = new Date();
    const durationMs = tripEndTime - tripStartTime;
    const durationMinutes = Math.round(durationMs / 60000);

    return {
      completionTime: tripEndTime.toISOString(),
      startTime: tripStartTime.toISOString(),
      durationMinutes,
      currentLocation: currentLocation ? {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        accuracy: currentLocation.accuracy,
        timestamp: currentLocation.timestamp.toISOString()
      } : null,
      distanceTraveled: parseFloat(distanceTraveled.toFixed(2)), // miles
      averageSpeed: currentLocation?.speed || null,
      finalHeading: currentLocation?.heading || null,
      tripMetrics: {
        pickupLocation: trip.pickupLocation,
        dropoffLocation: trip.dropoffLocation,
        scheduledTime: trip.scheduledTime,
        tripType: trip.tripType,
        riderInfo: {
          riderId: trip.rider?._id,
          riderName: `${trip.rider?.firstName} ${trip.rider?.lastName}`
        }
      }
    };
  };

  const handleCompleteTrip = async () => {
    setLoading(true);
    try {
      const tripData = collectTripData();
      
      console.log('Completing trip with data:', tripData);
      
      await onComplete(tripData);
      
      toast({
        title: 'Trip Completed',
        description: `Trip completed successfully. Duration: ${tripData.durationMinutes} min, Distance: ${tripData.distanceTraveled} mi`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error completing trip:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to complete trip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMapsNavigation = () => {
    if (!trip?.pickupLocation || !trip?.dropoffLocation) {
      toast({
        title: 'Error',
        description: 'Trip locations not available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Helper function to get coordinates from location object
    const getCoordinates = (location) => {
      if (location.coordinates && Array.isArray(location.coordinates)) {
        return { lat: location.coordinates[1], lng: location.coordinates[0] };
      } else if (location.lat && location.lng) {
        return { lat: location.lat, lng: location.lng };
      }
      return null;
    };

    // Helper function to format location for Google Maps URL
    const formatLocationForURL = (location) => {
      const coords = getCoordinates(location);
      if (coords) {
        return `${coords.lat},${coords.lng}`;
      }
      if (location.address) {
        return encodeURIComponent(location.address);
      }
      return null;
    };

    const pickupCoords = getCoordinates(trip.pickupLocation);
    const dropoffCoords = getCoordinates(trip.dropoffLocation);

    if (!pickupCoords || !dropoffCoords) {
      toast({
        title: 'Error',
        description: 'Could not determine trip coordinates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Calculate distance from current location to pickup location
    let distanceToPickup = null;
    let useThreeTripChain = false;

    if (currentLocation) {
      distanceToPickup = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        pickupCoords.lat,
        pickupCoords.lng
      );
      
      // If driver is more than 0.25 miles away, use 3-trip chain
      useThreeTripChain = distanceToPickup > 0.25;
    }

    let url;
    let tripChainDescription;

    if (useThreeTripChain) {
      // 3-Trip Chain: Current Location → Pickup → Dropoff
      const pickup = formatLocationForURL(trip.pickupLocation);
      const dropoff = formatLocationForURL(trip.dropoffLocation);
      
      url = `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${dropoff}&waypoints=${pickup}&travelmode=driving`;
      
      tripChainDescription = `3-stop route: Current Location (${distanceToPickup.toFixed(2)} mi away) → Pickup → Dropoff`;
      
      toast({
        title: 'Opening Navigation',
        description: tripChainDescription,
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } else {
      // 2-Trip Chain: Pickup → Dropoff (driver is close to or at pickup)
      const pickup = formatLocationForURL(trip.pickupLocation);
      const dropoff = formatLocationForURL(trip.dropoffLocation);
      
      url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
      
      if (distanceToPickup !== null) {
        tripChainDescription = `2-stop route: Pickup (${distanceToPickup.toFixed(2)} mi away) → Dropoff`;
      } else {
        tripChainDescription = '2-stop route: Pickup → Dropoff';
      }
      
      toast({
        title: 'Opening Navigation',
        description: tripChainDescription,
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    }

    // Open Google Maps in new tab
    window.open(url, '_blank');
    
    console.log('Navigation Details:', {
      tripChainType: useThreeTripChain ? '3-Trip Chain' : '2-Trip Chain',
      distanceToPickup: distanceToPickup ? `${distanceToPickup.toFixed(2)} miles` : 'Unknown',
      currentLocation: currentLocation,
      pickupLocation: pickupCoords,
      dropoffLocation: dropoffCoords,
      url: url
    });
  };

  const handleCancelTrip = async () => {
    setLoading(true);
    try {
      const tripData = collectTripData();
      
      console.log('Cancelling trip with data:', tripData);
      
      await onCancel({
        ...tripData,
        cancellationReason: 'Driver cancelled',
        status: 'cancelled'
      });
      
      toast({
        title: 'Trip Cancelled',
        description: `Trip cancelled. Duration: ${tripData.durationMinutes} min, Distance: ${tripData.distanceTraveled} mi`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error cancelling trip:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to cancel trip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallRider = () => {
    if (trip?.rider?.phone) {
      window.open(`tel:${trip.rider.phone}`);
    } else {
      toast({
        title: 'No Phone Number',
        description: 'Rider phone number is not available',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  if (!trip) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="md" variant="subtle">
          <AlertIcon />
          <Box>
            <AlertTitle mb={1}>Select a Trip to Start</AlertTitle>
            <AlertDescription fontSize="sm">
              Click the "Drive" button on any trip in the Active Trips section above to begin driving mode.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      h={{ base: "calc(100vh - 150px)", md: "calc(100vh - 200px)" }} 
      display="flex" 
      flexDirection="column"
      px={{ base: 2, md: 0 }}
    >
      {/* Trip Info Card */}
      <Box
        bg={bgColor}
        p={{ base: 3, md: 4 }}
        borderRadius={{ base: "md", md: "lg" }}
        shadow="lg"
        border="1px solid"
        borderColor={borderColor}
        mb={{ base: 2, md: 4 }}
      >
        <VStack align="stretch" spacing={{ base: 1, md: 2 }}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Heading size={{ base: "sm", md: "md" }} color="green.600">
              Active Trip
            </Heading>
            <Badge colorScheme="green" fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 3 }} py={1}>
              {trip.status?.toUpperCase()}
            </Badge>
          </Flex>

          <HStack spacing={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} flexWrap="wrap">
            <HStack minW={{ base: "auto", md: "150px" }}>
              <Box as={UserIcon} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} color="gray.600" />
              <Text fontWeight="medium" noOfLines={1}>
                {trip.rider?.firstName} {trip.rider?.lastName}
              </Text>
            </HStack>
            
            <HStack>
              {trip.rider?.phone && (
                <IconButton
                  icon={<PhoneIcon />}
                  size={{ base: "xs", md: "sm" }}
                  colorScheme="blue"
                  variant="ghost"
                  onClick={handleCallRider}
                  aria-label="Call rider"
                />
              )}
              <IconButton
                icon={<Box as={ArrowTopRightOnSquareIcon} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />}
                size={{ base: "xs", md: "sm" }}
                colorScheme="green"
                variant="solid"
                onClick={openGoogleMapsNavigation}
                aria-label="Open Google Maps Navigation"
                _hover={{
                  bg: 'green.600',
                  transform: 'scale(1.1)'
                }}
                transition="all 0.2s"
              />
            </HStack>
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} color="gray.600" display={{ base: "none", md: "flex" }}>
            <HStack>
              <Box as={ClockIcon} w={4} h={4} />
              <Text>
                {new Date(trip.scheduledTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </Text>
            </HStack>
          </HStack>

          <VStack align="stretch" spacing={1} fontSize={{ base: "xs", md: "sm" }} display={{ base: "none", sm: "flex" }}>
            <HStack>
              <Box as={MapPinIcon} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} color="green.500" />
              <Text fontWeight="medium">Pickup:</Text>
              <Text color="gray.600" noOfLines={1}>{trip.pickupLocation?.address}</Text>
            </HStack>
            <HStack>
              <Box as={MapPinIcon} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} color="red.500" />
              <Text fontWeight="medium">Dropoff:</Text>
              <Text color="gray.600" noOfLines={1}>{trip.dropoffLocation?.address}</Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      {/* Bottom Section: Action Buttons - Responsive */}
      <Box 
        bg={bgColor} 
        p={{ base: 3, md: 6 }}
        borderRadius={{ base: "md", md: "lg" }}
        border="1px solid"
        borderColor={borderColor}
        shadow="md"
      >
        <Flex 
          gap={{ base: 2, md: 4 }} 
          justify="center"
          direction={{ base: "column", sm: "row" }}
          align="stretch"
        >
          <Button
            leftIcon={<Box as={CheckCircleIcon} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />}
            colorScheme="green"
            size={{ base: "md", md: "lg" }}
            px={{ base: 4, md: 8 }}
            onClick={handleCompleteTrip}
            isLoading={loading}
            loadingText="Completing..."
            flex={1}
            maxW={{ base: "100%", md: "300px" }}
            height={{ base: "50px", md: "60px" }}
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="bold"
          >
            Complete Trip
          </Button>

          <Button
            leftIcon={<Box as={XCircleIcon} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />}
            colorScheme="red"
            variant="outline"
            size={{ base: "md", md: "lg" }}
            px={{ base: 4, md: 8 }}
            onClick={handleCancelTrip}
            isLoading={loading}
            loadingText="Cancelling..."
            flex={1}
            maxW={{ base: "100%", md: "300px" }}
            height={{ base: "50px", md: "60px" }}
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="bold"
          >
            Cancel Trip
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DriveMode;
