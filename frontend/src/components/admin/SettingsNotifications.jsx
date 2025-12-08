import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  List,
  ListItem,
  ListIcon,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon, EmailIcon, BellIcon } from '@chakra-ui/icons';
import { FaShieldAlt, FaClock, FaDatabase, FaKey } from 'react-icons/fa';
import axios from 'axios';

// Critical settings that trigger email notifications
const criticalSettings = {
  security: [
    { key: 'twoFactorAuth', label: '2FA Authentication', icon: FaShieldAlt },
    { key: 'sessionTimeout', label: 'Session Timeout', icon: FaClock },
    { key: 'maxLoginAttempts', label: 'Max Login Attempts', icon: FaShieldAlt },
    { key: 'passwordMinLength', label: 'Password Min Length', icon: FaKey },
    { key: 'ipWhitelist', label: 'IP Whitelist', icon: FaShieldAlt }
  ],
  system: [
    { key: 'maintenanceMode', label: 'Maintenance Mode', icon: FaDatabase },
    { key: 'maxUsers', label: 'Maximum Users', icon: FaDatabase }
  ],
  encryption: [
    { key: 'enabled', label: 'Encryption Enabled', icon: FaKey },
    { key: 'algorithm', label: 'Encryption Algorithm', icon: FaKey }
  ]
};

const SettingsNotifications = () => {
  const [notificationConfig, setNotificationConfig] = useState({
    enabled: true,
    recipients: ['admin@transport.com'],
    criticalOnly: true,
    includeUserInfo: true,
    includeOldValue: true,
    includeNewValue: true,
    notifyOnTemplateApply: true,
    notifyOnBulkImport: true,
    categories: {
      security: true,
      system: true,
      encryption: true,
      rateLimits: false,
      notifications: false
    }
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchNotificationConfig();
    fetchRecentNotifications();
  }, []);

  const fetchNotificationConfig = async () => {
    try {
      const response = await axios.get('/api/admin/settings/notifications/config');
      if (response.data) {
        setNotificationConfig(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification config:', error);
      // Load from localStorage as fallback
      const saved = localStorage.getItem('settingsNotificationConfig');
      if (saved) {
        setNotificationConfig(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await axios.get('/api/admin/settings/notifications/recent');
      if (response.data) {
        setRecentNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
    }
  };

  const saveConfig = async () => {
    try {
      await axios.put('/api/admin/settings/notifications/config', notificationConfig);
      localStorage.setItem('settingsNotificationConfig', JSON.stringify(notificationConfig));
      
      toast({
        title: 'Configuration Saved',
        description: 'Email notification settings have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error saving config:', error);
      // Save locally even if API fails
      localStorage.setItem('settingsNotificationConfig', JSON.stringify(notificationConfig));
      toast({
        title: 'Saved Locally',
        description: 'Configuration saved to browser (API unavailable)',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const sendTestNotification = async () => {
    setTestLoading(true);
    try {
      await axios.post('/api/admin/settings/notifications/test', {
        recipients: notificationConfig.recipients
      });
      
      toast({
        title: 'Test Email Sent',
        description: `Test notification sent to ${notificationConfig.recipients.length} recipient(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error.response?.data?.message || 'Failed to send test email',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setTestLoading(false);
    }
  };

  const addRecipient = () => {
    const email = newRecipient.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (notificationConfig.recipients.includes(email)) {
      toast({
        title: 'Duplicate Email',
        description: 'This email is already in the recipient list',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setNotificationConfig(prev => ({
      ...prev,
      recipients: [...prev.recipients, email]
    }));
    setNewRecipient('');
  };

  const removeRecipient = (email) => {
    setNotificationConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const toggleCategory = (category) => {
    setNotificationConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Loading notification settings...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Email Notifications for Settings Changes</Heading>
          <Text fontSize="sm" color="gray.600">
            Configure email alerts when critical settings are modified
          </Text>
        </Box>

        <Tabs colorScheme="blue">
          <TabList>
            <Tab>Configuration</Tab>
            <Tab>Critical Settings</Tab>
            <Tab>Recent Notifications</Tab>
          </TabList>

          <TabPanels>
            {/* Configuration Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={6} align="stretch">
                {/* Enable/Disable */}
                <Card borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">Enable Email Notifications</Text>
                        <Text fontSize="sm" color="gray.600">
                          Send email alerts when settings are changed
                        </Text>
                      </VStack>
                      <Switch
                        size="lg"
                        colorScheme="blue"
                        isChecked={notificationConfig.enabled}
                        onChange={(e) => setNotificationConfig(prev => ({ 
                          ...prev, 
                          enabled: e.target.checked 
                        }))}
                      />
                    </HStack>
                  </CardBody>
                </Card>

                {/* Recipients */}
                <Card borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">Email Recipients</Heading>
                      
                      <HStack>
                        <Input
                          placeholder="admin@example.com"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                        />
                        <Button colorScheme="blue" onClick={addRecipient}>
                          Add
                        </Button>
                      </HStack>

                      <List spacing={2}>
                        {notificationConfig.recipients.map((email, index) => (
                          <ListItem key={index}>
                            <HStack justify="space-between" p={2} bg={bgColor} borderRadius="md" borderWidth={1}>
                              <HStack>
                                <Icon as={EmailIcon} color="blue.500" />
                                <Text>{email}</Text>
                              </HStack>
                              <Button 
                                size="sm" 
                                colorScheme="red" 
                                variant="ghost"
                                onClick={() => removeRecipient(email)}
                              >
                                Remove
                              </Button>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>

                      {notificationConfig.recipients.length === 0 && (
                        <Alert status="warning">
                          <AlertIcon />
                          <AlertDescription fontSize="sm">
                            No recipients configured. Add at least one email address.
                          </AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Notification Options */}
                <Card borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">Notification Options</Heading>

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Critical changes only</FormLabel>
                        <Switch
                          isChecked={notificationConfig.criticalOnly}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            criticalOnly: e.target.checked 
                          }))}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Include user information</FormLabel>
                        <Switch
                          isChecked={notificationConfig.includeUserInfo}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            includeUserInfo: e.target.checked 
                          }))}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Include old value</FormLabel>
                        <Switch
                          isChecked={notificationConfig.includeOldValue}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            includeOldValue: e.target.checked 
                          }))}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Include new value</FormLabel>
                        <Switch
                          isChecked={notificationConfig.includeNewValue}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            includeNewValue: e.target.checked 
                          }))}
                        />
                      </FormControl>

                      <Divider />

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Notify on template apply</FormLabel>
                        <Switch
                          isChecked={notificationConfig.notifyOnTemplateApply}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            notifyOnTemplateApply: e.target.checked 
                          }))}
                        />
                      </FormControl>

                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <FormLabel mb={0}>Notify on bulk import</FormLabel>
                        <Switch
                          isChecked={notificationConfig.notifyOnBulkImport}
                          onChange={(e) => setNotificationConfig(prev => ({ 
                            ...prev, 
                            notifyOnBulkImport: e.target.checked 
                          }))}
                        />
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Categories to Monitor */}
                <Card borderWidth={1} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">Categories to Monitor</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Select which setting categories should trigger notifications
                      </Text>

                      {Object.keys(notificationConfig.categories).map((category) => (
                        <FormControl 
                          key={category}
                          display="flex" 
                          alignItems="center" 
                          justifyContent="space-between"
                        >
                          <FormLabel mb={0} textTransform="capitalize">
                            {category}
                          </FormLabel>
                          <Switch
                            colorScheme="blue"
                            isChecked={notificationConfig.categories[category]}
                            onChange={() => toggleCategory(category)}
                          />
                        </FormControl>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Actions */}
                <HStack spacing={4}>
                  <Button
                    colorScheme="blue"
                    onClick={saveConfig}
                    leftIcon={<CheckCircleIcon />}
                  >
                    Save Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={sendTestNotification}
                    isLoading={testLoading}
                    leftIcon={<EmailIcon />}
                    isDisabled={!notificationConfig.enabled || notificationConfig.recipients.length === 0}
                  >
                    Send Test Email
                  </Button>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Critical Settings Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    The following settings are classified as critical and will trigger email notifications when changed (if the category is enabled)
                  </AlertDescription>
                </Alert>

                {Object.entries(criticalSettings).map(([category, settings]) => (
                  <Card key={category} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Heading size="sm" textTransform="capitalize">
                            {category} Settings
                          </Heading>
                          <Badge 
                            colorScheme={notificationConfig.categories[category] ? 'green' : 'gray'}
                          >
                            {notificationConfig.categories[category] ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </HStack>
                        <List spacing={2}>
                          {settings.map((setting, index) => (
                            <ListItem key={index}>
                              <HStack>
                                <ListIcon as={setting.icon} color="blue.500" />
                                <Text fontSize="sm">{setting.label}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  ({setting.key})
                                </Text>
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            {/* Recent Notifications Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={4} align="stretch">
                {recentNotifications.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      No notifications have been sent yet
                    </AlertDescription>
                  </Alert>
                ) : (
                  recentNotifications.map((notification, index) => (
                    <Card key={index} borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <HStack>
                              <Icon as={BellIcon} color="blue.500" />
                              <Text fontWeight="medium">{notification.subject}</Text>
                            </HStack>
                            <Badge colorScheme={notification.status === 'sent' ? 'green' : 'red'}>
                              {notification.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {notification.message}
                          </Text>
                          <HStack fontSize="xs" color="gray.500">
                            <Text>To: {notification.recipients?.join(', ')}</Text>
                            <Text>•</Text>
                            <Text>{new Date(notification.timestamp).toLocaleString()}</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default SettingsNotifications;
