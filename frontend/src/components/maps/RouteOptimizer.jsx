import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FaRoute, FaClock, FaMapMarkerAlt, FaNavigation, FaCar } from 'react-icons/fa';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const RouteOptimizer = ({ pickup, dropoff, onRouteUpdate }) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateRoute = React.useCallback(async () => {
    if (!pickup?.coordinates || !dropoff?.coordinates || !window.google) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      const request = {
        origin: new window.google.maps.LatLng(
          pickup.coordinates[1], 
          pickup.coordinates[0]
        ),
        destination: new window.google.maps.LatLng(
          dropoff.coordinates[1], 
          dropoff.coordinates[0]
        ),
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      };

      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      const route = result.routes[0];
      const leg = route.legs[0];

      const routeInfo = {
        distance: leg.distance.text,
        duration: leg.duration.text,
        durationValue: leg.duration.value, // in seconds
        distanceValue: leg.distance.value, // in meters
        steps: leg.steps.length,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        trafficData: result.routes[0].legs[0].duration_in_traffic || leg.duration
      };

      setRouteData(routeInfo);
      
      if (onRouteUpdate) {
        onRouteUpdate(routeInfo);
      }

    } catch (err) {
      console.error('Route calculation error:', err);
      setError('Failed to calculate route. Please check the addresses and try again.');
    } finally {
      setLoading(false);
    }
  }, [pickup?.coordinates, dropoff?.coordinates, onRouteUpdate]);

  useEffect(() => {
    if (pickup?.coordinates && dropoff?.coordinates) {
      calculateRoute();
    }
  }, [pickup?.coordinates, dropoff?.coordinates, calculateRoute]);

  const openInGoogleMaps = () => {
    if (pickup?.address && dropoff?.address) {
      const pickupEncoded = encodeURIComponent(pickup.address);
      const dropoffEncoded = encodeURIComponent(dropoff.address);
      const url = `https://www.google.com/maps/dir/${pickupEncoded}/${dropoffEncoded}`;
      window.open(url, '_blank');
    }
  };

  const getEstimatedFare = (distanceValue, durationValue) => {
    // Simple fare calculation: base fare + distance + time
    const baseFare = 5.00;
    const perMile = 2.50;
    const perMinute = 0.25;
    
    const miles = distanceValue * 0.000621371; // meters to miles
    const minutes = durationValue / 60; // seconds to minutes
    
    const total = baseFare + (miles * perMile) + (minutes * perMinute);
    return total.toFixed(2);
  };

  if (!pickup?.coordinates || !dropoff?.coordinates) {
    return (
      <Card variant="outline">
        <CardBody>
          <VStack spacing={3}>
            <FaRoute size={24} color="gray" />
            <Text color="gray.500" textAlign="center">
              Enter both pickup and dropoff locations to see route details
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card variant="outline">
        <CardBody>
          <VStack spacing={3}>
            <Spinner size="lg" />
            <Text>Calculating optimal route...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outline">
        <CardBody>
          <Alert status="error" size="sm">
            <AlertIcon />
            {error}
          </Alert>
          <Button 
            mt={3} 
            size="sm" 
            colorScheme="blue" 
            onClick={calculateRoute}
            isLoading={loading}
          >
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!routeData) {
    return (
      <Card variant="outline">
        <CardBody>
          <Text color="gray.500">No route data available</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack>
              <FaRoute color="blue" />
              <Text fontWeight="bold">Route Analysis</Text>
            </HStack>
            <HStack>
              <Tooltip label="Open in Google Maps">
                <IconButton
                  icon={<ExternalLinkIcon />}
                  size="sm"
                  variant="outline"
                  onClick={openInGoogleMaps}
                  aria-label="Open in Google Maps"
                />
              </Tooltip>
              <Button
                size="sm"
                leftIcon={<FaNavigation />}
                colorScheme="blue"
                onClick={openInGoogleMaps}
              >
                Navigate
              </Button>
            </HStack>
          </HStack>

          <Divider />

          {/* Route Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel fontSize="xs">Distance</StatLabel>
              <StatNumber fontSize="lg">{routeData.distance}</StatNumber>
              <StatHelpText fontSize="xs">
                <FaMapMarkerAlt style={{ display: 'inline', marginRight: '4px' }} />
                Total miles
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel fontSize="xs">Duration</StatLabel>
              <StatNumber fontSize="lg">{routeData.duration}</StatNumber>
              <StatHelpText fontSize="xs">
                <FaClock style={{ display: 'inline', marginRight: '4px' }} />
                Estimated time
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel fontSize="xs">Estimated Fare</StatLabel>
              <StatNumber fontSize="lg" color="green.600">
                ${getEstimatedFare(routeData.distanceValue, routeData.durationValue)}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Base + distance + time
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel fontSize="xs">Route Steps</StatLabel>
              <StatNumber fontSize="lg">{routeData.steps}</StatNumber>
              <StatHelpText fontSize="xs">
                <FaCar style={{ display: 'inline', marginRight: '4px' }} />
                Directions
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Route Details */}
          <VStack spacing={2} align="stretch">
            <HStack>
              <Badge colorScheme="green" variant="outline">FROM</Badge>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {pickup.address}
              </Text>
            </HStack>
            
            <HStack>
              <Badge colorScheme="red" variant="outline">TO</Badge>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {dropoff.address}
              </Text>
            </HStack>
          </VStack>

          {/* Traffic Information */}
          {routeData.trafficData && routeData.trafficData.value !== routeData.durationValue && (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold">Traffic Detected</Text>
                <Text fontSize="xs">
                  With traffic: {Math.round(routeData.trafficData.value / 60)} minutes
                  (+ {Math.round((routeData.trafficData.value - routeData.durationValue) / 60)} min delay)
                </Text>
              </VStack>
            </Alert>
          )}

          {/* Quick Actions */}
          <HStack justify="space-between" pt={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={calculateRoute}
              isLoading={loading}
            >
              Recalculate
            </Button>
            
            <Badge colorScheme="blue" p={2}>
              Last updated: {new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default RouteOptimizer;