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
  Spinner
} from '@chakra-ui/react';
import { FaShieldAlt, FaExclamationTriangle, FaChartLine, FaCog, FaSync, FaBan, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const RateLimitMonitor = () => {
  const [statistics, setStatistics] = useState(null);
  const [violations, setViolations] = useState([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    limiterType: '',
    severity: '',
    ipAddress: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [selectedIP, setSelectedIP] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const toast = useToast();
  const { isOpen: isIPModalOpen, onOpen: onIPModalOpen, onClose: onIPModalClose } = useDisclosure();

  // Auto-refresh
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
      const statsRes = await axios.get(`${API_URL}/api/rate-limit/admin/stats`, config);
      setStatistics(statsRes.data);

      // Fetch violations with filters
      const violationsRes = await axios.get(`${API_URL}/api/rate-limit/admin/violations`, {
        ...config,
        params: { ...filters, page: pagination.page, limit: pagination.limit }
      });
      setViolations(violationsRes.data.violations);
      setPagination(violationsRes.data.pagination);

      // Fetch suspicious IPs
      const suspiciousRes = await axios.get(`${API_URL}/api/rate-limit/admin/suspicious-ips`, config);
      setSuspiciousIPs(suspiciousRes.data.suspiciousIPs);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching rate limit data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rate limit data',
        status: 'error',
        duration: 5000
      });
      setLoading(false);
    }
  };

  const handleResetLimit = async (key) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/rate-limit/admin/reset/${encodeURIComponent(key)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: 'Rate limit reset successfully',
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset rate limit',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleCleanup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/rate-limit/admin/cleanup`,
        { daysOld: 30 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Success',
        description: `Cleaned up ${res.data.deletedCount} old violations`,
        status: 'success',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cleanup violations',
        status: 'error',
        duration: 5000
      });
    }
  };

  const viewIPDetails = async (ipAddress) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/rate-limit/admin/violations/ip/${ipAddress}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedIP(res.data);
      onIPModalOpen();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch IP details',
        status: 'error',
        duration: 5000
      });
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getLimiterTypeLabel = (type) => {
    const labels = {
      auth: 'Authentication',
      api: 'API',
      read: 'Read Operations',
      expensive: 'Expensive Operations',
      gdpr: 'GDPR Operations',
      upload: 'File Uploads',
      passwordReset: 'Password Reset',
      twoFactor: 'Two-Factor Auth',
      admin: 'Admin Operations',
      global: 'Global Limit'
    };
    return labels[type] || type;
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
            <Heading size="lg">Rate Limit Monitoring</Heading>
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
              leftIcon={<FaCog />}
              size="sm"
              onClick={handleCleanup}
              variant="outline"
            >
              Cleanup Old Data
            </Button>
          </HStack>
        </HStack>

        {/* Suspicious IPs Alert */}
        {suspiciousIPs.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Suspicious Activity Detected!</AlertTitle>
            <AlertDescription>
              {suspiciousIPs.length} IP address{suspiciousIPs.length > 1 ? 'es' : ''} showing suspicious patterns
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {statistics?.violations && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Violations</StatLabel>
                  <StatNumber>{statistics.violations.total}</StatNumber>
                  <StatHelpText>All time</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Critical Violations</StatLabel>
                  <StatNumber color="red.500">
                    {statistics.violations.bySeverity?.find(s => s._id === 'critical')?.count || 0}
                  </StatNumber>
                  <StatHelpText>Requires immediate attention</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Suspicious IPs</StatLabel>
                  <StatNumber color="orange.500">{suspiciousIPs.length}</StatNumber>
                  <StatHelpText>Last hour</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Rate Limiters</StatLabel>
                  <StatNumber>{statistics.violations.byLimiter?.length || 0}</StatNumber>
                  <StatHelpText>Active limiters</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab><Icon as={FaChartLine} mr={2} />Overview</Tab>
            <Tab><Icon as={FaExclamationTriangle} mr={2} />Violations</Tab>
            <Tab><Icon as={FaBan} mr={2} />Suspicious IPs</Tab>
          </TabList>

          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Violations by Limiter Type</Heading>
                  </CardHeader>
                  <CardBody>
                    {statistics?.violations?.byLimiter?.length > 0 ? (
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Limiter Type</Th>
                            <Th isNumeric>Count</Th>
                            <Th>Percentage</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {statistics.violations.byLimiter.map((item) => (
                            <Tr key={item._id}>
                              <Td>{getLimiterTypeLabel(item._id)}</Td>
                              <Td isNumeric fontWeight="bold">{item.count}</Td>
                              <Td>
                                <Badge colorScheme="blue">
                                  {((item.count / statistics.violations.total) * 100).toFixed(1)}%
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Text color="gray.500">No violations recorded</Text>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Violations by Severity</Heading>
                  </CardHeader>
                  <CardBody>
                    {statistics?.violations?.bySeverity?.length > 0 ? (
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        {statistics.violations.bySeverity.map((item) => (
                          <Box key={item._id} p={4} borderWidth="1px" borderRadius="md">
                            <Badge colorScheme={getSeverityColor(item._id)} mb={2}>
                              {item._id.toUpperCase()}
                            </Badge>
                            <Text fontSize="2xl" fontWeight="bold">{item.count}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text color="gray.500">No violations recorded</Text>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Violations Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Filters */}
                <Card>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Limiter Type</FormLabel>
                        <Select
                          size="sm"
                          value={filters.limiterType}
                          onChange={(e) => setFilters({ ...filters, limiterType: e.target.value })}
                        >
                          <option value="">All</option>
                          <option value="auth">Authentication</option>
                          <option value="api">API</option>
                          <option value="gdpr">GDPR</option>
                          <option value="admin">Admin</option>
                          <option value="global">Global</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Severity</FormLabel>
                        <Select
                          size="sm"
                          value={filters.severity}
                          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                        >
                          <option value="">All</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">IP Address</FormLabel>
                        <Input
                          size="sm"
                          value={filters.ipAddress}
                          onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
                          placeholder="Filter by IP"
                        />
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

                {/* Violations Table */}
                <Card>
                  <CardBody overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Time</Th>
                          <Th>IP Address</Th>
                          <Th>User</Th>
                          <Th>Endpoint</Th>
                          <Th>Limiter</Th>
                          <Th>Severity</Th>
                          <Th>Repeated</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {violations.map((violation) => (
                          <Tr key={violation._id}>
                            <Td fontSize="xs">
                              {new Date(violation.violatedAt).toLocaleString()}
                            </Td>
                            <Td>
                              <Button
                                size="xs"
                                variant="link"
                                onClick={() => viewIPDetails(violation.ipAddress)}
                              >
                                {violation.ipAddress}
                              </Button>
                            </Td>
                            <Td>
                              {violation.userId ? (
                                <Text fontSize="xs">
                                  {violation.userId.firstName} {violation.userId.lastName}
                                  <br />
                                  <Text as="span" color="gray.500">
                                    ({violation.userId.username})
                                  </Text>
                                </Text>
                              ) : (
                                <Text color="gray.500" fontSize="xs">Anonymous</Text>
                              )}
                            </Td>
                            <Td fontSize="xs">
                              <Badge colorScheme="purple" mr={1}>
                                {violation.method}
                              </Badge>
                              {violation.endpoint}
                            </Td>
                            <Td fontSize="xs">{getLimiterTypeLabel(violation.limiterType)}</Td>
                            <Td>
                              <Badge colorScheme={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                            </Td>
                            <Td>
                              {violation.isRepeated ? (
                                <Tooltip label={`${violation.previousViolations} previous violations`}>
                                  <Badge colorScheme="red">
                                    {violation.previousViolations}
                                  </Badge>
                                </Tooltip>
                              ) : (
                                <Icon as={FaCheck} color="green.500" />
                              )}
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

            {/* Suspicious IPs Tab */}
            <TabPanel>
              <Card>
                <CardBody>
                  {suspiciousIPs.length > 0 ? (
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>IP Address</Th>
                          <Th isNumeric>Total Violations</Th>
                          <Th>Severities</Th>
                          <Th>Endpoints</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {suspiciousIPs.map((ip) => (
                          <Tr key={ip._id}>
                            <Td fontWeight="bold">{ip._id}</Td>
                            <Td isNumeric>
                              <Badge colorScheme="red" fontSize="md">
                                {ip.count}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                {ip.severities.map((sev) => (
                                  <Badge key={sev._id} colorScheme={getSeverityColor(sev._id)}>
                                    {sev._id}: {sev.count}
                                  </Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td>
                              <Text fontSize="xs" noOfLines={2}>
                                {ip.endpoints.map(e => e._id).join(', ')}
                              </Text>
                            </Td>
                            <Td>
                              <HStack>
                                <Button
                                  size="xs"
                                  onClick={() => viewIPDetails(ip._id)}
                                  colorScheme="blue"
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="xs"
                                  onClick={() => handleResetLimit(`ip:${ip._id}`)}
                                  colorScheme="green"
                                >
                                  Reset Limit
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert status="success">
                      <AlertIcon />
                      No suspicious IP addresses detected
                    </Alert>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* IP Details Modal */}
      <Modal isOpen={isIPModalOpen} onClose={onIPModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>IP Address Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedIP && (
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="bold">IP Address:</Text>
                  <Text>{selectedIP.ipAddress}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Total Violations:</Text>
                  <Badge colorScheme="red" fontSize="md">
                    {selectedIP.total}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Recommendation:</Text>
                  <Badge colorScheme={selectedIP.shouldBlock ? 'red' : 'green'}>
                    {selectedIP.recommendation}
                  </Badge>
                </HStack>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Recent Violations:</Text>
                  <Box maxH="300px" overflowY="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Time</Th>
                          <Th>Endpoint</Th>
                          <Th>Severity</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedIP.violations.slice(0, 10).map((v) => (
                          <Tr key={v._id}>
                            <Td fontSize="xs">
                              {new Date(v.violatedAt).toLocaleString()}
                            </Td>
                            <Td fontSize="xs">{v.endpoint}</Td>
                            <Td>
                              <Badge colorScheme={getSeverityColor(v.severity)}>
                                {v.severity}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onIPModalClose}>
              Close
            </Button>
            {selectedIP && (
              <Button
                colorScheme="green"
                onClick={() => {
                  handleResetLimit(`ip:${selectedIP.ipAddress}`);
                  onIPModalClose();
                }}
              >
                Reset Rate Limit
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RateLimitMonitor;
