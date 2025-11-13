import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Grid,
  GridItem,
  useColorModeValue,
  Flex,
  Spacer,
  Tooltip,
  IconButton,
  SimpleGrid,
  Center,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  CalendarDaysIcon as CalendarDaysIconSolid,
  ClockIcon as ClockIconSolid,
  MapPinIcon as MapPinIconSolid,
  UserIcon as UserIconSolid,
  TruckIcon as TruckIconSolid
} from '@heroicons/react/24/solid';
import axios from '../../config/axios';

const CalendarOverview = ({ onTripUpdate }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // day, week, month, year
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headerBg = useColorModeValue('green.50', 'green.900');
  const mutedBgColor = useColorModeValue('gray.50', 'gray.900');

  // Fetch trips data
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trips');
      const tripsData = response.data?.trips || [];
      setTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips:', error);
      // Mock data for development
      const mockTrips = [
        {
          _id: '1',
          riderName: 'John Smith',
          riderPhone: '(555) 123-4567',
          riderEmail: 'john.smith@email.com',
          pickupLocation: { address: '123 Main St, Downtown' },
          dropoffLocation: { address: '456 Oak Ave, Uptown' },
          scheduledDate: '2025-11-05',
          scheduledTime: '09:00',
          status: 'scheduled',
          assignedDriver: { firstName: 'Mike', lastName: 'Johnson' }
        },
        {
          _id: '2',
          riderName: 'Sarah Wilson',
          riderPhone: '(555) 987-6543',
          riderEmail: 'sarah.w@email.com',
          pickupLocation: { address: '789 Pine St, Westside' },
          dropoffLocation: { address: '321 Elm Dr, Eastside' },
          scheduledDate: '2025-11-06',
          scheduledTime: '14:30',
          status: 'scheduled',
          assignedDriver: { firstName: 'Anna', lastName: 'Davis' }
        },
        {
          _id: '3',
          riderName: 'Robert Brown',
          riderPhone: '(555) 456-7890',
          riderEmail: 'r.brown@email.com',
          pickupLocation: { address: '555 Center Ave, Midtown' },
          dropoffLocation: { address: '888 North Blvd, Uptown' },
          scheduledDate: '2025-11-07',
          scheduledTime: '11:15',
          status: 'in-progress',
          assignedDriver: { firstName: 'Tom', lastName: 'Wilson' }
        }
      ];
      setTrips(mockTrips);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Filter trips based on current view and date
  const filteredTrips = useMemo(() => {
    const startDate = new Date(currentDate);
    let endDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        endDate = new Date(startDate);
        break;
      case 'week':
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
        break;
      default:
        break;
    }

    return trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      return tripDate >= startDate && tripDate <= endDate;
    });
  }, [trips, currentDate, viewMode]);

  // Navigation functions
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + direction);
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Format date for display
  const formatDateRange = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'year':
        return currentDate.getFullYear().toString();
      default:
        return '';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in-progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Handle trip selection
  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    onDetailsOpen();
  };

  // Generate calendar grid for month view
  const generateCalendarGrid = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayTrips = trips.filter(trip => 
        new Date(trip.scheduledDate).toDateString() === currentDateObj.toDateString()
      );

      days.push({
        date: new Date(currentDateObj),
        trips: dayTrips,
        isCurrentMonth: currentDateObj.getMonth() === currentDate.getMonth(),
        isToday: currentDateObj.toDateString() === new Date().toDateString()
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get summary stats
  const getStats = () => {
    const scheduled = filteredTrips.filter(t => t.status === 'scheduled').length;
    const inProgress = filteredTrips.filter(t => t.status === 'in-progress').length;
    const completed = filteredTrips.filter(t => t.status === 'completed').length;
    return { scheduled, inProgress, completed };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading calendar...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Card mb={6} shadow="sm">
        <CardHeader>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center">
            <VStack align="start" spacing={1} flex={1}>
              <Heading size="lg" color="blue.600">
                📅 Calendar Overview
              </Heading>
              <Text color="gray.600" fontSize="sm">
                View upcoming rides by day, week, month, or year
              </Text>
            </VStack>
            
            {/* View Mode Tabs */}
            <VStack spacing={3}>
              {/* Statistics Summary */}
              <HStack spacing={4} fontSize="sm">
                <HStack>
                  <Badge colorScheme="blue" variant="subtle">
                    {stats.scheduled} Scheduled
                  </Badge>
                </HStack>
                <HStack>
                  <Badge colorScheme="orange" variant="subtle">
                    {stats.inProgress} In Progress
                  </Badge>
                </HStack>
                <HStack>
                  <Badge colorScheme="green" variant="subtle">
                    {stats.completed} Completed
                  </Badge>
                </HStack>
              </HStack>

              {/* View Mode Controls */}
              <HStack spacing={2}>
                <Tooltip label="Day View">
                  <Button
                    size="sm"
                    variant={viewMode === 'day' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    leftIcon={<Box as={CalendarDaysIcon} w={4} h={4} />}
                    onClick={() => setViewMode('day')}
                  >
                    Day
                  </Button>
                </Tooltip>
                <Tooltip label="Week View">
                  <Button
                    size="sm"
                    variant={viewMode === 'week' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    leftIcon={<Box as={TableCellsIcon} w={4} h={4} />}
                    onClick={() => setViewMode('week')}
                  >
                    Week
                  </Button>
                </Tooltip>
                <Tooltip label="Month View">
                  <Button
                    size="sm"
                    variant={viewMode === 'month' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    leftIcon={<Box as={CalendarDaysIconSolid} w={4} h={4} />}
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </Button>
                </Tooltip>
                <Tooltip label="Year View">
                  <Button
                    size="sm"
                    variant={viewMode === 'year' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    leftIcon={<Box as={Squares2X2Icon} w={4} h={4} />}
                    onClick={() => setViewMode('year')}
                  >
                    Year
                  </Button>
                </Tooltip>
              </HStack>
            </VStack>
          </Flex>
        </CardHeader>
      </Card>

      {/* Navigation and Current Date */}
      <Card mb={6} shadow="sm">
        <CardBody>
          <Flex align="center" justify="space-between">
            <HStack>
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={() => navigateDate(-1)}
                variant="outline"
                colorScheme="blue"
                aria-label="Previous period"
              />
              <Button
                size="sm"
                onClick={goToToday}
                variant="outline"
                colorScheme="blue"
              >
                Today
              </Button>
            </HStack>
            
            <VStack spacing={1}>
              <Heading size="md" textAlign="center">
                {formatDateRange()}
              </Heading>
              <Text fontSize="sm" color={textColor}>
                {filteredTrips.length} trips scheduled
              </Text>
            </VStack>
            
            <IconButton
              icon={<ChevronRightIcon />}
              onClick={() => navigateDate(1)}
              variant="outline"
              colorScheme="blue"
              aria-label="Next period"
            />
          </Flex>
        </CardBody>
      </Card>

      {/* Calendar Content */}
      {viewMode === 'month' ? (
        /* Month Calendar Grid */
        <Card shadow="sm">
          <CardHeader bg={headerBg}>
            <SimpleGrid columns={7} spacing={2}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} textAlign="center" fontWeight="bold" fontSize="sm">
                  {day}
                </Text>
              ))}
            </SimpleGrid>
          </CardHeader>
          <CardBody p={0}>
            <SimpleGrid columns={7} spacing={0}>
              {generateCalendarGrid().map((day, index) => (
                <Box
                  key={index}
                  h="120px"
                  p={2}
                  borderRight="1px"
                  borderBottom="1px"
                  borderColor={borderColor}
                  bg={day.isCurrentMonth ? bgColor : mutedBgColor}
                  opacity={day.isCurrentMonth ? 1 : 0.6}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                >
                  <VStack align="start" spacing={1} h="full">
                    <Text
                      fontSize="sm"
                      fontWeight={day.isToday ? 'bold' : 'normal'}
                      color={day.isToday ? 'blue.500' : textColor}
                    >
                      {day.date.getDate()}
                    </Text>
                    {day.trips.slice(0, 3).map(trip => (
                      <Badge
                        key={trip._id}
                        size="xs"
                        colorScheme={getStatusColor(trip.status)}
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripSelect(trip);
                        }}
                        title={`${trip.riderName} - ${trip.scheduledTime}`}
                        maxW="full"
                        isTruncated
                        fontSize="10px"
                        px={1}
                      >
                        {trip.scheduledTime} {trip.riderName.split(' ')[0]}
                      </Badge>
                    ))}
                    {day.trips.length > 3 && (
                      <Text fontSize="xs" color={textColor}>
                        +{day.trips.length - 3} more
                      </Text>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      ) : (
        /* List View for Day, Week, Year */
        <Card shadow="sm">
          <CardHeader>
            <Heading size="md">
              Upcoming Trips ({filteredTrips.length})
            </Heading>
          </CardHeader>
          <CardBody>
            {filteredTrips.length === 0 ? (
              <Center py={8}>
                <VStack spacing={4}>
                  <CalendarIcon boxSize={12} color="gray.400" />
                  <Text color={textColor}>No trips scheduled for this period</Text>
                  <Button leftIcon={<Box as={PlusIcon} w={4} h={4} />} colorScheme="blue" size="sm">
                    Schedule New Trip
                  </Button>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={3} align="stretch">
                {filteredTrips.map(trip => (
                  <Card
                    key={trip._id}
                    variant="outline"
                    _hover={{ shadow: 'md' }}
                    cursor="pointer"
                    onClick={() => handleTripSelect(trip)}
                  >
                    <CardBody>
                      <Flex justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack spacing={3}>
                            <Badge colorScheme={getStatusColor(trip.status)} fontSize="xs">
                              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                            </Badge>
                            <Text fontWeight="bold" color="blue.600">
                              {trip.riderName}
                            </Text>
                            <HStack spacing={1}>
                              <Box as={ClockIconSolid} w={3} h={3} />
                              <Text fontSize="sm" color={textColor}>
                                {new Date(trip.scheduledDate).toLocaleDateString()} at {trip.scheduledTime}
                              </Text>
                            </HStack>
                          </HStack>
                          
                          <VStack align="start" spacing={1} fontSize="sm">
                            <HStack spacing={2}>
                              <FaMapMarkerAlt color="green" />
                              <Text>
                                <Text as="span" fontWeight="medium">From:</Text>{' '}
                                {typeof trip.pickupLocation === 'object' 
                                  ? trip.pickupLocation.address 
                                  : trip.pickupLocation}
                              </Text>
                            </HStack>
                            <HStack spacing={2}>
                              <FaMapMarkerAlt color="red" />
                              <Text>
                                <Text as="span" fontWeight="medium">To:</Text>{' '}
                                {typeof trip.dropoffLocation === 'object' 
                                  ? trip.dropoffLocation.address 
                                  : trip.dropoffLocation}
                              </Text>
                            </HStack>
                            {trip.assignedDriver && (
                              <HStack spacing={2}>
                                <FaCar color="blue" />
                                <Text>
                                  <Text as="span" fontWeight="medium">Driver:</Text>{' '}
                                  {typeof trip.assignedDriver === 'object' && trip.assignedDriver
                                    ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`
                                    : trip.assignedDriver}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </VStack>
                        
                        <VStack spacing={2}>
                          <IconButton
                            icon={<ViewIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="View details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTripSelect(trip);
                            }}
                          />
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="orange"
                            aria-label="Edit trip"
                          />
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      )}

      {/* Trip Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <CalendarIcon color="blue.500" />
              <Text>Trip Details</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedTrip && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="bold">
                    {selectedTrip.riderName}
                  </Text>
                  <Badge colorScheme={getStatusColor(selectedTrip.status)}>
                    {selectedTrip.status.charAt(0).toUpperCase() + selectedTrip.status.slice(1)}
                  </Badge>
                </HStack>
                
                <Divider />
                
                <SimpleGrid columns={2} spacing={4}>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <CalendarIcon />
                      <Text fontWeight="medium">Date & Time</Text>
                    </HStack>
                    <Text ml={6}>
                      {new Date(selectedTrip.scheduledDate).toLocaleDateString()}
                    </Text>
                    <Text ml={6}>
                      {selectedTrip.scheduledTime}
                    </Text>
                  </VStack>
                  
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FaUser />
                      <Text fontWeight="medium">Contact</Text>
                    </HStack>
                    <HStack ml={6}>
                      <FaPhone size={12} />
                      <Text fontSize="sm">{selectedTrip.riderPhone}</Text>
                    </HStack>
                    {selectedTrip.riderEmail && (
                      <HStack ml={6}>
                        <FaEnvelope size={12} />
                        <Text fontSize="sm">{selectedTrip.riderEmail}</Text>
                      </HStack>
                    )}
                  </VStack>
                </SimpleGrid>
                
                <Divider />
                
                <VStack align="start" spacing={2}>
                  <HStack>
                    <FaMapMarkerAlt color="green" />
                    <Text fontWeight="medium">Pickup Location</Text>
                  </HStack>
                  <Text ml={6}>
                    {typeof selectedTrip.pickupLocation === 'object' 
                      ? selectedTrip.pickupLocation.address 
                      : selectedTrip.pickupLocation}
                  </Text>
                </VStack>
                
                <VStack align="start" spacing={2}>
                  <HStack>
                    <FaMapMarkerAlt color="red" />
                    <Text fontWeight="medium">Dropoff Location</Text>
                  </HStack>
                  <Text ml={6}>
                    {typeof selectedTrip.dropoffLocation === 'object' 
                      ? selectedTrip.dropoffLocation.address 
                      : selectedTrip.dropoffLocation}
                  </Text>
                </VStack>
                
                {selectedTrip.assignedDriver && (
                  <>
                    <Divider />
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <FaCar />
                        <Text fontWeight="medium">Assigned Driver</Text>
                      </HStack>
                      <Text ml={6}>
                        {typeof selectedTrip.assignedDriver === 'object' && selectedTrip.assignedDriver
                          ? `${selectedTrip.assignedDriver.firstName} ${selectedTrip.assignedDriver.lastName}`
                          : selectedTrip.assignedDriver}
                      </Text>
                    </VStack>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CalendarOverview;