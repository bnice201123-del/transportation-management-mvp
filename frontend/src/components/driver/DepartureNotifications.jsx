import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  Icon,
  Progress,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse,
  Divider,
} from '@chakra-ui/react';
import {
  ClockIcon,
  MapPinIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import axios from '../../../config/axios';

const DepartureNotificationCard = ({ trip, monitoring, onNavigationStart, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [status, setStatus] = useState('monitoring');
  const toast = useToast();

  useEffect(() => {
    if (!monitoring) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const departureTime = new Date(monitoring.recommendedDepartureTime);
      const diffMs = departureTime - now;
      const diffMinutes = Math.floor(diffMs / (60 * 1000));

      setTimeRemaining({
        minutes: Math.abs(diffMinutes),
        isPast: diffMinutes < 0,
        isImmediate: diffMinutes <= 0 && diffMinutes > -5,
        isLate: diffMinutes < -5,
        isSoon: diffMinutes > 0 && diffMinutes <= 10
      });

      // Update status
      if (monitoring.navigationStarted) {
        setStatus('started');
      } else if (diffMinutes < -5) {
        setStatus('late');
      } else if (diffMinutes <= 0) {
        setStatus('immediate');
      } else if (diffMinutes <= 5) {
        setStatus('soon');
      } else {
        setStatus('monitoring');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [monitoring]);

  const handleStartNavigation = async () => {
    try {
      setLoading(true);

      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            await axios.post(`/api/departure-monitoring/${monitoring._id}/start-navigation`, {
              driverLocation: { latitude, longitude }
            });

            toast({
              title: 'Navigation Started',
              description: 'Your trip monitoring has been updated.',
              status: 'success',
              duration: 3000,
            });

            if (onNavigationStart) {
              onNavigationStart();
            }

            if (onRefresh) {
              onRefresh();
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: 'Location Error',
              description: 'Could not get your location. Please enable location services.',
              status: 'warning',
              duration: 5000,
            });
            setLoading(false);
          }
        );
      } else {
        // Start without location
        await axios.post(`/api/departure-monitoring/${monitoring._id}/start-navigation`, {});

        toast({
          title: 'Navigation Started',
          description: 'Your trip monitoring has been updated.',
          status: 'success',
          duration: 3000,
        });

        if (onNavigationStart) {
          onNavigationStart();
        }

        if (onRefresh) {
          onRefresh();
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Error starting navigation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start navigation. Please try again.',
        status: 'error',
        duration: 5000,
      });
      setLoading(false);
    }
  };

  if (!monitoring || monitoring.navigationStarted) {
    return null; // Don't show if already started
  }

  const getStatusColor = () => {
    switch (status) {
      case 'late':
        return 'red';
      case 'immediate':
        return 'orange';
      case 'soon':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getStatusText = () => {
    if (!timeRemaining) return 'Calculating...';
    
    if (timeRemaining.isLate) {
      return `You're ${timeRemaining.minutes} minutes late to start!`;
    } else if (timeRemaining.isPast || timeRemaining.isImmediate) {
      return 'Start navigation NOW!';
    } else if (timeRemaining.isSoon) {
      return `Start in ${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? 's' : ''}`;
    } else {
      return `Depart in ${timeRemaining.minutes} minutes`;
    }
  };

  const getAlertIcon = () => {
    if (status === 'late' || status === 'immediate') {
      return <ExclamationTriangleIcon style={{ width: '24px', height: '24px' }} />;
    }
    return <BellAlertIcon style={{ width: '24px', height: '24px' }} />;
  };

  return (
    <Alert
      status={status === 'late' ? 'error' : status === 'immediate' ? 'warning' : 'info'}
      variant="left-accent"
      borderRadius="lg"
      mb={4}
      flexDirection="column"
      alignItems="flex-start"
      p={4}
    >
      <HStack width="100%" justify="space-between" mb={3}>
        <HStack>
          <AlertIcon as={() => getAlertIcon()} />
          <Box>
            <AlertTitle fontSize="lg">
              Trip #{trip.tripId} - Departure Alert
            </AlertTitle>
            <AlertDescription fontSize="md" fontWeight="bold">
              {getStatusText()}
            </AlertDescription>
          </Box>
        </HStack>
        <Badge colorScheme={getStatusColor()} fontSize="sm" px={3} py={1}>
          {status === 'late' ? 'LATE' : status === 'immediate' ? 'LEAVE NOW' : 'UPCOMING'}
        </Badge>
      </HStack>

      <VStack align="stretch" width="100%" spacing={3}>
        <Divider />

        <HStack spacing={4} fontSize="sm">
          <HStack>
            <Icon as={ClockIcon} w={4} h={4} />
            <Text fontWeight="medium">Pickup Time:</Text>
            <Text>{new Date(monitoring.scheduledPickupTime).toLocaleTimeString()}</Text>
          </HStack>
          <HStack>
            <Icon as={MapPinIcon} w={4} h={4} />
            <Text fontWeight="medium">Location:</Text>
            <Text noOfLines={1}>{monitoring.pickupLocation.address || 'Pickup Location'}</Text>
          </HStack>
        </HStack>

        {monitoring.estimatedTravelTimeMinutes && (
          <HStack fontSize="sm">
            <Text fontWeight="medium">Estimated Travel Time:</Text>
            <Text>{monitoring.estimatedTravelTimeMinutes} minutes</Text>
          </HStack>
        )}

        {timeRemaining && !timeRemaining.isPast && (
          <Box>
            <HStack justify="space-between" mb={1} fontSize="xs">
              <Text>Time until departure</Text>
              <Text fontWeight="bold">{timeRemaining.minutes} min</Text>
            </HStack>
            <Progress
              value={Math.max(0, 100 - (timeRemaining.minutes / 30) * 100)}
              colorScheme={getStatusColor()}
              size="sm"
              borderRadius="full"
            />
          </Box>
        )}

        <Button
          colorScheme={status === 'late' || status === 'immediate' ? 'red' : 'blue'}
          size="lg"
          width="100%"
          onClick={handleStartNavigation}
          isLoading={loading}
          leftIcon={<Icon as={MapPinIcon} w={5} h={5} />}
        >
          {status === 'late' ? 'Start Navigation (Late!)' : 'Start Navigation'}
        </Button>
      </VStack>
    </Alert>
  );
};

const DriverDepartureNotifications = ({ driverId }) => {
  const [monitoringRecords, setMonitoringRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitoring = async () => {
    try {
      const response = await axios.get(`/api/departure-monitoring/driver/${driverId}`);
      setMonitoringRecords(response.data.monitoringRecords || []);
    } catch (error) {
      console.error('Error fetching monitoring records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchMonitoring, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  if (loading) {
    return (
      <Box py={4}>
        <Text color="gray.500">Loading departure notifications...</Text>
      </Box>
    );
  }

  if (monitoringRecords.length === 0) {
    return null; // Don't show anything if no active monitoring
  }

  return (
    <VStack spacing={4} align="stretch">
      {monitoringRecords.map((record) => (
        <DepartureNotificationCard
          key={record._id}
          trip={record.tripId}
          monitoring={record}
          onNavigationStart={fetchMonitoring}
          onRefresh={fetchMonitoring}
        />
      ))}
    </VStack>
  );
};

export default DriverDepartureNotifications;
