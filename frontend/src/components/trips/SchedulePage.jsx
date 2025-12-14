import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Text,
  Heading,
  useToast,
  Spinner,
  Center,
  Button,
  Select,
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
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [isProcessMenuOpen, setIsProcessMenuOpen] = useState(false);
  const processMenuTimeoutRef = React.useRef(null);
  
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all'); // all, drivers, trips
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const toast = useToast();

  // Fetch schedule data
  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateObj = new Date(selectedDate);
      const params = {
        date: selectedDate,
        timestamp: dateObj.getTime(),
      };

      if (selectedType === 'drivers' || selectedType === 'all') {
        try {
          const driverScheduleResponse = await axios.get('/api/drivers/schedule', { params });
          if (driverScheduleResponse.data) {
            setScheduleData(driverScheduleResponse.data);
          }
        } catch (err) {
          console.error('Error fetching driver schedule:', err);
        }
      }

      if (selectedType === 'trips' || selectedType === 'all') {
        try {
          const tripScheduleResponse = await axios.get('/api/trips/schedule', { params });
          if (tripScheduleResponse.data) {
            setScheduleData(tripScheduleResponse.data);
          }
        } catch (err) {
          console.error('Error fetching trip schedule:', err);
        }
      }
    } catch (err) {
      console.error('Schedule fetch error:', err);
      toast({
        title: 'Schedule Error',
        description: 'Failed to fetch schedule. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedType, toast]);

  // Fetch schedule when date or type changes
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Handle date navigation
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleProcessMenuNavigation = (path) => {
    setIsProcessMenuOpen(false);
    navigate(path);
  };

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (typeof time === 'string') {
      if (time.includes(':')) return time;
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return 'N/A';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
      case 'on_trip':
        return 'blue';
      case 'scheduled':
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'offline':
        return 'gray';
      case 'online':
        return 'green';
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

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Schedule Header */}
          <Box>
            <Heading size="lg" mb={4}>
              Schedule
            </Heading>
            <Text color="gray.600" mb={6}>
              View driver and trip schedules
            </Text>

            {/* Schedule Controls */}
            <Card bg="white">
              <CardBody>
                <VStack spacing={4}>
                  {/* Date Navigation */}
                  <HStack w="100%" spacing={4} justify="space-between" align="center">
                    <Button
                      leftIcon={<ChevronLeftIcon />}
                      variant="outline"
                      onClick={handlePreviousDay}
                    >
                      Previous
                    </Button>

                    <VStack spacing={2} align="center">
                      <Heading size="md">{formatDateDisplay(selectedDate)}</Heading>
                      <HStack spacing={2}>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px',
                          }}
                        />
                        <Button size="sm" variant="outline" onClick={handleToday}>
                          Today
                        </Button>
                      </HStack>
                    </VStack>

                    <Button
                      rightIcon={<ChevronRightIcon />}
                      variant="outline"
                      onClick={handleNextDay}
                    >
                      Next
                    </Button>
                  </HStack>

                  {/* Filter Options */}
                  <HStack w="100%" spacing={4}>
                    <Text fontWeight="600">Show:</Text>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      w="150px"
                      size="sm"
                    >
                      <option value="all">All</option>
                      <option value="drivers">Drivers Only</option>
                      <option value="trips">Trips Only</option>
                    </Select>
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

          {/* Schedule Content */}
          {!isLoading && (
            <>
              {scheduleData.length > 0 ? (
                <Box>
                  <Card bg="white" overflowX="auto">
                    <CardBody>
                      <Table size="sm">
                        <Thead>
                          <Tr bg="gray.50">
                            <Th>Type</Th>
                            <Th>Name/ID</Th>
                            <Th>Start Time</Th>
                            <Th>End Time</Th>
                            <Th>Details</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {scheduleData.map((item, index) => (
                            <Tr key={index}>
                              <Td>
                                <Badge colorScheme={item.type === 'driver' ? 'purple' : 'blue'}>
                                  {item.type?.toUpperCase() || 'ITEM'}
                                </Badge>
                              </Td>
                              <Td fontWeight="600">
                                {item.name || item.tripId || item.driverName || 'N/A'}
                              </Td>
                              <Td>{formatTime(item.startTime || item.pickupTime)}</Td>
                              <Td>{formatTime(item.endTime || item.dropoffTime)}</Td>
                              <Td fontSize="sm">
                                {item.type === 'driver'
                                  ? item.vehicleNumber || 'No vehicle assigned'
                                  : `${item.pickupLocation || 'N/A'} → ${item.dropoffLocation || 'N/A'}`}
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(item.status)}>
                                  {getStatusDisplay(item.status)}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Box>
              ) : (
                <Center py={12}>
                  <VStack spacing={4}>
                    <Text fontSize="lg" color="gray.600">
                      No schedule items for {formatDateDisplay(selectedDate)}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Try selecting a different date
                    </Text>
                  </VStack>
                </Center>
              )}
            </>
          )}

          {/* Legend */}
          <Card bg="blue.50">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Heading size="sm">Legend</Heading>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <HStack>
                    <Badge colorScheme="green">COMPLETED</Badge>
                    <Text fontSize="sm">Task completed</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="blue">IN PROGRESS</Badge>
                    <Text fontSize="sm">Currently active</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="yellow">PENDING</Badge>
                    <Text fontSize="sm">Scheduled</Text>
                  </HStack>
                  <HStack>
                    <Badge colorScheme="red">CANCELLED</Badge>
                    <Text fontSize="sm">Cancelled</Text>
                  </HStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default SchedulePage;
