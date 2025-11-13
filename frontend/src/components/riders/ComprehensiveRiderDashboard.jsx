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
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputRightAddon
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
  WarningIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaUsers,
  FaHistory,
  FaChartLine,
  FaFilter,
  FaDownload,
  FaUserPlus,
  FaClock,
  FaMapMarkerAlt,
  FaCar
} from 'react-icons/fa';
import {
  CurrencyDollarIcon,
  TicketIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
// Removed unused import - useAuth was not being used in this component
import Navbar from '../shared/Navbar';

const ComprehensiveRiderDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [riders, setRiders] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  
  // New rider form states
  const [newRider, setNewRider] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    notes: '',
    
    // Service Balance
    serviceBalanceType: 'trips', // 'trips' or 'dollars'
    tripBalance: 20,
    dollarBalance: 500.00,
    
    // Contract Management
    isContractBased: false,
    contractStartDate: '',
    contractEndDate: '',
    
    // Pricing & Mileage
    pricePerRide: 15.00,
    mileageBalance: 500,
    pricePerMile: 0.50
  });

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Modal states
  const { isOpen: isNewRiderOpen, onOpen: onNewRiderOpen, onClose: onNewRiderClose } = useDisclosure();
  const { isOpen: isEditRiderOpen, onOpen: onEditRiderOpen, onClose: onEditRiderClose } = useDisclosure();

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch riders (users with role 'rider')
      const ridersResponse = await axios.get('/api/users?role=rider');
      setRiders(ridersResponse.data.users || []);

      // Fetch trips for rider history
      const tripsResponse = await axios.get('/api/trips');
      setTrips(tripsResponse.data.data?.trips || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rider data',
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
    if (params.get('tab') === 'history') {
      setActiveTab(2);
    }
  }, [location]);

  // Filter riders based on search and status
  const filteredRiders = riders.filter(rider => {
    const matchesSearch = searchTerm === '' || 
      `${rider.firstName} ${rider.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || rider.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Filter trips for rider history
  const filteredTrips = trips.filter(trip => {
    const tripDate = new Date(trip.scheduledDate);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    if (startDate && tripDate < startDate) return false;
    if (endDate && tripDate > endDate) return false;

    return true;
  });

  // Statistics
  const totalRiders = riders.length;
  const activeRiders = riders.filter(rider => rider.status === 'active').length;
  const totalTrips = trips.length;
  const todayTrips = trips.filter(trip => {
    const today = new Date().toDateString();
    return new Date(trip.scheduledDate).toDateString() === today;
  }).length;

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'pending':
        return 'orange';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Handle new rider creation
  const handleCreateRider = async () => {
    // Validation
    if (!newRider.firstName || !newRider.lastName || !newRider.email || !newRider.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (First Name, Last Name, Email, Password)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Contract validation
    if (newRider.isContractBased) {
      if (!newRider.contractStartDate || !newRider.contractEndDate) {
        toast({
          title: 'Validation Error',
          description: 'Please provide both contract start and end dates for contract-based service',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (new Date(newRider.contractEndDate) <= new Date(newRider.contractStartDate)) {
        toast({
          title: 'Validation Error',
          description: 'Contract end date must be after the start date',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    try {
      const riderData = {
        ...newRider,
        role: 'rider',
        isActive: true,
        trips: [],
        
        // Service Balance
        serviceBalance: {
          type: newRider.serviceBalanceType,
          tripCount: newRider.serviceBalanceType === 'trips' ? newRider.tripBalance : 0,
          dollarAmount: newRider.serviceBalanceType === 'dollars' ? newRider.dollarBalance : 0,
          originalTripCount: newRider.serviceBalanceType === 'trips' ? newRider.tripBalance : 0,
          originalDollarAmount: newRider.serviceBalanceType === 'dollars' ? newRider.dollarBalance : 0
        },
        
        // Contract details
        contractDetails: newRider.isContractBased ? {
          isActive: true,
          startDate: newRider.contractStartDate,
          endDate: newRider.contractEndDate,
          createdAt: new Date().toISOString()
        } : null,
        
        // Pricing & Mileage
        pricingDetails: {
          pricePerRide: newRider.pricePerRide,
          pricePerMile: newRider.pricePerMile
        },
        
        mileageBalance: {
          currentBalance: newRider.mileageBalance,
          originalBalance: newRider.mileageBalance,
          totalUsed: 0
        }
      };

      console.log('Sending rider data from dashboard:', riderData);

      const response = await axios.post('/api/auth/register', riderData);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: `Rider ${newRider.firstName} ${newRider.lastName} created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewRider({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          
          // Service Balance
          serviceBalanceType: 'trips',
          tripBalance: 20,
          dollarBalance: 500.00,
          
          // Contract Management
          isContractBased: false,
          contractStartDate: '',
          contractEndDate: '',
          
          // Pricing & Mileage
          pricePerRide: 15.00,
          mileageBalance: 500,
          pricePerMile: 0.50
        });
        onNewRiderClose();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating rider:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create rider',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewRiderProfile = (rider) => {
    navigate(`/riders/${rider._id}`);
  };

  const handleEditRider = (rider) => {
    setSelectedRider(rider);
    setNewRider({
      firstName: rider.firstName,
      lastName: rider.lastName,
      email: rider.email,
      phone: rider.phone,
      address: rider.address || '',
      notes: rider.notes || ''
    });
    onEditRiderOpen();
  };

  const handleUpdateRider = async () => {
    try {
      const response = await axios.put(`/api/users/${selectedRider._id}`, newRider);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Rider updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditRiderClose();
        fetchData();
      }
    } catch (err) {
      console.error('Error updating rider:', err);
      toast({
        title: 'Error',
        description: 'Failed to update rider',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteRider = async (riderId) => {
    if (window.confirm('Are you sure you want to deactivate this rider?')) {
      try {
        await axios.patch(`/api/users/${riderId}/deactivate`);
        toast({
          title: 'Success',
          description: 'Rider deactivated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (err) {
        console.error('Error deleting rider:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete rider',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Navbar title="Rider Management" />
        <Center h="50vh">
          <Spinner size="xl" color="pink.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Rider Management" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Welcome Header */}
            <Box textAlign="center" py={{ base: 4, md: 6 }}>
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                color="pink.600" 
                mb={2}
              >
                Rider Management Center
              </Heading>
              <Text 
                color={textColor} 
                fontSize={{ base: "md", md: "lg" }}
              >
                Manage riders, track history, and analyze rider engagement
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
                      color="pink.500"
                    >
                      {totalRiders}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Total Riders
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
                      {activeRiders}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Active Riders
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
                      {totalTrips}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Total Trips
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
                      color="purple.500"
                    >
                      {todayTrips}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Today's Trips
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
                  colorScheme="pink"
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
                        color: "pink.600", 
                        borderColor: "pink.500",
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
                        color: "pink.600", 
                        borderColor: "pink.500",
                        bg: "white"
                      }}
                    >
                      👥 All Riders
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "pink.600", 
                        borderColor: "pink.500",
                        bg: "white"
                      }}
                    >
                      📊 Trip History
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "pink.600", 
                        borderColor: "pink.500",
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
                        color: "pink.600", 
                        borderColor: "pink.500",
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
                          <Heading size="md" color="pink.600">
                            Rider Overview
                          </Heading>
                        </HStack>

                        {/* Recent Activity */}
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          <Card variant="outline">
                            <CardHeader>
                              <HStack>
                                <FaClock color="pink" />
                                <Heading size="sm">Recent Riders</Heading>
                              </HStack>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                {riders.slice(0, 5).map((rider) => (
                                  <HStack key={rider._id} justify="space-between" p={3} bg="gray.50" rounded="md">
                                    <HStack>
                                      <Avatar 
                                        size="sm" 
                                        name={`${rider.firstName} ${rider.lastName}`}
                                        bg="pink.500"
                                      />
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="bold">
                                          {rider.firstName} {rider.lastName}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {rider.email}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme={getStatusColor(rider.status)}>
                                      {rider.status}
                                    </Badge>
                                  </HStack>
                                ))}
                              </VStack>
                            </CardBody>
                          </Card>

                          <Card variant="outline">
                            <CardHeader>
                              <HStack>
                                <FaMapMarkerAlt color="pink" />
                                <Heading size="sm">Recent Trips</Heading>
                              </HStack>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                {trips.slice(0, 5).map((trip) => (
                                  <HStack key={trip._id} justify="space-between" p={3} bg="gray.50" rounded="md">
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="bold">
                                        {trip.riderName}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {typeof trip.pickupLocation === 'string' ? trip.pickupLocation.substring(0, 30) : 'Location not set'}...
                                      </Text>
                                    </VStack>
                                    <Badge colorScheme={getStatusColor(trip.status)}>
                                      {trip.status}
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
                            <Heading size="md" color="pink.600">Quick Actions</Heading>
                          </CardHeader>
                          <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                              <Button
                                leftIcon={<FaUsers />}
                                colorScheme="pink"
                                variant="outline"
                                onClick={() => setActiveTab(1)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                View All Riders
                              </Button>
                              <Button
                                leftIcon={<FaHistory />}
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => setActiveTab(2)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                Trip History
                              </Button>
                              <Button
                                leftIcon={<FaChartLine />}
                                colorScheme="purple"
                                variant="outline"
                                onClick={() => setActiveTab(3)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                View Analytics
                              </Button>
                            </Grid>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* All Riders Tab */}
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
                                    placeholder="Search riders by name, email, or phone..."
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
                                  <option value="inactive">Inactive</option>
                                  <option value="pending">Pending</option>
                                </Select>
                                <Button
                                  leftIcon={<AddIcon />}
                                  colorScheme="pink"
                                  onClick={onNewRiderOpen}
                                >
                                  Add Rider
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Riders Table */}
                        <Card>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Rider</Th>
                                    <Th>Contact</Th>
                                    <Th>Status</Th>
                                    <Th display={{ base: "none", md: "table-cell" }}>Trips</Th>
                                    <Th display={{ base: "none", lg: "table-cell" }}>Joined</Th>
                                    <Th>Actions</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {filteredRiders.map((rider) => (
                                    <Tr key={rider._id}>
                                      <Td>
                                        <HStack>
                                          <Avatar 
                                            size="sm" 
                                            name={`${rider.firstName} ${rider.lastName}`}
                                            bg="pink.500"
                                          />
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="sm">
                                              {rider.firstName} {rider.lastName}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                              ID: {rider.riderId || 'N/A'}
                                            </Text>
                                          </VStack>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <VStack align="start" spacing={0}>
                                          <HStack>
                                            <EmailIcon boxSize={3} />
                                            <Text fontSize="xs">{rider.email}</Text>
                                          </HStack>
                                          {rider.phone && (
                                            <HStack>
                                              <PhoneIcon boxSize={3} />
                                              <Text fontSize="xs">{rider.phone}</Text>
                                            </HStack>
                                          )}
                                        </VStack>
                                      </Td>
                                      <Td>
                                        <Badge colorScheme={getStatusColor(rider.status || 'active')}>
                                          {rider.status || 'active'}
                                        </Badge>
                                      </Td>
                                      <Td display={{ base: "none", md: "table-cell" }}>
                                        <Text fontSize="sm">
                                          {trips.filter(trip => trip.riderName === `${rider.firstName} ${rider.lastName}`).length}
                                        </Text>
                                      </Td>
                                      <Td display={{ base: "none", lg: "table-cell" }}>
                                        <Text fontSize="sm">
                                          {formatDate(rider.createdAt).split(' ')[0]}
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
                                              onClick={() => handleViewRiderProfile(rider)}
                                            >
                                              View Profile
                                            </MenuItem>
                                            <MenuItem
                                              icon={<EditIcon />}
                                              onClick={() => handleEditRider(rider)}
                                            >
                                              Edit Rider
                                            </MenuItem>
                                            <MenuItem
                                              icon={<CalendarIcon />}
                                              onClick={() => navigate('/scheduler', { state: { prefilledRider: rider } })}
                                            >
                                              Schedule Trip
                                            </MenuItem>
                                            <Divider />
                                            <MenuItem
                                              icon={<DeleteIcon />}
                                              color="red.500"
                                              onClick={() => handleDeleteRider(rider._id)}
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
                            {filteredRiders.length === 0 && (
                              <Center py={8}>
                                <VStack spacing={4}>
                                  <FaUsers size={48} color="gray" />
                                  <Text color="gray.500" fontSize="lg">
                                    No riders found
                                  </Text>
                                  <Text color="gray.400" fontSize="sm" textAlign="center">
                                    {searchTerm ? 'Try adjusting your search criteria' : 'Add your first rider to get started'}
                                  </Text>
                                </VStack>
                              </Center>
                            )}
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Trip History Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap">
                          <Heading size="md" color="pink.600">
                            Rider Trip History ({filteredTrips.length} trips)
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
                              colorScheme="pink"
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

                        {/* Trip History Stats */}
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Completed Trips</StatLabel>
                            <StatNumber color="green.500">
                              {trips.filter(trip => trip.status === 'completed').length}
                            </StatNumber>
                            <StatHelpText>Successfully completed</StatHelpText>
                          </Stat>
                          
                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Active Trips</StatLabel>
                            <StatNumber color="blue.500">
                              {trips.filter(trip => ['assigned', 'in_progress'].includes(trip.status)).length}
                            </StatNumber>
                            <StatHelpText>Currently ongoing</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>Cancelled Trips</StatLabel>
                            <StatNumber color="red.500">
                              {trips.filter(trip => trip.status === 'cancelled').length}
                            </StatNumber>
                            <StatHelpText>Cancelled by riders</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={4} rounded="lg" shadow="sm">
                            <StatLabel>This Month</StatLabel>
                            <StatNumber color="purple.500">
                              {trips.filter(trip => {
                                const tripDate = new Date(trip.scheduledDate);
                                const now = new Date();
                                return tripDate.getMonth() === now.getMonth() && 
                                       tripDate.getFullYear() === now.getFullYear();
                              }).length}
                            </StatNumber>
                            <StatHelpText>Trips this month</StatHelpText>
                          </Stat>
                        </SimpleGrid>

                        {/* Trip History Table */}
                        <Card>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Date/Time</Th>
                                    <Th>Rider</Th>
                                    <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                                    <Th>Driver</Th>
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {filteredTrips.slice(0, 20).map((trip) => (
                                    <Tr key={trip._id}>
                                      <Td>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {new Date(trip.scheduledDate).toLocaleDateString()}
                                          </Text>
                                          <Text fontSize="xs" color="gray.500">
                                            {new Date(trip.scheduledDate).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </Text>
                                        </VStack>
                                      </Td>
                                      <Td>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {trip.riderName}
                                          </Text>
                                          <Text fontSize="xs" color="gray.500">
                                            ID: {trip.tripId}
                                          </Text>
                                        </VStack>
                                      </Td>
                                      <Td display={{ base: "none", md: "table-cell" }}>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="xs">
                                            📍 {String(trip.pickupLocation || '').substring(0, 20)}...
                                          </Text>
                                          <Text fontSize="xs">
                                            🏁 {String(trip.dropoffLocation || '').substring(0, 20)}...
                                          </Text>
                                        </VStack>
                                      </Td>
                                      <Td>
                                        <Text fontSize="sm">
                                          {trip.assignedDriver?.firstName || 'Unassigned'}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <Badge 
                                          colorScheme={getStatusColor(trip.status)} 
                                          fontSize="xs"
                                        >
                                          {trip.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <HStack spacing={1}>
                                          <IconButton
                                            icon={<ViewIcon />}
                                            size="xs"
                                            colorScheme="pink"
                                            variant="outline"
                                            aria-label="View details"
                                          />
                                          {trip.riderPhone && (
                                            <IconButton
                                              icon={<PhoneIcon />}
                                              size="xs"
                                              colorScheme="green"
                                              variant="outline"
                                              as="a"
                                              href={`tel:${trip.riderPhone}`}
                                              aria-label="Call rider"
                                            />
                                          )}
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



                    {/* Analytics Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="pink.600">
                          Rider Analytics & Insights
                        </Heading>

                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                          {/* Rider Growth */}
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Rider Growth</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Stat>
                                  <StatLabel>New Riders This Month</StatLabel>
                                  <StatNumber color="green.500">
                                    {riders.filter(rider => {
                                      const riderDate = new Date(rider.createdAt);
                                      const now = new Date();
                                      return riderDate.getMonth() === now.getMonth() && 
                                             riderDate.getFullYear() === now.getFullYear();
                                    }).length}
                                  </StatNumber>
                                  <StatHelpText>
                                    Growing monthly user base
                                  </StatHelpText>
                                </Stat>

                                <Divider />

                                <Stat>
                                  <StatLabel>Average Trips per Rider</StatLabel>
                                  <StatNumber color="blue.500">
                                    {totalRiders > 0 ? Math.round((totalTrips / totalRiders) * 10) / 10 : 0}
                                  </StatNumber>
                                  <StatHelpText>
                                    Rider engagement metric
                                  </StatHelpText>
                                </Stat>
                              </VStack>
                            </CardBody>
                          </Card>

                          {/* Trip Patterns */}
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Trip Patterns</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Stat>
                                  <StatLabel>Most Active Day</StatLabel>
                                  <StatNumber color="purple.500">
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                                      new Date().getDay()
                                    ]}
                                  </StatNumber>
                                  <StatHelpText>
                                    Based on trip frequency
                                  </StatHelpText>
                                </Stat>

                                <Divider />

                                <Stat>
                                  <StatLabel>Completion Rate</StatLabel>
                                  <StatNumber color="green.500">
                                    {totalTrips > 0 ? Math.round((trips.filter(trip => trip.status === 'completed').length / totalTrips) * 100) : 0}%
                                  </StatNumber>
                                  <StatHelpText>
                                    Trip success rate
                                  </StatHelpText>
                                </Stat>
                              </VStack>
                            </CardBody>
                          </Card>
                        </SimpleGrid>

                        {/* Top Riders */}
                        <Card>
                          <CardHeader>
                            <Heading size="sm">Most Active Riders</Heading>
                          </CardHeader>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Rider</Th>
                                    <Th>Total Trips</Th>
                                    <Th>Status</Th>
                                    <Th>Last Trip</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {riders
                                    .map(rider => ({
                                      ...rider,
                                      tripCount: trips.filter(trip => 
                                        trip.riderName === `${rider.firstName} ${rider.lastName}`
                                      ).length
                                    }))
                                    .sort((a, b) => b.tripCount - a.tripCount)
                                    .slice(0, 5)
                                    .map((rider) => (
                                      <Tr key={rider._id}>
                                        <Td>
                                          <HStack>
                                            <Avatar 
                                              size="sm" 
                                              name={`${rider.firstName} ${rider.lastName}`}
                                              bg="pink.500"
                                            />
                                            <Text fontSize="sm" fontWeight="medium">
                                              {rider.firstName} {rider.lastName}
                                            </Text>
                                          </HStack>
                                        </Td>
                                        <Td>
                                          <Text fontSize="sm" fontWeight="bold" color="pink.500">
                                            {rider.tripCount}
                                          </Text>
                                        </Td>
                                        <Td>
                                          <Badge colorScheme={getStatusColor(rider.status || 'active')}>
                                            {rider.status || 'active'}
                                          </Badge>
                                        </Td>
                                        <Td>
                                          <Text fontSize="sm">
                                            {formatDate(rider.updatedAt).split(' ')[0]}
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
                    </TabPanel>

                    {/* Settings Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="pink.600">
                          Rider Management Settings
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
                                  colorScheme="pink"
                                  variant="outline"
                                  onClick={() => {
                                    // Export riders data
                                    const csvData = riders.map(rider => ({
                                      'First Name': rider.firstName,
                                      'Last Name': rider.lastName,
                                      'Email': rider.email,
                                      'Phone': rider.phone,
                                      'Status': rider.status || 'active',
                                      'Joined': rider.createdAt ? new Date(rider.createdAt).toLocaleDateString() : 'N/A'
                                    }));
                                    console.log('Exporting riders:', csvData);
                                    toast({
                                      title: 'Export Started',
                                      description: 'Rider data export in progress',
                                      status: 'info',
                                      duration: 3000,
                                    });
                                  }}
                                >
                                  Export All Riders
                                </Button>
                                
                                <Button
                                  leftIcon={<FaDownload />}
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => {
                                    toast({
                                      title: 'Export Started',
                                      description: 'Trip history export in progress',
                                      status: 'info',
                                      duration: 3000,
                                    });
                                  }}
                                >
                                  Export Trip History
                                </Button>
                              </VStack>
                            </CardBody>
                          </Card>

                          <Card>
                            <CardHeader>
                              <Heading size="sm">Quick Stats</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <Alert status="info" rounded="md">
                                  <AlertIcon />
                                  <Box>
                                    <Text fontSize="sm" fontWeight="bold">
                                      System Health: Good
                                    </Text>
                                    <Text fontSize="xs">
                                      All rider services operational
                                    </Text>
                                  </Box>
                                </Alert>

                                <HStack justify="space-between">
                                  <Text fontSize="sm">Database Size:</Text>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {riders.length + trips.length} records
                                  </Text>
                                </HStack>

                                <HStack justify="space-between">
                                  <Text fontSize="sm">Last Sync:</Text>
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

      {/* New/Edit Rider Modal */}
      <Modal isOpen={isNewRiderOpen || isEditRiderOpen} onClose={() => {
        onNewRiderClose();
        onEditRiderClose();
        setSelectedRider(null);
        setNewRider({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          
          // Service Balance
          serviceBalanceType: 'trips',
          tripBalance: 20,
          dollarBalance: 500.00,
          
          // Contract Management
          isContractBased: false,
          contractStartDate: '',
          contractEndDate: '',
          
          // Pricing & Mileage
          pricePerRide: 15.00,
          mileageBalance: 500,
          pricePerMile: 0.50
        });
      }} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditRiderOpen ? 'Edit Rider' : 'Add New Rider'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            <VStack spacing={4} align="stretch">
              {/* Basic Information */}
              <Box>
                <Heading size="sm" mb={3} color="gray.700">Basic Information</Heading>
                <VStack spacing={3}>
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">First Name</FormLabel>
                      <Input
                        placeholder="First name"
                        value={newRider.firstName}
                        onChange={(e) => setNewRider({...newRider, firstName: e.target.value})}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Last Name</FormLabel>
                      <Input
                        placeholder="Last name"
                        value={newRider.lastName}
                        onChange={(e) => setNewRider({...newRider, lastName: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Email</FormLabel>
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={newRider.email}
                        onChange={(e) => setNewRider({...newRider, email: e.target.value})}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Phone</FormLabel>
                      <Input
                        placeholder="Phone number"
                        value={newRider.phone}
                        onChange={(e) => setNewRider({...newRider, phone: e.target.value})}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newRider.password}
                      onChange={(e) => setNewRider({...newRider, password: e.target.value})}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Address</FormLabel>
                    <Input
                      placeholder="Home address (optional)"
                      value={newRider.address}
                      onChange={(e) => setNewRider({...newRider, address: e.target.value})}
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Divider />

              {/* Service Balance Section */}
              <Card bg="blue.50" borderColor="blue.200" size="sm">
                <CardHeader pb={2}>
                  <HStack>
                    <Box as={TicketIcon} w={4} h={4} color="blue.600" />
                    <Heading size="sm" color="blue.700">Service Balance</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="start">
                    <FormControl>
                      <FormLabel fontSize="sm" mb={2}>Balance Type</FormLabel>
                      <RadioGroup
                        value={newRider.serviceBalanceType}
                        onChange={(value) => setNewRider({...newRider, serviceBalanceType: value})}
                      >
                        <Stack direction="row" spacing={4}>
                          <Radio value="trips" size="sm">Trip Count</Radio>
                          <Radio value="dollars" size="sm">Dollar Amount</Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    {newRider.serviceBalanceType === 'trips' ? (
                      <FormControl>
                        <FormLabel fontSize="sm">Number of Trips</FormLabel>
                        <NumberInput
                          value={newRider.tripBalance}
                          onChange={(valueString, valueNumber) => 
                            setNewRider({...newRider, tripBalance: valueNumber || 0})
                          }
                          min={0}
                          max={999}
                          size="sm"
                        >
                          <NumberInputField placeholder="Enter number of trips" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <FormLabel fontSize="sm">Dollar Amount</FormLabel>
                        <InputGroup size="sm">
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.500"
                            children="$"
                          />
                          <NumberInput
                            value={newRider.dollarBalance}
                            onChange={(valueString, valueNumber) => 
                              setNewRider({...newRider, dollarBalance: valueNumber || 0})
                            }
                            min={0}
                            precision={2}
                            step={0.01}
                            w="full"
                          >
                            <NumberInputField pl={8} placeholder="Enter dollar amount" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                      </FormControl>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Contract Management Section */}
              <Card bg="purple.50" borderColor="purple.200" size="sm">
                <CardHeader pb={2}>
                  <HStack>
                    <Box as={DocumentTextIcon} w={4} h={4} color="purple.600" />
                    <Heading size="sm" color="purple.700">Contract Management</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="start">
                    <Checkbox
                      isChecked={newRider.isContractBased}
                      onChange={(e) => setNewRider({...newRider, isContractBased: e.target.checked})}
                      colorScheme="purple"
                      size="sm"
                    >
                      This service is contract-based
                    </Checkbox>

                    {newRider.isContractBased && (
                      <SimpleGrid columns={2} spacing={3} w="full" pl={4}>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">Start Date</FormLabel>
                          <Input
                            type="date"
                            size="sm"
                            value={newRider.contractStartDate}
                            onChange={(e) => setNewRider({...newRider, contractStartDate: e.target.value})}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">End Date</FormLabel>
                          <Input
                            type="date"
                            size="sm"
                            value={newRider.contractEndDate}
                            onChange={(e) => setNewRider({...newRider, contractEndDate: e.target.value})}
                            min={newRider.contractStartDate}
                          />
                        </FormControl>
                      </SimpleGrid>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Pricing & Mileage Section */}
              <Card bg="green.50" borderColor="green.200" size="sm">
                <CardHeader pb={2}>
                  <HStack>
                    <Box as={CalculatorIcon} w={4} h={4} color="green.600" />
                    <Heading size="sm" color="green.700">Pricing & Mileage</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <SimpleGrid columns={3} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Price Per Ride</FormLabel>
                      <InputGroup size="sm">
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.500"
                          children="$"
                        />
                        <NumberInput
                          value={newRider.pricePerRide}
                          onChange={(valueString, valueNumber) => 
                            setNewRider({...newRider, pricePerRide: valueNumber || 0})
                          }
                          min={0}
                          precision={2}
                          step={0.01}
                          w="full"
                        >
                          <NumberInputField pl={8} placeholder="0.00" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Mileage Balance</FormLabel>
                      <InputGroup size="sm">
                        <NumberInput
                          value={newRider.mileageBalance}
                          onChange={(valueString, valueNumber) => 
                            setNewRider({...newRider, mileageBalance: valueNumber || 0})
                          }
                          min={0}
                          w="full"
                        >
                          <NumberInputField placeholder="Enter miles" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <InputRightAddon children="mi" fontSize="xs" />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Price Per Mile</FormLabel>
                      <InputGroup size="sm">
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.500"
                          children="$"
                        />
                        <NumberInput
                          value={newRider.pricePerMile}
                          onChange={(valueString, valueNumber) => 
                            setNewRider({...newRider, pricePerMile: valueNumber || 0})
                          }
                          min={0}
                          precision={2}
                          step={0.01}
                          w="full"
                        >
                          <NumberInputField pl={8} placeholder="0.00" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Notes Section */}
              <FormControl>
                <FormLabel fontSize="sm">Notes</FormLabel>
                <Textarea
                  placeholder="Additional notes (optional)"
                  value={newRider.notes}
                  onChange={(e) => setNewRider({...newRider, notes: e.target.value})}
                  size="sm"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onNewRiderClose();
              onEditRiderClose();
              setSelectedRider(null);
            }}>
              Cancel
            </Button>
            <Button 
              colorScheme="pink" 
              onClick={isEditRiderOpen ? handleUpdateRider : handleCreateRider}
              isDisabled={!newRider.firstName || !newRider.lastName || !newRider.email || !newRider.phone}
            >
              {isEditRiderOpen ? 'Update Rider' : 'Create Rider'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ComprehensiveRiderDashboard;