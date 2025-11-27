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
  const [accordionIndex, setAccordionIndex] = useState(0); // For mobile accordion
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

  // Color scheme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Debug: Monitor activeTab changes
  useEffect(() => {
    console.log('[Debug] activeTab changed to:', activeTab);
  }, [activeTab]);

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

      // Fetch vehicles assigned to driver using dedicated endpoint
      try {
        const vehiclesResponse = await axios.get('/api/vehicles/driver/assigned');
        const assignedVehicle = vehiclesResponse.data.vehicle;
        setVehicles(assignedVehicle ? [assignedVehicle] : []);
      } catch (error) {
        console.error('Error fetching assigned vehicle:', error);
        setVehicles([]);
      }

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

  // Helper function to safely get rider name (handles both string and object)
  const getRiderName = (trip) => {
    if (!trip) return 'Unknown';
    
    // If riderName is a string, return it
    if (typeof trip.riderName === 'string') {
      return trip.riderName;
    }
    
    // If riderName is an object (populated rider), extract the name
    if (trip.riderName && typeof trip.riderName === 'object') {
      const rider = trip.riderName;
      return `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || rider.email || 'Unknown';
    }
    
    // If rider is populated instead
    if (trip.rider && typeof trip.rider === 'object') {
      const rider = trip.rider;
      return `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || rider.email || 'Unknown';
    }
    
    return 'Unknown';
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

  // Update trip status with enhanced metrics
  const updateTripStatus = async (tripId, status, tripData = null) => {
    try {
      console.log('updateTripStatus called with:', { tripId, status, tripData });
      
      const payload = { 
        status,
        location: currentLocation
      };

      // If trip data is provided (from Drive Mode), include it
      if (tripData) {
        payload.tripMetrics = {
          completionTime: tripData.completionTime,
          startTime: tripData.startTime,
          durationMinutes: tripData.durationMinutes,
          distanceTraveled: tripData.distanceTraveled,
          averageSpeed: tripData.averageSpeed,
          finalLocation: tripData.currentLocation,
          finalHeading: tripData.finalHeading,
          cancellationReason: tripData.cancellationReason || null
        };
      }

      console.log('Sending payload to backend:', payload);
      
      const response = await axios.patch(`/api/trips/${tripId}/status`, payload);
      
      console.log('Backend response:', response.data);
      
      toast({
        title: 'Success',
        description: tripData 
          ? `Trip ${status}: ${tripData.durationMinutes} min, ${tripData.distanceTraveled} mi`
          : `Trip status updated to ${status.replace('_', ' ')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchData(); // Refresh trips
    } catch (error) {
      console.error('Error in updateTripStatus:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to update trip status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error; // Re-throw so DriveMode can catch it
    }
  };

  // Handle rider name click
  const handleRiderClick = (e, riderId, riderName) => {
    e.stopPropagation();
    setSelectedRider({ id: riderId, name: riderName });
    onRiderInfoOpen();
  };

  const getCurrentLocation = async () => {
    console.log('[Update Location] Starting...');
    console.log('[Update Location] Current activeTab:', activeTab);
    console.log('[Update Location] navigator.geolocation available?', !!navigator.geolocation);
    
    if (!navigator.geolocation) {
      console.log('[Update Location] Geolocation NOT supported');
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by your browser',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('[Update Location] Requesting position from browser...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('[Update Location] SUCCESS - Got position callback:', position);
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('[Update Location] Got coordinates:', location);
        setCurrentLocation(location);
        
        // Save location to backend
        try {
          const token = localStorage.getItem('token');
          const userId = user.id || user._id;
          console.log('[Update Location] Saving to backend... userId:', userId);
          console.log('[Update Location] Token present?', !!token);
          
          const response = await axios.patch(`http://localhost:5000/api/users/${userId}/location`, {
            lat: location.lat,
            lng: location.lng
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('[Update Location] Backend response:', response.data);
          
          toast({
            title: 'Location Updated',
            description: 'Your location has been saved successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Automatically redirect to Location tab (index 4)
          console.log('[Update Location] About to redirect to Location tab (index 4)');
          console.log('[Update Location] Current activeTab before setActiveTab:', activeTab);
          setActiveTab(4);
          console.log('[Update Location] Called setActiveTab(4)');
          
          // Scroll to top to ensure tab change is visible
          setTimeout(() => {
            console.log('[Update Location] After setTimeout - checking if redirect worked');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        } catch (error) {
          console.error('[Update Location] Error saving location:', error);
          console.error('[Update Location] Error details:', error.response?.data);
          toast({
            title: 'Location Error',
            description: error.response?.data?.message || 'Location retrieved but failed to save to server',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      },
      (error) => {
        console.error('[Update Location] ERROR - Geolocation failed:', error);
        console.error('[Update Location] Error code:', error.code);
        console.error('[Update Location] Error message:', error.message);
        toast({
          title: 'Location Error',
          description: `Failed to get your location: ${error.message}. Please check permissions.`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      }
    );
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <Navbar title="Driver Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Driver Dashboard" />
      
      <Box pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Welcome Header */}
            <Box textAlign="center" py={{ base: 4, md: 6 }}>
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                color="brand.600" 
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

            {/* Enhanced Interface - Accordion on Mobile, Tabs on Desktop */}
            <Card bg={cardBg} shadow="lg" mb={{ base: 6, md: 8 }}>
              <CardBody p={0}>
                
                {/* Mobile: Accordion View */}
                <Box display={{ base: "block", md: "none" }}>
                  <Accordion 
                    index={accordionIndex} 
                    onChange={(index) => {
                      setAccordionIndex(index);
                      setActiveTab(index >= 0 ? index : 0);
                    }}
                    allowToggle
                  >
                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            🏠 Dashboard
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                        {/* Driver Status Control */}
                        <Card bg="brand.50" bordercolor="brand.200" borderWidth="1px">
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" color="brand.700">
                                  Driver Availability
                                </Text>
                                <Text fontSize="sm" color="brand.600">
                                  Toggle to {isAvailable ? 'go offline' : 'go online'}
                                </Text>
                              </VStack>
                              <FormControl display="flex" alignItems="center" w="auto">
                                <Switch
                                  size="lg"
                                  isChecked={isAvailable}
                                  onChange={(e) => updateAvailability(e.target.checked)}
                                  isDisabled={updating}
                                  colorScheme="brand"
                                />
                              </FormControl>
                            </HStack>
                          </CardBody>
                        </Card>

                        {/* Active Trips Section */}
                        <Card>
                          <CardHeader>
                            <HStack justify="space-between" align="center">
                              <Heading size="md" color="brand.600">
                                Active Trips ({activeTrips.length})
                              </Heading>
                              <Badge colorScheme="brand" px={2} py={1}>
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
                                  <Card key={trip._id} variant="outline" bordercolor="brand.200">
                                    <CardBody>
                                      <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" color="brand.600">
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
                                                onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, getRiderName(trip))}
                                              >
                                                {getRiderName(trip)}
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
                                                  setAccordionIndex(7); // Drive Mode accordion
                                                }}
                                              >
                                                Drive
                                              </Button>
                                              {trip.phone && (
                                                <Button
                                                  size="sm"
                                                  colorScheme="brand"
                                                  leftIcon={<PhoneIcon />}
                                                  as="a"
                                                  href={`tel:${trip.phone}`}
                                                >
                                                  Call
                                                </Button>
                                              )}
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
                            <Heading size="md" color="brand.600">Quick Actions</Heading>
                          </CardHeader>
                          <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                              <Button
                                leftIcon={<Box as={MapPinIcon} w={4} h={4} />}
                                colorScheme="brand"
                                variant="outline"
                                onClick={getCurrentLocation}
                                size="md"
                                py={6}
                              >
                                Update Location
                              </Button>
                              <Button
                                leftIcon={<Box as={ClockIconSolid} w={4} h={4} />}
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => setAccordionIndex(2)}
                                size="md"
                                py={6}
                              >
                                View Reports
                              </Button>
                              <Button
                                leftIcon={<Box as={TruckIconSolid} w={4} h={4} />}
                                colorScheme="purple"
                                variant="outline"
                                onClick={() => setAccordionIndex(3)}
                                size="md"
                                py={6}
                              >
                                Vehicle Status
                              </Button>
                            </Grid>
                          </CardBody>
                        </Card>
                      </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            🚗 My Trips
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between" align="center" flexWrap="wrap" spacing={4}>
                            <Heading size="md" color="brand.600">
                              My Trip History ({myTrips.length} trips)
                            </Heading>
                          </HStack>

                          {myTrips.length === 0 ? (
                            <Center py={8}>
                              <Text color="gray.500" fontSize="lg">No trips found</Text>
                            </Center>
                          ) : (
                            <VStack spacing={4} align="stretch">
                              {myTrips.map((trip) => (
                                <Card key={trip._id} variant="outline">
                                  <CardBody>
                                    <VStack spacing={3} align="stretch">
                                      <HStack justify="space-between">
                                        <Text fontWeight="bold" color="brand.600">
                                          {trip.tripId}
                                        </Text>
                                        <Badge colorScheme={getStatusColor(trip.status)}>
                                          {trip.status}
                                        </Badge>
                                      </HStack>
                                      <Text fontSize="sm">📍 {trip.pickupLocation?.address || trip.pickupLocation}</Text>
                                      <Text fontSize="sm">🏁 {trip.dropoffLocation?.address || trip.dropoffLocation}</Text>
                                      <Text fontSize="sm">🕐 {formatDate(trip.scheduledDate)}</Text>
                                    </VStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            📊 Reports
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          <Heading size="md" color="brand.600">Trip Reports</Heading>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel>Total Trips</StatLabel>
                              <StatNumber>{myTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Completed</StatLabel>
                              <StatNumber>{completedTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Active</StatLabel>
                              <StatNumber>{activeTrips.length}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Today</StatLabel>
                              <StatNumber>{todayTrips.length}</StatNumber>
                            </Stat>
                          </SimpleGrid>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            🚙 Vehicle
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          {vehicles.length > 0 ? (
                            <Card>
                              <CardBody>
                                <VStack align="start" spacing={2}>
                                  <Heading size="md" color="brand.600">
                                    {vehicles[0].year} {vehicles[0].make} {vehicles[0].model}
                                  </Heading>
                                  <Text fontSize="sm">License: {vehicles[0].licensePlate}</Text>
                                  <Text fontSize="sm">Status: <Badge colorScheme={vehicles[0].status === 'active' ? 'green' : 'gray'}>{vehicles[0].status}</Badge></Text>
                                  <Text fontSize="sm">Capacity: {vehicles[0].capacity} passengers</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          ) : (
                            <Center py={8}>
                              <Text color="gray.500">No vehicle assigned</Text>
                            </Center>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            📍 Location
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          <Button
                            colorScheme="brand"
                            leftIcon={<Box as={MapPinIcon} w={4} h={4} />}
                            onClick={getCurrentLocation}
                            size="md"
                          >
                            Update Current Location
                          </Button>
                          {currentLocation && (
                            <Card>
                              <CardBody>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" fontWeight="bold">Current Location:</Text>
                                  <Text fontSize="sm">Lat: {currentLocation.lat?.toFixed(6)}</Text>
                                  <Text fontSize="sm">Lng: {currentLocation.lng?.toFixed(6)}</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            ⚙️ Settings
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          <Heading size="md" color="brand.600">Driver Settings</Heading>
                          <Text fontSize="sm" color="gray.600">
                            Switch to desktop view for full settings options
                          </Text>
                          <Card>
                            <CardBody>
                              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <FormLabel mb={0}>Available for trips</FormLabel>
                                <Switch
                                  isChecked={isAvailable}
                                  onChange={(e) => updateAvailability(e.target.checked)}
                                  colorScheme="brand"
                                />
                              </FormControl>
                            </CardBody>
                          </Card>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            👤 Profile
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          <Card>
                            <CardBody>
                              <VStack align="start" spacing={3}>
                                <HStack spacing={3}>
                                  <Avatar name={`${user?.firstName} ${user?.lastName}`} size="lg" />
                                  <VStack align="start" spacing={0}>
                                    <Heading size="md">{user?.firstName} {user?.lastName}</Heading>
                                    <Text fontSize="sm" color="gray.600">{user?.email}</Text>
                                  </VStack>
                                </HStack>
                                <Divider />
                                <HStack>
                                  <Text fontSize="sm" fontWeight="bold">Role:</Text>
                                  <Badge colorScheme="brand">{user?.role}</Badge>
                                </HStack>
                                <HStack>
                                  <Text fontSize="sm" fontWeight="bold">Phone:</Text>
                                  <Text fontSize="sm">{user?.phone || 'Not provided'}</Text>
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem>
                      <h2>
                        <AccordionButton py={4} _expanded={{ bg: "teal.50", color: "teal.600", fontWeight: "bold" }}>
                          <Box flex="1" textAlign="left" fontSize="md">
                            🚗 Drive Mode
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4} px={4} bg="white">
                        <VStack spacing={4} align="stretch">
                          {activeTrips.length > 0 ? (
                            <>
                              <Heading size="md" color="brand.600">Active Trips</Heading>
                              <Text fontSize="sm" color="gray.600">
                                Click "Drive" button on Dashboard to start Drive Mode for a trip
                              </Text>
                              <VStack spacing={2} align="stretch">
                                {activeTrips.map((trip) => (
                                  <Card key={trip._id} variant="outline">
                                    <CardBody>
                                      <HStack justify="space-between">
                                        <VStack align="start" spacing={0}>
                                          <Text fontWeight="bold" fontSize="sm">{trip.tripId}</Text>
                                          <Text fontSize="xs" color="gray.600">{getRiderName(trip)}</Text>
                                        </VStack>
                                        <Button
                                          size="sm"
                                          colorScheme="green"
                                          onClick={() => {
                                            setSelectedTrip(trip);
                                            setAccordionIndex(7);
                                          }}
                                        >
                                          Start
                                        </Button>
                                      </HStack>
                                    </CardBody>
                                  </Card>
                                ))}
                              </VStack>
                            </>
                          ) : (
                            <Center py={8}>
                              <VStack spacing={2}>
                                <Text color="gray.500">No active trips</Text>
                                <Text fontSize="sm" color="gray.400">Go online to receive trip assignments</Text>
                              </VStack>
                            </Center>
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>

                {/* Desktop: Tabs View */}
                <Box display={{ base: "none", md: "block" }}>
                <Tabs 
                  index={activeTab} 
                  onChange={setActiveTab} 
                  variant="enclosed" 
                  colorScheme="brand"
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
                        <Card bg="brand.50" bordercolor="brand.200" borderWidth="1px">
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" color="brand.700">
                                  Driver Availability
                                </Text>
                                <Text fontSize="sm" color="brand.600">
                                  Toggle to {isAvailable ? 'go offline' : 'go online'}
                                </Text>
                              </VStack>
                              <FormControl display="flex" alignItems="center" w="auto">
                                <Switch
                                  size="lg"
                                  isChecked={isAvailable}
                                  onChange={(e) => updateAvailability(e.target.checked)}
                                  isDisabled={updating}
                                  colorScheme="brand"
                                />
                              </FormControl>
                            </HStack>
                          </CardBody>
                        </Card>

                        {/* Active Trips Section */}
                        <Card>
                          <CardHeader>
                            <HStack justify="space-between" align="center">
                              <Heading size="md" color="brand.600">
                                Active Trips ({activeTrips.length})
                              </Heading>
                              <Badge colorScheme="brand" px={2} py={1}>
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
                                  <Card key={trip._id} variant="outline" bordercolor="brand.200">
                                    <CardBody>
                                      <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between">
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" color="brand.600">
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
                                                onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, getRiderName(trip))}
                                              >
                                                {getRiderName(trip)}
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
                                                  colorScheme="brand"
                                                  leftIcon={<PhoneIcon />}
                                                  as="a"
                                                  href={`tel:${trip.phone}`}
                                                >
                                                  Call
                                                </Button>
                                              )}
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
                            <Heading size="md" color="brand.600">Quick Actions</Heading>
                          </CardHeader>
                          <CardBody>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                              <Button
                                leftIcon={<Box as={MapPinIcon} w={4} h={4} />}
                                colorScheme="brand"
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
                          <Heading size="md" color="brand.600">
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
                                        <Text fontWeight="bold" color="brand.600">
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
                                          onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, getRiderName(trip))}
                                        >
                                          {getRiderName(trip)}
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
                                          colorScheme="brand"
                                          variant="outline"
                                          as="a"
                                          href={`tel:${trip.phone}`}
                                          aria-label="Call rider"
                                        />
                                      )}
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
                          <Heading size="md" color="brand.600">
                            Performance Reports
                          </Heading>
                          <Button
                            leftIcon={<Box as={FunnelIcon} w={4} h={4} />}
                            colorScheme="brand"
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
                                          onClick={(e) => handleRiderClick(e, trip.riderId || trip._id, getRiderName(trip))}
                                        >
                                          {getRiderName(trip)}
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
                        <Heading size="md" color="brand.600">
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
                                        <Text fontWeight="bold" color="brand.600" fontSize="lg">
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
                                        <Button size="sm" colorScheme="brand" variant="outline">
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
                        <Heading size="md" color="brand.600">
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
                                  leftIcon={<Box as={MapPinIcon} w={4} h={4} />}
                                  colorScheme="brand"
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
                                  <Switch id="auto-location" colorScheme="brand" />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel htmlFor="share-location" mb="0" flex="1">
                                    Share location with dispatch
                                  </FormLabel>
                                  <Switch id="share-location" colorScheme="brand" defaultChecked />
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
                        <Heading size="md" color="brand.600">
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
                                  <Switch colorScheme="brand" defaultChecked />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel mb="0" flex="1">
                                    Trip updates via SMS
                                  </FormLabel>
                                  <Switch colorScheme="brand" defaultChecked />
                                </FormControl>

                                <FormControl display="flex" alignItems="center" justify="space-between">
                                  <FormLabel mb="0" flex="1">
                                    Weekly performance reports
                                  </FormLabel>
                                  <Switch colorScheme="brand" />
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
                        <Heading size="md" color="brand.600">
                          Driver Profile
                        </Heading>

                        <Card>
                          <CardBody>
                            <VStack spacing={6} align="stretch">
                              <HStack spacing={4} align="center">
                                <Avatar 
                                  size="xl" 
                                  name={`${user?.firstName} ${user?.lastName}`}
                                  bg="brand.500"
                                />
                                <VStack align="start" spacing={1} flex="1">
                                  <Text fontSize="2xl" fontWeight="bold">
                                    {user?.firstName} {user?.lastName}
                                  </Text>
                                  <Text color="gray.600">Professional Driver</Text>
                                  <Badge colorScheme="brand" px={3} py={1}>
                                    Active Status
                                  </Badge>
                                </VStack>
                              </HStack>

                              <Divider />

                              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                <VStack align="start" spacing={3}>
                                  <Text fontWeight="bold" color="brand.600">Contact Information</Text>
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
                                  <Text fontWeight="bold" color="brand.600">Driver Statistics</Text>
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

                              <Button leftIcon={<Box as={PencilIcon} w={4} h={4} />} colorScheme="brand" variant="outline">
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
                        onComplete={async (tripData) => {
                          if (selectedTrip) {
                            await updateTripStatus(selectedTrip._id, 'completed', tripData);
                            setSelectedTrip(null);
                            setActiveTab(0); // Return to dashboard
                          }
                        }}
                        onCancel={async (tripData) => {
                          if (selectedTrip) {
                            await updateTripStatus(selectedTrip._id, 'cancelled', tripData);
                            setSelectedTrip(null);
                            setActiveTab(0); // Return to dashboard
                          }
                        }}
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                </Box> {/* Close desktop Box */}
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
            <Button colorScheme="brand" mr={3} onClick={onReportClose}>
              Apply Filters
            </Button>
            <Button variant="ghost" onClick={onReportClose}>
              Cancel
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
