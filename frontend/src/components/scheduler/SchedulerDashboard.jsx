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
  UserIcon,
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
import { useAuth } from '../../contexts/AuthContext';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import UnifiedTripManagement from '../shared/UnifiedTripManagement';
import TripManagementModal from './TripManagementModal';
import CalendarOverview from './CalendarOverview';
import useCloseOnScroll from '../../hooks/useCloseOnScroll';
import { validateField, validateForm, tripFormValidation, sanitizeFormData } from '../../utils/validationSchemas';
import { useRetry } from '../../hooks/useRetry';
import { RetryAlert, ErrorRecoveryAlert } from '../shared/RetryAlerts';
import { handleApiError, formatValidationErrors, isRetryableError } from '../../utils/errorHandler';
import { ViewToggle, ViewContainer, ViewTable, ViewCard } from '../shared/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const SchedulerDashboard = ({ view }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Process Menu State
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const isManageView = view === 'manage' || location.pathname.includes('/manage') || location.search.includes('view=manage');
  const isCalendarView = view === 'calendar' || location.pathname.includes('/calendar') || location.search.includes('view=calendar');
  
  // View toggle for table/card display
  const { _viewMode, _setViewMode } = useViewMode('schedulerTripViewMode', 'table');
  
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
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rider selection state
  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [riderSearchTerm, setRiderSearchTerm] = useState('');

  // Enhanced filtering and display state
  const [activeTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Responsive design variables
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
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
    onClose: onTripManagementClose
  } = useDisclosure();
  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose
  } = useDisclosure();
  
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportScope, setExportScope] = useState('filtered');
  
  // Close Quick Actions dropdown on scroll
  useCloseOnScroll(isQuickActionsOpen, () => setIsQuickActionsOpen(false));

  // Initialize retry hook for API operations
  const { 
    retry, 
    isRetrying, 
    retryCount, 
    cancel: cancelRetry 
  } = useRetry({
    maxAttempts: 3,
    showNotifications: true,
  });
  
  // Retry state for different operations
  const [activeRetryOperation, setActiveRetryOperation] = useState(null);
  const [retryErrorData, setRetryErrorData] = useState(null);
  
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
      try {
        const response = await axios.get('/api/users/dispatchers/available');
        const data = response.data.data || response.data || [];
        setDispatchers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 404) {
          // Fallback: fetch users with dispatcher role
          try {
            const response = await axios.get('/api/users?role=dispatcher');
            const users = response.data.data?.users || response.data || [];
            setDispatchers(Array.isArray(users) ? users : []);
          } catch {
            // If fallback also fails, set empty array
            setDispatchers([]);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error fetching dispatchers:', error);
      setDispatchers([]);
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
  useMemo(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, searchTerm, statusFilter, activeTab, itemsPerPage]);

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
  }, [trips, searchTerm, statusFilter, activeTab, dateRange]);

  // Trips Table Component
  const TripsTable = ({ trips, showPattern, onView, onEdit, onDelete, formatDate, getStatusColor }) => (
    <TableContainer w="100%" overflowX="auto">
      <Table variant="simple" size={{ base: "sm", md: "md" }} w="100%">
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
                      minW="44px"
                      minH="44px"
                      onClick={() => onView(trip)}
                      aria-label="View trip"
                    />
                    <IconButton
                      icon={<Box as={PencilIcon} w={4} h={4} />}
                      size="sm"
                      minW="44px"
                      minH="44px"
                      onClick={() => onEdit(trip)}
                      aria-label="Edit trip"
                    />
                    <IconButton
                      icon={<Box as={TrashIcon} w={4} h={4} />}
                      size="sm"
                      minW="44px"
                      minH="44px"
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
    setValidationErrors({});
    setIsSubmitting(true);
    setActiveRetryOperation('submit');
    setRetryErrorData(null);

    try {
      // Validate form data
      const { isValid, errors } = validateForm(formData, tripFormValidation);
      
      if (!isValid) {
        setValidationErrors(errors);
        toast({
          title: 'Validation Error',
          description: formatValidationErrors(errors),
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      // Sanitize form data before submission
      const cleanData = sanitizeFormData(formData);

      const tripData = {
        ...cleanData,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
        estimatedDuration: 30,
        pickupLocation: {
          ...formData.pickupLocation,
          lat: formData.pickupLocation.lat || 40.7128,
          lng: formData.pickupLocation.lng || -74.0060
        },
        dropoffLocation: {
          ...formData.dropoffLocation,
          lat: formData.dropoffLocation.lat || 40.7580,
          lng: formData.dropoffLocation.lng || -73.9855
        }
      };

      if (selectedTrip) {
        await retry(
          () => axios.put(`/api/trips/${selectedTrip._id}`, tripData),
          'Update Trip'
        );
        toast({
          title: 'Success',
          description: 'Trip updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await retry(
          () => axios.post('/api/trips', tripData),
          'Create Trip'
        );
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
      setActiveRetryOperation(null);
    } catch (error) {
      setRetryErrorData(error);
      const apiError = handleApiError(error, 'Trip submission');
      
      if (error.response?.data?.error === 'RIDER_NOT_FOUND') {
        setError('Rider not found. Please select a valid registered rider from the system.');
      } else {
        setError(apiError.description);
      }
      
      if (apiError.isRetryable) {
        toast({
          title: apiError.title,
          description: `${apiError.description} (Retryable)`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: apiError.title,
          description: apiError.description,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
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
    setValidationErrors({});
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
    setActiveRetryOperation('delete');
    setRetryErrorData(null);
    
    try {
      await retry(
        () => axios.delete(`/api/trips/${tripToDelete._id}`),
        'Cancel Trip'
      );
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
      setActiveRetryOperation(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      setRetryErrorData(error);
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

  // Get trips based on export scope selection
  const getTripsForExport = (scope) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (scope) {
      case 'today':
        return trips.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate.getTime() === today.getTime();
        });
      case 'upcoming':
        return trips.filter(trip => {
          const tripDate = new Date(trip.scheduledDate);
          return tripDate >= tomorrow;
        });
      case 'all':
        return trips;
      case 'filtered':
        return filteredTrips.length > 0 ? filteredTrips : trips;
      case 'pending':
        return trips.filter(trip => trip.status === 'pending');
      case 'completed':
        return trips.filter(trip => trip.status === 'completed');
      case 'assigned':
        return trips.filter(trip => trip.status === 'assigned');
      default:
        return filteredTrips.length > 0 ? filteredTrips : trips;
    }
  };

  // Open export dialog
  const openExportDialog = (format) => {
    setExportFormat(format);
    onExportOpen();
  };

  // Execute export with selected options
  const executeExport = () => {
    try {
      const tripsToExport = getTripsForExport(exportScope);
      
      if (tripsToExport.length === 0) {
        toast({
          title: 'No Data',
          description: 'No trips available to export for the selected criteria',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (exportFormat === 'csv') {
        exportToCSV(tripsToExport);
      } else if (exportFormat === 'json') {
        exportToJSON(tripsToExport);
      } else if (exportFormat === 'print') {
        exportToPrint(tripsToExport);
      }

      toast({
        title: 'Success',
        description: `${tripsToExport.length} trip(s) exported successfully as ${exportFormat.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onExportClose();
    } catch (error) {
      console.error('Error exporting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to export schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Legacy export function (kept for backwards compatibility)
  const handleExportSchedule = (format = 'csv') => {
    try {
      const tripsToExport = filteredTrips.length > 0 ? filteredTrips : trips;
      
      if (tripsToExport.length === 0) {
        toast({
          title: 'No Data',
          description: 'No trips available to export',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (format === 'csv') {
        exportToCSV(tripsToExport);
      } else if (format === 'json') {
        exportToJSON(tripsToExport);
      } else if (format === 'print') {
        exportToPrint(tripsToExport);
      }

      toast({
        title: 'Success',
        description: `Schedule exported successfully as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to export schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const exportToCSV = (tripsData) => {
    const headers = [
      'Trip ID',
      'Date/Time',
      'Rider Name',
      'Pickup Location',
      'Dropoff Location',
      'Status',
      'Driver',
      'Notes'
    ];

    const rows = tripsData.map(trip => [
      trip.tripId || trip._id,
      formatDate(trip.scheduledDate),
      trip.riderName || `${trip.rider?.firstName || ''} ${trip.rider?.lastName || ''}`.trim() || 'N/A',
      trip.pickupLocation?.address || trip.pickupAddress || 'N/A',
      trip.dropoffLocation?.address || trip.dropoffAddress || 'N/A',
      trip.status || 'N/A',
      trip.driver?.name || trip.driverName || 'Unassigned',
      trip.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `schedule_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (tripsData) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTrips: tripsData.length,
      trips: tripsData.map(trip => ({
        tripId: trip.tripId || trip._id,
        scheduledDate: trip.scheduledDate,
        riderName: trip.riderName || `${trip.rider?.firstName || ''} ${trip.rider?.lastName || ''}`.trim(),
        riderId: trip.rider?._id || trip.rider,
        pickupLocation: trip.pickupLocation?.address || trip.pickupAddress,
        pickupCoordinates: trip.pickupLocation?.coordinates,
        dropoffLocation: trip.dropoffLocation?.address || trip.dropoffAddress,
        dropoffCoordinates: trip.dropoffLocation?.coordinates,
        status: trip.status,
        driver: trip.driver?.name || trip.driverName || 'Unassigned',
        driverId: trip.driver?._id || trip.driver,
        notes: trip.notes,
        distance: trip.distance,
        duration: trip.duration,
        estimatedCost: trip.estimatedCost
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `schedule_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPrint = (tripsData) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Schedule Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #2D3748;
              border-bottom: 3px solid #48BB78;
              padding-bottom: 10px;
            }
            .export-info {
              background: #F7FAFC;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #48BB78;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #E2E8F0;
            }
            tr:nth-child(even) {
              background-color: #F7FAFC;
            }
            tr:hover {
              background-color: #EDF2F7;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-completed { background: #C6F6D5; color: #22543D; }
            .status-in_progress { background: #BEE3F8; color: #2C5282; }
            .status-assigned { background: #FEEBC8; color: #7C2D12; }
            .status-pending { background: #E2E8F0; color: #2D3748; }
            .status-cancelled { background: #FED7D7; color: #742A2A; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Transportation Schedule Report</h1>
          <div class="export-info">
            <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Trips:</strong> ${tripsData.length}</p>
            <p><strong>Period:</strong> ${activeTab === 0 ? 'Today' : activeTab === 1 ? 'Upcoming' : 'All Trips'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date/Time</th>
                <th>Rider</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Status</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              ${tripsData.map(trip => `
                <tr>
                  <td>${trip.tripId || trip._id}</td>
                  <td>${formatDate(trip.scheduledDate)}</td>
                  <td>${trip.riderName || `${trip.rider?.firstName || ''} ${trip.rider?.lastName || ''}`.trim() || 'N/A'}</td>
                  <td>${trip.pickupLocation?.address || trip.pickupAddress || 'N/A'}</td>
                  <td>${trip.dropoffLocation?.address || trip.dropoffAddress || 'N/A'}</td>
                  <td><span class="status-badge status-${trip.status}">${trip.status || 'N/A'}</span></td>
                  <td>${trip.driver?.name || trip.driverName || 'Unassigned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #48BB78; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">Print Schedule</button>
            <button onclick="window.close()" style="background: #E2E8F0; color: #2D3748; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
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
  const _filterTodayTrips = (trips || []).filter(trip => {
    const tripDate = new Date(trip.scheduledDate);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate.getTime() === today.getTime();
  });

  const pendingTrips = (trips || []).filter(trip => trip.status === 'pending');
  const completedTrips = (trips || []).filter(trip => trip.status === 'completed');

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  return (
    <Box minH="100vh" bg="green.25" overflowX="hidden">
      <Navbar title="Scheduler Dashboard" />
      
      {/* Retry Alerts */}
      <RetryAlert
        isVisible={isRetrying && activeRetryOperation}
        attempt={retryCount}
        maxAttempts={3}
        operationName={activeRetryOperation === 'delete' ? 'Cancel Trip' : 'Trip Operation'}
        onCancel={cancelRetry}
      />
      
      <ErrorRecoveryAlert
        isVisible={!!retryErrorData && !isRetrying && activeRetryOperation}
        error={retryErrorData}
        attempt={retryCount}
        maxAttempts={3}
        onRetry={() => {
          if (activeRetryOperation === 'delete') {
            handleDeleteTrip();
          } else if (activeRetryOperation === 'submit') {
            handleSubmit({ preventDefault: () => {} });
          }
        }}
        onDismiss={() => {
          setRetryErrorData(null);
          setActiveRetryOperation(null);
        }}
        operationName={activeRetryOperation === 'delete' ? 'Cancel Trip' : 'Trip Operation'}
      />
      
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
              zIndex={1000}
              pointerEvents="auto"
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
                {/* Column 1: Trip Creation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Create Trip
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/maps/tracking')}>
                      View Map
                    </Button>
                  </VStack>
                </Box>

                {/* Column 2: Trip Views */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/trips/upcoming')}>
                      Upcoming
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/trips/completed')}>
                      Completed
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/trips/all')}>
                      All Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/trips/active')}>
                      Active
                    </Button>
                  </VStack>
                </Box>

                {/* Column 3: Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    {user?.role !== 'dispatcher' && user?.role !== 'scheduler' && (
                      <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/users')}>
                        All Users
                      </Button>
                    )}
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/drivers')}>
                      Drivers
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/tracking')}>
                      Tracking
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/profile')}>
                      Profile
                    </Button>
                  </VStack>
                </Box>

                {/* Column 4: More Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/schedule')}>
                      Schedule
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/scheduler?view=manage')}>
                      Trip Management
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/scheduler?view=calendar')}>
                      Calendar View
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/search')}>
                      Search
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" fontWeight="normal" onClick={() => handleProcessMenuNavigation('/trips/recurring')}>
                      Recurring Trips
                    </Button>
                  </VStack>
                </Box>
              </Grid>
            </Box>
          )}
        </Box>
      </Flex>
      
      <Box pt={{ base: 4, md: 0 }} w="100%">
        {/* Conditional rendering for different views */}
        {isManageView ? (
          <Box px={{ base: 2, sm: 3, md: 4, lg: 6 }} py={{ base: 3, sm: 4, md: 6 }}>
            <UnifiedTripManagement onTripUpdate={fetchTrips} initialTrips={trips} />
          </Box>
        ) : isCalendarView ? (
          <Box 
            w="100%"
            py={{ base: 3, sm: 4, md: 6 }} 
            px={{ base: 2, sm: 3, md: 4, lg: 6 }}
          >
            <CalendarOverview onTripUpdate={fetchTrips} />
          </Box>
        ) : (
          <Box 
            w="100%"
            py={{ base: 3, sm: 4, md: 6 }} 
            px={{ base: 2, sm: 3, md: 4, lg: 6 }}
          >
            <>
          {/* Enhanced Breadcrumb Navigation */}
          <Breadcrumb 
            mb={{ base: 4, md: 6 }} 
            fontSize={{ base: "sm", md: "md" }}
            maxW="100%"
          >
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
            mb={{ base: 4, sm: 5, md: 8 }} 
            bg={cardBg}
            shadow={{ base: "md", md: "lg" }}
            _hover={{ shadow: { base: "lg", md: "xl" }, transform: "translateY(-2px)" }}
            transition="all 0.3s ease"
            borderLeft={{ base: "4px solid", md: "6px solid" }}
            borderLeftColor="green.500"
            w="100%"
            maxW="100%"
          >
            <CardBody p={{ base: 3, sm: 4, md: 6 }}>
              <VStack align="start" spacing={{ base: 2, md: 4 }}>
                <HStack spacing={{ base: 2, md: 3 }} align="flex-start">
                  <Box 
                    bg="green.100" 
                    p={{ base: 2, md: 3 }}
                    borderRadius="lg"
                    color="green.600"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minW={{ base: "36px", md: "auto" }}
                    minH={{ base: "36px", md: "auto" }}
                  >
                    <Box as={CalendarDaysIconSolid} w={{ base: 6, md: 8 }} h={{ base: 6, md: 8 }} />
                  </Box>
                  <VStack align="start" spacing={{ base: 1, md: 2 }} flex={1}>
                    <Heading 
                      size={{ base: "md", sm: "lg", md: "xl" }} 
                      color={primaryColor}
                      fontWeight="bold"
                      lineHeight={{ base: "1.2", md: "1.3" }}
                    >
                      Scheduler Control Center
                    </Heading>
                    <Text 
                      color={mutedColor}
                      fontSize={{ base: "xs", sm: "sm", md: "md" }}
                      fontWeight="medium"
                      lineHeight="1.4"
                    >
                      Comprehensive trip scheduling and management hub
                    </Text>
                  </VStack>
                </HStack>
                
                {/* Current Date/Time Display */}
                <HStack spacing={2} color={mutedColor} fontSize={{ base: "xs", sm: "sm", md: "md" }}>
                  <Box as={ClockIconSolid} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} />
                  <Text fontWeight="medium">
                    {formatDateTime(currentDateTime)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Primary Action Buttons */}
          <Flex 
            mb={{ base: 6, md: 8 }}
            gap={{ base: 2, md: 3 }}
            flexWrap="wrap"
            align="center"
            justify="center"
            w="100%"
          >
            {/* Create Trip Button */}
            <Button 
              leftIcon={<Box as={PlusIcon} w={5} h={5} />}
              colorScheme="blue"
              size="md"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="semibold"
              onClick={onOpen}
              _hover={{ 
                shadow: "lg",
                transform: "translateY(-1px)"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s ease"
              borderRadius="md"
              px={{ base: 4, md: 6 }}
              py={6}
            >
              Create Trip
            </Button>

            {/* Print Schedule Button */}
            <Button 
              leftIcon={<Box as={DocumentTextIcon} w={5} h={5} />}
              colorScheme="gray"
              variant="outline"
              size="md"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="semibold"
              onClick={() => openExportDialog('print')}
              _hover={{ 
                shadow: "lg",
                transform: "translateY(-1px)",
                bg: "gray.100"
              }}
              _active={{
                transform: "translateY(0px)"
              }}
              transition="all 0.2s ease"
              borderRadius="md"
              borderWidth="1px"
              px={{ base: 4, md: 6 }}
              py={6}
            >
              Print Schedule
            </Button>
          </Flex>

          {/* Statistics Dashboard */}
          <SimpleGrid 
            columns={{ base: 2, md: 4 }}
            spacing={{ base: 3, md: 4 }} 
            mb={{ base: 6, md: 8 }}
            w="100%"
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

          {/* Enhanced Trips Management with Advanced Filtering */}
          <Card 
            shadow="xl"
            borderRadius="xl"
            border="1px solid"
            borderColor="green.200"
            bg="white"
            w="100%"
            maxW="100%"
            overflowX="auto"
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
                
                {/* Modern Filter Panel */}
                <Card 
                  bg="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                  shadow="md" 
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="green.200"
                >
                  <CardBody p={{ base: 4, md: 6 }}>
                    <VStack spacing={6} align="stretch">
                      {/* Main Filters Row */}
                      <Grid 
                        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "2fr 1fr 1fr 1fr" }} 
                        gap={4}
                      >
                        {/* Search Input */}
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            🔍 SEARCH
                          </Text>
                          <InputGroup>
                            <InputLeftElement pointerEvents="none">
                              <Box as={MagnifyingGlassIcon} w={5} h={5} color="green.400" />
                            </InputLeftElement>
                            <Input
                              placeholder="Search by rider, location, trip ID..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              bg="white"
                              borderColor="green.300"
                              _hover={{ borderColor: "green.400" }}
                              _focus={{ borderColor: "green.500", boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.1)" }}
                              fontSize="sm"
                            />
                          </InputGroup>
                        </Box>

                        {/* Status Filter */}
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            🎯 STATUS
                          </Text>
                          <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            bg="white"
                            borderColor="green.300"
                            _hover={{ borderColor: "green.400" }}
                            _focus={{ borderColor: "green.500" }}
                            fontSize="sm"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="assigned">👤 Assigned</option>
                            <option value="in_progress">🚗 In Progress</option>
                            <option value="completed">✅ Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </Select>
                        </Box>

                        {/* From Date */}
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            📅 FROM DATE
                          </Text>
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            bg="white"
                            borderColor="green.300"
                            _hover={{ borderColor: "green.400" }}
                            _focus={{ borderColor: "green.500" }}
                            fontSize="sm"
                          />
                        </Box>

                        {/* To Date */}
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            📅 TO DATE
                          </Text>
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            bg="white"
                            borderColor="green.300"
                            _hover={{ borderColor: "green.400" }}
                            _focus={{ borderColor: "green.500" }}
                            fontSize="sm"
                          />
                        </Box>
                      </Grid>

                      {/* Action Buttons */}
                      <Flex 
                        gap={3} 
                        justify={{ base: "stretch", sm: "flex-end" }}
                        flexWrap="wrap"
                      >
                        <Button
                          size="md"
                          colorScheme="green"
                          variant="solid"
                          onClick={() => {
                            // Filters are already being applied in real-time
                          }}
                          _hover={{ shadow: "md" }}
                          fontSize="sm"
                          fontWeight="semibold"
                        >
                          ✓ Apply Filters
                        </Button>
                        <Button
                          size="md"
                          variant="outline"
                          colorScheme="green"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setDateRange({ start: '', end: '' });
                          }}
                          _hover={{ bg: "green.50" }}
                          fontSize="sm"
                          fontWeight="semibold"
                        >
                          🗑️ Clear Filters
                        </Button>
                      </Flex>

                      {/* Filter Info */}
                      <Box 
                        bg="white" 
                        p={3} 
                        borderRadius="lg"
                        borderLeftWidth="4px"
                        borderLeftColor="green.500"
                      >
                        <Text fontSize="sm" color="gray.700">
                          <strong>Showing:</strong> {filteredTrips.length} trip(s) 
                          {searchTerm && ` matching "${searchTerm}"`}
                          {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                          {dateRange.start && ` from ${dateRange.start}`}
                          {dateRange.end && ` to ${dateRange.end}`}
                        </Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </CardHeader>
          
          <CardBody p={{ base: 3, md: 4 }}>
            {/* Today's Trips - Full Page View */}
            {(() => {
              // Filter for today's trips only (exclude completed and canceled)
              const todaysTrips = (trips || []).filter(trip => {
                const tripDate = new Date(trip.scheduledDate);
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(todayStart);
                todayEnd.setDate(todayEnd.getDate() + 1);
                const isTodayTrip = tripDate >= todayStart && tripDate < todayEnd;
                
                // Exclude completed and canceled trips
                const isActive = trip.status !== 'completed' && trip.status !== 'cancelled' && trip.status !== 'canceled';
                
                return isTodayTrip && isActive;
              });

              // Sort by scheduled time (chronological order)
              const sortedTrips = todaysTrips.sort((a, b) => {
                const timeA = a.scheduledTime ? parseInt(a.scheduledTime.replace(':', '')) : 2359;
                const timeB = b.scheduledTime ? parseInt(b.scheduledTime.replace(':', '')) : 2359;
                return timeA - timeB;
              });

              const totalTrips = sortedTrips.length;

              return (
                <VStack spacing={6} align="stretch" w="full">
                  {/* Header with Count and Refresh */}
                  <Box>
                    <HStack justify="space-between" align="center" mb={6}>
                      <VStack align="start" spacing={2}>
                        <Heading size="lg" color="green.700">
                          Today's Trips
                        </Heading>
                        <HStack spacing={3}>
                          <Badge colorScheme="green" fontSize="md" px={4} py={2}>
                            {totalTrips} trip{totalTrips !== 1 ? 's' : ''} active
                          </Badge>
                          <Text fontSize="sm" color="gray.500">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </Text>
                        </HStack>
                      </VStack>
                      <Button
                        size="md"
                        variant="outline"
                        colorScheme="green"
                        onClick={fetchTrips}
                        leftIcon={<Box as={ArrowPathIcon} w={5} h={5} />}
                      >
                        Refresh
                      </Button>
                    </HStack>
                    
                    {totalTrips === 0 && (
                      <Alert status="info" borderRadius="md" bg="blue.50" border="1px solid" borderColor="blue.200">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">No active trips scheduled for today</Text>
                          <Text fontSize="sm" color="gray.600">Create a new trip to get started.</Text>
                        </VStack>
                      </Alert>
                    )}
                  </Box>

                  {/* Trips List - Chronological Order */}
                  {totalTrips > 0 && (
                    <VStack spacing={4} align="stretch">
                      {sortedTrips.map((trip, index) => (
                        <TodayTripCard 
                          key={trip._id} 
                          trip={trip}
                          onView={() => openViewModal(trip)}
                          onEdit={() => openEditModal(trip)}
                          onDelete={() => openDeleteDialog(trip)}
                          formatDate={formatDate}
                          getStatusColor={getStatusColor}
                          tripIndex={index + 1}
                          totalTrips={totalTrips}
                        />
                      ))}
                    </VStack>
                  )}
                </VStack>
              );
            })()}
          </CardBody>
        </Card>
            </>
          </Box>
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
                    <FormControl isRequired isInvalid={!!validationErrors.pickupAddress}>
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
                      {validationErrors.pickupAddress && (
                        <Text fontSize="sm" color="red.500" mt={1}>{validationErrors.pickupAddress}</Text>
                      )}
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired isInvalid={!!validationErrors.dropoffAddress}>
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
                      {validationErrors.dropoffAddress && (
                        <Text fontSize="sm" color="red.500" mt={1}>{validationErrors.dropoffAddress}</Text>
                      )}
                    </FormControl>
                  </GridItem>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} width="100%">
                  <GridItem>
                    <FormControl isRequired isInvalid={!!validationErrors.scheduledDate}>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                      {validationErrors.scheduledDate && (
                        <Text fontSize="sm" color="red.500" mt={1}>{validationErrors.scheduledDate}</Text>
                      )}
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

                <FormControl isInvalid={!!validationErrors.notes}>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions"
                  />
                  {validationErrors.notes && (
                    <Text fontSize="sm" color="red.500" mt={1}>{validationErrors.notes}</Text>
                  )}
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

      {/* Export Options Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Box as={ArrowDownTrayIcon} w={6} h={6} color="green.500" />
              <Text>Export Schedule Options</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              {/* Export Format Display */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">
                    Export Format: {exportFormat.toUpperCase()}
                  </Text>
                  <Text fontSize="sm">
                    {exportFormat === 'csv' && 'Excel-compatible spreadsheet format'}
                    {exportFormat === 'json' && 'Complete data with all trip details'}
                    {exportFormat === 'print' && 'Formatted print-ready document'}
                  </Text>
                </VStack>
              </Alert>

              {/* Scope Selection */}
              <FormControl>
                <FormLabel fontWeight="bold">Select Trips to Export</FormLabel>
                <VStack spacing={3} align="stretch">
                  <Button
                    variant={exportScope === 'today' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('today')}
                    rightIcon={
                      <Badge colorScheme="green">
                        {trips.filter(trip => {
                          const tripDate = new Date(trip.scheduledDate);
                          const today = new Date();
                          tripDate.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          return tripDate.getTime() === today.getTime();
                        }).length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={CalendarDaysIcon} w={4} h={4} />
                      <Text>Today's Trips</Text>
                    </HStack>
                  </Button>

                  <Button
                    variant={exportScope === 'upcoming' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('upcoming')}
                    rightIcon={
                      <Badge colorScheme="blue">
                        {trips.filter(trip => {
                          const tripDate = new Date(trip.scheduledDate);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return tripDate >= tomorrow;
                        }).length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={ClockIcon} w={4} h={4} />
                      <Text>Upcoming Trips</Text>
                    </HStack>
                  </Button>

                  <Button
                    variant={exportScope === 'pending' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('pending')}
                    rightIcon={
                      <Badge colorScheme="yellow">
                        {trips.filter(trip => trip.status === 'pending').length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={ExclamationTriangleIcon} w={4} h={4} />
                      <Text>Pending Trips</Text>
                    </HStack>
                  </Button>

                  <Button
                    variant={exportScope === 'assigned' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('assigned')}
                    rightIcon={
                      <Badge colorScheme="orange">
                        {trips.filter(trip => trip.status === 'assigned').length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={TruckIcon} w={4} h={4} />
                      <Text>Assigned Trips</Text>
                    </HStack>
                  </Button>

                  <Button
                    variant={exportScope === 'completed' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('completed')}
                    rightIcon={
                      <Badge colorScheme="green">
                        {trips.filter(trip => trip.status === 'completed').length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={CheckCircleIcon} w={4} h={4} />
                      <Text>Completed Trips</Text>
                    </HStack>
                  </Button>

                  <Divider />

                  <Button
                    variant={exportScope === 'filtered' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('filtered')}
                    rightIcon={
                      <Badge colorScheme="purple">
                        {filteredTrips.length > 0 ? filteredTrips.length : trips.length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={FunnelIcon} w={4} h={4} />
                      <Text>Current View/Filtered</Text>
                    </HStack>
                  </Button>

                  <Button
                    variant={exportScope === 'all' ? 'solid' : 'outline'}
                    colorScheme="green"
                    justifyContent="space-between"
                    onClick={() => setExportScope('all')}
                    rightIcon={
                      <Badge colorScheme="gray">
                        {trips.length}
                      </Badge>
                    }
                  >
                    <HStack>
                      <Box as={QueueListIcon} w={4} h={4} />
                      <Text>All Trips</Text>
                    </HStack>
                  </Button>
                </VStack>
              </FormControl>

              {/* Preview Info */}
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>{getTripsForExport(exportScope).length} trip(s)</strong> will be exported
                </Text>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<Box as={ArrowDownTrayIcon} w={4} h={4} />}
              onClick={executeExport}
              isDisabled={getTripsForExport(exportScope).length === 0}
            >
              {exportFormat === 'print' ? 'Print' : 'Export'} {getTripsForExport(exportScope).length} Trip(s)
            </Button>
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

// Today's Trip Card Component
const TodayTripCard = ({ trip, onView, onEdit, onDelete, formatDate, getStatusColor }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  const scheduleTime = trip.scheduledTime ? trip.scheduledTime : 'Not set';
  const riderName = trip.riderName || trip.rider?.name || 'Unknown Rider';
  const driverName = trip.assignedDriver?.name || 'Unassigned';
  const pickupAddr = trip.pickupLocation?.address || 'No pickup address';
  const dropoffAddr = trip.dropoffLocation?.address || 'No dropoff address';
  
  const statusColor = getStatusColor(trip.status);
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  return (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      borderWidth={1} 
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ shadow: 'md', borderColor: 'green.400' }}
    >
      <CardBody p={4} spacing={3}>
        {/* Time and Status Header */}
        <HStack justify="space-between" mb={3}>
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="lg" fontWeight="bold" color="green.700">
              {scheduleTime}
            </Text>
            <Text fontSize="xs" color={mutedColor}>
              {formatDate(trip.scheduledDate)}
            </Text>
          </VStack>
          <Badge 
            colorScheme={statusColor}
            variant="solid"
            px={2}
            py={1}
          >
            {trip.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </HStack>

        {/* Rider Info */}
        <HStack spacing={2} mb={2}>
          <Box as={UserIcon} w={4} h={4} color={mutedColor} />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="500">
              {riderName}
            </Text>
          </VStack>
        </HStack>

        {/* Driver Info */}
        <HStack spacing={2} mb={2}>
          <Box as={TruckIcon} w={4} h={4} color={mutedColor} />
          <Text fontSize="sm" color={driverName === 'Unassigned' ? 'red.500' : 'inherit'}>
            {driverName}
          </Text>
        </HStack>

        {/* Pickup Location */}
        <HStack spacing={2} mb={2} align="start">
          <Box as={MapPinIcon} w={4} h={4} color="orange.500" mt={0.5} flexShrink={0} />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="xs" color={mutedColor}>
              Pickup
            </Text>
            <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
              {pickupAddr}
            </Text>
          </VStack>
        </HStack>

        {/* Dropoff Location */}
        <HStack spacing={2} mb={4} align="start">
          <Box as={MapPinIcon} w={4} h={4} color="blue.500" mt={0.5} flexShrink={0} />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="xs" color={mutedColor}>
              Dropoff
            </Text>
            <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
              {dropoffAddr}
            </Text>
          </VStack>
        </HStack>

        {/* Action Buttons */}
        <HStack spacing={2} justify="flex-start" wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={onView}
            leftIcon={<Box as={EyeIcon} w={4} h={4} />}
          >
            {isMobile ? 'View' : 'View Details'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="green"
            onClick={onEdit}
            leftIcon={<Box as={PencilIcon} w={4} h={4} />}
          >
            {isMobile ? 'Edit' : 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            onClick={onDelete}
            leftIcon={<Box as={TrashIcon} w={4} h={4} />}
          >
            {isMobile ? 'Cancel' : 'Cancel'}
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
};

export default SchedulerDashboard;