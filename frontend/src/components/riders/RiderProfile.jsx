import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Badge,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Flex,
  Spacer,
  IconButton,
  useToast,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  EditIcon,
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  ArrowRightIcon,
  TimeIcon,
  SettingsIcon,
  ArrowBackIcon,
  AddIcon,
  MinusIcon
} from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const RiderProfile = () => {
  const [rider, setRider] = useState(null);
  const [trips, setTrips] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBalanceOpen, onOpen: onBalanceOpen, onClose: onBalanceClose } = useDisclosure();
  const navigate = useNavigate();
  const { riderId } = useParams();
  const toast = useToast();

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    preferredVehicleType: ''
  });

  // Balance management state
  const [balanceForm, setBalanceForm] = useState({
    type: 'trips', // 'trips', 'dollars', 'mileage'
    amount: 0,
    operation: 'add' // 'add' or 'subtract'
  });
  const [balanceUpdating, setBalanceUpdating] = useState(false);

  const fetchRider = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/riders/${riderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRider(response.data);
      setEditForm({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        preferredVehicleType: response.data.preferredVehicleType || ''
      });

      // Fetch rider's trips
      try {
        const tripsResponse = await axios.get(`/api/trips?riderId=${riderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setTrips(tripsResponse.data?.trips || tripsResponse.data || []);
      } catch (err) {
        console.error('Error fetching trips:', err);
        setTrips([]);
      }

      // Fetch complaints (if endpoint exists)
      try {
        const complaintsResponse = await axios.get(`/api/complaints?riderId=${riderId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setComplaints(complaintsResponse.data?.complaints || complaintsResponse.data || []);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setComplaints([]);
      }
    } catch (error) {
      console.error('Error fetching rider:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rider profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/riders');
    } finally {
      setLoading(false);
    }
  }, [riderId, toast, navigate]);

  useEffect(() => {
    fetchRider();
  }, [fetchRider]);

  const handleEdit = async () => {
    try {
      setUpdating(true);
      await axios.put(`/api/riders/${riderId}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: 'Rider profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchRider();
    } catch (error) {
      console.error('Error updating rider:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rider profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!balanceForm.amount || balanceForm.amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setBalanceUpdating(true);
    try {
      const updateData = {
        type: balanceForm.type,
        amount: balanceForm.amount,
        operation: balanceForm.operation
      };

      const response = await axios.patch(`/api/users/${riderId}/balance`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Balance Updated',
          description: `Successfully ${balanceForm.operation === 'add' ? 'added' : 'subtracted'} ${balanceForm.amount} ${balanceForm.type}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setBalanceForm({
          type: 'trips',
          amount: 0,
          operation: 'add'
        });

        onBalanceClose();
        fetchRider(); // Refresh rider data
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update balance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBalanceUpdating(false);
    }
  };

  const handleScheduleTrip = () => {
    navigate('/scheduler', {
      state: {
        preselectedRider: rider,
        openCreateModal: true
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getMostRecentTrip = () => {
    if (!Array.isArray(trips) || trips.length === 0) return null;
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    if (completedTrips.length === 0) return null;
    return completedTrips.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0];
  };

  const getUpcomingTrip = () => {
    if (!Array.isArray(trips) || trips.length === 0) return null;
    const now = new Date();
    const futureTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      return tripDate > now && trip.status !== 'cancelled';
    });
    if (futureTrips.length === 0) return null;
    return futureTrips.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
  };

  const getTripFrequency = () => {
    if (!Array.isArray(trips) || trips.length === 0) return 'No trips';

    const sortedTrips = [...trips].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    const firstTrip = new Date(sortedTrips[0].scheduledDate);
    const lastTrip = new Date(sortedTrips[sortedTrips.length - 1].scheduledDate);
    const monthsDiff = (lastTrip.getFullYear() - firstTrip.getFullYear()) * 12 +
                      (lastTrip.getMonth() - firstTrip.getMonth());

    if (monthsDiff <= 0) return `${sortedTrips.length} trips`;

    const avgTripsPerMonth = sortedTrips.length / monthsDiff;
    if (avgTripsPerMonth >= 2) return 'Frequent';
    if (avgTripsPerMonth >= 1) return 'Regular';
    if (avgTripsPerMonth >= 0.5) return 'Occasional';
    return 'Infrequent';
  };

  const getFrequentDestination = () => {
    if (!Array.isArray(trips) || trips.length === 0) return 'N/A';

    const destinations = trips.map(trip => trip.dropoffLocation).filter(Boolean);
    if (destinations.length === 0) return 'N/A';

    const destinationCounts = destinations.reduce((acc, dest) => {
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {});

    const mostFrequent = Object.entries(destinationCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostFrequent ? mostFrequent[0] : 'N/A';
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading rider profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (!rider) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Text>Rider not found</Text>
          <Button onClick={() => navigate('/riders')}>Back to Riders</Button>
        </VStack>
      </Center>
    );
  }

  const recentTrip = getMostRecentTrip();
  const upcomingTrip = getUpcomingTrip();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" mb={4}>
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => navigate('/riders')}
            mr={4}
            title="Back to Riders"
          />
          <Heading size="lg">Rider Profile</Heading>
          <Spacer />
          <HStack>
            <Button leftIcon={<EditIcon />} colorScheme="blue" onClick={onOpen}>
              Edit Profile
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="green" onClick={onBalanceOpen}>
              Manage Balance
            </Button>
            <Button leftIcon={<CalendarIcon />} colorScheme="pink" onClick={handleScheduleTrip}>
              Create Trip
            </Button>
          </HStack>
        </Flex>

        {/* Profile Header */}
        <Card>
          <CardBody>
            <HStack spacing={6}>
              <Avatar size="xl" name={`${rider.firstName} ${rider.lastName}`} />
              <VStack align="start" spacing={2} flex={1}>
                <Heading size="md">{rider.firstName} {rider.lastName}</Heading>
                <Text color="gray.600">ID: {rider.riderId}</Text>
                <Badge colorScheme={rider.isActive ? 'green' : 'gray'}>
                  {rider.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Rider Information */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <CardHeader>
              <Heading size="md">Personal Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <HStack>
                  <CalendarIcon color="gray.500" />
                  <Text><strong>Date of Birth:</strong> {formatDate(rider.dateOfBirth)}</Text>
                </HStack>
                <HStack>
                  <ArrowRightIcon color="gray.500" />
                  <Text><strong>Address:</strong> {rider.address || 'Not provided'}</Text>
                </HStack>
                <HStack>
                  <PhoneIcon color="gray.500" />
                  <Text><strong>Phone:</strong> {rider.phone || 'Not provided'}</Text>
                </HStack>
                <HStack>
                  <SettingsIcon color="gray.500" />
                  <Text><strong>Preferred Vehicle:</strong> {rider.preferredVehicleType || 'Not specified'}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Service Balance</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Balance Type:</Text>
                  <Text color="gray.600" textTransform="capitalize">
                    {rider.serviceBalance?.type || 'trips'}
                  </Text>
                </Box>
                {rider.serviceBalance?.type === 'trips' ? (
                  <Box>
                    <Text fontWeight="bold">Trip Balance:</Text>
                    <Text color="gray.600">
                      {rider.serviceBalance?.tripCount || 0} trips remaining
                    </Text>
                  </Box>
                ) : (
                  <Box>
                    <Text fontWeight="bold">Dollar Balance:</Text>
                    <Text color="gray.600">
                      ${(rider.serviceBalance?.dollarAmount || 0).toFixed(2)} remaining
                    </Text>
                  </Box>
                )}
                <Box>
                  <Text fontWeight="bold">Mileage Balance:</Text>
                  <Text color="gray.600">
                    {rider.mileageBalance?.currentBalance || 0} miles remaining
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Pricing:</Text>
                  <Text color="gray.600">
                    ${rider.pricingDetails?.pricePerRide?.toFixed(2) || '15.00'} per ride, ${(rider.pricingDetails?.pricePerMile?.toFixed(2) || '0.50')} per mile
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Contract Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {rider.contractDetails?.isActive ? (
                  <>
                    <Box>
                      <Text fontWeight="bold">Contract Status:</Text>
                      <Badge colorScheme="green">Active</Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Start Date:</Text>
                      <Text color="gray.600">
                        {formatDate(rider.contractDetails.startDate)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">End Date:</Text>
                      <Text color="gray.600">
                        {formatDate(rider.contractDetails.endDate)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Days Remaining:</Text>
                      <Text color="gray.600">
                        {Math.max(0, Math.ceil((new Date(rider.contractDetails.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                      </Text>
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Text fontWeight="bold">Contract Status:</Text>
                    <Badge colorScheme="gray">No Active Contract</Badge>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Trip Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Most Recent Trip:</Text>
                  <Text color="gray.600">
                    {recentTrip ? formatDate(recentTrip.scheduledDate) : 'No trips'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Upcoming Trip:</Text>
                  <Text color="gray.600">
                    {upcomingTrip ? formatDate(upcomingTrip.scheduledDate) : 'No upcoming trips'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Trip Frequency:</Text>
                  <Text color="gray.600">{getTripFrequency()}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Frequent Destination:</Text>
                  <Text color="gray.600">{getFrequentDestination()}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Statistics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel>Total Trips</StatLabel>
                  <StatNumber>{Array.isArray(trips) ? trips.length : 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>This Month</StatLabel>
                  <StatNumber>
                    {Array.isArray(trips) ? trips.filter(trip => {
                      const tripDate = new Date(trip.scheduledDate);
                      const now = new Date();
                      return tripDate.getMonth() === now.getMonth() &&
                             tripDate.getFullYear() === now.getFullYear();
                    }).length : 0}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Trips and Complaints Tabs */}
        <Card>
          <CardBody>
            <Tabs colorScheme="pink" variant="enclosed">
              <TabList>
                <Tab>
                  <TimeIcon mr={2} />
                  Upcoming Trips ({Array.isArray(trips) ? trips.filter(trip => {
                    const tripDate = new Date(trip.scheduledDate);
                    return tripDate >= new Date() || ['pending', 'assigned', 'in-progress'].includes(trip.status);
                  }).length : 0})
                </Tab>
                <Tab>
                  <CalendarIcon mr={2} />
                  Past Trips ({Array.isArray(trips) ? trips.filter(trip => {
                    const tripDate = new Date(trip.scheduledDate);
                    return tripDate < new Date() && ['completed', 'cancelled'].includes(trip.status);
                  }).length : 0})
                </Tab>
                <Tab>
                  <SettingsIcon mr={2} />
                  Complaints ({Array.isArray(complaints) ? complaints.length : 0})
                </Tab>
              </TabList>

              <TabPanels>
                {/* Upcoming Trips Tab */}
                <TabPanel>
                  {!Array.isArray(trips) || trips.filter(trip => {
                    const tripDate = new Date(trip.scheduledDate);
                    return tripDate >= new Date() || ['pending', 'assigned', 'in-progress'].includes(trip.status);
                  }).length === 0 ? (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <CalendarIcon boxSize={12} color="gray.400" />
                        <Text color="gray.500">No upcoming trips</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Date & Time</Th>
                            <Th>Pickup</Th>
                            <Th>Dropoff</Th>
                            <Th>Status</Th>
                            <Th>Driver</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {trips
                            .filter(trip => {
                              const tripDate = new Date(trip.scheduledDate);
                              return tripDate >= new Date() || ['pending', 'assigned', 'in-progress'].includes(trip.status);
                            })
                            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                            .map((trip) => (
                            <Tr key={trip._id}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">
                                    {new Date(trip.scheduledDate).toLocaleDateString()}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {trip.scheduledTime}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>{trip.pickupLocation}</Td>
                              <Td>{trip.dropoffLocation}</Td>
                              <Td>
                                <Badge colorScheme={
                                  trip.status === 'pending' ? 'yellow' :
                                  trip.status === 'assigned' ? 'blue' :
                                  trip.status === 'in-progress' ? 'purple' :
                                  trip.status === 'completed' ? 'green' : 'red'
                                }>
                                  {trip.status}
                                </Badge>
                              </Td>
                              <Td>{trip.driverName || 'Not assigned'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </TabPanel>

                {/* Past Trips Tab */}
                <TabPanel>
                  {!Array.isArray(trips) || trips.filter(trip => {
                    const tripDate = new Date(trip.scheduledDate);
                    return tripDate < new Date() && ['completed', 'cancelled'].includes(trip.status);
                  }).length === 0 ? (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <CalendarIcon boxSize={12} color="gray.400" />
                        <Text color="gray.500">No past trips</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Date & Time</Th>
                            <Th>Pickup</Th>
                            <Th>Dropoff</Th>
                            <Th>Status</Th>
                            <Th>Driver</Th>
                            <Th>Cost</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {trips
                            .filter(trip => {
                              const tripDate = new Date(trip.scheduledDate);
                              return tripDate < new Date() && ['completed', 'cancelled'].includes(trip.status);
                            })
                            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
                            .map((trip) => (
                            <Tr key={trip._id}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">
                                    {new Date(trip.scheduledDate).toLocaleDateString()}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {trip.scheduledTime}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>{trip.pickupLocation}</Td>
                              <Td>{trip.dropoffLocation}</Td>
                              <Td>
                                <Badge colorScheme={trip.status === 'completed' ? 'green' : 'red'}>
                                  {trip.status}
                                </Badge>
                              </Td>
                              <Td>{trip.driverName || 'N/A'}</Td>
                              <Td>{trip.cost ? `$${trip.cost}` : 'N/A'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </TabPanel>

                {/* Complaints Tab */}
                <TabPanel>
                  {!Array.isArray(complaints) || complaints.length === 0 ? (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <SettingsIcon boxSize={12} color="green.400" />
                        <Text color="gray.500">No complaints filed</Text>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {complaints.map((complaint, index) => (
                        <Alert key={index} status={complaint.resolved ? 'success' : 'warning'} borderRadius="md">
                          <AlertIcon />
                          <Box flex="1">
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="bold">
                                {complaint.title || 'Complaint'}
                              </Text>
                              <Badge colorScheme={complaint.resolved ? 'green' : 'red'}>
                                {complaint.resolved ? 'Resolved' : 'Open'}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" mb={2}>{complaint.description}</Text>
                            <Text fontSize="xs" color="gray.500">
                              Filed: {new Date(complaint.createdAt).toLocaleDateString()}
                            </Text>
                          </Box>
                        </Alert>
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Rider Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <PlacesAutocomplete
                  value={editForm.address}
                  onChange={(address) => setEditForm({...editForm, address: address})}
                  onSelect={(place) => setEditForm({...editForm, address: place.address})}
                  placeholder="Enter address"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Preferred Vehicle Type</FormLabel>
                <Select
                  value={editForm.preferredVehicleType}
                  onChange={(e) => setEditForm({...editForm, preferredVehicleType: e.target.value})}
                >
                  <option value="">Not specified</option>
                  <option value="standard">Standard</option>
                  <option value="wheelchair-accessible">Wheelchair Accessible</option>
                  <option value="van">Van</option>
                  <option value="luxury">Luxury</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleEdit}
              isLoading={updating}
              loadingText="Updating..."
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Balance Management Modal */}
      <Modal isOpen={isBalanceOpen} onClose={onBalanceClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manage Rider Balance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Add or subtract from the rider's balance. This affects their available trips, dollars, or mileage.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Balance Type</FormLabel>
                  <Select
                    value={balanceForm.type}
                    onChange={(e) => setBalanceForm({...balanceForm, type: e.target.value})}
                  >
                    <option value="trips">Trip Balance</option>
                    <option value="dollars">Dollar Balance</option>
                    <option value="mileage">Mileage Balance</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Operation</FormLabel>
                  <Select
                    value={balanceForm.operation}
                    onChange={(e) => setBalanceForm({...balanceForm, operation: e.target.value})}
                  >
                    <option value="add">Add to Balance</option>
                    <option value="subtract">Subtract from Balance</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>
                  Amount {balanceForm.type === 'dollars' ? '($)' : balanceForm.type === 'mileage' ? '(miles)' : '(trips)'}
                </FormLabel>
                <Input
                  type="number"
                  min="0"
                  step={balanceForm.type === 'dollars' ? '0.01' : '1'}
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm({...balanceForm, amount: parseFloat(e.target.value) || 0})}
                  placeholder={`Enter amount to ${balanceForm.operation}`}
                />
              </FormControl>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    <strong>Current Balance:</strong> {
                      balanceForm.type === 'trips'
                        ? `${rider?.serviceBalance?.tripCount || 0} trips`
                        : balanceForm.type === 'dollars'
                        ? `$${(rider?.serviceBalance?.dollarAmount || 0).toFixed(2)}`
                        : `${rider?.mileageBalance?.currentBalance || 0} miles`
                    }
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBalanceClose}>
              Cancel
            </Button>
            <Button
              colorScheme={balanceForm.operation === 'add' ? 'green' : 'red'}
              leftIcon={balanceForm.operation === 'add' ? <AddIcon /> : <MinusIcon />}
              onClick={handleBalanceUpdate}
              isLoading={balanceUpdating}
              loadingText="Updating..."
            >
              {balanceForm.operation === 'add' ? 'Add' : 'Subtract'} {balanceForm.amount} {balanceForm.type}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RiderProfile;