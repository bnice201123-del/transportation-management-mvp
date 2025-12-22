import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Badge,
  Spinner,
  Icon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Progress,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiMapPin,
  FiBattery2,
  FiSignal,
  FiClock,
  FiRefreshCw,
  FiSettings,
  FiActivity,
  FiAlertTriangle,
  FiCheck,
} from 'react-icons/fi';
import { useDualLogin } from '../../contexts/useDualLogin';

/**
 * TrackerDetailView Component
 * 
 * Displays detailed information about a specific vehicle tracker:
 * - Real-time status and location
 * - Activity history
 * - Health metrics
 * - Configuration access
 * - Alerts and maintenance info
 */
const TrackerDetailView = ({ tracker, onBack }) => {
  const { getTrackerAxios } = useDualLogin();
  const toast = useToast();

  // State
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load tracker details
  useEffect(() => {
    const loadTrackerDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const trackerAxios = getTrackerAxios();

        const [statusRes, activityRes] = await Promise.all([
          trackerAxios.get(`/api/vehicles/${tracker._id}/tracker-status`),
          trackerAxios.get(`/api/vehicles/${tracker._id}/activity-history`),
        ]);

        if (statusRes.data.success) {
          setDetailData(statusRes.data.data);
        }

        if (activityRes.data.success) {
          setActivityHistory(activityRes.data.data || []);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load tracker details';
        setError(message);
        console.error('Error loading tracker details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tracker?._id) {
      loadTrackerDetails();
    }
  }, [tracker?._id, getTrackerAxios]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const loadTrackerDetails = async () => {
        const trackerAxios = getTrackerAxios();

        const [statusRes, activityRes] = await Promise.all([
          trackerAxios.get(`/api/vehicles/${tracker._id}/tracker-status`),
          trackerAxios.get(`/api/vehicles/${tracker._id}/activity-history`),
        ]);

        if (statusRes.data.success) {
          setDetailData(statusRes.data.data);
        }

        if (activityRes.data.success) {
          setActivityHistory(activityRes.data.data || []);
        }
      };
      
      await loadTrackerDetails();
      toast({
        title: 'Success',
        description: 'Tracker data refreshed',
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to refresh tracker',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Format data
  const displayData = detailData || tracker;
  const lastUpdate = displayData.lastUpdate
    ? new Date(displayData.lastUpdate).toLocaleString()
    : 'Never';

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading tracker details...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Back Button & Header */}
      <HStack justify="space-between">
        <Button
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          onClick={onBack}
        >
          Back to Trackers
        </Button>
        <Button
          colorScheme="blue"
          size="sm"
          leftIcon={<FiRefreshCw />}
          isLoading={refreshing}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </HStack>

      {/* Error Alert */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Header Card */}
      <Card>
        <CardBody>
          <VStack align="start" spacing={3}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <Heading size="lg">{displayData.vehicleName}</Heading>
                <Text fontSize="sm" color="gray.500">{displayData.phoneNumber}</Text>
              </VStack>
              <Badge colorScheme={getStatusColor(displayData.status)} fontSize="md" py={1} px={3}>
                {displayData.status?.toUpperCase()}
              </Badge>
            </HStack>

            <Divider />

            <Grid templateColumns="repeat(4, 1fr)" gap={4} w="full">
              <GridItem>
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Last Update</Text>
                  <Text fontSize="sm" fontWeight="bold">{lastUpdate}</Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Battery</Text>
                  <HStack spacing={1}>
                    <Icon as={FiBattery2} />
                    <Text fontSize="sm" fontWeight="bold">{displayData.batteryLevel || 0}%</Text>
                  </HStack>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Signal</Text>
                  <HStack spacing={1}>
                    <Icon as={FiSignal} color={getSignalColor(displayData.signalStrength)} />
                    <Text fontSize="sm" fontWeight="bold">
                      {getSignalText(displayData.signalStrength)}
                    </Text>
                  </HStack>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Health</Text>
                  <Badge colorScheme={displayData.healthStatus === 'Good' ? 'green' : 'yellow'}>
                    {displayData.healthStatus || 'Unknown'}
                  </Badge>
                </VStack>
              </GridItem>
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>
            <Icon as={FiMapPin} mr={2} />
            Location & Status
          </Tab>
          <Tab>
            <Icon as={FiActivity} mr={2} />
            Activity
          </Tab>
          <Tab>
            <Icon as={FiAlertTriangle} mr={2} />
            Alerts
          </Tab>
          <Tab>
            <Icon as={FiSettings} mr={2} />
            Settings
          </Tab>
        </TabList>

        <TabPanels>
          {/* Location & Status Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {/* Current Location */}
              <Card>
                <CardHeader>
                  <Heading size="sm">📍 Current Location</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {displayData.lastLocation ? (
                      <>
                        <Text fontSize="sm">{displayData.lastLocation}</Text>
                        <Text fontSize="xs" color="gray.500">
                          Coordinates: {displayData.latitude?.toFixed(4)}, {displayData.longitude?.toFixed(4)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Accuracy: {displayData.accuracy || 'N/A'}m
                        </Text>
                      </>
                    ) : (
                      <Alert status="warning">
                        <AlertIcon />
                        <Text>No location data available</Text>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Battery Status */}
              <Card>
                <CardHeader>
                  <Heading size="sm">🔋 Battery Status</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Battery Level</Text>
                      <Text fontWeight="bold">{displayData.batteryLevel || 0}%</Text>
                    </HStack>
                    <Progress
                      value={displayData.batteryLevel || 0}
                      colorScheme={
                        (displayData.batteryLevel || 0) > 50
                          ? 'green'
                          : (displayData.batteryLevel || 0) > 20
                          ? 'yellow'
                          : 'red'
                      }
                    />
                    <Text fontSize="xs" color="gray.500">
                      Last Charged: {displayData.lastCharged || 'Unknown'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Estimated Runtime: {displayData.estimatedRuntime || 'N/A'}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              {/* Network Status */}
              <Card>
                <CardHeader>
                  <Heading size="sm">📡 Network Status</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Signal Strength</Text>
                      <Badge colorScheme={getSignalColor(displayData.signalStrength)}>
                        {getSignalText(displayData.signalStrength)}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Network Type</Text>
                      <Text fontWeight="bold" fontSize="sm">
                        {displayData.networkType || 'N/A'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Connection Status</Text>
                      <Badge
                        colorScheme={displayData.isConnected ? 'green' : 'red'}
                      >
                        {displayData.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel>
            <VStack spacing={3} align="stretch">
              {activityHistory.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  <Text>No activity history available</Text>
                </Alert>
              ) : (
                <Card>
                  <CardBody>
                    <List spacing={2}>
                      {activityHistory.slice(0, 20).map((activity, idx) => (
                        <ListItem key={idx} pb={2} borderBottomWidth={idx < activityHistory.length - 1 ? 1 : 0}>
                          <VStack align="start" spacing={0}>
                            <HStack justify="space-between" w="full">
                              <HStack>
                                <Icon
                                  as={activity.type === 'error' ? FiAlertTriangle : FiCheck}
                                  color={activity.type === 'error' ? 'red.500' : 'green.500'}
                                />
                                <Text fontWeight="bold" fontSize="sm">
                                  {activity.action || activity.type}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              {activity.details || activity.message}
                            </Text>
                          </VStack>
                        </ListItem>
                      ))}
                    </List>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Alerts Tab */}
          <TabPanel>
            <VStack spacing={3} align="stretch">
              {displayData.activeAlerts && displayData.activeAlerts.length > 0 ? (
                displayData.activeAlerts.map((alert, idx) => (
                  <Alert status={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'} key={idx}>
                    <AlertIcon />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{alert.title}</Text>
                      <Text fontSize="sm">{alert.message}</Text>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(alert.createdAt).toLocaleString()}
                      </Text>
                    </VStack>
                  </Alert>
                ))
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  <Text>No active alerts</Text>
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">⚙️ Tracker Settings</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Device ID</Text>
                          <Text fontSize="sm" fontWeight="bold" wordBreak="break-word">
                            {displayData.imei || 'N/A'}
                          </Text>
                        </VStack>
                      </GridItem>
                      <GridItem>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Phone Number</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {displayData.phoneNumber || 'N/A'}
                          </Text>
                        </VStack>
                      </GridItem>
                      <GridItem>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Firmware Version</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {displayData.firmwareVersion || 'N/A'}
                          </Text>
                        </VStack>
                      </GridItem>
                      <GridItem>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Storage</Text>
                          <Text fontSize="sm" fontWeight="bold">
                            {displayData.storageUsed || 'N/A'}
                          </Text>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>

              <Button colorScheme="blue" w="full">
                <FiSettings style={{ marginRight: '8px' }} />
                Edit Configuration
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Debug Info Card */}
      <Card bg="gray.50" fontSize="xs">
        <CardHeader>
          <Heading size="xs">Debug Information</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={1}>
            <Text>Tracker ID: <code>{displayData._id || tracker._id}</code></Text>
            <Text>Status: <code>{displayData.status}</code></Text>
            <Text>Created: <code>{new Date(displayData.createdAt || tracker.createdAt).toLocaleString()}</code></Text>
            <Text>Updated: <code>{lastUpdate}</code></Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

// Helper function for status color
function getStatusColor(status) {
  const colors = {
    active: 'green',
    inactive: 'gray',
    suspended: 'red',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}

// Helper function for signal color
function getSignalColor(signal) {
  if (signal >= 4) return 'green';
  if (signal >= 3) return 'yellow';
  if (signal >= 2) return 'orange';
  if (signal >= 1) return 'red';
  return 'gray';
}

// Helper function for signal text
function getSignalText(signal) {
  if (signal >= 4) return 'Excellent';
  if (signal >= 3) return 'Good';
  if (signal >= 2) return 'Fair';
  if (signal >= 1) return 'Poor';
  return 'No Signal';
}

export default TrackerDetailView;
