import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  Input,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useToast,
  Spinner,
  Center,
  SimpleGrid,
  Flex,
  Spacer,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const DispatcherSchedule = ({ onViewTrip, onAssignDriver }) => {
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    driver: '',
    status: '',
    route: ''
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    fetchSchedule();
    fetchDrivers();
  }, [filters, fetchSchedule, fetchDrivers]);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.driver) params.append('assignedDriver', filters.driver);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`/api/trips?${params.toString()}`);
      setTrips(response.data.trips || response.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users?role=driver');
      const driverData = response.data?.users || response.data || [];
      setDrivers(Array.isArray(driverData) ? driverData : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in-progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDriverName = (driver) => {
    if (!driver) return 'Unassigned';
    if (typeof driver === 'object') {
      return `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name || 'Unknown';
    }
    return 'Unassigned';
  };

  const getDriverColor = (index) => {
    const colors = ['purple', 'blue', 'green', 'orange', 'teal', 'pink'];
    return colors[index % colors.length];
  };

  // Group trips by driver
  const tripsByDriver = trips.reduce((acc, trip) => {
    const driverId = trip.assignedDriver?._id || 'unassigned';
    if (!acc[driverId]) {
      acc[driverId] = {
        driver: trip.assignedDriver,
        trips: []
      };
    }
    acc[driverId].trips.push(trip);
    return acc;
  }, {});

  return (
    <VStack spacing={6} align="stretch">
      {/* Filter Controls */}
      <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
        <CardHeader>
          <Flex align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={3}>
              <CalendarDaysIcon style={{ width: '20px', height: '20px' }} />
              <Heading size="md">Schedule View</Heading>
            </HStack>
            <Spacer />
            <HStack spacing={2} flexWrap="wrap">
              <Button
                size="sm"
                leftIcon={<ArrowPathIcon style={{ width: '16px', height: '16px' }} />}
                onClick={fetchSchedule}
                variant="outline"
              >
                Refresh
              </Button>
              <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  leftIcon={<FunnelIcon style={{ width: '16px', height: '16px' }} />}
                  rightIcon={<ChevronDownIcon style={{ width: '16px', height: '16px' }} />}
                  variant="outline"
                >
                  View: {viewMode === 'list' ? 'List' : 'Calendar'}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setViewMode('list')}>List View</MenuItem>
                  <MenuItem onClick={() => setViewMode('calendar')}>Calendar View</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">Date</Text>
              <Input
                type="date"
                size="sm"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">Driver</Text>
              <Select
                size="sm"
                value={filters.driver}
                onChange={(e) => handleFilterChange('driver', e.target.value)}
              >
                <option value="">All Drivers</option>
                {Array.isArray(drivers) && drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </Select>
            </Box>
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">Status</Text>
              <Select
                size="sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Box>
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">Quick Filters</Text>
              <HStack spacing={2}>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleFilterChange('date', new Date().toISOString().split('T')[0])}
                >
                  Today
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleFilterChange('date', tomorrow.toISOString().split('T')[0]);
                  }}
                >
                  Tomorrow
                </Button>
              </HStack>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Schedule Content */}
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      ) : trips.length === 0 ? (
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Center py={10}>
              <VStack spacing={3}>
                <CalendarDaysIcon style={{ width: '48px', height: '48px', color: '#CBD5E0' }} />
                <Text color={textColor}>No trips scheduled for selected filters</Text>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      ) : viewMode === 'list' ? (
        <>
          {/* Summary Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="sm" color={textColor}>Total Trips</Text>
                <Text fontSize="2xl" fontWeight="bold">{trips.length}</Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="sm" color={textColor}>Assigned</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {trips.filter(t => t.assignedDriver).length}
                </Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="sm" color={textColor}>Unassigned</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {trips.filter(t => !t.assignedDriver).length}
                </Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Text fontSize="sm" color={textColor}>In Progress</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {trips.filter(t => t.status === 'in-progress').length}
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Trips by Driver */}
          {Object.entries(tripsByDriver).map(([driverId, { driver, trips: driverTrips }], index) => (
            <Card key={driverId} bg={cardBg} borderWidth={1} borderColor={borderColor}>
              <CardHeader bg={driver ? `${getDriverColor(index)}.50` : 'orange.50'}>
                <HStack spacing={3}>
                  <Avatar 
                    size="sm" 
                    name={getDriverName(driver)}
                    bg={driver ? `${getDriverColor(index)}.500` : 'orange.500'}
                  />
                  <Box>
                    <Text fontWeight="bold">{getDriverName(driver)}</Text>
                    <Text fontSize="sm" color={textColor}>
                      {driverTrips.length} trip{driverTrips.length !== 1 ? 's' : ''}
                    </Text>
                  </Box>
                </HStack>
              </CardHeader>
              <CardBody p={0}>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Time</Th>
                        <Th>Rider</Th>
                        <Th>Route</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {driverTrips.map(trip => (
                        <Tr key={trip._id}>
                          <Td>
                            <HStack spacing={2}>
                              <ClockIcon style={{ width: '14px', height: '14px' }} />
                              <Text fontSize="sm">{formatTime(trip.scheduledDateTime)}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <UserIcon style={{ width: '14px', height: '14px' }} />
                              <Text fontSize="sm">{trip.riderName}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <HStack spacing={1}>
                                <MapPinIcon style={{ width: '12px', height: '12px', color: 'green' }} />
                                <Text fontSize="xs" noOfLines={1}>
                                  {trip.pickupLocation?.address || 'N/A'}
                                </Text>
                              </HStack>
                              <HStack spacing={1}>
                                <MapPinIcon style={{ width: '12px', height: '12px', color: 'red' }} />
                                <Text fontSize="xs" noOfLines={1}>
                                  {trip.dropoffLocation?.address || 'N/A'}
                                </Text>
                              </HStack>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(trip.status)} fontSize="xs">
                              {trip.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                size="xs"
                                icon={<EyeIcon style={{ width: '14px', height: '14px' }} />}
                                onClick={() => onViewTrip && onViewTrip(trip)}
                                variant="ghost"
                                aria-label="View trip"
                              />
                              {!trip.assignedDriver && (
                                <IconButton
                                  size="xs"
                                  icon={<TruckIcon style={{ width: '14px', height: '14px' }} />}
                                  onClick={() => onAssignDriver && onAssignDriver(trip)}
                                  variant="ghost"
                                  colorScheme="blue"
                                  aria-label="Assign driver"
                                />
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          ))}
        </>
      ) : (
        <Card bg={cardBg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <Center py={20}>
              <VStack spacing={3}>
                <CalendarDaysIcon style={{ width: '48px', height: '48px', color: '#CBD5E0' }} />
                <Text color={textColor}>Calendar view coming soon</Text>
                <Button size="sm" onClick={() => setViewMode('list')}>
                  Switch to List View
                </Button>
              </VStack>
            </Center>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default DispatcherSchedule;
