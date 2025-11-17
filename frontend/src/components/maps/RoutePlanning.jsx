// Route Planning Component - Fixed circular dependency
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
  InputRightElement,
  Select,
  Spinner,
  Center,
  useToast,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tooltip,
  Avatar,
  AvatarGroup,
  Wrap,
  WrapItem,
  useColorModeValue,
  Collapse,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  ViewIcon,
  SearchIcon,
  TimeIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DragHandleIcon,
  InfoIcon,
  WarningIcon,
  CheckIcon,
  RepeatIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaRoute,
  FaMapMarkedAlt,
  FaMapPin,
  FaClock,
  FaRuler,
  FaGasPump,
  FaUsers,
  FaSync,
  FaPlay,
  FaSave,
  FaDownload,
  FaShare,
  FaTrash,
  FaPlus,
  FaMinus,
  FaArrowUp,
  FaArrowDown,
  FaOptinMonster,
  FaTachometerAlt,
  FaUserTie,
  FaClipboardList,
  FaExchangeAlt
} from 'react-icons/fa';
// Note: For enhanced drag-and-drop functionality, you can install: npm install react-beautiful-dnd
import Navbar from '../shared/Navbar';

const RoutePlanning = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // Modal states
  const { isOpen: isNewRouteOpen, onOpen: onNewRouteOpen, onClose: onNewRouteClose } = useDisclosure();
  const { isOpen: isStopModalOpen, onOpen: onStopModalOpen, onClose: onStopModalClose } = useDisclosure();
  const { isOpen: isRouteDetailsOpen, onOpen: onRouteDetailsOpen, onClose: onRouteDetailsClose } = useDisclosure();
  
  // Mobile responsiveness
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen: isStatsCollapsed, onToggle: onStatsToggle } = useDisclosure(true);
  
  // Form states
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    vehicleId: '',
    driverId: '',
    departureTime: '',
    maxStops: 10,
    priority: 'normal'
  });
  
  const [newStop, setNewStop] = useState({
    address: '',
    contactName: '',
    contactPhone: '',
    timeWindow: '',
    serviceTime: 15,
    notes: '',
    priority: 'normal'
  });

  // Colors and styling
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const toast = useToast();

  const fetchInitialData = useCallback(async (isRetry = false) => {
    try {
      setError(null);
      if (!isRetry) setLoading(true);
      
      // Simulate API calls
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
      
      // Mock vehicles data
      const mockVehicles = [
        { _id: '1', make: 'Ford', model: 'Transit', licensePlate: 'ABC-123', capacity: 8, status: 'active' },
        { _id: '2', make: 'Chevrolet', model: 'Express', licensePlate: 'DEF-456', capacity: 12, status: 'active' },
        { _id: '3', make: 'Mercedes', model: 'Sprinter', licensePlate: 'GHI-789', capacity: 15, status: 'active' }
      ];

      // Mock drivers data
      const mockDrivers = [
        { _id: '1', name: 'John Doe', phone: '555-0101', rating: 4.8, available: true },
        { _id: '2', name: 'Jane Smith', phone: '555-0102', rating: 4.9, available: true },
        { _id: '3', name: 'Mike Johnson', phone: '555-0103', rating: 4.7, available: false }
      ];

      // Mock routes data
      const mockRoutes = [
        {
          _id: '1',
          name: 'Downtown Route',
          description: 'Daily downtown pickup route',
          vehicleId: '1',
          driverId: '1',
          status: 'planned',
          totalStops: 5,
          totalDistance: '12.5 miles',
          estimatedTime: '45 minutes',
          createdAt: '2025-11-11T08:00:00Z',
          stops: [
            { id: '1', address: '123 Main St', contactName: 'Alice Johnson', timeWindow: '09:00-09:15', status: 'pending' },
            { id: '2', address: '456 Oak Ave', contactName: 'Bob Wilson', timeWindow: '09:20-09:35', status: 'pending' },
            { id: '3', address: '789 Pine St', contactName: 'Carol Davis', timeWindow: '09:40-09:55', status: 'pending' }
          ]
        },
        {
          _id: '2',
          name: 'Suburbs Route',
          description: 'Suburban area collections',
          vehicleId: '2',
          driverId: '2',
          status: 'active',
          totalStops: 8,
          totalDistance: '18.2 miles',
          estimatedTime: '1 hour 15 minutes',
          createdAt: '2025-11-11T07:30:00Z',
          stops: []
        }
      ];

      setVehicles(mockVehicles);
      setDrivers(mockDrivers);
      setRoutes(mockRoutes);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err);
      
      let errorMessage = 'Failed to load route planning data';
      if (err.message.includes('Network') || !navigator.onLine) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view this data.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast({
        title: 'Error Loading Data',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      fetchInitialData(true); // Pass true to indicate this is a retry
    } else {
      toast({
        title: 'Max Retries Reached',
        description: 'Unable to load data after multiple attempts. Please refresh the page.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Mock data initialization
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Route management functions
  const handleCreateRoute = async () => {
    try {
      const route = {
        _id: Date.now().toString(),
        ...newRoute,
        status: 'planned',
        totalStops: 0,
        totalDistance: '0 miles',
        estimatedTime: '0 minutes',
        createdAt: new Date().toISOString(),
        stops: []
      };

      setRoutes(prev => [...prev, route]);
      setActiveRoute(route);
      setNewRoute({
        name: '',
        description: '',
        vehicleId: '',
        driverId: '',
        departureTime: '',
        maxStops: 10,
        priority: 'normal'
      });
      onNewRouteClose();

      toast({
        title: 'Success',
        description: 'New route created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error creating route:', err);
      toast({
        title: 'Error',
        description: 'Failed to create route',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOptimizeRoute = async (routeId) => {
    setOptimizing(true);
    try {
      // Simulate route optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedRoutes = routes.map(route => {
        if (route._id === routeId) {
          return {
            ...route,
            totalDistance: (parseFloat(route.totalDistance) * 0.85).toFixed(1) + ' miles',
            estimatedTime: Math.floor(parseInt(route.estimatedTime) * 0.9) + ' minutes',
            optimized: true
          };
        }
        return route;
      });

      setRoutes(updatedRoutes);
      toast({
        title: 'Route Optimized',
        description: 'Route has been optimized for efficiency',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Optimization error:', err);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize route',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddStop = () => {
    if (!activeRoute) {
      toast({
        title: 'No Route Selected',
        description: 'Please select or create a route first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const stop = {
      id: Date.now().toString(),
      ...newStop,
      status: 'pending'
    };

    const updatedRoutes = routes.map(route => {
      if (route._id === activeRoute._id) {
        return {
          ...route,
          stops: [...route.stops, stop],
          totalStops: route.stops.length + 1
        };
      }
      return route;
    });

    setRoutes(updatedRoutes);
    setActiveRoute(prev => ({
      ...prev,
      stops: [...prev.stops, stop],
      totalStops: prev.stops.length + 1
    }));

    setNewStop({
      address: '',
      contactName: '',
      contactPhone: '',
      timeWindow: '',
      serviceTime: 15,
      notes: '',
      priority: 'normal'
    });
    onStopModalClose();

    toast({
      title: 'Stop Added',
      description: 'New stop added to route',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteStop = (stopId) => {
    if (!activeRoute) return;

    const updatedRoutes = routes.map(route => {
      if (route._id === activeRoute._id) {
        return {
          ...route,
          stops: route.stops.filter(stop => stop.id !== stopId),
          totalStops: route.stops.length - 1
        };
      }
      return route;
    });

    setRoutes(updatedRoutes);
    setActiveRoute(prev => ({
      ...prev,
      stops: prev.stops.filter(stop => stop.id !== stopId),
      totalStops: prev.stops.length - 1
    }));
  };

  // Export routes to CSV
  const handleExportRoutes = () => {
    try {
      const headers = [
        'Route ID',
        'Route Name',
        'Description',
        'Status',
        'Vehicle',
        'Driver',
        'Total Stops',
        'Total Distance',
        'Estimated Time',
        'Departure Time',
        'Priority',
        'Created Date'
      ];

      const csvData = routes.map(route => [
        route._id || '',
        route.name || '',
        route.description || '',
        route.status || '',
        vehicles.find(v => v._id === route.vehicleId)?.make + ' ' + vehicles.find(v => v._id === route.vehicleId)?.model || '',
        drivers.find(d => d._id === route.driverId)?.name || '',
        route.totalStops || 0,
        route.totalDistance || '',
        route.estimatedTime || '',
        route.departureTime || '',
        route.priority || '',
        route.createdAt ? new Date(route.createdAt).toLocaleString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `routes-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Exported ${routes.length} routes to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export routes data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Export stops for active route
  const handleExportStops = () => {
    if (!activeRoute) {
      toast({
        title: 'No Route Selected',
        description: 'Please select a route to export stops',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const headers = [
        'Stop Number',
        'Address',
        'Contact Name',
        'Contact Phone',
        'Time Window',
        'Service Time (min)',
        'Priority',
        'Notes',
        'Status'
      ];

      const csvData = activeRoute.stops.map((stop, index) => [
        index + 1,
        stop.address || '',
        stop.contactName || '',
        stop.contactPhone || '',
        stop.timeWindow || '',
        stop.serviceTime || '',
        stop.priority || '',
        stop.notes || '',
        stop.status || 'pending'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeRoute.name}-stops-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Exported ${activeRoute.stops.length} stops to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export stops data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'blue';
      case 'active': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'blue';
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error && !loading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Navbar title="Route Planning" />
        <Center h="50vh">
          <VStack spacing={6}>
            <Alert status="error" maxW="md">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">Failed to Load Route Planning Data</Text>
                <Text fontSize="sm">
                  {error.message.includes('Network') || !navigator.onLine
                    ? 'Network connection error. Please check your internet connection.'
                    : error.message.includes('timeout')
                    ? 'Request timed out. Please try again.'
                    : error.response?.status === 401
                    ? 'Authentication error. Please log in again.'
                    : error.response?.status === 403
                    ? 'Access denied. You may not have permission to view this data.'
                    : error.response?.status >= 500
                    ? 'Server error. Please try again later.'
                    : 'An unexpected error occurred while loading the data.'}
                </Text>
                <HStack spacing={3}>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={handleRetry}
                    isDisabled={retryCount >= maxRetries}
                    leftIcon={<RepeatIcon />}
                  >
                    Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                  </Button>
                  {retryCount >= maxRetries && (
                    <Button
                      colorScheme="gray"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  )}
                </HStack>
              </VStack>
            </Alert>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Navbar title="Route Planning" />
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text>Loading route planning...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Navbar title="Route Planning" />
      
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          
          {/* Header Section */}
          <Card bg={cardBg} shadow="sm">
            <CardHeader>
              <Flex align="center" direction={{ base: "column", md: "row" }} gap={{ base: 4, md: 0 }}>
                <HStack spacing={3} flex="1">
                  <FaMapMarkedAlt color="green" size="24px" />
                  <VStack align="start" spacing={0}>
                    <Heading size={{ base: "md", md: "lg" }} color="green.600">Route Planning</Heading>
                    <Text color={textColor} fontSize={{ base: "xs", md: "sm" }}>
                      Plan and optimize multi-stop routes for efficient transportation
                    </Text>
                  </VStack>
                </HStack>
                <Spacer />
                <VStack spacing={2} align={{ base: "stretch", md: "flex-end" }} w={{ base: "full", md: "auto" }}>
                  <HStack spacing={2} justify={{ base: "center", md: "flex-end" }}>
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="green"
                      onClick={onNewRouteOpen}
                      size={{ base: "sm", md: "lg" }}
                      w={{ base: "full", md: "auto" }}
                    >
                      New Route
                    </Button>
                    <Button
                      leftIcon={<FaDownload />}
                      variant="outline"
                      colorScheme="green"
                      onClick={handleExportRoutes}
                      size={{ base: "sm", md: "lg" }}
                      w={{ base: "full", md: "auto" }}
                      isDisabled={routes.length === 0}
                    >
                      Export Routes
                    </Button>
                    <Button
                      leftIcon={<FaSync />}
                      variant="outline"
                      colorScheme="green"
                      onClick={fetchInitialData}
                      isLoading={loading}
                      size={{ base: "sm", md: "lg" }}
                      w={{ base: "full", md: "auto" }}
                    >
                      Refresh
                    </Button>
                  </HStack>
                </VStack>
              </Flex>
            </CardHeader>
          </Card>

          {/* Stats Overview */}
          <Card bg={cardBg} shadow="sm">
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Heading size={{ base: "sm", md: "md" }} color="green.600">Overview</Heading>
                {isMobile && (
                  <IconButton
                    icon={isStatsCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    onClick={onStatsToggle}
                    variant="ghost"
                    size="sm"
                    aria-label="Toggle stats"
                  />
                )}
              </Flex>
            </CardHeader>
            <Collapse in={!isMobile || isStatsCollapsed}>
              <CardBody pt={0}>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 6 }}>
                  <Card variant="outline" bg="gray.50">
                    <CardBody textAlign="center" p={{ base: 3, md: 6 }}>
                      <VStack spacing={2}>
                        <Box fontSize={{ base: "24px", md: "32px" }}>
                          <FaRoute color="green" />
                        </Box>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="green.500">
                          {routes.length}
                        </Text>
                        <Text color={textColor} fontSize={{ base: "xs", md: "sm" }}>Total Routes</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline" bg="gray.50">
                    <CardBody textAlign="center" p={{ base: 3, md: 6 }}>
                      <VStack spacing={2}>
                        <Box fontSize={{ base: "24px", md: "32px" }}>
                          <FaPlay color="blue" />
                        </Box>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="blue.500">
                          {routes.filter(r => r.status === 'active').length}
                        </Text>
                        <Text color={textColor} fontSize={{ base: "xs", md: "sm" }}>Active Routes</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline" bg="gray.50">
                    <CardBody textAlign="center" p={{ base: 3, md: 6 }}>
                      <VStack spacing={2}>
                        <Box fontSize={{ base: "24px", md: "32px" }}>
                          <FaMapPin color="orange" />
                        </Box>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="orange.500">
                          {routes.reduce((sum, route) => sum + route.totalStops, 0)}
                        </Text>
                        <Text color={textColor} fontSize={{ base: "xs", md: "sm" }}>Total Stops</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card variant="outline" bg="gray.50">
                    <CardBody textAlign="center" p={{ base: 3, md: 6 }}>
                      <VStack spacing={2}>
                        <Box fontSize={{ base: "24px", md: "32px" }}>
                          <FaCar color="purple" />
                        </Box>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="purple.500">
                          {vehicles.filter(v => v.status === 'active').length}
                        </Text>
                        <Text color={textColor} fontSize={{ base: "xs", md: "sm" }}>Available Vehicles</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </CardBody>
            </Collapse>
          </Card>

          {/* Main Content */}
          {isMobile ? (
            <Tabs variant="soft-rounded" colorScheme="green">
              <TabList mb={4}>
                <Tab fontSize="sm">Routes</Tab>
                <Tab fontSize="sm" isDisabled={!activeRoute}>
                  {activeRoute ? `${activeRoute.name}` : 'Route Details'}
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  {/* Routes List - Mobile */}
                  <Card bg={cardBg} shadow="sm">
                    <CardHeader pb={3}>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md" color="green.600">Routes</Heading>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.300" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search routes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="sm"
                          />
                        </InputGroup>
                      </VStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {filteredRoutes.length === 0 ? (
                          <Center py={8}>
                            <VStack spacing={4}>
                              <FaRoute color="gray" size="48px" />
                              <Text color={textColor}>No routes found</Text>
                              <Button
                                leftIcon={<AddIcon />}
                                colorScheme="green"
                                onClick={onNewRouteOpen}
                                size="sm"
                              >
                                Create First Route
                              </Button>
                            </VStack>
                          </Center>
                        ) : (
                          filteredRoutes.map((route) => (
                            <Card
                              key={route._id}
                              variant="outline"
                              cursor="pointer"
                              _hover={{ shadow: "md" }}
                              bg={activeRoute?._id === route._id ? "green.50" : "white"}
                              border={activeRoute?._id === route._id ? "2px solid" : "1px solid"}
                              borderColor={activeRoute?._id === route._id ? "green.500" : "gray.200"}
                              onClick={() => setActiveRoute(route)}
                            >
                              <CardBody py={3}>
                                <VStack align="stretch" spacing={2}>
                                  <Flex justify="space-between" align="center">
                                    <VStack align="start" spacing={1} flex="1">
                                      <Heading size="sm">{route.name}</Heading>
                                      <Text fontSize="xs" color={textColor} noOfLines={2}>
                                        {route.description}
                                      </Text>
                                    </VStack>
                                    <Badge colorScheme={getStatusColor(route.status)} fontSize="xs">
                                      {route.status}
                                    </Badge>
                                  </Flex>
                                  
                                  <HStack spacing={3} fontSize="xs" color={textColor} justify="space-between">
                                    <HStack>
                                      <FaMapPin />
                                      <Text>{route.totalStops} stops</Text>
                                    </HStack>
                                    <HStack>
                                      <FaClock />
                                      <Text>{route.estimatedTime}</Text>
                                    </HStack>
                                  </HStack>
                                  
                                  <HStack justify="space-between" pt={1}>
                                    <HStack spacing={1}>
                                      <Avatar size="xs" name={drivers.find(d => d._id === route.driverId)?.name} />
                                      <Text fontSize="xs" noOfLines={1}>
                                        {drivers.find(d => d._id === route.driverId)?.name || 'Unassigned'}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                      <IconButton
                                        icon={<FaOptinMonster />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="green"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOptimizeRoute(route._id);
                                        }}
                                        isLoading={optimizing}
                                        title="Optimize Route"
                                      />
                                      <Menu>
                                        <MenuButton
                                          as={IconButton}
                                          icon={<SettingsIcon />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <MenuList>
                                          <MenuItem icon={<EditIcon />} onClick={(e) => e.stopPropagation()}>
                                            Edit Route
                                          </MenuItem>
                                          <MenuItem icon={<DeleteIcon />} color="red.500" onClick={(e) => e.stopPropagation()}>
                                            Delete Route
                                          </MenuItem>
                                        </MenuList>
                                      </Menu>
                                    </HStack>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
                <TabPanel p={0}>
                  {/* Route Details - Mobile */}
                  <Card bg={cardBg} shadow="sm">
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="md" color="green.600">
                          {activeRoute ? `${activeRoute.name} - Stops` : 'Select a Route'}
                        </Heading>
                        {activeRoute && (
                          <HStack spacing={2}>
                            <Button
                              leftIcon={<FaDownload />}
                              size="sm"
                              variant="outline"
                              colorScheme="green"
                              onClick={handleExportStops}
                              isDisabled={activeRoute.stops.length === 0}
                            >
                              Export
                            </Button>
                            <Button
                              leftIcon={<AddIcon />}
                              size="sm"
                              colorScheme="green"
                              onClick={onStopModalOpen}
                            >
                              Add Stop
                            </Button>
                          </HStack>
                        )}
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {!activeRoute ? (
                        <Center py={12}>
                          <VStack spacing={4}>
                            <FaMapPin color="gray" size="48px" />
                            <Text color={textColor}>Select a route to view and manage stops</Text>
                          </VStack>
                        </Center>
                      ) : (
                        <VStack align="stretch" spacing={4}>
                          
                          {/* Route Info */}
                          <Card variant="outline" bg="gray.50">
                            <CardBody p={3}>
                              <SimpleGrid columns={1} spacing={3}>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="xs" color={textColor} fontWeight="bold">VEHICLE</Text>
                                  <Text fontSize="sm">
                                    {vehicles.find(v => v._id === activeRoute.vehicleId)?.make} {vehicles.find(v => v._id === activeRoute.vehicleId)?.model}
                                  </Text>
                                </VStack>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="xs" color={textColor} fontWeight="bold">DRIVER</Text>
                                  <Text fontSize="sm">
                                    {drivers.find(d => d._id === activeRoute.driverId)?.name || 'Unassigned'}
                                  </Text>
                                </VStack>
                              </SimpleGrid>
                            </CardBody>
                          </Card>

                          {/* Stops List */}
                          {activeRoute.stops.length === 0 ? (
                            <Center py={8}>
                              <VStack spacing={4}>
                                <FaMapPin color="gray" size="32px" />
                                <Text color={textColor}>No stops added yet</Text>
                                <Button
                                  leftIcon={<AddIcon />}
                                  colorScheme="green"
                                  size="sm"
                                  onClick={onStopModalOpen}
                                >
                                  Add First Stop
                                </Button>
                              </VStack>
                            </Center>
                          ) : (
                            <VStack spacing={2} align="stretch">
                              {activeRoute.stops.map((stop, index) => (
                                <Card
                                  key={stop.id}
                                  variant="outline"
                                  bg="white"
                                  shadow="sm"
                                >
                                  <CardBody py={3}>
                                    <HStack spacing={3}>
                                      <Badge colorScheme="blue" fontSize="xs">
                                        {index + 1}
                                      </Badge>
                                      <VStack align="start" spacing={1} flex={1}>
                                        <Text fontSize="sm" fontWeight="bold" noOfLines={2}>
                                          {stop.address}
                                        </Text>
                                        <HStack spacing={2} fontSize="xs" color={textColor} flexWrap="wrap">
                                          <Text>{stop.contactName}</Text>
                                          <Text>{stop.timeWindow}</Text>
                                          <Badge
                                            size="sm"
                                            colorScheme={getPriorityColor(stop.priority)}
                                          >
                                            {stop.priority}
                                          </Badge>
                                        </HStack>
                                      </VStack>
                                      <VStack spacing={1}>
                                        <IconButton
                                          icon={<FaArrowUp />}
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="gray"
                                          onClick={() => {
                                            if (index > 0) {
                                              const stops = [...activeRoute.stops];
                                              [stops[index], stops[index - 1]] = [stops[index - 1], stops[index]];
                                              const updatedRoute = { ...activeRoute, stops };
                                              setActiveRoute(updatedRoute);
                                              const updatedRoutes = routes.map(route => 
                                                route._id === activeRoute._id ? updatedRoute : route
                                              );
                                              setRoutes(updatedRoutes);
                                            }
                                          }}
                                          isDisabled={index === 0}
                                          title="Move Up"
                                        />
                                        <IconButton
                                          icon={<FaArrowDown />}
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="gray"
                                          onClick={() => {
                                            if (index < activeRoute.stops.length - 1) {
                                              const stops = [...activeRoute.stops];
                                              [stops[index], stops[index + 1]] = [stops[index + 1], stops[index]];
                                              const updatedRoute = { ...activeRoute, stops };
                                              setActiveRoute(updatedRoute);
                                              const updatedRoutes = routes.map(route => 
                                                route._id === activeRoute._id ? updatedRoute : route
                                              );
                                              setRoutes(updatedRoutes);
                                            }
                                          }}
                                          isDisabled={index === activeRoute.stops.length - 1}
                                          title="Move Down"
                                        />
                                        <IconButton
                                          icon={<DeleteIcon />}
                                          size="xs"
                                          variant="ghost"
                                          colorScheme="red"
                                          onClick={() => handleDeleteStop(stop.id)}
                                          title="Remove Stop"
                                        />
                                      </VStack>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          )}
                        </VStack>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            /* Desktop Layout */
            <Grid templateColumns="1fr 1fr" gap={6}>
              {/* Routes List */}
              <GridItem>
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md" color="green.600">Routes</Heading>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search routes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </VStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {filteredRoutes.length === 0 ? (
                        <Center py={8}>
                          <VStack spacing={4}>
                            <FaRoute color="gray" size="48px" />
                            <Text color={textColor}>No routes found</Text>
                            <Button
                              leftIcon={<AddIcon />}
                              colorScheme="green"
                              onClick={onNewRouteOpen}
                            >
                              Create First Route
                            </Button>
                          </VStack>
                        </Center>
                      ) : (
                        filteredRoutes.map((route) => (
                          <Card
                            key={route._id}
                            variant="outline"
                            cursor="pointer"
                            _hover={{ shadow: "md" }}
                            bg={activeRoute?._id === route._id ? "green.50" : "white"}
                            border={activeRoute?._id === route._id ? "2px solid" : "1px solid"}
                            borderColor={activeRoute?._id === route._id ? "green.500" : "gray.200"}
                            onClick={() => setActiveRoute(route)}
                          >
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1}>
                                    <Heading size="sm">{route.name}</Heading>
                                    <Text fontSize="xs" color={textColor}>
                                      {route.description}
                                    </Text>
                                  </VStack>
                                  <Badge colorScheme={getStatusColor(route.status)}>
                                    {route.status}
                                  </Badge>
                                </Flex>
                                
                                <HStack spacing={4} fontSize="sm" color={textColor}>
                                  <HStack>
                                    <FaMapPin />
                                    <Text>{route.totalStops} stops</Text>
                                  </HStack>
                                  <HStack>
                                    <FaRuler />
                                    <Text>{route.totalDistance}</Text>
                                  </HStack>
                                  <HStack>
                                    <FaClock />
                                    <Text>{route.estimatedTime}</Text>
                                  </HStack>
                                </HStack>
                                
                                <HStack justify="space-between">
                                  <HStack spacing={2}>
                                    <Avatar size="xs" name={drivers.find(d => d._id === route.driverId)?.name} />
                                    <Text fontSize="xs">
                                      {drivers.find(d => d._id === route.driverId)?.name || 'Unassigned'}
                                    </Text>
                                  </HStack>
                                  <HStack spacing={1}>
                                    <IconButton
                                      icon={<FaOptinMonster />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="green"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOptimizeRoute(route._id);
                                      }}
                                      isLoading={optimizing}
                                      title="Optimize Route"
                                    />
                                    <IconButton
                                      icon={<EditIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="blue"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Edit Route"
                                    />
                                    <IconButton
                                      icon={<DeleteIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Delete Route"
                                    />
                                  </HStack>
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>

              {/* Route Details & Stops */}
              <GridItem>
                <Card bg={cardBg} shadow="sm">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color="green.600">
                        {activeRoute ? `${activeRoute.name} - Stops` : 'Select a Route'}
                      </Heading>
                      {activeRoute && (
                        <HStack spacing={2}>
                          <Button
                            leftIcon={<FaDownload />}
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            onClick={handleExportStops}
                            isDisabled={activeRoute.stops.length === 0}
                          >
                            Export Stops
                          </Button>
                          <Button
                            leftIcon={<AddIcon />}
                            size="sm"
                            colorScheme="green"
                            onClick={onStopModalOpen}
                          >
                            Add Stop
                          </Button>
                        </HStack>
                      )}
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {!activeRoute ? (
                      <Center py={12}>
                        <VStack spacing={4}>
                          <FaMapPin color="gray" size="48px" />
                          <Text color={textColor}>Select a route to view and manage stops</Text>
                        </VStack>
                      </Center>
                    ) : (
                      <VStack align="stretch" spacing={4}>
                        
                        {/* Route Info */}
                        <Card variant="outline" bg="gray.50">
                          <CardBody>
                            <SimpleGrid columns={2} spacing={4}>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="xs" color={textColor} fontWeight="bold">VEHICLE</Text>
                                <Text fontSize="sm">
                                  {vehicles.find(v => v._id === activeRoute.vehicleId)?.make} {vehicles.find(v => v._id === activeRoute.vehicleId)?.model}
                                </Text>
                              </VStack>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="xs" color={textColor} fontWeight="bold">DRIVER</Text>
                                <Text fontSize="sm">
                                  {drivers.find(d => d._id === activeRoute.driverId)?.name || 'Unassigned'}
                                </Text>
                              </VStack>
                            </SimpleGrid>
                          </CardBody>
                        </Card>

                        {/* Stops List */}
                        {activeRoute.stops.length === 0 ? (
                          <Center py={8}>
                            <VStack spacing={4}>
                              <FaMapPin color="gray" size="32px" />
                              <Text color={textColor}>No stops added yet</Text>
                              <Button
                                leftIcon={<AddIcon />}
                                colorScheme="green"
                                size="sm"
                                onClick={onStopModalOpen}
                            >
                              Add First Stop
                            </Button>
                          </VStack>
                        </Center>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {activeRoute.stops.map((stop, index) => (
                            <Card
                              key={stop.id}
                              variant="outline"
                              bg="white"
                              shadow="sm"
                            >
                              <CardBody py={3}>
                                <HStack spacing={3}>
                                  <HStack spacing={2}>
                                    <IconButton
                                      icon={<FaArrowUp />}
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="gray"
                                      onClick={() => {
                                        if (index > 0) {
                                          const stops = [...activeRoute.stops];
                                          [stops[index], stops[index - 1]] = [stops[index - 1], stops[index]];
                                          const updatedRoute = { ...activeRoute, stops };
                                          setActiveRoute(updatedRoute);
                                          const updatedRoutes = routes.map(route => 
                                            route._id === activeRoute._id ? updatedRoute : route
                                          );
                                          setRoutes(updatedRoutes);
                                        }
                                      }}
                                      isDisabled={index === 0}
                                      title="Move Up"
                                    />
                                    <IconButton
                                      icon={<FaArrowDown />}
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="gray"
                                      onClick={() => {
                                        if (index < activeRoute.stops.length - 1) {
                                          const stops = [...activeRoute.stops];
                                          [stops[index], stops[index + 1]] = [stops[index + 1], stops[index]];
                                          const updatedRoute = { ...activeRoute, stops };
                                          setActiveRoute(updatedRoute);
                                          const updatedRoutes = routes.map(route => 
                                            route._id === activeRoute._id ? updatedRoute : route
                                          );
                                          setRoutes(updatedRoutes);
                                        }
                                      }}
                                      isDisabled={index === activeRoute.stops.length - 1}
                                      title="Move Down"
                                    />
                                  </HStack>
                                  <Badge colorScheme="blue" fontSize="xs">
                                    {index + 1}
                                  </Badge>
                                  <VStack align="start" spacing={1} flex={1}>
                                    <Text fontSize="sm" fontWeight="bold">
                                      {stop.address}
                                    </Text>
                                    <HStack spacing={4} fontSize="xs" color={textColor}>
                                      <Text>{stop.contactName}</Text>
                                      <Text>{stop.timeWindow}</Text>
                                      <Badge
                                        size="sm"
                                        colorScheme={getPriorityColor(stop.priority)}
                                      >
                                        {stop.priority}
                                      </Badge>
                                    </HStack>
                                  </VStack>
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDeleteStop(stop.id)}
                                    title="Remove Stop"
                                  />
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          )}
        </VStack>
      </Container>

      {/* New Route Modal */}
      <Modal isOpen={isNewRouteOpen} onClose={onNewRouteClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Route</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Route Name</FormLabel>
                <Input
                  value={newRoute.name}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter route name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newRoute.description}
                  onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Route description"
                  rows={3}
                />
              </FormControl>
              
              <Grid templateColumns="1fr 1fr" gap={4}>
                <FormControl>
                  <FormLabel>Vehicle</FormLabel>
                  <Select
                    value={newRoute.vehicleId}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, vehicleId: e.target.value }))}
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.filter(v => v.status === 'active').map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Driver</FormLabel>
                  <Select
                    value={newRoute.driverId}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, driverId: e.target.value }))}
                  >
                    <option value="">Select Driver</option>
                    {drivers.filter(d => d.available).map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid templateColumns="1fr 1fr" gap={4}>
                <FormControl>
                  <FormLabel>Departure Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={newRoute.departureTime}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, departureTime: e.target.value }))}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={newRoute.priority}
                    onChange={(e) => setNewRoute(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Select>
                </FormControl>
              </Grid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNewRouteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCreateRoute}
              isDisabled={!newRoute.name || !newRoute.vehicleId || !newRoute.driverId}
            >
              Create Route
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Stop Modal */}
      <Modal isOpen={isStopModalOpen} onClose={onStopModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Stop</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  value={newStop.address}
                  onChange={(e) => setNewStop(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter stop address"
                />
              </FormControl>
              
              <Grid templateColumns="1fr 1fr" gap={4}>
                <FormControl>
                  <FormLabel>Contact Name</FormLabel>
                  <Input
                    value={newStop.contactName}
                    onChange={(e) => setNewStop(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Contact person"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Contact Phone</FormLabel>
                  <Input
                    value={newStop.contactPhone}
                    onChange={(e) => setNewStop(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </FormControl>
              </Grid>
              
              <Grid templateColumns="1fr 1fr 1fr" gap={4}>
                <FormControl>
                  <FormLabel>Time Window</FormLabel>
                  <Input
                    value={newStop.timeWindow}
                    onChange={(e) => setNewStop(prev => ({ ...prev, timeWindow: e.target.value }))}
                    placeholder="e.g. 09:00-09:15"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Service Time (min)</FormLabel>
                  <Input
                    type="number"
                    value={newStop.serviceTime}
                    onChange={(e) => setNewStop(prev => ({ ...prev, serviceTime: parseInt(e.target.value) }))}
                    min="1"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={newStop.priority}
                    onChange={(e) => setNewStop(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Select>
                </FormControl>
              </Grid>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={newStop.notes}
                  onChange={(e) => setNewStop(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions or notes"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onStopModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleAddStop}
              isDisabled={!newStop.address || !newStop.contactName}
            >
              Add Stop
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RoutePlanning;