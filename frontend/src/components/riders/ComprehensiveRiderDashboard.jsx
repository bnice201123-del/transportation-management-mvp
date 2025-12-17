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
  InputRightAddon,
  Tooltip
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
  CalculatorIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../shared/Navbar';
import RiderInfoModal from '../shared/RiderInfoModal';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

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
  const [selectedRiderForModal, setSelectedRiderForModal] = useState(null);
  
  // New rider form states
  const [newRider, setNewRider] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    riderId: '',
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

  // Generate Rider ID: [BirthYear][4 Random Letters]
  const generateRiderId = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const birthYear = new Date(dateOfBirth).getFullYear();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomLetters = '';
    
    for (let i = 0; i < 4; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    return `${birthYear}${randomLetters}`;
  };

  // Update riderId when dateOfBirth changes
  const handleDateOfBirthChange = (date) => {
    const newRiderId = generateRiderId(date);
    setNewRider({
      ...newRider,
      dateOfBirth: date,
      riderId: newRiderId
    });
  };
  
  // Modal states
  const { isOpen: isNewRiderOpen, onOpen: onNewRiderOpen, onClose: onNewRiderClose } = useDisclosure();
  const { isOpen: isEditRiderOpen, onOpen: onEditRiderOpen, onClose: onEditRiderClose } = useDisclosure();

  // Process Menu State
  const { user } = useAuth();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);

  // Process Menu Navigation Handler
  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch riders from the new riders API
      const ridersResponse = await axios.get('/api/riders');
      setRiders(ridersResponse.data || []);

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
    } else if (params.get('tab') === 'all-riders') {
      setActiveTab(1);
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

  // Handle rider name/ID click
  const handleRiderClick = (e, riderId) => {
    e.stopPropagation();
    setSelectedRiderForModal(riderId);
  };

  // Handle new rider creation
  const handleCreateRider = async () => {
    // Validation
    if (!newRider.firstName || !newRider.lastName || !newRider.dateOfBirth) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (First Name, Last Name, Date of Birth)',
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

      const response = await axios.post('/api/riders', riderData);
      
      // Check for successful response (status 201)
      if (response.status === 201 || response.data.message) {
        toast({
          title: 'Success',
          description: `Rider ${newRider.firstName} ${newRider.lastName} created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reset form
        setNewRider({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          riderId: '',
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
        
        // Close modal and refresh data
        onNewRiderClose();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating rider:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create rider',
        status: 'error',
        duration: 5000,
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
      await axios.put(`/api/riders/${selectedRider._id}`, newRider);
      toast({
        title: 'Success',
        description: 'Rider updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditRiderClose();
      fetchData();
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
    if (window.confirm('Are you sure you want to delete this rider?')) {
      try {
        await axios.delete(`/api/riders/${riderId}`);
        toast({
          title: 'Success',
          description: 'Rider deleted successfully',
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
      
      {/* Process Menu */}
      <Flex justify="center" mt={6} mb={6}>
        <Box 
          position="relative"
          onMouseLeave={() => {
            processMenuTimeoutRef.current = setTimeout(() => {
              setIsProcessMenuOpen(false);
            }, 150);
          }}
          onMouseEnter={() => {
            if (processMenuTimeoutRef.current) {
              clearTimeout(processMenuTimeoutRef.current);
            }
            setIsProcessMenuOpen(true);
          }}
        >
          <Tooltip label="View process options" placement="bottom">
            <Button
              variant="outline"
              size={{ base: "sm", md: "md" }}
              colorScheme="blue"
              _hover={{ bg: "blue.50" }}
              onClick={() => setIsProcessMenuOpen(!isProcessMenuOpen)}
            >
              Process
            </Button>
          </Tooltip>
          
          {isProcessMenuOpen && (
            <Box
              position="absolute"
              top="100%"
              left="50%"
              transform="translateX(-50%)"
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="0 10px 25px rgba(0,0,0,0.15)"
              p={6}
              mt={2}
              minW={{ base: "280px", sm: "600px", md: "900px" }}
              zIndex={1100}
              pointerEvents="auto"
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                {/* Column 1: Trip Creation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/create-trip')}>
                      Create Trip
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/manage-trips')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/map')}>
                      View Map
                    </Button>
                  </VStack>
                </Box>

                {/* Column 2: Trip Views */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/upcoming')}>
                      Upcoming
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/completed')}>
                      Completed
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/all-trips')}>
                      All Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/active')}>
                      Active
                    </Button>
                  </VStack>
                </Box>

                {/* Column 3: Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    {user?.role !== 'dispatcher' && user?.role !== 'scheduler' && (
                      <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/users')}>
                        All Users
                      </Button>
                    )}
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/drivers')}>
                      Drivers
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/tracking')}>
                      Tracking
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/profile')}>
                      Profile
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Schedule
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/search')}>
                      Search
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/recurring-trips')}>
                      Recurring Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/analytics')}>
                      📊 Analytics Dashboard
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleExportSchedule('csv')}>
                      📥 Export as CSV
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleExportSchedule('json')}>
                      📥 Export as JSON
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => window.print()}>
                      🖨️ Print Schedule
                    </Button>
      
      <Box pt={{ base: 4, md: 0 }}>
        <Container maxW={{ base: "full", lg: "full" }} py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
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
                mb={4}
              >
                Manage riders, track history, and analyze rider engagement
              </Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="pink"
                size={{ base: "md", md: "lg" }}
                onClick={onNewRiderOpen}
                shadow="md"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.2s"
              >
                Add New Rider
              </Button>
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
                                        <Text 
                                          fontSize="sm" 
                                          fontWeight="bold"
                                          color="blue.600"
                                          cursor="pointer"
                                          _hover={{ textDecoration: 'underline' }}
                                          onClick={(e) => handleRiderClick(e, rider._id)}
                                        >
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
                                            <Text 
                                              fontWeight="bold" 
                                              fontSize="sm"
                                              color="blue.600"
                                              cursor="pointer"
                                              _hover={{ textDecoration: 'underline' }}
                                              onClick={(e) => handleRiderClick(e, rider._id)}
                                            >
                                              {rider.firstName} {rider.lastName}
                                            </Text>
                                            <Text 
                                              fontSize="xs" 
                                              color="blue.500"
                                              cursor="pointer"
                                              _hover={{ textDecoration: 'underline' }}
                                              onClick={(e) => handleRiderClick(e, rider._id)}
                                            >
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
                                            <Text 
                                              fontSize="sm" 
                                              fontWeight="medium"
                                              color="blue.600"
                                              cursor="pointer"
                                              _hover={{ textDecoration: 'underline' }}
                                              onClick={(e) => handleRiderClick(e, rider._id)}
                                            >
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
          dateOfBirth: '',
          riderId: '',
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
      }} size={{ base: "full", md: "2xl" }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} mx={{ base: 0, md: 4 }}>
          <ModalHeader 
            borderBottomWidth="1px" 
            borderColor="gray.200" 
            py={{ base: 4, md: 4 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack align="start" spacing={1}>
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                {isEditRiderOpen ? 'Edit Rider' : 'Add New Rider'}
              </Text>
              <Text fontSize="sm" fontWeight="normal" color="gray.600">
                {isEditRiderOpen ? 'Update rider information and service details' : 'Create a new rider profile with service balance'}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton top={{ base: 3, md: 4 }} right={{ base: 3, md: 4 }} />
          <ModalBody px={{ base: 4, md: 6 }} py={4}>
            <VStack spacing={{ base: 5, md: 6 }} align="stretch">
              {/* Basic Information */}
              <Box>
                <HStack mb={3} spacing={2}>
                  <Box as={UserIcon} w={5} h={5} color="blue.600" />
                  <Heading size="sm" color="gray.700">Contact Information</Heading>
                </HStack>
                <VStack spacing={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="semibold">First Name</FormLabel>
                      <Input
                        placeholder="Enter first name"
                        value={newRider.firstName}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow letters, spaces, hyphens, and apostrophes
                          if (!value || /^[a-zA-Z\s'-]*$/.test(value)) {
                            setNewRider({...newRider, firstName: value});
                          }
                        }}
                        size={{ base: "md", md: "md" }}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="semibold">Last Name</FormLabel>
                      <Input
                        placeholder="Enter last name"
                        value={newRider.lastName}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow letters, spaces, hyphens, and apostrophes
                          if (!value || /^[a-zA-Z\s'-]*$/.test(value)) {
                            setNewRider({...newRider, lastName: value});
                          }
                        }}
                        size={{ base: "md", md: "md" }}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">Phone Number</FormLabel>
                    <Input
                      placeholder="(555) 123-4567"
                      value={newRider.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers, spaces, parentheses, hyphens, and plus signs
                        if (!value || /^[\d\s()+-]*$/.test(value)) {
                          setNewRider({...newRider, phone: value});
                        }
                      }}
                      size={{ base: "md", md: "md" }}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Email <Text as="span" color="gray.500" fontWeight="normal">(Optional)</Text></FormLabel>
                    <Input
                      type="email"
                      placeholder="rider@example.com"
                      value={newRider.email}
                      onChange={(e) => setNewRider({...newRider, email: e.target.value})}
                      size={{ base: "md", md: "md" }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">Date of Birth</FormLabel>
                    <Input
                      type="date"
                      value={newRider.dateOfBirth}
                      onChange={(e) => handleDateOfBirthChange(e.target.value)}
                      size={{ base: "md", md: "md" }}
                    />
                  </FormControl>

                  {/* Display Generated Rider ID */}
                  {newRider.riderId && (
                    <Box p={3} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
                      <HStack justify="space-between" flexWrap="wrap">
                        <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                          Generated Rider ID:
                        </Text>
                        <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="md">
                          {newRider.riderId}
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">Home Address</FormLabel>
                    <PlacesAutocomplete
                      placeholder="Enter full street address"
                      value={newRider.address}
                      onChange={(address) => setNewRider({...newRider, address: address})}
                      onPlaceSelected={(place) => setNewRider({...newRider, address: place.address})}
                      isRequired
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Divider />

              {/* Service Balance Section */}
              <Card bg="blue.50" borderColor="blue.200" borderWidth="1px" size="sm">
                <CardHeader pb={2}>
                  <HStack spacing={2}>
                    <Box as={TicketIcon} w={5} h={5} color="blue.600" />
                    <Heading size="sm" color="blue.700">Service Balance</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="start">
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>Balance Type</FormLabel>
                      <RadioGroup
                        value={newRider.serviceBalanceType}
                        onChange={(value) => setNewRider({...newRider, serviceBalanceType: value})}
                      >
                        <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                          <Radio value="trips" colorScheme="blue">Trip Count</Radio>
                          <Radio value="dollars" colorScheme="blue">Dollar Amount</Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    {newRider.serviceBalanceType === 'trips' ? (
                      <FormControl w="full">
                        <FormLabel fontSize="sm" fontWeight="semibold">Number of Trips</FormLabel>
                        <Input
                          type="number"
                          value={newRider.tripBalance}
                          onChange={(e) => 
                            setNewRider({...newRider, tripBalance: parseInt(e.target.value) || 0})
                          }
                          min={0}
                          max={999}
                          placeholder="Enter number of trips"
                        />
                      </FormControl>
                    ) : (
                      <FormControl w="full">
                        <FormLabel fontSize="sm" fontWeight="semibold">Dollar Amount</FormLabel>
                        <InputGroup>
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.500"
                            children="$"
                            h="full"
                          />
                          <Input
                            type="number"
                            value={newRider.dollarBalance}
                            onChange={(e) => 
                              setNewRider({...newRider, dollarBalance: parseFloat(e.target.value) || 0})
                            }
                            min={0}
                            step={0.01}
                            pl={8}
                            placeholder="Enter dollar amount"
                          />
                        </InputGroup>
                      </FormControl>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Contract Management Section */}
              <Card bg="purple.50" borderColor="purple.200" borderWidth="1px" size="sm">
                <CardHeader pb={2}>
                  <HStack spacing={2}>
                    <Box as={DocumentTextIcon} w={5} h={5} color="purple.600" />
                    <Heading size="sm" color="purple.700">Contract Management</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="start">
                    <Checkbox
                      isChecked={newRider.isContractBased}
                      onChange={(e) => setNewRider({...newRider, isContractBased: e.target.checked})}
                      colorScheme="purple"
                    >
                      <Text fontSize="sm">This service is contract-based</Text>
                    </Checkbox>

                    {newRider.isContractBased && (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="semibold">Contract Start Date</FormLabel>
                          <Input
                            type="date"
                            value={newRider.contractStartDate}
                            onChange={(e) => setNewRider({...newRider, contractStartDate: e.target.value})}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm" fontWeight="semibold">Contract End Date</FormLabel>
                          <Input
                            type="date"
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
              <Card bg="green.50" borderColor="green.200" borderWidth="1px" size="sm">
                <CardHeader pb={2}>
                  <HStack spacing={2}>
                    <Box as={CalculatorIcon} w={5} h={5} color="green.600" />
                    <Heading size="sm" color="green.700">Pricing & Mileage</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">Price Per Ride</FormLabel>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.500"
                          children="$"
                          h="full"
                        />
                        <Input
                          type="number"
                          value={newRider.pricePerRide}
                          onChange={(e) => 
                            setNewRider({...newRider, pricePerRide: parseFloat(e.target.value) || 0})
                          }
                          min={0}
                          step={0.01}
                          pl={8}
                          placeholder="0.00"
                        />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">Mileage Balance</FormLabel>
                      <InputGroup>
                        <Input
                          type="number"
                          value={newRider.mileageBalance}
                          onChange={(e) => 
                            setNewRider({...newRider, mileageBalance: parseInt(e.target.value) || 0})
                          }
                          min={0}
                          placeholder="Enter miles"
                        />
                        <InputRightAddon children="mi" fontSize="xs" />
                      </InputGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">Price Per Mile</FormLabel>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.500"
                          children="$"
                          h="full"
                        />
                        <Input
                          type="number"
                          value={newRider.pricePerMile}
                          onChange={(e) => 
                            setNewRider({...newRider, pricePerMile: parseFloat(e.target.value) || 0})
                          }
                          min={0}
                          step={0.01}
                          pl={8}
                          placeholder="0.00"
                        />
                      </InputGroup>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Notes Section */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Additional Notes <Text as="span" color="gray.500" fontWeight="normal">(Optional)</Text>
                </FormLabel>
                <Textarea
                  placeholder="Add any special requirements, accessibility needs, or other important information..."
                  value={newRider.notes}
                  onChange={(e) => setNewRider({...newRider, notes: e.target.value})}
                  rows={4}
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter 
            borderTopWidth="1px" 
            borderColor="gray.200" 
            px={{ base: 4, md: 6 }}
            py={{ base: 4, md: 4 }}
            bg="gray.50"
          >
            <HStack spacing={3} w="full" justify="flex-end" flexWrap={{ base: "wrap", md: "nowrap" }}>
              <Button 
                variant="ghost" 
                onClick={() => {
                  onNewRiderClose();
                  onEditRiderClose();
                  setSelectedRider(null);
                }}
                w={{ base: "full", md: "auto" }}
                size={{ base: "md", md: "md" }}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="pink" 
                onClick={isEditRiderOpen ? handleUpdateRider : handleCreateRider}
                isDisabled={!newRider.firstName || !newRider.lastName || !newRider.phone || !newRider.dateOfBirth}
                leftIcon={isEditRiderOpen ? <EditIcon /> : <AddIcon />}
                w={{ base: "full", md: "auto" }}
                size={{ base: "md", md: "md" }}
                px={8}
              >
                {isEditRiderOpen ? 'Update Rider' : 'Save Rider'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rider Info Modal */}
      <RiderInfoModal
        isOpen={!!selectedRiderForModal}
        onClose={() => setSelectedRiderForModal(null)}
        riderId={selectedRiderForModal}
      />
    </Box>
  );
};

export default ComprehensiveRiderDashboard;