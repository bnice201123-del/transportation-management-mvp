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
  Select,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Checkbox,
  Text
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, TimeIcon, ChevronDownIcon } from '@chakra-ui/icons';
import ShiftSwapModal from './ShiftSwapModal';
import TimeOffRequestModal from './TimeOffRequestModal';

const ManagerScheduleManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [swapRequests, setSwapRequests] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const toast = useToast();
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSwapRequests(),
        fetchTimeOffRequests(),
        fetchSchedules()
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

  const fetchSwapRequests = async () => {
    const response = await fetch('/api/swap-requests/driver/all?type=all', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch swap requests');
    const data = await response.json();
    setSwapRequests(data);
  };

  const fetchTimeOffRequests = async () => {
    const response = await fetch('/api/time-off/requests/pending', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch time-off requests');
    const data = await response.json();
    setTimeOffRequests(data);
  };

  const fetchSchedules = async () => {
    const response = await fetch('/api/schedules?limit=50&status=scheduled', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Failed to fetch schedules');
    const data = await response.json();
    setSchedules(data.schedules || []);
  };

  // Swap Request Handlers
  const handleApproveSwap = async (swapId) => {
    try {
      const response = await fetch(`/api/swap-request/${swapId}/admin-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Approved by manager'
        })
      });

      if (!response.ok) throw new Error('Failed to approve swap');
      
      toast({
        title: 'Swap Approved',
        description: 'Shifts have been swapped between drivers',
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
      const response = await fetch(`/api/swap-request/${swapId}/admin-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'denied',
          notes: 'Denied by manager'
        })
      });

      if (!response.ok) throw new Error('Failed to deny swap');
      
      toast({
        title: 'Swap Denied',
        status: 'success',
        duration: 3000
      });
      
      fetchSwapRequests();
    } catch (err) {
      toast({
        title: 'Error Denying Swap',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Time-Off Handlers
  const handleApproveTimeOff = async (timeOffId) => {
    try {
      const response = await fetch(`/api/time-off/${timeOffId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'approved',
          notes: 'Approved by manager'
        })
      });

      if (!response.ok) throw new Error('Failed to approve time-off');
      
      toast({
        title: 'Time-Off Approved',
        description: 'Vacation balance has been deducted',
        status: 'success',
        duration: 3000
      });
      
      fetchTimeOffRequests();
    } catch (err) {
      toast({
        title: 'Error Approving Time-Off',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleDenyTimeOff = async (timeOffId) => {
    try {
      const response = await fetch(`/api/time-off/${timeOffId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'denied',
          notes: 'Denied by manager'
        })
      });

      if (!response.ok) throw new Error('Failed to deny time-off');
      
      toast({
        title: 'Time-Off Denied',
        status: 'success',
        duration: 3000
      });
      
      fetchTimeOffRequests();
    } catch (err) {
      toast({
        title: 'Error Denying Time-Off',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Bulk Actions
  const handleBulkApproveSwaps = async () => {
    for (const swapId of selectedRequests) {
      await handleApproveSwap(swapId);
    }
    setSelectedRequests([]);
  };

  const handleBulkDenySwaps = async () => {
    for (const swapId of selectedRequests) {
      await handleDenySwap(swapId);
    }
    setSelectedRequests([]);
  };

  const toggleRequestSelection = (requestId) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const _formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending-driver':
      case 'pending':
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'vacation':
        return 'blue';
      case 'sick':
        return 'red';
      case 'personal':
        return 'purple';
      case 'unpaid':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Filter functions
  const filteredSwaps = swapRequests.filter(swap => {
    if (filterStatus !== 'all' && swap.status !== filterStatus) return false;
    return true;
  });

  const filteredTimeOff = timeOffRequests.filter(timeOff => {
    if (filterStatus !== 'all' && timeOff.status !== filterStatus) return false;
    if (filterType !== 'all' && timeOff.type !== filterType) return false;
    return true;
  });

  if (loading && !swapRequests.length && !timeOffRequests.length) {
    return (
      <VStack justify="center" align="center" minH="400px">
        <Spinner size="lg" color="blue.500" />
        <Text>Loading schedule data...</Text>
      </VStack>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg">Schedule Management</Heading>
          <Button colorScheme="blue" onClick={fetchAllData} isLoading={loading}>
            Refresh Data
          </Button>
        </HStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0}>
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </VStack>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue">
          <TabList>
            <Tab>
              Shift Swaps ({filteredSwaps.filter(s => s.status === 'pending-admin').length})
            </Tab>
            <Tab>
              Time-Off Requests ({filteredTimeOff.filter(t => t.status === 'pending').length})
            </Tab>
            <Tab>Schedules</Tab>
          </TabList>

          <TabPanels>
            {/* Shift Swaps Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Filters */}
                <HStack spacing={4}>
                  <Select
                    placeholder="Filter by status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    maxW="200px"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending-driver">Pending Driver</option>
                    <option value="pending-admin">Pending Admin</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </Select>

                  {selectedRequests.length > 0 && (
                    <HStack>
                      <Text fontWeight="bold">{selectedRequests.length} selected</Text>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<CheckIcon />}
                        onClick={handleBulkApproveSwaps}
                      >
                        Approve All
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        leftIcon={<CloseIcon />}
                        onClick={handleBulkDenySwaps}
                      >
                        Deny All
                      </Button>
                    </HStack>
                  )}
                </HStack>

                {/* Swaps Table */}
                {filteredSwaps.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th width="40px">
                            <Checkbox
                              isChecked={selectedRequests.length === filteredSwaps.length && filteredSwaps.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRequests(filteredSwaps.map(s => s._id));
                                } else {
                                  setSelectedRequests([]);
                                }
                              }}
                            />
                          </Th>
                          <Th>Requesting Driver</Th>
                          <Th>Target Driver</Th>
                          <Th>Swap Type</Th>
                          <Th>Status</Th>
                          <Th>Reason</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredSwaps.map((swap) => (
                          <Tr key={swap._id} _hover={{ bg: hoverBg }}>
                            <Td>
                              <Checkbox
                                isChecked={selectedRequests.includes(swap._id)}
                                onChange={() => toggleRequestSelection(swap._id)}
                              />
                            </Td>
                            <Td fontWeight="bold">
                              {swap.requestingDriver?.firstName} {swap.requestingDriver?.lastName}
                            </Td>
                            <Td>
                              {swap.targetDriver?.firstName} {swap.targetDriver?.lastName}
                            </Td>
                            <Td>
                              <Badge colorScheme="blue" variant="subtle">
                                {swap.swapType}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(swap.status)}>
                                {swap.status}
                              </Badge>
                            </Td>
                            <Td fontSize="sm">{swap.reason}</Td>
                            <Td>
                              {swap.status === 'pending-admin' && (
                                <HStack spacing={2}>
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="outline"
                                    onClick={() => handleApproveSwap(swap._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={() => handleDenySwap(swap._id)}
                                  >
                                    Deny
                                  </Button>
                                </HStack>
                              )}
                              {swap.status !== 'pending-admin' && (
                                <Text fontSize="xs" color="gray.500">
                                  {swap.status}
                                </Text>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    No shift swap requests to review
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* Time-Off Requests Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Filters */}
                <HStack spacing={4}>
                  <Select
                    placeholder="Filter by status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    maxW="200px"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </Select>

                  <Select
                    placeholder="Filter by type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    maxW="200px"
                  >
                    <option value="all">All Types</option>
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="unpaid">Unpaid</option>
                  </Select>
                </HStack>

                {/* Time-Off Table */}
                {filteredTimeOff.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Driver</Th>
                          <Th>Type</Th>
                          <Th>Date Range</Th>
                          <Th>Days</Th>
                          <Th>Status</Th>
                          <Th>Conflicts</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredTimeOff.map((timeOff) => (
                          <Tr key={timeOff._id} _hover={{ bg: hoverBg }}>
                            <Td fontWeight="bold">
                              {timeOff.driver?.firstName} {timeOff.driver?.lastName}
                            </Td>
                            <Td>
                              <Badge colorScheme={getTypeColor(timeOff.type)}>
                                {timeOff.type}
                              </Badge>
                            </Td>
                            <Td fontSize="sm">
                              {formatDate(timeOff.startDate)} - {formatDate(timeOff.endDate)}
                            </Td>
                            <Td fontWeight="bold">{timeOff.totalDays}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(timeOff.status)}>
                                {timeOff.status}
                              </Badge>
                            </Td>
                            <Td>
                              {timeOff.conflicts && timeOff.conflicts.length > 0 ? (
                                <Badge colorScheme="orange">
                                  {timeOff.conflicts.length} conflicts
                                </Badge>
                              ) : (
                                <Text fontSize="xs" color="gray.500">None</Text>
                              )}
                            </Td>
                            <Td>
                              {timeOff.status === 'pending' && (
                                <HStack spacing={2}>
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="outline"
                                    onClick={() => handleApproveTimeOff(timeOff._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={() => handleDenyTimeOff(timeOff._id)}
                                  >
                                    Deny
                                  </Button>
                                </HStack>
                              )}
                              {timeOff.status !== 'pending' && (
                                <Text fontSize="xs" color="gray.500">
                                  {timeOff.status}
                                </Text>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    No time-off requests to review
                  </Alert>
                )}
              </VStack>
            </TabPanel>

            {/* Schedules Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Active Schedules ({schedules.length})</Heading>
                </HStack>

                {schedules.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Driver</Th>
                          <Th>Date</Th>
                          <Th>Time</Th>
                          <Th>Duration</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {schedules.map((schedule) => {
                          const startTime = new Date(schedule.startTime);
                          const endTime = new Date(schedule.endTime);
                          const duration = (endTime - startTime) / (1000 * 60 * 60);

                          return (
                            <Tr key={schedule._id} _hover={{ bg: hoverBg }}>
                              <Td fontWeight="bold">
                                {schedule.driver?.firstName} {schedule.driver?.lastName}
                              </Td>
                              <Td>{formatDate(schedule.startTime)}</Td>
                              <Td fontSize="sm">
                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -
                                {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </Td>
                              <Td>{duration.toFixed(1)} hrs</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(schedule.status)}>
                                  {schedule.status}
                                </Badge>
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
                    No active schedules
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default ManagerScheduleManagement;
