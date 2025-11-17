import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  useToast,
  Spinner,
  Center,
  Flex,
  Spacer,
  IconButton,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Avatar,
  Tag,
  TagLabel,
  SimpleGrid,
  useColorModeValue,
  Collapse,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, ViewIcon, PhoneIcon, EmailIcon, TimeIcon, ChevronDownIcon, ChevronUpIcon, DownloadIcon, CloseIcon } from '@chakra-ui/icons';
import { FaCar, FaRoute, FaMapMarkerAlt, FaBatteryHalf, FaSignal } from 'react-icons/fa';
import GoogleMap from './GoogleMap';
import axios from 'axios';
import '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

const LiveTracking = () => {
  // State Management
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 44.9778, lng: -93.2650 }); // Minneapolis, MN
  const [mapZoom, setMapZoom] = useState(12);
  const [markers, setMarkers] = useState([]);
  
  // Mobile responsiveness state
  const { isOpen: isFiltersOpen, onToggle: onFiltersToggle } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Advanced tracking features
  const [followedVehicle, setFollowedVehicle] = useState(null);
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  
  const { user } = useAuth();
  const toast = useToast();
  const refreshIntervalRef = useRef(null);
  
  // Colors for different vehicle statuses
  const statusColors = {
    active: 'green',
    idle: 'yellow',
    offline: 'red',
    maintenance: 'orange'
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Fetch active driver locations and vehicles data
  const fetchVehicles = useCallback(async (isRetry = false) => {
    try {
      setError(null);
      if (!isRetry) setLoading(true);
      
      // Fetch both vehicles and active driver locations
      const [vehiclesResponse, locationsResponse] = await Promise.all([
        axios.get('/api/vehicles'),
        axios.get('/api/locations/active')
      ]);
      
      console.log('Vehicles API response:', vehiclesResponse.data);
      console.log('Locations API response:', locationsResponse.data);
      
      const vehiclesData = vehiclesResponse.data.vehicles || vehiclesResponse.data.data?.vehicles || [];
      const activeLocations = locationsResponse.data.data?.locations || [];
      
      // Merge vehicle data with real driver locations
      const enhancedVehicles = vehiclesData.map(vehicle => {
        const driverLocation = activeLocations.find(loc => 
          vehicle.driver && (
            loc.name.toLowerCase().includes(vehicle.driver.name.toLowerCase()) ||
            loc.phone === vehicle.driver.phone
          )
        );
        
        if (driverLocation) {
          return {
            ...vehicle,
            currentLocation: driverLocation.location,
            status: 'active',
            lastUpdated: driverLocation.location.lastUpdate,
            isTracking: true
          };
        }
        
        return vehicle;
      });
      
      // Ensure vehiclesData is an array
      const vehiclesArray = Array.isArray(enhancedVehicles) ? enhancedVehicles : [];
      console.log('Enhanced vehicles with real locations:', vehiclesArray);
      setVehicles(vehiclesArray);
      setRetryCount(0); // Reset retry count on success
      
      // Create map markers for vehicles
      const vehicleMarkers = vehiclesArray.map(vehicle => {
        // Validate and ensure position has valid lat/lng
        let position = vehicle.currentLocation;
        if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number' || isNaN(position.lat) || isNaN(position.lng)) {
          // Generate a fallback position if current location is invalid
          position = { 
            lat: 44.9778 + Math.random() * 0.1 - 0.05, 
            lng: -93.2650 + Math.random() * 0.1 - 0.05 
          };
        }
        
        return {
          id: vehicle._id,
          position: position,
          title: `${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate}`,
          type: 'vehicle',
          status: vehicle.status || 'idle',
          icon: (() => {
            try {
              const svgString = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${getStatusColor(vehicle.status || 'idle')}" stroke="#fff" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial">CAR</text>
              </svg>`;
              return {
                url: `data:image/svg+xml;base64,${btoa(svgString)}`,
                scaledSize: { width: 32, height: 32 }
              };
            } catch (error) {
              console.warn('Failed to create SVG marker for vehicle:', vehicle._id, error);
              // Fallback to default marker
              return {
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiM2Mzc0OGQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjE2IiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCI+Q0FSPC90ZXh0Pgo8L3N2Zz4K',
                scaledSize: { width: 32, height: 32 }
              };
            }
          })(),
          info: vehicle
        };
      });
      
      setMarkers(vehicleMarkers);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError(error);
      
      let errorMessage = 'Failed to fetch vehicles data';
      if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view this data.';
      } else if (error.response?.status >= 500) {
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

  // Fetch active trips
  const fetchActiveTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips?status=active,in-progress');
      const tripsData = response.data.data?.trips || [];
      setActiveTrips(tripsData);
    } catch (error) {
      console.error('Error fetching active trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      active: '#48BB78',
      idle: '#ECC94B', 
      offline: '#F56565',
      maintenance: '#ED8936'
    };
    return colors[status] || colors.idle;
  };

  // Filter vehicles based on search and status
  useEffect(() => {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
    let filtered = vehiclesArray;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
        vehicle.driver?.name?.toLowerCase().includes(searchLower) ||
        vehicle.type?.toLowerCase().includes(searchLower) ||
        vehicle.year?.toString().includes(searchLower) ||
        vehicle._id?.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => 
        (vehicle.status || 'idle') === statusFilter
      );
    }
    
    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchVehicles();
        fetchActiveTrips();
      }, refreshInterval * 1000);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchVehicles, fetchActiveTrips]);

  // Initial data fetch
  useEffect(() => {
    fetchVehicles();
    fetchActiveTrips();
  }, [fetchVehicles, fetchActiveTrips]);

  // Follow vehicle functionality
  useEffect(() => {
    if (followedVehicle && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v._id === followedVehicle._id);
      if (vehicle?.currentLocation) {
        setMapCenter(vehicle.currentLocation);
        setMapZoom(16);
      }
    }
  }, [vehicles, followedVehicle]);

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.currentLocation) {
      setMapCenter(vehicle.currentLocation);
      setMapZoom(15);
    }
    if (isMobile) {
      onDetailsOpen();
    }
  };

  // Toggle follow vehicle
  const handleFollowVehicle = (vehicle) => {
    if (followedVehicle?._id === vehicle._id) {
      setFollowedVehicle(null);
      toast({
        title: 'Stopped Following',
        description: `No longer following ${vehicle.make} ${vehicle.model}`,
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } else {
      setFollowedVehicle(vehicle);
      if (vehicle.currentLocation) {
        setMapCenter(vehicle.currentLocation);
        setMapZoom(16);
      }
      toast({
        title: 'Following Vehicle',
        description: `Now following ${vehicle.make} ${vehicle.model} in real-time`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchVehicles();
    fetchActiveTrips();
  };

  // Retry failed requests
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchVehicles(true);
    }
  };

  // Export data to CSV
  const handleExport = () => {
    try {
      const headers = [
        'Vehicle ID',
        'Make',
        'Model',
        'Year',
        'License Plate',
        'Type',
        'Status',
        'Driver Name',
        'Driver Phone',
        'Current Location',
        'Last Update'
      ];

      const csvData = filteredVehicles.map(vehicle => [
        vehicle._id || '',
        vehicle.make || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.licensePlate || '',
        vehicle.type || '',
        vehicle.status || 'idle',
        vehicle.driver?.name || '',
        vehicle.driver?.phone || '',
        vehicle.currentLocation ? 
          `${vehicle.currentLocation.lat.toFixed(6)}, ${vehicle.currentLocation.lng.toFixed(6)}` : '',
        vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : new Date().toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vehicle-tracking-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Exported ${filteredVehicles.length} vehicle records to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export vehicle data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Get statistics
  const getStatistics = () => {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
    const total = vehiclesArray.length;
    const active = vehiclesArray.filter(v => (v.status || 'idle') === 'active').length;
    const idle = vehiclesArray.filter(v => (v.status || 'idle') === 'idle').length;
    const offline = vehiclesArray.filter(v => (v.status || 'idle') === 'offline').length;
    
    return { total, active, idle, offline };
  };

  const stats = getStatistics();

  if (loading && (!Array.isArray(vehicles) || vehicles.length === 0)) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading live tracking data...</Text>
        </VStack>
      </Center>
    );
  }

  if (error && (!Array.isArray(vehicles) || vehicles.length === 0)) {
    return (
      <Center height="100vh">
        <VStack spacing={6} textAlign="center" maxW="md">
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Failed to Load Data</AlertTitle>
              <AlertDescription>
                {error.code === 'NETWORK_ERROR' || !navigator.onLine 
                  ? 'Please check your internet connection and try again.'
                  : 'Unable to load vehicle tracking data. Please try again.'}
              </AlertDescription>
            </Box>
          </Alert>
          
          <HStack spacing={3}>
            <Button 
              colorScheme="blue" 
              onClick={handleRetry}
              isDisabled={retryCount >= 3}
              leftIcon={<RepeatIcon />}
            >
              {retryCount >= 3 ? 'Max Retries Reached' : `Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
            </Button>
            <Button variant="outline" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </HStack>
          
          {retryCount >= 3 && (
            <Text fontSize="sm" color="gray.600">
              If the problem persists, please contact support or try refreshing the page.
            </Text>
          )}
        </VStack>
      </Center>
    );
  }

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Container maxWidth="full" py={6}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <Flex 
            align={{ base: "flex-start", md: "center" }} 
            justify="space-between"
            direction={{ base: "column", md: "row" }}
            gap={{ base: 4, md: 0 }}
          >
            <VStack align="start" spacing={1} flex="1">
              <Heading size={{ base: "md", md: "lg" }} color="blue.600">
                🗺️ Live Vehicle Tracking
              </Heading>
              <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
                Real-time monitoring of vehicles through driver mobile app tracking
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                📱 Location updates when drivers are logged in and have granted location access
              </Text>
            </VStack>
            
            <VStack 
              spacing={3} 
              align={{ base: "stretch", md: "flex-end" }}
              w={{ base: "full", md: "auto" }}
            >
              <FormControl display="flex" alignItems="center" maxW={{ base: "full", md: "200px" }}>
                <FormLabel 
                  htmlFor="auto-refresh" 
                  mb="0" 
                  fontSize={{ base: "xs", md: "sm" }}
                  minW="fit-content"
                  mr={2}
                >
                  Auto Refresh ({refreshInterval}s)
                </FormLabel>
                <Switch 
                  id="auto-refresh"
                  isChecked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                />
              </FormControl>
              
              <Tooltip label="Refresh Now">
                <IconButton
                  icon={<RepeatIcon />}
                  onClick={handleRefresh}
                  colorScheme="blue"
                  variant="outline"
                  isLoading={loading}
                  size={{ base: "sm", md: "md" }}
                  w={{ base: "full", md: "auto" }}
                />
              </Tooltip>
              
              <Tooltip label="Export Data">
                <IconButton
                  icon={<DownloadIcon />}
                  onClick={handleExport}
                  colorScheme="green"
                  variant="outline"
                  size={{ base: "sm", md: "md" }}
                  w={{ base: "full", md: "auto" }}
                  isDisabled={filteredVehicles.length === 0}
                />
              </Tooltip>
            </VStack>
          </Flex>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
            <Card bg={cardBg}>
              <CardBody p={{ base: 3, md: 6 }}>
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }}>Total Vehicles</StatLabel>
                  <StatNumber color="blue.500" fontSize={{ base: "lg", md: "2xl" }}>{stats.total}</StatNumber>
                  <StatHelpText fontSize={{ base: "xs", md: "sm" }}>In Fleet</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody p={{ base: 3, md: 6 }}>
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }}>Active</StatLabel>
                  <StatNumber color="green.500" fontSize={{ base: "lg", md: "2xl" }}>{stats.active}</StatNumber>
                  <StatHelpText fontSize={{ base: "xs", md: "sm" }}>On Trips</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody p={{ base: 3, md: 6 }}>
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }}>Idle</StatLabel>
                  <StatNumber color="yellow.500" fontSize={{ base: "lg", md: "2xl" }}>{stats.idle}</StatNumber>
                  <StatHelpText fontSize={{ base: "xs", md: "sm" }}>Available</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody p={{ base: 3, md: 6 }}>
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }}>Offline</StatLabel>
                  <StatNumber color="red.500" fontSize={{ base: "lg", md: "2xl" }}>{stats.offline}</StatNumber>
                  <StatHelpText fontSize={{ base: "xs", md: "sm" }}>Not Available</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content Grid */}
          <Grid 
            templateColumns={{ base: "1fr", lg: "350px 1fr" }} 
            templateRows={{ base: "auto 1fr", lg: "1fr" }}
            gap={6} 
            minH={{ base: "auto", lg: "600px" }}
          >
            {/* Vehicles Sidebar */}
            <GridItem order={{ base: 2, lg: 1 }}>
              <Card bg={cardBg} height={{ base: "auto", lg: "100%" }}>
                <CardHeader pb={3}>
                  <Flex justify="space-between" align="center">
                    <Heading size={{ base: "sm", md: "md" }}>Fleet Overview</Heading>
                    {isMobile && (
                      <IconButton
                        icon={isFiltersOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        onClick={onFiltersToggle}
                        variant="ghost"
                        size="sm"
                        aria-label="Toggle filters"
                      />
                    )}
                  </Flex>
                  
                  {/* Collapsible Filters */}
                  <Collapse in={!isMobile || isFiltersOpen}>
                    <VStack spacing={3} align="stretch" mt={3}>
                      {/* Search */}
                      <InputGroup>
                        <InputLeftElement>
                          <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search by make, model, license, driver, type, or year..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          bg="gray.50"
                          size={{ base: "sm", md: "md" }}
                        />
                        {searchTerm && (
                          <InputRightElement>
                            <IconButton
                              icon={<CloseIcon />}
                              size="xs"
                              variant="ghost"
                              onClick={() => setSearchTerm('')}
                              aria-label="Clear search"
                            />
                          </InputRightElement>
                        )}
                      </InputGroup>
                      
                      {/* Search Results Counter */}
                      {searchTerm && (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Found {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        </Text>
                      )}
                      
                      {/* Status Filter */}
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        bg="gray.50"
                        size={{ base: "sm", md: "md" }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="idle">Idle</option>
                        <option value="offline">Offline</option>
                        <option value="maintenance">Maintenance</option>
                      </Select>
                    </VStack>
                  </Collapse>
                </CardHeader>                <CardBody pt={0} overflowY="auto" maxH={{ base: "300px", lg: "500px" }}>
                  <VStack spacing={3} align="stretch">
                    {filteredVehicles.length === 0 ? (
                      <Center py={8}>
                        <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>No vehicles found</Text>
                      </Center>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <Box
                          key={vehicle._id}
                          p={{ base: 2, md: 3 }}
                          border="1px"
                          borderColor={selectedVehicle?._id === vehicle._id ? "blue.300" : "gray.200"}
                          borderRadius="md"
                          cursor="pointer"
                          bg={selectedVehicle?._id === vehicle._id ? "blue.50" : "white"}
                          _hover={{ borderColor: "blue.300", bg: "blue.50" }}
                          onClick={() => handleVehicleSelect(vehicle)}
                          transition="all 0.2s"
                        >
                          <VStack spacing={2} align="start">
                            <HStack justify="space-between" w="full" flexWrap={{ base: "wrap", md: "nowrap" }}>
                              <HStack minW="0" flex="1">
                                <FaCar color={getStatusColor(vehicle.status || 'idle')} />
                                <Text 
                                  fontWeight="semibold" 
                                  fontSize={{ base: "xs", md: "sm" }}
                                  noOfLines={1}
                                >
                                  {vehicle.make} {vehicle.model}
                                </Text>
                              </HStack>
                              <HStack spacing={1}>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="xs"
                                  variant={followedVehicle?._id === vehicle._id ? "solid" : "ghost"}
                                  colorScheme={followedVehicle?._id === vehicle._id ? "red" : "gray"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFollowVehicle(vehicle);
                                  }}
                                  aria-label={followedVehicle?._id === vehicle._id ? "Stop following" : "Follow vehicle"}
                                  title={followedVehicle?._id === vehicle._id ? "Stop following this vehicle" : "Follow this vehicle in real-time"}
                                />
                                <Badge 
                                  colorScheme={statusColors[vehicle.status || 'idle']}
                                  fontSize={{ base: "2xs", md: "xs" }}
                                >
                                  {(vehicle.status || 'idle').toUpperCase()}
                                </Badge>
                              </HStack>
                            </HStack>
                            
                            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.600">
                              📋 {vehicle.licensePlate}
                            </Text>
                            
                            {vehicle.driver && (
                              <HStack spacing={2}>
                                <Avatar size="xs" name={vehicle.driver.name} />
                                <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.700" noOfLines={1}>
                                  {vehicle.driver.name}
                                </Text>
                              </HStack>
                            )}
                            
                            {vehicle.currentTrip && (
                              <Tag size={{ base: "xs", md: "sm" }} colorScheme="blue">
                                <TagLabel fontSize={{ base: "2xs", md: "xs" }}>
                                  On Trip: {vehicle.currentTrip.tripId}
                                </TagLabel>
                              </Tag>
                            )}
                          </VStack>
                        </Box>
                      ))
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>

            {/* Map Section */}
            <GridItem order={{ base: 1, lg: 2 }}>
              <Card bg={cardBg} height={{ base: "400px", lg: "100%" }}>
                <CardHeader pb={3}>
                  <Flex 
                    justify="space-between" 
                    align={{ base: "flex-start", md: "center" }}
                    direction={{ base: "column", md: "row" }}
                    gap={2}
                  >
                    <Heading size={{ base: "sm", md: "md" }}>Live Map View</Heading>
                    {(selectedVehicle || followedVehicle) && (
                      <VStack align="start" spacing={1}>
                        {selectedVehicle && (
                          <HStack flexWrap="wrap" spacing={2}>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={1}>
                              Tracking: {selectedVehicle.make} {selectedVehicle.model}
                            </Text>
                            <Button
                              size={{ base: "xs", md: "sm" }}
                              variant="ghost"
                              onClick={() => setSelectedVehicle(null)}
                            >
                              Clear
                            </Button>
                          </HStack>
                        )}
                        {followedVehicle && (
                          <HStack flexWrap="wrap" spacing={2}>
                            <Badge colorScheme="red" fontSize="xs">
                              👁️ Following: {followedVehicle.make} {followedVehicle.model}
                            </Badge>
                            <Button
                              size={{ base: "xs", md: "sm" }}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => setFollowedVehicle(null)}
                            >
                              Stop Following
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    )}
                  </Flex>
                </CardHeader>
                
                <CardBody pt={0}>
                  <Box height={{ base: "300px", md: "400px", lg: "500px" }} borderRadius="md" overflow="hidden">
                    <GoogleMap
                      center={mapCenter}
                      zoom={mapZoom}
                      markers={markers}
                      onMarkerClick={(marker) => {
                        if (marker.type === 'vehicle') {
                          handleVehicleSelect(marker.info);
                        }
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Box>
                  
                  {!isMobile && selectedVehicle && (
                    <Box mt={4} p={{ base: 3, md: 4 }} bg="gray.50" borderRadius="md">
                      <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(200px, 1fr))" }} gap={4}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="gray.700">
                            Vehicle Details
                          </Text>
                          <Text fontSize={{ base: "xs", md: "sm" }}>
                            {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                          </Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                            License: {selectedVehicle.licensePlate}
                          </Text>
                        </VStack>
                        
                        <VStack align="start" spacing={1}>
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="gray.700">
                            Status
                          </Text>
                          <VStack align="start" spacing={1}>
                            <Badge colorScheme={statusColors[selectedVehicle.status || 'idle']} fontSize="xs">
                              {(selectedVehicle.status || 'idle').toUpperCase()}
                            </Badge>
                            <Text fontSize="2xs" color="gray.600">
                              Last Update: {new Date().toLocaleTimeString()}
                            </Text>
                          </VStack>
                        </VStack>
                        
                        {selectedVehicle.driver && (
                          <VStack align="start" spacing={1}>
                            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color="gray.700">
                              Driver
                            </Text>
                            <HStack>
                              <Avatar size="xs" name={selectedVehicle.driver.name} />
                              <Text fontSize={{ base: "xs", md: "sm" }} noOfLines={1}>{selectedVehicle.driver.name}</Text>
                            </HStack>
                            {selectedVehicle.driver.phone && (
                              <HStack spacing={1}>
                                <PhoneIcon color="gray.500" w={3} h={3} />
                                <Text fontSize="2xs" color="gray.600">
                                  {selectedVehicle.driver.phone}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        )}
                      </Grid>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      </Container>

      {/* Mobile Vehicle Details Drawer */}
      <Drawer isOpen={isDetailsOpen} placement="bottom" onClose={onDetailsClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack>
              <FaCar color={getStatusColor(selectedVehicle?.status || 'idle')} />
              <Text>
                {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})
              </Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            {selectedVehicle && (
              <VStack spacing={4} align="stretch">
                <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Vehicle Details
                    </Text>
                    <Text fontSize="sm">
                      License: {selectedVehicle.licensePlate}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Year: {selectedVehicle.year}
                    </Text>
                  </VStack>
                  
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Status
                    </Text>
                    <Badge colorScheme={statusColors[selectedVehicle.status || 'idle']} fontSize="xs">
                      {(selectedVehicle.status || 'idle').toUpperCase()}
                    </Badge>
                    <Text fontSize="xs" color="gray.600">
                      Last Update: {new Date().toLocaleTimeString()}
                    </Text>
                  </VStack>
                  
                  {selectedVehicle.driver && (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        Driver
                      </Text>
                      <HStack>
                        <Avatar size="sm" name={selectedVehicle.driver.name} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm">{selectedVehicle.driver.name}</Text>
                          {selectedVehicle.driver.phone && (
                            <HStack spacing={1}>
                              <PhoneIcon color="gray.500" w={3} h={3} />
                              <Text fontSize="xs" color="gray.600">
                                {selectedVehicle.driver.phone}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </HStack>
                    </VStack>
                  )}
                </Grid>
                
                {selectedVehicle.currentLocation && (
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <HStack spacing={2}>
                      <FaMapMarkerAlt color="blue.500" />
                      <Text fontSize="sm" fontWeight="semibold">Current Location</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Lat: {selectedVehicle.currentLocation.lat.toFixed(6)}, 
                      Lng: {selectedVehicle.currentLocation.lng.toFixed(6)}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default LiveTracking;