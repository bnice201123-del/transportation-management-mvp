import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Button,
  Divider,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Icon,
  Flex,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark
} from '@chakra-ui/react';
import {
  SettingsIcon,
  CheckIcon,
  WarningIcon,
  InfoIcon,
  DeleteIcon,
  EditIcon,
  DownloadIcon
} from '@chakra-ui/icons';
import { FaDatabase, FaLock, FaBell, FaMap, FaCog, FaUsers } from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();

  // Mock settings data - replace with actual API calls
  const mockSettings = {
    system: {
      siteName: 'Transportation Management System',
      siteDescription: 'Comprehensive transportation management platform',
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxUsers: 500,
      sessionTimeout: 30,
      autoBackup: true,
      backupInterval: 24
    },
    security: {
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorAuth: false,
      sessionSecurity: 'standard'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      tripAlerts: true,
      systemAlerts: true,
      maintenanceAlerts: true,
      emergencyAlerts: true,
      notificationFrequency: 'immediate'
    },
    maps: {
      defaultZoom: 12,
      mapProvider: 'google',
      trafficLayer: true,
      satelliteView: false,
      routeOptimization: true,
      realTimeTracking: true,
      geofencing: false,
      mapTheme: 'standard'
    },
    business: {
      currency: 'USD',
      timezone: 'America/New_York',
      businessHours: {
        start: '06:00',
        end: '22:00'
      },
      weekendService: true,
      holidayService: false,
      maxTripDistance: 50,
      defaultTripType: 'standard',
      pricePerMile: 2.50,
      baseFare: 5.00
    },
    integration: {
      googleMapsApi: true,
      firebaseAuth: true,
      paymentGateway: 'stripe',
      smsProvider: 'twilio',
      emailProvider: 'sendgrid',
      analyticsTracking: true,
      thirdPartyIntegrations: []
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await axios.get('/admin/settings');
      // setSettings(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setSettings(mockSettings);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Failed to load system settings',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoading(false);
    }
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Replace with actual API call
      // await axios.put('/admin/settings', settings);
      
      // Mock save delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setHasChanges(false);
      toast({
        title: 'Settings saved',
        description: 'All system settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'Failed to save system settings',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      // Reset to default settings
      setSettings(mockSettings);
      setHasChanges(false);
      onResetClose();
      toast({
        title: 'Settings reset',
        description: 'All settings have been reset to default values',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Error resetting settings',
        description: 'Failed to reset settings to defaults',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const SettingCard = ({ title, icon, children }) => (
    <Card>
      <CardHeader>
        <HStack>
          <Icon as={icon} color="blue.500" />
          <Heading size="md">{title}</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {children}
        </VStack>
      </CardBody>
    </Card>
  );

  const SettingRow = ({ label, description, children }) => (
    <HStack justify="space-between" align="start">
      <VStack align="start" spacing={1} flex={1}>
        <Text fontWeight="medium">{label}</Text>
        {description && (
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        )}
      </VStack>
      <Box minW="200px">
        {children}
      </Box>
    </HStack>
  );

  if (loading) {
    return (
      <Box minH="100vh">
        <Navbar />
        <Center mt={20}>
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      <Navbar />
      <Container maxW="7xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="gray.700">
                System Settings
              </Heading>
              <Text color="gray.500">
                Configure system-wide settings and preferences
              </Text>
            </VStack>
            <HStack>
              {hasChanges && (
                <Badge colorScheme="orange" fontSize="sm">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={onResetOpen}
                leftIcon={<DeleteIcon />}
              >
                Reset to Default
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSave}
                isLoading={saving}
                loadingText="Saving..."
                leftIcon={<CheckIcon />}
                isDisabled={!hasChanges}
              >
                Save Changes
              </Button>
            </HStack>
          </Flex>

          <Tabs variant="enclosed">
            <TabList>
              <Tab>System</Tab>
              <Tab>Security</Tab>
              <Tab>Notifications</Tab>
              <Tab>Maps & Location</Tab>
              <Tab>Business</Tab>
              <Tab>Integrations</Tab>
            </TabList>

            <TabPanels>
              {/* System Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="General Settings" icon={FaCog}>
                    <SettingRow
                      label="Site Name"
                      description="The name displayed across the application"
                    >
                      <Input
                        value={settings.system?.siteName || ''}
                        onChange={(e) => handleSettingChange('system', 'siteName', e.target.value)}
                      />
                    </SettingRow>
                    
                    <SettingRow
                      label="Site Description"
                      description="Brief description of your transportation service"
                    >
                      <Textarea
                        value={settings.system?.siteDescription || ''}
                        onChange={(e) => handleSettingChange('system', 'siteDescription', e.target.value)}
                        rows={3}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Maintenance Mode"
                      description="Enable to prevent users from accessing the system"
                    >
                      <Switch
                        isChecked={settings.system?.maintenanceMode}
                        onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Debug Mode"
                      description="Enable detailed logging for troubleshooting"
                    >
                      <Switch
                        isChecked={settings.system?.debugMode}
                        onChange={(e) => handleSettingChange('system', 'debugMode', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Log Level"
                      description="Set the minimum level for system logging"
                    >
                      <Select
                        value={settings.system?.logLevel || 'info'}
                        onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </Select>
                    </SettingRow>
                  </SettingCard>

                  <SettingCard title="Performance & Limits" icon={SettingsIcon}>
                    <SettingRow
                      label="Maximum Users"
                      description="Maximum number of concurrent users allowed"
                    >
                      <NumberInput
                        value={settings.system?.maxUsers}
                        onChange={(value) => handleSettingChange('system', 'maxUsers', parseInt(value))}
                        min={1}
                        max={10000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Session Timeout"
                      description="User session timeout in minutes"
                    >
                      <NumberInput
                        value={settings.system?.sessionTimeout}
                        onChange={(value) => handleSettingChange('system', 'sessionTimeout', parseInt(value))}
                        min={5}
                        max={480}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Auto Backup"
                      description="Automatically backup system data"
                    >
                      <Switch
                        isChecked={settings.system?.autoBackup}
                        onChange={(e) => handleSettingChange('system', 'autoBackup', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Backup Interval"
                      description="Hours between automatic backups"
                    >
                      <NumberInput
                        value={settings.system?.backupInterval}
                        onChange={(value) => handleSettingChange('system', 'backupInterval', parseInt(value))}
                        min={1}
                        max={168}
                        isDisabled={!settings.system?.autoBackup}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>

              {/* Security Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="Password Policy" icon={FaLock}>
                    <SettingRow
                      label="Minimum Length"
                      description="Minimum number of characters required"
                    >
                      <NumberInput
                        value={settings.security?.passwordMinLength}
                        onChange={(value) => handleSettingChange('security', 'passwordMinLength', parseInt(value))}
                        min={6}
                        max={50}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Require Special Characters"
                      description="Passwords must contain special characters"
                    >
                      <Switch
                        isChecked={settings.security?.passwordRequireSpecial}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireSpecial', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Require Numbers"
                      description="Passwords must contain numeric characters"
                    >
                      <Switch
                        isChecked={settings.security?.passwordRequireNumbers}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Require Uppercase"
                      description="Passwords must contain uppercase letters"
                    >
                      <Switch
                        isChecked={settings.security?.passwordRequireUppercase}
                        onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)}
                      />
                    </SettingRow>
                  </SettingCard>

                  <SettingCard title="Authentication Security" icon={FaLock}>
                    <SettingRow
                      label="Max Login Attempts"
                      description="Maximum failed login attempts before lockout"
                    >
                      <NumberInput
                        value={settings.security?.maxLoginAttempts}
                        onChange={(value) => handleSettingChange('security', 'maxLoginAttempts', parseInt(value))}
                        min={3}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Lockout Duration"
                      description="Account lockout duration in minutes"
                    >
                      <NumberInput
                        value={settings.security?.lockoutDuration}
                        onChange={(value) => handleSettingChange('security', 'lockoutDuration', parseInt(value))}
                        min={5}
                        max={1440}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Two-Factor Authentication"
                      description="Require 2FA for all admin accounts"
                    >
                      <Switch
                        isChecked={settings.security?.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Session Security"
                      description="Level of session security enforcement"
                    >
                      <Select
                        value={settings.security?.sessionSecurity || 'standard'}
                        onChange={(e) => handleSettingChange('security', 'sessionSecurity', e.target.value)}
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="high">High</option>
                        <option value="maximum">Maximum</option>
                      </Select>
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>

              {/* Notifications Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="Notification Channels" icon={FaBell}>
                    <SettingRow
                      label="Email Notifications"
                      description="Send notifications via email"
                    >
                      <Switch
                        isChecked={settings.notifications?.emailNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="SMS Notifications"
                      description="Send notifications via SMS"
                    >
                      <Switch
                        isChecked={settings.notifications?.smsNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Push Notifications"
                      description="Send browser/mobile push notifications"
                    >
                      <Switch
                        isChecked={settings.notifications?.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                      />
                    </SettingRow>
                  </SettingCard>

                  <SettingCard title="Notification Types" icon={FaBell}>
                    <SettingRow
                      label="Trip Alerts"
                      description="Notify about trip updates and changes"
                    >
                      <Switch
                        isChecked={settings.notifications?.tripAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'tripAlerts', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="System Alerts"
                      description="Notify about system events and errors"
                    >
                      <Switch
                        isChecked={settings.notifications?.systemAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Maintenance Alerts"
                      description="Notify about scheduled maintenance"
                    >
                      <Switch
                        isChecked={settings.notifications?.maintenanceAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'maintenanceAlerts', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Emergency Alerts"
                      description="Critical emergency notifications"
                    >
                      <Switch
                        isChecked={settings.notifications?.emergencyAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'emergencyAlerts', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Notification Frequency"
                      description="How often to send notification batches"
                    >
                      <Select
                        value={settings.notifications?.notificationFrequency || 'immediate'}
                        onChange={(e) => handleSettingChange('notifications', 'notificationFrequency', e.target.value)}
                      >
                        <option value="immediate">Immediate</option>
                        <option value="5min">Every 5 minutes</option>
                        <option value="15min">Every 15 minutes</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                      </Select>
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>

              {/* Maps Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="Map Configuration" icon={FaMap}>
                    <SettingRow
                      label="Default Zoom Level"
                      description="Initial zoom level for maps"
                    >
                      <Box>
                        <Slider
                          value={settings.maps?.defaultZoom || 12}
                          onChange={(value) => handleSettingChange('maps', 'defaultZoom', value)}
                          min={1}
                          max={20}
                          step={1}
                        >
                          <SliderMark value={1} mt={2} fontSize="sm">1</SliderMark>
                          <SliderMark value={10} mt={2} fontSize="sm">10</SliderMark>
                          <SliderMark value={20} mt={2} fontSize="sm">20</SliderMark>
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text textAlign="center" mt={6} fontSize="sm">
                          Current: {settings.maps?.defaultZoom}
                        </Text>
                      </Box>
                    </SettingRow>

                    <SettingRow
                      label="Map Provider"
                      description="Default map service provider"
                    >
                      <Select
                        value={settings.maps?.mapProvider || 'google'}
                        onChange={(e) => handleSettingChange('maps', 'mapProvider', e.target.value)}
                      >
                        <option value="google">Google Maps</option>
                        <option value="mapbox">Mapbox</option>
                        <option value="openstreet">OpenStreetMap</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="Traffic Layer"
                      description="Show real-time traffic information"
                    >
                      <Switch
                        isChecked={settings.maps?.trafficLayer}
                        onChange={(e) => handleSettingChange('maps', 'trafficLayer', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Satellite View"
                      description="Enable satellite imagery option"
                    >
                      <Switch
                        isChecked={settings.maps?.satelliteView}
                        onChange={(e) => handleSettingChange('maps', 'satelliteView', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Route Optimization"
                      description="Automatically optimize trip routes"
                    >
                      <Switch
                        isChecked={settings.maps?.routeOptimization}
                        onChange={(e) => handleSettingChange('maps', 'routeOptimization', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Real-time Tracking"
                      description="Enable live vehicle tracking"
                    >
                      <Switch
                        isChecked={settings.maps?.realTimeTracking}
                        onChange={(e) => handleSettingChange('maps', 'realTimeTracking', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Geofencing"
                      description="Enable location-based alerts and restrictions"
                    >
                      <Switch
                        isChecked={settings.maps?.geofencing}
                        onChange={(e) => handleSettingChange('maps', 'geofencing', e.target.checked)}
                      />
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>

              {/* Business Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="Business Configuration" icon={FaUsers}>
                    <SettingRow
                      label="Currency"
                      description="Default currency for pricing"
                    >
                      <Select
                        value={settings.business?.currency || 'USD'}
                        onChange={(e) => handleSettingChange('business', 'currency', e.target.value)}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="Timezone"
                      description="Default timezone for the system"
                    >
                      <Select
                        value={settings.business?.timezone || 'America/New_York'}
                        onChange={(e) => handleSettingChange('business', 'timezone', e.target.value)}
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="Weekend Service"
                      description="Operate on weekends"
                    >
                      <Switch
                        isChecked={settings.business?.weekendService}
                        onChange={(e) => handleSettingChange('business', 'weekendService', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Holiday Service"
                      description="Operate on holidays"
                    >
                      <Switch
                        isChecked={settings.business?.holidayService}
                        onChange={(e) => handleSettingChange('business', 'holidayService', e.target.checked)}
                      />
                    </SettingRow>

                    <SettingRow
                      label="Max Trip Distance"
                      description="Maximum trip distance in miles"
                    >
                      <NumberInput
                        value={settings.business?.maxTripDistance}
                        onChange={(value) => handleSettingChange('business', 'maxTripDistance', parseInt(value))}
                        min={1}
                        max={500}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Base Fare"
                      description="Base fare for all trips"
                    >
                      <NumberInput
                        value={settings.business?.baseFare}
                        onChange={(value) => handleSettingChange('business', 'baseFare', parseFloat(value))}
                        min={0}
                        max={100}
                        step={0.25}
                        precision={2}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>

                    <SettingRow
                      label="Price Per Mile"
                      description="Cost per mile of travel"
                    >
                      <NumberInput
                        value={settings.business?.pricePerMile}
                        onChange={(value) => handleSettingChange('business', 'pricePerMile', parseFloat(value))}
                        min={0}
                        max={20}
                        step={0.05}
                        precision={2}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>

              {/* Integrations Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <SettingCard title="API Integrations" icon={FaDatabase}>
                    <SettingRow
                      label="Google Maps API"
                      description="Integration with Google Maps services"
                    >
                      <HStack>
                        <Badge colorScheme={settings.integration?.googleMapsApi ? 'green' : 'red'}>
                          {settings.integration?.googleMapsApi ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </HStack>
                    </SettingRow>

                    <SettingRow
                      label="Firebase Authentication"
                      description="Firebase auth service integration"
                    >
                      <HStack>
                        <Badge colorScheme={settings.integration?.firebaseAuth ? 'green' : 'red'}>
                          {settings.integration?.firebaseAuth ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </HStack>
                    </SettingRow>

                    <SettingRow
                      label="Payment Gateway"
                      description="Payment processing service"
                    >
                      <Select
                        value={settings.integration?.paymentGateway || 'stripe'}
                        onChange={(e) => handleSettingChange('integration', 'paymentGateway', e.target.value)}
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="square">Square</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="SMS Provider"
                      description="SMS notification service"
                    >
                      <Select
                        value={settings.integration?.smsProvider || 'twilio'}
                        onChange={(e) => handleSettingChange('integration', 'smsProvider', e.target.value)}
                      >
                        <option value="twilio">Twilio</option>
                        <option value="nexmo">Vonage (Nexmo)</option>
                        <option value="aws-sns">AWS SNS</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="Email Provider"
                      description="Email service provider"
                    >
                      <Select
                        value={settings.integration?.emailProvider || 'sendgrid'}
                        onChange={(e) => handleSettingChange('integration', 'emailProvider', e.target.value)}
                      >
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="ses">AWS SES</option>
                      </Select>
                    </SettingRow>

                    <SettingRow
                      label="Analytics Tracking"
                      description="Enable usage analytics collection"
                    >
                      <Switch
                        isChecked={settings.integration?.analyticsTracking}
                        onChange={(e) => handleSettingChange('integration', 'analyticsTracking', e.target.checked)}
                      />
                    </SettingRow>
                  </SettingCard>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Reset Confirmation Dialog */}
      <AlertDialog
        isOpen={isResetOpen}
        onClose={onResetClose}
        leastDestructiveRef={undefined}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reset Settings
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to reset all settings to their default values? 
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onResetClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleReset} ml={3}>
                Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AdminSettings;