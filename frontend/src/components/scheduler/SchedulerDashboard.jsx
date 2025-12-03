import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  HomeIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  QueueListIcon,
  PresentationChartLineIcon
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
import '../../config/axios';
import Navbar from '../shared/Navbar';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import TripManagement from './TripManagement';
import TripManagementModal from './TripManagementModal';
import CalendarOverview from './CalendarOverview';

const SchedulerDashboard = ({ view }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isManageView = view === 'manage' || location.pathname.includes('/manage') || location.search.includes('view=manage');
  const isCalendarView = view === 'calendar' || location.pathname.includes('/calendar') || location.search.includes('view=calendar');
  
  // Core state management
  const [trips, setTrips] = useState([]);
  const [dispatchers, setDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    rider: '',
    riderName: '',
    riderPhone: '',
    pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedDriver: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rider selection state
  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [riderSearchTerm, setRiderSearchTerm] = useState('');

  // Enhanced filtering and display state
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
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
  const primaryColor = useColorModeValue('green.600', 'green.300');
  
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
    isOpen: isTripManagementOpen,
    onOpen: onTripManagementOpen,
    onClose: onTripManagementClose
  } = useDisclosure();
  
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  
  // Additional filtering state (removing duplicates)
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredTrips, setFilteredTrips] = useState([]);
  
  const cancelRef = React.useRef();
  const toast = useToast();

  // Auto-open modal if URL parameter is present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openModal') === 'true') {
      onOpen();
      // Clean the URL by removing the openModal parameter
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('openModal');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, onOpen]);

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
    }
  }, [toast]);

  const fetchDispatchers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/dispatchers/available');
      setDispatchers(response.data);
    } catch (error) {
      console.error('Error fetching dispatchers:', error);
    }
  }, []);

  const fetchRiders = useCallback(async () => {
    setRidersLoading(true);
    try {
      const response = await axios.get('/api/users/riders');
      setRiders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch riders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRidersLoading(false);
    }
  }, [toast]);

  // Filter riders based on search term
  const filteredRiders = useMemo(() => {
    if (!riderSearchTerm) return riders;
    
    const searchLower = riderSearchTerm.toLowerCase();
    return riders.filter(rider => 
      rider.firstName?.toLowerCase().includes(searchLower) ||
      rider.lastName?.toLowerCase().includes(searchLower) ||
      rider.email?.toLowerCase().includes(searchLower) ||
      rider._id?.toLowerCase().includes(searchLower)
    );
  }, [riders, riderSearchTerm]);



  useEffect(() => {
    const loadData = async () => {
      await fetchTrips();
      await fetchDispatchers();
      await fetchRiders();
    };
    loadData();
  }, [fetchTrips, fetchDispatchers, fetchRiders]);

  // Enhanced statistics calculations with memoization
  const schedulerStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });
    
    const upcomingTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      return tripDate > today;
    });
    
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    const scheduledTrips = trips.filter(trip => 
      ['pending', 'confirmed', 'assigned'].includes(trip.status)
    );
    
    const assignedTrips = trips.filter(trip => trip.assignedDriver);
    const unassignedTrips = trips.filter(trip => !trip.assignedDriver);
    
    const completionRate = trips.length > 0 
      ? ((completedTrips.length / trips.length) * 100).toFixed(1)
      : 0;
    
    const todayCompletionRate = todaysTrips.length > 0
      ? ((todaysTrips.filter(t => t.status === 'completed').length / todaysTrips.length) * 100).toFixed(1)
      : 0;
    
    const assignmentRate = trips.length > 0
      ? ((assignedTrips.length / trips.length) * 100).toFixed(1)
      : 0;
    
    return {
      totalTrips: trips.length,
      todaysTrips: todaysTrips.length,
      upcomingTrips: upcomingTrips.length,
      completedTrips: completedTrips.length,
      scheduledTrips: scheduledTrips.length,
      assignedTrips: assignedTrips.length,
      unassignedTrips: unassignedTrips.length,
      completionRate: parseFloat(completionRate),
      todayCompletionRate: parseFloat(todayCompletionRate),
      assignmentRate: parseFloat(assignmentRate),
      totalDispatchers: dispatchers.length,
      activeDispatchers: dispatchers.filter(d => d.isActive).length
    };
  }, [trips, dispatchers]);
  
  // Paginated and filtered trips calculation
  const processedTrips = useMemo(() => {
    let filtered = trips;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.riderName?.toLowerCase().includes(searchLower) ||
        trip.riderPhone?.includes(searchTerm) ||
        trip.pickupLocation?.address?.toLowerCase().includes(searchLower) ||
        trip.dropoffLocation?.address?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }
    
    // Apply tab filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeTab) {
      case 0: // Today
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate.getTime() === today.getTime();
        });
        break;
      case 1: // Upcoming
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          return tripDate > today;
        });
        break;
      case 2: // Completed
        filtered = filtered.filter(trip => trip.status === 'completed');
        break;
      case 3: // All trips - no additional filter
        break;
    }
    
    // Sort by scheduled date
    filtered.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTrips = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    return {
      filteredTrips: filtered,
      paginatedTrips,
      totalPages,
      currentPage,
      totalItems: filtered.length
    };
  }, [trips, searchTerm, statusFilter, activeTab, currentPage, itemsPerPage]);

  // Update date and time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Filter trips based on selected tab and filters
  useEffect(() => {
    const filterTrips = () => {
      let filtered = [...(trips || [])];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter by tab (time period)
      switch (activeTab) {
        case 0: // Today
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= today && tripDate < tomorrow;
          });
          break;
        case 1: // Upcoming (future)
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate >= tomorrow;
          });
          break;
        case 2: // Past
          filtered = filtered.filter(trip => {
            const tripDate = new Date(trip.scheduledDate);
            return tripDate < today;
          });
          break;
        case 3: // All trips
        default:
          // No time filtering
          break;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(trip => 
          trip.riderName?.toLowerCase().includes(searchLower) ||
          trip.tripId?.toLowerCase().includes(searchLower) ||
          trip.riderPhone?.includes(searchTerm) ||
          trip.pickupLocation?.address?.toLowerCase().includes(searchLower) ||
          trip.dropoffLocation?.address?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by status
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(trip => trip.status === statusFilter);
      }

      // Filter by date range
      if (dateRange.start || dateRange.end) {
        filtered = filtered.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          const startDate = dateRange.start ? new Date(dateRange.start) : null;
          const endDate = dateRange.end ? new Date(dateRange.end) : null;
          
          if (startDate && endDate) {
            return tripDate >= startDate && tripDate <= endDate;
          } else if (startDate) {
            return tripDate >= startDate;
          } else if (endDate) {
            return tripDate <= endDate;
          }
          return true;
        });
      }

      setFilteredTrips(filtered);
    };

    filterTrips();
  }, [trips, activeTab, searchTerm, statusFilter, dateRange]);

  // Trips Table Component
  const TripsTable = ({ trips, showPattern, onView, onEdit, onDelete, formatDate, getStatusColor }) => (
    <TableContainer overflowX="auto">
      <Table variant="simple" size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>Trip ID</Th>
            <Th>Rider</Th>
            <Th>Pickup</Th>
            <Th>Dropoff</Th>
            <Th>{showPattern ? "Pattern" : "Scheduled"}</Th>
            <Th>Dispatcher</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {(trips || []).length === 0 ? (
            <Tr>
              <Td colSpan={8} textAlign="center" py={8}>
                <Text color="gray.500">No trips found</Text>
              </Td>
            </Tr>
          ) : (
            (trips || []).map((trip) => (
              <Tr key={trip._id}>
                <Td>{trip.tripId?.substring(0, 8)}</Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text>{trip.riderName}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {trip.riderPhone}
                    </Text>
                  </VStack>
                </Td>
                <Td>{trip.pickupLocation.address}</Td>
                <Td>{trip.dropoffLocation.address}</Td>
                <Td>
                  {showPattern && trip.patternDescription ? (
                    <Text fontSize="sm" color="blue.600">
                      {trip.patternDescription}
                    </Text>
                  ) : (
                    formatDate(trip.scheduledDate)
                  )}
                </Td>
                <Td>
                  {trip.assignedDriver ? 
                    `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 
                    'Unassigned'
                  }
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(trip.status)}>
                    {trip.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={{ base: 1, md: 2 }}>
                    <IconButton
                      icon={<Box as={EyeIcon} w={4} h={4} />}
                      size="sm"
                      onClick={() => onView(trip)}
                      aria-label="View trip"
                    />
                    <IconButton
                      icon={<Box as={PencilIcon} w={4} h={4} />}
                      size="sm"
                      onClick={() => onEdit(trip)}
                      aria-label="Edit trip"
                    />
                    <IconButton
                      icon={<Box as={TrashIcon} w={4} h={4} />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => onDelete(trip)}
                      aria-label="Delete trip"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );

  const formatDateTime = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
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
      const errorMessage = error.response?.data?.message || 'Error saving trip';
      const errorCode = error.response?.data?.error;
      
      if (errorCode === 'RIDER_NOT_FOUND') {
        setError('Rider not found. Please select a valid registered rider from the system.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleCloseModal = () => {
    setSelectedTrip(null);
    setFormData({
      rider: '',
      riderName: '',
      riderPhone: '',
      pickupLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      dropoffLocation: { address: '', lat: 0, lng: 0, placeId: '' },
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      assignedDriver: ''
    });
    setError('');
    onClose();
  };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    const scheduledDate = new Date(trip.scheduledDate);
    setFormData({
      rider: trip.rider?._id || trip.rider || '',
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

  const openViewModal = (trip) => {
    setSelectedTrip(trip);
    onViewOpen();
  };

  const openDeleteDialog = (trip) => {
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
      fetchTrips(); // Refresh the trips list
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
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box>
        <Navbar title="Scheduler Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  // Get today's and upcoming trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrips = (trips || []).filter(trip => {
    const tripDate = new Date(trip.scheduledDate);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate.getTime() === today.getTime();
  });

  const pendingTrips = (trips || []).filter(trip => trip.status === 'pending');
  const completedTrips = (trips || []).filter(trip => trip.status === 'completed');

  return (
    <Box minH="100vh" bg="green.25">
      <Navbar title="Scheduler Dashboard" />
      
      <Box pt={{ base: 4, md: 0 }}>
        {/* Conditional rendering for different views */}
        {isManageView ? (
          <Box px={{ base: 3, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
            <TripManagement onTripUpdate={fetchTrips} initialTrips={trips} />
          </Box>
        ) : isCalendarView ? (
          <Container 
            maxW="container.xl" 
            py={{ base: 4, md: 6 }} 
            px={{ base: 4, md: 6, lg: 8 }}
          >
            <CalendarOverview onTripUpdate={fetchTrips} />
          </Container>
        ) : (
          <Container 
            maxW="container.xl" 
            py={{ base: 4, md: 6 }} 
            px={{ base: 4, md: 6, lg: 8 }}
          >
            <>
          {/* Enhanced Breadcrumb Navigation */}
          <Breadcrumb mb={{ base: 4, md: 6 }} fontSize={{ base: "sm", md: "md" }}>
            <BreadcrumbItem>
              <BreadcrumbLink display="flex" alignItems="center" gap={2}>
                <Box as={HomeIcon} w={4} h={4} />
                Operations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Scheduler</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Enhanced Scheduler Dashboard Header */}
          <Card 
            mb={{ base: 6, md: 8 }} 
            bg={cardBg}
            shadow="lg"
            _hover={{ shadow: "xl", transform: "translateY(-2px)" }}
            transition="all 0.3s ease"
            borderLeft="6px solid"
            borderLeftColor="green.500"
          >
            <CardBody p={{ base: 4, md: 6 }}>
              <VStack align="start" spacing={{ base: 3, md: 4 }}>
                <HStack spacing={3}>
                  <Box 
                    bg="green.100" 
                    p={3} 
                    borderRadius="lg"
                    color="green.600"
                  >
                    <Box as={CalendarDaysIconSolid} w={8} h={8} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Heading 
                      size={{ base: "lg", md: "xl" }} 
                      color={primaryColor}
                      fontWeight="bold"
                    >
                      Scheduler Control Center
                    </Heading>
                    <Text 
                      color={mutedColor}
                      fontSize={{ base: "sm", md: "md" }}
                      fontWeight="medium"
                    >
                      Comprehensive trip scheduling and management hub
                    </Text>
                  </VStack>
                </HStack>
                
                {/* Current Date/Time Display */}
                <HStack spacing={2} color={mutedColor}>
                  <Box as={ClockIconSolid} w={4} h={4} />
                  <Text fontSize={{ base: "sm", md: "md" }} fontWeight="medium">
                    {formatDateTime(currentDateTime)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Actions Dropdown */}
          <Box mb={{ base: 6, md: 8 }}>
            <Menu>
              <Tooltip label="Quick Actions" placement="right">
                <MenuButton
                  as={Button}
                  rightIcon={<Box as={ChevronDownIcon} w={5} h={5} />}
                  leftIcon={<Box as={AdjustmentsHorizontalIcon} w={5} h={5} />}
                  size="md"
                  variant="solid"
                  colorScheme="green"
                >
                  Quick Actions
                </MenuButton>
              </Tooltip>
              <MenuList>
                <MenuItem 
                  icon={<Box as={PlusIcon} w={5} h={5} />}
                  onClick={onOpen}
                >
                  Schedule Trip
                </MenuItem>
                <MenuItem 
                  icon={<Box as={MagnifyingGlassIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler?view=manage')}
                  fontWeight={isManageView ? "bold" : "normal"}
                  bg={isManageView ? "blue.50" : "transparent"}
                >
                  Trip Management
                </MenuItem>
                <MenuItem 
                  icon={<Box as={CalendarDaysIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler?view=calendar')}
                  fontWeight={isCalendarView ? "bold" : "normal"}
                  bg={isCalendarView ? "blue.50" : "transparent"}
                >
                  Calendar View
                </MenuItem>
                <MenuItem 
                  icon={<Box as={CalendarDaysIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler')}
                  fontWeight={!isManageView && !isCalendarView ? "bold" : "normal"}
                  bg={!isManageView && !isCalendarView ? "blue.50" : "transparent"}
                >
                  Dashboard Overview
                </MenuItem>
                <MenuItem 
                  icon={<Box as={DocumentTextIcon} w={5} h={5} />}
                  onClick={() => navigate('/scheduler/recurring-trips')}
                >
                  Recurring Trips
                </MenuItem>
                
                <MenuDivider />
                
                <MenuItem 
                  icon={<Box as={UserGroupIconSolid} w={5} h={5} />}
                  onClick={() => navigate('/riders?tab=all-riders')}
                >
                  All Riders
                </MenuItem>
                <MenuItem 
                  icon={<Box as={ChartBarIcon} w={5} h={5} />}
                  onClick={() => navigate('/admin/analytics')}
                >
                  Analytics Dashboard
                </MenuItem>
                
                <MenuDivider />
                
                <MenuItem 
                  icon={<Box as={ArrowDownTrayIcon} w={5} h={5} />}
                >
                  Export Schedule
                </MenuItem>
                <MenuItem 
                  icon={<Box as={Cog6ToothIcon} w={5} h={5} />}
                >
                  Settings
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>

          {/* Statistics Dashboard */}
          <SimpleGrid 
            columns={{ base: 2, md: 4 }}
            spacing={{ base: 3, md: 4 }} 
            mb={{ base: 6, md: 8 }}
          >
            {/* Today's Trips */}
            <Card 
              bg={cardBg}
              shadow="md" 
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }} 
              transition="all 0.2s"
              borderTop="4px solid"
              borderTopColor="green.500"
            >
              <CardBody p={4} textAlign="center">
                <Box as={CalendarDaysIconSolid} w={6} h={6} color="green.500" mx="auto" mb={2} />
                <Text fontSize="3xl" fontWeight="bold" color="green.600" mb={1}>
                  {schedulerStats.todaysTrips}
                </Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Today's Trips
                </Text>
              </CardBody>
            </Card>
            
            {/* Pending Trips */}
            <Card 
              bg={cardBg}
              shadow="md" 
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }} 
              transition="all 0.2s"
              borderTop="4px solid"
              borderTopColor="orange.500"
            >
              <CardBody p={4} textAlign="center">
                <Box as={ClockIconSolid} w={6} h={6} color="orange.500" mx="auto" mb={2} />
                <Text fontSize="3xl" fontWeight="bold" color="orange.600" mb={1}>
                  {pendingTrips.length}
                </Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Pending Trips
                </Text>
              </CardBody>
            </Card>

            {/* Completed Trips */}
            <Card 
              bg={cardBg}
              shadow="md" 
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }} 
              transition="all 0.2s"
              borderTop="4px solid"
              borderTopColor="green.400"
            >
              <CardBody p={4} textAlign="center">
                <Box as={CheckCircleIconSolid} w={6} h={6} color="green.400" mx="auto" mb={2} />
                <Text fontSize="3xl" fontWeight="bold" color="green.500" mb={1}>
                  {completedTrips.length}
                </Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Completed Trips
                </Text>
              </CardBody>
            </Card>

            {/* Available Dispatchers */}
            <Card 
              bg={cardBg}
              shadow="md" 
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }} 
              transition="all 0.2s"
              borderTop="4px solid"
              borderTopColor="blue.500"
            >
              <CardBody p={4} textAlign="center">
                <Box as={UserGroupIconSolid} w={6} h={6} color="blue.500" mx="auto" mb={2} />
                <Text fontSize="3xl" fontWeight="bold" color="blue.600" mb={1}>
                  {dispatchers.length}
                </Text>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Available Dispatchers
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Enhanced Action Buttons - Mobile-First Design */}
          <Card 
            mb={{ base: 6, md: 8 }}
            bg="white"
            shadow="md"
            borderRadius="xl"
            border="1px solid"
            borderColor="green.100"
          >
            <CardBody p={{ base: 4, md: 6 }}>
              <Grid 
                templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
                gap={{ base: 3, md: 4 }}
              >
                {/* Create New Trip - Primary Action */}
                <Button 
                  leftIcon={<Box as={PlusIcon} w={5} h={5} />} 
                  colorScheme="green" 
                  onClick={onOpen}
                  size={{ base: "lg", md: "lg" }}
                  height={{ base: "50px", md: "56px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="semibold"
                  _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                  transition="all 0.2s ease"
                >
                  <VStack spacing={0}>
                    <Text>➕ Create Trip</Text>
                    <Text fontSize="xs" opacity={0.8} display={{ base: "none", md: "block" }}>
                      New Schedule
                    </Text>
                  </VStack>
                </Button>

                {/* Manage Trips */}
                <Button 
                  leftIcon={<Box as={MagnifyingGlassIcon} w={5} h={5} />} 
                  colorScheme="green" 
                  variant="outline"
                  onClick={onTripManagementOpen}
                  size={{ base: "lg", md: "lg" }}
                  height={{ base: "50px", md: "56px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="semibold"
                  _hover={{ transform: "translateY(-1px)", shadow: "lg", bg: "green.50" }}
                  transition="all 0.2s ease"
                  borderWidth="2px"
                >
                  <VStack spacing={0}>
                    <Text>🔍 Manage Trips</Text>
                    <Text fontSize="xs" opacity={0.7} display={{ base: "none", md: "block" }}>
                      Edit & Update
                    </Text>
                  </VStack>
                </Button>

                {/* Quick Access to Calendar View */}
                <Button 
                  leftIcon={<Box as={CalendarDaysIcon} w={5} h={5} />} 
                  colorScheme="green" 
                  variant="outline"
                  onClick={() => setActiveTab(4)} // Switch to Calendar tab
                  size={{ base: "lg", md: "lg" }}
                  height={{ base: "50px", md: "56px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="semibold"
                  _hover={{ transform: "translateY(-1px)", shadow: "lg", bg: "green.50" }}
                  transition="all 0.2s ease"
                  borderWidth="2px"
                >
                  <VStack spacing={0}>
                    <Text>� Calendar</Text>
                    <Text fontSize="xs" opacity={0.7} display={{ base: "none", md: "block" }}>
                      Visual Schedule
                    </Text>
                  </VStack>
                </Button>

                {/* Quick Access to Analytics */}
                <Button 
                  leftIcon={<Box as={EyeIcon} w={5} h={5} />} 
                  colorScheme="green" 
                  variant="outline"
                  onClick={() => setActiveTab(6)} // Switch to Analytics tab
                  size={{ base: "lg", md: "lg" }}
                  height={{ base: "50px", md: "56px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="semibold"
                  _hover={{ transform: "translateY(-1px)", shadow: "lg", bg: "green.50" }}
                  transition="all 0.2s ease"
                  borderWidth="2px"
                >
                  <VStack spacing={0}>
                    <Text>� Analytics</Text>
                    <Text fontSize="xs" opacity={0.7} display={{ base: "none", md: "block" }}>
                      Performance
                    </Text>
                  </VStack>
                </Button>
              </Grid>
            </CardBody>
          </Card>

          {/* Enhanced Trips Management with Advanced Filtering */}
          <Card 
            shadow="xl"
            borderRadius="xl"
            border="1px solid"
            borderColor="green.200"
            bg="white"
          >
            <CardHeader pb={{ base: 2, md: 4 }} bg="green.50" borderTopRadius="xl">
              <VStack spacing={{ base: 3, lg: 4 }} align="stretch">
                {/* Header Section */}
                <Flex 
                  direction={{ base: "column", lg: "row" }}
                  justify="space-between" 
                  align={{ base: "start", lg: "center" }}
                  gap={{ base: 3, lg: 4 }}
                >
                  <Heading 
                    size={{ base: "md", md: "lg" }} 
                    color="green.700"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    📋 Trip Management & Analytics
                  </Heading>
                </Flex>
                
                {/* Enhanced Search and Filters */}
                <Card bg="white" shadow="sm" borderRadius="lg">
                  <CardBody p={{ base: 3, md: 4 }}>
                    <VStack spacing={4} align="stretch">
                      {/* Search and Status Filter Row */}
                      <Flex
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 3, md: 4 }}
                        align={{ base: "stretch", md: "center" }}
                      >
                        <InputGroup flex="1" maxW={{ base: "full", md: "300px" }}>
                          <InputLeftElement pointerEvents="none">
                            <Box as={MagnifyingGlassIcon} w={5} h={5} color="green.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="🔍 Search trips by rider, location, or notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            borderColor="green.200"
                            _hover={{ borderColor: "green.300" }}
                            _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px var(--chakra-colors-green-500)" }}
                          />
                        </InputGroup>
                        
                        <Select
                          placeholder="🎯 All Statuses"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          maxW={{ base: "full", md: "180px" }}
                          borderColor="green.200"
                          _hover={{ borderColor: "green.300" }}
                          _focus={{ borderColor: "green.500" }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">⏳ Pending</option>
                          <option value="assigned">👤 Assigned</option>
                          <option value="in_progress">🚗 In Progress</option>
                          <option value="completed">✅ Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </Select>
                      </Flex>
                      
                      {/* Date Range Filter Row */}
                      <Flex
                        direction={{ base: "column", sm: "row" }}
                        gap={{ base: 3, sm: 2 }}
                        align={{ base: "stretch", sm: "center" }}
                        flexWrap="wrap"
                      >
                        <Flex align="center" gap={2} minW="fit-content">
                          <Box as={CalendarDaysIcon} w={4} h={4} color="green.500" />
                          <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                            Date Range:
                          </Text>
                        </Flex>
                        
                        <Flex gap={2} align="center" flex="1">
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            size="sm"
                            maxW={{ base: "full", sm: "150px" }}
                            borderColor="green.200"
                            _hover={{ borderColor: "green.300" }}
                          />
                          <Text fontSize="sm" color="gray.500" fontWeight="medium">to</Text>
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            size="sm"
                            maxW={{ base: "full", sm: "150px" }}
                            borderColor="green.200"
                            _hover={{ borderColor: "green.300" }}
                          />
                        </Flex>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="green"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setDateRange({ start: '', end: '' });
                          }}
                          _hover={{ bg: "green.50" }}
                        >
                          🗑️ Clear Filters
                        </Button>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </CardHeader>
          
          <CardBody p={{ base: 3, md: 4 }}>
            <Tabs 
              index={activeTab} 
              onChange={setActiveTab} 
              variant="soft-rounded" 
              colorScheme="green"
              size={{ base: "sm", md: "md" }}
            >
              <TabList 
                mb={4}
                gap={{ base: 1, md: 2 }}
                flexWrap="wrap"
                justifyContent={{ base: "center", md: "flex-start" }}
                bg="green.50"
                p={2}
                borderRadius="lg"
              >
                {/* Trip Management Tabs - Enhanced with HeroIcons */}
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={ClockIcon} w={3} h={3} />
                    <Text>
                      Today ({(trips || []).filter(trip => {
                        const tripDate = new Date(trip.scheduledDate);
                        const today = new Date();
                        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const todayEnd = new Date(todayStart);
                        todayEnd.setDate(todayEnd.getDate() + 1);
                        return tripDate >= todayStart && tripDate < todayEnd;
                      }).length})
                    </Text>
                  </HStack>
                </Tab>
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={ArrowRightIcon} w={3} h={3} />
                    <Text>
                      Upcoming ({(trips || []).filter(trip => {
                        const tripDate = new Date(trip.scheduledDate);
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return tripDate >= tomorrow;
                      }).length})
                    </Text>
                  </HStack>
                </Tab>
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={ChartBarIcon} w={3} h={3} />
                    <Text>
                      History ({(trips || []).filter(trip => {
                        const tripDate = new Date(trip.scheduledDate);
                        const today = new Date();
                        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        return tripDate < todayStart;
                      }).length})
                    </Text>
                  </HStack>
                </Tab>
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={QueueListIcon} w={3} h={3} />
                    <Text>All Trips ({(trips || []).length})</Text>
                  </HStack>
                </Tab>
                
                {/* Additional Feature Tabs - Enhanced with HeroIcons */}
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={CalendarDaysIcon} w={3} h={3} />
                    <Text>Calendar</Text>
                  </HStack>
                </Tab>
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={ArrowPathIcon} w={3} h={3} />
                    <Text>Recurring</Text>
                  </HStack>
                </Tab>
                <Tab 
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  _selected={{ 
                    bg: "green.600", 
                    color: "white",
                    shadow: "md"
                  }}
                  _hover={{ bg: "green.100" }}
                  transition="all 0.2s ease"
                >
                  <HStack spacing={1}>
                    <Box as={PresentationChartLineIcon} w={3} h={3} />
                    <Text>Analytics</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Today's Trips */}
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips.filter(trip => {
                      const tripDate = new Date(trip.scheduledDate);
                      const today = new Date();
                      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const todayEnd = new Date(todayStart);
                      todayEnd.setDate(todayEnd.getDate() + 1);
                      return tripDate >= todayStart && tripDate < todayEnd;
                    })} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                
                {/* Upcoming Trips */}
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips.filter(trip => {
                      const tripDate = new Date(trip.scheduledDate);
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tripDate >= tomorrow;
                    })} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                
                {/* Past Trips/History */}
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips.filter(trip => {
                      const tripDate = new Date(trip.scheduledDate);
                      const today = new Date();
                      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      return tripDate < todayStart;
                    })} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                
                {/* All Trips */}
                <TabPanel px={0}>
                  <TripsTable 
                    trips={filteredTrips} 
                    showPattern={false}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                  />
                </TabPanel>
                
                {/* Calendar View */}
                <TabPanel px={0}>
                  <Card bg="white" shadow="sm" p={4}>
                    <VStack spacing={4} align="center">
                      <Heading size="md" color="green.600">📅 Calendar View</Heading>
                      <Text color="gray.600" textAlign="center">
                        Advanced calendar interface for visual trip scheduling and management.
                      </Text>
                      <Button 
                        colorScheme="green" 
                        size="lg"
                        onClick={() => window.location.href = '/scheduler/calendar'}
                      >
                        Open Full Calendar View
                      </Button>
                    </VStack>
                  </Card>
                </TabPanel>
                
                {/* Recurring Trips */}
                <TabPanel px={0}>
                  <Card bg="white" shadow="sm" p={4}>
                    <VStack spacing={4} align="center">
                      <Heading size="md" color="green.600">🔄 Recurring Trips</Heading>
                      <Text color="gray.600" textAlign="center">
                        Manage scheduled routes, weekly patterns, and recurring transportation schedules.
                      </Text>
                      <Button 
                        colorScheme="green" 
                        size="lg"
                        onClick={() => window.location.href = '/scheduler/recurring'}
                      >
                        Manage Recurring Trips
                      </Button>
                    </VStack>
                  </Card>
                </TabPanel>
                
                {/* Analytics */}
                <TabPanel px={0}>
                  <VStack spacing={6}>
                    <Card bg="white" shadow="sm" p={6} w="full">
                      <VStack spacing={4}>
                        <Heading size="md" color="green.600">📈 Scheduler Analytics</Heading>
                        
                        {/* Analytics Summary Cards */}
                        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} w="full">
                          <Card bg="green.50" p={4}>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                {Math.round((completedTrips.length / (trips.length || 1)) * 100)}%
                              </Text>
                              <Text fontSize="sm" color="gray.600">Completion Rate</Text>
                            </VStack>
                          </Card>
                          <Card bg="orange.50" p={4}>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                {pendingTrips.length}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Pending Assignments</Text>
                            </VStack>
                          </Card>
                          <Card bg="blue.50" p={4}>
                            <VStack>
                              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                {Math.round(trips.length / 7)}
                              </Text>
                              <Text fontSize="sm" color="gray.600">Avg Daily Trips</Text>
                            </VStack>
                          </Card>
                        </Grid>
                        
                        <Text color="gray.600" textAlign="center" mt={4}>
                          Detailed analytics and reporting features for scheduling optimization and performance tracking.
                        </Text>
                      </VStack>
                    </Card>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
            </>
          </Container>
        )}
      </Box>

      {/* Create/Edit Trip Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTrip ? `Edit Trip - ${selectedTrip.tripId}` : 'Create New Trip'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Search and Select Rider</FormLabel>
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={riderSearchTerm}
                    onChange={(e) => setRiderSearchTerm(e.target.value)}
                    mb={2}
                  />
                  <Select
                    placeholder={ridersLoading ? "Loading riders..." : "Select a rider"}
                    value={formData.rider}
                    onChange={(e) => {
                      const selectedRider = riders.find(r => r._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        rider: e.target.value,
                        riderName: selectedRider ? `${selectedRider.firstName} ${selectedRider.lastName}` : '',
                        riderPhone: selectedRider?.phone || ''
                      }));
                    }}
                    isDisabled={ridersLoading}
                  >
                    {filteredRiders.map((rider) => (
                      <option key={rider._id} value={rider._id}>
                        {rider.firstName} {rider.lastName} ({rider.email})
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {filteredRiders.length} rider{filteredRiders.length !== 1 ? 's' : ''} found
                  </Text>
                </FormControl>

                {formData.rider && (
                  <Button
                    colorScheme="purple"
                    width="100%"
                    onClick={() => {
                      const selectedRider = riders.find(r => r._id === formData.rider);
                      if (selectedRider) {
                        navigate('/scheduler/recurring', {
                          state: {
                            riderId: selectedRider._id,
                            riderName: `${selectedRider.firstName} ${selectedRider.lastName}`,
                            riderEmail: selectedRider.email,
                            riderPhone: selectedRider.phone,
                            fromCreateTrip: true
                          }
                        });
                        handleCloseModal();
                      }
                    }}
                  >
                    Create Recurring Trip Instead
                  </Button>
                )}
                
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
                  <GridItem>
                    <FormControl isRequired>
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
                            lng: place.location.lng,
                            placeId: place.placeId
                          }
                        }))}
                        placeholder="Enter pickup address"
                        isRequired
                      />
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
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
                            lng: place.location.lng,
                            placeId: place.placeId
                          }
                        }))}
                        placeholder="Enter dropoff address"
                        isRequired
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Time</FormLabel>
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>

                <FormControl>
                  <FormLabel>Assign Dispatcher</FormLabel>
                  <Select
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedDriver: e.target.value }))}
                    placeholder="Select a dispatcher (optional)"
                  >
                    {dispatchers.map((dispatcher) => (
                      <option key={dispatcher._id} value={dispatcher._id}>
                        {dispatcher.firstName} {dispatcher.lastName} - {dispatcher.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={isSubmitting}
                loadingText={selectedTrip ? 'Updating...' : 'Creating...'}
              >
                {selectedTrip ? 'Update Trip' : 'Create Trip'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Trip Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size={{ base: "full", md: "lg" }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Trip Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack align="start" spacing={4}>
                <Text><strong>Trip ID:</strong> {selectedTrip.tripId}</Text>
                <Text><strong>Rider:</strong> {selectedTrip.riderName}</Text>
                <Text><strong>Phone:</strong> {selectedTrip.riderPhone}</Text>
                <Text><strong>Pickup:</strong> {selectedTrip.pickupLocation.address}</Text>
                <Text><strong>Dropoff:</strong> {selectedTrip.dropoffLocation.address}</Text>
                <Text><strong>Scheduled:</strong> {formatDate(selectedTrip.scheduledDate)}</Text>
                <Text><strong>Dispatcher:</strong> {
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

      {/* Trip Management Modal */}
      <TripManagementModal
        isOpen={isTripManagementOpen}
        onClose={onTripManagementClose}
        onTripUpdate={fetchTrips}
      />
    </Box>
  );
};

export default SchedulerDashboard;