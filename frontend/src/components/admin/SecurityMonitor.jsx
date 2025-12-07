/**
 * Security Monitor Component
 * 
 * Real-time security monitoring dashboard for viewing and managing security alerts.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  IconButton,
  Tooltip,
  Textarea,
  FormControl,
  FormLabel,
  Divider,
  Progress,
  Wrap,
  WrapItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  FaShieldAlt,
  FaSync,
  FaCheck,
  FaTimes,
  FaSearch,
  FaExclamationTriangle,
  FaEye,
  FaBan,
  FaPlay,
  FaEdit,
  FaFilter,
  FaChartLine,
  FaBell
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const SecurityMonitor = () => {
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    status: '',
    search: ''
  });
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const toast = useToast();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isResolveOpen, onOpen: onResolveOpen, onClose: onResolveClose } = useDisclosure();
  const { isOpen: isFalsePositiveOpen, onOpen: onFalsePositiveOpen, onClose: onFalsePositiveClose } = useDisclosure();

  const [resolveData, setResolveData] = useState({ findings: '', recommendations: '' });
  const [falsePositiveReason, setFalsePositiveReason] = useState('');

  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
    fetchDashboard();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAlerts();
        fetchDashboard();
      }, 30000); // 30 seconds
      setRefreshInterval(interval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, filters, timeRange]);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(
        `${API_URL}/security/alerts?${params.toString()}`,
        getAuthHeader()
      );
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/security/statistics?timeRange=${timeRange}`,
        getAuthHeader()
      );
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/security/dashboard`, getAuthHeader());
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchAlertDetails = async (alertId) => {
    try {
      const response = await axios.get(`${API_URL}/security/alerts/${alertId}`, getAuthHeader());
      setSelectedAlert(response.data.alert);
      onDetailOpen();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch alert details',
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleAcknowledge = async (alertId) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/security/alerts/${alertId}/acknowledge`, {}, getAuthHeader());
      toast({
        title: 'Success',
        description: 'Alert acknowledged',
        status: 'success',
        duration: 3000
      });
      fetchAlerts();
      fetchDashboard();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartInvestigation = async (alertId) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/security/alerts/${alertId}/investigate`, {}, getAuthHeader());
      toast({
        title: 'Success',
        description: 'Investigation started',
        status: 'success',
        duration: 3000
      });
      fetchAlerts();
      fetchDashboard();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start investigation',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/security/alerts/${selectedAlert.alertId}/resolve`,
        resolveData,
        getAuthHeader()
      );
      toast({
        title: 'Success',
        description: 'Alert resolved',
        status: 'success',
        duration: 3000
      });
      onResolveClose();
      onDetailClose();
      setResolveData({ findings: '', recommendations: '' });
      fetchAlerts();
      fetchDashboard();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFalsePositive = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/security/alerts/${selectedAlert.alertId}/false-positive`,
        { reason: falsePositiveReason },
        getAuthHeader()
      );
      toast({
        title: 'Success',
        description: 'Marked as false positive',
        status: 'success',
        duration: 3000
      });
      onFalsePositiveClose();
      onDetailClose();
      setFalsePositiveReason('');
      fetchAlerts();
      fetchDashboard();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as false positive',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectAnomalies = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/security/detect-anomalies`, {}, getAuthHeader());
      toast({
        title: 'Success',
        description: `Created ${response.data.alertsCreated} new alerts`,
        status: 'success',
        duration: 5000
      });
      fetchAlerts();
      fetchDashboard();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to detect anomalies',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'blue',
      info: 'gray'
    };
    return colors[severity] || 'gray';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'red',
      acknowledged: 'yellow',
      investigating: 'blue',
      resolved: 'green',
      false_positive: 'gray',
      ignored: 'gray'
    };
    return colors[status] || 'gray';
  };

  return (
    <Box>
      <Tabs colorScheme="blue">
        <TabList>
          <Tab><HStack><FaShieldAlt /><Text>Dashboard</Text></HStack></Tab>
          <Tab><HStack><FaBell /><Text>Active Alerts</Text></HStack></Tab>
          <Tab><HStack><FaChartLine /><Text>Statistics</Text></HStack></Tab>
        </TabList>

        <TabPanels>
          {/* Dashboard Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Security Dashboard</Heading>
                <HStack>
                  <Tooltip label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}>
                    <IconButton
                      icon={<FaSync />}
                      size="sm"
                      colorScheme={autoRefresh ? 'green' : 'gray'}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    />
                  </Tooltip>
                  <Button
                    leftIcon={<FaSync />}
                    size="sm"
                    onClick={() => {
                      fetchAlerts();
                      fetchDashboard();
                      fetchStatistics();
                    }}
                    isDisabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftIcon={<FaSearch />}
                    size="sm"
                    colorScheme="purple"
                    onClick={handleDetectAnomalies}
                    isLoading={loading}
                  >
                    Detect Anomalies
                  </Button>
                </HStack>
              </HStack>

              {dashboard && (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Active Alerts</StatLabel>
                          <StatNumber color="red.500">{dashboard.summary.activeAlerts}</StatNumber>
                          <StatHelpText>
                            <StatArrow type={dashboard.summary.trend > 0 ? 'increase' : 'decrease'} />
                            {Math.abs(dashboard.summary.trend)}%
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Critical Alerts</StatLabel>
                          <StatNumber color="red.600">{dashboard.summary.criticalAlerts}</StatNumber>
                          <StatHelpText>Requires immediate attention</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Alerts (Last Hour)</StatLabel>
                          <StatNumber>{dashboard.summary.alertsLastHour}</StatNumber>
                          <StatHelpText>Recent activity</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Active Sessions</StatLabel>
                          <StatNumber color="green.500">{dashboard.summary.activeSessions}</StatNumber>
                          <StatHelpText>{dashboard.summary.recentFailedLogins} failed logins</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {dashboard.criticalAlerts.length > 0 && (
                    <Alert status="error">
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>Critical Alerts Detected!</AlertTitle>
                        <AlertDescription>
                          {dashboard.criticalAlerts.length} critical security alert(s) require immediate attention.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}

                  {/* Critical Alerts */}
                  {dashboard.criticalAlerts.length > 0 && (
                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4}>Critical Alerts</Heading>
                        <VStack spacing={3} align="stretch">
                          {dashboard.criticalAlerts.map((alert) => (
                            <Box
                              key={alert._id}
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor="red.300"
                              bg="red.50"
                              cursor="pointer"
                              onClick={() => fetchAlertDetails(alert.alertId)}
                            >
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Badge colorScheme="red">CRITICAL</Badge>
                                    <Badge colorScheme={getStatusColor(alert.status)}>
                                      {alert.status}
                                    </Badge>
                                    <Text fontWeight="bold">{alert.title}</Text>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {alert.description}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(alert.createdAt).toLocaleString()}
                                  </Text>
                                </VStack>
                                <FaExclamationTriangle size={24} color="red" />
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Top Threats */}
                  {dashboard.topThreats && dashboard.topThreats.length > 0 && (
                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4}>Top Threats (Last 7 Days)</Heading>
                        <VStack spacing={3} align="stretch">
                          {dashboard.topThreats.map((threat, index) => (
                            <Box key={index}>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {threat._id.replace(/_/g, ' ').toUpperCase()}
                                </Text>
                                <Badge colorScheme="red">{threat.count}</Badge>
                              </HStack>
                              <Progress
                                value={(threat.count / dashboard.topThreats[0].count) * 100}
                                colorScheme="red"
                                size="sm"
                              />
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}

              {!dashboard && (
                <Center py={10}>
                  <Spinner size="xl" />
                </Center>
              )}
            </VStack>
          </TabPanel>

          {/* Active Alerts Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Active Security Alerts</Heading>
                <Button
                  leftIcon={<FaSync />}
                  size="sm"
                  onClick={fetchAlerts}
                  isDisabled={loading}
                >
                  Refresh
                </Button>
              </HStack>

              {/* Filters */}
              <Card>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Severity</FormLabel>
                      <Select
                        size="sm"
                        value={filters.severity}
                        onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="info">Info</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Status</FormLabel>
                      <Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Type</FormLabel>
                      <Select
                        size="sm"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="brute_force_attack">Brute Force</option>
                        <option value="rate_limit_exceeded">Rate Limit</option>
                        <option value="unauthorized_access">Unauthorized Access</option>
                        <option value="session_anomaly">Session Anomaly</option>
                        <option value="permission_violation">Permission Violation</option>
                        <option value="data_exfiltration">Data Exfiltration</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Search</FormLabel>
                      <Input
                        size="sm"
                        placeholder="Search alerts..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Alerts Table */}
              <Card>
                <CardBody>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Severity</Th>
                        <Th>Type</Th>
                        <Th>Title</Th>
                        <Th>Status</Th>
                        <Th>Time</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {alerts.map((alert) => (
                        <Tr key={alert._id}>
                          <Td>
                            <Badge colorScheme={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="xs">
                              {alert.type.replace(/_/g, ' ')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium">
                              {alert.title}
                            </Text>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="xs">
                              {new Date(alert.createdAt).toLocaleString()}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <Tooltip label="View Details">
                                <IconButton
                                  icon={<FaEye />}
                                  size="xs"
                                  onClick={() => fetchAlertDetails(alert.alertId)}
                                />
                              </Tooltip>
                              {alert.status === 'active' && (
                                <Tooltip label="Acknowledge">
                                  <IconButton
                                    icon={<FaCheck />}
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAcknowledge(alert.alertId)}
                                  />
                                </Tooltip>
                              )}
                              {alert.status === 'acknowledged' && (
                                <Tooltip label="Start Investigation">
                                  <IconButton
                                    icon={<FaPlay />}
                                    size="xs"
                                    colorScheme="blue"
                                    onClick={() => handleStartInvestigation(alert.alertId)}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {alerts.length === 0 && (
                    <Center py={10}>
                      <VStack>
                        <FaShieldAlt size={48} color="gray" />
                        <Text color="gray.500">No alerts found</Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Statistics Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Security Statistics</Heading>
                <Select
                  size="sm"
                  width="150px"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </Select>
              </HStack>

              {statistics && (
                <>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Alerts</StatLabel>
                          <StatNumber>{statistics.summary.total}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Active</StatLabel>
                          <StatNumber color="red.500">{statistics.summary.active}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Critical</StatLabel>
                          <StatNumber color="red.600">{statistics.summary.critical}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Resolved</StatLabel>
                          <StatNumber color="green.500">{statistics.summary.resolved}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Resolution Rate</StatLabel>
                          <StatNumber>{statistics.summary.resolutionRate}%</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Avg Resolution Time</StatLabel>
                          <StatNumber>{statistics.summary.avgResolutionTime} min</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* By Severity */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Alerts by Severity</Heading>
                      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                        {Object.entries(statistics.bySeverity).map(([severity, count]) => (
                          <Box key={severity} textAlign="center">
                            <Badge
                              colorScheme={getSeverityColor(severity)}
                              fontSize="lg"
                              p={2}
                            >
                              {count}
                            </Badge>
                            <Text fontSize="sm" mt={2}>
                              {severity.toUpperCase()}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* By Type */}
                  {statistics.byType.length > 0 && (
                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4}>Alerts by Type</Heading>
                        <VStack spacing={2} align="stretch">
                          {statistics.byType.map((item) => (
                            <Box key={item.type}>
                              <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm">
                                  {item.type.replace(/_/g, ' ').toUpperCase()}
                                </Text>
                                <Badge>{item.count}</Badge>
                              </HStack>
                              <Progress
                                value={(item.count / statistics.byType[0].count) * 100}
                                colorScheme="blue"
                                size="sm"
                              />
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Badge colorScheme={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
                <Text>{selectedAlert.title}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Description</Text>
                  <Text fontSize="sm">{selectedAlert.description}</Text>
                </Box>

                <Divider />

                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Alert ID</Text>
                    <Text fontSize="sm">{selectedAlert.alertId}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedAlert.status)}>
                      {selectedAlert.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Type</Text>
                    <Text fontSize="sm">{selectedAlert.type.replace(/_/g, ' ')}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Source</Text>
                    <Text fontSize="sm">{selectedAlert.source?.component}</Text>
                  </Box>
                </SimpleGrid>

                {selectedAlert.actor && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={2}>Actor Information</Text>
                      <SimpleGrid columns={2} spacing={2} fontSize="sm">
                        {selectedAlert.actor.username && (
                          <>
                            <Text>Username:</Text>
                            <Text>{selectedAlert.actor.username}</Text>
                          </>
                        )}
                        {selectedAlert.actor.ipAddress && (
                          <>
                            <Text>IP Address:</Text>
                            <Text>{selectedAlert.actor.ipAddress}</Text>
                          </>
                        )}
                        {selectedAlert.actor.role && (
                          <>
                            <Text>Role:</Text>
                            <Text>{selectedAlert.actor.role}</Text>
                          </>
                        )}
                      </SimpleGrid>
                    </Box>
                  </>
                )}

                <Divider />

                <SimpleGrid columns={2} spacing={4} fontSize="sm">
                  <Box>
                    <Text fontWeight="bold">First Occurrence</Text>
                    <Text>{new Date(selectedAlert.firstOccurrence).toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Last Occurrence</Text>
                    <Text>{new Date(selectedAlert.lastOccurrence).toLocaleString()}</Text>
                  </Box>
                </SimpleGrid>

                {selectedAlert.metrics && selectedAlert.metrics.count > 1 && (
                  <Alert status="warning" fontSize="sm">
                    <AlertIcon />
                    This alert has occurred {selectedAlert.metrics.count} times
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={2}>
                {selectedAlert.status === 'active' && (
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => {
                      onDetailClose();
                      handleAcknowledge(selectedAlert.alertId);
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                {selectedAlert.status === 'acknowledged' && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => {
                      onDetailClose();
                      handleStartInvestigation(selectedAlert.alertId);
                    }}
                  >
                    Start Investigation
                  </Button>
                )}
                {['acknowledged', 'investigating'].includes(selectedAlert.status) && (
                  <>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => {
                        onDetailClose();
                        onResolveOpen();
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={() => {
                        onDetailClose();
                        onFalsePositiveOpen();
                      }}
                    >
                      False Positive
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={onDetailClose}>
                  Close
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Resolve Modal */}
      <Modal isOpen={isResolveOpen} onClose={onResolveClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Resolve Alert</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Findings</FormLabel>
                <Textarea
                  placeholder="Describe your findings..."
                  value={resolveData.findings}
                  onChange={(e) => setResolveData({ ...resolveData, findings: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Recommendations</FormLabel>
                <Textarea
                  placeholder="Security recommendations..."
                  value={resolveData.recommendations}
                  onChange={(e) => setResolveData({ ...resolveData, recommendations: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onResolveClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleResolve} isLoading={loading}>
              Resolve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* False Positive Modal */}
      <Modal isOpen={isFalsePositiveOpen} onClose={onFalsePositiveClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mark as False Positive</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Reason</FormLabel>
              <Textarea
                placeholder="Explain why this is a false positive..."
                value={falsePositiveReason}
                onChange={(e) => setFalsePositiveReason(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFalsePositiveClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleMarkFalsePositive}
              isLoading={loading}
              isDisabled={!falsePositiveReason}
            >
              Mark False Positive
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SecurityMonitor;
