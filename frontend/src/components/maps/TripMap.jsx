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
    if (showRoute && markers.length === 2 && trip?.pickupLocation?.coordinates && trip?.dropoffLocation?.coordinates) {
      const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
      const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
      
      calculateRoute(
        { lat: pickupLat, lng: pickupLng },
        { lat: dropoffLat, lng: dropoffLng }
      );
    } else {
      clearRoute();
    }
  }, [markers, showRoute, trip, calculateRoute, clearRoute]);

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
    if (route) {
      clearRoute();
    } else if (markers.length === 2) {
      const [pickupLng, pickupLat] = trip.pickupLocation.coordinates;
      const [dropoffLng, dropoffLat] = trip.dropoffLocation.coordinates;
      
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

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Trip Info Header */}
        <Card>
          <CardBody>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="lg">
                  {trip.riderName || 'Unknown Rider'}
                </Text>
                <HStack>
                  <Badge colorScheme={trip.status === 'scheduled' ? 'blue' : 'gray'}>
                    {trip.status}
                  </Badge>
                  {trip.scheduledDateTime && (
                    <Text fontSize="sm" color="gray.600">
                      {new Date(trip.scheduledDateTime).toLocaleString()}
                    </Text>
                  )}
                </HStack>
              </VStack>

              {showControls && (
                <HStack>
                  <Button size="sm" onClick={handleRecenterMap}>
                    Recenter
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleToggleRoute}
                    isLoading={routeLoading}
                  >
                    {route ? 'Hide Route' : 'Show Route'}
                  </Button>
                </HStack>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Route Info */}
        {routeInfo && (
          <Card>
            <CardBody>
              <HStack justify="space-around" textAlign="center">
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {routeInfo.distance}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Distance</Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {routeInfo.duration}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Duration</Text>
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

        {/* Location Details */}
        {trip.pickupLocation && trip.dropoffLocation && (
          <Card>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Box>
                  <Text fontWeight="semibold" color="blue.600" fontSize="sm">
                    PICKUP
                  </Text>
                  <Text fontSize="sm">
                    {trip.pickupLocation.address}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="orange.600" fontSize="sm">
                    DROPOFF
                  </Text>
                  <Text fontSize="sm">
                    {trip.dropoffLocation.address}
                  </Text>
                </Box>
                {trip.specialInstructions && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      NOTES
                    </Text>
                    <Text fontSize="sm" color="gray.600">
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