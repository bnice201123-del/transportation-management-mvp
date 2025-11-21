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
  MapPinIcon
} from '@heroicons/react/24/outline';
import TripMap from '../maps/TripMap';

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
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertTitle>No Active Trip</AlertTitle>
          <AlertDescription>
            You don't have an active trip. Select a trip from the Active Trips tab to start driving.
          </AlertDescription>
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
      {/* Top Section: Map View */}
      <Box 
        flex="1" 
        position="relative" 
        borderRadius={{ base: "md", md: "lg" }}
        overflow="hidden"
        border="1px solid"
        borderColor={borderColor}
        mb={{ base: 2, md: 4 }}
      >
        <TripMap
          trip={trip}
          height="100%"
          showRoute={true}
          showControls={false}
        />

        {/* Trip Info Overlay - Responsive */}
        <Box
          position="absolute"
          top={{ base: 2, md: 4 }}
          left={{ base: 2, md: 4 }}
          right={{ base: 2, md: 4 }}
          bg={bgColor}
          p={{ base: 3, md: 4 }}
          borderRadius={{ base: "md", md: "lg" }}
          shadow="lg"
          border="1px solid"
          borderColor={borderColor}
          maxW={{ base: "100%", md: "500px" }}
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
