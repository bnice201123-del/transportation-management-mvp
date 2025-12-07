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
  Select,
  useToast,
  Spinner,
  Center,
  Avatar,
  Badge,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  CheckIcon,
  CloseIcon
} from '@chakra-ui/icons';
import { FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VehicleAssignment = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch vehicles
      const vehiclesResponse = await axios.get('/api/vehicles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Fetch users with driver role
      const usersResponse = await axios.get('/api/users?role=driver', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setVehicles(vehiclesResponse.data.vehicles || []);
      setDrivers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignDriver = async (vehicleId, driverId) => {
    setAssigning(vehicleId);
    try {
      const response = await axios.post(`/api/vehicles/${vehicleId}/assign-driver`, {
        driverId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Driver assigned successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignDriver = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to unassign this driver?')) {
      return;
    }

    setAssigning(vehicleId);
    try {
      const response = await axios.post(`/api/vehicles/${vehicleId}/unassign-driver`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Driver unassigned successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unassign driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAssigning(null);
    }
  };

  const getAvailableDrivers = () => {
    return drivers.filter(driver => {
      // Driver is available if not assigned to any vehicle
      return !vehicles.some(vehicle => vehicle.currentDriver?._id === driver._id);
    });
  };

  const getAssignedVehicles = () => {
    return vehicles.filter(vehicle => vehicle.currentDriver);
  };

  const getUnassignedVehicles = () => {
    return vehicles.filter(vehicle => !vehicle.currentDriver && vehicle.status === 'active');
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading assignment data...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack>
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={() => navigate('/vehicles')}
                title="Back to Vehicles"
              />
              <Heading size="lg">Vehicle Assignment</Heading>
            </HStack>
          </HStack>

          {/* Summary Cards */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {getAvailableDrivers().length}
                </Text>
                <Text fontSize="sm" color="gray.600">Available Drivers</Text>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {getAssignedVehicles().length}
                </Text>
                <Text fontSize="sm" color="gray.600">Assigned Vehicles</Text>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {getUnassignedVehicles().length}
                </Text>
                <Text fontSize="sm" color="gray.600">Unassigned Vehicles</Text>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {vehicles.length}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Vehicles</Text>
              </CardBody>
            </Card>
          </Grid>

          {/* Assignment Interface */}
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
            {/* Unassigned Vehicles */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md" color="orange.500">Unassigned Vehicles</Heading>
                <Text fontSize="sm" color="gray.600">
                  Vehicles available for driver assignment
                </Text>
              </CardHeader>
              <CardBody>
                {getUnassignedVehicles().length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    All active vehicles are currently assigned.
                  </Alert>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {getUnassignedVehicles().map(vehicle => (
                      <Card key={vehicle._id} size="sm" variant="outline">
                        <CardBody p={3}>
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {vehicle.licensePlate}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </Text>
                              <HStack>
                                <Badge colorScheme="green" size="sm">Active</Badge>
                                <Text fontSize="xs">Capacity: {vehicle.capacity}</Text>
                              </HStack>
                            </VStack>
                            <Select
                              placeholder="Assign Driver"
                              size="sm"
                              maxW="150px"
                              isDisabled={assigning === vehicle._id}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignDriver(vehicle._id, e.target.value);
                                }
                              }}
                            >
                              {getAvailableDrivers().map(driver => (
                                <option key={driver._id} value={driver._id}>
                                  {driver.firstName} {driver.lastName}
                                </option>
                              ))}
                            </Select>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>

            {/* Current Assignments */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md" color="green.500">Current Assignments</Heading>
                <Text fontSize="sm" color="gray.600">
                  Vehicles with assigned drivers
                </Text>
              </CardHeader>
              <CardBody>
                {getAssignedVehicles().length === 0 ? (
                  <Alert status="warning">
                    <AlertIcon />
                    No vehicles are currently assigned to drivers.
                  </Alert>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {getAssignedVehicles().map(vehicle => (
                      <Card key={vehicle._id} size="sm" variant="outline">
                        <CardBody p={3}>
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {vehicle.licensePlate}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </Text>
                              <HStack align="center" spacing={2}>
                                <Avatar
                                  size="xs"
                                  name={`${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}`}
                                />
                                <Text fontSize="xs">
                                  {vehicle.currentDriver.firstName} {vehicle.currentDriver.lastName}
                                </Text>
                              </HStack>
                            </VStack>
                            <IconButton
                              icon={<CloseIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              isDisabled={assigning === vehicle._id}
                              onClick={() => handleUnassignDriver(vehicle._id)}
                              title="Unassign Driver"
                            />
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Grid>

          {/* Assignment History Table */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Assignment Overview</Heading>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Vehicle</Th>
                      <Th>Driver</Th>
                      <Th>Status</Th>
                      <Th>Assigned Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {vehicles.map(vehicle => (
                      <Tr key={vehicle._id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                              {vehicle.licensePlate}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {vehicle.make} {vehicle.model}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          {vehicle.currentDriver ? (
                            <HStack>
                              <Avatar
                                size="xs"
                                name={`${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}`}
                              />
                              <Text fontSize="sm">
                                {vehicle.currentDriver.firstName} {vehicle.currentDriver.lastName}
                              </Text>
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color="gray.500">Unassigned</Text>
                          )}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={vehicle.currentDriver ? 'green' : vehicle.status === 'active' ? 'orange' : 'gray'}
                          >
                            {vehicle.currentDriver ? 'Assigned' : vehicle.status === 'active' ? 'Available' : vehicle.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {vehicle.assignedDate ? new Date(vehicle.assignedDate).toLocaleDateString() : 'N/A'}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default VehicleAssignment;