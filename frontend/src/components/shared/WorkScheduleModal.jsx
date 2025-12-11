import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Checkbox,
  Tfoot,
  IconButton,
  Flex,
  Stack
} from '@chakra-ui/react';
import {
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const WorkScheduleModal = ({ isOpen, onClose, userId, userName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Week navigation state - initialize with current week
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });
  
  // Form state for time-off request
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  // Admin tab state
  const [scheduleData, setScheduleData] = useState(null);
  const [pendingTimeOffRequests, setPendingTimeOffRequests] = useState([]);
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Admin employee selection state
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const isAdmin = user && ['admin', 'dispatcher', 'scheduler'].some(role => 
    user.roles?.includes(role) || user.role === role
  );

  // Helper function to get the start of a week (Sunday)
  const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Get Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Helper function to format week range
  const formatWeekRange = (weekStart) => {
    if (!weekStart) return '';
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `Week of ${startStr} – ${endStr}`;
  };

  // Helper function to check if a date is the current week
  const isCurrentWeek = (weekStart) => {
    if (!weekStart) return true;
    const currentWeekStart = getWeekStart();
    return weekStart.getTime() === currentWeekStart.getTime();
  };

  // Helper function to format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const fetchWorkScheduleData = async (weekStart = null) => {
    setLoading(true);
    try {
      // Fetch work schedule summary
      const summaryResponse = await axios.get(`/api/work-schedule/${userId}/summary`);
      setSummary(summaryResponse.data.summary);

      // Fetch time-off requests
      const timeOffResponse = await axios.get(`/api/work-schedule/${userId}/time-off`);
      setTimeOffRequests(timeOffResponse.data);

      // Fetch weekly schedule with week parameter
      try {
        const weekStartParam = weekStart || getWeekStart();
        const weeklyResponse = await axios.get(`/api/weekly-schedule/${userId}`, {
          params: { weekStart: weekStartParam.toISOString() }
        });
        setWeeklySchedule(weeklyResponse.data);
        setCurrentWeekStart(weekStartParam);
      } catch {
        // Weekly schedule might not exist yet, that's okay
        console.log('No weekly schedule found (this is normal for new users)');
        setWeeklySchedule(null);
        setCurrentWeekStart(weekStart || getWeekStart());
      }

      // Fetch pending time-off requests for admin
      if (isAdmin) {
        const pendingResponse = await axios.get(`/api/work-schedule/${userId}/time-off?status=pending`);
        setPendingTimeOffRequests(pendingResponse.data);
      }
    } catch (error) {
      console.error('Error fetching work schedule data:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load work schedule data',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    fetchWorkScheduleData(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    fetchWorkScheduleData(newWeekStart);
  };

  const handleThisWeek = () => {
    fetchWorkScheduleData(getWeekStart());
  };

  // Fetch all employees for admin dropdown
  const fetchAllEmployees = async () => {
    if (!isAdmin) return;
    
    setLoadingEmployees(true);
    try {
      const response = await axios.get('/api/users', {
        params: { 
          role: 'driver,dispatcher,scheduler,admin',
          limit: 1000 
        }
      });
      setAllEmployees(response.data.users || response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee list',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Handle employee selection in admin tab
  const handleEmployeeSelect = async (employeeId) => {
    const employee = allEmployees.find(emp => emp._id === employeeId);
    if (!employee) return;

    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employee.name || employee.email);
    
    // Fetch selected employee's schedule and time-off requests
    try {
      setLoading(true);
      
      // Fetch weekly schedule for selected employee
      try {
        const weekStartParam = currentWeekStart || getWeekStart();
        const weeklyResponse = await axios.get(`/api/weekly-schedule/${employeeId}`, {
          params: { weekStart: weekStartParam.toISOString() }
        });
        
        // Convert to editable format for admin
        const editableSchedule = weeklyResponse.data.schedule.map(day => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          isWorkDay: day.isWorkDay,
          shiftStart: day.shiftStart || '09:00',
          shiftEnd: day.shiftEnd || '17:00',
          hoursScheduled: day.hoursScheduled || 0
        }));
        setScheduleData(editableSchedule);
      } catch {
        // No schedule exists, initialize default
        initializeScheduleData();
      }

      // Fetch pending time-off requests for selected employee
      const timeOffResponse = await axios.get(`/api/work-schedule/${employeeId}/time-off?status=pending`);
      setPendingTimeOffRequests(timeOffResponse.data);
      
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee schedule',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchWorkScheduleData();
      // Initialize schedule data for admin tab
      if (isAdmin) {
        initializeScheduleData();
        fetchAllEmployees();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, isAdmin]);

  const initializeScheduleData = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultSchedule = daysOfWeek.map((day, index) => ({
      dayOfWeek: index,
      dayName: day,
      isWorkDay: false,
      shiftStart: '09:00',
      shiftEnd: '17:00',
      hoursScheduled: 0
    }));
    setScheduleData(defaultSchedule);
  };

  const handleSubmitTimeOff = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select both start and end dates',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/work-schedule/${userId}/time-off`, {
        startDate,
        endDate,
        reason
      });

      toast({
        title: 'Success',
        description: 'Time-off request submitted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');

      // Refresh data
      fetchWorkScheduleData();
    } catch (error) {
      console.error('Error submitting time-off request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit time-off request',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!isAdmin || !scheduleData) return;

    // Determine which employee to save for (selected employee in admin tab or current user)
    const targetUserId = selectedEmployeeId || userId;
    const targetUserName = selectedEmployeeName || userName;

    if (!targetUserId) {
      toast({
        title: 'Error',
        description: 'Please select an employee first',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/api/weekly-schedule/${targetUserId}`, {
        schedule: scheduleData,
        isRecurring: true,
        effectiveDate: new Date()
      });

      toast({
        title: 'Success',
        description: `Weekly schedule saved for ${targetUserName}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      setEditMode(false);
      
      // Refresh the selected employee's data
      if (selectedEmployeeId) {
        handleEmployeeSelect(selectedEmployeeId);
      } else {
        fetchWorkScheduleData();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save schedule',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleWorkDay = (dayIndex) => {
    const newSchedule = [...scheduleData];
    newSchedule[dayIndex].isWorkDay = !newSchedule[dayIndex].isWorkDay;
    
    // Recalculate hours
    if (newSchedule[dayIndex].isWorkDay && newSchedule[dayIndex].shiftStart && newSchedule[dayIndex].shiftEnd) {
      newSchedule[dayIndex].hoursScheduled = calculateHours(
        newSchedule[dayIndex].shiftStart, 
        newSchedule[dayIndex].shiftEnd
      );
    } else {
      newSchedule[dayIndex].hoursScheduled = 0;
    }
    
    setScheduleData(newSchedule);
  };

  const handleShiftChange = (dayIndex, field, value) => {
    const newSchedule = [...scheduleData];
    newSchedule[dayIndex][field] = value;
    
    // Recalculate hours if both times are set
    if (newSchedule[dayIndex].shiftStart && newSchedule[dayIndex].shiftEnd && newSchedule[dayIndex].isWorkDay) {
      newSchedule[dayIndex].hoursScheduled = calculateHours(
        newSchedule[dayIndex].shiftStart,
        newSchedule[dayIndex].shiftEnd
      );
    }
    
    setScheduleData(newSchedule);
  };

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    
    return totalMinutes / 60;
  };

  const handleReviewTimeOff = async (requestId, status) => {
    if (!isAdmin) return;

    try {
      setSubmitting(true);
      await axios.patch(`/api/work-schedule/time-off/${requestId}`, {
        status,
        reviewNotes
      });

      toast({
        title: 'Success',
        description: `Time-off request ${status}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      setReviewingRequest(null);
      setReviewNotes('');
      fetchWorkScheduleData();
    } catch (error) {
      console.error('Error reviewing time-off request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to review request',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'denied':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: 'full', md: '3xl' }}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="lg">Work Schedule</Heading>
            <Text fontSize="md" fontWeight="normal" color="gray.600">
              {userName}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Center py={10}>
              <Spinner size="xl" color="blue.500" />
            </Center>
          ) : (
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Work Week</Tab>
                <Tab>Time Off</Tab>
                {isAdmin && <Tab>Admin</Tab>}
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* Statistics */}
                    {summary && (
                      <>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          {/* Hours Worked */}
                          <Box
                            p={5}
                            bg={cardBg}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <Stat>
                              <HStack spacing={3} mb={2}>
                                <Box as={ClockIcon} w={6} h={6} color="blue.500" />
                                <StatLabel fontSize="sm" fontWeight="medium">
                                  Hours Worked
                                </StatLabel>
                              </HStack>
                              <StatNumber fontSize="3xl">
                                {summary.totalHours.toFixed(1)}
                              </StatNumber>
                              <StatHelpText>
                                {summary.daysWorked} days worked
                              </StatHelpText>
                            </Stat>
                          </Box>

                          {/* Days Missed */}
                          <Box
                            p={5}
                            bg={cardBg}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <Stat>
                              <HStack spacing={3} mb={2}>
                                <Box as={ExclamationTriangleIcon} w={6} h={6} color="orange.500" />
                                <StatLabel fontSize="sm" fontWeight="medium">
                                  Days Missed
                                </StatLabel>
                              </HStack>
                              <StatNumber fontSize="3xl">
                                {summary.daysMissed}
                              </StatNumber>
                              <StatHelpText>
                                {summary.daysScheduled} days scheduled
                              </StatHelpText>
                            </Stat>
                          </Box>

                          {/* Earnings */}
                          <Box
                            p={5}
                            bg={cardBg}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <Stat>
                              <HStack spacing={3} mb={2}>
                                <Box as={CurrencyDollarIcon} w={6} h={6} color="green.500" />
                                <StatLabel fontSize="sm" fontWeight="medium">
                                  Earnings
                                </StatLabel>
                              </HStack>
                              <StatNumber fontSize="3xl">
                                {formatCurrency(summary.totalEarnings)}
                              </StatNumber>
                              <StatHelpText>
                                Current period
                              </StatHelpText>
                            </Stat>
                          </Box>
                        </SimpleGrid>

                        {/* Missed Days Details */}
                        {summary.missedDays.length > 0 && (
                          <>
                            <Divider />
                            <Box>
                              <Heading size="sm" mb={3}>
                                Missed Days Details
                              </Heading>
                              <VStack spacing={2} align="stretch">
                                {summary.missedDays.map((day, index) => (
                                  <Alert key={index} status="warning" borderRadius="md">
                                    <AlertIcon />
                                    <Box flex="1">
                                      <Text fontWeight="bold">
                                        {formatDate(day.date)}
                                      </Text>
                                      {day.notes && (
                                        <Text fontSize="sm" color="gray.600">
                                          {day.notes}
                                        </Text>
                                      )}
                                    </Box>
                                  </Alert>
                                ))}
                              </VStack>
                            </Box>
                          </>
                        )}

                        {/* Daily Records */}
                        {summary.records.length > 0 && (
                          <>
                            <Divider />
                            <Box>
                              <Heading size="sm" mb={3}>
                                Daily Records
                              </Heading>
                              <Box overflowX="auto" width="100%">
                                <Table size={{ base: "sm", md: "md" }} variant="simple">
                                  <Thead>
                                    <Tr>
                                      <Th minW={{ base: "80px", md: "100px" }}>Date</Th>
                                      <Th minW={{ base: "70px", md: "90px" }}>Status</Th>
                                      <Th isNumeric minW={{ base: "60px", md: "80px" }}>Hours</Th>
                                      <Th isNumeric minW={{ base: "80px", md: "100px" }}>Earnings</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {summary.records.slice(0, 10).map((record, index) => (
                                      <Tr key={index}>
                                        <Td fontSize={{ base: "sm", md: "md" }}>{formatDate(record.date)}</Td>
                                        <Td>
                                          <Badge 
                                            colorScheme={
                                              record.status === 'worked' ? 'green' :
                                              record.status === 'missed' ? 'red' :
                                              record.status === 'time-off' ? 'blue' :
                                              'gray'
                                            }
                                            fontSize={{ base: "xs", md: "sm" }}
                                          >
                                            {record.status}
                                          </Badge>
                                        </Td>
                                        <Td isNumeric fontSize={{ base: "sm", md: "md" }}>
                                          {record.hoursWorked ? record.hoursWorked.toFixed(1) : '-'}
                                        </Td>
                                        <Td isNumeric fontSize={{ base: "sm", md: "md" }}>
                                          {record.earnings ? formatCurrency(record.earnings) : '-'}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </Box>
                            </Box>
                          </>
                        )}
                      </>
                    )}
                  </VStack>
                </TabPanel>

                {/* Work Week Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* Week Navigation Header */}
                    <Flex 
                      justify="space-between" 
                      align="center" 
                      p={4}
                      bg={cardBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <IconButton
                        icon={<ChevronLeftIcon className="h-5 w-5" />}
                        aria-label="Previous week"
                        onClick={handlePreviousWeek}
                        variant="ghost"
                        size={{ base: "md", md: "sm" }}
                      />
                      
                      <VStack spacing={0}>
                        <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" textAlign="center">
                          {currentWeekStart && formatWeekRange(currentWeekStart)}
                        </Text>
                        {!isCurrentWeek(currentWeekStart) && (
                          <Button
                            size="xs"
                            variant="link"
                            colorScheme="blue"
                            onClick={handleThisWeek}
                          >
                            Go to This Week
                          </Button>
                        )}
                      </VStack>
                      
                      <IconButton
                        icon={<ChevronRightIcon className="h-5 w-5" />}
                        aria-label="Next week"
                        onClick={handleNextWeek}
                        variant="ghost"
                        size={{ base: "md", md: "sm" }}
                      />
                    </Flex>

                    {/* Weekly Schedule Calendar View */}
                    <Box>
                      {weeklySchedule && weeklySchedule.schedule ? (
                        <>
                          <VStack spacing={3} align="stretch">
                            {weeklySchedule.schedule.map((day, index) => (
                              <Box
                                key={index}
                                p={5}
                                bg={day.hasTimeOff ? 'blue.50' : day.isWorkDay ? bgColor : cardBg}
                                borderRadius="lg"
                                borderWidth="2px"
                                borderColor={day.hasTimeOff ? 'blue.300' : day.isWorkDay ? 'green.300' : borderColor}
                                transition="all 0.2s"
                                _hover={{ shadow: 'md' }}
                              >
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1} flex={1}>
                                    <HStack spacing={3}>
                                      <Text fontSize="lg" fontWeight="bold" color={day.isWorkDay ? 'green.600' : 'gray.600'}>
                                        {day.dayName}
                                      </Text>
                                      <Text fontSize="sm" color="gray.500">
                                        {new Date(day.date).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </Text>
                                      <Badge
                                        colorScheme={
                                          day.hasTimeOff ? 'blue' :
                                          day.isWorkDay ? 'green' :
                                          'gray'
                                        }
                                        fontSize="xs"
                                      >
                                        {day.status}
                                      </Badge>
                                    </HStack>
                                    
                                    <HStack spacing={4} mt={2}>
                                      <HStack spacing={2}>
                                        <Icon as={ClockIcon} w={4} h={4} color="gray.500" />
                                        <Text fontSize="md" fontWeight="medium">
                                          {day.hasTimeOff ? (
                                            <Text as="span" color="blue.600">Time Off</Text>
                                          ) : day.isWorkDay && day.shiftStart && day.shiftEnd ? (
                                            <Text as="span" color="green.700">
                                              {formatTime(day.shiftStart)} – {formatTime(day.shiftEnd)}
                                            </Text>
                                          ) : (
                                            <Text as="span" color="gray.500">Off</Text>
                                          )}
                                        </Text>
                                      </HStack>
                                    </HStack>
                                  </VStack>

                                  <Box textAlign="right">
                                    {day.hoursScheduled > 0 ? (
                                      <VStack spacing={0}>
                                        <Text fontSize="2xl" fontWeight="bold" color={day.hasTimeOff ? 'blue.600' : 'green.600'}>
                                          {day.hoursScheduled.toFixed(1)}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {day.hoursScheduled === 1 ? 'hour' : 'hours'}
                                        </Text>
                                      </VStack>
                                    ) : (
                                      <Text fontSize="lg" color="gray.400">
                                        –
                                      </Text>
                                    )}
                                  </Box>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>

                          {/* Total Weekly Hours Summary */}
                          <Box
                            mt={6}
                            p={6}
                            bg="blue.50"
                            borderRadius="lg"
                            borderWidth="2px"
                            borderColor="blue.300"
                          >
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                  Total Hours for Week
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {formatWeekRange(currentWeekStart)}
                                </Text>
                              </VStack>
                              <HStack spacing={2}>
                                <Icon as={ClockIcon} w={6} h={6} color="blue.600" />
                                <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                                  {weeklySchedule.totalWeeklyHours.toFixed(1)}
                                </Text>
                                <Text fontSize="md" color="gray.600">
                                  hours
                                </Text>
                              </HStack>
                            </Flex>
                          </Box>
                          
                          {weeklySchedule.notes && (
                            <Alert status="info" borderRadius="md" mt={4}>
                              <AlertIcon />
                              <Box>
                                <Text fontWeight="bold">Notes:</Text>
                                <Text fontSize="sm">{weeklySchedule.notes}</Text>
                              </Box>
                            </Alert>
                          )}
                        </>
                      ) : (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="bold">No weekly schedule has been set yet</Text>
                            <Text fontSize="sm">
                              Contact your administrator to create your schedule.
                            </Text>
                          </VStack>
                        </Alert>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Time Off Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* Request Time Off Form */}
                    <Box
                      p={5}
                      bg={cardBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <Heading size="sm" mb={4}>
                        Request Time Off
                      </Heading>
                      <form onSubmit={handleSubmitTimeOff}>
                        <VStack spacing={4}>
                          <Stack 
                            direction={{ base: "column", md: "row" }} 
                            spacing={4} 
                            w="full"
                          >
                            <FormControl isRequired>
                              <FormLabel fontSize={{ base: "sm", md: "md" }}>Start Date</FormLabel>
                              <Input
                                type="date"
                                size={{ base: "md", md: "lg" }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                            <FormControl isRequired>
                              <FormLabel fontSize={{ base: "sm", md: "md" }}>End Date</FormLabel>
                              <Input
                                type="date"
                                size={{ base: "md", md: "lg" }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                          </Stack>
                          <FormControl>
                            <FormLabel fontSize={{ base: "sm", md: "md" }}>Reason (Optional)</FormLabel>
                            <Textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Vacation, personal day, medical, etc."
                              rows={3}
                              maxLength={500}
                              size={{ base: "md", md: "lg" }}
                              fontSize={{ base: "sm", md: "md" }}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            w="full"
                            size={{ base: "md", md: "lg" }}
                            isLoading={submitting}
                            loadingText="Submitting..."
                          >
                            Submit Request
                          </Button>
                        </VStack>
                      </form>
                    </Box>

                    <Divider />

                    {/* Time Off Requests History */}
                    <Box>
                      <Heading size="sm" mb={3}>
                        Your Time-Off Requests
                      </Heading>
                      {timeOffRequests.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          No time-off requests yet
                        </Alert>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {timeOffRequests.map((request) => (
                            <Box
                              key={request._id}
                              p={4}
                              borderWidth="1px"
                              borderColor={borderColor}
                              borderRadius="md"
                              bg={bgColor}
                            >
                              <HStack justify="space-between" mb={2}>
                                <HStack spacing={2}>
                                  <Icon as={CalendarDaysIcon} w={5} h={5} color="blue.500" />
                                  <Text fontWeight="bold">
                                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                  </Text>
                                </HStack>
                                <Badge colorScheme={getStatusColor(request.status)} fontSize="sm">
                                  {request.status}
                                </Badge>
                              </HStack>
                              {request.reason && (
                                <Text fontSize="sm" color="gray.600" mb={2}>
                                  {request.reason}
                                </Text>
                              )}
                              {request.reviewNotes && (
                                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                  Review: {request.reviewNotes}
                                </Text>
                              )}
                              <Text fontSize="xs" color="gray.400" mt={2}>
                                Requested {formatDate(request.requestedAt)}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>

                {/* Admin Tab */}
                {isAdmin && (
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {/* Employee Selection Section */}
                      <Box
                        p={5}
                        bg="blue.50"
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor="blue.300"
                      >
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Heading size="sm" color="blue.800">
                              Select Employee to Manage
                            </Heading>
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                              onClick={() => {
                                onClose();
                                navigate('/admin');
                              }}
                              colorScheme="gray"
                              _hover={{ bg: 'gray.100' }}
                            >
                              Back to Admin Dashboard
                            </Button>
                          </Flex>
                          <FormControl>
                            <Select
                              placeholder="Choose an employee..."
                              value={selectedEmployeeId || ''}
                              onChange={(e) => handleEmployeeSelect(e.target.value)}
                              size="lg"
                              bg="white"
                              isDisabled={loadingEmployees}
                            >
                              {allEmployees.map((employee) => (
                                <option key={employee._id} value={employee._id}>
                                  {employee.name || employee.email} - {employee.role}
                                </option>
                              ))}
                            </Select>
                            <Text fontSize="xs" color="gray.600" mt={2}>
                              Select an employee to view and manage their schedule and time-off requests
                            </Text>
                          </FormControl>
                          
                          {selectedEmployeeId && (
                            <Alert status="info" borderRadius="md">
                              <AlertIcon />
                              <Box>
                                <Text fontWeight="bold">Managing: {selectedEmployeeName}</Text>
                                <Text fontSize="sm">
                                  You can now create/edit their schedule and review time-off requests below.
                                </Text>
                              </Box>
                            </Alert>
                          )}
                        </VStack>
                      </Box>

                      {/* Show schedule and time-off sections only if employee is selected */}
                      {selectedEmployeeId ? (
                        <>
                          {/* Create/Edit Schedule Section */}
                          <Box
                            p={5}
                            bg={cardBg}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={borderColor}
                          >
                            <Flex 
                              direction={{ base: "column", md: "row" }}
                              justify="space-between" 
                              align={{ base: "stretch", md: "center" }}
                              gap={3}
                              mb={2}
                            >
                              <Heading size={{ base: "sm", md: "md" }}>
                                Manage Schedule for {selectedEmployeeName}
                              </Heading>
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                                onClick={() => {
                                  onClose();
                                  navigate('/admin');
                                }}
                                colorScheme="gray"
                                _hover={{ bg: 'gray.100' }}
                                display={{ base: "none", md: "flex" }}
                              >
                                Back to Admin Dashboard
                              </Button>
                            </Flex>
                            <Flex 
                              direction={{ base: "column", md: "row" }}
                              justify="space-between" 
                              align={{ base: "stretch", md: "center" }}
                              gap={3}
                              mb={4}
                            >
                              <Box />
                              <Stack direction={{ base: "row", md: "row" }} spacing={2}>
                                {editMode ? (
                                  <>
                                    <Button
                                      size={{ base: "sm", md: "md" }}
                                      leftIcon={<CheckIcon className="h-4 w-4" />}
                                      colorScheme="green"
                                      onClick={handleSaveSchedule}
                                      isLoading={submitting}
                                      flex={{ base: 1, md: "initial" }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size={{ base: "sm", md: "md" }}
                                      leftIcon={<XMarkIcon className="h-4 w-4" />}
                                      onClick={() => {
                                        setEditMode(false);
                                        handleEmployeeSelect(selectedEmployeeId);
                                      }}
                                      flex={{ base: 1, md: "initial" }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size={{ base: "sm", md: "md" }}
                                    leftIcon={<PencilIcon className="h-4 w-4" />}
                                    colorScheme="blue"
                                    onClick={() => setEditMode(true)}
                                    w={{ base: "full", md: "auto" }}
                                  >
                                    Edit Schedule
                                  </Button>
                                )}
                              </Stack>
                            </Flex>

                            {scheduleData && (
                              <Box overflowX="auto" width="100%">
                                <Table variant="simple" size={{ base: "sm", md: "md" }}>
                              <Thead>
                                <Tr>
                                  <Th minW={{ base: "80px", md: "100px" }}>Day</Th>
                                  <Th minW={{ base: "80px", md: "100px" }}>Work Day</Th>
                                  <Th minW={{ base: "100px", md: "120px" }}>Shift Start</Th>
                                  <Th minW={{ base: "100px", md: "120px" }}>Shift End</Th>
                                  <Th isNumeric minW={{ base: "60px", md: "80px" }}>Hours</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {scheduleData.map((day, index) => (
                                  <Tr key={index}>
                                    <Td fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>{day.dayName}</Td>
                                    <Td>
                                      <Checkbox
                                        isChecked={day.isWorkDay}
                                        onChange={() => handleToggleWorkDay(index)}
                                        isDisabled={!editMode}
                                        size={{ base: "sm", md: "md" }}
                                      />
                                    </Td>
                                    <Td>
                                      <Input
                                        type="time"
                                        size={{ base: "sm", md: "md" }}
                                        value={day.shiftStart || ''}
                                        onChange={(e) => handleShiftChange(index, 'shiftStart', e.target.value)}
                                        isDisabled={!editMode || !day.isWorkDay}
                                        width={{ base: "100px", md: "120px" }}
                                      />
                                    </Td>
                                    <Td>
                                      <Input
                                        type="time"
                                        size={{ base: "sm", md: "md" }}
                                        value={day.shiftEnd || ''}
                                        onChange={(e) => handleShiftChange(index, 'shiftEnd', e.target.value)}
                                        isDisabled={!editMode || !day.isWorkDay}
                                        width={{ base: "100px", md: "120px" }}
                                      />
                                    </Td>
                                    <Td isNumeric fontSize={{ base: "sm", md: "md" }}>
                                      {day.isWorkDay && day.hoursScheduled > 0 ? day.hoursScheduled.toFixed(1) : '-'}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                              <Tfoot>
                                <Tr>
                                  <Th colSpan={4}>Total Weekly Hours</Th>
                                  <Th isNumeric fontSize="lg">
                                    {scheduleData.reduce((total, day) => total + (day.hoursScheduled || 0), 0).toFixed(1)}
                                  </Th>
                                </Tr>
                              </Tfoot>
                            </Table>
                          </Box>
                        )}
                      </Box>

                      <Divider />

                      {/* Time-Off Requests Management */}
                      <Box
                        p={5}
                        bg={cardBg}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Flex justify="space-between" align="center" mb={4}>
                          <Heading size="md">
                            Pending Time-Off Requests
                          </Heading>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                            onClick={() => {
                              onClose();
                              navigate('/admin');
                            }}
                            colorScheme="gray"
                            _hover={{ bg: 'gray.100' }}
                            display={{ base: "none", md: "flex" }}
                          >
                            Back to Admin Dashboard
                          </Button>
                        </Flex>

                        {pendingTimeOffRequests.length === 0 ? (
                          <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            No pending time-off requests
                          </Alert>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {pendingTimeOffRequests.map((request) => (
                              <Box
                                key={request._id}
                                p={4}
                                borderWidth="1px"
                                borderColor={borderColor}
                                borderRadius="md"
                                bg={bgColor}
                              >
                                <HStack justify="space-between" mb={3}>
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <Icon as={CalendarDaysIcon} w={5} h={5} color="blue.500" />
                                      <Text fontWeight="bold">
                                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                      </Text>
                                      <Badge colorScheme="yellow">Pending</Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600">
                                      Requested {formatDate(request.requestedAt)}
                                    </Text>
                                  </VStack>
                                </HStack>

                                {request.reason && (
                                  <Box mb={3}>
                                    <Text fontSize="sm" fontWeight="medium" mb={1}>Reason:</Text>
                                    <Text fontSize="sm" color="gray.600">{request.reason}</Text>
                                  </Box>
                                )}

                                {reviewingRequest === request._id ? (
                                  <VStack spacing={3} align="stretch">
                                    <FormControl>
                                      <FormLabel fontSize="sm">Review Notes</FormLabel>
                                      <Textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add notes about this request..."
                                        size={{ base: "md", md: "sm" }}
                                        fontSize={{ base: "sm", md: "md" }}
                                        rows={3}
                                      />
                                    </FormControl>
                                    <Stack direction={{ base: "column", sm: "row" }} spacing={2}>
                                      <Button
                                        size={{ base: "md", md: "sm" }}
                                        colorScheme="green"
                                        leftIcon={<CheckIcon className="h-4 w-4" />}
                                        onClick={() => handleReviewTimeOff(request._id, 'approved')}
                                        isLoading={submitting}
                                        flex={1}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size={{ base: "md", md: "sm" }}
                                        colorScheme="red"
                                        leftIcon={<XMarkIcon className="h-4 w-4" />}
                                        onClick={() => handleReviewTimeOff(request._id, 'denied')}
                                        isLoading={submitting}
                                        flex={1}
                                      >
                                        Deny
                                      </Button>
                                      <Button
                                        size={{ base: "md", md: "sm" }}
                                        variant="ghost"
                                        onClick={() => {
                                          setReviewingRequest(null);
                                          setReviewNotes('');
                                        }}
                                        flex={{ base: 1, sm: "initial" }}
                                      >
                                        Cancel
                                      </Button>
                                    </Stack>
                                  </VStack>
                                ) : (
                                  <Button
                                    size={{ base: "md", md: "sm" }}
                                    colorScheme="blue"
                                    onClick={() => setReviewingRequest(request._id)}
                                    w="full"
                                  >
                                    Review Request
                                  </Button>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        )}
                      </Box>
                      </>
                    ) : (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="bold">No Employee Selected</Text>
                          <Text fontSize="sm">
                            Please select an employee from the dropdown above to manage their schedule and time-off requests.
                          </Text>
                        </VStack>
                      </Alert>
                    )}
                    </VStack>
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WorkScheduleModal;
