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
  useColorModeValue
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  TimeIcon,
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  DownloadIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const mockRiders = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    status: 'active',
    totalRides: 45,
    lastRide: '2025-10-30',
    memberSince: '2024-01-15'
  },
  {
    id: 2,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1-555-0234',
    status: 'active',
    totalRides: 32,
    lastRide: '2025-10-29',
    memberSince: '2024-03-20'
  }
];

const mockRideHistory = [
  {
    id: 101,
    date: '2025-10-31',
    time: '09:30 AM',
    from: '123 Main St',
    to: 'City Hospital',
    driver: 'John Doe',
    status: 'completed',
    duration: '25 min'
  }
];

const RidersDashboard = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRider, setSelectedRider] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [newRiderAddress, setNewRiderAddress] = useState('');
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    setRiders(mockRiders);
    setFilteredRiders(mockRiders);
  }, []);

  useEffect(() => {
    let filtered = riders;
    
    if (searchTerm) {
      filtered = filtered.filter(rider =>
        rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.phone.includes(searchTerm)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(rider => rider.status === filterStatus);
    }
    
    setFilteredRiders(filtered);
  }, [searchTerm, filterStatus, riders]);

  const handleViewHistory = (rider) => {
    setSelectedRider(rider);
    setRideHistory(mockRideHistory);
    onHistoryOpen();
  };

  const handleEditRider = (rider) => {
    toast({
      title: 'Edit Rider',
      description: `Edit functionality for ${rider.name}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteRider = (riderId) => {
    if (window.confirm('Are you sure you want to delete this rider?')) {
      setRiders(riders.filter(r => r.id !== riderId));
      toast({
        title: 'Rider deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'suspended': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Box ml="60px" bg={bgColor} minH="100vh">
      <Navbar />
      
      <Box p={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg" color="pink.500">
            Rider Management
          </Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="pink"
            onClick={onAddOpen}
          >
            Add New Rider
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Total Riders</StatLabel>
                <StatNumber color="pink.500">{riders.length}</StatNumber>
                <StatHelpText>Registered in system</StatHelpText>
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                minW="300px"
              />
              
              <Select
                placeholder="All Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                maxW="200px"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              
              <Button leftIcon={<DownloadIcon />} variant="outline">
                Export Data
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Riders Table */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Riders List ({filteredRiders.length})</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rider</Th>
                    <Th>Contact</Th>
                    <Th>Status</Th>
                    <Th>Total Rides</Th>
                    <Th>Last Ride</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRiders.map((rider) => (
                    <Tr key={rider.id}>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={rider.name} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{rider.name}</Text>
                            <Text fontSize="sm" color="gray.500">ID: {rider.id}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <EmailIcon boxSize={3} />
                            <Text fontSize="sm">{rider.email}</Text>
                          </HStack>
                          <HStack>
                            <PhoneIcon boxSize={3} />
                            <Text fontSize="sm">{rider.phone}</Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(rider.status)}>
                          {rider.status}
                        </Badge>
                      </Td>
                      <Td>{rider.totalRides}</Td>
                      <Td>{rider.lastRide}</Td>
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
                              onClick={() => handleViewHistory(rider)}
                            >
                              View History
                            </MenuItem>
                            <MenuItem
                              icon={<EditIcon />}
                              onClick={() => handleEditRider(rider)}
                            >
                              Edit Rider
                            </MenuItem>
                            <MenuItem
                              icon={<CalendarIcon />}
                            >
                              Schedule Ride
                            </MenuItem>
                            <Divider />
                            <MenuItem
                              icon={<DeleteIcon />}
                              color="red.500"
                              onClick={() => handleDeleteRider(rider.id)}
                            >
                              Delete Rider
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Add Rider Modal */}
        <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Rider</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Full Name</FormLabel>
                    <Input placeholder="Enter full name" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Email (Optional)</FormLabel>
                    <Input placeholder="Enter email address" type="email" />
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <Input placeholder="Enter phone number" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select placeholder="Select status">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </FormControl>
                </HStack>
                
                <FormControl isRequired>
                  <FormLabel>Address</FormLabel>
                  <PlacesAutocomplete
                    placeholder="Enter full address"
                    value={newRiderAddress}
                    onChange={(address) => setNewRiderAddress(address)}
                    onPlaceSelected={(place) => setNewRiderAddress(place.address)}
                    isRequired
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Emergency Contact</FormLabel>
                  <Input placeholder="Name and phone number" />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Special Needs/Accommodations</FormLabel>
                  <Textarea placeholder="Any special requirements..." />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAddClose}>
                Cancel
              </Button>
              <Button colorScheme="pink" onClick={onAddClose}>
                Add Rider
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Ride History Modal */}
        <Modal isOpen={isHistoryOpen} onClose={onHistoryClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Ride History - {selectedRider?.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date & Time</Th>
                      <Th>Route</Th>
                      <Th>Driver</Th>
                      <Th>Status</Th>
                      <Th>Duration</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rideHistory.map((ride) => (
                      <Tr key={ride.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">{ride.date}</Text>
                            <Text fontSize="xs" color="gray.500">{ride.time}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">From: {ride.from}</Text>
                            <Text fontSize="sm">To: {ride.to}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          {typeof ride.driver === 'object' && ride.driver 
                            ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || ride.driver.email || 'Unknown Driver'
                            : ride.driver || 'Not Assigned'
                          }
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={ride.status === 'completed' ? 'green' : 'red'}
                          >
                            {ride.status}
                          </Badge>
                        </Td>
                        <Td>{ride.duration}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onHistoryClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default RidersDashboard;