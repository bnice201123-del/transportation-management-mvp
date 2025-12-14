import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  Input,
  SimpleGrid,
  Text,
  Tooltip,
  Divider,
  Grid,
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const AllTrips = () => {
  const navigate = useNavigate();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Fetch all trips
  const fetchAllTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const allTrips = response.data.data?.trips || [];
      setTrips(allTrips);
      applyFilters(allTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTrips();
  }, [fetchAllTrips]);

  // Apply filters and sorting
  const applyFilters = (tripsToFilter) => {
    let filtered = [...tripsToFilter];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.riderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickupLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.dropoffLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip._id?.includes(searchTerm)
      );
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(trip => trip.status === selectedStatus);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'status') {
      filtered.sort((a, b) => a.status.localeCompare(b.status));
    } else if (sortBy === 'rider') {
      filtered.sort((a, b) => (a.riderName || '').localeCompare(b.riderName || ''));
    }

    setFilteredTrips(filtered);
  };

  useEffect(() => {
    applyFilters(trips);
  }, [searchTerm, selectedStatus, sortBy]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'assigned':
        return 'purple';
      case 'scheduled':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <>
        <Navbar title="All Trips" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Navbar title="All Trips" />
      <Container maxW="7xl" py={8}>
        {/* Process Menu at Top */}
        <Flex justify="center" mb={6}>
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
            
            {/* Process Menu Dropdown */}
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
                minW="600px"
                zIndex={1000}
                pointerEvents="auto"
                onMouseEnter={() => {
                  if (processMenuTimeoutRef.current) {
                    clearTimeout(processMenuTimeoutRef.current);
                  }
                }}
              >
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/trips/manage')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Manage Trips
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/trips/map')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      View Map
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/trips/upcoming')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Upcoming
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/trips/completed')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Completed
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/trips/active')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Active
                    </Button>
                  </VStack>
                  
                  {/* Column 2 - NAVIGATE */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" px={3}>
                      NAVIGATE
                    </Text>
                    <Divider my={1} />
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/riders')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      All Riders
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/users')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      All Users
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/drivers')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Drivers
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/tracking')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Tracking
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/profile')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      w="full"
                      size="sm"
                      onClick={() => handleProcessMenuNavigation('/schedule')}
                      _hover={{ bg: "blue.50", color: "blue.600", fontWeight: "bold" }}
                    >
                      Schedule
                    </Button>
                  </VStack>
                </Grid>
              </Box>
            )}
          </Box>
        </Flex>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              All Trips
            </Heading>
            <Text color="gray.600">
              Combined view of all trips - upcoming, in progress, completed, and cancelled.
            </Text>
          </Box>

          {/* Filters */}
          <Box bg="white" p={6} borderRadius="lg" borderWidth="1px">
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Search
                </Text>
                <Input
                  placeholder="Search by rider, location, or trip ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Status
                </Text>
                <Select
                  placeholder="All statuses"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2} fontSize="sm">
                  Sort By
                </Text>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">Date (Newest)</option>
                  <option value="status">Status</option>
                  <option value="rider">Rider Name</option>
                </Select>
              </Box>
              <Box display="flex" alignItems="flex-end">
                <Text color="gray.600" fontSize="sm">
                  {filteredTrips.length} trips found
                </Text>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Trips Table */}
          {filteredTrips.length > 0 ? (
            <Box overflowX="auto" bg="white" borderRadius="lg" borderWidth="1px">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Trip ID</Th>
                    <Th>Rider</Th>
                    <Th>Pickup Location</Th>
                    <Th>Dropoff Location</Th>
                    <Th>Pickup Time</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTrips.map(trip => (
                    <Tr key={trip._id} _hover={{ bg: 'gray.50' }}>
                      <Td fontSize="sm" fontWeight="bold">
                        #{trip._id?.slice(-6).toUpperCase()}
                      </Td>
                      <Td>{trip.riderName || 'N/A'}</Td>
                      <Td fontSize="sm" maxW="150px" noOfLines={2}>
                        {trip.pickupLocation?.address || 'N/A'}
                      </Td>
                      <Td fontSize="sm" maxW="150px" noOfLines={2}>
                        {trip.dropoffLocation?.address || 'N/A'}
                      </Td>
                      <Td fontSize="sm">
                        {new Date(trip.pickupDateTime || trip.scheduledPickupTime).toLocaleDateString()}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => navigate(`/trips/${trip._id}`)}
                          >
                            View
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Center h="30vh">
              <Text color="gray.500">No trips found</Text>
            </Center>
          )}
        </VStack>
      </Container>
    </>
  );
};

export default AllTrips;
