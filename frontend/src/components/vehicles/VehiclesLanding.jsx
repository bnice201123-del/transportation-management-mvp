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
  Badge,
  Avatar,
  Grid,
  GridItem,
  SimpleGrid,
  Flex,
  Spacer,
  IconButton,
  useToast,
  Spinner,
  Center,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  ViewIcon,
  SettingsIcon,
  WarningIcon,
  CheckCircleIcon,
  TimeIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VehicleQuickView from '../shared/VehicleQuickView';

const VehiclesLanding = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [makeFilter, setMakeFilter] = useState('all');
  const navigate = useNavigate();
  const toast = useToast();

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vehicles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          make: makeFilter === 'all' ? undefined : makeFilter,
          search: searchTerm || undefined
        }
      });
      setVehicles(response.data.vehicles);
      setFilteredVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicles',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, makeFilter, searchTerm]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Apply filters
  useEffect(() => {
    let filtered = vehicles;

    // Search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(vehicle =>
        `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Make filter
    if (makeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.make === makeFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter, makeFilter]);

  const handleViewProfile = (vehicleId) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const handleAddVehicle = () => {
    navigate('/vehicles/new');
  };

  const handleVehicleAssignment = () => {
    navigate('/vehicles/assignment');
  };

  const handleOutOfService = () => {
    navigate('/vehicles/out-of-service');
  };

  const handleVehicleLog = () => {
    navigate('/vehicles/log');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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

  const getUniqueMakes = () => {
    const makes = [...new Set(vehicles.map(vehicle => vehicle.make))];
    return makes.filter(Boolean);
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading vehicles...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
          <CardBody>
            <VStack align="start" spacing={3}>
              <Heading size="lg" color="blue.700">
                Vehicle Management
              </Heading>
              <Text color="gray.600">
                Manage all vehicles in the transportation fleet. View profiles, track maintenance, and assign vehicles.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="lg"
            onClick={handleAddVehicle}
          >
            Add Vehicle
          </Button>
          <Button
            leftIcon={<SettingsIcon />}
            colorScheme="purple"
            size="lg"
            variant="outline"
            onClick={handleVehicleAssignment}
          >
            Vehicle Assignment
          </Button>
          <Button
            leftIcon={<WarningIcon />}
            colorScheme="orange"
            size="lg"
            variant="outline"
            onClick={handleOutOfService}
          >
            Out of Service
          </Button>
          <Button
            leftIcon={<CalendarIcon />}
            colorScheme="green"
            size="lg"
            variant="outline"
            onClick={handleVehicleLog}
          >
            Vehicle Log
          </Button>
        </SimpleGrid>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Vehicles</StatLabel>
                <StatNumber>{vehicles.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active</StatLabel>
                <StatNumber>
                  {vehicles.filter(v => v.status === 'active').length}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>In Maintenance</StatLabel>
                <StatNumber>
                  {vehicles.filter(v => v.status === 'maintenance').length}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Filtered Results</StatLabel>
                <StatNumber>{filteredVehicles.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardHeader>
            <Heading size="md">Filters</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search by make, model, or license plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
                <option value="retired">Retired</option>
              </Select>

              <Select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)}>
                <option value="all">All Makes</option>
                {getUniqueMakes().map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </Select>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Vehicles Display - Responsive */}
        <Card>
          <CardHeader>
            <Heading size="md">Vehicles</Heading>
          </CardHeader>
          <CardBody>
            {filteredVehicles.length === 0 ? (
              <Center py={8}>
                <VStack spacing={4}>
                  <Text color="gray.500">No vehicles found matching your criteria.</Text>
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddVehicle}>
                    Add New Vehicle
                  </Button>
                </VStack>
              </Center>
            ) : (
              <>
                {/* Desktop Table View */}
                <Box display={{ base: "none", md: "block" }}>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Vehicle</Th>
                        <Th>License Plate</Th>
                        <Th>Status</Th>
                        <Th>Last Service</Th>
                        <Th>Current Driver</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredVehicles.map((vehicle) => (
                        <Tr key={vehicle._id}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <VehicleQuickView vehicle={vehicle}>
                                <Text fontWeight="bold">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </Text>
                              </VehicleQuickView>
                              <Text fontSize="sm" color="gray.600">
                                VIN: {vehicle.vin || 'N/A'}
                              </Text>
                            </VStack>
                          </Td>
                          <Td fontWeight="bold">{vehicle.licensePlate}</Td>
                          <Td>{getStatusBadge(vehicle.status)}</Td>
                          <Td>{formatDate(vehicle.lastServiceDate)}</Td>
                          <Td>
                            {vehicle.currentDriver ? (
                              <HStack>
                                <Avatar size="sm" name={vehicle.currentDriver.name} />
                                <Text>{vehicle.currentDriver.name}</Text>
                              </HStack>
                            ) : (
                              <Text color="gray.500">Unassigned</Text>
                            )}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                size="sm"
                                icon={<ViewIcon />}
                                onClick={() => handleViewProfile(vehicle._id)}
                                title="View Profile"
                              />
                              <IconButton
                                size="sm"
                                icon={<EditIcon />}
                                onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
                                title="Edit Vehicle"
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Mobile Card View */}
                <Box display={{ base: "block", md: "none" }}>
                  <VStack spacing={4}>
                    {filteredVehicles.map((vehicle) => (
                      <Card key={vehicle._id} width="100%" shadow="sm" borderRadius="lg">
                        <CardBody p={4}>
                          <Flex justify="space-between" align="start" mb={3}>
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontWeight="bold" fontSize="lg">{vehicle.licensePlate}</Text>
                              <VehicleQuickView vehicle={vehicle}>
                                <Text fontSize="sm" color="gray.600">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </Text>
                              </VehicleQuickView>
                              {getStatusBadge(vehicle.status)}
                            </VStack>
                            <HStack spacing={2}>
                              <IconButton
                                size="sm"
                                icon={<ViewIcon />}
                                onClick={() => handleViewProfile(vehicle._id)}
                                title="View Profile"
                              />
                              <IconButton
                                size="sm"
                                icon={<EditIcon />}
                                onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
                                title="Edit Vehicle"
                              />
                            </HStack>
                          </Flex>

                          <Grid templateColumns="repeat(2, 1fr)" gap={3} fontSize="sm">
                            <VStack align="start" spacing={1}>
                              <Text color="gray.500">VIN</Text>
                              <Text fontWeight="medium">{vehicle.vin || 'N/A'}</Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                              <Text color="gray.500">Last Service</Text>
                              <Text fontWeight="medium">{formatDate(vehicle.lastServiceDate)}</Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                              <Text color="gray.500">Driver</Text>
                              <Text fontWeight="medium">
                                {vehicle.currentDriver?.name || 'Unassigned'}
                              </Text>
                            </VStack>
                            <VStack align="start" spacing={1}>
                              <Text color="gray.500">Capacity</Text>
                              <Text fontWeight="medium">{vehicle.capacity || 'N/A'}</Text>
                            </VStack>
                          </Grid>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default VehiclesLanding;