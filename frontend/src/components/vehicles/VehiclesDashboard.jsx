import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
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
  useToast,
  Flex,
  Text,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  Divider,
  Avatar,
  useColorModeValue,
  Switch,
  Progress
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  TimeIcon,
  SettingsIcon,
  WarningIcon,
  CheckIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';

const mockVehicles = [
  {
    id: 1,
    plateNumber: 'ABC-123',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    capacity: 8,
    status: 'active',
    mileage: 45230,
    lastService: '2025-10-15',
    nextService: '2025-12-15',
    fuelLevel: 85,
    assignedDriver: 'John Doe',
    wheelchairAccessible: true,
    maintenanceNotes: 'Good condition'
  },
  {
    id: 2,
    plateNumber: 'DEF-456',
    make: 'Chevrolet',
    model: 'Express',
    year: 2021,
    capacity: 12,
    status: 'maintenance',
    mileage: 67890,
    lastService: '2025-09-20',
    nextService: '2025-11-20',
    fuelLevel: 40,
    assignedDriver: null,
    wheelchairAccessible: false,
    maintenanceNotes: 'Oil change needed'
  },
  {
    id: 3,
    plateNumber: 'GHI-789',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    capacity: 15,
    status: 'active',
    mileage: 12450,
    lastService: '2025-10-01',
    nextService: '2026-01-01',
    fuelLevel: 92,
    assignedDriver: 'Jane Smith',
    wheelchairAccessible: true,
    maintenanceNotes: 'Excellent condition'
  }
];

const mockDrivers = [
  { id: 1, name: 'John Doe', available: true },
  { id: 2, name: 'Jane Smith', available: true },
  { id: 3, name: 'Mike Johnson', available: false },
  { id: 4, name: 'Sarah Wilson', available: true }
];

const VehiclesDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [drivers] = useState(mockDrivers);
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    setVehicles(mockVehicles);
    setFilteredVehicles(mockVehicles);
  }, []);

  useEffect(() => {
    let filtered = vehicles;
    
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.assignedDriver?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filterStatus);
    }
    
    setFilteredVehicles(filtered);
  }, [searchTerm, filterStatus, vehicles]);

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    onEditOpen();
  };

  const handleAssignDriver = (vehicle) => {
    setSelectedVehicle(vehicle);
    onAssignOpen();
  };

  const handleRemoveFromService = (vehicleId) => {
    if (window.confirm('Are you sure you want to remove this vehicle from service?')) {
      setVehicles(vehicles.map(v => 
        v.id === vehicleId 
          ? { ...v, status: 'maintenance', assignedDriver: null }
          : v
      ));
      toast({
        title: 'Vehicle removed from service',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReturnToService = (vehicleId) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId 
        ? { ...v, status: 'active' }
        : v
    ));
    toast({
      title: 'Vehicle returned to service',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      toast({
        title: 'Vehicle deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAssignDriverSubmit = (driverId) => {
    const driver = drivers.find(d => d.id === parseInt(driverId));
    if (driver && selectedVehicle) {
      setVehicles(vehicles.map(v => 
        v.id === selectedVehicle.id 
          ? { ...v, assignedDriver: driver.name }
          : v
      ));
      toast({
        title: 'Driver assigned successfully',
        description: `${driver.name} assigned to ${selectedVehicle.plateNumber}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAssignClose();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'maintenance': return 'orange';
      case 'out-of-service': return 'red';
      case 'assigned': return 'blue';
      default: return 'gray';
    }
  };

  const getFuelLevelColor = (level) => {
    if (level > 70) return 'green';
    if (level > 30) return 'yellow';
    return 'red';
  };

  const getTotalStats = () => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const assignedVehicles = vehicles.filter(v => v.assignedDriver !== null).length;
    const avgFuelLevel = vehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / vehicles.length;
    
    return { totalVehicles, activeVehicles, assignedVehicles, avgFuelLevel };
  };

  const stats = getTotalStats();

  return (
    <Box ml="60px" bg={bgColor} minH="100vh">
      <Navbar />
      
      <Box p={{ base: 4, md: 6 }}>
        {/* Header - Responsive Layout */}
        <Flex 
          direction={{ base: "column", sm: "row" }}
          justify="space-between" 
          align={{ base: "stretch", sm: "center" }} 
          mb={{ base: 4, md: 6 }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: "md", md: "lg" }} color="cyan.500">
            Vehicle Management
          </Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="cyan"
            onClick={onAddOpen}
            size={{ base: "md", md: "md" }}
            width={{ base: "full", sm: "auto" }}
          >
            Add New Vehicle
          </Button>
        </Flex>

        {/* Stats Cards - Responsive Grid */}
        <Grid 
          templateColumns={{ 
            base: "1fr",
            sm: "repeat(2, 1fr)", 
            md: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)" 
          }} 
          gap={{ base: 4, md: 6 }} 
          mb={{ base: 6, md: 8 }}
        >
          <Card bg={cardBg} shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s">
            <CardBody p={{ base: 4, md: 6 }}>
              <Stat>
                <StatLabel fontSize={{ base: "sm", md: "md" }}>Total Vehicles</StatLabel>
                <StatNumber color="cyan.500" fontSize={{ base: "2xl", md: "3xl" }}>{stats.totalVehicles}</StatNumber>
                <StatHelpText fontSize={{ base: "xs", md: "sm" }}>Fleet size</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s">
            <CardBody p={{ base: 4, md: 6 }}>
              <Stat>
                <StatLabel fontSize={{ base: "sm", md: "md" }}>Active Vehicles</StatLabel>
                <StatNumber color="green.500" fontSize={{ base: "2xl", md: "3xl" }}>{stats.activeVehicles}</StatNumber>
                <StatHelpText fontSize={{ base: "xs", md: "sm" }}>Ready for service</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s">
            <CardBody p={{ base: 4, md: 6 }}>
              <Stat>
                <StatLabel fontSize={{ base: "sm", md: "md" }}>Assigned Vehicles</StatLabel>
                <StatNumber color="blue.500" fontSize={{ base: "2xl", md: "3xl" }}>{stats.assignedVehicles}</StatNumber>
                <StatHelpText fontSize={{ base: "xs", md: "sm" }}>With drivers</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Avg Fuel Level</StatLabel>
                <StatNumber color={getFuelLevelColor(stats.avgFuelLevel)}>{Math.round(stats.avgFuelLevel)}%</StatNumber>
                <StatHelpText>Fleet average</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Search and Filter Controls */}
        <Card bg={cardBg} mb={6}>
          <CardHeader>
            <Heading size="md">Search & Filter</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Input
                placeholder="Search by plate number, make, model, or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                minW="350px"
              />
              
              <Select
                placeholder="All Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                maxW="200px"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
              </Select>
              
              <Button leftIcon={<ViewIcon />} variant="outline">
                Export Fleet Report
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Vehicles Table */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Vehicle Fleet ({filteredVehicles.length})</Heading>
          </CardHeader>
          <CardBody>
            {/* Desktop Table View */}
            <Box display={{ base: "none", lg: "block" }}>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Vehicle Info</Th>
                      <Th>Status</Th>
                      <Th>Capacity</Th>
                      <Th>Assigned Driver</Th>
                      <Th>Fuel Level</Th>
                      <Th>Service Due</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                <Tbody>
                  {filteredVehicles.map((vehicle) => (
                    <Tr key={vehicle.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{vehicle.plateNumber}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {vehicle.mileage.toLocaleString()} miles
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Badge colorScheme={getStatusColor(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                          {vehicle.wheelchairAccessible && (
                            <Badge colorScheme="blue" size="sm">♿ Accessible</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>{vehicle.capacity} passengers</Td>
                      <Td>
                        {vehicle.assignedDriver ? (
                          <HStack>
                            <Avatar size="xs" name={typeof vehicle.assignedDriver === 'object' 
                              ? (vehicle.assignedDriver.name || `${vehicle.assignedDriver.firstName || ''} ${vehicle.assignedDriver.lastName || ''}`.trim() || vehicle.assignedDriver.email || 'Unnamed Driver')
                              : vehicle.assignedDriver
                            } />
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
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Progress 
                            value={vehicle.fuelLevel} 
                            colorScheme={getFuelLevelColor(vehicle.fuelLevel)}
                            size="sm" 
                            width="80px" 
                          />
                          <Text fontSize="xs">{vehicle.fuelLevel}%</Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{vehicle.nextService}</Text>
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
                              icon={<EditIcon />}
                              onClick={() => handleEditVehicle(vehicle)}
                            >
                              Edit Vehicle
                            </MenuItem>
                            <MenuItem
                              icon={<SettingsIcon />}
                              onClick={() => handleAssignDriver(vehicle)}
                            >
                              Assign Driver
                            </MenuItem>
                            {vehicle.status === 'active' ? (
                              <MenuItem
                                icon={<WarningIcon />}
                                color="orange.500"
                                onClick={() => handleRemoveFromService(vehicle.id)}
                              >
                                Remove from Service
                              </MenuItem>
                            ) : vehicle.status === 'maintenance' ? (
                              <MenuItem
                                icon={<CheckIcon />}
                                color="green.500"
                                onClick={() => handleReturnToService(vehicle.id)}
                              >
                                Return to Service
                              </MenuItem>
                            ) : null}
                            <MenuItem
                              icon={<TimeIcon />}
                            >
                              Schedule Maintenance
                            </MenuItem>
                            <Divider />
                            <MenuItem
                              icon={<DeleteIcon />}
                              color="red.500"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
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
            </Box>

            {/* Mobile Card View */}
            <Box display={{ base: "block", lg: "none" }}>
              <VStack spacing={4}>
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle.id} width="100%" shadow="sm" borderRadius="lg">
                    <CardBody p={{ base: 4, md: 5 }}>
                      <Flex justify="space-between" align="start" mb={3}>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold" fontSize="lg">{vehicle.plateNumber}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Text>
                          <Badge
                            colorScheme={
                              vehicle.status === 'active' ? 'green' :
                              vehicle.status === 'maintenance' ? 'red' :
                              vehicle.status === 'out-of-service' ? 'gray' : 'blue'
                            }
                            size="sm"
                          >
                            {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                          </Badge>
                        </VStack>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<SettingsIcon />}
                            variant="ghost"
                            size="sm"
                            _hover={{ bg: "gray.100" }}
                          />
                          <MenuList>
                            <MenuItem icon={<ViewIcon />}>
                              View Details
                            </MenuItem>
                            <MenuItem icon={<EditIcon />}>
                              Edit Vehicle
                            </MenuItem>
                            <MenuItem icon={<DeleteIcon />} color="red.500">
                              Delete Vehicle
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>
                      
                      <Grid templateColumns="repeat(2, 1fr)" gap={3} fontSize="sm">
                        <VStack align="start" spacing={1}>
                          <Text color="gray.500">Capacity</Text>
                          <Text fontWeight="medium">{vehicle.capacity} passengers</Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text color="gray.500">Fuel Level</Text>
                          <HStack>
                            <Progress 
                              value={vehicle.fuelLevel} 
                              size="sm" 
                              colorScheme={vehicle.fuelLevel > 50 ? "green" : vehicle.fuelLevel > 25 ? "yellow" : "red"}
                              width="60px"
                            />
                            <Text fontWeight="medium">{vehicle.fuelLevel}%</Text>
                          </HStack>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text color="gray.500">Driver</Text>
                          <Text fontWeight="medium">
                            {vehicle.assignedDriver || 'Unassigned'}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={1}>
                          <Text color="gray.500">Next Service</Text>
                          <Text fontWeight="medium" color={
                            new Date(vehicle.nextService) < new Date() ? "red.500" : "gray.700"
                          }>
                            {new Date(vehicle.nextService).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </Grid>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
          </CardBody>
        </Card>

        {/* Add Vehicle Modal */}
        <Modal 
          isOpen={isAddOpen} 
          onClose={onAddClose} 
          size={{ base: "full", md: "xl" }}
          scrollBehavior="inside"
        >
          <ModalOverlay />
          <ModalContent mx={{ base: 0, md: 4 }} my={{ base: 0, md: 16 }}>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }} pb={2}>
              Add New Vehicle
            </ModalHeader>
            <ModalCloseButton size={{ base: "md", md: "lg" }} />
            <ModalBody pb={6}>
              <VStack spacing={{ base: 4, md: 5 }}>
                <Flex 
                  direction={{ base: "column", md: "row" }}
                  gap={4} 
                  w="full"
                >
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Plate Number</FormLabel>
                    <Input 
                      placeholder="ABC-123" 
                      size={{ base: "md", md: "lg" }}
                      _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Make</FormLabel>
                    <Input 
                      placeholder="Ford" 
                      size={{ base: "md", md: "lg" }}
                      _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                    />
                  </FormControl>
                </Flex>
                
                <Flex 
                  direction={{ base: "column", md: "row" }}
                  gap={4} 
                  w="full"
                >
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Model</FormLabel>
                    <Input 
                      placeholder="Transit" 
                      size={{ base: "md", md: "lg" }}
                      _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Year</FormLabel>
                    <Input 
                      placeholder="2023" 
                      type="number" 
                      size={{ base: "md", md: "lg" }}
                      _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                    />
                  </FormControl>
                </Flex>
                
                <Flex 
                  direction={{ base: "column", md: "row" }}
                  gap={4} 
                  w="full"
                >
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Capacity</FormLabel>
                    <Input 
                      placeholder="8" 
                      type="number" 
                      size={{ base: "md", md: "lg" }}
                      _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={{ base: "sm", md: "md" }}>Wheelchair Accessible</FormLabel>
                    <Switch mt={2} size={{ base: "md", md: "lg" }} colorScheme="cyan" />
                  </FormControl>
                </Flex>
                
                <FormControl>
                  <FormLabel fontSize={{ base: "sm", md: "md" }}>Maintenance Notes</FormLabel>
                  <Textarea 
                    placeholder="Any notes about the vehicle..." 
                    rows={{ base: 3, md: 4 }}
                    resize="vertical"
                    _focus={{ borderColor: "cyan.400", boxShadow: "0 0 0 1px cyan.400" }}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter 
              flexDirection={{ base: "column-reverse", md: "row" }}
              gap={{ base: 2, md: 0 }}
            >
              <Button 
                variant="ghost" 
                mr={{ base: 0, md: 3 }} 
                onClick={onAddClose}
                width={{ base: "full", md: "auto" }}
                size={{ base: "lg", md: "md" }}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="cyan" 
                onClick={onAddClose}
                width={{ base: "full", md: "auto" }}
                size={{ base: "lg", md: "md" }}
              >
                Add Vehicle
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Vehicle Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Edit Vehicle - {selectedVehicle?.plateNumber}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Plate Number</FormLabel>
                    <Input defaultValue={selectedVehicle?.plateNumber} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select defaultValue={selectedVehicle?.status}>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out-of-service">Out of Service</option>
                    </Select>
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Current Mileage</FormLabel>
                    <Input defaultValue={selectedVehicle?.mileage} type="number" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Fuel Level (%)</FormLabel>
                    <Input defaultValue={selectedVehicle?.fuelLevel} type="number" max="100" />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel>Maintenance Notes</FormLabel>
                  <Textarea defaultValue={selectedVehicle?.maintenanceNotes} />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancel
              </Button>
              <Button colorScheme="cyan" onClick={onEditClose}>
                Update Vehicle
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Driver Assignment Modal */}
        <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Assign Driver to {selectedVehicle?.plateNumber}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Select Driver</FormLabel>
                <Select placeholder="Choose a driver">
                  {drivers.filter(d => d.available).map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <Text mt={4} fontSize="sm" color="gray.600">
                Current Assignment: {selectedVehicle?.assignedDriver || 'Unassigned'}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAssignClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="cyan" 
                onClick={() => {
                  const select = document.querySelector('select');
                  if (select && select.value) {
                    handleAssignDriverSubmit(select.value);
                  }
                }}
              >
                Assign Driver
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default VehiclesDashboard;