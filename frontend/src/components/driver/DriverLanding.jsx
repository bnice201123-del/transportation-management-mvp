import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  IconButton,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Switch,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import {
  SearchIcon,
  ExternalLinkIcon,
  PhoneIcon,
  CheckCircleIcon,
  TimeIcon,
  CalendarIcon,
  ViewIcon,
  InfoIcon,
  SettingsIcon,
  ChatIcon,
  WarningIcon,
  EmailIcon
} from '@chakra-ui/icons';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';

const DriverLanding = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const { user } = useAuth();
  const toast = useToast();

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.data.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trips',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, []);

  const updateAvailability = async (available) => {
    setUpdating(true);
    try {
      await axios.patch(`/api/users/${user._id}/availability`, {
        isAvailable: available
      });
      setIsAvailable(available);
      toast({
        title: 'Success',
        description: `You are now ${available ? 'Available' : 'Busy'} for trips`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateTripStatus = async (tripId, status) => {
    try {
      await axios.patch(`/trips/${tripId}/status`, {
        status,
        location: currentLocation
      });

      toast({
        title: 'Success',
        description: `Trip status updated to ${status.replace('_', ' ')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTrips();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update trip status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const cancelTrip = async (tripId) => {
    try {
      await axios.patch(`/trips/${tripId}/status`, {
        status: 'cancelled',
        cancellationReason: 'Driver cancelled'
      });

      toast({
        title: 'Trip Cancelled',
        description: 'The trip has been cancelled successfully',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });

      fetchTrips();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel trip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateDriverLocation = useCallback(async (location) => {
    try {
      await axios.patch(`/api/users/${user._id}/location`, location);
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }, [user._id]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          updateDriverLocation(location);
          toast({
            title: 'Location Updated',
            description: 'Your location has been saved successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Unable to get your current location. Please check permissions.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  }, [toast, updateDriverLocation]);

  const submitReport = async () => {
    if (!reportType || !reportDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post('/api/reports', {
        type: reportType,
        description: reportDescription,
        submittedBy: user._id,
        submittedByRole: 'driver'
      });

      toast({
        title: 'Report Submitted',
        description: 'Your report has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setReportModalOpen(false);
      setReportType('');
      setReportDescription('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    getCurrentLocation();

    // Update location every 2 minutes when available
    const locationInterval = setInterval(() => {
      if (isAvailable) {
        getCurrentLocation();
      }
    }, 120000);

    // Refresh trips every 30 seconds
    const tripsInterval = setInterval(fetchTrips, 30000);

    return () => {
      clearInterval(locationInterval);
      clearInterval(tripsInterval);
    };
  }, [fetchTrips, fetchVehicles, isAvailable, user._id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'assigned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' +
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter trips for this driver
  const myTrips = trips.filter(trip =>
    trip.assignedDriver && trip.assignedDriver._id === user._id
  );
  const activeTrips = myTrips.filter(trip =>
    ['assigned', 'in_progress'].includes(trip.status)
  );
  const completedTrips = myTrips.filter(trip => trip.status === 'completed');

  // Filter completed trips by date if filter is applied
  const filteredCompletedTrips = dateFilter
    ? completedTrips.filter(trip =>
        formatDateOnly(trip.actualDropoffTime || trip.scheduledDate) === dateFilter
      )
    : completedTrips;

  // Get vehicle assignments for this driver
  const myVehicleAssignments = vehicles.filter(vehicle =>
    vehicle.assignedDriver && vehicle.assignedDriver._id === user._id
  );

  // Filter vehicle assignments by date if filter is applied
  const filteredVehicleAssignments = dateFilter
    ? myVehicleAssignments.filter(vehicle =>
        vehicle.assignedDate && formatDateOnly(vehicle.assignedDate) === dateFilter
      )
    : myVehicleAssignments;

  if (loading) {
    return (
      <Box>
        <Navbar title="Driver Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Driver Dashboard" />

      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg" textAlign="center" color="blue.600">
            Welcome back, {user?.firstName}!
          </Heading>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab><ViewIcon mr={2} />Dashboard</Tab>
              <Tab><CalendarIcon mr={2} />Ride History</Tab>
              <Tab><SettingsIcon mr={2} />Vehicle Assignment</Tab>
              <Tab><InfoIcon mr={2} />Profile</Tab>
              <Tab><SettingsIcon mr={2} />Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Dashboard Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Driver Status Card */}
                  <Card>
                    <CardBody>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color={isAvailable ? 'green.500' : 'orange.500'}>
                            {isAvailable ? 'Available' : 'Busy'}
                          </Text>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="availability" mb="0">
                              Available for trips
                            </FormLabel>
                            <Switch
                              id="availability"
                              isChecked={isAvailable}
                              onChange={(e) => updateAvailability(e.target.checked)}
                              isDisabled={updating}
                              colorScheme="green"
                            />
                          </FormControl>
                        </VStack>

                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                            {activeTrips.length}
                          </Text>
                          <Text color="gray.600">Active Trips</Text>
                        </VStack>

                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {completedTrips.length}
                          </Text>
                          <Text color="gray.600">Completed Today</Text>
                        </VStack>

                        <VStack>
                          <Button
                            leftIcon={<ExternalLinkIcon />}
                            colorScheme="blue"
                            onClick={getCurrentLocation}
                            size="sm"
                          >
                            Update Location
                          </Button>
                          {currentLocation && (
                            <Text fontSize="xs" color="gray.500">
                              Last updated: {new Date().toLocaleTimeString()}
                            </Text>
                          )}
                        </VStack>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Active Trips */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">Active Trips ({activeTrips.length})</Heading>
                    </CardHeader>
                    <CardBody>
                      {activeTrips.length === 0 ? (
                        <Center py={8}>
                          <VStack>
                            <Text color="gray.500">No active trips assigned</Text>
                            {!isAvailable && (
                              <Alert status="info" rounded="md">
                                <AlertIcon />
                                Set your status to available to receive trip assignments
                              </Alert>
                            )}
                          </VStack>
                        </Center>
                      ) : (
                        <Accordion allowMultiple>
                          {activeTrips.map((trip) => (
                            <AccordionItem key={trip._id}>
                              <AccordionButton>
                                <Box flex="1" textAlign="left">
                                  <HStack justify="space-between">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="bold">{trip.tripId}</Text>
                                      <Text fontSize="sm" color="gray.600">
                                        {trip.riderName}
                                      </Text>
                                    </VStack>
                                    <VStack align="end" spacing={0}>
                                      <Badge colorScheme={getStatusColor(trip.status)}>
                                        {trip.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                      <Text fontSize="sm" color="gray.600">
                                        {formatDate(trip.scheduledDate)}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Box>
                                <AccordionIcon />
                              </AccordionButton>
                              <AccordionPanel pb={4}>
                                <VStack align="stretch" spacing={4}>
                                  {/* Trip Details */}
                                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                      <Text fontWeight="bold" color="green.600" mb={2}>
                                        Pickup Location
                                      </Text>
                                      <Text fontSize="sm" mb={2}>
                                        {trip.pickupLocation.address}
                                      </Text>
                                    </Box>

                                    <Box>
                                      <Text fontWeight="bold" color="red.600" mb={2}>
                                        Dropoff Location
                                      </Text>
                                      <Text fontSize="sm" mb={2}>
                                        {trip.dropoffLocation.address}
                                      </Text>
                                    </Box>
                                  </Grid>

                                  <Divider />

                                  {/* Rider Information */}
                                  <Box>
                                    <Text fontWeight="bold" mb={2}>Rider Information</Text>
                                    <HStack>
                                      <Text>Name: {trip.riderName}</Text>
                                      {trip.riderPhone && (
                                        <HStack>
                                          <Text>Phone: {trip.riderPhone}</Text>
                                          <IconButton
                                            icon={<PhoneIcon />}
                                            size="sm"
                                            colorScheme="blue"
                                            aria-label="Call rider"
                                            onClick={() => window.open(`tel:${trip.riderPhone}`)}
                                          />
                                        </HStack>
                                      )}
                                    </HStack>
                                    {trip.notes && (
                                      <Text mt={2} fontSize="sm" color="gray.600">
                                        <strong>Notes:</strong> {trip.notes}
                                      </Text>
                                    )}
                                  </Box>

                                  <Divider />

                                  {/* Action Buttons */}
                                  <HStack spacing={4}>
                                    {trip.status === 'assigned' && (
                                      <Button
                                        colorScheme="blue"
                                        onClick={() => updateTripStatus(trip._id, 'in_progress')}
                                      >
                                        Start Trip
                                      </Button>
                                    )}

                                    {trip.status === 'in_progress' && (
                                      <Button
                                        colorScheme="green"
                                        leftIcon={<CheckCircleIcon />}
                                        onClick={() => updateTripStatus(trip._id, 'completed')}
                                      >
                                        Complete Trip
                                      </Button>
                                    )}

                                    <Button
                                      colorScheme="red"
                                      variant="outline"
                                      onClick={() => cancelTrip(trip._id)}
                                    >
                                      Cancel Trip
                                    </Button>
                                  </HStack>
                                </VStack>
                              </AccordionPanel>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Ride History Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardHeader>
                      <Heading size="md">Ride History</Heading>
                      <Text color="gray.600">View all your completed trips</Text>
                    </CardHeader>
                    <CardBody>
                      <HStack mb={4}>
                        <FormControl>
                          <FormLabel>Filter by Date</FormLabel>
                          <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                          />
                        </FormControl>
                        <Button
                          onClick={() => setDateFilter('')}
                          variant="outline"
                          mt={8}
                        >
                          Clear Filter
                        </Button>
                      </HStack>

                      {filteredCompletedTrips.length === 0 ? (
                        <Center py={8}>
                          <Text color="gray.500">
                            {dateFilter ? 'No trips found for selected date' : 'No completed trips yet'}
                          </Text>
                        </Center>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {filteredCompletedTrips.map((trip) => (
                            <Card key={trip._id} variant="outline">
                              <CardBody>
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                                  <Box>
                                    <Text fontWeight="bold" color="blue.600">{trip.tripId}</Text>
                                    <Text fontSize="sm">{trip.riderName}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {trip.pickupLocation.address} → {trip.dropoffLocation.address}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <Badge colorScheme="green" mb={2}>COMPLETED</Badge>
                                    <Text fontSize="sm">
                                      <strong>Scheduled:</strong> {formatDate(trip.scheduledDate)}
                                    </Text>
                                    <Text fontSize="sm">
                                      <strong>Completed:</strong> {formatDate(trip.actualDropoffTime || trip.scheduledDate)}
                                    </Text>
                                  </Box>
                                  <Box>
                                    {trip.driverRating && (
                                      <Text fontSize="sm">
                                        <strong>Rating:</strong> ⭐ {trip.driverRating}/5
                                      </Text>
                                    )}
                                    {trip.fare && (
                                      <Text fontSize="sm">
                                        <strong>Fare:</strong> ${trip.fare}
                                      </Text>
                                    )}
                                  </Box>
                                </Grid>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Vehicle Assignment Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardHeader>
                      <Heading size="md">Vehicle Assignment History</Heading>
                      <Text color="gray.600">View all vehicles assigned to you</Text>
                    </CardHeader>
                    <CardBody>
                      <HStack mb={4}>
                        <FormControl>
                          <FormLabel>Filter by Date</FormLabel>
                          <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                          />
                        </FormControl>
                        <Button
                          onClick={() => setDateFilter('')}
                          variant="outline"
                          mt={8}
                        >
                          Clear Filter
                        </Button>
                      </HStack>

                      {filteredVehicleAssignments.length === 0 ? (
                        <Center py={8}>
                          <Text color="gray.500">
                            {dateFilter ? 'No vehicle assignments found for selected date' : 'No vehicle assignments yet'}
                          </Text>
                        </Center>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Vehicle</Th>
                              <Th>License Plate</Th>
                              <Th>Assigned Date</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {filteredVehicleAssignments.map((vehicle) => (
                              <Tr key={vehicle._id}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">{vehicle.make} {vehicle.model}</Text>
                                    <Text fontSize="sm" color="gray.600">{vehicle.year}</Text>
                                  </VStack>
                                </Td>
                                <Td>{vehicle.licensePlate}</Td>
                                <Td>{vehicle.assignedDate ? formatDate(vehicle.assignedDate) : 'N/A'}</Td>
                                <Td>
                                  <Badge colorScheme={vehicle.status === 'active' ? 'green' : 'gray'}>
                                    {vehicle.status || 'Unknown'}
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Profile Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardHeader>
                      <Heading size="md">Driver Profile</Heading>
                    </CardHeader>
                    <CardBody>
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                        <Box>
                          <Avatar size="xl" name={`${user?.firstName} ${user?.lastName}`} mb={4} />
                          <VStack align="start" spacing={2}>
                            <Text><strong>Name:</strong> {user?.firstName} {user?.lastName}</Text>
                            <Text><strong>Email:</strong> {user?.email}</Text>
                            <Text><strong>Phone:</strong> {user?.phone || 'Not provided'}</Text>
                            <Text><strong>Role:</strong> {user?.role}</Text>
                            <Text><strong>Employee ID:</strong> {user?.employeeId || 'Not assigned'}</Text>
                          </VStack>
                        </Box>
                        <Box>
                          <Heading size="sm" mb={4}>Statistics</Heading>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel>Total Trips</StatLabel>
                              <StatNumber>{myTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Completed Trips</StatLabel>
                              <StatNumber>{completedTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Active Trips</StatLabel>
                              <StatNumber>{activeTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Average Rating</StatLabel>
                              <StatNumber>
                                {completedTrips.length > 0
                                  ? (completedTrips.reduce((sum, trip) => sum + (parseFloat(trip.driverRating) || 0), 0) / completedTrips.length).toFixed(1)
                                  : 'N/A'
                                }
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>
                        </Box>
                      </Grid>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardHeader>
                      <Heading size="md">Communication & Reports</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Button
                          leftIcon={<ChatIcon />}
                          colorScheme="blue"
                          size="lg"
                          onClick={() => window.open('tel:+1234567890')} // Replace with actual dispatcher number
                        >
                          Call Dispatcher
                        </Button>

                        <Button
                          leftIcon={<EmailIcon />}
                          colorScheme="green"
                          size="lg"
                          onClick={() => window.location.href = 'mailto:dispatcher@company.com'} // Replace with actual email
                        >
                          Email Dispatcher
                        </Button>

                        <Divider />

                        <Button
                          leftIcon={<WarningIcon />}
                          colorScheme="orange"
                          size="lg"
                          onClick={() => setReportModalOpen(true)}
                        >
                          File a Report
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Report Modal */}
                  <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)}>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>File a Report</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <VStack spacing={4} align="stretch">
                          <FormControl isRequired>
                            <FormLabel>Report Type</FormLabel>
                            <RadioGroup onChange={setReportType} value={reportType}>
                              <Stack direction="column">
                                <Radio value="vehicle_issue">Vehicle Issue</Radio>
                                <Radio value="rider_issue">Rider Issue</Radio>
                                <Radio value="safety_concern">Safety Concern</Radio>
                                <Radio value="other">Other</Radio>
                              </Stack>
                            </RadioGroup>
                          </FormControl>

                          <FormControl isRequired>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                              placeholder="Please describe the issue in detail..."
                              rows={4}
                            />
                          </FormControl>
                        </VStack>
                      </ModalBody>

                      <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setReportModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={submitReport}>
                          Submit Report
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

export default DriverLanding;