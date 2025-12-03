import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  useToast,
  HStack,
  VStack,
  Button,
  Select,
  IconButton,
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
  Input,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  GridItem,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Flex,
  Spacer,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Divider,
  SimpleGrid,
  useBreakpointValue,
  useColorModeValue,
  CircularProgress,
  CircularProgressLabel,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  ArrowPathIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockIconSolid,
  MapPinIcon as MapPinIconSolid,
  TruckIcon as TruckIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import TripManagementModal from '../scheduler/TripManagementModal';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import RiderInfoModal from '../shared/RiderInfoModal';
import TripDetailsModal from '../scheduler/TripDetailsModal';
import DispatcherProfile from './DispatcherProfile';
import DispatcherSchedule from './DispatcherSchedule';
import DispatcherSearch from './DispatcherSearch';

const DispatcherDashboard = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Core state management
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    pickupLocation: { address: '', lat: 0, lng: 0 },
    dropoffLocation: { address: '', lat: 0, lng: 0 },
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedDriver: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Enhanced filtering and display state
  const [displayedTrips, setDisplayedTrips] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Today, 1: Upcoming, 2: Past, 3: All
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Enhanced pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Responsive design variables
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  const cardDirection = useBreakpointValue({ base: 'column', lg: 'row' });
  const statsColumns = useBreakpointValue({ base: 1, sm: 2, lg: 4 });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const primaryColor = useColorModeValue('blue.600', 'blue.300');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose
  } = useDisclosure();
  const {
    isOpen: isTripManagementOpen,
    onOpen: onTripManagementOpen,
    onClose: onTripManagementClose
  } = useDisclosure();
  
  // State for clickable riders and trips
  const [selectedRider, setSelectedRider] = useState(null);
  const [viewTripDetails, setViewTripDetails] = useState(null);
  
  const [tripToAssign, setTripToAssign] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const cancelRef = React.useRef();
  const toast = useToast();

  // Enhanced statistics calculations with memoization
  const dashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });
    
    const activeTrips = trips.filter(trip =>
      ['pending', 'assigned', 'in_progress'].includes(trip.status)
    );
    
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    
    const availableDrivers = drivers.filter(driver => 
      driver.isActive && !activeTrips.some(trip => trip.assignedDriver === driver._id)
    );
    
    const busyDrivers = drivers.filter(driver =>
      activeTrips.some(trip => trip.assignedDriver === driver._id)
    );
    
    const unassignedTrips = trips.filter(trip => 
      !trip.assignedDriver && ['pending', 'confirmed'].includes(trip.status)
    );
    
    const completionRate = trips.length > 0 
      ? ((completedTrips.length / trips.length) * 100).toFixed(1)
      : 0;
    
    const todayCompletionRate = todaysTrips.length > 0
      ? ((todaysTrips.filter(t => t.status === 'completed').length / todaysTrips.length) * 100).toFixed(1)
      : 0;
    
    return {
      totalTrips: trips.length,
      todaysTrips: todaysTrips.length,
      activeTrips: activeTrips.length,
      completedTrips: completedTrips.length,
      unassignedTrips: unassignedTrips.length,
      totalDrivers: drivers.length,
      availableDrivers: availableDrivers.length,
      busyDrivers: busyDrivers.length,
      completionRate: parseFloat(completionRate),
      todayCompletionRate: parseFloat(todayCompletionRate),
      driverUtilization: drivers.length > 0 
        ? ((busyDrivers.length / drivers.length) * 100).toFixed(1)
        : 0,
      availableDriversData: availableDrivers,
      busyDriversData: busyDrivers,
      activeTripsData: activeTrips
    };
  }, [trips, drivers]);
  
  // Paginated trips calculation
  const paginatedTrips = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayedTrips.slice(startIndex, endIndex);
  }, [displayedTrips, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(displayedTrips.length / itemsPerPage);

  // Destructure computed stats for easier access
  const { 
    availableDriversData: availableDrivers, 
    busyDriversData: busyDrivers,
    activeTripsData: activeTrips
  } = dashboardStats;

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips');
      setTrips(response.data.data?.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trips',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users?role=driver&isActive=true');
      setDrivers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchTrips();
      await fetchDrivers();
    };
    loadData();

    // Set up real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTrips();
      fetchDrivers();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTrips, fetchDrivers]);

  // Filter trips based on active tab - Dispatch Landing Page Requirements
  useEffect(() => {
    if ((trips || []).length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let filtered = [];

      switch (activeTab) {
        case 0: // Today
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
            return tripDateOnly.getTime() === today.getTime();
          });
          break;
        case 1: // Upcoming
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= tomorrow;
          });
          
          // Apply date range filter if set
          if (dateRange.start || dateRange.end) {
            filtered = filtered.filter(trip => {
              const tripDate = new Date(trip.scheduledDate);
              const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
              
              if (dateRange.start && dateRange.end) {
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                return tripDateOnly >= startDate && tripDateOnly <= endDate;
              } else if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                return tripDateOnly >= startDate;
              } else if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                return tripDateOnly <= endDate;
              }
              
              return true;
            });
          }
          break;
        case 2: // Past
          filtered = trips.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
            return tripDateOnly < today.getTime();
          });
          break;
        case 3: // All
          filtered = trips;
          break;
        default:
          filtered = trips;
      }

      // Sort by scheduled date (chronological order)
      filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      setDisplayedTrips(filtered);
    }
  }, [trips, activeTab, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    await fetchDrivers();
  };

  const assignDriver = async (tripId, driverId) => {
    try {
      await axios.post(`/api/trips/${tripId}/assign`, { driverId });
      toast({
        title: 'Success',
        description: 'Driver assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const tripData = {
        ...formData,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
        estimatedDuration: 30, // Default 30 minutes
        // Add mock coordinates for now (will integrate with Google Maps API later)
        pickupLocation: {
          ...formData.pickupLocation,
          lat: formData.pickupLocation.lat || 40.7128, // Default to NYC coordinates
          lng: formData.pickupLocation.lng || -74.0060
        },
        dropoffLocation: {
          ...formData.dropoffLocation,
          lat: formData.dropoffLocation.lat || 40.7580, // Default to NYC coordinates  
          lng: formData.dropoffLocation.lng || -73.9855
        }
      };

      if (selectedTrip) {
        await axios.put(`/api/trips/${selectedTrip._id}`, tripData);
        toast({
          title: 'Success',
          description: 'Trip updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.post('/api/trips', tripData);
        toast({
          title: 'Success',
          description: 'Trip created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchTrips();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
    setFormData({
      riderName: '',
      riderPhone: '',
      pickupLocation: { address: '', lat: 0, lng: 0 },
      dropoffLocation: { address: '', lat: 0, lng: 0 },
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      assignedDriver: ''
    });
    setError('');
    onClose();
  };

  const handleEdit = (trip) => {
    setSelectedTrip(trip);
    const scheduledDate = new Date(trip.scheduledDate);
    setFormData({
      riderName: trip.riderName,
      riderPhone: trip.riderPhone,
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5),
      notes: trip.notes || '',
      assignedDriver: trip.assignedDriver?._id || ''
    });
    onOpen();
  };

  const handleView = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  // Click handlers for rider and trip details
  const handleRiderClick = (e, riderId) => {
    e.stopPropagation();
    setSelectedRider(riderId);
  };

  const handleTripClick = (e, trip) => {
    e.stopPropagation();
    setViewTripDetails(trip);
  };

  const handleDeleteClick = (trip) => {
    setTripToDelete(trip);
    onDeleteOpen();
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/trips/${tripToDelete._id}`);
      toast({
        title: 'Success',
        description: 'Trip cancelled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
      onDeleteClose();
      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel trip',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignClick = (trip) => {
    setTripToAssign(trip);
    // Pre-select current driver if reassigning
    setSelectedDriverId(trip.assignedDriver?._id || '');
    onAssignOpen();
  };

  const handleAssignDriver = async () => {
    if (!tripToAssign || !selectedDriverId) return;
    
    setIsAssigning(true);
    try {
      await axios.post(`/api/trips/${tripToAssign._id}/assign`, { driverId: selectedDriverId });
      toast({
        title: 'Success',
        description: 'Driver assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTrips();
      onAssignClose();
      setTripToAssign(null);
      setSelectedDriverId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign driver',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAssigning(false);
    }
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

const formatDate = (dateString) => {
  if (!dateString) return 'Not scheduled';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString() + ' ' + 
         date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getLocationText = (location) => {
  if (!location) return 'N/A';
  if (typeof location === 'string') return location;
  if (typeof location === 'object' && location.address) return location.address;
  return 'Location not specified';
};  if (loading) {
    return (
      <>
        <Navbar title="Dispatcher Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </>
    );
  }



  return (
    <>
      <Navbar title="Dispatch Control Center" />
      <Box bg="gray.50" minH="calc(100vh - 80px)" w="100%" px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }} overflowX="hidden">
      {/* Enhanced Header Section - Mobile-First Design */}
      <Box mb={{ base: 6, md: 8 }}>
        <VStack align="start" spacing={3}>
          <Heading 
            size={{ base: "lg", md: "xl" }} 
            color="blue.700"
            fontWeight="bold"
          >
            Dispatch Control Center
          </Heading>
          <Text 
            color="gray.600" 
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
          >
                Manage active trips, assign drivers, monitor real-time status, and coordinate transportation operations
              </Text>
              
              {/* Quick Actions Dropdown - Compact Design */}
              <Box mt={4}>
                <Menu>
                  <Tooltip label="Quick Actions" placement="right">
                    <MenuButton
                      as={Button}
                      rightIcon={<Box as={ChevronDownIcon} w={5} h={5} />}
                      leftIcon={<Box as={Cog6ToothIcon} w={5} h={5} />}
                      size="md"
                      variant="solid"
                      colorScheme="blue"
                    >
                      Quick Actions
                    </MenuButton>
                  </Tooltip>
                  <MenuList>
                    {/* Primary Actions */}
                    <MenuItem 
                      icon={<Box as={PlusIcon} w={5} h={5} />}
                      onClick={onOpen}
                    >
                      Create Trip
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={MagnifyingGlassIcon} w={5} h={5} />}
                      onClick={onTripManagementOpen}
                    >
                      Manage Trips
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={MapPinIcon} w={5} h={5} />}
                      onClick={() => navigate('/dispatcher/live-tracking')}
                    >
                      View Map
                    </MenuItem>
                    
                    <MenuDivider />
                    
                    {/* Secondary Actions */}
                    <MenuItem 
                      icon={<Box as={UserGroupIconSolid} w={5} h={5} />}
                      onClick={() => navigate('/riders?tab=all-riders')}
                    >
                      All Riders
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={TruckIcon} w={5} h={5} />}
                      onClick={() => navigate('/dispatcher/drivers')}
                    >
                      All Drivers
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={CalendarIcon} w={5} h={5} />}
                      onClick={() => navigate('/dispatcher/recurring-trips')}
                    >
                      Recurring Trips
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
            </VStack>
          </Box>

          {/* Enhanced Breadcrumb Navigation */}
          <Breadcrumb mb={{ base: 4, md: 6 }} fontSize={{ base: "sm", md: "md" }}>
            <BreadcrumbItem>
              <BreadcrumbLink display="flex" alignItems="center" gap={2}>
                <Box as={HomeIcon} w={4} h={4} />
                Operations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Dispatcher</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Enhanced Real-time Statistics Dashboard */}
          <SimpleGrid 
            columns={statsColumns}
            spacing={{ base: 4, md: 6 }} 
            mb={{ base: 6, md: 8 }}
          >
            <Card 
              bg={cardBg}
              shadow="lg" 
              _hover={{ 
                shadow: "2xl", 
                transform: "translateY(-4px) scale(1.02)",
                cursor: "pointer",
                borderLeftColor: "blue.600"
              }} 
              transition="all 0.3s ease"
              borderLeft="6px solid"
              borderLeftColor="blue.500"
              onClick={() => setActiveTab(0)}
              role="button"
              aria-label="View today's trips"
              tabIndex={0}
            >
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start">
                    <Box 
                      p={2} 
                      bg="blue.50" 
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box as={CalendarDaysIconSolid} w={6} h={6} color="blue.600" />
                    </Box>
                    <VStack align="end" spacing={0}>
                      <CircularProgress 
                        value={dashboardStats.todayCompletionRate} 
                        size="35px" 
                        color="blue.500"
                        trackColor="gray.200"
                        thickness="6px"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="semibold">
                          {Math.round(dashboardStats.todayCompletionRate)}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    </VStack>
                  </HStack>
                  
                  <Stat>
                    <VStack align="start" spacing={1}>
                      <StatNumber 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
                        color="blue.600"
                        lineHeight="1"
                      >
                        {dashboardStats.todaysTrips}
                      </StatNumber>
                      <StatLabel 
                        color={textColor}
                        fontSize="xs"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Today's Trips
                      </StatLabel>
                      <Text fontSize="xs" color={mutedColor} fontWeight="medium">
                        {dashboardStats.todayCompletionRate}% completed • Click to view
                      </Text>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg}
              shadow="lg" 
              _hover={{ 
                shadow: "2xl", 
                transform: "translateY(-4px) scale(1.02)",
                cursor: "pointer",
                borderLeftColor: "green.600"
              }} 
              transition="all 0.3s ease"
              borderLeft="6px solid"
              borderLeftColor="green.500"
              onClick={() => setActiveTab(3)}
              role="button"
              aria-label="View completed trips"
              tabIndex={0}
            >
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start">
                    <Box 
                      p={2} 
                      bg="green.50" 
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box as={CheckCircleIconSolid} w={6} h={6} color="green.600" />
                    </Box>
                    <Badge 
                      colorScheme="green" 
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontWeight="semibold"
                    >
                      +{dashboardStats.completedTrips > 10 ? '12' : '5'}%
                    </Badge>
                  </HStack>
                  
                  <Stat>
                    <VStack align="start" spacing={1}>
                      <StatNumber 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
                        color="green.600"
                        lineHeight="1"
                      >
                        {dashboardStats.completedTrips}
                      </StatNumber>
                      <StatLabel 
                        color={textColor}
                        fontSize="xs"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Completed
                      </StatLabel>
                      <HStack spacing={1} fontSize="xs">
                        <StatArrow type="increase" />
                        <Text color="green.600" fontWeight="semibold">
                          {dashboardStats.completionRate}% total rate
                        </Text>
                      </HStack>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg}
              shadow="lg" 
              _hover={{ 
                shadow: "2xl", 
                transform: "translateY(-4px) scale(1.02)",
                cursor: "pointer",
                borderLeftColor: "orange.600"
              }} 
              transition="all 0.3s ease"
              borderLeft="6px solid"
              borderLeftColor="orange.500"
              onClick={() => setActiveTab(1)}
              role="button"
              aria-label="View active trips"
              tabIndex={0}
              position="relative"
              overflow="hidden"
            >
              {dashboardStats.unassignedTrips > 0 && (
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  w="100%"
                  h="100%"
                  bg="orange.50"
                  opacity={0.3}
                  animation="pulse 2s ease-in-out infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.1 },
                      '50%': { opacity: 0.3 }
                    }
                  }}
                />
              )}
              <CardBody p={{ base: 3, md: 4 }} position="relative">
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start">
                    <Box 
                      p={2} 
                      bg="orange.50" 
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box as={ClockIconSolid} w={6} h={6} color="orange.600" />
                    </Box>
                    {dashboardStats.unassignedTrips > 0 && (
                      <Badge 
                        colorScheme="orange" 
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontWeight="semibold"
                        animation="pulse 2s ease-in-out infinite"
                      >
                        🚨 Urgent
                      </Badge>
                    )}
                  </HStack>
                  
                  <Stat>
                    <VStack align="start" spacing={1}>
                      <StatNumber 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
                        color="orange.600"
                        lineHeight="1"
                      >
                        {dashboardStats.activeTrips}
                      </StatNumber>
                      <StatLabel 
                        color={textColor}
                        fontSize="xs"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Active Trips
                      </StatLabel>
                      <Text 
                        fontSize="xs" 
                        color={dashboardStats.unassignedTrips > 0 ? "orange.600" : mutedColor}
                        fontWeight={dashboardStats.unassignedTrips > 0 ? "bold" : "medium"}
                      >
                        {dashboardStats.unassignedTrips} unassigned • Click to assign
                      </Text>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg}
              shadow="lg" 
              _hover={{ 
                shadow: "2xl", 
                transform: "translateY(-4px) scale(1.02)",
                cursor: "pointer",
                borderLeftColor: "purple.600"
              }} 
              transition="all 0.3s ease"
              borderLeft="6px solid"
              borderLeftColor="purple.500"
              onClick={() => setActiveTab(2)}
              role="button"
              aria-label="View available drivers"
              tabIndex={0}
            >
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start">
                    <Box 
                      p={2} 
                      bg="purple.50" 
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box as={TruckIconSolid} w={6} h={6} color="purple.600" />
                    </Box>
                    <VStack align="end" spacing={0}>
                      <CircularProgress 
                        value={parseFloat(dashboardStats.driverUtilization)} 
                        size="35px" 
                        color={parseFloat(dashboardStats.driverUtilization) > 80 ? "red.500" : "purple.500"}
                        trackColor="gray.200"
                        thickness="6px"
                      >
                        <CircularProgressLabel fontSize="2xs" fontWeight="semibold">
                          {Math.round(parseFloat(dashboardStats.driverUtilization))}%
                        </CircularProgressLabel>
                      </CircularProgress>
                    </VStack>
                  </HStack>
                  
                  <Stat>
                    <VStack align="start" spacing={1}>
                      <StatNumber 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
                        color="purple.600"
                        lineHeight="1"
                      >
                        {dashboardStats.availableDrivers}
                      </StatNumber>
                      <StatLabel 
                        color={textColor}
                        fontSize="xs"
                        fontWeight="medium"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Available Drivers
                      </StatLabel>
                      <HStack spacing={2} fontSize="xs" flexWrap="wrap">
                        <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
                          {dashboardStats.busyDrivers} busy
                        </Badge>
                        <Text color={mutedColor} fontWeight="medium">
                          {dashboardStats.driverUtilization}% utilization
                        </Text>
                      </HStack>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Enhanced Tabbed Interface with Modern Icons */}
          <Card mb={{ base: 6, md: 8 }} bg={cardBg}>
            <CardBody p={0}>
              <Tabs 
                index={activeTab} 
                onChange={setActiveTab} 
                variant="enclosed" 
                colorScheme="blue"
              >
                <TabList 
                  flexWrap="wrap"
                  borderBottom="2px solid"
                  borderColor={borderColor}
                  bg={bgColor}
                >
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={CalendarDaysIcon} w={4} h={4} />
                    <Text display={{ base: "none", sm: "inline" }}>Today</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={ClockIcon} w={4} h={4} />
                    <Text display={{ base: "none", sm: "inline" }}>Upcoming</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={CheckCircleIcon} w={4} h={4} />
                    <Text display={{ base: "none", sm: "inline" }}>Completed</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={ChartBarIcon} w={4} h={4} />
                    <Text display={{ base: "none", sm: "inline" }}>All Trips</Text>
                  </Tab>
                  
                  {/* Enhanced Dispatch Features */}
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={TruckIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Active</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={UserGroupIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Drivers</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={MapPinIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Tracking</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={UserIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Profile</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={CalendarIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Schedule</Text>
                  </Tab>
                  <Tab 
                    flex={{ base: "1", sm: "initial" }}
                    fontSize={{ base: "sm", md: "md" }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 6 }}
                    _selected={{ 
                      color: primaryColor, 
                      borderColor: "blue.500",
                      bg: cardBg
                    }}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={MagnifyingGlassIcon} w={4} h={4} />
                    <Text display={{ base: "none", md: "inline" }}>Search</Text>
                  </Tab>
                </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {/* Today's Dashboard */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Today's Rides</Heading>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} rides
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Today's Statistics */}
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} w="100%">
                      <Card bg="green.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'completed').length}
                          </Text>
                          <Text fontSize="sm" color="green.700">Completed Today</Text>
                        </CardBody>
                      </Card>
                      <Card bg="orange.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'in_progress').length}
                          </Text>
                          <Text fontSize="sm" color="orange.700">In Progress</Text>
                        </CardBody>
                      </Card>
                      <Card bg="blue.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {(displayedTrips || []).filter(trip => trip.status === 'assigned').length}
                          </Text>
                          <Text fontSize="sm" color="blue.700">Assigned</Text>
                        </CardBody>
                      </Card>
                      <Card bg="red.50">
                        <CardBody textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="red.600">
                            {(displayedTrips || []).filter(trip => !trip.assignedDriver).length}
                          </Text>
                          <Text fontSize="sm" color="red.700">Need Driver</Text>
                        </CardBody>
                      </Card>
                    </Grid>

                    {/* Today's Trips Table */}
                    <Card>
                      <CardBody p={0}>
                        <TableContainer overflowX="auto" w="100%">
                          <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                            <Thead>
                              <Tr>
                                <Th>Trip ID</Th>
                                <Th>Rider</Th>
                                <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                                <Th display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                                <Th>Driver</Th>
                                <Th>Status</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {displayedTrips.map((trip) => (
                                <Tr key={trip._id}>
                                  <Td>
                                    <Text 
                                      color="blue.600" 
                                      cursor="pointer" 
                                      _hover={{ textDecoration: 'underline' }}
                                      onClick={(e) => handleTripClick(e, trip)}
                                    >
                                      {trip.tripId}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <VStack align="start" spacing={0}>
                                      <Text 
                                        fontSize="sm"
                                        color="blue.600" 
                                        cursor="pointer" 
                                        _hover={{ textDecoration: 'underline' }}
                                        onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                      >
                                        {trip.riderName}
                                      </Text>
                                      {trip.riderPhone && (
                                        <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                          {trip.riderPhone}
                                        </Text>
                                      )}
                                    </VStack>
                                  </Td>
                                  <Td display={{ base: "none", md: "table-cell" }}>
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                      <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                                    </VStack>
                                  </Td>
                                  <Td display={{ base: "none", lg: "table-cell" }}>
                                    <Text fontSize="xs">
                                      {formatDate(trip.scheduledDate)}
                                    </Text>
                                  </Td>
                                  <Td>
                                    {trip.assignedDriver ? (
                                      <VStack align="start" spacing={1}>
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm">
                                            {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                          </Text>
                                          {trip.assignedDriver.phone && (
                                            <Text fontSize="xs" color="gray.500">
                                              {trip.assignedDriver.phone}
                                            </Text>
                                          )}
                                        </VStack>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          colorScheme="blue"
                                          onClick={() => handleAssignClick(trip)}
                                        >
                                          Reassign
                                        </Button>
                                      </VStack>
                                    ) : (
                                      <Button
                                        size="sm"
                                        colorScheme="green"
                                        onClick={() => handleAssignClick(trip)}
                                        disabled={availableDrivers.length === 0}
                                      >
                                        Assign Driver
                                      </Button>
                                    )}
                                  </Td>
                                  <Td>
                                    <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                      {trip.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                      <IconButton
                                        icon={<Box as={EyeIcon} w={4} h={4} />}
                                        size="xs"
                                        colorScheme="blue"
                                        onClick={() => handleView(trip)}
                                        aria-label="View trip"
                                        title="View trip details"
                                      />
                                      <IconButton
                                        icon={<Box as={PencilIcon} w={4} h={4} />}
                                        size="xs"
                                        colorScheme="yellow"
                                        onClick={() => handleEdit(trip)}
                                        aria-label="Edit trip"
                                        title="Edit trip"
                                      />
                                      {!trip.assignedDriver && (
                                        <Button
                                          size="xs"
                                          colorScheme="green"
                                          onClick={() => handleAssignClick(trip)}
                                          disabled={availableDrivers.length === 0}
                                        >
                                          Assign
                                        </Button>
                                      )}
                                      <IconButton
                                        icon={<Box as={TrashIcon} w={4} h={4} />}
                                        size="xs"
                                        colorScheme="red"
                                        onClick={() => handleDeleteClick(trip)}
                                        aria-label="Cancel trip"
                                        title="Cancel trip"
                                      />
                                      {trip.riderPhone && (
                                        <IconButton
                                          icon={<Box as={PhoneIcon} w={4} h={4} />}
                                          size="xs"
                                          colorScheme="green"
                                          aria-label="Call rider"
                                          title="Call rider"
                                        />
                                      )}
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                        {displayedTrips.length === 0 && (
                          <Center py={8}>
                            <VStack spacing={3}>
                              <Text color="gray.500" fontSize="lg">No rides scheduled for today</Text>
                              <Text color="gray.400" fontSize="sm">Today's rides will appear here</Text>
                            </VStack>
                          </Center>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* Upcoming Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Upcoming Trips</Heading>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto" w="100%">
                    <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                      <Thead>
                        <Tr>
                          <Th>Trip ID</Th>
                          <Th>Rider</Th>
                          <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th>Driver</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>
                              <Text 
                                color="blue.600" 
                                cursor="pointer" 
                                _hover={{ textDecoration: 'underline' }}
                                onClick={(e) => handleTripClick(e, trip)}
                              >
                                {trip.tripId}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text 
                                  fontSize="sm"
                                  color="blue.600" 
                                  cursor="pointer" 
                                  _hover={{ textDecoration: 'underline' }}
                                  onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                >
                                  {trip.riderName}
                                </Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={1}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">
                                      {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                    </Text>
                                    {trip.assignedDriver.phone && (
                                      <Text fontSize="xs" color="gray.500">
                                        {trip.assignedDriver.phone}
                                      </Text>
                                    )}
                                  </VStack>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleAssignClick(trip)}
                                  >
                                    Reassign
                                  </Button>
                                </VStack>
                              ) : (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleAssignClick(trip)}
                                  disabled={availableDrivers.length === 0}
                                >
                                  Assign Driver
                                </Button>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<Box as={EyeIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                                <IconButton
                                  icon={<Box as={PencilIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="yellow"
                                  onClick={() => handleEdit(trip)}
                                  aria-label="Edit trip"
                                  title="Edit trip"
                                />
                                {!trip.assignedDriver && (
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAssignClick(trip)}
                                    disabled={availableDrivers.length === 0}
                                  >
                                    Assign
                                  </Button>
                                )}
                                <IconButton
                                  icon={<Box as={TrashIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => handleDeleteClick(trip)}
                                  aria-label="Cancel trip"
                                  title="Cancel trip"
                                />
                                {trip.riderPhone && (
                                  <IconButton
                                    icon={<Box as={PhoneIcon} w={4} h={4} />}
                                    size="xs"
                                    colorScheme="green"
                                    aria-label="Call rider"
                                    title="Call rider"
                                  />
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No upcoming trips found</Text>
                        <Text color="gray.400" fontSize="sm">Future trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* Past Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Past Trips</Heading>
                    <Badge colorScheme="gray" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto" w="100%">
                    <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                      <Thead>
                        <Tr>
                          <Th>Trip ID</Th>
                          <Th>Rider</Th>
                          <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th>Driver</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>
                              <Text 
                                color="blue.600" 
                                cursor="pointer" 
                                _hover={{ textDecoration: 'underline' }}
                                onClick={(e) => handleTripClick(e, trip)}
                              >
                                {trip.tripId}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text 
                                  fontSize="sm"
                                  color="blue.600" 
                                  cursor="pointer" 
                                  _hover={{ textDecoration: 'underline' }}
                                  onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                >
                                  {trip.riderName}
                                </Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm">
                                    {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                  </Text>
                                  {trip.assignedDriver.phone && (
                                    <Text fontSize="xs" color="gray.500">
                                      {trip.assignedDriver.phone}
                                    </Text>
                                  )}
                                </VStack>
                              ) : (
                                <Text fontSize="sm" color="gray.500">No driver assigned</Text>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<Box as={EyeIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No past trips found</Text>
                        <Text color="gray.400" fontSize="sm">Completed trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              {/* All Trips */}
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">All Trips</Heading>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      {displayedTrips.length} trips
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody p={0}>
                  <TableContainer overflowX="auto" w="100%">
                    <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                      <Thead>
                        <Tr>
                          <Th>Trip ID</Th>
                          <Th>Rider</Th>
                          <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                          <Th display={{ base: "none", lg: "table-cell" }}>Scheduled</Th>
                          <Th>Driver</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedTrips.map((trip) => (
                          <Tr key={trip._id}>
                            <Td>
                              <Text 
                                color="blue.600" 
                                cursor="pointer" 
                                _hover={{ textDecoration: 'underline' }}
                                onClick={(e) => handleTripClick(e, trip)}
                              >
                                {trip.tripId}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text 
                                  fontSize="sm"
                                  color="blue.600" 
                                  cursor="pointer" 
                                  _hover={{ textDecoration: 'underline' }}
                                  onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                >
                                  {trip.riderName}
                                </Text>
                                {trip.riderPhone && (
                                  <Text fontSize="xs" color="gray.500" display={{ base: "block", sm: "none" }}>
                                    {trip.riderPhone}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", md: "table-cell" }}>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                <Text fontSize="xs">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                              </VStack>
                            </Td>
                            <Td display={{ base: "none", lg: "table-cell" }}>
                              <Text fontSize="xs">
                                {formatDate(trip.scheduledDate)}
                              </Text>
                            </Td>
                            <Td>
                              {trip.assignedDriver ? (
                                <VStack align="start" spacing={1}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm">
                                      {trip.assignedDriver.firstName} {trip.assignedDriver.lastName}
                                    </Text>
                                    {trip.assignedDriver.phone && (
                                      <Text fontSize="xs" color="gray.500">
                                        {trip.assignedDriver.phone}
                                      </Text>
                                    )}
                                  </VStack>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleAssignClick(trip)}
                                  >
                                    Reassign
                                  </Button>
                                </VStack>
                              ) : (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleAssignClick(trip)}
                                  disabled={availableDrivers.length === 0}
                                >
                                  Assign Driver
                                </Button>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                {trip.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
                                <IconButton
                                  icon={<Box as={EyeIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => handleView(trip)}
                                  aria-label="View trip"
                                  title="View trip details"
                                />
                                <IconButton
                                  icon={<Box as={PencilIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="yellow"
                                  onClick={() => handleEdit(trip)}
                                  aria-label="Edit trip"
                                  title="Edit trip"
                                />
                                {!trip.assignedDriver && (
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAssignClick(trip)}
                                    disabled={availableDrivers.length === 0}
                                  >
                                    Assign
                                  </Button>
                                )}
                                <IconButton
                                  icon={<Box as={TrashIcon} w={4} h={4} />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => handleDeleteClick(trip)}
                                  aria-label="Cancel trip"
                                  title="Cancel trip"
                                />
                                {trip.riderPhone && (
                                  <IconButton
                                    icon={<Box as={PhoneIcon} w={4} h={4} />}
                                    size="xs"
                                    colorScheme="green"
                                    aria-label="Call rider"
                                    title="Call rider"
                                  />
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {displayedTrips.length === 0 && (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Text color="gray.500" fontSize="lg">No trips found</Text>
                        <Text color="gray.400" fontSize="sm">All trips will appear here</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Active Trips Tab */}
            <TabPanel px={0}>
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">⏰ Active Trip Operations</Heading>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      Real-time Monitoring
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    {/* Active Trips Statistics */}
                    <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                      <Card bg="blue.50" p={4}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {trips.filter(trip => trip.status === 'in_progress').length}
                          </Text>
                          <Text fontSize="sm" color="blue.700">In Progress</Text>
                        </VStack>
                      </Card>
                      <Card bg="orange.50" p={4}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                            {trips.filter(trip => trip.status === 'assigned').length}
                          </Text>
                          <Text fontSize="sm" color="orange.700">Assigned</Text>
                        </VStack>
                      </Card>
                      <Card bg="green.50" p={4}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {trips.filter(trip => trip.status === 'pending').length}
                          </Text>
                          <Text fontSize="sm" color="green.700">Awaiting Assignment</Text>
                        </VStack>
                      </Card>
                    </Grid>
                    
                    {/* Active Trips Management */}
                    <Card>
                      <CardBody>
                        <Text fontSize="lg" fontWeight="semibold" mb={4}>Active Trip Monitoring</Text>
                        <VStack spacing={4}>
                          {trips.filter(trip => ['in_progress', 'assigned'].includes(trip.status)).length > 0 ? (
                            trips.filter(trip => ['in_progress', 'assigned'].includes(trip.status)).map(trip => (
                              <Card key={trip._id} w="full" bg="gray.50">
                                <CardBody p={4}>
                                  <HStack justify="space-between" align="start">
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="bold">
                                        <Text 
                                          as="span"
                                          color="blue.600" 
                                          cursor="pointer" 
                                          _hover={{ textDecoration: 'underline' }}
                                          onClick={(e) => handleTripClick(e, trip)}
                                        >
                                          {trip.tripId}
                                        </Text>
                                        {' - '}
                                        <Text 
                                          as="span"
                                          color="blue.600" 
                                          cursor="pointer" 
                                          _hover={{ textDecoration: 'underline' }}
                                          onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                        >
                                          {trip.riderName}
                                        </Text>
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        {getLocationText(trip.pickupLocation)} → {getLocationText(trip.dropoffLocation)}
                                      </Text>
                                      <Badge colorScheme={getStatusColor(trip.status)}>
                                        {trip.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </VStack>
                                    <Button size="sm" colorScheme="blue" onClick={() => handleView(trip)}>
                                      Monitor
                                    </Button>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))
                          ) : (
                            <Text color="gray.500">No active trips to monitor</Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Driver Assignment Tab */}
            <TabPanel px={0}>
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">👥 Driver Assignment Center</Heading>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      {availableDrivers.length} Available
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    {/* Unassigned Trips */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Trips Needing Assignment</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          {trips.filter(trip => !trip.assignedDriver && trip.status === 'pending').length > 0 ? (
                            trips.filter(trip => !trip.assignedDriver && trip.status === 'pending').map(trip => (
                              <Card key={trip._id} bg="red.50" border="1px solid" borderColor="red.200">
                                <CardBody p={3}>
                                  <VStack align="start" spacing={2}>
                                    <HStack justify="space-between" w="full">
                                      <Text 
                                        fontWeight="bold" 
                                        fontSize="sm"
                                        color="blue.600" 
                                        cursor="pointer" 
                                        _hover={{ textDecoration: 'underline' }}
                                        onClick={(e) => handleTripClick(e, trip)}
                                      >
                                        {trip.tripId}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {formatDate(trip.scheduledDate)}
                                      </Text>
                                    </HStack>
                                    <Text 
                                      fontSize="sm"
                                      color="blue.600" 
                                      cursor="pointer" 
                                      _hover={{ textDecoration: 'underline' }}
                                      onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                    >
                                      {trip.riderName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      {getLocationText(trip.pickupLocation)}
                                    </Text>
                                    <Button 
                                      size="xs" 
                                      colorScheme="green" 
                                      onClick={() => handleAssignClick(trip)}
                                      w="full"
                                    >
                                      Assign Driver
                                    </Button>
                                  </VStack>
                                </CardBody>
                              </Card>
                            ))
                          ) : (
                            <Text color="gray.500" textAlign="center" py={4}>
                              All trips have been assigned
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    {/* Available Drivers */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Available Drivers</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          {availableDrivers.length > 0 ? (
                            availableDrivers.map(driver => (
                              <Card key={driver._id} bg="green.50" border="1px solid" borderColor="green.200">
                                <CardBody p={3}>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold" fontSize="sm">
                                      {driver.firstName} {driver.lastName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">{driver.phone}</Text>
                                    <Text fontSize="xs" color="green.600">
                                      Vehicle: {driver.vehicleId || 'Not assigned'}
                                    </Text>
                                    <Badge colorScheme="green" size="sm">Available</Badge>
                                  </VStack>
                                </CardBody>
                              </Card>
                            ))
                          ) : (
                            <Text color="gray.500" textAlign="center" py={4}>
                              No drivers currently available
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Grid>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Live Tracking Tab */}
            <TabPanel px={0}>
              <Card mb={4}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">🗺️ Live Trip Tracking</Heading>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      Real-time GPS
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    {/* Tracking Overview */}
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                      <Card bg="purple.50" p={4}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                            {trips.filter(trip => trip.status === 'in_progress').length}
                          </Text>
                          <Text fontSize="sm" color="purple.700">Trips Being Tracked</Text>
                        </VStack>
                      </Card>
                      <Card bg="blue.50" p={4}>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {drivers.filter(driver => driver.status === 'active').length}
                          </Text>
                          <Text fontSize="sm" color="blue.700">Drivers Online</Text>
                        </VStack>
                      </Card>
                    </Grid>
                    
                    {/* Live Tracking Interface */}
                    <Card>
                      <CardBody>
                        <VStack spacing={4} align="center" py={8}>
                          <Heading size="md" color="purple.600">🗺️ Live Tracking Interface</Heading>
                          <Text color="gray.600" textAlign="center" maxW="md">
                            Real-time GPS tracking for active trips, driver locations, and route monitoring.
                            Advanced mapping features with live updates and traffic information.
                          </Text>
                          <VStack spacing={3}>
                            <Button 
                              colorScheme="purple" 
                              size="lg"
                              onClick={() => window.location.href = '/maps/tracking'}
                            >
                              Open Live Tracking Map
                            </Button>
                            <Button 
                              variant="outline"
                              colorScheme="purple"
                              onClick={() => window.open('/maps/tracking', '_blank')}
                            >
                              Open in New Window
                            </Button>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                    
                    {/* Currently Tracked Trips */}
                    {trips.filter(trip => trip.status === 'in_progress').length > 0 && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Currently Tracked Trips</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={2}>
                            {trips.filter(trip => trip.status === 'in_progress').map(trip => (
                              <Card key={trip._id} w="full" bg="purple.25" border="1px solid" borderColor="purple.200">
                                <CardBody p={3}>
                                  <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                      <Text 
                                        fontWeight="bold" 
                                        fontSize="sm"
                                        color="blue.600" 
                                        cursor="pointer" 
                                        _hover={{ textDecoration: 'underline' }}
                                        onClick={(e) => handleTripClick(e, trip)}
                                      >
                                        {trip.tripId}
                                      </Text>
                                      <Text 
                                        fontSize="xs"
                                        color="blue.600" 
                                        cursor="pointer" 
                                        _hover={{ textDecoration: 'underline' }}
                                        onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                      >
                                        {trip.riderName}
                                      </Text>
                                      <Badge colorScheme="purple" size="sm">Tracking Active</Badge>
                                    </VStack>
                                    <Button size="xs" colorScheme="purple" variant="outline">
                                      View on Map
                                    </Button>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Profile Tab */}
            <TabPanel px={0}>
              <DispatcherProfile />
            </TabPanel>

            {/* Schedule Tab */}
            <TabPanel px={0}>
              <DispatcherSchedule 
                onViewTrip={(trip) => {
                  setSelectedTrip(trip);
                  setViewTripDetails(trip);
                  onViewOpen();
                }}
                onAssignDriver={(trip) => {
                  setSelectedTrip(trip);
                  setTripToAssign(trip);
                  onAssignOpen();
                }}
              />
            </TabPanel>

            {/* Search Tab */}
            <TabPanel px={0}>
              <DispatcherSearch />
            </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

          {/* Enhanced Action Buttons - Mobile-First Design */}
          <Card mb={{ base: 6, md: 8 }}>
            <CardBody p={{ base: 4, md: 6 }}>
              <Flex 
                direction={{ base: "column", sm: "row" }}
                justify="space-between" 
                align={{ base: "stretch", sm: "center" }}
                gap={{ base: 3, sm: 4 }}
              >
                <HStack 
                  spacing={{ base: 2, md: 4 }}
                  flexWrap="wrap"
                  justify={{ base: "center", sm: "flex-start" }}
                >
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          {/* Enhanced Date Filter for Upcoming Tab - Mobile-First Design */}
          {activeTab === 1 && (
            <Card mb={{ base: 4, md: 6 }}>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="md" fontWeight="semibold" color="blue.700">
                    Filter by Date Range
                  </Text>
                  <Flex 
                    direction={{ base: "column", sm: "row" }}
                    gap={{ base: 3, sm: 4 }}
                    align={{ base: "stretch", sm: "end" }}
                  >
                    <FormControl flex="1" minW={{ base: "auto", sm: "140px" }}>
                      <FormLabel fontSize="sm" mb={2} color="gray.700">From Date</FormLabel>
                      <Input
                        type="date"
                        size="md"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        bg="white"
                        borderColor="gray.300"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                      />
                    </FormControl>
                    <FormControl flex="1" minW={{ base: "auto", sm: "140px" }}>
                      <FormLabel fontSize="sm" mb={2} color="gray.700">To Date</FormLabel>
                      <Input
                        type="date"
                        size="md"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        bg="white"
                        borderColor="gray.300"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                      />
                    </FormControl>
                    <Button
                      size="md"
                      colorScheme="gray"
                      variant="outline"
                      onClick={() => setDateRange({ start: '', end: '' })}
                      minW={{ base: "full", sm: "100px" }}
                    >
                      Clear Filters
                    </Button>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          )}

        {/* Driver Status - Full Width Row */}
        <Card>
          <CardHeader>
            <Heading size="md">Driver Status</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={{ base: 4, md: 6 }}>
              {/* Available Drivers */}
              <Box>
                <Text fontWeight="bold" color="green.600" mb={4} fontSize={{ base: "md", md: "lg" }}>
                  Available Drivers ({availableDrivers.length})
                </Text>
                <VStack spacing={3} align="stretch">
                  {availableDrivers.map((driver) => (
                    <Box key={driver._id} p={3} bg="green.50" rounded="lg" border="1px solid" borderColor="green.200">
                      <HStack justify="space-between" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                        <VStack align="start" spacing={1} flex="1" minW="0">
                          <Text fontSize="sm" fontWeight="medium" isTruncated>
                            {driver.firstName} {driver.lastName}
                          </Text>
                          <Text fontSize="xs" color="gray.600" isTruncated>
                            {driver.email}
                          </Text>
                          {driver.vehicleInfo && (
                            <Text fontSize="xs" color="gray.600" isTruncated>
                              {driver.vehicleInfo.make} {driver.vehicleInfo.model}
                            </Text>
                          )}
                        </VStack>
                        {driver.phone && (
                          <IconButton
                            icon={<Box as={PhoneIcon} w={4} h={4} />}
                            size="sm"
                            colorScheme="green"
                            flexShrink={0}
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                          />
                        )}
                      </HStack>
                    </Box>
                  ))}
                  {availableDrivers.length === 0 && (
                    <Box p={4} bg="gray.50" rounded="lg" textAlign="center">
                      <Text fontSize="sm" color="gray.500">No available drivers</Text>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Busy Drivers */}
              <Box>
                <Text fontWeight="bold" color="orange.600" mb={4} fontSize="lg">
                  Busy Drivers ({busyDrivers.length})
                </Text>
                <VStack spacing={3} align="stretch">
                  {busyDrivers.map((driver) => (
                    <Box key={driver._id} p={3} bg="orange.50" rounded="lg" border="1px solid" borderColor="orange.200">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {driver.firstName} {driver.lastName}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {driver.email}
                          </Text>
                          {driver.vehicleInfo && (
                            <Text fontSize="xs" color="gray.600">
                              {driver.vehicleInfo.make} {driver.vehicleInfo.model}
                            </Text>
                          )}
                        </VStack>
                        {driver.phone && (
                          <IconButton
                            icon={<Box as={PhoneIcon} w={4} h={4} />}
                            size="sm"
                            colorScheme="orange"
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                          />
                        )}
                      </HStack>
                    </Box>
                  ))}
                  {busyDrivers.length === 0 && (
                    <Box p={4} bg="gray.50" rounded="lg" textAlign="center">
                      <Text fontSize="sm" color="gray.500">No busy drivers</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Grid>
          </CardBody>
        </Card>
      </Box>

        {/* Create/Edit Trip Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {selectedTrip ? 'Edit Trip' : 'Create New Trip'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {error && (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Rider Name</FormLabel>
                      <Input
                        value={formData.riderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, riderName: e.target.value }))}
                        placeholder="Enter rider name"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Rider Phone</FormLabel>
                      <Input
                        value={formData.riderPhone}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers, spaces, parentheses, hyphens, and plus signs
                          if (!value || /^[\d\s()+-]*$/.test(value)) {
                            setFormData(prev => ({ ...prev, riderPhone: value }));
                          }
                        }}
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl isRequired mt={4}>
                  <FormLabel>Pickup Location</FormLabel>
                  <PlacesAutocomplete
                    value={formData.pickupLocation.address}
                    onChange={(address) => setFormData(prev => ({ 
                      ...prev, 
                      pickupLocation: { ...prev.pickupLocation, address }
                    }))}
                    onPlaceSelected={(place) => setFormData(prev => ({ 
                      ...prev, 
                      pickupLocation: { 
                        address: place.address,
                        lat: place.location.lat,
                        lng: place.location.lng
                      }
                    }))}
                    placeholder="Enter pickup address"
                  />
                </FormControl>

                <FormControl isRequired mt={4}>
                  <FormLabel>Dropoff Location</FormLabel>
                  <PlacesAutocomplete
                    value={formData.dropoffLocation.address}
                    onChange={(address) => setFormData(prev => ({ 
                      ...prev, 
                      dropoffLocation: { ...prev.dropoffLocation, address }
                    }))}
                    onPlaceSelected={(place) => setFormData(prev => ({ 
                      ...prev, 
                      dropoffLocation: { 
                        address: place.address,
                        lat: place.location.lat,
                        lng: place.location.lng
                      }
                    }))}
                    placeholder="Enter dropoff address"
                  />
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={4}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Scheduled Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Scheduled Time</FormLabel>
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl mt={4}>
                  <FormLabel>Assign Driver</FormLabel>
                  <Select
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedDriver: e.target.value }))}
                    placeholder="Select a driver (optional)"
                  >
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.firstName} {driver.lastName} - {driver.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText={selectedTrip ? "Updating..." : "Creating..."}
                >
                  {selectedTrip ? 'Update Trip' : 'Create Trip'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* View Trip Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Trip Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedTrip && (
                <VStack align="start" spacing={3}>
                  <Text>
                    <strong>Trip ID:</strong>{' '}
                    <Text 
                      as="span"
                      color="blue.600" 
                      cursor="pointer" 
                      _hover={{ textDecoration: 'underline' }}
                      onClick={(e) => handleTripClick(e, selectedTrip)}
                    >
                      {selectedTrip.tripId}
                    </Text>
                  </Text>
                  <Text>
                    <strong>Rider:</strong>{' '}
                    <Text 
                      as="span"
                      color="blue.600" 
                      cursor="pointer" 
                      _hover={{ textDecoration: 'underline' }}
                      onClick={(e) => handleRiderClick(e, selectedTrip.rider?._id || selectedTrip.rider)}
                    >
                      {selectedTrip.riderName}
                    </Text>
                  </Text>
                  {selectedTrip.riderPhone && (
                    <Text><strong>Phone:</strong> {selectedTrip.riderPhone}</Text>
                  )}
                  <Text><strong>Pickup:</strong> {selectedTrip.pickupLocation.address}</Text>
                  <Text><strong>Dropoff:</strong> {selectedTrip.dropoffLocation.address}</Text>
                  <Text><strong>Scheduled:</strong> {formatDate(selectedTrip.scheduledDate)}</Text>
                  <Text><strong>Assigned Driver:</strong> {
                    selectedTrip.assignedDriver ? 
                      `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}` : 
                      'Unassigned'
                  }</Text>
                  <Text><strong>Status:</strong> 
                    <Badge ml={2} colorScheme={getStatusColor(selectedTrip.status)}>
                      {selectedTrip.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </Text>
                  {selectedTrip.notes && (
                    <Text><strong>Notes:</strong> {selectedTrip.notes}</Text>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onViewClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Cancel Trip
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to cancel this trip for{" "}
                <strong>{tripToDelete?.riderName}</strong>?
                <br />
                <br />
                <strong>Trip ID:</strong> {tripToDelete?.tripId}
                <br />
                <br />
                This will mark the trip as cancelled and cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteTrip} 
                  ml={3}
                  isLoading={isDeleting}
                  loadingText="Cancelling..."
                >
                  Cancel Trip
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Assign Driver Modal */}
        <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {tripToAssign?.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {tripToAssign && (
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg="gray.50" rounded="md">
                    <Text>
                      <strong>Trip ID:</strong>{' '}
                      <Text 
                        as="span"
                        color="blue.600" 
                        cursor="pointer" 
                        _hover={{ textDecoration: 'underline' }}
                        onClick={(e) => handleTripClick(e, tripToAssign)}
                      >
                        {tripToAssign.tripId}
                      </Text>
                    </Text>
                    <Text>
                      <strong>Rider:</strong>{' '}
                      <Text 
                        as="span"
                        color="blue.600" 
                        cursor="pointer" 
                        _hover={{ textDecoration: 'underline' }}
                        onClick={(e) => handleRiderClick(e, tripToAssign.rider?._id || tripToAssign.rider)}
                      >
                        {tripToAssign.riderName}
                      </Text>
                    </Text>
                    <Text><strong>Pickup:</strong> {tripToAssign.pickupLocation.address}</Text>
                    <Text><strong>Dropoff:</strong> {tripToAssign.dropoffLocation.address}</Text>
                    <Text><strong>Scheduled:</strong> {formatDate(tripToAssign.scheduledDate)}</Text>
                  </Box>
                  
                  {tripToAssign?.assignedDriver && (
                    <Box p={3} bg="blue.50" rounded="md">
                      <Text fontSize="sm" fontWeight="medium" color="blue.700">
                        Currently assigned to: {tripToAssign.assignedDriver.firstName} {tripToAssign.assignedDriver.lastName}
                      </Text>
                    </Box>
                  )}
                  
                  <FormControl isRequired>
                    <FormLabel>Select Driver</FormLabel>
                    <Select
                      placeholder="Choose a driver"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                    >
                      {/* Show available drivers first */}
                      {availableDrivers.length > 0 && (
                        <optgroup label="Available Drivers">
                          {availableDrivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.firstName} {driver.lastName} - {driver.email}
                              {driver.vehicleInfo && ` (${driver.vehicleInfo.make} ${driver.vehicleInfo.model})`}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {/* Show all drivers for reassignment */}
                      {tripToAssign?.assignedDriver && (
                        <optgroup label="All Drivers">
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.firstName} {driver.lastName} - {driver.email}
                              {driver.vehicleInfo && ` (${driver.vehicleInfo.make} ${driver.vehicleInfo.model})`}
                              {!driver.isAvailable ? ' (Busy)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </Select>
                  </FormControl>
                  
                  {!tripToAssign?.assignedDriver && availableDrivers.length === 0 && (
                    <Alert status="warning">
                      <AlertIcon />
                      No available drivers at this time.
                    </Alert>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAssignClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleAssignDriver}
                isLoading={isAssigning}
                loadingText={tripToAssign?.assignedDriver ? "Reassigning..." : "Assigning..."}
                disabled={!selectedDriverId || (!tripToAssign?.assignedDriver && availableDrivers.length === 0)}
              >
                {tripToAssign?.assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Trip Management Modal */}
        <TripManagementModal
          isOpen={isTripManagementOpen}
          onClose={onTripManagementClose}
          onTripUpdate={fetchTrips}
        />

        {/* Rider Info Modal */}
        <RiderInfoModal
          isOpen={!!selectedRider}
          onClose={() => setSelectedRider(null)}
          riderId={selectedRider}
        />

        {/* Trip Details Modal */}
      <TripDetailsModal
        isOpen={!!viewTripDetails}
        onClose={() => setViewTripDetails(null)}
        trip={viewTripDetails}
      />
    </>
  );
};

export default DispatcherDashboard;