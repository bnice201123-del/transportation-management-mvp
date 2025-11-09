import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Progress,
  Divider,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import {
  SearchIcon,
  SettingsIcon,
  LockIcon,
  UnlockIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  TimeIcon,
  BellIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { FaShieldAlt, FaUserShield, FaLock, FaUnlock, FaKey, FaEye, FaEyeSlash, FaBell, FaHistory, FaCog, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const Security = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [securityEvents, setSecurityEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Mock security data
  const mockSecurityEvents = [
    {
      id: 1,
      type: 'login_attempt',
      severity: 'low',
      message: 'Successful login attempt',
      user: 'john.doe@example.com',
      ip: '192.168.1.100',
      timestamp: '2025-11-09T10:30:00Z',
      status: 'success'
    },
    {
      id: 2,
      type: 'failed_login',
      severity: 'medium',
      message: 'Failed login attempt - invalid password',
      user: 'unknown@example.com',
      ip: '10.0.0.50',
      timestamp: '2025-11-09T10:25:00Z',
      status: 'failed'
    },
    {
      id: 3,
      type: 'suspicious_activity',
      severity: 'high',
      message: 'Multiple failed login attempts from same IP',
      user: 'N/A',
      ip: '203.0.113.1',
      timestamp: '2025-11-09T10:20:00Z',
      status: 'blocked'
    },
    {
      id: 4,
      type: 'password_change',
      severity: 'low',
      message: 'Password successfully changed',
      user: 'jane.smith@example.com',
      ip: '192.168.1.101',
      timestamp: '2025-11-09T09:45:00Z',
      status: 'success'
    },
    {
      id: 5,
      type: 'session_timeout',
      severity: 'low',
      message: 'User session expired',
      user: 'admin@example.com',
      ip: '192.168.1.1',
      timestamp: '2025-11-09T09:30:00Z',
      status: 'info'
    }
  ];

  const securityStats = [
    {
      label: 'Total Events',
      value: securityEvents.length,
      icon: FaHistory,
      color: 'blue.500'
    },
    {
      label: 'Failed Logins',
      value: securityEvents.filter(e => e.type === 'failed_login').length,
      icon: FaLock,
      color: 'red.500'
    },
    {
      label: 'Active Sessions',
      value: 12,
      icon: FaUnlock,
      color: 'green.500'
    },
    {
      label: 'Security Alerts',
      value: securityEvents.filter(e => e.severity === 'high').length,
      icon: WarningIcon,
      color: 'orange.500'
    }
  ];

  const securityFeatures = [
    {
      title: 'Authentication Settings',
      description: 'Configure login policies and MFA settings',
      icon: FaKey,
      features: [
        { name: 'Password Policy', status: 'enabled', description: 'Minimum 8 characters, special chars required' },
        { name: 'Two-Factor Authentication', status: 'enabled', description: 'SMS and authenticator app support' },
        { name: 'Session Timeout', status: 'enabled', description: 'Auto logout after 30 minutes' },
        { name: 'Login Attempt Limits', status: 'enabled', description: '5 failed attempts = temporary lockout' }
      ]
    },
    {
      title: 'Access Control',
      description: 'Manage permissions and role-based access',
      icon: FaUserShield,
      features: [
        { name: 'Role-Based Access', status: 'enabled', description: 'Admin, Scheduler, Dispatcher, Driver roles' },
        { name: 'IP Whitelisting', status: 'disabled', description: 'Restrict access to specific IP ranges' },
        { name: 'API Rate Limiting', status: 'enabled', description: '100 requests per minute per user' },
        { name: 'Audit Logging', status: 'enabled', description: 'All user actions are logged' }
      ]
    },
    {
      title: 'Monitoring & Alerts',
      description: 'Real-time security monitoring and notifications',
      icon: FaBell,
      features: [
        { name: 'Real-time Alerts', status: 'enabled', description: 'Instant notifications for security events' },
        { name: 'Intrusion Detection', status: 'enabled', description: 'Monitor for suspicious patterns' },
        { name: 'Log Analysis', status: 'enabled', description: 'Automated analysis of security logs' },
        { name: 'Compliance Reporting', status: 'disabled', description: 'Generate security compliance reports' }
      ]
    }
  ];

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [securityEvents, searchTerm, eventTypeFilter, severityFilter]);

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await axios.get('/api/admin/security/events');
      setTimeout(() => {
        setSecurityEvents(mockSecurityEvents);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security events',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = securityEvents;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ip.includes(searchTerm)
      );
    }

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventTypeFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    setFilteredEvents(filtered);
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'blocked': return 'red';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'login_attempt': return CheckCircleIcon;
      case 'failed_login': return WarningIcon;
      case 'suspicious_activity': return WarningIcon;
      case 'password_change': return LockIcon;
      case 'session_timeout': return TimeIcon;
      default: return InfoIcon;
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    onOpen();
  };

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Container maxW="7xl" py={8}>
          <Flex align="center" justify="center" minHeight="60vh">
            <VStack spacing={4}>
              <FaShieldAlt size={48} color="#3182ce" />
              <Text fontSize="lg">Loading security dashboard...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box
            bg={useColorModeValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)')}
            borderRadius="xl"
            p={8}
            textAlign="center"
            color="white"
            boxShadow="2xl"
          >
            <VStack spacing={4}>
              <FaShieldAlt size={48} />
              <Heading size="2xl" fontWeight="bold">
                Security Dashboard
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Monitor and manage system security, access controls, and threat detection
              </Text>
            </VStack>
          </Box>

          {/* Security Stats */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {securityStats.map((stat, index) => (
              <Card
                key={index}
                bg={cardBg}
                shadow="lg"
                borderRadius="lg"
                _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
                transition="all 0.3s"
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
              >
                <CardBody textAlign="center" py={6}>
                  <Icon as={stat.icon} boxSize={8} color={stat.color} mb={3} />
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">{stat.label}</StatLabel>
                    <StatNumber fontSize="3xl" fontWeight="bold" color={stat.color}>{stat.value}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Main Content Tabs */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab fontWeight="semibold">Security Events</Tab>
              <Tab fontWeight="semibold">Security Features</Tab>
              <Tab fontWeight="semibold">Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Security Events Tab */}
              <TabPanel>
                <Card bg={cardBg} shadow="lg" borderRadius="lg">
                  <CardHeader>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                      <Box>
                        <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
                          Security Events Log
                        </Heading>
                        <Text color="gray.600" mt={1}>
                          Monitor all security-related activities and events
                        </Text>
                      </Box>
                      <Button leftIcon={<RepeatIcon />} colorScheme="blue" variant="outline">
                        Refresh
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {/* Filters */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search events..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>

                      <Select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
                        <option value="all">All Event Types</option>
                        <option value="login_attempt">Login Attempts</option>
                        <option value="failed_login">Failed Logins</option>
                        <option value="suspicious_activity">Suspicious Activity</option>
                        <option value="password_change">Password Changes</option>
                        <option value="session_timeout">Session Timeouts</option>
                      </Select>

                      <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                        <option value="all">All Severities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </Select>
                    </SimpleGrid>

                    {/* Events Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Message</Th>
                            <Th>User</Th>
                            <Th>IP Address</Th>
                            <Th>Severity</Th>
                            <Th>Status</Th>
                            <Th>Time</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredEvents.map((event) => (
                            <Tr key={event.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>
                                <Flex align="center">
                                  <Icon as={getEventTypeIcon(event.type)} color="blue.500" mr={2} />
                                  <Text fontSize="sm" fontWeight="medium">
                                    {event.type.replace('_', ' ').toUpperCase()}
                                  </Text>
                                </Flex>
                              </Td>
                              <Td maxW="200px">
                                <Text isTruncated title={event.message}>
                                  {event.message}
                                </Text>
                              </Td>
                              <Td>{event.user}</Td>
                              <Td fontFamily="mono" fontSize="sm">{event.ip}</Td>
                              <Td>
                                <Badge colorScheme={getSeverityBadgeColor(event.severity)}>
                                  {event.severity}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusBadgeColor(event.status)}>
                                  {event.status}
                                </Badge>
                              </Td>
                              <Td fontSize="sm">
                                {new Date(event.timestamp).toLocaleString()}
                              </Td>
                              <Td>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewEvent(event)}
                                  title="View Details"
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    {filteredEvents.length === 0 && (
                      <Flex align="center" justify="center" py={8}>
                        <VStack spacing={4}>
                          <FaHistory size={48} color="#a0aec0" />
                          <Text color="gray.500">No security events found matching your criteria</Text>
                        </VStack>
                      </Flex>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Security Features Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {securityFeatures.map((category, categoryIndex) => (
                    <Card key={categoryIndex} bg={cardBg} shadow="lg" borderRadius="lg">
                      <CardHeader>
                        <Flex align="center">
                          <Icon as={category.icon} color="blue.500" boxSize={6} mr={3} />
                          <Box>
                            <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                              {category.title}
                            </Heading>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {category.description}
                            </Text>
                          </Box>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          {category.features.map((feature, featureIndex) => (
                            <Box
                              key={featureIndex}
                              p={4}
                              border="1px solid"
                              borderColor={useColorModeValue('gray.200', 'gray.600')}
                              borderRadius="md"
                              _hover={{ shadow: 'md' }}
                              transition="all 0.2s"
                            >
                              <Flex align="center" justify="space-between" mb={2}>
                                <Text fontWeight="semibold" fontSize="sm">
                                  {feature.name}
                                </Text>
                                <Badge
                                  colorScheme={feature.status === 'enabled' ? 'green' : 'red'}
                                  size="sm"
                                >
                                  {feature.status}
                                </Badge>
                              </Flex>
                              <Text fontSize="xs" color="gray.600">
                                {feature.description}
                              </Text>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <Card bg={cardBg} shadow="lg" borderRadius="lg">
                  <CardHeader>
                    <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
                      Security Settings
                    </Heading>
                    <Text color="gray.600" mt={2}>
                      Configure global security policies and preferences
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="mfa-toggle" mb="0" flex="1">
                          Require Two-Factor Authentication
                        </FormLabel>
                        <Switch id="mfa-toggle" colorScheme="blue" defaultChecked />
                      </FormControl>

                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="audit-toggle" mb="0" flex="1">
                          Enable Audit Logging
                        </FormLabel>
                        <Switch id="audit-toggle" colorScheme="blue" defaultChecked />
                      </FormControl>

                      <FormControl display="flex" alignItems="center">
                        <FormLabel htmlFor="alerts-toggle" mb="0" flex="1">
                          Real-time Security Alerts
                        </FormLabel>
                        <Switch id="alerts-toggle" colorScheme="blue" defaultChecked />
                      </FormControl>

                      <Divider />

                      <Box>
                        <Text fontWeight="semibold" mb={3}>Session Timeout (minutes)</Text>
                        <Slider defaultValue={30} min={5} max={120} step={5}>
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>Current: 30 minutes</Text>
                      </Box>

                      <Box>
                        <Text fontWeight="semibold" mb={3}>Failed Login Attempts Before Lockout</Text>
                        <Slider defaultValue={5} min={3} max={10} step={1}>
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontSize="sm" color="gray.600" mt={1}>Current: 5 attempts</Text>
                      </Box>

                      <Flex justify="flex-end" pt={4}>
                        <Button colorScheme="blue" size="lg">
                          Save Settings
                        </Button>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Event Details Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Security Event Details</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedEvent && (
                  <VStack spacing={4} align="stretch">
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Event Type</Text>
                        <Badge colorScheme="blue" mt={1}>
                          {selectedEvent.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Severity</Text>
                        <Badge colorScheme={getSeverityBadgeColor(selectedEvent.severity)} mt={1}>
                          {selectedEvent.severity}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Status</Text>
                        <Badge colorScheme={getStatusBadgeColor(selectedEvent.status)} mt={1}>
                          {selectedEvent.status}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Timestamp</Text>
                        <Text fontSize="sm">{new Date(selectedEvent.timestamp).toLocaleString()}</Text>
                      </Box>
                    </SimpleGrid>

                    <Divider />

                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Message</Text>
                      <Text>{selectedEvent.message}</Text>
                    </Box>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">User</Text>
                        <Text>{selectedEvent.user}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">IP Address</Text>
                        <Text fontFamily="mono">{selectedEvent.ip}</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </Box>
  );
};

export default Security;