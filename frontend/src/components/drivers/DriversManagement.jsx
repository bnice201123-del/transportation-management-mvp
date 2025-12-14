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
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Input,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Divider,
  Grid,
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import { PhoneIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DriversManagement = () => {
  const navigate = useNavigate();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState([]);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch drivers from the backend
      try {
        const response = await axios.get('/api/drivers');
        setDrivers(response.data.data?.drivers || []);
      } catch {
        // Fallback: fetch users with driver role
        const response = await axios.get('/api/users?role=driver');
        setDrivers(response.data.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Apply search filter
  useEffect(() => {
    const filtered = drivers.filter(driver =>
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm)
    );
    setFilteredDrivers(filtered);
  }, [searchTerm, drivers]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'green';
      case 'offline':
        return 'gray';
      case 'on trip':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const handleViewProfile = (driverId) => {
    navigate(`/drivers/${driverId}`);
  };

  const handleViewSchedule = (driverId) => {
    navigate(`/schedule?driverId=${driverId}`);
  };

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <>
        <Navbar title="Drivers" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Navbar title="Drivers" />
      
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
              minW="600px"
              zIndex={1000}
              pointerEvents="auto"
            >
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {/* TRIPS Section */}
                <Box>
                  <Text fontWeight="bold" mb={3} fontSize="sm" color="gray.700">
                    TRIPS
                  </Text>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/manage-trips')}>
                      Manage Trips
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/map')}>
                      View Map
                    </Button>
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

                {/* NAVIGATE Section */}
                <Box>
                  <Text fontWeight="bold" mb={3} fontSize="sm" color="gray.700">
                    NAVIGATE
                  </Text>
                  <VStack align="start" spacing={2}>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/riders')}>
                      All Riders
                    </Button>
                    <Button variant="ghost" justifyContent="start" w="full" onClick={() => handleProcessMenuNavigation('/users')}>
                      All Users
                    </Button>
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
                  </VStack>
                </Box>
              </Grid>
            </Box>
          )}
        </Box>
      </Flex>

      <Container maxW="7xl" py={8}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Driver Management
            </Heading>
            <Text color="gray.600">
              View all drivers, their status, and manage assignments and schedules.
            </Text>
          </Box>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Total Drivers
                  </Text>
                  <Heading size="lg">{drivers.length}</Heading>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Online
                  </Text>
                  <Heading size="lg">
                    {drivers.filter(d => d.status?.toLowerCase() === 'online').length}
                  </Heading>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    On Trip
                  </Text>
                  <Heading size="lg">
                    {drivers.filter(d => d.status?.toLowerCase() === 'on trip').length}
                  </Heading>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Offline
                  </Text>
                  <Heading size="lg">
                    {drivers.filter(d => d.status?.toLowerCase() === 'offline').length}
                  </Heading>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search */}
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px">
            <Input
              placeholder="Search by name, email, or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          {/* Drivers Table */}
          {filteredDrivers.length > 0 ? (
            <Box overflowX="auto" bg="white" borderRadius="lg" borderWidth="1px">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Status</Th>
                    <Th>Vehicle</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDrivers.map(driver => (
                    <Tr key={driver._id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="bold">{driver.name || 'N/A'}</Td>
                      <Td fontSize="sm">{driver.email || 'N/A'}</Td>
                      <Td fontSize="sm">
                        {driver.phone && (
                          <HStack>
                            <Icon as={PhoneIcon} w={4} h={4} />
                            <Text>{driver.phone}</Text>
                          </HStack>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {driver.status || 'Unknown'}
                        </Badge>
                      </Td>
                      <Td fontSize="sm">
                        {driver.assignedVehicle || 'Not Assigned'}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleViewProfile(driver._id)}
                          >
                            Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewSchedule(driver._id)}
                          >
                            Schedule
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
              <Text color="gray.500">No drivers found</Text>
            </Center>
          )}
        </VStack>
      </Container>
    </>
  );
};

export default DriversManagement;
