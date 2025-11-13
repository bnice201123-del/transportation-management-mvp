import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  StatHelpText,
  StatArrow,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  useBreakpointValue,
  Icon,
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
  ModalFooter,
  Progress,
  CircularProgress,
  CircularProgressLabel,
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
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  Center,
  Spinner,
  Skeleton,
  SkeletonText,
  Avatar,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Stack,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Kbd
} from '@chakra-ui/react';
import {
  SearchIcon,
  SettingsIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  TimeIcon,
  RepeatIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  AddIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  SmallCloseIcon,
  ExternalLinkIcon,
  AttachmentIcon
} from '@chakra-ui/icons';
import {
  HiShieldCheck,
  HiShieldExclamation,
  HiLockClosed,
  HiLockOpen,
  HiKey,
  HiEye,
  HiEyeOff,
  HiBell,
  HiClock,
  HiCog,
  HiFilter,
  HiRefresh,
  HiPlay,
  HiPause,
  HiStop,
  HiSearch,
  HiAdjustments,
  HiClipboard,
  HiClipboardCheck,
  HiExclamation,
  HiInformationCircle,
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiPencil,
  HiTrash,
  HiDownload,
  HiUpload,
  HiHome,
  HiChartBar,
  HiViewGrid,
  HiViewList,
  HiSortAscending,
  HiSortDescending,
  HiDotsVertical,
  HiSave,
  HiX,
  HiCheck,
  HiArchive,
  HiCollection,
  HiShare,
  HiUserGroup,
  HiDatabase,
  HiServer,
  HiCloudDownload,
  HiCloudUpload,
  HiFolder,
  HiFolderOpen,
  HiDocumentDuplicate,
  HiFingerPrint,
  HiGlobeAlt,
  HiWifi,
  HiCalendar,
  HiUsers
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const Security = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Enhanced modal management
  const { isOpen: isEventModalOpen, onOpen: onEventModalOpen, onClose: onEventModalClose } = useDisclosure();
  const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();
  const { isOpen: isAlertModalOpen, onOpen: onAlertModalOpen, onClose: onAlertModalClose } = useDisclosure();
  const { isOpen: isPolicyModalOpen, onOpen: onPolicyModalOpen, onClose: onPolicyModalClose } = useDisclosure();

  // Responsive design variables
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: '7xl' });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });
  const cardColumns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });
  const containerPadding = useBreakpointValue({ base: 4, md: 8 });
  const cardSpacing = useBreakpointValue({ base: 4, md: 6 });
  const stackDirection = useBreakpointValue({ base: 'column', lg: 'row' });

  // Enhanced state management
  const [securityEvents, setSecurityEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [processingItems, setProcessingItems] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedRowBg = useColorModeValue('blue.50', 'blue.900');
  const headerBg = useColorModeValue('linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const statIconBg = useColorModeValue('gray.50', 'gray.700');

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
      icon: HiClipboard,
      color: 'blue.500',
      trend: '+12%',
      trendDirection: 'increase'
    },
    {
      label: 'Failed Logins',
      value: securityEvents.filter(e => e.type === 'failed_login').length,
      icon: HiLockClosed,
      color: 'red.500',
      trend: '-8%',
      trendDirection: 'decrease'
    },
    {
      label: 'Active Sessions',
      value: 12,
      icon: HiLockOpen,
      color: 'green.500',
      trend: '+5%',
      trendDirection: 'increase'
    },
    {
      label: 'Security Alerts',
      value: securityEvents.filter(e => e.severity === 'high').length,
      icon: HiShieldExclamation,
      color: 'orange.500',
      trend: '-15%',
      trendDirection: 'decrease'
    }
  ];

  const securityFeatures = [
    {
      title: 'Authentication Settings',
      description: 'Configure login policies and MFA settings',
      icon: HiKey,
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
      icon: HiUsers,
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
      icon: HiBell,
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
      case 'login_attempt': return HiCheckCircle;
      case 'failed_login': return HiXCircle;
      case 'suspicious_activity': return HiShieldExclamation;
      case 'password_change': return HiKey;
      case 'session_timeout': return HiClock;
      default: return HiInformationCircle;
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    onEventModalOpen();
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
    <Box minHeight="100vh" bg={bgColor} pb={8}>
      <Navbar />
      
      {/* Enhanced Header with Breadcrumbs */}
      <Container maxW={containerMaxW} pt={6} pb={4}>
        <VStack spacing={4} align="stretch">
          <Breadcrumb spacing="8px" separator={<ChevronRightIcon color={mutedColor} />}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/admin')} color={mutedColor}>
                <HiHome style={{ display: 'inline', marginRight: '4px' }} />
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color={textColor} fontWeight="semibold">
                Security Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <Card bg={cardBg} shadow="xl" borderRadius="xl" overflow="hidden">
            <CardBody p={0}>
              <VStack spacing={0} align="stretch">
                <Box
                  bg={headerBg}
                  p={{ base: 6, md: 8 }}
                  textAlign="center"
                  color="white"
                  position="relative"
                  overflow="hidden"
                >
                  <VStack spacing={4}>
                    <Icon as={HiShieldCheck} boxSize={12} />
                    <VStack spacing={2}>
                      <Heading 
                        size={{ base: 'xl', md: '2xl' }} 
                        fontWeight="bold"
                        textShadow="0 2px 4px rgba(0,0,0,0.2)"
                      >
                        Security Dashboard
                      </Heading>
                      <Text 
                        fontSize={{ base: 'md', md: 'lg' }} 
                        opacity={0.9}
                        maxW="600px"
                      >
                        Comprehensive security monitoring, threat detection, and access control management for your transportation system
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      <Container maxW={containerMaxW} px={6}>
        <VStack spacing={8} align="stretch">

          {/* Enhanced Statistics Dashboard */}
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <CardHeader>
              <Flex align="center" justify="space-between">
                <VStack align="flex-start" spacing={1}>
                  <Heading size="md" color={textColor}>
                    Security Overview
                  </Heading>
                  <Text fontSize="sm" color={mutedColor}>
                    Real-time security metrics and threat assessment
                  </Text>
                </VStack>
                <ButtonGroup size="sm" variant="outline">
                  <Button leftIcon={<HiRefresh />} onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                  <Button leftIcon={<HiDownload />}>
                    Export
                  </Button>
                </ButtonGroup>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                {securityStats.map((stat, index) => (
                  <Card
                    key={index}
                    bg={statIconBg}
                    borderRadius="lg"
                    shadow="md"
                    transition="all 0.2s"
                    _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <CardBody p={6} textAlign="center">
                      <Stat>
                        <StatLabel display="flex" alignItems="center" justifyContent="center" gap={2}>
                          <Icon as={stat.icon} color={stat.color} />
                          {stat.label}
                        </StatLabel>
                        <StatNumber fontSize="3xl" color={textColor}>
                          {stat.value}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type={stat.trendDirection} />
                          {stat.trend} from last week
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

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
          <Modal isOpen={isEventModalOpen} onClose={onEventModalClose} size="lg">
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
                        <Text>
                          {typeof selectedEvent.user === 'object' 
                            ? (selectedEvent.user.name || selectedEvent.user.email || `${selectedEvent.user.firstName || ''} ${selectedEvent.user.lastName || ''}`.trim() || 'Unknown User')
                            : selectedEvent.user
                          }
                        </Text>
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