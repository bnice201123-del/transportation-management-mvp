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
  Textarea
} from '@chakra-ui/react';
import {
  EditIcon,
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  ArrowRightIcon,
  TimeIcon,
  SettingsIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const RiderProfile = () => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { riderId } = useParams();
  const { user } = useAuth();
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
    if (!rider?.trips || rider.trips.length === 0) return null;
    return rider.trips.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const getUpcomingTrip = () => {
    if (!rider?.trips || rider.trips.length === 0) return null;
    const now = new Date();
    return rider.trips
      .filter(trip => new Date(trip.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  };

  const getTripFrequency = () => {
    if (!rider?.trips || rider.trips.length === 0) return 'No trips';

    const trips = rider.trips.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstTrip = new Date(trips[0].date);
    const lastTrip = new Date(trips[trips.length - 1].date);
    const monthsDiff = (lastTrip.getFullYear() - firstTrip.getFullYear()) * 12 +
                      (lastTrip.getMonth() - firstTrip.getMonth());

    if (monthsDiff <= 0) return `${trips.length} trips`;

    const avgTripsPerMonth = trips.length / monthsDiff;
    if (avgTripsPerMonth >= 2) return 'Frequent';
    if (avgTripsPerMonth >= 1) return 'Regular';
    if (avgTripsPerMonth >= 0.5) return 'Occasional';
    return 'Infrequent';
  };

  const getFrequentDestination = () => {
    if (!rider?.trips || rider.trips.length === 0) return 'N/A';

    const destinations = rider.trips.map(trip => trip.destination).filter(Boolean);
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
            <Button leftIcon={<CalendarIcon />} colorScheme="green" onClick={handleScheduleTrip}>
              Schedule Trip
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
              <Heading size="md">Trip Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Most Recent Trip:</Text>
                  <Text color="gray.600">
                    {recentTrip ? formatDate(recentTrip.date) : 'No trips'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Upcoming Trip:</Text>
                  <Text color="gray.600">
                    {upcomingTrip ? formatDate(upcomingTrip.date) : 'No upcoming trips'}
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
                  <StatNumber>{rider.trips?.length || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>This Month</StatLabel>
                  <StatNumber>
                    {rider.trips?.filter(trip => {
                      const tripDate = new Date(trip.date);
                      const now = new Date();
                      return tripDate.getMonth() === now.getMonth() &&
                             tripDate.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Recent Trips */}
        {rider.trips && rider.trips.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">Recent Trips</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {rider.trips
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .map((trip, index) => (
                    <HStack key={index} w="full" justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{formatDate(trip.date)}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {trip.origin} → {trip.destination}
                        </Text>
                      </VStack>
                      <Badge colorScheme={trip.status === 'completed' ? 'green' : 'blue'}>
                        {trip.status}
                      </Badge>
                    </HStack>
                  ))}
              </VStack>
            </CardBody>
          </Card>
        )}
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
                <Textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
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
    </Container>
  );
};

export default RiderProfile;