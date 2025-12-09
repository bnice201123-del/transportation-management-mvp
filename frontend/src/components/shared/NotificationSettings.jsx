import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Button,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react';
import { EmailIcon, PhoneIcon, BellIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({ email: false, sms: false });
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    emailVerified: false,
    phoneVerified: false
  });
  
  const [preferences, setPreferences] = useState({
    shiftReminders: {
      enabled: true,
      email: true,
      sms: true,
      timing: 60 // minutes before shift
    },
    timeOffApprovals: {
      enabled: true,
      email: true,
      sms: false
    },
    timeOffDenials: {
      enabled: true,
      email: true,
      sms: false
    },
    shiftSwapRequests: {
      enabled: true,
      email: true,
      sms: true
    },
    overtimeAlerts: {
      enabled: true,
      email: true,
      sms: false
    },
    coverageGapAlerts: {
      enabled: true,
      email: true,
      sms: false
    },
    scheduleChanges: {
      enabled: true,
      email: true,
      sms: true
    },
    calendarSync: {
      enabled: true,
      email: false,
      sms: false
    }
  });

  // Notification types configuration
  const notificationTypes = [
    {
      id: 'shiftReminders',
      label: 'Shift Reminders',
      description: 'Get notified before your shift starts',
      icon: BellIcon,
      color: 'blue',
      hasTiming: true,
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    },
    {
      id: 'timeOffApprovals',
      label: 'Time-Off Approvals',
      description: 'Notifications when your time-off requests are approved',
      icon: CheckCircleIcon,
      color: 'green',
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    },
    {
      id: 'timeOffDenials',
      label: 'Time-Off Denials',
      description: 'Notifications when your time-off requests are denied',
      icon: WarningIcon,
      color: 'red',
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    },
    {
      id: 'shiftSwapRequests',
      label: 'Shift Swap Requests',
      description: 'Get notified of shift swap opportunities and approvals',
      icon: BellIcon,
      color: 'purple',
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    },
    {
      id: 'overtimeAlerts',
      label: 'Overtime Alerts',
      description: 'Notifications about overtime hours',
      icon: WarningIcon,
      color: 'orange',
      roles: ['driver', 'admin']
    },
    {
      id: 'coverageGapAlerts',
      label: 'Coverage Gap Alerts',
      description: 'Alerts about staffing shortages (Admin only)',
      icon: WarningIcon,
      color: 'red',
      roles: ['admin', 'scheduler']
    },
    {
      id: 'scheduleChanges',
      label: 'Schedule Changes',
      description: 'Notifications when your schedule is modified',
      icon: BellIcon,
      color: 'blue',
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    },
    {
      id: 'calendarSync',
      label: 'Calendar Sync Status',
      description: 'Notifications about calendar synchronization',
      icon: BellIcon,
      color: 'teal',
      roles: ['driver', 'dispatcher', 'scheduler', 'admin']
    }
  ];

  // Fetch user preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/notification-preferences');
      
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
      
      setContactInfo({
        email: response.data.email || '',
        phone: response.data.phone || '',
        emailVerified: response.data.emailVerified || false,
        phoneVerified: response.data.phoneVerified || false
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error loading preferences',
        description: error.response?.data?.message || 'Failed to load notification settings',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await axios.put('/api/users/notification-preferences', {
        preferences,
        email: contactInfo.email,
        phone: contactInfo.phone
      });

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error saving settings',
        description: error.response?.data?.message || 'Failed to save notification settings',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (channel) => {
    try {
      setTesting({ ...testing, [channel]: true });
      
      await axios.post('/api/users/test-notification', { channel });

      toast({
        title: 'Test notification sent',
        description: `Check your ${channel} for the test message`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Test failed',
        description: error.response?.data?.message || `Failed to send test ${channel}`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setTesting({ ...testing, [channel]: false });
    }
  };

  const togglePreference = (type, field) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: !prev[type][field]
      }
    }));
  };

  const updateTiming = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        timing: parseInt(value)
      }
    }));
  };

  // Filter notifications by user role
  const userRole = user?.role || 'driver';
  const filteredNotifications = notificationTypes.filter(notif => 
    notif.roles.includes(userRole)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading notification settings...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color={headingColor} mb={2}>
            Notification Settings
          </Heading>
          <Text color={textColor}>
            Manage how and when you receive notifications
          </Text>
        </Box>

        {/* Contact Information */}
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Contact Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Email */}
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Icon as={EmailIcon} color="blue.500" />
                    <Text>Email Address</Text>
                    {contactInfo.emailVerified && (
                      <Badge colorScheme="green" fontSize="xs">Verified</Badge>
                    )}
                  </HStack>
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <EmailIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                </InputGroup>
              </FormControl>

              {/* Phone */}
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Icon as={PhoneIcon} color="green.500" />
                    <Text>Phone Number</Text>
                    {contactInfo.phoneVerified && (
                      <Badge colorScheme="green" fontSize="xs">Verified</Badge>
                    )}
                  </HStack>
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <PhoneIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </InputGroup>
              </FormControl>

              {/* Test Buttons */}
              <HStack spacing={3}>
                <Button
                  size="sm"
                  leftIcon={<EmailIcon />}
                  onClick={() => handleTestNotification('email')}
                  isLoading={testing.email}
                  isDisabled={!contactInfo.email}
                  colorScheme="blue"
                  variant="outline"
                >
                  Test Email
                </Button>
                <Button
                  size="sm"
                  leftIcon={<PhoneIcon />}
                  onClick={() => handleTestNotification('sms')}
                  isLoading={testing.sms}
                  isDisabled={!contactInfo.phone}
                  colorScheme="green"
                  variant="outline"
                >
                  Test SMS
                </Button>
              </HStack>

              {/* Warning if contact info missing */}
              {(!contactInfo.email || !contactInfo.phone) && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="sm">Incomplete Contact Information</AlertTitle>
                    <AlertDescription fontSize="xs">
                      {!contactInfo.email && 'Add your email address to receive email notifications. '}
                      {!contactInfo.phone && 'Add your phone number to receive SMS notifications.'}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Notification Preferences */}
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Notification Preferences</Heading>
            <Text fontSize="sm" color={textColor} mt={1}>
              Choose which notifications you want to receive and how
            </Text>
          </CardHeader>
          <CardBody>
            <Accordion allowMultiple defaultIndex={[0]}>
              {filteredNotifications.map((notif, index) => (
                <AccordionItem key={notif.id} border="none" mb={3}>
                  <AccordionButton
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                    borderRadius="md"
                    p={4}
                  >
                    <HStack flex="1" spacing={3}>
                      <Icon as={notif.icon} color={`${notif.color}.500`} boxSize={5} />
                      <Box textAlign="left">
                        <Text fontWeight="semibold">{notif.label}</Text>
                        <Text fontSize="xs" color={textColor}>
                          {notif.description}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme={preferences[notif.id]?.enabled ? 'green' : 'gray'}>
                        {preferences[notif.id]?.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <AccordionIcon />
                    </HStack>
                  </AccordionButton>

                  <AccordionPanel pb={4} pt={4}>
                    <VStack spacing={4} align="stretch">
                      {/* Enable/Disable */}
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Enable {notif.label}
                        </FormLabel>
                        <Switch
                          colorScheme={notif.color}
                          isChecked={preferences[notif.id]?.enabled}
                          onChange={() => togglePreference(notif.id, 'enabled')}
                        />
                      </FormControl>

                      <Divider />

                      {/* Email Option */}
                      <FormControl
                        display="flex"
                        alignItems="center"
                        isDisabled={!preferences[notif.id]?.enabled || !contactInfo.email}
                      >
                        <HStack flex="1" spacing={2}>
                          <Icon as={EmailIcon} color="blue.500" />
                          <FormLabel mb="0">Email Notifications</FormLabel>
                        </HStack>
                        <Switch
                          colorScheme="blue"
                          isChecked={preferences[notif.id]?.email}
                          onChange={() => togglePreference(notif.id, 'email')}
                          isDisabled={!preferences[notif.id]?.enabled || !contactInfo.email}
                        />
                      </FormControl>

                      {/* SMS Option */}
                      <FormControl
                        display="flex"
                        alignItems="center"
                        isDisabled={!preferences[notif.id]?.enabled || !contactInfo.phone}
                      >
                        <HStack flex="1" spacing={2}>
                          <Icon as={PhoneIcon} color="green.500" />
                          <FormLabel mb="0">SMS Notifications</FormLabel>
                        </HStack>
                        <Switch
                          colorScheme="green"
                          isChecked={preferences[notif.id]?.sms}
                          onChange={() => togglePreference(notif.id, 'sms')}
                          isDisabled={!preferences[notif.id]?.enabled || !contactInfo.phone}
                        />
                      </FormControl>

                      {/* Timing Option (for shift reminders) */}
                      {notif.hasTiming && preferences[notif.id]?.enabled && (
                        <>
                          <Divider />
                          <FormControl>
                            <FormLabel fontSize="sm">Remind me before shift</FormLabel>
                            <Select
                              value={preferences[notif.id]?.timing || 60}
                              onChange={(e) => updateTiming(notif.id, e.target.value)}
                              size="sm"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={240}>4 hours</option>
                            </Select>
                          </FormControl>
                        </>
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>

        {/* Save Button */}
        <HStack justify="flex-end" spacing={3}>
          <Button
            variant="outline"
            onClick={fetchPreferences}
            isDisabled={saving}
          >
            Reset
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Saving..."
            leftIcon={<CheckCircleIcon />}
          >
            Save Preferences
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default NotificationSettings;
