import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import {
  PhoneIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  SignalIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinIconSolid,
  ClockIcon as ClockIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const DriverLocationTracking = () => {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [trackingAccuracy, setTrackingAccuracy] = useState(null);
  const [batteryOptimized, setBatteryOptimized] = useState(true);
  
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Responsive design variables
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const cardSpacing = { base: 4, md: 6 };

  // Check if user is a driver
  const isDriver = user?.role === 'driver';

  // Check location permission status
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return 'denied';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      permission.onchange = () => {
        setLocationPermission(permission.state);
      };
      
      return permission.state;
    } catch (error) {
      console.log('Permission API not supported, will use fallback');
      return 'prompt';
    }
  }, []);

  // Update driver location on backend
  const updateDriverLocation = useCallback(async (position) => {
    if (!isDriver || !user?._id) return;

    try {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        heading: position.coords.heading,
        speed: position.coords.speed
      };

      await axios.put(`/api/users/${user._id}/location`, locationData);
      setCurrentLocation(locationData);
      setLastUpdate(new Date());
      setTrackingAccuracy(position.coords.accuracy);
      
      console.log('Location updated:', locationData);
    } catch (error) {
      console.error('Failed to update location:', error);
      toast({
        title: 'Location Update Failed',
        description: 'Unable to send location to server. Check your connection.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [isDriver, user?._id, toast]);

  // Handle location errors
  const handleLocationError = useCallback((error) => {
    let errorMessage = 'Unknown location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        setLocationPermission('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }
    
    console.error('Location error:', errorMessage);
    toast({
      title: 'Location Error',
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    
    setTrackingEnabled(false);
  }, [toast]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your device does not support location services',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const permission = await checkLocationPermission();
    
    if (permission === 'denied') {
      onOpen(); // Show permission help modal
      return;
    }

    const options = {
      enableHighAccuracy: !batteryOptimized,
      timeout: 10000,
      maximumAge: batteryOptimized ? 60000 : 30000 // Cache location for 1 minute in battery mode
    };

    try {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        updateDriverLocation,
        handleLocationError,
        options
      );

      // Start watching position
      const id = navigator.geolocation.watchPosition(
        updateDriverLocation,
        handleLocationError,
        options
      );

      setWatchId(id);
      setTrackingEnabled(true);
      
      toast({
        title: 'Location Tracking Started',
        description: 'Your location is now being shared while the app is active',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      handleLocationError(error);
    }
  }, [checkLocationPermission, onOpen, batteryOptimized, updateDriverLocation, handleLocationError, toast]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setTrackingEnabled(false);
    setCurrentLocation(null);
    setLastUpdate(null);
    
    toast({
      title: 'Location Tracking Stopped',
      description: 'Your location is no longer being shared',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [watchId, toast]);

  // Toggle tracking
  const handleTrackingToggle = () => {
    if (trackingEnabled) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Check permission on component mount
  useEffect(() => {
    checkLocationPermission();
    
    // Cleanup on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [checkLocationPermission, watchId]);

  // Auto-stop tracking when user logs out or app becomes inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && trackingEnabled) {
        console.log('App became inactive, maintaining tracking...');
        // In a real app, you might want to reduce update frequency here
      }
    };

    const handleBeforeUnload = () => {
      if (trackingEnabled) {
        // Send final location update before page unload
        navigator.sendBeacon(
          `/api/users/${user?._id}/location/offline`,
          JSON.stringify({ offline: true })
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackingEnabled, user?._id]);

  if (!isDriver) {
    return (
      <Container maxW="container.md" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        <Alert status="info" borderRadius="md" flexDirection={{ base: "column", md: "row" }}>
          <AlertIcon />
          <Box textAlign={{ base: "center", md: "left" }}>
            <AlertTitle fontSize={{ base: "md", md: "lg" }}>Driver Access Required</AlertTitle>
            <AlertDescription fontSize={{ base: "sm", md: "md" }} mt={{ base: 2, md: 0 }}>
              Location tracking is only available for drivers. This feature allows drivers to share their 
              location while logged into the app for dispatch coordination and trip management.
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size={{ base: "md", md: "lg" }} color="blue.600" mb={2}>
            📍 Driver Location Tracking
          </Heading>
          <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
            Share your location while using the app for better dispatch coordination
          </Text>
        </Box>

        {/* Permission Status */}
        <Card>
          <CardHeader>
            <Heading size={{ base: "sm", md: "md" }}>Permission Status</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                <HStack minW="0">
                  <Box 
                    as={locationPermission === 'granted' ? MapPinIconSolid : MapPinIcon} 
                    w={4} 
                    h={4} 
                    color={locationPermission === 'granted' ? 'green.500' : 'red.500'} 
                  />
                  <Text fontSize={{ base: "sm", md: "md" }}>Location Access:</Text>
                </HStack>
                <Badge 
                  colorScheme={
                    locationPermission === 'granted' ? 'green' : 
                    locationPermission === 'denied' ? 'red' : 'yellow'
                  }
                  fontSize={{ base: "xs", md: "sm" }}
                  mt={{ base: 1, sm: 0 }}
                >
                  {locationPermission.toUpperCase()}
                </Badge>
              </HStack>

              {locationPermission === 'denied' && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Location Access Denied</AlertTitle>
                    <AlertDescription>
                      Please enable location access in your browser settings to use tracking features.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Tracking Controls */}
        <Card>
          <CardHeader>
            <Heading size={{ base: "sm", md: "md" }}>Tracking Controls</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center" flexDirection={{ base: "column", sm: "row" }}>
                <FormLabel 
                  htmlFor="location-tracking" 
                  mb={{ base: 2, sm: 0 }}
                  fontSize={{ base: "sm", md: "md" }}
                  textAlign={{ base: "center", sm: "left" }}
                  flex="1"
                >
                  Enable Location Tracking
                </FormLabel>
                <Switch
                  id="location-tracking"
                  isChecked={trackingEnabled}
                  onChange={handleTrackingToggle}
                  colorScheme="blue"
                  isDisabled={locationPermission === 'denied'}
                  size={{ base: "md", md: "lg" }}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center" flexDirection={{ base: "column", sm: "row" }}>
                <FormLabel 
                  htmlFor="battery-optimized" 
                  mb={{ base: 2, sm: 0 }}
                  fontSize={{ base: "sm", md: "md" }}
                  textAlign={{ base: "center", sm: "left" }}
                  flex="1"
                >
                  Battery Optimized Mode
                </FormLabel>
                <Switch
                  id="battery-optimized"
                  isChecked={batteryOptimized}
                  onChange={(e) => setBatteryOptimized(e.target.checked)}
                  colorScheme="green"
                  size={{ base: "md", md: "lg" }}
                />
              </FormControl>

              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" textAlign={{ base: "center", md: "left" }}>
                Battery mode reduces update frequency and accuracy to save power.
                Disable for more precise tracking during active trips.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Current Status */}
        {trackingEnabled && (
          <Card>
            <CardHeader>
              <Heading size={{ base: "sm", md: "md" }}>Current Status</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                  <HStack minW="0">
                    <Box as={SignalIcon} w={4} h={4} color="green.500" />
                    <Text fontSize={{ base: "sm", md: "md" }}>Tracking Status:</Text>
                  </HStack>
                  <Badge colorScheme="green" mt={{ base: 1, sm: 0 }}>ACTIVE</Badge>
                </HStack>

                {currentLocation && (
                  <>
                    <VStack spacing={2} align="stretch">
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">Coordinates:</Text>
                      <Text 
                        fontFamily="mono" 
                        fontSize={{ base: "xs", md: "sm" }}
                        wordBreak="break-all"
                        textAlign="center"
                        bg="gray.50"
                        p={2}
                        borderRadius="md"
                      >
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </Text>
                    </VStack>

                    {trackingAccuracy && (
                      <HStack justify="space-between">
                        <Text fontSize={{ base: "sm", md: "md" }}>Accuracy:</Text>
                        <Text fontSize={{ base: "sm", md: "md" }}>{Math.round(trackingAccuracy)} meters</Text>
                      </HStack>
                    )}
                  </>
                )}

                {lastUpdate && (
                  <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                    <HStack minW="0">
                      <Box as={ClockIconSolid} w={4} h={4} />
                      <Text fontSize={{ base: "sm", md: "md" }}>Last Update:</Text>
                    </HStack>
                    <Text fontSize={{ base: "xs", md: "sm" }} mt={{ base: 1, sm: 0 }}>
                      {lastUpdate.toLocaleTimeString()}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <Heading size={{ base: "sm", md: "md" }}>How It Works</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="start">
              <HStack align="flex-start" spacing={{ base: 2, md: 3 }}>
                <Box as={DevicePhoneMobileIcon} w={4} h={4} mt={1} flexShrink={0} />
                <Text fontSize={{ base: "sm", md: "md" }}>
                  <strong>Phone-based Tracking:</strong> Your location is tracked using your mobile device's GPS
                </Text>
              </HStack>
              <HStack align="flex-start" spacing={{ base: 2, md: 3 }}>
                <Box as={ClockIconSolid} w={4} h={4} mt={1} flexShrink={0} />
                <Text fontSize={{ base: "sm", md: "md" }}>
                  <strong>Session-based:</strong> Tracking only occurs while you're logged into the app
                </Text>
              </HStack>
              <HStack align="flex-start" spacing={{ base: 2, md: 3 }}>
                <Box as={ExclamationTriangleIconSolid} w={4} h={4} mt={1} flexShrink={0} />
                <Text fontSize={{ base: "sm", md: "md" }}>
                  <strong>Privacy:</strong> Location sharing stops when you log out or close the app
                </Text>
              </HStack>
              <Divider />
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" lineHeight="1.5">
                Your location data helps dispatchers assign trips efficiently and provides 
                real-time updates to passengers about pickup times. All location data is 
                secured and only used for operational purposes.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Permission Help Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }}>
          <ModalOverlay />
          <ModalContent m={{ base: 0, md: 4 }} maxH={{ base: "100vh", md: "auto" }}>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }}>Enable Location Access</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="start">
                <Text fontSize={{ base: "sm", md: "md" }}>
                  To use location tracking, please enable location access in your browser:
                </Text>
                <Box pl={{ base: 2, md: 4 }}>
                  <Text fontSize={{ base: "sm", md: "md" }}><strong>Chrome/Edge:</strong></Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" lineHeight="1.5">
                    1. Click the location icon in the address bar<br/>
                    2. Select "Allow" or "Always allow"<br/>
                    3. Refresh the page
                  </Text>
                </Box>
                <Box pl={{ base: 2, md: 4 }}>
                  <Text fontSize={{ base: "sm", md: "md" }}><strong>Firefox:</strong></Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" lineHeight="1.5">
                    1. Click the shield icon in the address bar<br/>
                    2. Click "Enable" next to location<br/>
                    3. Refresh the page
                  </Text>
                </Box>
                <Box pl={{ base: 2, md: 4 }}>
                  <Text fontSize={{ base: "sm", md: "md" }}><strong>Safari:</strong></Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" lineHeight="1.5">
                    1. Go to Safari → Preferences → Websites<br/>
                    2. Select "Location" in the sidebar<br/>
                    3. Set this website to "Allow"
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="blue" 
                onClick={onClose}
                w={{ base: "full", md: "auto" }}
                size={{ base: "md", md: "md" }}
              >
                Got it
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default DriverLocationTracking;