import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import GoogleMap from './GoogleMap';
import useDirections from '../../hooks/useDirections';

const TripMap = ({ 
  trip, 
  height = '500px',
  showRoute = true,
  showControls = true,
  onRouteCalculated 
}) => {
  const [center, setCenter] = useState({ lat: 40.7589, lng: -73.9851 }); // Default NYC
  const [markers, setMarkers] = useState([]);
  const [mapKey, setMapKey] = useState(0);
  
  const {
    directionsRenderer,
    route,
    isLoading: routeLoading,
    error: routeError,
    calculateRoute,
    clearRoute,
    getRouteInfo
  } = useDirections();

  // Update markers when trip changes
  useEffect(() => {
    if (!trip) {
      setMarkers([]);
      return;
    }

    const newMarkers = [];

    // Add pickup marker
    if (trip.pickupLocation && trip.pickupLocation.coordinates) {
      const [lng, lat] = trip.pickupLocation.coordinates;
      newMarkers.push({
        position: { lat, lng },
        title: 'Pickup Location',
        type: 'pickup',
        infoWindow: `
          <div>
            <strong>Pickup Location</strong><br>
            ${trip.pickupLocation.address}<br>
            <small>Rider: ${trip.riderName}</small>
          </div>
        `
      });
      
      // Set map center to pickup location
      setCenter({ lat, lng });
    }

    // Add dropoff marker
    if (trip.dropoffLocation && trip.dropoffLocation.coordinates) {
      const [lng, lat] = trip.dropoffLocation.coordinates;
      newMarkers.push({
        position: { lat, lng },
        title: 'Dropoff Location',
        type: 'dropoff',
        infoWindow: `
          <div>
            <strong>Dropoff Location</strong><br>
            ${trip.dropoffLocation.address}
          </div>
        `
      });
    }

    setMarkers(newMarkers);
    setMapKey(prev => prev + 1); // Force map re-render
  }, [trip]);

  // Calculate route when markers are set and showRoute is true
  useEffect(() => {
    // Only calculate route if directionsRenderer is initialized
    if (!directionsRenderer) {
      return;
    }

    // Validate we have the required data
    if (!showRoute || markers.length !== 2 || !trip?.pickupLocation?.coordinates || !trip?.dropoffLocation?.coordinates) {
      clearRoute();
      return;
    }

    // Check if Google Maps API is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) {
      console.warn('Google Maps API not fully loaded, skipping route calculation');
      return;
    }

    const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
    const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
    
    // Validate coordinates are numbers
    if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number' || 
        typeof dropoffLat !== 'number' || typeof dropoffLng !== 'number') {
      console.warn('Invalid coordinates:', { pickupLat, pickupLng, dropoffLat, dropoffLng });
      return;
    }
    
    calculateRoute(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng }
    );
  }, [markers, showRoute, trip, calculateRoute, clearRoute, directionsRenderer]);

  // Notify parent when route is calculated
  useEffect(() => {
    if (route && onRouteCalculated) {
      const routeInfo = getRouteInfo();
      onRouteCalculated(routeInfo);
    }
  }, [route, onRouteCalculated, getRouteInfo]);

  const handleRecenterMap = () => {
    if (markers.length > 0) {
      const firstMarker = markers[0];
      setCenter(firstMarker.position);
    }
  };

  const handleToggleRoute = () => {
    // Don't toggle if directions service isn't ready
    if (!directionsRenderer) {
      return;
    }

    // Check if Google Maps API is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) {
      console.warn('Google Maps API not fully loaded');
      return;
    }

    if (route) {
      clearRoute();
    } else if (markers.length === 2 && trip?.pickupLocation?.coordinates && trip?.dropoffLocation?.coordinates) {
      const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
      const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
      
      // Validate coordinates
      if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number' || 
          typeof dropoffLat !== 'number' || typeof dropoffLng !== 'number') {
        console.warn('Invalid coordinates for route calculation');
        return;
      }
      
      calculateRoute(
        { lat: pickupLat, lng: pickupLng },
        { lat: dropoffLat, lng: dropoffLng }
      );
    }
  };

  const routeInfo = getRouteInfo();

  if (!trip) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            Select a trip to view on map
          </Text>
        </CardBody>
      </Card>
    );
  }

  // Show loading state while Google Maps is initializing
  if (!directionsRenderer && routeError) {
    return (
      <Card>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {routeError}
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!directionsRenderer) {
    return (
      <Card>
        <CardBody>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <Spinner size="md" mr={3} />
            <Text>Initializing Google Maps...</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
        {/* Trip Info Header - Responsive */}
        <Card>
          <CardBody p={{ base: 3, md: 4 }}>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <VStack align="start" spacing={1} flex="1" minW={{ base: "200px", md: "auto" }}>
                <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
                  {trip.riderName || 'Unknown Rider'}
                </Text>
                <HStack flexWrap="wrap" gap={2}>
                  <Badge colorScheme={trip.status === 'scheduled' ? 'blue' : 'gray'} fontSize={{ base: "xs", md: "sm" }}>
                    {trip.status}
                  </Badge>
                  {trip.scheduledDateTime && (
                    <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={1}>
                      {new Date(trip.scheduledDateTime).toLocaleString()}
                    </Text>
                  )}
                </HStack>
              </VStack>

              {showControls && (
                <HStack spacing={{ base: 1, md: 2 }}>
                  <Button size={{ base: "xs", md: "sm" }} onClick={handleRecenterMap}>
                    Recenter
                  </Button>
                  <Button 
                    size={{ base: "xs", md: "sm" }}
                    variant="outline" 
                    onClick={handleToggleRoute}
                    isLoading={routeLoading}
                  >
                    {route ? 'Hide' : 'Show'}
                  </Button>
                </HStack>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Route Info - Responsive */}
        {routeInfo && (
          <Card>
            <CardBody p={{ base: 3, md: 4 }}>
              <HStack justify="space-around" textAlign="center" spacing={{ base: 2, md: 4 }}>
                <VStack spacing={1} flex="1">
                  <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="blue.500">
                    {routeInfo.distance}
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Distance</Text>
                </VStack>
                <VStack spacing={1} flex="1">
                  <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="green.500">
                    {routeInfo.duration}
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Duration</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Route Loading/Error */}
        {routeLoading && (
          <Box display="flex" justifyContent="center" py={2}>
            <Spinner size="sm" mr={2} />
            <Text fontSize="sm">Calculating route...</Text>
          </Box>
        )}

        {routeError && (
          <Alert status="error" size="sm">
            <AlertIcon />
            {routeError}
          </Alert>
        )}

        {/* Map */}
        <Box borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
          <GoogleMap
            key={mapKey}
            center={center}
            zoom={13}
            markers={markers}
            height={height}
            directionsRenderer={directionsRenderer}
          />
        </Box>

        {/* Location Details - Responsive */}
        {trip.pickupLocation && trip.dropoffLocation && (
          <Card>
            <CardBody p={{ base: 3, md: 4 }}>
              <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                <Box>
                  <Text fontWeight="semibold" color="blue.600" fontSize={{ base: "xs", md: "sm" }}>
                    PICKUP
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={2}>
                    {trip.pickupLocation.address}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="orange.600" fontSize={{ base: "xs", md: "sm" }}>
                    DROPOFF
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={2}>
                    {trip.dropoffLocation.address}
                  </Text>
                </Box>
                {trip.specialInstructions && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize={{ base: "xs", md: "sm" }}>
                      NOTES
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={3}>
                      {trip.specialInstructions}
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default TripMap;