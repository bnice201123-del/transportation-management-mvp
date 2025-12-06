import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  Flex,
  Tooltip,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { 
  FaDesktop, 
  FaMobile, 
  FaTablet, 
  FaExclamationTriangle, 
  FaChartLine, 
  FaSync, 
  FaBan,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaShieldAlt
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SessionManager = () => {
  const [statistics, setStatistics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [suspiciousSessions, setSuspiciousSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    isActive: '',
    isSuspicious: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  
  const toast = useToast();
  const { isOpen: isUserModalOpen, onOpen: onUserModalOpen, onClose: onUserModalClose } = useDisclosure();
  const { isOpen: isSessionModalOpen, onOpen: onSessionModalOpen, onClose: onSessionModalClose } = useDisclosure();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, filters, pagination.page]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch statistics
      const statsRes = await axios.get(`${API_URL}/api/sessions/admin/stats`, config);
      setStatistics(statsRes.data);

      // Fetch sessions with filters
      const sessionsRes = await axios.get(`${API_URL}/api/sessions/admin/all`, {
        ...config,
        params: { ...filters, page: pagination.page, limit: pagination.limit }
      });
      setSessions(sessionsRes.data.sessions);
      setPagination(sessionsRes.data.pagination);

      // Fetch suspicious sessions
      const suspiciousRes = await axios.get(`${API_URL}/api/sessions/admin/suspicious`, config);
      setSuspiciousSessions(suspiciousRes.data.sessions);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch session data',
        status: 'error',
        duration: 5000
      });
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId, username) => {
    if (!confirm(`Revoke session for ${username}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/sessions/admin/revoke/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: 'admin-revoke' }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Session revoked successfully',
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to revoke session',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleRevokeAllUserSessions = async (userId, username) => {
    if (!confirm(`Revoke ALL sessions for ${username}? This will force them to log in again.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/sessions/admin/revoke-all/${userId}`,
        { reason: 'admin-revoke' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: 'All user sessions revoked successfully',
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to revoke sessions',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Clean up sessions older than 30 days?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/sessions/admin/cleanup`,
        { daysOld: 30 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: `Cleaned up ${res.data.deletedCount} old sessions`,
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cleanup sessions',
        status: 'error',
        duration: 5000
      });
    }
  };

  const viewUserSessions = async (userId, username) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/sessions/admin/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedUser({ ...res.data, username });
      onUserModalOpen();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user sessions',
        status: 'error',
        duration: 5000
      });
    }
  };

  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return FaDesktop;
    if (deviceInfo.isMobile) return FaMobile;
    if (deviceInfo.isTablet) return FaTablet;
    return FaDesktop;
  };

  const getStatusColor = (session) => {
    if (session.revokedAt) return 'red';
    if (new Date(session.expiresAt) < new Date()) return 'orange';
    if (!session.isActive) return 'gray';
    return 'green';
  };

  const getStatusLabel = (session) => {
    if (session.revokedAt) return 'Revoked';
    if (new Date(session.expiresAt) < new Date()) return 'Expired';
    if (!session.isActive) return 'Inactive';
    return 'Active';
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatLastActivity = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diff = now - activityDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack>
            <Icon as={FaShieldAlt} boxSize={6} color="blue.500" />
            <Heading size="lg">Session Management</Heading>
          </HStack>
          <HStack>
            <Select
              size="sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              w="150px"
            >
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </Select>
            <Button
              leftIcon={<FaSync />}
              size="sm"
              onClick={fetchData}
              colorScheme="blue"
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleCleanup}
              variant="outline"
            >
              Cleanup Old
            </Button>
          </HStack>
        </HStack>

        {/* Suspicious Sessions Alert */}
        {suspiciousSessions.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Suspicious Activity Detected!</AlertTitle>
            <AlertDescription>
              {suspiciousSessions.length} suspicious session{suspiciousSessions.length > 1 ? 's' : ''} detected
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Sessions</StatLabel>
                  <StatNumber>{statistics.total}</StatNumber>
                  <StatHelpText>All time</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Sessions</StatLabel>
                  <StatNumber color="green.500">{statistics.active}</StatNumber>
                  <StatHelpText>Currently active</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Revoked</StatLabel>
                  <StatNumber color="red.500">{statistics.revoked}</StatNumber>
                  <StatHelpText>Manually revoked</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Expired</StatLabel>
                  <StatNumber color="orange.500">{statistics.expired}</StatNumber>
                  <StatHelpText>Naturally expired</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Suspicious</StatLabel>
                  <StatNumber color="red.500">{statistics.suspicious}</StatNumber>
                  <StatHelpText>Flagged sessions</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab><Icon as={FaChartLine} mr={2} />Overview</Tab>
            <Tab><Icon as={FaShieldAlt} mr={2} />All Sessions</Tab>
            <Tab><Icon as={FaExclamationTriangle} mr={2} />Suspicious</Tab>
          </TabList>

          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {/* By Login Method */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">By Login Method</Heading>
                    </CardHeader>
                    <CardBody>
                      {statistics?.byLoginMethod?.length > 0 ? (
                        <VStack align="stretch" spacing={2}>
                          {statistics.byLoginMethod.map((item) => (
                            <HStack key={item._id} justify="space-between">
                              <Text textTransform="capitalize">{item._id?.replace('-', ' ') || 'Unknown'}</Text>
                              <Badge colorScheme="blue">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      ) : (
                        <Text color="gray.500">No data</Text>
                      )}
                    </CardBody>
                  </Card>

                  {/* By Device */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">By Device Type</Heading>
                    </CardHeader>
                    <CardBody>
                      {statistics?.byDevice?.length > 0 ? (
                        <VStack align="stretch" spacing={2}>
                          {statistics.byDevice.map((item) => (
                            <HStack key={item._id} justify="space-between">
                              <HStack>
                                <Icon as={item._id === 'Mobile' ? FaMobile : item._id === 'Tablet' ? FaTablet : FaDesktop} />
                                <Text>{item._id || 'Unknown'}</Text>
                              </HStack>
                              <Badge colorScheme="purple">{item.count}</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      ) : (
                        <Text color="gray.500">No data</Text>
                      )}
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Top Users */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Most Active Users</Heading>
                  </CardHeader>
                  <CardBody>
                    {statistics?.topUsers?.length > 0 ? (
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>User</Th>
                            <Th>Username</Th>
                            <Th isNumeric>Sessions</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {statistics.topUsers.map((user) => (
                            <Tr key={user._id}>
                              <Td>{user.name}</Td>
                              <Td>
                                <Badge colorScheme="blue">{user.username}</Badge>
                              </Td>
                              <Td isNumeric fontWeight="bold">{user.count}</Td>
                              <Td>
                                <Button
                                  size="xs"
                                  onClick={() => viewUserSessions(user._id, user.username)}
                                  colorScheme="blue"
                                  variant="ghost"
                                >
                                  View
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Text color="gray.500">No data</Text>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* All Sessions Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Filters */}
                <Card>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Status</FormLabel>
                        <Select
                          size="sm"
                          value={filters.isActive}
                          onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                        >
                          <option value="">All</option>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Suspicious</FormLabel>
                        <Select
                          size="sm"
                          value={filters.isSuspicious}
                          onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value })}
                        >
                          <option value="">All</option>
                          <option value="true">Suspicious Only</option>
                          <option value="false">Normal Only</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Start Date</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">End Date</FormLabel>
                        <Input
                          size="sm"
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Sessions Table */}
                <Card>
                  <CardBody overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>User</Th>
                          <Th>Device</Th>
                          <Th>IP Address</Th>
                          <Th>Created</Th>
                          <Th>Last Activity</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sessions.map((session) => (
                          <Tr key={session._id} bg={session.isSuspicious ? 'red.50' : undefined}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold">
                                  {session.userId?.firstName} {session.userId?.lastName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  @{session.userId?.username}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <HStack>
                                <Icon as={getDeviceIcon(session.deviceInfo)} />
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs">{session.deviceInfo?.device}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {session.deviceInfo?.browser} / {session.deviceInfo?.os}
                                  </Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td fontSize="xs">{session.ipAddress}</Td>
                            <Td fontSize="xs">{new Date(session.createdAt).toLocaleString()}</Td>
                            <Td fontSize="xs">{formatLastActivity(session.lastActivity)}</Td>
                            <Td>
                              <HStack>
                                <Badge colorScheme={getStatusColor(session)}>
                                  {getStatusLabel(session)}
                                </Badge>
                                {session.isSuspicious && (
                                  <Tooltip label={session.suspiciousReasons?.join(', ')}>
                                    <Badge colorScheme="red">
                                      <Icon as={FaExclamationTriangle} />
                                    </Badge>
                                  </Tooltip>
                                )}
                              </HStack>
                            </Td>
                            <Td>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FaEllipsisV />}
                                  size="xs"
                                  variant="ghost"
                                />
                                <MenuList>
                                  <MenuItem
                                    onClick={() => viewUserSessions(session.userId._id, session.userId.username)}
                                  >
                                    View All User Sessions
                                  </MenuItem>
                                  {session.isActive && !session.revokedAt && (
                                    <MenuItem
                                      onClick={() => handleRevokeSession(session._id, session.userId.username)}
                                      color="red.500"
                                    >
                                      Revoke Session
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    onClick={() => handleRevokeAllUserSessions(session.userId._id, session.userId.username)}
                                    color="red.600"
                                  >
                                    Revoke All User Sessions
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <HStack justify="center" mt={4} spacing={2}>
                        <Button
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                          isDisabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <Text fontSize="sm">
                          Page {pagination.page} of {pagination.pages}
                        </Text>
                        <Button
                          size="sm"
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                          isDisabled={pagination.page === pagination.pages}
                        >
                          Next
                        </Button>
                      </HStack>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Suspicious Sessions Tab */}
            <TabPanel>
              <Card>
                <CardBody>
                  {suspiciousSessions.length > 0 ? (
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>User</Th>
                          <Th>Device</Th>
                          <Th>IP Address</Th>
                          <Th>Reasons</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {suspiciousSessions.map((session) => (
                          <Tr key={session._id} bg="red.50">
                            <Td>
                              <Text fontWeight="bold">
                                {session.userId?.firstName} {session.userId?.lastName}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                @{session.userId?.username}
                              </Text>
                            </Td>
                            <Td>
                              <HStack>
                                <Icon as={getDeviceIcon(session.deviceInfo)} />
                                <Text fontSize="sm">{session.deviceInfo?.device}</Text>
                              </HStack>
                            </Td>
                            <Td fontSize="sm">{session.ipAddress}</Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                {session.suspiciousReasons?.map((reason, idx) => (
                                  <Badge key={idx} colorScheme="red" fontSize="xs">
                                    {reason.replace('-', ' ')}
                                  </Badge>
                                ))}
                              </VStack>
                            </Td>
                            <Td fontSize="sm">{new Date(session.createdAt).toLocaleString()}</Td>
                            <Td>
                              <HStack>
                                <Button
                                  size="xs"
                                  onClick={() => viewUserSessions(session.userId._id, session.userId.username)}
                                  colorScheme="blue"
                                >
                                  View All
                                </Button>
                                {session.isActive && (
                                  <Button
                                    size="xs"
                                    onClick={() => handleRevokeSession(session._id, session.userId.username)}
                                    colorScheme="red"
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert status="success">
                      <AlertIcon />
                      No suspicious sessions detected
                    </Alert>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* User Sessions Modal */}
      <Modal isOpen={isUserModalOpen} onClose={onUserModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sessions for {selectedUser?.username}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack align="stretch" spacing={4}>
                {/* Anomalies */}
                {selectedUser.anomalies?.length > 0 && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Anomalies Detected</AlertTitle>
                      <AlertDescription>
                        <VStack align="start" mt={2} spacing={1}>
                          {selectedUser.anomalies.map((anomaly, idx) => (
                            <Text key={idx} fontSize="sm">
                              • {anomaly.description}
                            </Text>
                          ))}
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Sessions List */}
                <Box maxH="400px" overflowY="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Device</Th>
                        <Th>IP</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedUser.sessions?.map((session) => (
                        <Tr key={session._id}>
                          <Td>
                            <HStack>
                              <Icon as={getDeviceIcon(session.deviceInfo)} />
                              <Text fontSize="xs">{session.deviceInfo?.device}</Text>
                            </HStack>
                          </Td>
                          <Td fontSize="xs">{session.ipAddress}</Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(session)}>
                              {getStatusLabel(session)}
                            </Badge>
                          </Td>
                          <Td fontSize="xs">{new Date(session.createdAt).toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUserModalClose}>
              Close
            </Button>
            {selectedUser && (
              <Button
                colorScheme="red"
                onClick={() => {
                  handleRevokeAllUserSessions(selectedUser.sessions[0]?.userId._id, selectedUser.username);
                  onUserModalClose();
                }}
              >
                Revoke All Sessions
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SessionManager;
