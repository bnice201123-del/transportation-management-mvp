import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Flex,
  Icon,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, TimeIcon, AddIcon, CalendarIcon } from '@chakra-ui/icons';
import ShiftSwapModal from './ShiftSwapModal';
import TimeOffRequestModal from './TimeOffRequestModal';

const DriverScheduleView = ({ driverId }) => {
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [vacationBalance, setVacationBalance] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  
  const toast = useToast();
  const { isOpen: isSwapOpen, onOpen: onSwapOpen, onClose: onSwapClose } = useDisclosure();
  const { isOpen: isTimeOffOpen, onOpen: onTimeOffOpen, onClose: onTimeOffClose } = useDisclosure();
  const { isOpen: isDriverSelectOpen, onOpen: onDriverSelectOpen, onClose: onDriverSelectClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchShifts(),
        fetchVacationBalance(),
        fetchSwapRequests(),
        fetchTimeOffRequests()
      ]);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error Loading Data',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `/api/schedules/driver/${driverId}/range?startDate=${today}&endDate=${futureDate}`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    if (!response.ok) throw new Error('Failed to fetch shifts');
    const data = await response.json();
    
    // Split into upcoming and past
    const now = new Date();
    const upcoming = data.schedules.filter(s => new Date(s.startTime) >= now);
    
    setUpcomingShifts(upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
  };

  const fetchVacationBalance = async () => {
    const response = await fetch(`/api/vacation-balance/${driverId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch vacation balance');
    const data = await response.json();
    setVacationBalance(data);
  };

  const fetchSwapRequests = async () => {
    const response = await fetch(`/api/swap-requests/driver/${driverId}?type=all`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch swap requests');
    const data = await response.json();
    setSwapRequests(data);
  };

  const fetchTimeOffRequests = async () => {
    const response = await fetch(`/api/time-off/driver/${driverId}/requests`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) return; // Endpoint might not exist yet
    const data = await response.json();
    setTimeOffRequests(data);
  };

  // Handlers
  const handleRequestSwap = async (shift) => {
    setSelectedShift(shift);
    // Fetch available drivers who can swap
    try {
      const response = await fetch('/api/users?role=driver&limit=50', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableDrivers(data.users.filter(u => u._id !== driverId));
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
    onDriverSelectOpen();
  };

  const _handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setSelectedShift(shift => ({ ...shift, targetDriver: driver }));
    onDriverSelectOpen();
    onSwapOpen();
  };

  const handleSubmitSwap = async (swapData) => {
    try {
      const response = await fetch('/api/swap-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestingDriverId: driverId,
          targetDriverId: selectedDriver._id,
          originalShiftId: selectedShift._id,
          ...swapData
        })
      });

      if (!response.ok) throw new Error('Failed to create swap request');
      
      toast({
        title: 'Swap Request Sent',
        description: `Swap request sent to ${selectedDriver.firstName}`,
        status: 'success',
        duration: 3000
      });
      
      onSwapClose();
      fetchSwapRequests();
    } catch (err) {
      toast({
        title: 'Error Creating Swap',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleApproveSwap = async (swapId) => {
    try {
      const response = await fetch(`/api/swap-request/${swapId}/driver-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'accepted',
          notes: 'Approved by driver'
        })
      });

      if (!response.ok) throw new Error('Failed to approve swap');
      
      toast({
        title: 'Swap Approved',
        description: 'Waiting for manager approval',
        status: 'success',
        duration: 3000
      });
      
      fetchSwapRequests();
    } catch (err) {
      toast({
        title: 'Error Approving Swap',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleDenySwap = async (swapId) => {
    try {
      const response = await fetch(`/api/swap-request/${swapId}/driver-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'declined',
          notes: 'Declined by driver'
        })
      });

      if (!response.ok) throw new Error('Failed to deny swap');
      
      toast({
        title: 'Swap Declined',
        status: 'success',
        duration: 3000
      });
      
      fetchSwapRequests();
    } catch (err) {
      toast({
        title: 'Error Declining Swap',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleSubmitTimeOff = async (timeOffData) => {
    try {
      const response = await fetch('/api/time-off/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          driverId,
          ...timeOffData
        })
      });

      if (!response.ok) throw new Error('Failed to request time-off');
      
      toast({
        title: 'Time-Off Request Submitted',
        description: 'Your request is pending manager approval',
        status: 'success',
        duration: 3000
      });
      
      onTimeOffClose();
      fetchTimeOffRequests();
      fetchVacationBalance();
    } catch (err) {
      toast({
        title: 'Error Submitting Request',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'blue';
      case 'in-progress':
        return 'green';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getSwapStatusColor = (status) => {
    switch (status) {
      case 'pending-driver':
        return 'yellow';
      case 'pending-admin':
        return 'orange';
      case 'approved':
        return 'green';
      case 'denied':
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading && !upcomingShifts.length) {
    return (
      <VStack justify="center" align="center" minH="400px">
        <Spinner size="lg" color="blue.500" />
        <Text>Loading your schedule...</Text>
      </VStack>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg">My Schedule</Heading>
          <Button colorScheme="blue" onClick={fetchAllData} isLoading={loading}>
            Refresh
          </Button>
        </HStack>

        {/* Summary Cards */}
        {vacationBalance && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Stat>
                  <StatLabel>Upcoming Shifts</StatLabel>
                  <StatNumber>{upcomingShifts.length}</StatNumber>
                  <StatHelpText>Next 90 days</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Stat>
                  <StatLabel>Vacation Days Available</StatLabel>
                  <StatNumber>{vacationBalance.available}</StatNumber>
                  <StatHelpText>Used {vacationBalance.used} of {vacationBalance.total}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Stat>
                  <StatLabel>Pending Requests</StatLabel>
                  <StatNumber>
                    {swapRequests.filter(s => 
                      s.status === 'pending-driver' && s.targetDriver._id === driverId
                    ).length + timeOffRequests.filter(t => t.status === 'pending').length}
                  </StatNumber>
                  <StatHelpText>Awaiting your action</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>Upcoming Shifts ({upcomingShifts.length})</Tab>
            <Tab>Swap Requests ({swapRequests.length})</Tab>
            <Tab>Time-Off ({timeOffRequests.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Upcoming Shifts */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Next Shifts</Heading>
                  <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={onTimeOffOpen}>
                    Request Time-Off
                  </Button>
                </HStack>

                {upcomingShifts.length > 0 ? (
                  <VStack spacing={3} align="stretch">
                    {upcomingShifts.map((shift) => (
                      <Card key={shift._id} bg={bgColor} borderColor={borderColor} borderWidth={1}>
                        <CardBody>
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={2}>
                              <HStack>
                                <CalendarIcon color="blue.500" />
                                <Heading size="sm">{formatDate(shift.startTime)}</Heading>
                              </HStack>
                              <HStack>
                                <TimeIcon color="gray.500" />
                                <Text>
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </Text>
                              </HStack>
                              <Badge colorScheme={getStatusColor(shift.status)}>
                                {shift.status}
                              </Badge>
                            </VStack>
                            <Button
                              colorScheme="orange"
                              size="sm"
                              onClick={() => handleRequestSwap(shift)}
                            >
                              Request Swap
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    No upcoming shifts scheduled
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* Swap Requests */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Shift Swap Requests</Heading>

                {swapRequests.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Other Driver</Th>
                          <Th>Type</Th>
                          <Th>Status</Th>
                          <Th>Reason</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {swapRequests.map((swap) => {
                          const isAwaitingMyResponse = 
                            swap.status === 'pending-driver' && 
                            swap.targetDriver._id === driverId;

                          return (
                            <Tr key={swap._id} _hover={{ bg: hoverBg }}>
                              <Td fontWeight="bold">
                                {swap.requestingDriver?.firstName} {swap.requestingDriver?.lastName}
                              </Td>
                              <Td>
                                <Badge colorScheme="blue">{swap.swapType}</Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={getSwapStatusColor(swap.status)}>
                                  {swap.status}
                                </Badge>
                              </Td>
                              <Td fontSize="sm">{swap.reason}</Td>
                              <Td>
                                {isAwaitingMyResponse ? (
                                  <HStack spacing={2}>
                                    <Button
                                      size="sm"
                                      colorScheme="green"
                                      variant="outline"
                                      onClick={() => handleApproveSwap(swap._id)}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      onClick={() => handleDenySwap(swap._id)}
                                    >
                                      Decline
                                    </Button>
                                  </HStack>
                                ) : (
                                  <Text fontSize="xs" color="gray.500">
                                    {swap.status}
                                  </Text>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    No swap requests at this time
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* Time-Off Requests */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Time-Off Requests</Heading>
                  <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={onTimeOffOpen}>
                    New Request
                  </Button>
                </HStack>

                {timeOffRequests.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Type</Th>
                          <Th>Date Range</Th>
                          <Th>Days</Th>
                          <Th>Status</Th>
                          <Th>Notes</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {timeOffRequests.map((timeOff) => (
                          <Tr key={timeOff._id} _hover={{ bg: hoverBg }}>
                            <Td fontWeight="bold">{timeOff.type}</Td>
                            <Td fontSize="sm">
                              {formatDate(timeOff.startDate)} - {formatDate(timeOff.endDate)}
                            </Td>
                            <Td>{timeOff.totalDays}</Td>
                            <Td>
                              <Badge colorScheme={
                                timeOff.status === 'approved' ? 'green' :
                                timeOff.status === 'pending' ? 'yellow' :
                                'red'
                              }>
                                {timeOff.status}
                              </Badge>
                            </Td>
                            <Td fontSize="sm">{timeOff.reason || '-'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    No time-off requests submitted
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Select Driver Modal for Swap */}
      <Modal isOpen={isDriverSelectOpen} onClose={onDriverSelectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Driver to Swap With</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} maxH="400px" overflowY="auto">
              {availableDrivers.length > 0 ? (
                availableDrivers.map(driver => (
                  <Card
                    key={driver._id}
                    w="100%"
                    cursor="pointer"
                    _hover={{ shadow: 'md' }}
                    onClick={() => {
                      setSelectedDriver(driver);
                      onDriverSelectClose();
                      onSwapOpen();
                    }}
                  >
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{driver.firstName} {driver.lastName}</Text>
                          <Text fontSize="xs" color="gray.500">{driver.email}</Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Text>No drivers available</Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Shift Swap Modal */}
      {selectedDriver && selectedShift && (
        <ShiftSwapModal
          isOpen={isSwapOpen}
          onClose={onSwapClose}
          requestingDriver={{firstName: 'You'}}
          targetDriver={selectedDriver}
          originalShift={selectedShift}
          onSubmit={handleSubmitSwap}
        />
      )}

      {/* Time-Off Modal */}
      <TimeOffRequestModal
        isOpen={isTimeOffOpen}
        onClose={onTimeOffClose}
        driverId={driverId}
        vacationBalance={vacationBalance}
        onSubmit={handleSubmitTimeOff}
      />
    </Box>
  );
};

export default DriverScheduleView;
