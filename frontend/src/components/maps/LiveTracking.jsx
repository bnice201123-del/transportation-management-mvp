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
  useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, ViewIcon, PhoneIcon, EmailIcon, TimeIcon } from '@chakra-ui/icons';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // NYC default
  const [mapZoom, setMapZoom] = useState(12);
  const [markers, setMarkers] = useState([]);
  
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
  const fetchVehicles = useCallback(async () => {
    try {
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
      
      // Create map markers for vehicles
      const vehicleMarkers = vehiclesArray.map(vehicle => ({
        id: vehicle._id,
        position: vehicle.currentLocation || { lat: 40.7128 + Math.random() * 0.1, lng: -74.0060 + Math.random() * 0.1 },
        title: `${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate}`,
        type: 'vehicle',
        status: vehicle.status || 'idle',
        icon: {
          url: `data:image/svg+xml;base64,${btoa(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${getStatusColor(vehicle.status || 'idle')}" stroke="#fff" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🚗</text>
            </svg>
          `)}`,
          scaledSize: { width: 32, height: 32 }
        },
        info: vehicle
      }));
      
      setMarkers(vehicleMarkers);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vehicles data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
      filtered = filtered.filter(vehicle => 
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (vehicle.currentLocation) {
      setMapCenter(vehicle.currentLocation);
      setMapZoom(15);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchVehicles();
    fetchActiveTrips();
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
                  <VStack spacing={3} align="stretch">
                    <Heading size={{ base: "sm", md: "md" }}>Fleet Overview</Heading>
                    
                    {/* Search */}
                    <InputGroup>
                      <InputLeftElement>
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg="gray.50"
                      />
                    </InputGroup>
                    
                    {/* Status Filter */}
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      bg="gray.50"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="idle">Idle</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                    </Select>
                  </VStack>
                </CardHeader>
                
                <CardBody pt={0} overflowY="auto" maxH={{ base: "300px", lg: "500px" }}>
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
                              <Badge 
                                colorScheme={statusColors[vehicle.status || 'idle']}
                                fontSize={{ base: "2xs", md: "xs" }}
                                mt={{ base: 1, md: 0 }}
                              >
                                {(vehicle.status || 'idle').toUpperCase()}
                              </Badge>
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
                  
                  {selectedVehicle && (
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
    </Box>
  );
};

export default LiveTracking;