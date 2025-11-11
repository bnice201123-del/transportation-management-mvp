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
import { 
  FaShieldAlt, 
  FaUserShield, 
  FaLock, 
  FaUnlock, 
  FaKey, 
  FaEye, 
  FaEyeSlash, 
  FaBell, 
  FaHistory, 
  FaCog, 
  FaFilter 
} from 'react-icons/fa';
import Navbar from '../shared/Navbar';

const SecuritySimple = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // All color mode values at the top level
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // State variables
  const [securityEvents, setSecurityEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Security stats data
  const securityStats = [
    {
      label: 'Active Sessions',
      value: '24',
      color: 'green.500',
      icon: FaUserShield,
    },
    {
      label: 'Security Alerts',
      value: '3',
      color: 'orange.500',
      icon: FaShieldAlt,
    },
    {
      label: 'Failed Logins',
      value: '7',
      color: 'red.500',
      icon: FaLock,
    },
    {
      label: 'System Health',
      value: '98%',
      color: 'blue.500',
      icon: FaCog,
    },
  ];

  // Sample security events
  const sampleEvents = [
    {
      id: 1,
      type: 'Login',
      severity: 'Info',
      message: 'User admin@test.com logged in successfully',
      timestamp: new Date().toLocaleString(),
      ip: '192.168.1.100',
    },
    {
      id: 2,
      type: 'Failed Login',
      severity: 'Warning',
      message: 'Failed login attempt for user@example.com',
      timestamp: new Date(Date.now() - 300000).toLocaleString(),
      ip: '192.168.1.101',
    },
    {
      id: 3,
      type: 'Permission Change',
      severity: 'High',
      message: 'User permissions modified for driver@test.com',
      timestamp: new Date(Date.now() - 600000).toLocaleString(),
      ip: '192.168.1.102',
    },
  ];

  // Fetch security events
  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setSecurityEvents(sampleEvents);
        setFilteredEvents(sampleEvents);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security events',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  // Filter events
  const filterEvents = () => {
    let filtered = securityEvents;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return 'red';
      case 'Warning':
        return 'orange';
      case 'Info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Effects
  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [securityEvents, searchTerm, eventTypeFilter, severityFilter]);

  return (
    <Box bg={bgColor} minH="100vh">
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" color={textColor} mb={2}>
              Security Dashboard
            </Heading>
            <Text color="gray.600">
              Monitor system security events and manage access controls
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {securityStats.map((stat, index) => (
              <Card key={index} bg={cardBg} shadow="lg" borderColor={borderColor}>
                <CardBody textAlign="center" py={6}>
                  <Icon as={stat.icon} boxSize={8} color={stat.color} mb={3} />
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">
                      {stat.label}
                    </StatLabel>
                    <StatNumber fontSize="3xl" fontWeight="bold" color={stat.color}>
                      {stat.value}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Security Events Table */}
          <Card bg={cardBg}>
            <CardHeader>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" color={textColor}>
                  Security Events
                </Heading>
                <Button leftIcon={<RepeatIcon />} onClick={fetchSecurityEvents} isLoading={loading}>
                  Refresh
                </Button>
              </Flex>

              {/* Filters */}
              <HStack spacing={4}>
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Select
                  maxW="200px"
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Login">Login</option>
                  <option value="Failed Login">Failed Login</option>
                  <option value="Permission Change">Permission Change</option>
                </Select>

                <Select
                  maxW="200px"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="High">High</option>
                </Select>
              </HStack>
            </CardHeader>

            <CardBody>
              {loading ? (
                <Progress size="xs" isIndeterminate />
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Message</Th>
                      <Th>Severity</Th>
                      <Th>IP Address</Th>
                      <Th>Timestamp</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredEvents.map((event) => (
                      <Tr key={event.id}>
                        <Td>
                          <Badge colorScheme="blue" variant="subtle">
                            {event.type}
                          </Badge>
                        </Td>
                        <Td>{event.message}</Td>
                        <Td>
                          <Badge colorScheme={getSeverityColor(event.severity)} variant="solid">
                            {event.severity}
                          </Badge>
                        </Td>
                        <Td>{event.ip}</Td>
                        <Td>{event.timestamp}</Td>
                        <Td>
                          <IconButton
                            icon={<ViewIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEvent(event);
                              onOpen();
                            }}
                            aria-label="View event details"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md" color={textColor}>
                Security Settings
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="two-factor" mb="0">
                    Enable Two-Factor Authentication
                  </FormLabel>
                  <Switch id="two-factor" />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="session-timeout" mb="0">
                    Auto-logout inactive sessions
                  </FormLabel>
                  <Switch id="session-timeout" defaultChecked />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="audit-logging" mb="0">
                    Enable audit logging
                  </FormLabel>
                  <Switch id="audit-logging" defaultChecked />
                </FormControl>

                <Divider />

                <HStack spacing={4}>
                  <Button colorScheme="blue" leftIcon={<SettingsIcon />}>
                    Save Settings
                  </Button>
                  <Button variant="outline" leftIcon={<LockIcon />}>
                    Change Password Policy
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Event Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Type:</Text>
                  <Badge colorScheme="blue">{selectedEvent.type}</Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Message:</Text>
                  <Text>{selectedEvent.message}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Severity:</Text>
                  <Badge colorScheme={getSeverityColor(selectedEvent.severity)}>
                    {selectedEvent.severity}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">IP Address:</Text>
                  <Text>{selectedEvent.ip}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Timestamp:</Text>
                  <Text>{selectedEvent.timestamp}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SecuritySimple;