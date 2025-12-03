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
  TabPanel
} from '@chakra-ui/react';
import {
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const WorkScheduleModal = ({ isOpen, onClose, userId, userName }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for time-off request
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const fetchWorkScheduleData = async () => {
    setLoading(true);
    try {
      // Fetch work schedule summary
      const summaryResponse = await axios.get(`/api/work-schedule/${userId}/summary`);
      setSummary(summaryResponse.data.summary);

      // Fetch time-off requests
      const timeOffResponse = await axios.get(`/api/work-schedule/${userId}/time-off`);
      setTimeOffRequests(timeOffResponse.data);
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

  useEffect(() => {
    if (isOpen && userId) {
      fetchWorkScheduleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

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
                <Tab>Time Off</Tab>
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
                              <Box overflowX="auto">
                                <Table size="sm" variant="simple">
                                  <Thead>
                                    <Tr>
                                      <Th>Date</Th>
                                      <Th>Status</Th>
                                      <Th isNumeric>Hours</Th>
                                      <Th isNumeric>Earnings</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {summary.records.slice(0, 10).map((record, index) => (
                                      <Tr key={index}>
                                        <Td>{formatDate(record.date)}</Td>
                                        <Td>
                                          <Badge colorScheme={
                                            record.status === 'worked' ? 'green' :
                                            record.status === 'missed' ? 'red' :
                                            record.status === 'time-off' ? 'blue' :
                                            'gray'
                                          }>
                                            {record.status}
                                          </Badge>
                                        </Td>
                                        <Td isNumeric>
                                          {record.hoursWorked ? record.hoursWorked.toFixed(1) : '-'}
                                        </Td>
                                        <Td isNumeric>
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
                          <HStack spacing={4} w="full">
                            <FormControl isRequired>
                              <FormLabel fontSize="sm">Start Date</FormLabel>
                              <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                            <FormControl isRequired>
                              <FormLabel fontSize="sm">End Date</FormLabel>
                              <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || new Date().toISOString().split('T')[0]}
                              />
                            </FormControl>
                          </HStack>
                          <FormControl>
                            <FormLabel fontSize="sm">Reason (Optional)</FormLabel>
                            <Textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Vacation, personal day, medical, etc."
                              rows={3}
                              maxLength={500}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            w="full"
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
