import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  useToast,
  Divider,
  Badge,
  ChangeEvent,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiSave,
  FiLogOut,
  FiBell,
  FiLock,
  FiUser,
  FiAlertTriangle,
  FiCheck,
  FiTrash2,
} from 'react-icons/fi';
import { useDualLogin } from '../../contexts/DualLoginContext';

/**
 * DriverSettings Component
 * 
 * Allows drivers to manage their account settings:
 * - Profile information
 * - Notification preferences
 * - Privacy & security settings
 * - Driver ID management
 * - Account actions (logout, delete account)
 */
const DriverSettings = ({ onLogout }) => {
  const { getDriverAxios, driverAuth, logoutDriver } = useDualLogin();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    userName: driverAuth?.userName || '',
    email: '',
    phone: '',
    department: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    alertNotifications: true,
    maintenanceAlerts: true,
    speedAlerts: true,
    geofenceAlerts: true,
    dailySummary: false,
  });

  // Privacy & Security
  const [privacy, setPrivacy] = useState({
    twoFactorEnabled: false,
    dataCollectionOptIn: true,
    shareLocationWithCompany: true,
    allowAnalytics: true,
  });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const driverAxios = getDriverAxios();

        const response = await driverAxios.get('/api/drivers/settings');

        if (response.data.success) {
          const data = response.data.data;
          if (data.profile) setProfile(data.profile);
          if (data.notifications) setNotifications(data.notifications);
          if (data.privacy) setPrivacy(data.privacy);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load settings';
        setError(message);
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [getDriverAxios]);

  // Handle profile changes
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Handle notification changes
  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Handle privacy changes
  const handlePrivacyChange = (field, value) => {
    setPrivacy(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      const driverAxios = getDriverAxios();

      const response = await driverAxios.put('/api/drivers/settings', {
        profile,
        notifications,
        privacy,
      });

      if (response.data.success) {
        setHasChanges(false);
        toast({
          title: 'Success',
          description: 'Your settings have been saved',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save settings';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      logoutDriver();
      if (onLogout) {
        onLogout();
      }
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        status: 'success',
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack justify="center" py={10}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading your settings...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="md">⚙️ Settings</Heading>
              <Text fontSize="sm" color="gray.500">Driver ID: {driverAuth?.driverId}</Text>
            </VStack>
            {hasChanges && (
              <Badge colorScheme="orange">Unsaved Changes</Badge>
            )}
          </HStack>
        </CardBody>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>
            <Icon as={FiUser} mr={2} />
            Profile
          </Tab>
          <Tab>
            <Icon as={FiBell} mr={2} />
            Notifications
          </Tab>
          <Tab>
            <Icon as={FiLock} mr={2} />
            Privacy & Security
          </Tab>
        </TabList>

        <TabPanels>
          {/* Profile Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Personal Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Full Name</FormLabel>
                      <Input
                        value={profile.userName}
                        onChange={(e) => handleProfileChange('userName', e.target.value)}
                        placeholder="Your full name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Email Address</FormLabel>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        placeholder="your.email@company.com"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Phone Number</FormLabel>
                      <Input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Department</FormLabel>
                      <Input
                        value={profile.department}
                        onChange={(e) => handleProfileChange('department', e.target.value)}
                        placeholder="e.g., Operations"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Emergency Contact</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Contact Name</FormLabel>
                      <Input
                        value={profile.emergencyContact}
                        onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Contact Phone</FormLabel>
                      <Input
                        type="tel"
                        value={profile.emergencyPhone}
                        onChange={(e) => handleProfileChange('emergencyPhone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Notification Channels</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Email Notifications</FormLabel>
                      <Switch
                        isChecked={notifications.emailNotifications}
                        onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>SMS Notifications</FormLabel>
                      <Switch
                        isChecked={notifications.smsNotifications}
                        onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Push Notifications</FormLabel>
                      <Switch
                        isChecked={notifications.pushNotifications}
                        onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Alert Types</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>General Alerts</FormLabel>
                      <Switch
                        isChecked={notifications.alertNotifications}
                        onChange={(e) => handleNotificationChange('alertNotifications', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Maintenance Alerts</FormLabel>
                      <Switch
                        isChecked={notifications.maintenanceAlerts}
                        onChange={(e) => handleNotificationChange('maintenanceAlerts', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Speed Alerts</FormLabel>
                      <Switch
                        isChecked={notifications.speedAlerts}
                        onChange={(e) => handleNotificationChange('speedAlerts', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Geofence Alerts</FormLabel>
                      <Switch
                        isChecked={notifications.geofenceAlerts}
                        onChange={(e) => handleNotificationChange('geofenceAlerts', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Daily Summary</FormLabel>
                      <Switch
                        isChecked={notifications.dailySummary}
                        onChange={(e) => handleNotificationChange('dailySummary', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Privacy & Security Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Heading size="sm">Security Settings</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Two-Factor Authentication</FormLabel>
                      <Switch
                        isChecked={privacy.twoFactorEnabled}
                        onChange={(e) => handlePrivacyChange('twoFactorEnabled', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <Text fontSize="sm" color="gray.600">
                      💡 Two-factor authentication adds an extra layer of security to your account
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="sm">Data & Privacy</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Data Collection</FormLabel>
                      <Switch
                        isChecked={privacy.dataCollectionOptIn}
                        onChange={(e) => handlePrivacyChange('dataCollectionOptIn', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Share Location with Company</FormLabel>
                      <Switch
                        isChecked={privacy.shareLocationWithCompany}
                        onChange={(e) => handlePrivacyChange('shareLocationWithCompany', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Allow Usage Analytics</FormLabel>
                      <Switch
                        isChecked={privacy.allowAnalytics}
                        onChange={(e) => handlePrivacyChange('allowAnalytics', e.target.checked)}
                        ml="auto"
                      />
                    </FormControl>

                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Your data is encrypted and handled according to our privacy policy
                      </Text>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>

              <Card borderColor="red.200" borderWidth={1}>
                <CardHeader>
                  <Heading size="sm" color="red.600">⚠️ Danger Zone</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      These actions cannot be undone. Please proceed with caution.
                    </Text>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<FiLogOut />}
                      onClick={handleLogout}
                    >
                      Logout Account
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<FiTrash2 />}
                      onClick={onOpen}
                    >
                      Delete Account
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Save Button */}
      {hasChanges && (
        <HStack spacing={3} justify="flex-end">
          <Button
            colorScheme="blue"
            leftIcon={<FiSave />}
            onClick={handleSaveSettings}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </HStack>
      )}

      {/* Delete Account Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderColor="red.300">
          <ModalHeader color="red.600">Delete Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Alert status="error">
                <AlertIcon />
                <Text fontSize="sm">
                  This action is permanent and cannot be undone. All your data will be deleted.
                </Text>
              </Alert>
              <Text fontSize="sm">
                Are you sure you want to delete your driver account? This will also delete:
              </Text>
              <VStack spacing={1} align="start" pl={4}>
                <Text fontSize="sm">• Your driver ID and login credentials</Text>
                <Text fontSize="sm">• Associated tracker data</Text>
                <Text fontSize="sm">• Historical activity logs</Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red">
                Yes, Delete Everything
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default DriverSettings;
