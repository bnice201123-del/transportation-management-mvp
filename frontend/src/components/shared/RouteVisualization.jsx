import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  SimpleGrid,
  Divider,
  useToast,
  Spinner,
  Center,
  Select,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const RouteVisualization = ({ tripId }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [map, setMap] = useState(null);
  const [polyline, setPolyline] = useState(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (tripId) {
      fetchRouteData();
      fetchAnalytics();
    }
  }, [tripId]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/gps/${tripId}/route?simplified=true`);
      setRouteData(response.data);
      
      // Initialize map after data is loaded
      if (response.data.routeTracking?.routePoints?.length > 0) {
        initializeMap(response.data);
      }
    } catch (error) {
      console.error('Error fetching route data:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load route data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/gps/${tripId}/route/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const initializeMap = (data) => {
    if (!window.google) {
      console.error('Google Maps not loaded');
      return;
    }

    const routePoints = data.routeTracking.routePoints;
    if (routePoints.length === 0) return;

    // Create map centered on first point
    const mapOptions = {
      zoom: 13,
      center: { lat: routePoints[0].latitude, lng: routePoints[0].longitude },
      mapTypeId: 'roadmap'
    };

    const newMap = new google.maps.Map(document.getElementById('route-map'), mapOptions);
    setMap(newMap);

    // Create polyline path
    const path = routePoints.map(point => ({
      lat: point.latitude,
      lng: point.longitude
    }));

    // Draw polyline
    const newPolyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: newMap
    });
    setPolyline(newPolyline);

    // Add start marker (green)
    new google.maps.Marker({
      position: { lat: routePoints[0].latitude, lng: routePoints[0].longitude },
      map: newMap,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      },
      title: 'Start - ' + data.pickupLocation.address
    });

    // Add end marker (red)
    const endPoint = routePoints[routePoints.length - 1];
    new google.maps.Marker({
      position: { lat: endPoint.latitude, lng: endPoint.longitude },
      map: newMap,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      },
      title: 'End - ' + data.dropoffLocation.address
    });

    // Add markers for significant points
    routePoints.forEach((point, index) => {
      if (point.isSignificant && index !== 0 && index !== routePoints.length - 1) {
        new google.maps.Marker({
          position: { lat: point.latitude, lng: point.longitude },
          map: newMap,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: `Waypoint - ${new Date(point.timestamp).toLocaleTimeString()}`
        });
      }
    });

    // Fit map bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    newMap.fitBounds(bounds);
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/gps/${tripId}/route/export`, {
        params: { format },
        responseType: format === 'json' ? 'json' : 'blob'
      });

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `trip-${tripId}-route.json`);
      } else {
        downloadBlob(response.data, `trip-${tripId}-route.${format}`);
      }

      toast({
        title: 'Success',
        description: `Route exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export route',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!routeData || !routeData.routeTracking) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <Center py={10}>
            <VStack spacing={3}>
              <MapPinIcon style={{ width: '48px', height: '48px', opacity: 0.5 }} />
              <Text color="gray.500">No route data available for this trip</Text>
            </VStack>
          </Center>
        </CardBody>
      </Card>
    );
  }

  const { routeTracking } = routeData;
  const summary = routeTracking.routeSummary || {};

  return (
    <VStack spacing={6} align="stretch">
      {/* Trip Info Header */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between" flexWrap="wrap">
            <VStack align="start" spacing={1}>
              <Heading size="md">Route: {routeData.tripNumber}</Heading>
              <Text color="gray.600">{routeData.riderName}</Text>
            </VStack>
            <Badge colorScheme="green" fontSize="md" px={3} py={1}>
              {routeTracking.routePoints?.length || 0} GPS Points
            </Badge>
          </HStack>
        </CardHeader>
      </Card>

      {/* Route Statistics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Total Distance</StatLabel>
              <StatNumber>{summary.totalDistance?.toFixed(2) || 0} km</StatNumber>
              <StatHelpText>Actual route traveled</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Duration</StatLabel>
              <StatNumber>{formatDuration(summary.actualDuration)}</StatNumber>
              <StatHelpText>
                {summary.startTime && new Date(summary.startTime).toLocaleTimeString()} - 
                {summary.endTime && new Date(summary.endTime).toLocaleTimeString()}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Avg Speed</StatLabel>
              <StatNumber>{summary.averageSpeed?.toFixed(1) || 0} km/h</StatNumber>
              <StatHelpText>Average driving speed</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Max Speed</StatLabel>
              <StatNumber>{summary.maxSpeed?.toFixed(1) || 0} km/h</StatNumber>
              <StatHelpText>Peak speed recorded</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Analytics Comparison */}
      {analytics && (
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardHeader>
            <HStack spacing={2}>
              <ChartBarIcon style={{ width: '20px', height: '20px' }} />
              <Heading size="sm">Route Analytics</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="bold" mb={2}>Distance Comparison</Text>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">Estimated:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {analytics.comparison.estimatedDistance?.toFixed(2) || 'N/A'} km
                  </Text>
                </HStack>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">Actual:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {analytics.comparison.actualDistance?.toFixed(2) || 'N/A'} km
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Variance:</Text>
                  <Badge colorScheme={
                    analytics.comparison.distanceVariance?.includes('-') ? 'green' : 'orange'
                  }>
                    {analytics.comparison.distanceVariance}
                  </Badge>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Duration Comparison</Text>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">Estimated:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDuration(analytics.comparison.estimatedDuration)}
                  </Text>
                </HStack>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">Actual:</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDuration(analytics.comparison.actualDuration)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Variance:</Text>
                  <Badge colorScheme={
                    analytics.comparison.durationVariance?.includes('-') ? 'green' : 'orange'
                  }>
                    {analytics.comparison.durationVariance}
                  </Badge>
                </HStack>
              </Box>
            </SimpleGrid>

            <Divider my={4} />

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {analytics.routeQuality?.averageAccuracy?.toFixed(1) || 0}m
                </Text>
                <Text fontSize="xs" color="gray.600">Avg Accuracy</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {analytics.routeQuality?.dataCompleteness || '0%'}
                </Text>
                <Text fontSize="xs" color="gray.600">Data Quality</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {analytics.routeQuality?.significantPoints || 0}
                </Text>
                <Text fontSize="xs" color="gray.600">Waypoints</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {analytics.deviations?.count || 0}
                </Text>
                <Text fontSize="xs" color="gray.600">Deviations</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Map Display */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <MapPinIcon style={{ width: '20px', height: '20px' }} />
              <Heading size="sm">Route Map</Heading>
            </HStack>
            <HStack spacing={2}>
              <Select size="sm" width="150px" onChange={(e) => handleExport(e.target.value)} defaultValue="">
                <option value="" disabled>Export As...</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="gpx">GPX</option>
              </Select>
              <Button
                size="sm"
                leftIcon={<ArrowPathIcon style={{ width: '16px', height: '16px' }} />}
                onClick={fetchRouteData}
              >
                Refresh
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <Box
            id="route-map"
            height="500px"
            width="100%"
            borderRadius="md"
            overflow="hidden"
            bg="gray.100"
          />
        </CardBody>
      </Card>

      {/* Location History */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <HStack spacing={2}>
            <ClockIcon style={{ width: '20px', height: '20px' }} />
            <Heading size="sm">Location History</Heading>
            <Badge>{routeTracking.routePoints?.length || 0} points</Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={2} align="stretch" maxHeight="300px" overflowY="auto">
            {routeTracking.routePoints?.slice(0, 20).map((point, index) => (
              <HStack
                key={index}
                p={2}
                bg={point.isSignificant ? 'blue.50' : 'transparent'}
                borderRadius="md"
                justify="space-between"
              >
                <HStack spacing={3}>
                  <Badge colorScheme={point.isSignificant ? 'blue' : 'gray'}>
                    {index + 1}
                  </Badge>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" fontWeight="medium">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </Text>
                  </VStack>
                </HStack>
                <HStack spacing={4}>
                  {point.speed && (
                    <Text fontSize="xs">
                      {(point.speed * 3.6).toFixed(1)} km/h
                    </Text>
                  )}
                  {point.accuracy && (
                    <Text fontSize="xs" color="gray.500">
                      ±{point.accuracy.toFixed(0)}m
                    </Text>
                  )}
                </HStack>
              </HStack>
            ))}
            {routeTracking.routePoints?.length > 20 && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                Showing first 20 of {routeTracking.routePoints.length} points
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default RouteVisualization;
