import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
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
  Icon,
  Flex,
  useColorModeValue,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  Fade
} from '@chakra-ui/react';
import {
  SettingsIcon,
  CheckIcon,
  WarningIcon,
  SearchIcon,
  DownloadIcon,
  RepeatIcon,
  ArrowUpIcon,
  AttachmentIcon
} from '@chakra-ui/icons';
import { 
  FaServer, 
  FaShieldAlt, 
  FaBell, 
  FaMap, 
  FaBuilding, 
  FaPlug, 
  FaRocket, 
  FaDatabase,
  FaHistory
} from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [backupStatus, setBackupStatus] = useState('idle');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isBackupOpen, onOpen: onBackupOpen, onClose: onBackupClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Enhanced mock settings data
  const mockSettings = {
    system: {
      siteName: 'Transportation Management System',
      siteDescription: 'Comprehensive transportation management platform',
      companyName: 'TransportCorp Inc.',
      contactEmail: 'admin@transportcorp.com',
      supportPhone: '+1-800-TRANS',
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxUsers: 500,
      sessionTimeout: 30,
      autoBackup: true,
      backupInterval: 24,
      version: '2.1.4',
      environment: 'production'
    },
    security: {
      passwordMinLength: 8,
      passwordMaxLength: 128,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorAuth: false,
      sslRequired: true,
      auditLogging: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      tripAlerts: true,
      systemAlerts: true,
      emergencyAlerts: true,
      notificationFrequency: 'immediate'
    },
    maps: {
      defaultZoom: 12,
      mapProvider: 'google',
      trafficLayer: true,
      satelliteView: false,
      realTimeTracking: true
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
      pricePerMile: 2.50,
      baseFare: 5.00
    },
    integration: {
      googleMapsApi: { enabled: true, status: 'active' },
      firebaseAuth: { enabled: true, status: 'active' },
      paymentGateway: { provider: 'stripe', status: 'active' },
      smsProvider: { provider: 'twilio', status: 'active' },
      emailProvider: { provider: 'sendgrid', status: 'active' }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
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

  const handleSettingChange = (category, field, value, subField = null) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      if (subField) {
        newSettings[category] = {
          ...prev[category],
          [field]: {
            ...prev[category][field],
            [subField]: value
          }
        };
      } else {
        newSettings[category] = {
          ...prev[category],
          [field]: value
        };
      }
      return newSettings;
    });
    setHasChanges(true);
    
    // Add to change history
    const timestamp = new Date().toLocaleString();
    setChangeHistory(prev => [
      {
        timestamp,
        category,
        field: subField ? `${field}.${subField}` : field,
        value,
        action: 'modified'
      },
      ...prev.slice(0, 49) // Keep last 50 changes
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock save delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setHasChanges(false);
      setLastSaved(new Date());
      toast({
        title: 'Settings saved',
        description: 'All system settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Failed to save settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = async () => {
    setExportLoading(true);
    try {
      const dataToExport = {
        settings,
        exportDate: new Date().toISOString(),
        version: settings.system?.version || '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transport-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Settings Exported',
        description: 'Settings have been exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export settings',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setExportLoading(false);
      onExportClose();
    }
  };

  const handleImportSettings = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      if (importedData.settings) {
        setSettings(importedData.settings);
        setHasChanges(true);
        
        toast({
          title: 'Settings Imported',
          description: 'Settings have been imported successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        throw new Error('Invalid settings file format');
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import settings: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setImportLoading(false);
      onImportClose();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBackupNow = async () => {
    setBackupStatus('running');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Mock backup
      
      setBackupStatus('completed');
      toast({
        title: 'Backup Completed',
        description: 'System backup has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      setTimeout(() => setBackupStatus('idle'), 2000);
    } catch (error) {
      setBackupStatus('failed');
      toast({
        title: 'Backup Failed',
        description: 'Failed to create system backup',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setTimeout(() => setBackupStatus('idle'), 2000);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTabs = [
    { label: 'System', icon: FaServer, key: 'system' },
    { label: 'Security', icon: FaShieldAlt, key: 'security' },
    { label: 'Notifications', icon: FaBell, key: 'notifications' },
    { label: 'Maps & GPS', icon: FaMap, key: 'maps' },
    { label: 'Business', icon: FaBuilding, key: 'business' },
    { label: 'Integration', icon: FaPlug, key: 'integration' }
  ].filter(tab => 
    tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tab.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SettingRow = ({ label, description, children, error }) => (
    <HStack justify="space-between" align="start" spacing={4}>
      <VStack align="start" spacing={1} flex={1}>
        <Text fontWeight="medium" color={textColor}>{label}</Text>
        {description && (
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        )}
        {error && (
          <Text fontSize="sm" color="red.500">
            {error}
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
      <Box bg={bgColor}>
        <Navbar />
        <Center mt={20}>
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bgColor}>
      <Navbar />
      
      {/* Scrollable Container */}
      <Box 
        ref={scrollRef}
        maxH="calc(100vh - 80px)" 
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '4px',
          },
        }}
      >
        <Container maxW="7xl" py={6}>
          <VStack spacing={6} align="stretch">
            {/* Enhanced Header */}
            <Fade in={true}>
              <Card bg={cardBg} borderColor={borderColor} shadow="sm">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Breadcrumbs */}
                    <Breadcrumb fontSize="sm" color="gray.500">
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink>Settings</BreadcrumbLink>
                      </BreadcrumbItem>
                    </Breadcrumb>

                    {/* Header Content */}
                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Icon as={SettingsIcon} boxSize={6} color="blue.500" />
                          <Heading size="lg" color={textColor}>
                            System Settings & Configuration
                          </Heading>
                        </HStack>
                        <Text color="gray.500">
                          Configure system-wide settings, integrations, and preferences
                        </Text>
                        {lastSaved && (
                          <Text fontSize="sm" color="gray.400">
                            Last saved: {lastSaved.toLocaleString()}
                          </Text>
                        )}
                      </VStack>

                      {/* Action Buttons */}
                      <HStack spacing={3} wrap="wrap">
                        {hasChanges && (
                          <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                            Pending Changes
                          </Badge>
                        )}

                        <ButtonGroup size="sm">
                          <Tooltip label="Export all settings">
                            <Button
                              leftIcon={<DownloadIcon />}
                              onClick={onExportOpen}
                              variant="outline"
                              isLoading={exportLoading}
                            >
                              Export
                            </Button>
                          </Tooltip>

                          <Tooltip label="Import settings">
                            <Button
                              leftIcon={<AttachmentIcon />}
                              onClick={onImportOpen}
                              variant="outline"
                              isLoading={importLoading}
                            >
                              Import
                            </Button>
                          </Tooltip>

                          <Tooltip label="Create backup">
                            <Button
                              leftIcon={<FaDatabase />}
                              onClick={onBackupOpen}
                              variant="outline"
                              colorScheme="purple"
                            >
                              Backup
                            </Button>
                          </Tooltip>
                        </ButtonGroup>

                        <ButtonGroup size="sm">
                          {hasChanges && (
                            <Button
                              onClick={() => {
                                setSettings(mockSettings);
                                setHasChanges(false);
                              }}
                              variant="ghost"
                              colorScheme="red"
                            >
                              Discard
                            </Button>
                          )}
                          
                          <Button
                            leftIcon={<CheckIcon />}
                            onClick={handleSave}
                            isLoading={saving}
                            loadingText="Saving..."
                            colorScheme="blue"
                            isDisabled={!hasChanges}
                          >
                            Save All Changes
                          </Button>
                        </ButtonGroup>
                      </HStack>
                    </Flex>

                    {/* Search Bar */}
                    <InputGroup maxW="400px">
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search settings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                      />
                    </InputGroup>

                    {/* Quick Stats */}
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Stat>
                        <StatLabel fontSize="xs">Total Settings</StatLabel>
                        <StatNumber fontSize="lg">
                          {Object.keys(settings).reduce((count, category) => 
                            count + Object.keys(settings[category] || {}).length, 0
                          )}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">Active Integrations</StatLabel>
                        <StatNumber fontSize="lg">5</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">System Status</StatLabel>
                        <StatNumber fontSize="lg" color="green.500">Healthy</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">Last Backup</StatLabel>
                        <StatNumber fontSize="lg">2h ago</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </Fade>

            {/* System Status Alert */}
            {settings.system?.maintenanceMode && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertTitle>Maintenance Mode Active!</AlertTitle>
                <AlertDescription>
                  The system is currently in maintenance mode. Users may experience limited functionality.
                </AlertDescription>
              </Alert>
            )}

            {/* Change History */}
            {changeHistory.length > 0 && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Flex justify="between" align="center">
                    <HStack>
                      <Icon as={FaHistory} color="blue.500" />
                      <Text fontWeight="semibold" color={textColor}>Recent Changes</Text>
                      <Badge colorScheme="blue">{changeHistory.length}</Badge>
                    </HStack>
                    <Button size="sm" variant="ghost" onClick={() => setChangeHistory([])}>
                      Clear History
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            )}

            {/* Main Settings Tabs */}
            <Card bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardBody p={0}>
                <Tabs 
                  index={activeTab} 
                  onChange={setActiveTab}
                  variant="line"
                  colorScheme="blue"
                >
                  <TabList 
                    overflowX="auto" 
                    css={{
                      '&::-webkit-scrollbar': { display: 'none' },
                      scrollbarWidth: 'none'
                    }}
                    px={6}
                    pt={6}
                  >
                    {filteredTabs.map((tab, index) => (
                      <Tab key={tab.key} minW="fit-content">
                        <HStack spacing={2}>
                          <Icon as={tab.icon} boxSize={4} />
                          <Text>{tab.label}</Text>
                        </HStack>
                      </Tab>
                    ))}
                  </TabList>

                  <TabPanels>
                    {/* System Settings Panel */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>System Configuration</Heading>
                        <VStack spacing={4} align="stretch">
                          <SettingRow
                            label="Site Name"
                            description="The name of your transportation system"
                          >
                            <Input
                              value={settings.system?.siteName || ''}
                              onChange={(e) => handleSettingChange('system', 'siteName', e.target.value)}
                              placeholder="Enter site name"
                            />
                          </SettingRow>

                          <SettingRow
                            label="Company Name"
                            description="Your company's official name"
                          >
                            <Input
                              value={settings.system?.companyName || ''}
                              onChange={(e) => handleSettingChange('system', 'companyName', e.target.value)}
                              placeholder="Enter company name"
                            />
                          </SettingRow>

                          <SettingRow
                            label="Maximum Users"
                            description="Maximum number of concurrent users"
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
                            label="Maintenance Mode"
                            description="Enable to restrict access during maintenance"
                          >
                            <Switch
                              isChecked={settings.system?.maintenanceMode}
                              onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                              colorScheme="orange"
                            />
                          </SettingRow>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* Security Settings Panel */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>Security & Authentication</Heading>
                        <VStack spacing={4} align="stretch">
                          <SettingRow
                            label="Password Min Length"
                            description="Minimum password length required"
                          >
                            <NumberInput
                              value={settings.security?.passwordMinLength}
                              onChange={(value) => handleSettingChange('security', 'passwordMinLength', parseInt(value))}
                              min={6}
                              max={50}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </SettingRow>

                          <SettingRow
                            label="Two-Factor Authentication"
                            description="Require 2FA for admin accounts"
                          >
                            <Switch
                              isChecked={settings.security?.twoFactorAuth}
                              onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                              colorScheme="blue"
                            />
                          </SettingRow>

                          <SettingRow
                            label="SSL Required"
                            description="Force HTTPS connections"
                          >
                            <Switch
                              isChecked={settings.security?.sslRequired}
                              onChange={(e) => handleSettingChange('security', 'sslRequired', e.target.checked)}
                              colorScheme="green"
                            />
                          </SettingRow>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* Additional tabs with placeholder content */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>Notification Settings</Heading>
                        <Text color="gray.500">Configure notification preferences and channels.</Text>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>Maps & GPS Configuration</Heading>
                        <Text color="gray.500">Configure map settings and GPS tracking options.</Text>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>Business Settings</Heading>
                        <Text color="gray.500">Configure business rules, pricing, and operations.</Text>
                      </VStack>
                    </TabPanel>

                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color={textColor}>Integration Settings</Heading>
                        <Text color="gray.500">Manage third-party integrations and APIs.</Text>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>

            {/* Scroll to Top Button */}
            <Box position="fixed" bottom="20px" right="20px" zIndex={10}>
              <Button
                colorScheme="blue"
                size="sm"
                borderRadius="full"
                onClick={scrollToTop}
                leftIcon={<ArrowUpIcon />}
                shadow="lg"
              >
                Top
              </Button>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>This will download all system settings as a JSON file.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleExportSettings}
              isLoading={exportLoading}
            >
              Export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Select a settings JSON file to import.</Text>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportSettings}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onImportClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Backup Modal */}
      <Modal isOpen={isBackupOpen} onClose={onBackupClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>System Backup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Create a complete system backup including database, files, and configurations.</Text>
              {backupStatus === 'running' && (
                <Progress size="lg" isIndeterminate colorScheme="blue" width="100%" />
              )}
              {backupStatus === 'completed' && (
                <Alert status="success">
                  <AlertIcon />
                  Backup completed successfully!
                </Alert>
              )}
              {backupStatus === 'failed' && (
                <Alert status="error">
                  <AlertIcon />
                  Backup failed. Please try again.
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBackupClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleBackupNow}
              isLoading={backupStatus === 'running'}
              isDisabled={backupStatus === 'running'}
            >
              Start Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminSettings;