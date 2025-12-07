import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
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
  Input,
  Select,
  Spinner,
  Center,
  useToast,
  Divider,
  useColorModeValue,
  Avatar,
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
  TableContainer,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  IconButton,
  Flex
} from '@chakra-ui/react';
import {
  EditIcon,
  CheckIcon,
  CloseIcon,
  PhoneIcon,
  CalendarIcon,
  TimeIcon,
  InfoIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaHistory,
  FaWrench,
  FaGasPump,
  FaTachometerAlt,
  FaMapMarkerAlt,
  FaClipboardCheck
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const VehicleProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState({});
  const [trips, setTrips] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [customColorInput, setCustomColorInput] = useState(false);
  
  const { isOpen: isMaintenanceOpen, onOpen: onMaintenanceOpen, onClose: onMaintenanceClose } = useDisclosure();
  const [newMaintenance, setNewMaintenance] = useState({
    type: '',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    nextServiceMileage: ''
  });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Check if user can edit (Admin, Dispatcher, Scheduler)
  const canEdit = user && ['admin', 'dispatcher', 'scheduler'].includes(user.role);

  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch vehicle details
      const vehicleResponse = await axios.get(`/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend returns vehicle directly in data, not nested
      const vehicleData = vehicleResponse.data.vehicle || vehicleResponse.data;
      setVehicle(vehicleData);
      setEditedVehicle(vehicleData);

      // Fetch trips for this vehicle
      const tripsResponse = await axios.get('/api/trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTrips = Array.isArray(tripsResponse.data.trips) 
        ? tripsResponse.data.trips 
        : Array.isArray(tripsResponse.data) 
          ? tripsResponse.data 
          : [];
      const vehicleTrips = allTrips.filter(
        trip => trip.vehicle?._id === id || trip.vehicle === id
      );
      setTrips(vehicleTrips);

      // Set maintenance history from vehicle data
      if (vehicleData?.maintenanceHistory) {
        setMaintenanceHistory(vehicleData.maintenanceHistory);
      }

    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedVehicle({ ...vehicle });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedVehicle({ ...vehicle });
    setCustomColorInput(false);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/vehicles/${id}`,
        editedVehicle,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setVehicle(response.data.vehicle);
        setIsEditing(false);
        setCustomColorInput(false);
        toast({
          title: 'Success',
          description: 'Vehicle updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update vehicle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddMaintenance = async () => {
    try {
      const token = localStorage.getItem('token');
      const maintenanceRecord = {
        ...newMaintenance,
        cost: parseFloat(newMaintenance.cost),
        nextServiceMileage: newMaintenance.nextServiceMileage ? parseInt(newMaintenance.nextServiceMileage) : undefined
      };

      const response = await axios.post(
        `/api/vehicles/${id}/maintenance`,
        maintenanceRecord,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Maintenance record added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewMaintenance({
          type: '',
          description: '',
          cost: '',
          date: new Date().toISOString().split('T')[0],
          nextServiceMileage: ''
        });
        onMaintenanceClose();
        fetchVehicleData();
      }
    } catch (err) {
      console.error('Error adding maintenance:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add maintenance record',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'idle':
        return 'blue';
      case 'maintenance':
        return 'orange';
      case 'out-of-service':
        return 'red';
      case 'retired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Navbar />
        <Center h="80vh">
          <Spinner size="xl" color="orange.500" />
        </Center>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Navbar />
        <Container maxW="container.xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            Vehicle not found
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header Card */}
          <Card bg={cardBg}>
            <CardBody>
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
                <HStack spacing={4} align="flex-start">
                  <Avatar
                    size="xl"
                    name={`${vehicle.make} ${vehicle.model}`}
                    bg="orange.500"
                    icon={<FaCar fontSize="2rem" />}
                  />
                  <VStack align="flex-start" spacing={1}>
                    <Heading size="lg" color="orange.600">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Heading>
                    <Text fontSize="lg" color={textColor}>
                      {vehicle.licensePlate}
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme={getStatusColor(vehicle.status)} fontSize="md">
                        {vehicle.status}
                      </Badge>
                      {vehicle.isWheelchairAccessible && (
                        <Badge colorScheme="blue" fontSize="md">
                          Wheelchair Accessible
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                {canEdit && (
                  <HStack spacing={2}>
                    {!isEditing ? (
                      <Button
                        leftIcon={<EditIcon />}
                        colorScheme="orange"
                        onClick={handleEdit}
                      >
                        Edit Vehicle
                      </Button>
                    ) : (
                      <>
                        <Button
                          leftIcon={<CheckIcon />}
                          colorScheme="green"
                          onClick={handleSave}
                        >
                          Save
                        </Button>
                        <Button
                          leftIcon={<CloseIcon />}
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </HStack>
                )}
              </Flex>
            </CardBody>
          </Card>

          {/* Main Content Tabs */}
          <Tabs colorScheme="orange" variant="enclosed">
            <TabList>
              <Tab><HStack><InfoIcon /><Text>Details</Text></HStack></Tab>
              <Tab><HStack><FaHistory /><Text>Trip History</Text></HStack></Tab>
              <Tab><HStack><FaWrench /><Text>Maintenance</Text></HStack></Tab>
            </TabList>

            <TabPanels>
              {/* Details Tab */}
              <TabPanel>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  {/* Basic Information */}
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="md">Basic Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Make</FormLabel>
                          {isEditing ? (
                            <Input
                              value={editedVehicle.make || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, make: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.make}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Model</FormLabel>
                          {isEditing ? (
                            <Input
                              value={editedVehicle.model || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, model: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.model}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Year</FormLabel>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedVehicle.year || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, year: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.year}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>License Plate</FormLabel>
                          {isEditing ? (
                            <Input
                              value={editedVehicle.licensePlate || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, licensePlate: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.licensePlate}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>VIN</FormLabel>
                          {isEditing ? (
                            <Input
                              value={editedVehicle.vin || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, vin: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.vin || 'N/A'}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Color</FormLabel>
                          {isEditing ? (
                            customColorInput ? (
                              <VStack align="stretch" spacing={2}>
                                <Input
                                  placeholder="Enter custom color"
                                  value={editedVehicle.color || ''}
                                  onChange={(e) => setEditedVehicle({ ...editedVehicle, color: e.target.value })}
                                />
                                <Button
                                  size="sm"
                                  variant="link"
                                  onClick={() => {
                                    setCustomColorInput(false);
                                    setEditedVehicle({ ...editedVehicle, color: '' });
                                  }}
                                >
                                  Back to color list
                                </Button>
                              </VStack>
                            ) : (
                              <Select
                                value={editedVehicle.color || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === 'other') {
                                    setCustomColorInput(true);
                                    setEditedVehicle({ ...editedVehicle, color: '' });
                                  } else {
                                    setEditedVehicle({ ...editedVehicle, color: value });
                                  }
                                }}
                              >
                                <option value="">Select a color</option>
                                <option value="White">White</option>
                                <option value="Black">Black</option>
                                <option value="Silver">Silver</option>
                                <option value="Gray">Gray</option>
                                <option value="Red">Red</option>
                                <option value="Blue">Blue</option>
                                <option value="Green">Green</option>
                                <option value="Yellow">Yellow</option>
                                <option value="Orange">Orange</option>
                                <option value="Brown">Brown</option>
                                <option value="Beige">Beige</option>
                                <option value="Gold">Gold</option>
                                <option value="other">Other (Custom)</option>
                              </Select>
                            )
                          ) : (
                            <Text fontSize="lg">{vehicle.color || 'N/A'}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Tracking Phone</FormLabel>
                          {isEditing ? (
                            <Input
                              type="tel"
                              value={editedVehicle.trackingPhone || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, trackingPhone: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.trackingPhone || 'N/A'}</Text>
                          )}
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Vehicle Specifications */}
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="md">Specifications</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Status</FormLabel>
                          {isEditing ? (
                            <Select
                              value={editedVehicle.status || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, status: e.target.value })}
                            >
                              <option value="active">Active</option>
                              <option value="idle">Idle</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="out-of-service">Out of Service</option>
                              <option value="retired">Retired</option>
                            </Select>
                          ) : (
                            <Badge colorScheme={getStatusColor(vehicle.status)} fontSize="md">
                              {vehicle.status}
                            </Badge>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Passenger Capacity</FormLabel>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedVehicle.capacity || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, capacity: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.capacity} passengers</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Fuel Type</FormLabel>
                          {isEditing ? (
                            <Select
                              value={editedVehicle.fuelType || 'gasoline'}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, fuelType: e.target.value })}
                            >
                              <option value="gasoline">Gasoline</option>
                              <option value="diesel">Diesel</option>
                              <option value="electric">Electric</option>
                              <option value="hybrid">Hybrid</option>
                              <option value="cng">CNG</option>
                            </Select>
                          ) : (
                            <Text fontSize="lg">{vehicle.fuelType || 'Gasoline'}</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Current Mileage</FormLabel>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedVehicle.mileage || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, mileage: e.target.value })}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.mileage?.toLocaleString() || '0'} miles</Text>
                          )}
                        </FormControl>

                        <FormControl>
                          <FormLabel>Current Driver</FormLabel>
                          <Text fontSize="lg">
                            {vehicle.currentDriver 
                              ? `${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}`
                              : 'Unassigned'
                            }
                          </Text>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Notes</FormLabel>
                          {isEditing ? (
                            <Textarea
                              value={editedVehicle.notes || ''}
                              onChange={(e) => setEditedVehicle({ ...editedVehicle, notes: e.target.value })}
                              rows={4}
                            />
                          ) : (
                            <Text fontSize="lg">{vehicle.notes || 'No additional notes'}</Text>
                          )}
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>

                {/* Statistics */}
                <Card bg={cardBg} mt={6}>
                  <CardHeader>
                    <Heading size="md">Statistics</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                      <Stat>
                        <StatLabel>Total Trips</StatLabel>
                        <StatNumber>{trips.length}</StatNumber>
                        <StatHelpText>All time</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Maintenance Records</StatLabel>
                        <StatNumber>{maintenanceHistory.length}</StatNumber>
                        <StatHelpText>All time</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Current Mileage</StatLabel>
                        <StatNumber>{vehicle.mileage?.toLocaleString() || '0'}</StatNumber>
                        <StatHelpText>miles</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Next Service</StatLabel>
                        <StatNumber>
                          {vehicle.nextServiceMileage 
                            ? `${vehicle.nextServiceMileage.toLocaleString()}` 
                            : 'Not set'
                          }
                        </StatNumber>
                        <StatHelpText>miles</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Trip History Tab */}
              <TabPanel>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Trip History</Heading>
                  </CardHeader>
                  <CardBody>
                    {trips.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Rider</Th>
                              <Th>Pickup</Th>
                              <Th>Dropoff</Th>
                              <Th>Driver</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {trips.map((trip) => (
                              <Tr key={trip._id}>
                                <Td>{formatDate(trip.pickupTime)}</Td>
                                <Td>
                                  {trip.rider 
                                    ? `${trip.rider.firstName} ${trip.rider.lastName}`
                                    : 'N/A'
                                  }
                                </Td>
                                <Td>{trip.pickupLocation?.address || 'N/A'}</Td>
                                <Td>{trip.dropoffLocation?.address || 'N/A'}</Td>
                                <Td>
                                  {trip.driver
                                    ? `${trip.driver.firstName} ${trip.driver.lastName}`
                                    : 'Unassigned'
                                  }
                                </Td>
                                <Td>
                                  <Badge colorScheme={
                                    trip.status === 'completed' ? 'green' :
                                    trip.status === 'in-progress' ? 'blue' :
                                    trip.status === 'cancelled' ? 'red' :
                                    'yellow'
                                  }>
                                    {trip.status}
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        No trip history available for this vehicle
                      </Alert>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Maintenance Tab */}
              <TabPanel>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Maintenance History</Heading>
                      {canEdit && (
                        <Button
                          leftIcon={<FaWrench />}
                          colorScheme="orange"
                          onClick={onMaintenanceOpen}
                        >
                          Add Maintenance Record
                        </Button>
                      )}
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {maintenanceHistory.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Type</Th>
                              <Th>Description</Th>
                              <Th>Cost</Th>
                              <Th>Next Service</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {maintenanceHistory.map((record, index) => (
                              <Tr key={index}>
                                <Td>{formatDate(record.date)}</Td>
                                <Td>
                                  <Badge colorScheme="orange">{record.type}</Badge>
                                </Td>
                                <Td>{record.description}</Td>
                                <Td>${record.cost?.toFixed(2) || '0.00'}</Td>
                                <Td>
                                  {record.nextServiceMileage 
                                    ? `${record.nextServiceMileage.toLocaleString()} miles`
                                    : 'N/A'
                                  }
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        No maintenance records available for this vehicle
                      </Alert>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Add Maintenance Modal */}
      <Modal isOpen={isMaintenanceOpen} onClose={onMaintenanceClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Maintenance Record</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Tire Rotation">Tire Rotation</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                  placeholder="Describe the maintenance work performed"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Cost</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })}
                  placeholder="0.00"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, date: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Next Service Mileage (Optional)</FormLabel>
                <Input
                  type="number"
                  value={newMaintenance.nextServiceMileage}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, nextServiceMileage: e.target.value })}
                  placeholder="e.g., 50000"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMaintenanceClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleAddMaintenance}
              isDisabled={!newMaintenance.type || !newMaintenance.description || !newMaintenance.cost}
            >
              Add Record
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VehicleProfilePage;
