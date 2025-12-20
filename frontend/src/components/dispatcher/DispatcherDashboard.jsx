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
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon,
  ArrowUturnLeftIcon
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
import ReturnToDispatchButton from './ReturnToDispatchButton';
import UnifiedTripManagement from '../shared/UnifiedTripManagement';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import RiderInfoModal from '../shared/RiderInfoModal';
import TripDetailsModal from '../scheduler/TripDetailsModal';
import DispatcherProfile from './DispatcherProfile';
import DispatcherSchedule from './DispatcherSchedule';
import DispatcherSearch from './DispatcherSearch';
import { DriverInfoDisplay } from '../driver/shared';
import { ViewToggle, ViewContainer, ViewTable, ViewCard } from '../shared/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const DispatcherDashboard = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Core state management
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  // View state for Trip Management
  const [isManageView, setIsManageView] = useState(false);
  
  // View toggle for table/card display
  const { _viewMode, setViewMode } = useViewMode('dispatcherTripViewMode', 'table');
  
  // Enhanced filtering and display state
  const [displayedTrips, setDisplayedTrips] = useState([]);
  
  // Responsive design variables
  const statsColumns = useBreakpointValue({ base: 1, sm: 2, lg: 4 });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    isOpen: isAssignOpen,
    onOpen: onAssignOpen,
    onClose: onAssignClose
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
  


  // Destructure computed stats for easier access
  const { 
    availableDriversData: availableDrivers, 
    busyDriversData: busyDrivers
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

  // Filter trips to show only TODAY's trips - Simplified Interface
  useEffect(() => {
    if ((trips || []).length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Filter to only today's trips
      const filtered = trips.filter(trip => {
        const tripDate = new Date(trip.scheduledDate);
        const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
        return tripDateOnly.getTime() === today.getTime();
      });

      // Sort by scheduled time (chronological order)
      filtered.sort((a, b) => {
        const timeA = new Date(`1970-01-01 ${a.scheduledTime || '00:00'}`);
        const timeB = new Date(`1970-01-01 ${b.scheduledTime || '00:00'}`);
        return timeA - timeB;
      });
      
      setDisplayedTrips(filtered);
    }
  }, [trips]);

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
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
      {/* Breadcrumb Navigation with Process Menu - Positioned at Top */}
      <Box 
        position="sticky" 
        top={0} 
        zIndex={100}
        bg="white" 
        borderBottom="1px solid" 
        borderColor="gray.200" 
        px={{ base: 3, md: 4 }} 
        py={{ base: 3, md: 4 }}
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        <VStack align="stretch" spacing={3}>
          <Flex justify="space-between" align="center">
            <Breadcrumb fontSize={{ base: "sm", md: "md" }}>
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
            <Spacer />
            
            {/* Process Menu - Desktop Version - Centered */}
            <Box 
              position="relative" 
              display={{ base: "none", md: "block" }}
              onMouseLeave={() => {
                // Delay closing to allow mouse to move to dropdown
                processMenuTimeoutRef.current = setTimeout(() => {
                  setIsProcessMenuOpen(false);
                }, 150);
              }}
              onMouseEnter={() => {
                // Clear any pending timeout when re-entering
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
              
              {/* 3-Column Dropdown Menu on Hover or Click */}
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
                  mt={0}
                  minW="700px"
                  zIndex={1000}
                  pointerEvents="auto"
                  onMouseEnter={() => {
                    // Clear timeout when hovering over menu
                    if (processMenuTimeoutRef.current) {
                      clearTimeout(processMenuTimeoutRef.current);
                    }
                  }}
                >
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    {/* Column 1 - TRIPS */}
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                        TRIPS
                      </Text>
                      <Divider my={1} />
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={onOpen}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Create Trip
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/manage')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Manage Trips
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/map')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        View Map
                      </Button>
                    </VStack>
                    
                    {/* Column 2 - USERS */}
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                        USERS
                      </Text>
                      <Divider my={1} />
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/upcoming')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Upcoming
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/completed')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Completed
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/all')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        All Trips
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/active')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Active
                      </Button>
                    </VStack>
                    
                    {/* Column 3 - NAVIGATE */}
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                        NAVIGATE
                      </Text>
                      <Divider my={1} />
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/riders')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        All Riders
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/users')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        All Users
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/drivers')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Drivers
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/tracking')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Tracking
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/profile')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/schedule')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Schedule
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/search')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Search
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/trips/recurring')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        Recurring Trips
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => handleProcessMenuNavigation('/analytics')}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        📊 Analytics Dashboard
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => {
                          const csvContent = 'Trip ID,Rider,Driver,Status,Date\\n';
                          const link = document.createElement('a');
                          link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
                          link.download = 'dispatch-data.csv';
                          link.click();
                        }}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        📥 Export as CSV
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => {
                          const jsonContent = JSON.stringify({ trips: [], dispatchers: [] }, null, 2);
                          const link = document.createElement('a');
                          link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
                          link.download = 'dispatch-data.json';
                          link.click();
                        }}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        📥 Export as JSON
                      </Button>
                      <Button 
                        variant="ghost" 
                        justifyContent="flex-start" 
                        w="full" 
                        onClick={() => window.print()}
                        _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                      >
                        🖨️ Print Schedule
                      </Button>
                    </VStack>
                  </Grid>
                </Box>
              )}
            </Box>
            
            <Spacer />
          </Flex>
          
          {/* Process Menu - Mobile Version - Full Width Below Breadcrumb */}
          <Menu>
            <MenuButton
              as={Button}
              variant="outline"
              size="sm"
              colorScheme="blue"
              display={{ base: "block", md: "none" }}
              w="full"
            >
              Process
            </MenuButton>
            <MenuList minW="200px">
              <MenuItem onClick={onOpen}>
                Create Trip
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/manage')}>
                Manage Trips
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/map')}>
                View Map
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => navigate('/trips/upcoming')}>
                Upcoming
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/completed')}>
                Completed
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/all')}>
                All Trips
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/active')}>
                Active
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => navigate('/riders')}>
                All Riders
              </MenuItem>
              <MenuItem onClick={() => navigate('/users')}>
                All Users
              </MenuItem>
              <MenuItem onClick={() => navigate('/drivers')}>
                Drivers
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => navigate('/tracking')}>
                Tracking
              </MenuItem>
              <MenuItem onClick={() => navigate('/profile')}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => navigate('/schedule')}>
                Schedule
              </MenuItem>
              <MenuItem onClick={() => navigate('/search')}>
                Search
              </MenuItem>
              <MenuItem onClick={() => navigate('/trips/recurring')}>
                Recurring Trips
              </MenuItem>
            </MenuList>
          </Menu>
          
          <Spacer />
          <ReturnToDispatchButton variant="ghost" size="sm" showText={true} />
        </VStack>
      </Box>
      <Box bg="gray.50" minH="calc(100vh - 80px)" w="100%" overflowX="hidden">
        {/* Conditional rendering for different views */}
        {isManageView ? (
          <Box px={{ base: 3, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
            <UnifiedTripManagement onTripUpdate={fetchTrips} initialTrips={trips} />
            <Button 
              mt={4} 
              onClick={() => setIsManageView(false)}
              leftIcon={<Box as={ArrowUturnLeftIcon} w={4} h={4} />}
              variant="outline"
            >
              Back to Dispatch Dashboard
            </Button>
          </Box>
        ) : (
          <Box px={{ base: 3, md: 4 }} py={{ base: 3, md: 4 }}>
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
            </VStack>
          </Box>

          {/* Enhanced Real-time Statistics Dashboard */}
          <SimpleGrid 
            columns={statsColumns}
            spacing={{ base: 4, md: 6 }} 
            mb={{ base: 6, md: 8 }}
          >
            <Card 
              bg={cardBg}
              shadow="md" 
              borderLeft="6px solid"
              borderLeftColor="blue.500"
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
                        {dashboardStats.todayCompletionRate}% completed
                      </Text>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
            
            <Card 
              bg={cardBg}
              shadow="md" 
              borderLeft="6px solid"
              borderLeftColor="green.500"
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
              shadow="md" 
              borderLeft="6px solid"
              borderLeftColor="orange.500"
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
                        {dashboardStats.unassignedTrips} unassigned
                      </Text>
                    </VStack>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card 
              bg={cardBg}
              shadow="md" 
              borderLeft="6px solid"
              borderLeftColor="purple.500"
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

          {/* Simplified Today's Operations Dashboard - No Tabs */}
          <Card mb={{ base: 6, md: 8 }} bg={cardBg}>
            <CardBody p={{ base: 4, md: 6 }}>

              <VStack spacing={6} align="stretch">
                {/* SECTION 1: TODAY'S TRIP SUMMARY */}
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">📋 Today's Trips Overview</Heading>
                      <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                        {displayedTrips.length} rides
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Quick Stats */}
                      <Grid templateColumns="repeat(auto-fit, minmax(140px, 1fr))" gap={3} w="100%">
                        <Card bg="green.50" border="1px solid" borderColor="green.200">
                          <CardBody textAlign="center" py={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">
                              {(displayedTrips || []).filter(trip => trip.status === 'completed').length}
                            </Text>
                            <Text fontSize="sm" color="green.700">Completed</Text>
                          </CardBody>
                        </Card>
                        <Card bg="orange.50" border="1px solid" borderColor="orange.200">
                          <CardBody textAlign="center" py={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                              {(displayedTrips || []).filter(trip => trip.status === 'in_progress').length}
                            </Text>
                            <Text fontSize="sm" color="orange.700">Active</Text>
                          </CardBody>
                        </Card>
                        <Card bg="blue.50" border="1px solid" borderColor="blue.200">
                          <CardBody textAlign="center" py={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {(displayedTrips || []).filter(trip => trip.status === 'assigned').length}
                            </Text>
                            <Text fontSize="sm" color="blue.700">Assigned</Text>
                          </CardBody>
                        </Card>
                        <Card bg="red.50" border="1px solid" borderColor="red.200">
                          <CardBody textAlign="center" py={4}>
                            <Text fontSize="2xl" fontWeight="bold" color="red.600">
                              {(displayedTrips || []).filter(trip => !trip.assignedDriver).length}
                            </Text>
                            <Text fontSize="sm" color="red.700">Need Driver</Text>
                          </CardBody>
                        </Card>
                      </Grid>

                      {/* Today's Trips Table */}
                      <Card>
                        <CardHeader display={{ base: "flex", md: "block" }} justifyContent="space-between" alignItems="center" py={{ base: 3, md: 4 }}>
                          <Heading size={{ base: "sm", md: "md" }}>Today's Trips</Heading>
                          <ViewToggle storageKey="dispatcherTripViewMode" onViewChange={setViewMode} />
                        </CardHeader>
                        <CardBody p={0}>
                          <ViewContainer storageKey="dispatcherTripViewMode">
                            <ViewTable key="table">
                              <TableContainer overflowX="auto" w="100%">
                            <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
                              <Thead bg={bgColor}>
                                <Tr>
                                  <Th>Pickup Time</Th>
                                  <Th>Rider Name</Th>
                                  <Th display={{ base: "none", md: "table-cell" }}>Route</Th>
                                  <Th>Driver</Th>
                                  <Th>Status</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {displayedTrips.map((trip) => (
                                  <Tr key={trip._id}>
                                    <Td fontWeight="600">
                                      {trip.scheduledTime || 'TBD'}
                                    </Td>
                                    <Td>
                                      <VStack align="start" spacing={0}>
                                        <Text 
                                          fontSize="sm"
                                          color="blue.600" 
                                          cursor="pointer" 
                                          fontWeight="600"
                                          _hover={{ textDecoration: 'underline' }}
                                          onClick={(e) => handleRiderClick(e, trip.rider?._id || trip.rider)}
                                        >
                                          {trip.riderName}
                                        </Text>
                                        {trip.riderPhone && (
                                          <Text fontSize="xs" color="gray.500">
                                            {trip.riderPhone}
                                          </Text>
                                        )}
                                      </VStack>
                                    </Td>
                                    <Td display={{ base: "none", md: "table-cell" }}>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="xs" color="gray.700">From: {getLocationText(trip.pickupLocation).substring(0, 25)}...</Text>
                                        <Text fontSize="xs" color="gray.700">To: {getLocationText(trip.dropoffLocation).substring(0, 25)}...</Text>
                                      </VStack>
                                    </Td>
                                    <Td>
                                      {trip.assignedDriver ? (
                                        <VStack align="start" spacing={1}>
                                          <VStack align="start" spacing={0}>
                                            <Text fontSize="sm" fontWeight="600">
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
                                        <Tooltip label="View details">
                                          <IconButton
                                            icon={<Box as={EyeIcon} w={4} h={4} />}
                                            size="xs"
                                            colorScheme="blue"
                                            onClick={() => handleView(trip)}
                                            aria-label="View trip"
                                          />
                                        </Tooltip>
                                        <Tooltip label="Call rider">
                                          <IconButton
                                            icon={<Box as={PhoneIcon} w={4} h={4} />}
                                            size="xs"
                                            colorScheme="green"
                                            aria-label="Call rider"
                                          />
                                        </Tooltip>
                                        <Tooltip label="View on map">
                                          <IconButton
                                            icon={<Box as={MapPinIcon} w={4} h={4} />}
                                            size="xs"
                                            colorScheme="purple"
                                            onClick={() => navigate(`/maps/trips?tripId=${trip._id}`)}
                                            aria-label="View on map"
                                          />
                                        </Tooltip>
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
                                <Text color="gray.400" fontSize="sm">Create a trip to get started</Text>
                              </VStack>
                            </Center>
                          )}
                            </ViewTable>
                            <ViewCard key="card">
                              {displayedTrips.length === 0 ? (
                                <Center py={8}>
                                  <VStack spacing={3}>
                                    <Text color="gray.500" fontSize="lg">No rides scheduled for today</Text>
                                    <Text color="gray.400" fontSize="sm">Create a trip to get started</Text>
                                  </VStack>
                                </Center>
                              ) : (
                                <VStack spacing={3} p={3} align="stretch">
                                  {displayedTrips.map((trip) => (
                                    <Box key={trip._id} p={3} bg={cardBg} rounded="md" border="1px solid" borderColor="gray.200">
                                      <VStack align="start" spacing={2}>
                                        <HStack justify="space-between" w="100%">
                                          <VStack align="start" spacing={0}>
                                            <Text fontSize="sm" fontWeight="bold">{trip.scheduledTime || 'TBD'}</Text>
                                            <Badge colorScheme={getStatusColor(trip.status)} size="sm">{trip.status.replace('_', ' ').toUpperCase()}</Badge>
                                          </VStack>
                                          <HStack spacing={1}>
                                            <Tooltip label="View details">
                                              <IconButton
                                                icon={<Box as={EyeIcon} w={4} h={4} />}
                                                size="sm"
                                                colorScheme="blue"
                                                onClick={() => handleView(trip)}
                                                minH="44px"
                                                minW="44px"
                                                aria-label="View trip"
                                              />
                                            </Tooltip>
                                            <Tooltip label="View on map">
                                              <IconButton
                                                icon={<Box as={MapPinIcon} w={4} h={4} />}
                                                size="sm"
                                                colorScheme="purple"
                                                onClick={() => navigate(`/maps/trips?tripId=${trip._id}`)}
                                                minH="44px"
                                                minW="44px"
                                                aria-label="View on map"
                                              />
                                            </Tooltip>
                                          </HStack>
                                        </HStack>
                                        <Divider />
                                        <VStack align="start" spacing={1} w="100%">
                                          <Text fontSize="xs" fontWeight="bold" color="gray.600">RIDER</Text>
                                          <Text fontSize="sm" fontWeight="600">{trip.riderName}</Text>
                                          {trip.riderPhone && <Text fontSize="xs" color="gray.500">{trip.riderPhone}</Text>}
                                        </VStack>
                                        <VStack align="start" spacing={1} w="100%">
                                          <Text fontSize="xs" fontWeight="bold" color="gray.600">ROUTE</Text>
                                          <Text fontSize="xs" color="gray.700">From: {getLocationText(trip.pickupLocation).substring(0, 30)}...</Text>
                                          <Text fontSize="xs" color="gray.700">To: {getLocationText(trip.dropoffLocation).substring(0, 30)}...</Text>
                                        </VStack>
                                        {trip.assignedDriver ? (
                                          <VStack align="start" spacing={1} w="100%">
                                            <Text fontSize="xs" fontWeight="bold" color="gray.600">DRIVER</Text>
                                            <Text fontSize="sm" fontWeight="600">{trip.assignedDriver.firstName} {trip.assignedDriver.lastName}</Text>
                                            {trip.assignedDriver.phone && <Text fontSize="xs" color="gray.500">{trip.assignedDriver.phone}</Text>}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              colorScheme="blue"
                                              onClick={() => handleAssignClick(trip)}
                                              w="100%"
                                              minH="44px"
                                              mt={2}
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
                                            w="100%"
                                            minH="44px"
                                          >
                                            Assign Driver
                                          </Button>
                                        )}
                                      </VStack>
                                    </Box>
                                  ))}
                                </VStack>
                              )}
                            </ViewCard>
                          </ViewContainer>
                        </CardBody>
                      </Card>
                    </VStack>
                  </CardBody>
                </Card>

                {/* SECTION 2: ACTIVE DRIVERS PANEL */}
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">👥 Active Drivers Status</Heading>
                      <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                        {drivers.filter(d => d.status === 'online').length} Online
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {drivers.filter(d => d.status === 'online').map((driver) => (
                        <Card key={driver._id} border="2px solid" borderColor="green.200" bg="green.50">
                          <CardBody>
                            <VStack align="start" spacing={2}>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {driver.firstName} {driver.lastName}
                                </Text>
                                <Badge colorScheme="green" size="sm">Online</Badge>
                              </VStack>
                              <Text fontSize="xs" color="gray.600">
                                {driver.phone}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Vehicle: {driver.vehicleId || 'Not assigned'}
                              </Text>
                              <HStack spacing={2} pt={2} w="full">
                                <Button size="xs" colorScheme="blue" flex={1}>
                                  View Map
                                </Button>
                                <Button size="xs" variant="outline" colorScheme="gray" flex={1}>
                                  Message
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                    {drivers.filter(d => d.status === 'online').length === 0 && (
                      <Center py={8}>
                        <VStack spacing={3}>
                          <Text color="gray.500">No drivers currently online</Text>
                          <Text color="gray.400" fontSize="sm">Drivers will appear here when they come online</Text>
                        </VStack>
                      </Center>
                    )}
                  </CardBody>
                </Card>

                {/* SECTION 3: ALERTS & NOTIFICATIONS */}
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">⚠️ Alerts & Issues</Heading>
                      <Badge colorScheme="red" fontSize="md" px={3} py={1}>
                        {
                          (displayedTrips.filter(t => !t.assignedDriver).length || 0) +
                          (displayedTrips.filter(t => {
                            const now = new Date();
                            const pickupTime = new Date(t.scheduledDate + ' ' + t.scheduledTime);
                            const lateThreshold = new Date(now.getTime() - 10 * 60000); // 10 mins ago
                            return pickupTime < lateThreshold && t.status !== 'completed';
                          }).length || 0)
                        } Issues
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {/* No Driver Alert */}
                      {displayedTrips.filter(t => !t.assignedDriver).length > 0 && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="bold">
                              {displayedTrips.filter(t => !t.assignedDriver).length} Trip(s) Without Driver
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Action required: Assign drivers to these trips
                            </Text>
                          </Box>
                        </Alert>
                      )}

                      {/* Late Pickup Alert */}
                      {displayedTrips.filter(t => {
                        const now = new Date();
                        const pickupTime = new Date(t.scheduledDate + ' ' + t.scheduledTime);
                        const lateThreshold = new Date(now.getTime() - 10 * 60000);
                        return pickupTime < lateThreshold && t.status !== 'completed';
                      }).length > 0 && (
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="bold">
                              {displayedTrips.filter(t => {
                                const now = new Date();
                                const pickupTime = new Date(t.scheduledDate + ' ' + t.scheduledTime);
                                const lateThreshold = new Date(now.getTime() - 10 * 60000);
                                return pickupTime < lateThreshold && t.status !== 'completed';
                              }).length} Trip(s) Running Late
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              These pickups were scheduled more than 10 minutes ago
                            </Text>
                          </Box>
                        </Alert>
                      )}

                      {/* All Good Alert */}
                      {displayedTrips.filter(t => !t.assignedDriver).length === 0 && 
                       displayedTrips.filter(t => {
                        const now = new Date();
                        const pickupTime = new Date(t.scheduledDate + ' ' + t.scheduledTime);
                        const lateThreshold = new Date(now.getTime() - 10 * 60000);
                        return pickupTime < lateThreshold && t.status !== 'completed';
                       }).length === 0 && (
                        <Alert status="success" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <Text fontWeight="bold">All Systems Normal</Text>
                            <Text fontSize="sm" color="gray.600">
                              All trips are assigned and on schedule
                            </Text>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
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
                        <Box flex="1" minW="0">
                          <DriverInfoDisplay
                            driver={driver}
                            showVehicle={true}
                            showContact={false}
                            showStatus={false}
                            size="sm"
                          />
                        </Box>
                        {driver.phone && (
                          <IconButton
                            icon={<Box as={PhoneIcon} w={4} h={4} />}
                            size="sm"
                            colorScheme="green"
                            flexShrink={0}
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                            as="a"
                            href={`tel:${driver.phone}`}
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
                        <Box flex="1" minW="0">
                          <DriverInfoDisplay
                            driver={driver}
                            showVehicle={true}
                            showContact={false}
                            showStatus={false}
                            size="sm"
                          />
                        </Box>
                        {driver.phone && (
                          <IconButton
                            icon={<Box as={PhoneIcon} w={4} h={4} />}
                            size="sm"
                            colorScheme="orange"
                            aria-label="Call driver"
                            title={`Call ${driver.firstName}`}
                            as="a"
                            href={`tel:${driver.phone}`}
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
        )}
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