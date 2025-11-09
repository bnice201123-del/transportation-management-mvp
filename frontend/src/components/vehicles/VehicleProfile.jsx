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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  EditIcon,
  ArrowBackIcon,
  SearchIcon,
  CalendarIcon,
  TimeIcon,
  InfoIcon,
  CheckCircleIcon
} from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const VehicleProfile = () => {
  const [vehicle, setVehicle] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({
    dateFrom: '',
    dateTo: '',
    driver: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  // Edit form state
  const [editForm, setEditForm] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    status: '',
    capacity: '',
    fuelType: '',
    lastServiceDate: '',
    nextServiceDate: '',
    mileage: '',
    notes: ''
  });

  const fetchVehicle = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVehicle(response.data);
      setRideHistory(response.data.trips || []);
      setFilteredHistory(response.data.trips || []);

      // Set edit form data
      setEditForm({
        make: response.data.make || '',
        model: response.data.model || '',
        year: response.data.year || '',
        licensePlate: response.data.licensePlate || '',
        vin: response.data.vin || '',
        color: response.data.color || '',
        status: response.data.status || '',
        capacity: response.data.capacity || '',
        fuelType: response.data.fuelType || '',
        lastServiceDate: response.data.lastServiceDate ? response.data.lastServiceDate.split('T')[0] : '',
        nextServiceDate: response.data.nextServiceDate ? response.data.nextServiceDate.split('T')[0] : '',
        mileage: response.data.mileage || '',
        notes: response.data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, toast, navigate]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  // Filter ride history
  useEffect(() => {
    let filtered = rideHistory;

    if (historyFilter.dateFrom) {
      filtered = filtered.filter(trip =>
        new Date(trip.date) >= new Date(historyFilter.dateFrom)
      );
    }

    if (historyFilter.dateTo) {
      filtered = filtered.filter(trip =>
        new Date(trip.date) <= new Date(historyFilter.dateTo)
      );
    }

    if (historyFilter.driver) {
      filtered = filtered.filter(trip =>
        trip.driver?.name?.toLowerCase().includes(historyFilter.driver.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  }, [rideHistory, historyFilter]);

  const handleEdit = async () => {
    try {
      setUpdating(true);
      await axios.put(`/api/vehicles/${vehicleId}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: 'Vehicle profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchVehicle();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vehicle profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge colorScheme="green">Active</Badge>;
      case 'maintenance':
        return <Badge colorScheme="orange">Maintenance</Badge>;
      case 'out-of-service':
        return <Badge colorScheme="red">Out of Service</Badge>;
      case 'retired':
        return <Badge colorScheme="gray">Retired</Badge>;
      default:
        return <Badge colorScheme="blue">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading vehicle profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (!vehicle) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Text>Vehicle not found</Text>
          <Button onClick={() => navigate('/vehicles')}>Back to Vehicles</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => navigate('/vehicles')}
            mr={4}
            title="Back to Vehicles"
          />
          <Heading size="lg">Vehicle Profile</Heading>
          <Spacer />
          <Button leftIcon={<EditIcon />} colorScheme="blue" onClick={onOpen}>
            Edit Vehicle
          </Button>
        </Flex>

        {/* Vehicle Header */}
        <Card>
          <CardBody>
            <HStack spacing={6}>
              <Box>
                <Heading size="md">{vehicle.year} {vehicle.make} {vehicle.model}</Heading>
                <Text color="gray.600">License Plate: {vehicle.licensePlate}</Text>
                <Text color="gray.600">VIN: {vehicle.vin || 'Not available'}</Text>
                {getStatusBadge(vehicle.status)}
              </Box>
            </HStack>
          </CardBody>
        </Card>

        {/* Vehicle Details */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <CardHeader>
              <Heading size="md">Vehicle Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Make:</Text>
                  <Text>{vehicle.make}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Model:</Text>
                  <Text>{vehicle.model}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Year:</Text>
                  <Text>{vehicle.year}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Color:</Text>
                  <Text>{vehicle.color || 'Not specified'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Capacity:</Text>
                  <Text>{vehicle.capacity || 'Not specified'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Fuel Type:</Text>
                  <Text>{vehicle.fuelType || 'Not specified'}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Service & Maintenance</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="bold">Last Service:</Text>
                  <Text>{formatDate(vehicle.lastServiceDate)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Next Service:</Text>
                  <Text>{formatDate(vehicle.nextServiceDate)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Current Mileage:</Text>
                  <Text>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not recorded'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Text>{getStatusBadge(vehicle.status)}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Current Assignment</Heading>
            </CardHeader>
            <CardBody>
              {vehicle.currentDriver ? (
                <VStack align="start" spacing={3}>
                  <HStack>
                    <InfoIcon />
                    <Text fontWeight="bold">{vehicle.currentDriver.name}</Text>
                  </HStack>
                  <Text>Driver ID: {vehicle.currentDriver.id}</Text>
                  <Text>Assigned: {formatDate(vehicle.assignedDate)}</Text>
                </VStack>
              ) : (
                <Text color="gray.500">Currently unassigned</Text>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Ride History */}
        <Card>
          <CardHeader>
            <Heading size="md">Ride History</Heading>
          </CardHeader>
          <CardBody>
            {/* History Filters */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <FormControl>
                <FormLabel>From Date</FormLabel>
                <Input
                  type="date"
                  value={historyFilter.dateFrom}
                  onChange={(e) => setHistoryFilter({...historyFilter, dateFrom: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>To Date</FormLabel>
                <Input
                  type="date"
                  value={historyFilter.dateTo}
                  onChange={(e) => setHistoryFilter({...historyFilter, dateTo: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Driver Name</FormLabel>
                <Input
                  placeholder="Filter by driver..."
                  value={historyFilter.driver}
                  onChange={(e) => setHistoryFilter({...historyFilter, driver: e.target.value})}
                />
              </FormControl>
            </SimpleGrid>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
              <Center py={8}>
                <Text color="gray.500">No ride history found.</Text>
              </Center>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Driver</Th>
                    <Th>Route</Th>
                    <Th>Status</Th>
                    <Th>Mileage</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredHistory
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((trip, index) => (
                      <Tr key={index}>
                        <Td>{formatDateTime(trip.date)}</Td>
                        <Td>
                          {trip.driver ? (
                            <HStack>
                              <Avatar size="sm" name={trip.driver.name} />
                              <Text>{trip.driver.name}</Text>
                            </HStack>
                          ) : (
                            <Text color="gray.500">Unknown</Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {trip.origin} → {trip.destination}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={trip.status === 'completed' ? 'green' : 'blue'}>
                            {trip.status}
                          </Badge>
                        </Td>
                        <Td>{trip.mileage ? `${trip.mileage} mi` : 'N/A'}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Vehicle Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Make</FormLabel>
                <Input
                  value={editForm.make}
                  onChange={(e) => setEditForm({...editForm, make: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Model</FormLabel>
                <Input
                  value={editForm.model}
                  onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Year</FormLabel>
                <Input
                  value={editForm.year}
                  onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>License Plate</FormLabel>
                <Input
                  value={editForm.licensePlate}
                  onChange={(e) => setEditForm({...editForm, licensePlate: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>VIN</FormLabel>
                <Input
                  value={editForm.vin}
                  onChange={(e) => setEditForm({...editForm, vin: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Color</FormLabel>
                <Input
                  value={editForm.color}
                  onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out-of-service">Out of Service</option>
                  <option value="retired">Retired</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Capacity</FormLabel>
                <Input
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({...editForm, capacity: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Fuel Type</FormLabel>
                <Select
                  value={editForm.fuelType}
                  onChange={(e) => setEditForm({...editForm, fuelType: e.target.value})}
                >
                  <option value="">Select fuel type</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Last Service Date</FormLabel>
                <Input
                  type="date"
                  value={editForm.lastServiceDate}
                  onChange={(e) => setEditForm({...editForm, lastServiceDate: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Next Service Date</FormLabel>
                <Input
                  type="date"
                  value={editForm.nextServiceDate}
                  onChange={(e) => setEditForm({...editForm, nextServiceDate: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Current Mileage</FormLabel>
                <Input
                  type="number"
                  value={editForm.mileage}
                  onChange={(e) => setEditForm({...editForm, mileage: e.target.value})}
                />
              </FormControl>
            </SimpleGrid>
            <FormControl mt={4}>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                rows={3}
              />
            </FormControl>
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

export default VehicleProfile;