import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Spinner,
  Center,
  Badge,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AuditLogViewer = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    category: '',
    severity: '',
    success: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchLogs();
    fetchStatistics();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await axios.get('/api/audit/logs', { params });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      
      const response = await axios.get('/api/audit/statistics', { params });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      category: '',
      severity: '',
      success: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPage(1);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    onDetailOpen();
  };

  const handleExport = async () => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await axios.get('/api/audit/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Success',
        description: 'Audit logs exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'purple'
    };
    return colors[severity] || 'gray';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      authentication: ShieldCheckIcon,
      user_management: UserIcon,
      trip_management: ClockIcon,
      security: ShieldCheckIcon,
      system: ChartBarIcon
    };
    return icons[category] || ClockIcon;
  };

  if (loading && logs.length === 0) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>
            <HStack>
              <ClockIcon style={{ width: '20px', height: '20px' }} />
              <Text>Activity Logs</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <ChartBarIcon style={{ width: '20px', height: '20px' }} />
              <Text>Statistics</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Activity Logs Tab */}
          <TabPanel>
            {/* Filters */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <FunnelIcon style={{ width: '20px', height: '20px' }} />
                    <Heading size="sm">Filters</Heading>
                  </HStack>
                  <HStack>
                    <Button size="sm" variant="ghost" onClick={handleClearFilters}>
                      <XMarkIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="brand"
                      leftIcon={<ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />}
                      onClick={handleExport}
                    >
                      Export CSV
                    </Button>
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4}>
                  <InputGroup>
                    <InputLeftElement>
                      <MagnifyingGlassIcon style={{ width: '16px', height: '16px' }} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </InputGroup>
                  <Select
                    placeholder="All Categories"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="authentication">Authentication</option>
                    <option value="user_management">User Management</option>
                    <option value="trip_management">Trip Management</option>
                    <option value="vehicle_management">Vehicle Management</option>
                    <option value="rider_management">Rider Management</option>
                    <option value="settings">Settings</option>
                    <option value="security">Security</option>
                    <option value="notification">Notification</option>
                    <option value="schedule">Schedule</option>
                    <option value="system">System</option>
                  </Select>
                  <Select
                    placeholder="All Severity"
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </Select>
                  <Select
                    placeholder="All Status"
                    value={filters.success}
                    onChange={(e) => handleFilterChange('success', e.target.value)}
                  >
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Logs Table */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Time</Th>
                        <Th>User</Th>
                        <Th>Action</Th>
                        <Th>Category</Th>
                        <Th>Description</Th>
                        <Th>Severity</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.length === 0 ? (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={8}>
                            <Text color="gray.500">No audit logs found</Text>
                          </Td>
                        </Tr>
                      ) : (
                        logs.map((log) => (
                          <Tr key={log._id} _hover={{ bg: hoverBg }} cursor="pointer">
                            <Td fontSize="xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {log.username}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {log.userRole}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Code fontSize="xs">{log.action}</Code>
                            </Td>
                            <Td>
                              <Badge colorScheme="gray" fontSize="xs">
                                {log.category}
                              </Badge>
                            </Td>
                            <Td maxW="300px" isTruncated>
                              <Text fontSize="sm">{log.description}</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getSeverityColor(log.severity)} fontSize="xs">
                                {log.severity}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={log.success ? 'green' : 'red'} fontSize="xs">
                                {log.success ? 'Success' : 'Failed'}
                              </Badge>
                            </Td>
                            <Td>
                              <Tooltip label="View Details">
                                <IconButton
                                  icon={<EyeIcon style={{ width: '16px', height: '16px' }} />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(log)}
                                />
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <Flex justify="space-between" align="center" mt={4}>
                    <Text fontSize="sm" color="gray.600">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} logs
                    </Text>
                    <HStack>
                      <Button
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        isDisabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Text fontSize="sm">
                        Page {page} of {pagination.pages}
                      </Text>
                      <Button
                        size="sm"
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        isDisabled={page === pagination.pages}
                      >
                        Next
                      </Button>
                    </HStack>
                  </Flex>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Statistics Tab */}
          <TabPanel>
            {statistics && (
              <VStack spacing={6} align="stretch">
                {/* Summary Stats */}
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody>
                      <Stat>
                        <StatLabel>Total Logs</StatLabel>
                        <StatNumber>{statistics.totalLogs}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  {statistics.bySuccess.map(item => (
                    <Card key={item._id.toString()} bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>{item._id ? 'Successful' : 'Failed'}</StatLabel>
                          <StatNumber>{item.count}</StatNumber>
                          <StatHelpText>
                            {((item.count / statistics.totalLogs) * 100).toFixed(1)}%
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {/* By Category */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="sm">Activity by Category</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      {statistics.byCategory.map(item => (
                        <Box key={item._id} p={4} borderWidth="1px" borderRadius="md">
                          <Text fontSize="sm" fontWeight="medium" mb={1}>
                            {item._id}
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                            {item.count}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Top Actions */}
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="sm">Top Actions</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      {statistics.byAction.map(item => (
                        <Flex key={item._id} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                          <Code>{item._id}</Code>
                          <Badge colorScheme="blue">{item.count}</Badge>
                        </Flex>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Timestamp
                  </Text>
                  <Text fontSize="sm">{new Date(selectedLog.createdAt).toLocaleString()}</Text>
                </Box>
                <Divider />
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    User
                  </Text>
                  <Text fontSize="sm">
                    {selectedLog.username} ({selectedLog.userRole})
                  </Text>
                </Box>
                <Divider />
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Action
                  </Text>
                  <HStack>
                    <Code>{selectedLog.action}</Code>
                    <Badge colorScheme="gray">{selectedLog.category}</Badge>
                    <Badge colorScheme={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </HStack>
                </Box>
                <Divider />
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={1}>
                    Description
                  </Text>
                  <Text fontSize="sm">{selectedLog.description}</Text>
                </Box>
                {selectedLog.targetType && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={1}>
                        Target
                      </Text>
                      <Text fontSize="sm">
                        {selectedLog.targetType}: {selectedLog.targetName || selectedLog.targetId}
                      </Text>
                    </Box>
                  </>
                )}
                {selectedLog.metadata && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={1}>
                        Metadata
                      </Text>
                      <VStack align="stretch" spacing={1} fontSize="sm">
                        {selectedLog.metadata.ipAddress && (
                          <Text>IP: {selectedLog.metadata.ipAddress}</Text>
                        )}
                        {selectedLog.metadata.statusCode && (
                          <Text>Status: {selectedLog.metadata.statusCode}</Text>
                        )}
                        {selectedLog.metadata.duration && (
                          <Text>Duration: {selectedLog.metadata.duration}ms</Text>
                        )}
                      </VStack>
                    </Box>
                  </>
                )}
                {selectedLog.error && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={1} color="red.500">
                        Error
                      </Text>
                      <Code fontSize="sm" colorScheme="red" w="full" p={2}>
                        {selectedLog.error.message}
                      </Code>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AuditLogViewer;
