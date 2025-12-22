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
  SimpleGrid,
  Icon,
  useToast,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Alert,
  AlertIcon,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Progress,
} from '@chakra-ui/react';
import {
  FiChevronRight,
  FiMapPin,
  FiBattery2,
  FiSignal,
  FiClock,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiPower,
  FiRefreshCw,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import { useDualLogin } from '../../contexts/DualLoginContext';

/**
 * VehicleTrackerList Component
 * 
 * Displays a list of all vehicle trackers associated with the driver
 * Features:
 * - Search and filter trackers
 * - View tracker status and health
 * - Quick actions (activate, deactivate, refresh)
 * - Sort by various criteria
 */
const VehicleTrackerList = ({ onSelectTracker }) => {
  const { getTrackerAxios } = useDualLogin();
  const toast = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [trackers, setTrackers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [refreshing, setRefreshing] = useState(null);

  // Load trackers
  useEffect(() => {
    const loadTrackers = async () => {
      try {
        setLoading(true);
        setError(null);
        const trackerAxios = getTrackerAxios();

        const response = await trackerAxios.get('/api/vehicles/trackers');

        if (response.data.success) {
          setTrackers(response.data.data || []);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load trackers';
        setError(message);
        console.error('Error loading trackers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrackers();
  }, [getTrackerAxios]);

  // Filter and sort trackers
  const filteredTrackers = trackers
    .filter(tracker => {
      const matchesSearch = 
        tracker.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracker.phoneNumber?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || tracker.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.vehicleName?.localeCompare(b.vehicleName);
        case 'status': {
          const statusOrder = { active: 0, inactive: 1, suspended: 2, archived: 3 };
          return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
        }
        case 'battery':
          return (b.batteryLevel || 0) - (a.batteryLevel || 0);
        case 'recent':
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        default:
          return 0;
      }
    });

  // Handle tracker actions
  const handleActivateTracker = async (trackerId) => {
    try {
      setRefreshing(trackerId);
      const trackerAxios = getTrackerAxios();

      const response = await trackerAxios.post(`/api/vehicles/${trackerId}/activate-tracker`);

      if (response.data.success) {
        // Update local state
        setTrackers(prev =>
          prev.map(t =>
            t._id === trackerId
              ? { ...t, status: 'active', lastUpdate: new Date() }
              : t
          )
        );

        toast({
          title: 'Success',
          description: 'Tracker activated',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to activate tracker',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleDeactivateTracker = async (trackerId) => {
    try {
      setRefreshing(trackerId);
      const trackerAxios = getTrackerAxios();

      const response = await trackerAxios.post(`/api/vehicles/${trackerId}/deactivate-tracker`);

      if (response.data.success) {
        setTrackers(prev =>
          prev.map(t =>
            t._id === trackerId
              ? { ...t, status: 'inactive' }
              : t
          )
        );

        toast({
          title: 'Success',
          description: 'Tracker deactivated',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to deactivate tracker',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshTracker = async (trackerId) => {
    try {
      setRefreshing(trackerId);
      const trackerAxios = getTrackerAxios();

      const response = await trackerAxios.get(`/api/vehicles/${trackerId}/tracker-status`);

      if (response.data.success) {
        const updatedTracker = response.data.data;
        setTrackers(prev =>
          prev.map(t =>
            t._id === trackerId
              ? { ...t, ...updatedTracker, lastUpdate: new Date() }
              : t
          )
        );

        toast({
          title: 'Success',
          description: 'Tracker data refreshed',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to refresh tracker',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      inactive: 'gray',
      suspended: 'red',
      archived: 'gray',
    };
    return colors[status] || 'gray';
  };

  // Get signal color
  const getSignalColor = (signal) => {
    if (signal >= 4) return 'green';
    if (signal >= 3) return 'yellow';
    if (signal >= 2) return 'orange';
    if (signal >= 1) return 'red';
    return 'gray';
  };

  // Get signal strength text
  const getSignalText = (signal) => {
    if (signal >= 4) return 'Excellent';
    if (signal >= 3) return 'Good';
    if (signal >= 2) return 'Fair';
    if (signal >= 1) return 'Poor';
    return 'No Signal';
  };

  const handleRefreshAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const trackerAxios = getTrackerAxios();

      const response = await trackerAxios.get('/api/vehicles/trackers');

      if (response.data.success) {
        setTrackers(response.data.data || []);
        toast({
          title: 'Success',
          description: 'All trackers refreshed',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load trackers';
      setError(message);
      console.error('Error loading trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading your trackers...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="md">📍 Vehicle Trackers</Heading>
              <Text fontSize="sm" color="gray.500">
                Manage {filteredTrackers.length} tracker{filteredTrackers.length !== 1 ? 's' : ''}
              </Text>
            </VStack>
            <Button
              colorScheme="blue"
              size="sm"
              leftIcon={<FiRefreshCw />}
              onClick={handleRefreshAll}
            >
              Refresh All
            </Button>
          </HStack>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by vehicle name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <HStack spacing={3}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
                w="200px"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="sm"
                w="150px"
              >
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="battery">Sort by Battery</option>
                <option value="recent">Sort by Recent</option>
              </Select>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Trackers Grid */}
      {filteredTrackers.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>
            {searchTerm || statusFilter !== 'all'
              ? 'No trackers match your search'
              : 'No trackers available'}
          </Text>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredTrackers.map((tracker) => (
            <Card key={tracker._id} borderWidth={1}>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {/* Header */}
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Heading size="sm">{tracker.vehicleName}</Heading>
                      <Text fontSize="xs" color="gray.500">{tracker.phoneNumber}</Text>
                    </VStack>
                    <Menu>
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        icon={<FiMoreVertical />}
                      />
                      <MenuList>
                        {tracker.status !== 'active' && (
                          <MenuItem
                            icon={<FiPower />}
                            onClick={() => handleActivateTracker(tracker._id)}
                            isDisabled={refreshing === tracker._id}
                          >
                            Activate
                          </MenuItem>
                        )}
                        {tracker.status === 'active' && (
                          <MenuItem
                            icon={<FiX />}
                            onClick={() => handleDeactivateTracker(tracker._id)}
                            isDisabled={refreshing === tracker._id}
                          >
                            Deactivate
                          </MenuItem>
                        )}
                        <MenuItem
                          icon={<FiRefreshCw />}
                          onClick={() => handleRefreshTracker(tracker._id)}
                          isDisabled={refreshing === tracker._id}
                        >
                          Refresh
                        </MenuItem>
                        <MenuItem
                          icon={<FiChevronRight />}
                          onClick={() => onSelectTracker && onSelectTracker(tracker)}
                        >
                          View Details
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>

                  <Divider />

                  {/* Status Badge */}
                  <Badge colorScheme={getStatusColor(tracker.status)} w="fit-content">
                    {tracker.status?.toUpperCase()}
                  </Badge>

                  {/* Location */}
                  {tracker.lastLocation && (
                    <HStack spacing={2} fontSize="sm">
                      <Icon as={FiMapPin} color="blue.500" />
                      <VStack spacing={0} align="start">
                        <Text fontSize="xs">{tracker.lastLocation}</Text>
                        <Text fontSize="xs" color="gray.500">
                          <FiClock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {tracker.lastUpdate
                            ? new Date(tracker.lastUpdate).toLocaleTimeString()
                            : 'N/A'}
                        </Text>
                      </VStack>
                    </HStack>
                  )}

                  <Divider />

                  {/* Battery & Signal */}
                  <VStack spacing={2} align="stretch">
                    {/* Battery */}
                    <VStack spacing={1} align="stretch">
                      <HStack justify="space-between" fontSize="sm">
                        <HStack spacing={1}>
                          <Icon as={FiBattery2} />
                          <Text>Battery</Text>
                        </HStack>
                        <Text fontWeight="bold">
                          {tracker.batteryLevel || 0}%
                        </Text>
                      </HStack>
                      <Progress
                        value={tracker.batteryLevel || 0}
                        size="sm"
                        colorScheme={
                          (tracker.batteryLevel || 0) > 50
                            ? 'green'
                            : (tracker.batteryLevel || 0) > 20
                            ? 'yellow'
                            : 'red'
                        }
                      />
                    </VStack>

                    {/* Signal */}
                    <HStack justify="space-between" fontSize="sm">
                      <HStack spacing={1}>
                        <Icon
                          as={FiSignal}
                          color={getSignalColor(tracker.signalStrength)}
                        />
                        <Text>Signal</Text>
                      </HStack>
                      <Badge
                        size="sm"
                        colorScheme={getSignalColor(tracker.signalStrength)}
                      >
                        {getSignalText(tracker.signalStrength)}
                      </Badge>
                    </HStack>
                  </VStack>

                  {/* Health Status */}
                  {tracker.healthStatus && (
                    <HStack
                      spacing={2}
                      p={2}
                      bg={
                        tracker.healthStatus === 'Good'
                          ? 'green.50'
                          : 'yellow.50'
                      }
                      borderRadius="md"
                      fontSize="sm"
                    >
                      <Icon
                        as={tracker.healthStatus === 'Good' ? FiChevronRight : FiAlertCircle}
                        color={
                          tracker.healthStatus === 'Good'
                            ? 'green.600'
                            : 'yellow.600'
                        }
                      />
                      <Text
                        color={
                          tracker.healthStatus === 'Good'
                            ? 'green.600'
                            : 'yellow.600'
                        }
                      >
                        {tracker.healthStatus}
                      </Text>
                    </HStack>
                  )}

                  {/* View Details Button */}
                  <Button
                    colorScheme="blue"
                    size="sm"
                    rightIcon={<FiChevronRight />}
                    onClick={() => onSelectTracker && onSelectTracker(tracker)}
                  >
                    View Details
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Summary Card */}
      {filteredTrackers.length > 0 && (
        <Card bg="blue.50">
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <VStack spacing={0}>
                <Text fontSize="sm" color="gray.600">Total Trackers</Text>
                <Heading size="md">{trackers.length}</Heading>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="sm" color="gray.600">Active</Text>
                <Heading size="md" color="green.600">
                  {trackers.filter(t => t.status === 'active').length}
                </Heading>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="sm" color="gray.600">Inactive</Text>
                <Heading size="md" color="gray.600">
                  {trackers.filter(t => t.status === 'inactive').length}
                </Heading>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="sm" color="gray.600">Issues</Text>
                <Heading size="md" color="red.600">
                  {trackers.filter(t => t.status === 'suspended' || t.status === 'archived').length}
                </Heading>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default VehicleTrackerList;
