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
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Center,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  useColorModeValue,
  Progress,
  Switch
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  TimeIcon,
  DownloadIcon,
  ChevronDownIcon,
  InfoIcon,
  WarningIcon,
  CheckIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaUsers,
  FaHistory,
  FaChartLine,
  FaFilter,
  FaDownload,
  FaPlus,
  FaClock,
  FaMapMarkerAlt,
  FaWrench,
  FaGasPump,
  FaTachometerAlt,
  FaClipboardCheck,
  FaUserTie
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // Now using real API
import Navbar from '../shared/Navbar';

const ComprehensiveVehicleDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // New vehicle form states
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    status: 'active',
    capacity: '',
    fuelType: 'gasoline',
    mileage: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Modal states
  const { isOpen: isNewVehicleOpen, onOpen: onNewVehicleOpen, onClose: onNewVehicleClose } = useDisclosure();
  const { isOpen: isEditVehicleOpen, onOpen: onEditVehicleOpen, onClose: onEditVehicleClose } = useDisclosure();

  // Color scheme - Orange for vehicles to match Operations menu
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch vehicles from API
      const vehiclesResponse = await axios.get('/api/vehicles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setVehicles(vehiclesResponse.data.vehicles || []);

      // For now, maintenance records will be fetched from vehicle maintenance history
      // This can be expanded when a dedicated maintenance API is added
      const allMaintenanceRecords = [];
      vehiclesResponse.data.vehicles?.forEach(vehicle => {
        if (vehicle.maintenanceHistory && vehicle.maintenanceHistory.length > 0) {
          vehicle.maintenanceHistory.forEach(record => {
            allMaintenanceRecords.push({
              _id: record._id,
              vehicleId: vehicle._id,
              vehiclePlate: vehicle.licensePlate,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              ...record
            });
          });
        }
      });

      setMaintenanceRecords(allMaintenanceRecords);

    } catch (err) {
      console.error('Error fetching data:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch vehicle data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check URL parameters for initial tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'maintenance') {
      setActiveTab(2);
    } else if (params.get('tab') === 'logs') {
      setActiveTab(2); // Maintenance History includes logs
    }
  }, [location]);

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' || 
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || (vehicle.status || 'inactive') === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Filter maintenance records
  const filteredMaintenance = maintenanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;

    return true;
  });

  // Statistics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(vehicle => (vehicle.status || 'inactive') === 'active').length;
  const maintenanceVehicles = vehicles.filter(vehicle => (vehicle.status || 'inactive') === 'maintenance').length;
  const avgFuelLevel = vehicles.reduce((sum, vehicle) => sum + (vehicle.fuelLevel || 0), 0) / vehicles.length;

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'maintenance':
        return 'orange';
      case 'inactive':
        return 'red';
      case 'out-of-service':
        return 'gray';
      case 'completed':
        return 'blue';
      case 'in-progress':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getFuelLevelColor = (fuelLevel) => {
    if (fuelLevel >= 70) return 'green';
    if (fuelLevel >= 30) return 'yellow';
    return 'red';
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!newVehicle.make.trim()) errors.make = 'Make is required';
    if (!newVehicle.model.trim()) errors.model = 'Model is required';
    if (!newVehicle.year) errors.year = 'Year is required';
    else if (parseInt(newVehicle.year) < 1900 || parseInt(newVehicle.year) > new Date().getFullYear() + 1) {
      errors.year = 'Please enter a valid year';
    }
    if (!newVehicle.licensePlate.trim()) errors.licensePlate = 'License plate is required';
    if (newVehicle.capacity && (parseInt(newVehicle.capacity) < 1 || parseInt(newVehicle.capacity) > 100)) {
      errors.capacity = 'Capacity must be between 1 and 100';
    }
    if (newVehicle.mileage && parseInt(newVehicle.mileage) < 0) {
      errors.mileage = 'Mileage cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle new vehicle creation
  const handleCreateVehicle = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleData = {
        ...newVehicle,
        year: parseInt(newVehicle.year),
        capacity: newVehicle.capacity ? parseInt(newVehicle.capacity) : undefined,
        mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : undefined
      };

      const response = await axios.post('/api/vehicles', vehicleData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} added successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewVehicle({
          make: '',
          model: '',
          year: '',
          licensePlate: '',
          vin: '',
          color: '',
          status: 'active',
          capacity: '',
          fuelType: 'gasoline',
          mileage: '',
          notes: ''
        });
        setFormErrors({});
        onNewVehicleClose();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating vehicle:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create vehicle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewVehicleProfile = (vehicle) => {
    navigate(`/vehicles/${vehicle._id}`);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      color: vehicle.color,
      status: vehicle.status,
      capacity: vehicle.capacity.toString(),
      fuelType: vehicle.fuelType,
      mileage: vehicle.mileage.toString(),
      notes: vehicle.notes || ''
    });
    onEditVehicleOpen();
  };

  const handleUpdateVehicle = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleData = {
        ...newVehicle,
        year: parseInt(newVehicle.year),
        capacity: newVehicle.capacity ? parseInt(newVehicle.capacity) : undefined,
        mileage: newVehicle.mileage ? parseInt(newVehicle.mileage) : undefined
      };

      const response = await axios.put(`/api/vehicles/${selectedVehicle._id}`, vehicleData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Vehicle updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditVehicleClose();
        fetchData();
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update vehicle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/vehicles/${vehicleId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        toast({
          title: 'Success',
          description: 'Vehicle deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to delete vehicle',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Navbar title="Vehicle Management" />
        <Center h="50vh">
          <Spinner size="xl" color="orange.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Vehicle Management" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Welcome Header */}
            <Box textAlign="center" py={{ base: 4, md: 6 }}>
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                color="orange.600" 
                mb={2}
              >
                Fleet Management Center
              </Heading>
              <Text 
                color={textColor} 
                fontSize={{ base: "md", md: "lg" }}
              >
                Manage vehicles, track maintenance, and monitor fleet performance
              </Text>
            </Box>

            {/* Quick Stats Cards */}
            <Grid 
              templateColumns={{ 
                base: "repeat(2, 1fr)", 
                md: "repeat(4, 1fr)" 
              }} 
              gap={{ base: 4, md: 6 }}
              mb={{ base: 4, md: 6 }}
            >
              <Card bg={cardBg} shadow="md">
                <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                  <VStack spacing={2}>
                    <Text 
                      fontSize={{ base: "2xl", md: "3xl" }} 
                      fontWeight="bold" 
                      color="orange.500"
                    >
                      {totalVehicles}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Total Vehicles
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="md">
                <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                  <VStack spacing={2}>
                    <Text 
                      fontSize={{ base: "2xl", md: "3xl" }} 
                      fontWeight="bold" 
                      color="green.500"
                    >
                      {activeVehicles}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Active Fleet
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="md">
                <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                  <VStack spacing={2}>
                    <Text 
                      fontSize={{ base: "2xl", md: "3xl" }} 
                      fontWeight="bold" 
                      color="red.500"
                    >
                      {maintenanceVehicles}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      In Maintenance
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} shadow="md">
                <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                  <VStack spacing={2}>
                    <Text 
                      fontSize={{ base: "2xl", md: "3xl" }} 
                      fontWeight="bold" 
                      color="blue.500"
                    >
                      {Math.round(avgFuelLevel)}%
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Avg. Fuel Level
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>

            {/* Enhanced Tabbed Interface - Mobile-First Design */}
            <Card bg={cardBg} shadow="lg" mb={{ base: 6, md: 8 }}>
              <CardBody p={0}>
                <Tabs 
                  index={activeTab} 
                  onChange={setActiveTab} 
                  variant="enclosed" 
                  colorScheme="orange"
                >
                  <TabList 
                    flexWrap="wrap"
                    borderBottom="2px solid"
                    borderColor="gray.200"
                    bg="gray.50"
                  >
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      🏠 Dashboard
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      🚗 All Vehicles
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      🔧 Maintenance
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      ➕ New Vehicle
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      📈 Analytics
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "orange.600", 
                        borderColor: "orange.500",
                        bg: "white"
                      }}
                    >
                      ⚙️ Settings
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Dashboard Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap">
                          <Heading size="md" color="orange.600">
                            Fleet Overview
                          </Heading>
                          <Button
                            leftIcon={<FaPlus />}
                            colorScheme="orange"
                            onClick={() => setActiveTab(3)}
                            size={{ base: "sm", md: "md" }}
                          >
                            Add New Vehicle
                          </Button>
                        </HStack>

                        {/* Fleet Status Cards */}
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          <Card variant="outline">
                            <CardHeader>
                              <HStack>
                                <FaCar color="orange" />
                                <Heading size="sm">Fleet Status</Heading>
                              </HStack>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                {vehicles.slice(0, 5).map((vehicle) => (
                                  <HStack key={vehicle._id} justify="space-between" p={3} bg="gray.50" rounded="md">
                                    <HStack>
                                      <FaCar color="orange" />
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="bold">
                                          {vehicle.licensePlate}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {vehicle.make} {vehicle.model}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme={getStatusColor(vehicle.status || 'inactive')}>
                                      {vehicle.status || 'inactive'}
                                    </Badge>
                                  </HStack>
                                ))}
                              </VStack>
                            </CardBody>
                          </Card>

                          <Card variant="outline">
                            <CardHeader>
                              <HStack>
                                <FaWrench color="orange" />
                                <Heading size="sm">Recent Maintenance</Heading>
                              </HStack>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                {maintenanceRecords.slice(0, 5).map((record) => (
                                  <HStack key={record._id} justify="space-between" p={3} bg="gray.50" rounded="md">
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="bold">
                                        {record.vehiclePlate}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {record.type}
                                      </Text>
                                    </VStack>
                                    <Badge colorScheme={getStatusColor(record.status || 'pending')}>
                                      {record.status || 'pending'}
                                    </Badge>
                                  </HStack>
                                ))}
                              </VStack>
                            </CardBody>
                          </Card>
                        </SimpleGrid>

                        {/* Quick Actions */}
                        <Card>
                          <CardHeader>
                            <Heading size="md" color="orange.600">Quick Actions</Heading>
                          </CardHeader>
                          <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                              <Button
                                leftIcon={<FaCar />}
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => setActiveTab(1)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                View All Vehicles
                              </Button>
                              <Button
                                leftIcon={<FaWrench />}
                                colorScheme="yellow"
                                variant="outline"
                                onClick={() => setActiveTab(2)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                Maintenance Log
                              </Button>
                              <Button
                                leftIcon={<FaChartLine />}
                                colorScheme="purple"
                                variant="outline"
                                onClick={() => setActiveTab(4)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                Fleet Analytics
                              </Button>
                            </Grid>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* All Vehicles Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        {/* Search and Filter Controls */}
                        <Card>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <HStack spacing={4} flexWrap="wrap">
                                <InputGroup flex="1" minW="200px">
                                  <InputLeftElement>
                                    <SearchIcon color="gray.400" />
                                  </InputLeftElement>
                                  <Input
                                    placeholder="Search vehicles by plate, make, model, or VIN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                </InputGroup>
                                <Select 
                                  placeholder="Filter by status" 
                                  maxW="200px"
                                  value={filterStatus}
                                  onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                  <option value="all">All Status</option>
                                  <option value="active">Active</option>
                                  <option value="maintenance">Maintenance</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="out-of-service">Out of Service</option>
                                </Select>
                                <Button
                                  leftIcon={<AddIcon />}
                                  colorScheme="orange"
                                  onClick={onNewVehicleOpen}
                                >
                                  Add Vehicle
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Vehicles Table */}
                        <Card>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Vehicle</Th>
                                    <Th>Status & Features</Th>
                                    <Th display={{ base: "none", md: "table-cell" }}>Driver</Th>
                                    <Th display={{ base: "none", lg: "table-cell" }}>Fuel</Th>
                                    <Th display={{ base: "none", lg: "table-cell" }}>Service</Th>
                                    <Th>Actions</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {filteredVehicles.map((vehicle) => (
                                    <Tr key={vehicle._id}>
                                      <Td>
                                        <HStack>
                                          <FaCar color="orange" size={20} />
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="sm">
                                              {vehicle.licensePlate}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                              {vehicle.year} {vehicle.make} {vehicle.model}
                                            </Text>
                                            <Text fontSize="xs" color="gray.400">
                                              {vehicle.mileage?.toLocaleString()} miles
                                            </Text>
                                          </VStack>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <VStack align="start" spacing={1}>
                                          <Badge colorScheme={getStatusColor(vehicle.status || 'inactive')}>
                                            {vehicle.status || 'inactive'}
                                          </Badge>
                                          <HStack spacing={1}>
                                            <Text fontSize="xs">👥 {vehicle.capacity}</Text>
                                            {vehicle.wheelchairAccessible && (
                                              <Text fontSize="xs">♿</Text>
                                            )}
                                          </HStack>
                                        </VStack>
                                      </Td>
                                      <Td display={{ base: "none", md: "table-cell" }}>
                                        {vehicle.assignedDriver ? (
                                          <HStack>
                                            <Avatar size="xs" name={typeof vehicle.assignedDriver === 'object' 
                                              ? (vehicle.assignedDriver.name || `${vehicle.assignedDriver.firstName || ''} ${vehicle.assignedDriver.lastName || ''}`.trim() || vehicle.assignedDriver.email || 'Unnamed Driver')
                                              : vehicle.assignedDriver
                                            } bg="orange.500" />
                                            <Text fontSize="sm">
                                              {typeof vehicle.assignedDriver === 'object' 
                                                ? (vehicle.assignedDriver.name || `${vehicle.assignedDriver.firstName || ''} ${vehicle.assignedDriver.lastName || ''}`.trim() || vehicle.assignedDriver.email || 'Unnamed Driver')
                                                : vehicle.assignedDriver
                                              }
                                            </Text>
                                          </HStack>
                                        ) : (
                                          <Text fontSize="sm" color="gray.500">Unassigned</Text>
                                        )}
                                      </Td>
                                      <Td display={{ base: "none", lg: "table-cell" }}>
                                        <VStack align="start" spacing={1}>
                                          <Progress 
                                            value={vehicle.fuelLevel} 
                                            colorScheme={getFuelLevelColor(vehicle.fuelLevel)}
                                            size="sm" 
                                            width="60px" 
                                          />
                                          <Text fontSize="xs">{vehicle.fuelLevel}%</Text>
                                        </VStack>
                                      </Td>
                                      <Td display={{ base: "none", lg: "table-cell" }}>
                                        <Text fontSize="xs">
                                          {formatDate(vehicle.nextService)}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <Menu>
                                          <MenuButton
                                            as={IconButton}
                                            icon={<ChevronDownIcon />}
                                            variant="ghost"
                                            size="sm"
                                          />
                                          <MenuList>
                                            <MenuItem
                                              icon={<ViewIcon />}
                                              onClick={() => handleViewVehicleProfile(vehicle)}
                                            >
                                              View Profile
                                            </MenuItem>
                                            <MenuItem
                                              icon={<EditIcon />}
                                              onClick={() => handleEditVehicle(vehicle)}
                                            >
                                              Edit Vehicle
                                            </MenuItem>
                                            <MenuItem
                                              icon={<FaUserTie />}
                                              onClick={() => navigate('/vehicles/assign', { state: { vehicle } })}
                                            >
                                              Assign Driver
                                            </MenuItem>
                                            <MenuItem
                                              icon={<FaWrench />}
                                              onClick={() => navigate('/vehicles/maintenance', { state: { vehicle } })}
                                            >
                                              Schedule Maintenance
                                            </MenuItem>
                                            <Divider />
                                            <MenuItem
                                              icon={<DeleteIcon />}
                                              color="red.500"
                                              onClick={() => handleDeleteVehicle(vehicle._id)}
                                            >
                                              Delete Vehicle
                                            </MenuItem>
                                          </MenuList>
                                        </Menu>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                            {filteredVehicles.length === 0 && (
                              <Center py={8}>
                                <VStack spacing={4}>
                                  <FaCar size={48} color="gray" />
                                  <Text color="gray.500" fontSize="lg">
                                    No vehicles found
                                  </Text>
                                  <Text color="gray.400" fontSize="sm" textAlign="center">
                                    {searchTerm ? 'Try adjusting your search criteria' : 'Add your first vehicle to get started'}
                                  </Text>
                                </VStack>
                              </Center>
                            )}
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Maintenance History Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap">
                          <Heading size="md" color="orange.600">
                            Maintenance History ({filteredMaintenance.length} records)
                          </Heading>
                          <HStack spacing={2}>
                            <Input 
                              type="date" 
                              size="sm" 
                              maxW="150px"
                              value={filterStartDate}
                              onChange={(e) => setFilterStartDate(e.target.value)}
                            />
                            <Text fontSize="sm">to</Text>
                            <Input 
                              type="date" 
                              size="sm" 
                              maxW="150px"
                              value={filterEndDate}
                              onChange={(e) => setFilterEndDate(e.target.value)}
                            />
                            <Button 
                              leftIcon={<FaFilter />}
                              colorScheme="orange"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFilterStartDate('');
                                setFilterEndDate('');
                              }}
                            >
                              Clear
                            </Button>
                          </HStack>
                        </HStack>

                        {/* Maintenance Stats */}
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Completed</StatLabel>
                            <StatNumber color="green.500">
                              {maintenanceRecords.filter(record => (record.status || 'pending') === 'completed').length}
                            </StatNumber>
                            <StatHelpText>Maintenance tasks</StatHelpText>
                          </Stat>
                          
                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>In Progress</StatLabel>
                            <StatNumber color="yellow.500">
                              {maintenanceRecords.filter(record => (record.status || 'pending') === 'in-progress').length}
                            </StatNumber>
                            <StatHelpText>Active work</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Total Cost</StatLabel>
                            <StatNumber color="blue.500">
                              ${maintenanceRecords.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}
                            </StatNumber>
                            <StatHelpText>This period</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Avg. Cost</StatLabel>
                            <StatNumber color="purple.500">
                              ${maintenanceRecords.length > 0 ? 
                                (maintenanceRecords.reduce((sum, record) => sum + record.cost, 0) / maintenanceRecords.length).toFixed(2) : 
                                '0.00'}
                            </StatNumber>
                            <StatHelpText>Per maintenance</StatHelpText>
                          </Stat>
                        </SimpleGrid>

                        {/* Maintenance History Table */}
                        <Card>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Date</Th>
                                    <Th>Vehicle</Th>
                                    <Th>Type</Th>
                                    <Th display={{ base: "none", md: "table-cell" }}>Mileage</Th>
                                    <Th display={{ base: "none", lg: "table-cell" }}>Cost</Th>
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {filteredMaintenance.map((record) => (
                                    <Tr key={record._id}>
                                      <Td>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {formatDate(record.date)}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm" fontWeight="bold">
                                            {record.vehiclePlate}
                                          </Text>
                                        </VStack>
                                      </Td>
                                      <Td>
                                        <Text fontSize="sm">{record.type}</Text>
                                      </Td>
                                      <Td display={{ base: "none", md: "table-cell" }}>
                                        <Text fontSize="sm">{record.mileage?.toLocaleString()}</Text>
                                      </Td>
                                      <Td display={{ base: "none", lg: "table-cell" }}>
                                        <Text fontSize="sm" fontWeight="medium" color="green.600">
                                          ${record.cost}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <Badge 
                                          colorScheme={getStatusColor(record.status)} 
                                          fontSize="xs"
                                        >
                                          {record.status ? record.status.replace('-', ' ').toUpperCase() : 'N/A'}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <HStack spacing={1}>
                                          <IconButton
                                            icon={<ViewIcon />}
                                            size="xs"
                                            colorScheme="orange"
                                            variant="outline"
                                            aria-label="View details"
                                          />
                                          <IconButton
                                            icon={<EditIcon />}
                                            size="xs"
                                            colorScheme="blue"
                                            variant="outline"
                                            aria-label="Edit record"
                                          />
                                        </HStack>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* New Vehicle Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="orange.600">
                          Add New Vehicle to Fleet
                        </Heading>

                        <Card>
                          <CardBody>
                            <VStack spacing={6} align="stretch">
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <FormControl isRequired>
                                  <FormLabel>Make</FormLabel>
                                  <Input
                                    placeholder="e.g., Ford, Chevrolet, Toyota"
                                    value={newVehicle.make}
                                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel>Model</FormLabel>
                                  <Input
                                    placeholder="e.g., Transit, Express, Sienna"
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel>Year</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 2023"
                                    value={newVehicle.year}
                                    onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel>License Plate</FormLabel>
                                  <Input
                                    placeholder="e.g., ABC-123"
                                    value={newVehicle.licensePlate}
                                    onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel>VIN</FormLabel>
                                  <Input
                                    placeholder="Vehicle Identification Number"
                                    value={newVehicle.vin}
                                    onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl>
                                  <FormLabel>Color</FormLabel>
                                  <Input
                                    placeholder="e.g., White, Silver, Blue"
                                    value={newVehicle.color}
                                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl isRequired>
                                  <FormLabel>Passenger Capacity</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 8"
                                    value={newVehicle.capacity}
                                    onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                                  />
                                </FormControl>

                                <FormControl>
                                  <FormLabel>Fuel Type</FormLabel>
                                  <Select 
                                    value={newVehicle.fuelType}
                                    onChange={(e) => setNewVehicle({...newVehicle, fuelType: e.target.value})}
                                  >
                                    <option value="gasoline">Gasoline</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="electric">Electric</option>
                                  </Select>
                                </FormControl>
                              </SimpleGrid>

                              <FormControl>
                                <FormLabel>Current Mileage</FormLabel>
                                <Input
                                  type="number"
                                  placeholder="Current odometer reading"
                                  value={newVehicle.mileage}
                                  onChange={(e) => setNewVehicle({...newVehicle, mileage: e.target.value})}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel>Notes</FormLabel>
                                <Textarea
                                  placeholder="Additional notes about the vehicle"
                                  value={newVehicle.notes}
                                  onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                                  rows={4}
                                />
                              </FormControl>

                              <HStack justify="end" spacing={4}>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setNewVehicle({
                                      make: '',
                                      model: '',
                                      year: '',
                                      licensePlate: '',
                                      vin: '',
                                      color: '',
                                      status: 'active',
                                      capacity: '',
                                      fuelType: 'gasoline',
                                      mileage: '',
                                      notes: ''
                                    });
                                  }}
                                >
                                  Clear Form
                                </Button>
                                <Button
                                  colorScheme="orange"
                                  onClick={handleCreateVehicle}
                                  isDisabled={!newVehicle.make || !newVehicle.model || !newVehicle.year || !newVehicle.licensePlate || !newVehicle.vin}
                                >
                                  Add Vehicle
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Analytics Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="orange.600">
                          Fleet Analytics & Performance
                        </Heading>

                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          {/* Fleet Performance */}
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Fleet Performance</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Stat>
                                  <StatLabel>Total Fleet Mileage</StatLabel>
                                  <StatNumber color="blue.500">
                                    {vehicles.reduce((sum, vehicle) => sum + (vehicle.mileage || 0), 0).toLocaleString()}
                                  </StatNumber>
                                  <StatHelpText>
                                    Across all vehicles
                                  </StatHelpText>
                                </Stat>

                                <Divider />

                                <Stat>
                                  <StatLabel>Utilization Rate</StatLabel>
                                  <StatNumber color="green.500">
                                    {Math.round((activeVehicles / totalVehicles) * 100)}%
                                  </StatNumber>
                                  <StatHelpText>
                                    Active vehicles ratio
                                  </StatHelpText>
                                </Stat>
                              </VStack>
                            </CardBody>
                          </Card>

                          {/* Maintenance Insights */}
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Maintenance Insights</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Stat>
                                  <StatLabel>Maintenance Cost (Total)</StatLabel>
                                  <StatNumber color="red.500">
                                    ${maintenanceRecords.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}
                                  </StatNumber>
                                  <StatHelpText>
                                    All maintenance work
                                  </StatHelpText>
                                </Stat>

                                <Divider />

                                <Stat>
                                  <StatLabel>Vehicles Needing Service</StatLabel>
                                  <StatNumber color="orange.500">
                                    {vehicles.filter(vehicle => {
                                      const serviceDate = new Date(vehicle.nextService);
                                      const today = new Date();
                                      const daysUntilService = Math.floor((serviceDate - today) / (1000 * 60 * 60 * 24));
                                      return daysUntilService <= 30;
                                    }).length}
                                  </StatNumber>
                                  <StatHelpText>
                                    Service due within 30 days
                                  </StatHelpText>
                                </Stat>
                              </VStack>
                            </CardBody>
                          </Card>
                        </SimpleGrid>

                        {/* Vehicle Performance Table */}
                        <Card>
                          <CardHeader>
                            <Heading size="sm">Vehicle Performance Summary</Heading>
                          </CardHeader>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Vehicle</Th>
                                    <Th>Mileage</Th>
                                    <Th>Fuel Level</Th>
                                    <Th>Next Service</Th>
                                    <Th>Status</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {vehicles.map((vehicle) => (
                                    <Tr key={vehicle._id}>
                                      <Td>
                                        <HStack>
                                          <FaCar color="orange" size={16} />
                                          <Text fontSize="sm" fontWeight="medium">
                                            {vehicle.licensePlate}
                                          </Text>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <Text fontSize="sm">
                                          {vehicle.mileage?.toLocaleString()}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <HStack>
                                          <Progress 
                                            value={vehicle.fuelLevel} 
                                            colorScheme={getFuelLevelColor(vehicle.fuelLevel)}
                                            size="sm" 
                                            width="50px" 
                                          />
                                          <Text fontSize="xs">{vehicle.fuelLevel}%</Text>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <Text fontSize="sm">
                                          {formatDate(vehicle.nextService)}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <Badge colorScheme={getStatusColor(vehicle.status || 'inactive')}>
                                          {vehicle.status || 'inactive'}
                                        </Badge>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Settings Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="orange.600">
                          Fleet Management Settings
                        </Heading>

                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Export Options</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Button
                                  leftIcon={<FaDownload />}
                                  colorScheme="orange"
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: 'Export Started',
                                      description: 'Vehicle fleet data export in progress',
                                      status: 'info',
                                      duration: 3000,
                                    });
                                  }}
                                >
                                  Export Fleet Data
                                </Button>
                                
                                <Button
                                  leftIcon={<FaDownload />}
                                  colorScheme="yellow"
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: 'Export Started',
                                      description: 'Maintenance history export in progress',
                                      status: 'info',
                                      duration: 3000,
                                    });
                                  }}
                                >
                                  Export Maintenance Log
                                </Button>

                                <Button
                                  leftIcon={<FaChartLine />}
                                  colorScheme="purple"
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: 'Export Started',
                                      description: 'Fleet analytics report in progress',
                                      status: 'info',
                                      duration: 3000,
                                    });
                                  }}
                                >
                                  Export Analytics Report
                                </Button>
                              </VStack>
                            </CardBody>
                          </Card>

                          <Card>
                            <CardHeader>
                              <Heading size="sm">System Status</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Alert status="success" rounded="md">
                                  <AlertIcon />
                                  <Box>
                                    <Text fontSize="sm" fontWeight="bold">
                                      Fleet Status: Operational
                                    </Text>
                                    <Text fontSize="xs">
                                      All vehicle management systems online
                                    </Text>
                                  </Box>
                                </Alert>

                                <HStack justify="space-between">
                                  <Text fontSize="sm">Fleet Size:</Text>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {totalVehicles} vehicles
                                  </Text>
                                </HStack>

                                <HStack justify="space-between">
                                  <Text fontSize="sm">Maintenance Records:</Text>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {maintenanceRecords.length} entries
                                  </Text>
                                </HStack>

                                <HStack justify="space-between">
                                  <Text fontSize="sm">Last Update:</Text>
                                  <Text fontSize="sm" color="green.500">
                                    {new Date().toLocaleTimeString()}
                                  </Text>
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        </SimpleGrid>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* New/Edit Vehicle Modal */}
      <Modal isOpen={isNewVehicleOpen || isEditVehicleOpen} onClose={() => {
        onNewVehicleClose();
        onEditVehicleClose();
        setSelectedVehicle(null);
        setNewVehicle({
          make: '',
          model: '',
          year: '',
          licensePlate: '',
          vin: '',
          color: '',
          status: 'active',
          capacity: '',
          fuelType: 'gasoline',
          mileage: '',
          notes: ''
        });
      }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditVehicleOpen ? 'Edit Vehicle' : 'Add New Vehicle'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired isInvalid={!!formErrors.make}>
                  <FormLabel>Make</FormLabel>
                  <Input
                    placeholder="Vehicle make"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                  />
                  {formErrors.make && <Text color="red.500" fontSize="sm">{formErrors.make}</Text>}
                </FormControl>
                
                <FormControl isRequired isInvalid={!!formErrors.model}>
                  <FormLabel>Model</FormLabel>
                  <Input
                    placeholder="Vehicle model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  />
                  {formErrors.model && <Text color="red.500" fontSize="sm">{formErrors.model}</Text>}
                </FormControl>

                <FormControl isRequired isInvalid={!!formErrors.year}>
                  <FormLabel>Year</FormLabel>
                  <Input
                    type="number"
                    placeholder="Year"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                  />
                  {formErrors.year && <Text color="red.500" fontSize="sm">{formErrors.year}</Text>}
                </FormControl>

                <FormControl isRequired isInvalid={!!formErrors.licensePlate}>
                  <FormLabel>License Plate</FormLabel>
                  <Input
                    placeholder="License plate"
                    value={newVehicle.licensePlate}
                    onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                  />
                  {formErrors.licensePlate && <Text color="red.500" fontSize="sm">{formErrors.licensePlate}</Text>}
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>VIN</FormLabel>
                <Input
                  placeholder="Vehicle Identification Number"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Color</FormLabel>
                  <Input
                    placeholder="Vehicle color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Capacity</FormLabel>
                  <Input
                    type="number"
                    placeholder="Passenger capacity"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  placeholder="Additional notes about the vehicle"
                  value={newVehicle.notes}
                  onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onNewVehicleClose();
              onEditVehicleClose();
              setSelectedVehicle(null);
            }}>
              Cancel
            </Button>
            <Button 
              colorScheme="orange" 
              onClick={isEditVehicleOpen ? handleUpdateVehicle : handleCreateVehicle}
              isLoading={isSubmitting}
              loadingText={isEditVehicleOpen ? 'Updating...' : 'Adding...'}
              isDisabled={isSubmitting}
            >
              {isEditVehicleOpen ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ComprehensiveVehicleDashboard;