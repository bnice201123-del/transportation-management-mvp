// Driver Dashboard Component - Fixed location object rendering
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
  Switch,
  FormControl,
  FormLabel,
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  Select,
  Textarea,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  EyeIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PencilIcon,
  ChevronDownIcon,
  TruckIcon,
  MapPinIcon,
  ArrowRightIcon,
  MapIcon,
  UserIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  TruckIcon as TruckIconSolid,
  MapPinIcon as MapPinIconSolid,
  UserIcon as UserIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';
import GoogleMap from '../maps/GoogleMap';
import RiderInfoModal from '../shared/RiderInfoModal';
import DriveMode from './DriveMode';

const ComprehensiveDriverDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [reportType, setReportType] = useState('all');
  const [selectedRider, setSelectedRider] = useState({ id: null, name: null });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();
  const { isOpen: isRiderInfoOpen, onOpen: onRiderInfoOpen, onClose: onRiderInfoClose } = useDisclosure();
  const [navigationModal, setNavigationModal] = useState({ isOpen: false, address: '', coordinates: null });

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch trips
      const tripsResponse = await axios.get('/api/trips');
      const userTrips = (tripsResponse.data.data?.trips || []).filter(trip => 
        trip.assignedDriver && trip.assignedDriver._id === user._id
      );
      setTrips(userTrips);

      // Fetch vehicles assigned to driver
      const vehiclesResponse = await axios.get('/api/vehicles');
      const assignedVehicles = (vehiclesResponse.data.data?.vehicles || []).filter(vehicle =>
        vehicle.assignedDriver && vehicle.assignedDriver.includes(user.firstName + ' ' + user.lastName)
      );
      setVehicles(assignedVehicles);

      // Fetch driver status (in a real app, this would be from a driver status endpoint)
      // For now, we'll simulate this
      setIsAvailable(true);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);



  // Trip statistics
  const myTrips = trips.filter(trip => 
    trip.assignedDriver && trip.assignedDriver._id === user._id
  );
  const activeTrips = myTrips.filter(trip => 
    ['assigned', 'in_progress'].includes(trip.status)
  );
  const completedTrips = myTrips.filter(trip => trip.status === 'completed');
  const todayTrips = myTrips.filter(trip => {
    const today = new Date().toDateString();
    return new Date(trip.scheduledDate).toDateString() === today;
  });

  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'assigned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const updateAvailability = async (available) => {
    try {
      setUpdating(true);
      // In a real implementation, this would call an API to update driver availability
      setIsAvailable(available);
      toast({
        title: 'Status Updated',
        description: `You are now ${available ? 'AVAILABLE' : 'UNAVAILABLE'} for trips`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle rider name click
  const handleRiderClick = (e, riderId, riderName) => {
    e.stopPropagation();
    setSelectedRider({ id: riderId, name: riderName });
    onRiderInfoOpen();
  };

  // Navigation function to open destination in maps app
  const navigateToDestination = (trip) => {
    const dropoffLocation = trip.dropoffLocation;
    
    // Extract destination address or coordinates
    let destination = '';
    let coordinates = null;
    
    if (dropoffLocation?.address) {
      destination = dropoffLocation.address;
    } else if (dropoffLocation?.lat && dropoffLocation?.lng) {
      destination = `${dropoffLocation.lat},${dropoffLocation.lng}`;
    } else if (typeof dropoffLocation === 'string') {
      destination = dropoffLocation;
    }
    
    // Extract coordinates if available
    if (dropoffLocation?.coordinates && Array.isArray(dropoffLocation.coordinates)) {
      coordinates = {
        lat: dropoffLocation.coordinates[1],
        lng: dropoffLocation.coordinates[0]
      };
    } else if (dropoffLocation?.lat && dropoffLocation?.lng) {
      coordinates = {
        lat: dropoffLocation.lat,
        lng: dropoffLocation.lng
      };
    }
    
    if (destination) {
      // Open navigation modal instead of external Google Maps
      setNavigationModal({ isOpen: true, address: destination, coordinates });
      
      toast({
        title: 'Opening Navigation',
        description: `Opening route to ${destination.length > 50 ? destination.substring(0, 50) + '...' : destination}`,
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Navigation Error',
        description: 'Destination address not available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(location);
          toast({
            title: 'Location Updated',
            description: 'Your location has been updated successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        },
        () => {
          toast({
            title: 'Location Error',
            description: 'Failed to get your location',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      );
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Navbar title="Driver Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" color="teal.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Driver Dashboard" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Welcome Header */}
            <Box textAlign="center" py={{ base: 4, md: 6 }}>
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                color="teal.600" 
                mb={2}
              >
                Welcome back, {user?.firstName}!
              </Heading>
              <Text 
                color={textColor} 
                fontSize={{ base: "md", md: "lg" }}
              >
                Manage your trips, check your schedule, and track your performance
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
                      color={isAvailable ? 'green.500' : 'red.500'}
                    >
                      {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Status
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
                      {activeTrips.length}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Active Trips
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
                      {completedTrips.length}
                    </Text>
                    <Text 
                      color={textColor} 
                      fontSize={{ base: "xs", md: "sm" }}
                      fontWeight="medium"
                    >
                      Completed Total
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
                      {todayTrips.length}
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
                  colorScheme="teal"
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
                        color: "teal.600", 
                        borderColor: "teal.500",
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
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      🚗 My Trips
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      📊 Reports
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      🚙 Vehicle
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      📍 Location
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      ⚙️ Settings
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      👤 Profile
                    </Tab>
                    <Tab 
                      flex={{ base: "1", sm: "initial" }}
                      fontSize={{ base: "sm", md: "md" }}
                      py={{ base: 3, md: 4 }}
                      _selected={{ 
                        color: "teal.600", 
                        borderColor: "teal.500",
                        bg: "white"
                      }}
                    >
                      🚗 Drive Mode
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Dashboard Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        {/* Driver Status Control */}
                        <Card bg="teal.50" borderColor="teal.200" borderWidth="1px">
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" color="teal.700">
                                  Driver Availability
                                </Text>
                                <Text fontSize="sm" color="teal.600">
                                  Toggle to {isAvailable ? 'go offline' : 'go online'}
                                </Text>
                              </VStack>
                              <FormControl display="flex" alignItems="center" w="auto">
                                <Switch
                                  size="lg"
                                  isChecked={isAvailable}
                                  onChange={(e) => updateAvailability(e.target.checked)}
                                  isDisabled={updating}
                                  colorScheme="teal"
                                />
                              </FormControl>
                            </HStack>
                          </CardBody>
                        </Card>

                        {/* Active Trips Section */}
                        <Card>
                          <CardHeader>
                            <HStack justify="space-between" align="center">
                              <Heading size="md" color="teal.600">
                                Active Trips ({activeTrips.length})
                              </Heading>
                              <Badge colorScheme="teal" px={2} py={1}>
                                In Progress
                              </Badge>
                            </HStack>
                          </CardHeader>
                          <CardBody>
                            {activeTrips.length === 0 ? (
                              <Center py={8}>
                                <VStack spacing={4}>
                                  <Text color="gray.500" fontSize="lg">
                                    No active trips assigned
                                  </Text>
                                  {!isAvailable && (
                                    <Alert status="info" rounded="md" maxW="md">
                                      <AlertIcon />
                                      <VStack align="start" spacing={1}>
                                        <Text fontWeight="bold">Go Online to Receive Trips</Text>
                                        <Text fontSize="sm">
                                          Set your status to available to receive trip assignments
                                        </Text>
                                      </VStack>
                                    </Alert>
                                  )}
                                </VStack>
                              </Center>
                            ) : (
                              <VStack spacing={4} align="stretch">
                                {activeTrips.map((trip) => (
                                  <Card key={trip._id} variant="outline" borderColor="teal.200">
                                    <CardBody>
                                      <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" color="teal.600">
                                              Trip ID: {trip.tripId}
                                            </Text>
                                            <HStack>
                                              <Text fontSize="sm" color="gray.600">
                                                Rider:
                                              </Text>
                                              <Text 
                                                fontSize="sm" 
                                                color="blue.600"
                                                fontWeight="medium"
                                                cursor="pointer"
                                                _hover={{ textDecoration: 'underline', color: 'blue.700' }}
                                                onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, trip.riderName)}
                                              >
                                                {trip.riderName}
                                              </Text>
                                            </HStack>
                                          </VStack>
                                          <Badge 
                                            colorScheme={getStatusColor(trip.status)} 
                                            px={3} 
                                            py={1}
                                            fontSize="xs"
                                          >
                                            {trip.status.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                        </HStack>

                                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                                          <VStack align="start" spacing={2}>
                                            <Text fontSize="sm" fontWeight="bold" color="green.600">
                                              📍 Pickup: {trip.pickupLocation?.address || trip.pickupLocation}
                                            </Text>
                                            <Text fontSize="sm" fontWeight="bold" color="red.600">
                                              🏁 Dropoff: {trip.dropoffLocation?.address || trip.dropoffLocation}
                                            </Text>
                                          </VStack>
                                          <VStack align={{ base: "start", md: "end" }} spacing={2}>
                                            <Text fontSize="sm">
                                              🕐 {formatDate(trip.scheduledDate)}
                                            </Text>
                                            <HStack spacing={2}>
                                              <Button
                                                size="sm"
                                                colorScheme="green"
                                                leftIcon={<Box as={PlayIcon} w={4} h={4} />}
                                                onClick={() => {
                                                  setSelectedTrip(trip);
                                                  setActiveTab(7); // Drive Mode tab
                                                }}
                                              >
                                                Drive
                                              </Button>
                                              {trip.phone && (
                                                <Button
                                                  size="sm"
                                                  colorScheme="teal"
                                                  leftIcon={<PhoneIcon />}
                                                  as="a"
                                                  href={`tel:${trip.phone}`}
                                                >
                                                  Call
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                colorScheme="blue"
                                                leftIcon={<Box as={TruckIconSolid} w={4} h={4} />}
                                                onClick={() => navigateToDestination(trip)}
                                              >
                                                Navigate
                                              </Button>
                                            </HStack>
                                          </VStack>
                                        </Grid>

                                        {trip.notes && (
                                          <Box 
                                            p={3} 
                                            bg="yellow.50" 
                                            rounded="md" 
                                            border="1px solid" 
                                            borderColor="yellow.200"
                                          >
                                            <Text fontSize="sm">
                                              <strong>Notes:</strong> {trip.notes}
                                            </Text>
                                          </Box>
                                        )}
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                ))}
                              </VStack>
                            )}
                          </CardBody>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                          <CardHeader>
                            <Heading size="md" color="teal.600">Quick Actions</Heading>
                          </CardHeader>
                          <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                              <Button
                                leftIcon={<Box as={ArrowRightIcon} w={4} h={4} />}
                                colorScheme="teal"
                                variant="outline"
                                onClick={getCurrentLocation}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                Update Location
                              </Button>
                              <Button
                                leftIcon={<Box as={ClockIconSolid} w={4} h={4} />}
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => setActiveTab(2)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                View Reports
                              </Button>
                              <Button
                                leftIcon={<Box as={TruckIconSolid} w={4} h={4} />}
                                colorScheme="purple"
                                variant="outline"
                                onClick={() => setActiveTab(3)}
                                size={{ base: "md", md: "lg" }}
                                py={{ base: 6, md: 8 }}
                              >
                                Vehicle Status
                              </Button>
                            </Grid>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* My Trips Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
                          <Heading size="md" color="teal.600">
                            My Trip History ({myTrips.length} trips)
                          </Heading>
                          <HStack spacing={2}>
                            <Select 
                              placeholder="Filter by status" 
                              size="sm" 
                              maxW="150px"
                              value={reportType}
                              onChange={(e) => setReportType(e.target.value)}
                            >
                              <option value="all">All Trips</option>
                              <option value="completed">Completed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="assigned">Assigned</option>
                              <option value="cancelled">Cancelled</option>
                            </Select>
                          </HStack>
                        </HStack>

                        {myTrips.length === 0 ? (
                          <Center py={12}>
                            <VStack spacing={4}>
                              <Box as={TruckIconSolid} w={12} h={12} color="gray.400" />
                              <Text color="gray.500" fontSize="lg" textAlign="center">
                                No trips found
                              </Text>
                              <Text color="gray.400" fontSize="sm" textAlign="center">
                                Your trip history will appear here once you start completing rides
                              </Text>
                            </VStack>
                          </Center>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {myTrips.slice(0, 10).map((trip) => (
                              <Card key={trip._id} variant="outline">
                                <CardBody>
                                  <Grid 
                                    templateColumns={{ base: "1fr", md: "2fr 1fr 1fr" }} 
                                    gap={4} 
                                    alignItems="center"
                                  >
                                    <VStack align="start" spacing={2}>
                                      <HStack spacing={3}>
                                        <Text fontWeight="bold" color="teal.600">
                                          {trip.tripId}
                                        </Text>
                                        <Badge colorScheme={getStatusColor(trip.status)} px={2} py={1}>
                                          {trip.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600">
                                          Rider:
                                        </Text>
                                        <Text 
                                          fontSize="sm" 
                                          color="blue.600"
                                          fontWeight="medium"
                                          cursor="pointer"
                                          _hover={{ textDecoration: 'underline', color: 'blue.700' }}
                                          onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, trip.riderName)}
                                        >
                                          {trip.riderName}
                                        </Text>
                                      </HStack>
                                      <Text fontSize="xs" color="gray.500">
                                        📍 {trip.pickupLocation?.address || trip.pickupLocation} → {trip.dropoffLocation?.address || trip.dropoffLocation}
                                      </Text>
                                    </VStack>

                                    <VStack align={{ base: "start", md: "center" }} spacing={1}>
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

                                    <HStack justify={{ base: "start", md: "end" }} spacing={2}>
                                      {(trip.status === 'assigned' || trip.status === 'in_progress') && (
                                        <Button
                                          size="sm"
                                          leftIcon={<Box as={PlayIcon} w={4} h={4} />}
                                          colorScheme="green"
                                          onClick={() => {
                                            setSelectedTrip(trip);
                                            setActiveTab(7); // Drive Mode is the 8th tab (index 7)
                                          }}
                                        >
                                          Drive
                                        </Button>
                                      )}
                                      {trip.phone && (
                                        <IconButton
                                          size="sm"
                                          icon={<PhoneIcon />}
                                          colorScheme="teal"
                                          variant="outline"
                                          as="a"
                                          href={`tel:${trip.phone}`}
                                          aria-label="Call rider"
                                        />
                                      )}
                                      <IconButton
                                        size="sm"
                                        icon={<Box as={TruckIconSolid} w={4} h={4} />}
                                        colorScheme="blue"
                                        variant="outline"
                                        onClick={() => navigateToDestination(trip)}
                                        aria-label="Navigate to destination"
                                      />
                                      <IconButton
                                        size="sm"
                                        icon={<EyeIcon />}
                                        colorScheme="gray"
                                        variant="outline"
                                        aria-label="View details"
                                      />
                                    </HStack>
                                  </Grid>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Reports Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap">
                          <Heading size="md" color="teal.600">
                            Performance Reports
                          </Heading>
                          <Button
                            leftIcon={<Box as={FunnelIcon} w={4} h={4} />}
                            colorScheme="teal"
                            variant="outline"
                            size="sm"
                            onClick={onReportOpen}
                          >
                            Filter Reports
                          </Button>
                        </HStack>

                        {/* Performance Stats */}
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                          <Stat bg={cardBg} p={6} rounded="lg" shadow="md">
                            <StatLabel>Total Trips Completed</StatLabel>
                            <StatNumber color="green.500">{completedTrips.length}</StatNumber>
                            <StatHelpText>Lifetime achievement</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={6} rounded="lg" shadow="md">
                            <StatLabel>Completion Rate</StatLabel>
                            <StatNumber color="blue.500">
                              {myTrips.length > 0 
                                ? Math.round((completedTrips.length / myTrips.length) * 100)
                                : 0}%
                            </StatNumber>
                            <StatHelpText>Trip success rate</StatHelpText>
                          </Stat>

                          <Stat bg={cardBg} p={6} rounded="lg" shadow="md">
                            <StatLabel>This Month</StatLabel>
                            <StatNumber color="purple.500">
                              {myTrips.filter(trip => {
                                const tripDate = new Date(trip.scheduledDate);
                                const now = new Date();
                                return tripDate.getMonth() === now.getMonth() && 
                                       tripDate.getFullYear() === now.getFullYear();
                              }).length}
                            </StatNumber>
                            <StatHelpText>Trips this month</StatHelpText>
                          </Stat>
                        </SimpleGrid>

                        {/* Recent Trip Performance */}
                        <Card>
                          <CardHeader>
                            <Heading size="sm">Recent Trip Analysis</Heading>
                          </CardHeader>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Date</Th>
                                    <Th>Trip ID</Th>
                                    <Th>Status</Th>
                                    <Th>Rider</Th>
                                    <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {myTrips.slice(0, 5).map((trip) => (
                                    <Tr key={trip._id}>
                                      <Td fontSize="sm">
                                        {new Date(trip.scheduledDate).toLocaleDateString()}
                                      </Td>
                                      <Td fontSize="sm" fontWeight="medium">
                                        {trip.tripId}
                                      </Td>
                                      <Td>
                                        <Badge 
                                          colorScheme={getStatusColor(trip.status)} 
                                          fontSize="xs"
                                        >
                                          {trip.status}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <Text 
                                          fontSize="sm"
                                          color="blue.600"
                                          fontWeight="medium"
                                          cursor="pointer"
                                          _hover={{ textDecoration: 'underline', color: 'blue.700' }}
                                          onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, trip.riderName)}
                                        >
                                          {trip.riderName}
                                        </Text>
                                      </Td>
                                      <Td fontSize="xs" color="gray.500" display={{ base: "none", md: "table-cell" }}>
                                        {trip.pickupLocation?.address || trip.pickupLocation}
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

                    {/* Vehicle Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="teal.600">
                          Assigned Vehicles
                        </Heading>

                        {vehicles.length === 0 ? (
                          <Center py={12}>
                            <VStack spacing={4}>
                              <Box as={TruckIconSolid} w={12} h={12} color="gray.400" />
                              <Text color="gray.500" fontSize="lg">
                                No vehicles assigned
                              </Text>
                              <Text color="gray.400" fontSize="sm" textAlign="center">
                                Contact your dispatcher for vehicle assignment
                              </Text>
                            </VStack>
                          </Center>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {vehicles.map((vehicle) => (
                              <Card key={vehicle._id} variant="outline">
                                <CardBody>
                                  <Grid 
                                    templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} 
                                    gap={6} 
                                    alignItems="center"
                                  >
                                    <VStack align="start" spacing={2}>
                                      <HStack spacing={3}>
                                        <Text fontWeight="bold" color="teal.600" fontSize="lg">
                                          {vehicle.make} {vehicle.model}
                                        </Text>
                                        <Badge 
                                          colorScheme={
                                            vehicle.status === 'active' ? 'green' : 
                                            vehicle.status === 'maintenance' ? 'orange' : 'red'
                                          }
                                        >
                                          {vehicle.status?.toUpperCase()}
                                        </Badge>
                                      </HStack>
                                      <Text fontSize="sm" color="gray.600">
                                        License: {vehicle.licensePlate}
                                      </Text>
                                      <Text fontSize="sm" color="gray.500">
                                        Year: {vehicle.year} | Capacity: {vehicle.capacity} passengers
                                      </Text>
                                    </VStack>

                                    <VStack align={{ base: "start", md: "center" }} spacing={2}>
                                      <Text fontSize="sm" fontWeight="bold">
                                        Fuel Level: {vehicle.fuelLevel || 85}%
                                      </Text>
                                      <Box w="100px" bg="gray.200" rounded="full" h="6px">
                                        <Box 
                                          w={`${vehicle.fuelLevel || 85}%`} 
                                          bg={
                                            (vehicle.fuelLevel || 85) > 50 ? 'green.400' : 
                                            (vehicle.fuelLevel || 85) > 25 ? 'yellow.400' : 'red.400'
                                          }
                                          h="100%" 
                                          rounded="full"
                                        />
                                      </Box>
                                    </VStack>

                                    <VStack align={{ base: "start", md: "end" }} spacing={2}>
                                      <Text fontSize="sm">
                                        Next Service: {vehicle.nextService || 'TBD'}
                                      </Text>
                                      <HStack spacing={2}>
                                        <Button size="sm" colorScheme="teal" variant="outline">
                                          Report Issue
                                        </Button>
                                      </HStack>
                                    </VStack>
                                  </Grid>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Location Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="teal.600">
                          Location Tracking
                        </Heading>

                        <Card>
                          <CardBody>
                            <VStack spacing={6} align="stretch">
                              <HStack justify="space-between" align="center">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold">Current Location</Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {currentLocation 
                                      ? `Lat: ${currentLocation.latitude.toFixed(6)}, Lng: ${currentLocation.longitude.toFixed(6)}`
                                      : 'Location not available'
                                    }
                                  </Text>
                                </VStack>
                                <Button
                                  leftIcon={<Box as={ArrowRightIcon} w={4} h={4} />}
                                  colorScheme="teal"
                                  onClick={getCurrentLocation}
                                  size="sm"
                                >
                                  Update Location
                                </Button>
                              </HStack>

                              {currentLocation && (
                                <Text fontSize="sm" color="gray.500">
                                  Last updated: {new Date().toLocaleString()}
                                </Text>
                              )}

                              <Divider />

                              <VStack align="start" spacing={3}>
                                <Text fontWeight="bold">Location Settings</Text>
                                
                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel htmlFor="auto-location" mb="0" flex="1">
                                    Auto-update location while on duty
                                  </FormLabel>
                                  <Switch id="auto-location" colorScheme="teal" />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel htmlFor="share-location" mb="0" flex="1">
                                    Share location with dispatch
                                  </FormLabel>
                                  <Switch id="share-location" colorScheme="teal" defaultChecked />
                                </FormControl>

                                <Alert status="info" rounded="md" fontSize="sm">
                                  <AlertIcon />
                                  Location sharing helps dispatch assign nearby trips and track your safety.
                                </Alert>
                              </VStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Settings Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="teal.600">
                          Driver Settings
                        </Heading>

                        <VStack spacing={6} align="stretch">
                          <Card>
                            <CardHeader>
                              <Heading size="sm">Notification Preferences</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel mb="0" flex="1">
                                    New trip notifications
                                  </FormLabel>
                                  <Switch colorScheme="teal" defaultChecked />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel mb="0" flex="1">
                                    Trip updates via SMS
                                  </FormLabel>
                                  <Switch colorScheme="teal" defaultChecked />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel mb="0" flex="1">
                                    Weekly performance reports
                                  </FormLabel>
                                  <Switch colorScheme="teal" />
                                </FormControl>
                              </VStack>
                            </CardBody>
                          </Card>

                          <Card>
                            <CardHeader>
                              <Heading size="sm">Work Preferences</Heading>
                            </CardHeader>
                            <CardBody>
                              <VStack spacing={4} align="stretch">
                                <FormControl>
                                  <FormLabel>Preferred work hours</FormLabel>
                                  <HStack>
                                    <Select placeholder="Start time" flex="1">
                                      <option value="06:00">6:00 AM</option>
                                      <option value="07:00">7:00 AM</option>
                                      <option value="08:00">8:00 AM</option>
                                      <option value="09:00">9:00 AM</option>
                                    </Select>
                                    <Text>to</Text>
                                    <Select placeholder="End time" flex="1">
                                      <option value="16:00">4:00 PM</option>
                                      <option value="17:00">5:00 PM</option>
                                      <option value="18:00">6:00 PM</option>
                                      <option value="19:00">7:00 PM</option>
                                    </Select>
                                  </HStack>
                                </FormControl>

                                <FormControl>
                                  <FormLabel>Maximum trip distance (miles)</FormLabel>
                                  <Select placeholder="Select max distance">
                                    <option value="10">10 miles</option>
                                    <option value="25">25 miles</option>
                                    <option value="50">50 miles</option>
                                    <option value="unlimited">Unlimited</option>
                                  </Select>
                                </FormControl>
                              </VStack>
                            </CardBody>
                          </Card>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* Profile Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        <Heading size="md" color="teal.600">
                          Driver Profile
                        </Heading>

                        <Card>
                          <CardBody>
                            <VStack spacing={6} align="stretch">
                              <HStack spacing={4} align="center">
                                <Avatar 
                                  size="xl" 
                                  name={`${user?.firstName} ${user?.lastName}`}
                                  bg="teal.500"
                                />
                                <VStack align="start" spacing={1} flex="1">
                                  <Text fontSize="2xl" fontWeight="bold">
                                    {user?.firstName} {user?.lastName}
                                  </Text>
                                  <Text color="gray.600">Professional Driver</Text>
                                  <Badge colorScheme="teal" px={3} py={1}>
                                    Active Status
                                  </Badge>
                                </VStack>
                              </HStack>

                              <Divider />

                              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                <VStack align="start" spacing={3}>
                                  <Text fontWeight="bold" color="teal.600">Contact Information</Text>
                                  <VStack align="start" spacing={2}>
                                    <HStack>
                                      <Box as={EnvelopeIcon} w={4} h={4} color="gray.500" />
                                      <Text fontSize="sm">{user?.email}</Text>
                                    </HStack>
                                    <HStack>
                                      <PhoneIcon color="gray.500" />
                                      <Text fontSize="sm">{user?.phone || 'Not provided'}</Text>
                                    </HStack>
                                  </VStack>
                                </VStack>

                                <VStack align="start" spacing={3}>
                                  <Text fontWeight="bold" color="teal.600">Driver Statistics</Text>
                                  <VStack align="start" spacing={2}>
                                    <Text fontSize="sm">
                                      <strong>Total Trips:</strong> {myTrips.length}
                                    </Text>
                                    <Text fontSize="sm">
                                      <strong>Completed:</strong> {completedTrips.length}
                                    </Text>
                                    <Text fontSize="sm">
                                      <strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </Text>
                                  </VStack>
                                </VStack>
                              </Grid>

                              <Button leftIcon={<Box as={PencilIcon} w={4} h={4} />} colorScheme="teal" variant="outline">
                                Edit Profile
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                      </VStack>
                    </TabPanel>

                    {/* Drive Mode Tab */}
                    <TabPanel px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                      <DriveMode
                        trip={selectedTrip}
                        onComplete={async () => {
                          if (selectedTrip) {
                            await updateTripStatus(selectedTrip._id, 'completed');
                            setSelectedTrip(null);
                            setActiveTab(0); // Return to dashboard
                          }
                        }}
                        onCancel={async () => {
                          if (selectedTrip) {
                            await updateTripStatus(selectedTrip._id, 'cancelled');
                            setSelectedTrip(null);
                            setActiveTab(0); // Return to dashboard
                          }
                        }}
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* Report Filter Modal */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filter Reports</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <Input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Trip Status</FormLabel>
                <Select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="all">All Trips</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="assigned">Assigned</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={onReportClose}>
              Apply Filters
            </Button>
            <Button variant="ghost" onClick={onReportClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Navigation Modal - In-App Navigation */}
      <Modal 
        isOpen={navigationModal.isOpen} 
        onClose={() => setNavigationModal({ isOpen: false, address: '', coordinates: null })} 
        size="6xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent maxW="90vw" maxH="90vh">
          <ModalHeader>Navigate to {navigationModal.address}</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            <GoogleMap
              center={navigationModal.coordinates || { lat: 40.7589, lng: -73.9851 }}
              zoom={15}
              markers={navigationModal.coordinates ? [{
                position: navigationModal.coordinates,
                title: navigationModal.address
              }] : []}
              height="70vh"
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={() => {
                // Open in external Google Maps as fallback
                const encodedAddress = encodeURIComponent(navigationModal.address);
                const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                window.open(url, '_blank');
              }}
            >
              Open in Google Maps
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setNavigationModal({ isOpen: false, address: '', coordinates: null })}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rider Info Modal */}
      <RiderInfoModal
        isOpen={isRiderInfoOpen}
        onClose={onRiderInfoClose}
        riderId={selectedRider.id}
        riderName={selectedRider.name}
      />
    </Box>
  );
};

export default ComprehensiveDriverDashboard;