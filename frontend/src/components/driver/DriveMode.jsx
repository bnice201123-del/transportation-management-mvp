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
  NavigationIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import TripMap from '../maps/TripMap';

const DriveMode = ({ trip, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [_currentLocation, _setCurrentLocation] = useState(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get current location (for future use with live tracking)
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          _setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
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

  const handleCompleteTrip = async () => {
    setLoading(true);
    try {
      await onComplete();
      toast({
        title: 'Trip Completed',
        description: 'The trip has been marked as completed successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete trip',
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
      await onCancel();
      toast({
        title: 'Trip Cancelled',
        description: 'The trip has been cancelled.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel trip',
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

  const openNavigation = () => {
    if (trip?.pickupLocation?.coordinates) {
      const [lng, lat] = trip.pickupLocation.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Navigation Error',
        description: 'Pickup location coordinates not available',
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
    <Box h="calc(100vh - 200px)" display="flex" flexDirection="column">
      {/* Top Section: Map View */}
      <Box 
        flex="1" 
        position="relative" 
        borderRadius="lg" 
        overflow="hidden"
        border="1px solid"
        borderColor={borderColor}
        mb={4}
      >
        <TripMap
          trip={trip}
          height="100%"
          showRoute={true}
          showControls={false}
        />

        {/* Trip Info Overlay */}
        <Box
          position="absolute"
          top={4}
          left={4}
          right={4}
          bg={bgColor}
          p={4}
          borderRadius="lg"
          shadow="lg"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack align="stretch" spacing={2}>
            <Flex justify="space-between" align="center">
              <Heading size="md" color="green.600">
                Active Trip
              </Heading>
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                {trip.status?.toUpperCase()}
              </Badge>
            </Flex>

            <HStack spacing={4} fontSize="sm">
              <HStack>
                <Box as={UserIcon} w={4} h={4} color="gray.600" />
                <Text fontWeight="medium">
                  {trip.rider?.firstName} {trip.rider?.lastName}
                </Text>
              </HStack>
              
              {trip.rider?.phone && (
                <IconButton
                  icon={<PhoneIcon />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={handleCallRider}
                  aria-label="Call rider"
                />
              )}

              <IconButton
                icon={<NavigationIcon />}
                size="sm"
                colorScheme="green"
                variant="ghost"
                onClick={openNavigation}
                aria-label="Open navigation"
              />
            </HStack>

            <HStack spacing={4} fontSize="sm" color="gray.600">
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

            <VStack align="stretch" spacing={1} fontSize="sm">
              <HStack>
                <Box as={MapPinIcon} w={4} h={4} color="green.500" />
                <Text fontWeight="medium">Pickup:</Text>
                <Text color="gray.600">{trip.pickupLocation?.address}</Text>
              </HStack>
              <HStack>
                <Box as={MapPinIcon} w={4} h={4} color="red.500" />
                <Text fontWeight="medium">Dropoff:</Text>
                <Text color="gray.600">{trip.dropoffLocation?.address}</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Box>

      {/* Bottom Section: Action Buttons */}
      <Box 
        bg={bgColor} 
        p={6} 
        borderRadius="lg" 
        border="1px solid"
        borderColor={borderColor}
        shadow="md"
      >
        <HStack spacing={4} justify="center">
          <Button
            leftIcon={<Box as={CheckCircleIcon} w={5} h={5} />}
            colorScheme="green"
            size="lg"
            px={8}
            onClick={handleCompleteTrip}
            isLoading={loading}
            loadingText="Completing..."
            flex={1}
            maxW="300px"
            height="60px"
            fontSize="lg"
            fontWeight="bold"
          >
            Complete Trip
          </Button>

          <Button
            leftIcon={<Box as={XCircleIcon} w={5} h={5} />}
            colorScheme="red"
            variant="outline"
            size="lg"
            px={8}
            onClick={handleCancelTrip}
            isLoading={loading}
            loadingText="Cancelling..."
            flex={1}
            maxW="300px"
            height="60px"
            fontSize="lg"
            fontWeight="bold"
          >
            Cancel Trip
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default DriveMode;
