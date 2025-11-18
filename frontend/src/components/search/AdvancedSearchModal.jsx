import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  ButtonGroup,
  Grid,
  GridItem,
  Text,
  Badge,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Box,
  Divider,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  useToast
} from '@chakra-ui/react';
import {
  SearchIcon,
  ViewIcon,
  CalendarIcon,
  InfoIcon,
  RepeatIcon,
  CloseIcon,
  ViewOffIcon,
  DownloadIcon
} from '@chakra-ui/icons';
import { FaCar, FaUser, FaRoute } from 'react-icons/fa';
import axios from 'axios';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const AdvancedSearchModal = ({ isOpen, onClose }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    dateFrom: '',
    dateTo: '',
    riderName: '',
    driverName: '',
    tripId: '',
    vehicleType: '',
    vehicleId: '',
    userId: '',
    status: '',
    pickupLocation: '',
    dropoffLocation: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [riders, setRiders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [savedSearches, setSavedSearches] = useState([
    {
      id: 'today',
      name: 'Today\'s Trips',
      criteria: {
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      }
    },
    {
      id: 'week',
      name: 'This Week',
      criteria: {
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      }
    },
    {
      id: 'completed',
      name: 'Completed Trips',
      criteria: {
        status: 'completed'
      }
    }
  ]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    try {
      const [ridersRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get('/api/riders'),
        axios.get('/api/vehicles'),
        axios.get('/api/users?role=driver')
      ]);

      setRiders(ridersRes.data || []);
      setVehicles(vehiclesRes.data?.vehicles || vehiclesRes.data?.data?.vehicles || vehiclesRes.data || []);
      setDrivers(driversRes.data?.users || driversRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load search options',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`/trips/search?${queryParams.toString()}`);
      setSearchResults(response.data || []);
      setActiveTab(1); // Switch to results tab
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: error.response?.data?.message || 'Failed to perform search',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchCriteria({
      dateFrom: '',
      dateTo: '',
      riderName: '',
      driverName: '',
      tripId: '',
      vehicleType: '',
      vehicleId: '',
      userId: '',
      status: '',
      pickupLocation: '',
      dropoffLocation: ''
    });
    setSearchResults([]);
    setHasSearched(false);
    setSelectedTrip(null);
    setActiveTab(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in-progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
  };

  const handleExportResults = () => {
    if (!searchResults || searchResults.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'Please perform a search first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Create CSV content
    const headers = [
      'Trip ID',
      'Rider Name',
      'Rider Phone',
      'Driver Name',
      'Driver ID',
      'Scheduled Date',
      'Pickup Location',
      'Dropoff Location',
      'Status',
      'Vehicle Make',
      'Vehicle Model',
      'License Plate',
      'Created Date'
    ];

    const csvContent = [
      headers.join(','),
      ...searchResults.map(trip => [
        trip._id,
        `"${trip.riderName || ''}"`,
        `"${trip.riderPhone || ''}"`,
        `"${trip.assignedDriver?.name || 'Unassigned'}"`,
        trip.assignedDriver?._id || '',
        trip.scheduledDateTime ? new Date(trip.scheduledDateTime).toISOString() : '',
        `"${trip.pickupLocation?.address || ''}"`,
        `"${trip.dropoffLocation?.address || ''}"`,
        trip.status,
        `"${trip.assignedVehicle?.make || ''}"`,
        `"${trip.assignedVehicle?.model || ''}"`,
        `"${trip.assignedVehicle?.licensePlate || ''}"`,
        trip.createdAt ? new Date(trip.createdAt).toISOString() : ''
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trip_search_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${searchResults.length} trips to CSV`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLoadSavedSearch = (savedSearch) => {
    setSearchCriteria({
      ...searchCriteria,
      ...savedSearch.criteria
    });
    toast({
      title: 'Search Loaded',
      description: `Loaded "${savedSearch.name}" search criteria`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: "full", md: "4xl", lg: "6xl" }}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent 
        maxH={{ base: "100vh", md: "90vh" }}
        m={{ base: 0, md: 4 }}
        borderRadius={{ base: 0, md: "lg" }}
      >
        <ModalHeader pb={{ base: 2, md: 4 }}>
          <HStack spacing={{ base: 2, md: 3 }}>
            <SearchIcon boxSize={{ base: 4, md: 5 }} />
            <Text fontSize={{ base: "lg", md: "xl" }}>Advanced Trip & Ride Search</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton size={{ base: "md", md: "lg" }} />
        
        <ModalBody p={{ base: 4, md: 6 }}>
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList 
              overflowX="auto" 
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none'
              }}
            >
              <Tab minW={{ base: "120px", md: "auto" }} fontSize={{ base: "sm", md: "md" }}>
                <HStack spacing={{ base: 1, md: 2 }}>
                  <SearchIcon boxSize={{ base: 3, md: 4 }} />
                  <Text display={{ base: "none", sm: "block" }}>Search Filters</Text>
                  <Text display={{ base: "block", sm: "none" }}>Filters</Text>
                </HStack>
              </Tab>
              <Tab minW={{ base: "120px", md: "auto" }} fontSize={{ base: "sm", md: "md" }}>
                <HStack spacing={{ base: 1, md: 2 }}>
                  <ViewIcon boxSize={{ base: 3, md: 4 }} />
                  <Text display={{ base: "none", sm: "block" }}>Search Results ({searchResults.length})</Text>
                  <Text display={{ base: "block", sm: "none" }}>Results ({searchResults.length})</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Search Criteria Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Quick Searches */}
                  <Card bg="gray.50">
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="purple.600">
                        ⚡ Quick Searches
                      </Text>
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        Load pre-configured search criteria
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={3}>
                        {savedSearches.map((savedSearch) => (
                          <Button
                            key={savedSearch.id}
                            size="sm"
                            variant="outline"
                            colorScheme="purple"
                            onClick={() => handleLoadSavedSearch(savedSearch)}
                            leftIcon={<SearchIcon />}
                          >
                            {savedSearch.name}
                          </Button>
                        ))}
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Date Range */}
                  <Card>
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="blue.600">
                        📅 Date Range
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">From Date</FormLabel>
                          <Input
                            type="date"
                            value={searchCriteria.dateFrom}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              dateFrom: e.target.value
                            })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">To Date</FormLabel>
                          <Input
                            type="date"
                            value={searchCriteria.dateTo}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              dateTo: e.target.value
                            })}
                          />
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Trip Details */}
                  <Card>
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="green.600">
                        🚗 Trip Details
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Trip ID</FormLabel>
                          <Input
                            placeholder="Enter Trip ID"
                            value={searchCriteria.tripId}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              tripId: e.target.value
                            })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">Status</FormLabel>
                          <Select
                            placeholder="Select Status"
                            value={searchCriteria.status}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              status: e.target.value
                            })}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </Select>
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* People */}
                  <Card>
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="purple.600">
                        👥 People
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Rider Name</FormLabel>
                          <Input
                            placeholder="Enter rider name"
                            value={searchCriteria.riderName}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              riderName: e.target.value
                            })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">Driver</FormLabel>
                          <Select
                            placeholder="Select Driver"
                            value={searchCriteria.driverName}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              driverName: e.target.value
                            })}
                          >
                            {Array.isArray(drivers) && drivers.map(driver => (
                              <option key={driver._id} value={driver.name}>
                                {driver.name} (ID: {driver._id.slice(-6)})
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">User ID</FormLabel>
                          <Input
                            placeholder="Enter User ID"
                            value={searchCriteria.userId}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              userId: e.target.value
                            })}
                          />
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Vehicle Details */}
                  <Card>
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="orange.600">
                        🚙 Vehicle Details
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Vehicle Type</FormLabel>
                          <Select
                            placeholder="Select Vehicle Type"
                            value={searchCriteria.vehicleType}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              vehicleType: e.target.value
                            })}
                          >
                            <option value="sedan">Sedan</option>
                            <option value="suv">SUV</option>
                            <option value="van">Van</option>
                            <option value="wheelchair-accessible">Wheelchair Accessible</option>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">Vehicle ID</FormLabel>
                          <Select
                            placeholder="Select Vehicle"
                            value={searchCriteria.vehicleId}
                            onChange={(e) => setSearchCriteria({
                              ...searchCriteria,
                              vehicleId: e.target.value
                            })}
                          >
                            {Array.isArray(vehicles) && vehicles.map(vehicle => (
                              <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Locations */}
                  <Card>
                    <CardBody>
                      <Text fontWeight="bold" mb={3} color="teal.600">
                        📍 Locations
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Pickup Location</FormLabel>
                          <PlacesAutocomplete
                            placeholder="Enter pickup location"
                            value={searchCriteria.pickupLocation}
                            onChange={(address) => setSearchCriteria({
                              ...searchCriteria,
                              pickupLocation: address
                            })}
                            onPlaceSelected={(place) => setSearchCriteria({
                              ...searchCriteria,
                              pickupLocation: place.address
                            })}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">Dropoff Location</FormLabel>
                          <PlacesAutocomplete
                            placeholder="Enter dropoff location"
                            value={searchCriteria.dropoffLocation}
                            onChange={(address) => setSearchCriteria({
                              ...searchCriteria,
                              dropoffLocation: address
                            })}
                            onPlaceSelected={(place) => setSearchCriteria({
                              ...searchCriteria,
                              dropoffLocation: place.address
                            })}
                          />
                        </FormControl>
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Action Buttons */}
                  <HStack justify="center" spacing={4}>
                    <Button
                      leftIcon={<SearchIcon />}
                      colorScheme="blue"
                      onClick={handleSearch}
                      isLoading={isLoading}
                      loadingText="Searching..."
                      size="lg"
                    >
                      Search Trips
                    </Button>
                    <Button
                      leftIcon={<CloseIcon />}
                      variant="outline"
                      onClick={handleClearSearch}
                      size="lg"
                    >
                      Clear All
                    </Button>
                  </HStack>
                </VStack>
              </TabPanel>

              {/* Results Tab */}
              <TabPanel>
                {!hasSearched ? (
                  <Box textAlign="center" py={8}>
                    <SearchIcon boxSize={12} color="gray.400" mb={4} />
                    <Text color="gray.500" fontSize="lg">
                      Use the search filters to find trips and ride history
                    </Text>
                  </Box>
                ) : isLoading ? (
                  <Box textAlign="center" py={8}>
                    <Spinner size="xl" mb={4} />
                    <Text>Searching...</Text>
                  </Box>
                ) : searchResults.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    No trips found matching your search criteria. Try adjusting your filters.
                  </Alert>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {/* Results Summary */}
                    <Box bg="blue.50" p={4} borderRadius="md">
                      <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={3}>
                        <Text fontWeight="bold" color="blue.700">
                          Found {searchResults.length} trip(s) matching your criteria
                        </Text>
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="blue.600">View:</Text>
                          <ButtonGroup size="sm" isAttached variant="outline">
                            <IconButton
                              icon={<ViewIcon />}
                              aria-label="Table view"
                              colorScheme={viewMode === 'table' ? 'blue' : 'gray'}
                              onClick={() => setViewMode('table')}
                              title="Table View"
                            />
                            <IconButton
                              icon={<ViewOffIcon />}
                              aria-label="Card view"
                              colorScheme={viewMode === 'card' ? 'blue' : 'gray'}
                              onClick={() => setViewMode('card')}
                              title="Card View"
                            />
                          </ButtonGroup>
                          <Button
                            leftIcon={<DownloadIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            onClick={handleExportResults}
                            isDisabled={!searchResults || searchResults.length === 0}
                            title="Export to CSV"
                          >
                            Export
                          </Button>
                        </HStack>
                      </Flex>
                    </Box>

                    {/* Results Display - Table or Card View */}
                    {viewMode === 'table' ? (
                      <TableContainer 
                        overflowX="auto" 
                        bg="white" 
                        borderRadius="md" 
                        shadow="sm"
                      >
                        <Table 
                          variant="simple" 
                          size={{ base: "sm", md: "md" }}
                          fontSize={{ base: "xs", md: "sm" }}
                        >
                          <Thead>
                            <Tr>
                              <Th>Trip ID</Th>
                              <Th>Rider</Th>
                              <Th>Driver</Th>
                              <Th>Date/Time</Th>
                              <Th>Pickup</Th>
                              <Th>Dropoff</Th>
                              <Th>Status</Th>
                              <Th>Vehicle</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Array.isArray(searchResults) && searchResults.map((trip) => (
                              <Tr key={trip._id}>
                                <Td>
                                  <Text fontFamily="mono" fontSize="xs">
                                    {trip._id.slice(-8)}
                                  </Text>
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">{trip.riderName}</Text>
                                    {trip.riderPhone && (
                                      <Text fontSize="xs" color="gray.600">
                                        {trip.riderPhone}
                                      </Text>
                                    )}
                                  </VStack>
                                </Td>
                                <Td>
                                  <Text>
                                    {trip.assignedDriver?.name || 'Unassigned'}
                                  </Text>
                                  {trip.assignedDriver?._id && (
                                    <Text fontSize="xs" color="gray.600">
                                      ID: {trip.assignedDriver._id.slice(-6)}
                                    </Text>
                                  )}
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {formatDate(trip.scheduledDateTime)}
                                  </Text>
                                </Td>
                                <Td maxW="150px">
                                  <Text fontSize="xs" noOfLines={2}>
                                    {trip.pickupLocation?.address}
                                  </Text>
                                </Td>
                                <Td maxW="150px">
                                  <Text fontSize="xs" noOfLines={2}>
                                    {trip.dropoffLocation?.address}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getStatusColor(trip.status)}>
                                    {trip.status}
                                  </Badge>
                                </Td>
                                <Td>
                                  {trip.assignedVehicle ? (
                                    <VStack align="start" spacing={1}>
                                      <Text fontSize="sm">
                                        {trip.assignedVehicle.make} {trip.assignedVehicle.model}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {trip.assignedVehicle.licensePlate}
                                      </Text>
                                    </VStack>
                                  ) : (
                                    <Text color="gray.500">No vehicle</Text>
                                  )}
                                </Td>
                                <Td>
                                  <Tooltip label="View Details">
                                    <IconButton
                                      icon={<ViewIcon />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewTrip(trip)}
                                    />
                                  </Tooltip>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      /* Card View for Mobile */
                      <VStack spacing={3} align="stretch">
                        {Array.isArray(searchResults) && searchResults.map((trip) => (
                          <Card key={trip._id} shadow="sm" _hover={{ shadow: "md" }}>
                            <CardBody p={4}>
                              <VStack align="stretch" spacing={3}>
                                {/* Header with Trip ID and Status */}
                                <Flex justify="space-between" align="center">
                                  <HStack>
                                    <Text fontFamily="mono" fontSize="sm" fontWeight="bold">
                                      {trip._id.slice(-8)}
                                    </Text>
                                    <Badge colorScheme={getStatusColor(trip.status)} size="sm">
                                      {trip.status}
                                    </Badge>
                                  </HStack>
                                  <Tooltip label="View Details">
                                    <IconButton
                                      icon={<ViewIcon />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewTrip(trip)}
                                    />
                                  </Tooltip>
                                </Flex>

                                {/* Rider and Driver Info */}
                                <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
                                  <Box>
                                    <Text fontSize="xs" color="gray.600" mb={1}>Rider</Text>
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" fontSize="sm">{trip.riderName}</Text>
                                      {trip.riderPhone && (
                                        <Text fontSize="xs" color="gray.600">
                                          {trip.riderPhone}
                                        </Text>
                                      )}
                                    </VStack>
                                  </Box>
                                  <Box>
                                    <Text fontSize="xs" color="gray.600" mb={1}>Driver</Text>
                                    <VStack align="start" spacing={1}>
                                      <Text fontSize="sm">
                                        {trip.assignedDriver?.name || 'Unassigned'}
                                      </Text>
                                      {trip.assignedDriver?._id && (
                                        <Text fontSize="xs" color="gray.600">
                                          ID: {trip.assignedDriver._id.slice(-6)}
                                        </Text>
                                      )}
                                    </VStack>
                                  </Box>
                                </Grid>

                                {/* Date and Time */}
                                <Box>
                                  <Text fontSize="xs" color="gray.600" mb={1}>Date & Time</Text>
                                  <Text fontSize="sm">
                                    {formatDate(trip.scheduledDateTime)}
                                  </Text>
                                </Box>

                                {/* Locations */}
                                <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={3}>
                                  <Box>
                                    <HStack mb={1}>
                                      <Badge colorScheme="blue" size="sm">Pickup</Badge>
                                    </HStack>
                                    <Text fontSize="xs" noOfLines={2}>
                                      {trip.pickupLocation?.address}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <HStack mb={1}>
                                      <Badge colorScheme="orange" size="sm">Dropoff</Badge>
                                    </HStack>
                                    <Text fontSize="xs" noOfLines={2}>
                                      {trip.dropoffLocation?.address}
                                    </Text>
                                  </Box>
                                </Grid>

                                {/* Vehicle Info */}
                                {trip.assignedVehicle && (
                                  <Box>
                                    <Text fontSize="xs" color="gray.600" mb={1}>Vehicle</Text>
                                    <HStack>
                                      <FaCar />
                                      <Text fontSize="sm">
                                        {trip.assignedVehicle.make} {trip.assignedVehicle.model}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {trip.assignedVehicle.licensePlate}
                                      </Text>
                                    </HStack>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    )}

                    {/* Trip Details Modal */}
                    {selectedTrip && (
                      <Modal 
                        isOpen={!!selectedTrip} 
                        onClose={() => setSelectedTrip(null)}
                        size="xl"
                      >
                        <ModalOverlay />
                        <ModalContent>
                          <ModalHeader>
                            Trip Details - {selectedTrip._id.slice(-8)}
                          </ModalHeader>
                          <ModalCloseButton />
                          <ModalBody>
                            <VStack spacing={4} align="stretch">
                              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={{ base: 3, md: 4 }}>
                                <Box>
                                  <Text fontWeight="bold">Rider Information</Text>
                                  <Text>Name: {selectedTrip.riderName}</Text>
                                  <Text>Phone: {selectedTrip.riderPhone || 'N/A'}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    User ID: {selectedTrip.userId || 'N/A'}
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontWeight="bold">Trip Status</Text>
                                  <Badge colorScheme={getStatusColor(selectedTrip.status)}>
                                    {selectedTrip.status}
                                  </Badge>
                                  <Text mt={2}>
                                    Date: {formatDate(selectedTrip.scheduledDateTime)}
                                  </Text>
                                </Box>
                              </Grid>
                              
                              <Divider />
                              
                              <Box>
                                <Text fontWeight="bold" mb={2}>Route Information</Text>
                                <VStack align="start" spacing={2}>
                                  <HStack>
                                    <Badge colorScheme="blue">Pickup</Badge>
                                    <Text>{selectedTrip.pickupLocation?.address}</Text>
                                  </HStack>
                                  <HStack>
                                    <Badge colorScheme="orange">Dropoff</Badge>
                                    <Text>{selectedTrip.dropoffLocation?.address}</Text>
                                  </HStack>
                                </VStack>
                              </Box>
                              
                              {selectedTrip.assignedVehicle && (
                                <>
                                  <Divider />
                                  <Box>
                                    <Text fontWeight="bold">Assigned Vehicle</Text>
                                    <Text>
                                      {selectedTrip.assignedVehicle.make} {selectedTrip.assignedVehicle.model}
                                    </Text>
                                    <Text>License: {selectedTrip.assignedVehicle.licensePlate}</Text>
                                    <Text fontSize="xs" color="gray.600">
                                      Vehicle ID: {selectedTrip.assignedVehicle._id}
                                    </Text>
                                  </Box>
                                </>
                              )}
                              
                              {selectedTrip.assignedDriver && (
                                <>
                                  <Divider />
                                  <Box>
                                    <Text fontWeight="bold">Assigned Driver</Text>
                                    <Text>
                                      {typeof selectedTrip.assignedDriver === 'object' 
                                        ? (selectedTrip.assignedDriver.name || `${selectedTrip.assignedDriver.firstName || ''} ${selectedTrip.assignedDriver.lastName || ''}`.trim() || selectedTrip.assignedDriver.email || 'Unnamed Driver')
                                        : selectedTrip.assignedDriver
                                      }
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      Driver ID: {typeof selectedTrip.assignedDriver === 'object' ? selectedTrip.assignedDriver._id : 'N/A'}
                                    </Text>
                                  </Box>
                                </>
                              )}
                              
                              {selectedTrip.notes && (
                                <>
                                  <Divider />
                                  <Box>
                                    <Text fontWeight="bold">Notes</Text>
                                    <Text>{selectedTrip.notes}</Text>
                                  </Box>
                                </>
                              )}
                            </VStack>
                          </ModalBody>
                          <ModalFooter>
                            <Button onClick={() => setSelectedTrip(null)}>
                              Close
                            </Button>
                          </ModalFooter>
                        </ModalContent>
                      </Modal>
                    )}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close Search
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AdvancedSearchModal;