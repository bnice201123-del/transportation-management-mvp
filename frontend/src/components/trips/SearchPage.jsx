import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Text,
  Heading,
  useToast,
  Spinner,
  Center,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tooltip,
  Divider,
  Grid,
  Flex
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import { useAuth } from '../../contexts/AuthContext';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, trips, drivers, riders
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const toast = useToast();

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      toast({
        title: 'Empty Search',
        description: 'Please enter a search term.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = {
        trips: [],
        drivers: [],
        riders: [],
      };

      // Search trips
      if (searchType === 'all' || searchType === 'trips') {
        try {
          const tripResponse = await axios.get('/api/trips', {
            params: { searchTerm: searchTerm },
          });
          results.trips = tripResponse.data || [];
        } catch (err) {
          console.error('Error searching trips:', err);
        }
      }

      // Search drivers
      if (searchType === 'all' || searchType === 'drivers') {
        try {
          const driverResponse = await axios.get('/api/drivers', {
            params: { search: searchTerm },
          });
          results.drivers = driverResponse.data || [];
        } catch (err) {
          console.error('Error searching drivers:', err);
          // Fallback to users API
          try {
            const userResponse = await axios.get('/api/users', {
              params: { role: 'driver', search: searchTerm },
            });
            results.drivers = userResponse.data || [];
          } catch (e) {
            console.error('Fallback search failed:', e);
          }
        }
      }

      // Search riders
      if (searchType === 'all' || searchType === 'riders') {
        try {
          const riderResponse = await axios.get('/api/riders', {
            params: { search: searchTerm },
          });
          results.riders = riderResponse.data || [];
        } catch (err) {
          console.error('Error searching riders:', err);
          // Fallback to users API
          try {
            const userResponse = await axios.get('/api/users', {
              params: { role: 'rider', search: searchTerm },
            });
            results.riders = userResponse.data || [];
          } catch (e) {
            console.error('Fallback search failed:', e);
          }
        }
      }

      setResults(results);

      const totalResults = (results.trips?.length || 0) + (results.drivers?.length || 0) + (results.riders?.length || 0);
      if (totalResults === 0) {
        toast({
          title: 'No Results',
          description: `No results found for "${searchTerm}".`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, searchType, toast]);

  // Handle Process menu navigation
  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSearch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusDisplay = (status) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'N/A';
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      
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
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                {/* Column 1: Trip Creation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/create-trip')}>
                      Create Trip
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/manage-trips')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/map')}>
                      View Map
                    </Button>
                  </VStack>
                </Box>

                {/* Column 2: Trip Views */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/upcoming')}>
                      Upcoming
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/completed')}>
                      Completed
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/all-trips')}>
                      All Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/active')}>
                      Active
                    </Button>
                  </VStack>
                </Box>

                {/* Column 3: Navigation */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    {user?.role !== 'dispatcher' && user?.role !== 'scheduler' && (
                      <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/users')}>
                        All Users
                      </Button>
                    )}
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/drivers')}>
                      Drivers
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/tracking')}>
                      Tracking
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/profile')}>
                      Profile
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/scheduler')}>
                      Schedule
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/search')}>
                      Search
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/recurring-trips')}>
                      Recurring Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/analytics')}>
                      📊 Analytics Dashboard
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => {
                      const csvContent = 'Search Results\\n';
                      const link = document.createElement('a');
                      link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
                      link.download = 'search-results.csv';
                      link.click();
                    }}>
                      📥 Export as CSV
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => {
                      const jsonContent = JSON.stringify({ results: [] }, null, 2);
                      const link = document.createElement('a');
                      link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
                      link.download = 'search-results.json';
                      link.click();
                    }}>
                      📥 Export as JSON
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => window.print()}>
                      🖨️ Print Schedule
                    </Button>
                  </VStack>
                </Box>
              </Grid>
            </Box>
          )}
        </Box>
      </Flex>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Search Header */}
          <Box>
            <Heading size="lg" mb={4}>
              Search
            </Heading>
            <Text color="gray.600" mb={6}>
              Search across trips, drivers, and riders
            </Text>

            {/* Search Controls */}
            <Card bg="white">
              <CardBody>
                <VStack spacing={4}>
                  <HStack w="100%" spacing={2}>
                    <Input
                      placeholder="Enter search term (Trip ID, name, email, phone, location...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="md"
                      flex={1}
                    />
                    <Select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      w="150px"
                      size="md"
                    >
                      <option value="all">All Types</option>
                      <option value="trips">Trips Only</option>
                      <option value="drivers">Drivers Only</option>
                      <option value="riders">Riders Only</option>
                    </Select>
                    <Button
                      colorScheme="blue"
                      leftIcon={<SearchIcon />}
                      onClick={handleSearch}
                      isLoading={isLoading}
                    >
                      Search
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Loading State */}
          {isLoading && (
            <Center py={12}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
              />
            </Center>
          )}

          {/* Results */}
          {!isLoading && hasSearched && (
            <>
              {/* Trips Results */}
              {(searchType === 'all' || searchType === 'trips') && results.trips?.length > 0 && (
                <Box>
                  <Heading size="md" mb={4}>
                    Trips ({results.trips.length})
                  </Heading>
                  <Card bg="white" overflowX="auto">
                    <CardBody>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Trip ID</Th>
                            <Th>Rider</Th>
                            <Th>Pickup</Th>
                            <Th>Dropoff</Th>
                            <Th>Date</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {results.trips.map((trip) => (
                            <Tr key={trip._id}>
                              <Td>
                                <Text fontSize="sm" fontWeight="600">
                                  {trip.tripId || trip._id?.substring(0, 8)}
                                </Text>
                              </Td>
                              <Td>{trip.riderName || trip.rider?.name || 'N/A'}</Td>
                              <Td fontSize="sm">{trip.pickupLocation || 'N/A'}</Td>
                              <Td fontSize="sm">{trip.dropoffLocation || 'N/A'}</Td>
                              <Td fontSize="sm">
                                {new Date(trip.tripDate)?.toLocaleDateString() || 'N/A'}
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(trip.status)}>
                                  {getStatusDisplay(trip.status)}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Box>
              )}

              {/* Drivers Results */}
              {(searchType === 'all' || searchType === 'drivers') && results.drivers?.length > 0 && (
                <Box>
                  <Heading size="md" mb={4}>
                    Drivers ({results.drivers.length})
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {results.drivers.map((driver) => (
                      <Card key={driver._id} bg="white">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <Heading size="sm">{driver.name || driver.fullName || 'N/A'}</Heading>
                            <Text fontSize="sm" color="gray.600">
                              Email: {driver.email || 'N/A'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Phone: {driver.phone || 'N/A'}
                            </Text>
                            <Badge
                              colorScheme={
                                driver.status === 'online'
                                  ? 'green'
                                  : driver.status === 'on_trip'
                                  ? 'blue'
                                  : 'gray'
                              }
                            >
                              {driver.status?.toUpperCase() || 'OFFLINE'}
                            </Badge>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {/* Riders Results */}
              {(searchType === 'all' || searchType === 'riders') && results.riders?.length > 0 && (
                <Box>
                  <Heading size="md" mb={4}>
                    Riders ({results.riders.length})
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {results.riders.map((rider) => (
                      <Card key={rider._id} bg="white">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <Heading size="sm">{rider.name || rider.fullName || 'N/A'}</Heading>
                            <Text fontSize="sm" color="gray.600">
                              Email: {rider.email || 'N/A'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Phone: {rider.phone || 'N/A'}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Trips: {rider.tripCount || 0}
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {/* No Results Message */}
              {results.trips?.length === 0 && results.drivers?.length === 0 && results.riders?.length === 0 && (
                <Center py={12}>
                  <VStack spacing={4}>
                    <Text fontSize="lg" color="gray.600">
                      No results found for "{searchTerm}"
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Try adjusting your search term or filters
                    </Text>
                  </VStack>
                </Center>
              )}
            </>
          )}

          {/* Initial State */}
          {!hasSearched && (
            <Center py={12}>
              <VStack spacing={4}>
                <SearchIcon boxSize="48px" color="gray.300" />
                <Text fontSize="lg" color="gray.600">
                  Enter a search term to get started
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default SearchPage;
