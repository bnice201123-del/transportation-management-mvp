import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  useBreakpointValue,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  Fade,
  Slide,
  ScaleFade,
  Collapse,
  IconButton,
  Grid,
  GridItem,
  Skeleton,
  SkeletonText,
  CircularProgress,
  CircularProgressLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  FormErrorMessage,
  FormHelperText,
  Textarea,
  Code,
  List,
  ListItem,
  ListIcon,
  useClipboard,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import {
  SettingsIcon,
  CheckIcon,
  WarningIcon,
  SearchIcon,
  DownloadIcon,
  RepeatIcon,
  ArrowUpIcon,
  AttachmentIcon,
  InfoIcon,
  EditIcon,
  ViewIcon,
  CopyIcon,
  CloseIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TimeIcon,
  CalendarIcon,
  LockIcon,
  UnlockIcon
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
  FaHistory,
  FaUsers,
  FaCog,
  FaExchangeAlt,
  FaFileImport,
  FaChartLine,
  FaGlobe,
  FaCloud,
  FaSave,
  FaSync,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaTools,
  FaNetworkWired,
  FaMobile,
  FaDesktop,
  FaTablet,
  FaPalette,
  FaLanguage,
  FaClock,
  FaLock,
  FaClipboardList,
  FaCalendarAlt,
  FaKey,
  FaBars
} from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';
import AuditLogViewer from './AuditLogViewer';
import HolidayManagement from './HolidayManagement';
import RateLimitMonitor from './RateLimitMonitor';
import SessionManager from './SessionManager';
import EncryptionManager from './EncryptionManager';
import PermissionMatrix from './PermissionMatrix';
import SecurityMonitor from './SecurityMonitor';
import LoginAttemptMonitor from './LoginAttemptMonitor';
import GeoSecurityManager from './GeoSecurityManager';
import SidebarSettings from '../shared/SidebarSettings';
import SettingsHistory from './SettingsHistory';
import SettingsTemplates from './SettingsTemplates';
import SettingsNotifications from './SettingsNotifications';
import SettingsRollback from './SettingsRollback';
import SettingsComparison from './SettingsComparison';
import SettingsImportExport from './SettingsImportExport';
import SettingsSearchFilter from './SettingsSearchFilter';
import settingsValidators from '../../utils/settingsValidation';

const AdminSettings = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [backupStatus, setBackupStatus] = useState('idle');
  const [expandedSections, setExpandedSections] = useState([0]); // First section expanded by default
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', score: 95 });
  const [autoSave, setAutoSave] = useState(false);
  const [disabledCategories, setDisabledCategories] = useState(new Set()); // Track disabled categories
  const [validationErrors, setValidationErrors] = useState({}); // Track validation errors per field
  const [filteredSettings, setFilteredSettings] = useState({}); // Track filtered settings from search
  const [showSearchFilter, setShowSearchFilter] = useState(false); // Toggle search filter visibility
  
  // Refs
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  
  // Hooks
  const toast = useToast();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isBackupOpen, onOpen: onBackupOpen, onClose: onBackupClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();

  // Responsive design hooks
  const isMobile = useBreakpointValue({ base: true, md: false });
  const sidebarWidth = useBreakpointValue({ base: '100%', md: '300px', lg: '350px' });
  const containerMaxW = useBreakpointValue({ base: 'full', md: 'full' });
  const tabOrientation = useBreakpointValue({ base: 'horizontal', lg: 'vertical' });
  const gridCols = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const searchInputBg = useColorModeValue('white', 'gray.700');

  // Enhanced settings configuration with validation and integration hooks
  const settingsConfig = {
    system: {
      title: 'System Configuration',
      icon: FaServer,
      color: 'blue.500',
      description: 'Core system settings and application configuration'
    },
    security: {
      title: 'Security & Authentication',
      icon: FaShieldAlt,
      color: 'red.500',
      description: 'Security policies and authentication settings'
    },
    notifications: {
      title: 'Notifications & Alerts',
      icon: FaBell,
      color: 'orange.500',
      description: 'Communication preferences and alert settings'
    },
    maps: {
      title: 'Maps & Geolocation',
      icon: FaMap,
      color: 'green.500',
      description: 'Mapping services and location-based features'
    },
    business: {
      title: 'Business Operations',
      icon: FaBuilding,
      color: 'purple.500',
      description: 'Business rules and operational parameters'
    },
    integration: {
      title: 'Third-party Integrations',
      icon: FaPlug,
      color: 'teal.500',
      description: 'External services and API integrations'
    },
    performance: {
      title: 'Performance & Monitoring',
      icon: FaChartLine,
      color: 'cyan.500',
      description: 'System performance and monitoring configuration'
    },
    ui: {
      title: 'User Interface',
      icon: FaPalette,
      color: 'pink.500',
      description: 'User interface customization and themes'
    }
  };

  // Enhanced mock settings data with validation rules and integration points
  const mockSettings = {
    system: {
      siteName: { 
        value: 'Transportation Management System',
        type: 'text',
        required: true,
        maxLength: 100,
        description: 'Display name for the application'
      },
      siteDescription: { 
        value: 'Comprehensive transportation management platform',
        type: 'textarea',
        maxLength: 500,
        description: 'Brief description of the application purpose'
      },
      companyName: { 
        value: 'TransportCorp Inc.',
        type: 'text',
        required: true,
        maxLength: 200,
        description: 'Legal company name for documentation and reports'
      },
      contactEmail: { 
        value: 'admin@transportcorp.com',
        type: 'email',
        required: true,
        description: 'Primary contact email for system notifications'
      },
      supportPhone: { 
        value: '+1-800-TRANS',
        type: 'tel',
        description: 'Support phone number for user assistance'
      },
      maintenanceMode: { 
        value: false,
        type: 'boolean',
        description: 'Enable maintenance mode to restrict user access'
      },
      debugMode: { 
        value: false,
        type: 'boolean',
        description: 'Enable detailed logging and debugging features'
      },
      logLevel: { 
        value: 'info',
        type: 'select',
        options: ['error', 'warn', 'info', 'debug'],
        description: 'Minimum log level for system logging'
      },
      maxUsers: { 
        value: 500,
        type: 'number',
        min: 1,
        max: 10000,
        description: 'Maximum number of concurrent users allowed'
      },
      sessionTimeout: { 
        value: 30,
        type: 'number',
        min: 5,
        max: 480,
        unit: 'minutes',
        description: 'User session timeout duration'
      },
      autoBackup: { 
        value: true,
        type: 'boolean',
        description: 'Automatically create system backups'
      },
      backupInterval: { 
        value: 24,
        type: 'number',
        min: 1,
        max: 168,
        unit: 'hours',
        description: 'Interval between automatic backups'
      },
      version: { 
        value: '2.1.4',
        type: 'text',
        readonly: true,
        description: 'Current system version'
      },
      environment: { 
        value: 'production',
        type: 'select',
        options: ['development', 'staging', 'production'],
        readonly: true,
        description: 'Current deployment environment'
      }
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

  // Utility functions for settings integration
  const getSettingValue = (category, field) => {
    return settings[category]?.[field]?.value;
  };

  const updateSettingValue = (category, field, value) => {
    handleSettingChange(category, field, value);
  };

  const validateSetting = (category, field, value) => {
    const setting = mockSettings[category]?.[field];
    if (!setting) return true;

    if (setting.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    if (setting.type === 'email' && value && !value.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (setting.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (setting.min && num < setting.min) return `Value must be at least ${setting.min}`;
      if (setting.max && num > setting.max) return `Value must be at most ${setting.max}`;
    }

    if (setting.maxLength && value && value.length > setting.maxLength) {
      return `Value must be ${setting.maxLength} characters or less`;
    }

    return null;
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      timestamp: new Date().toISOString(),
      version: getSettingValue('system', 'version'),
      environment: getSettingValue('system', 'environment')
    };
    return exportData;
  };

  const importSettings = (importData) => {
    if (importData && importData.settings) {
      setSettings(importData.settings);
      setHasChanges(true);
      toast({
        title: 'Settings imported',
        description: 'Settings have been imported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasChanges, autoSave]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend API first
      try {
        const response = await axios.get('/api/admin/settings');
        if (response.data && response.data.settings) {
          setSettings(response.data.settings);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('API fetch failed, loading from localStorage or mock:', apiError);
      }

      // Fallback: Try localStorage
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
          setLoading(false);
          return;
        } catch (parseError) {
          console.warn('Failed to parse saved settings:', parseError);
        }
      }

      // Final fallback: Use mock data (flatten it)
      const flattenedSettings = {};
      Object.keys(mockSettings).forEach(category => {
        flattenedSettings[category] = {};
        Object.keys(mockSettings[category]).forEach(field => {
          flattenedSettings[category][field] = mockSettings[category][field].value;
        });
      });
      
      setTimeout(() => {
        setSettings(flattenedSettings);
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

  // Validation configuration for settings
  const validationRules = {
    system: {
      supportEmail: settingsValidators.email,
      apiBaseUrl: settingsValidators.url,
      maxUsers: (value) => settingsValidators.positiveInteger(value),
    },
    security: {
      passwordMinLength: (value) => {
        const result = settingsValidators.positiveInteger(value);
        if (!result.isValid) return result;
        if (value < 6) return { isValid: false, error: 'Password length must be at least 6' };
        if (value > 50) return { isValid: false, error: 'Password length cannot exceed 50' };
        return { isValid: true, error: null };
      },
      sessionTimeout: (value) => settingsValidators.positiveInteger(value),
      maxLoginAttempts: (value) => settingsValidators.positiveInteger(value),
    },
    notifications: {
      adminEmail: settingsValidators.email,
      fromEmail: settingsValidators.email,
      smtpPort: settingsValidators.port,
    },
    maps: {
      apiKey: settingsValidators.required,
      defaultZoom: (value) => {
        const result = settingsValidators.positiveInteger(value);
        if (!result.isValid) return result;
        if (value < 1 || value > 20) return { isValid: false, error: 'Zoom must be between 1-20' };
        return { isValid: true, error: null };
      },
    },
  };

  // Validate a single setting
  const validateSettingValue = (category, field, value) => {
    const validator = validationRules[category]?.[field];
    if (!validator) return { isValid: true, error: null };
    return validator(value);
  };

  const handleSettingChange = (category, field, value, subField = null) => {
    // Validate the value
    const fieldKey = subField ? `${category}.${field}.${subField}` : `${category}.${field}`;
    const validation = validateSettingValue(category, field, value);
    
    // Update validation errors
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (validation.isValid) {
        delete newErrors[fieldKey];
      } else {
        newErrors[fieldKey] = validation.error;
      }
      return newErrors;
    });
    
    // Get old value for notification
    const oldValue = subField 
      ? settings[category]?.[field]?.[subField]
      : settings[category]?.[field];
    
    // Update settings
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
    
    // Send email notification for critical settings
    sendSettingChangeNotification(category, field, oldValue, value, subField);
    
    // Add to change history
    const timestamp = new Date().toLocaleString();
    setChangeHistory(prev => [
      {
        timestamp,
        category,
        field: subField ? `${field}.${subField}` : field,
        value,
        action: 'modified',
        valid: validation.isValid
      },
      ...prev.slice(0, 49) // Keep last 50 changes
    ]);
  };

  const sendSettingChangeNotification = async (category, field, oldValue, newValue, subField = null) => {
    try {
      // Get notification config from localStorage
      const notificationConfig = JSON.parse(
        localStorage.getItem('settingsNotificationConfig') || '{"enabled": false}'
      );

      // Check if notifications are enabled
      if (!notificationConfig.enabled) return;
      
      // Check if this category is being monitored
      if (!notificationConfig.categories?.[category]) return;

      // Define critical settings
      const criticalSettings = {
        security: ['twoFactorAuth', 'sessionTimeout', 'maxLoginAttempts', 'passwordMinLength', 'ipWhitelist'],
        system: ['maintenanceMode', 'maxUsers'],
        encryption: ['enabled', 'algorithm']
      };

      // Check if this is a critical setting
      const isCritical = criticalSettings[category]?.includes(field);
      if (notificationConfig.criticalOnly && !isCritical) return;

      // Send notification to backend
      const fieldName = subField ? `${field}.${subField}` : field;
      await axios.post('/api/admin/settings/notifications/send', {
        category,
        field: fieldName,
        oldValue: notificationConfig.includeOldValue ? oldValue : undefined,
        newValue: notificationConfig.includeNewValue ? newValue : undefined,
        user: notificationConfig.includeUserInfo ? 'admin' : undefined,
        timestamp: new Date().toISOString(),
        recipients: notificationConfig.recipients
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't show error to user - notifications are non-critical
    }
  };

  const handleApplyTemplate = (templateSettings) => {
    // Apply template settings to current settings
    const updatedSettings = { ...settings };
    
    Object.keys(templateSettings).forEach(category => {
      if (!updatedSettings[category]) {
        updatedSettings[category] = {};
      }
      Object.keys(templateSettings[category]).forEach(key => {
        updatedSettings[category][key] = templateSettings[category][key];
      });
    });
    
    setSettings(updatedSettings);
    setHasChanges(true);
    
    // Add to change history
    setChangeHistory(prev => [
      {
        timestamp: new Date().toISOString(),
        category: 'template',
        field: 'Environment Template',
        oldValue: 'Multiple values',
        newValue: 'Template applied',
        user: 'admin'
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleRollback = (rolledBackSettings) => {
    // Apply rolled back settings
    setSettings(rolledBackSettings);
    setHasChanges(true);
    
    // Add to change history
    setChangeHistory(prev => [
      {
        timestamp: new Date().toISOString(),
        category: 'rollback',
        field: 'Settings Rollback',
        oldValue: 'Current settings',
        newValue: 'Previous version restored',
        user: 'admin'
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleImport = (importedSettings) => {
    // Apply imported settings
    setSettings(importedSettings);
    setHasChanges(true);
    
    // Add to change history
    setChangeHistory(prev => [
      {
        timestamp: new Date().toISOString(),
        category: 'import',
        field: 'Bulk Import',
        oldValue: 'Current settings',
        newValue: 'Settings imported from file',
        user: 'admin'
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Try to save to backend API
      try {
        await axios.put('/api/admin/settings', { settings });
        toast({
          title: 'Settings saved',
          description: 'All system settings have been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } catch (apiError) {
        // If API fails, still save locally for now
        console.warn('API save failed, saving locally:', apiError);
        toast({
          title: 'Settings saved locally',
          description: 'Settings saved to browser storage (API unavailable)',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        // Save to localStorage as fallback
        localStorage.setItem('adminSettings', JSON.stringify(settings));
      }
      
      setHasChanges(false);
      setLastSaved(new Date());
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

  // Toggle category enabled/disabled state
  const toggleCategoryEnabled = (categoryKey) => {
    setDisabledCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
        toast({
          title: 'Category Enabled',
          description: `${categoryKey} category has been enabled`,
          status: 'success',
          duration: 2000
        });
      } else {
        newSet.add(categoryKey);
        toast({
          title: 'Category Disabled',
          description: `${categoryKey} category has been disabled. Settings cannot be modified while disabled.`,
          status: 'warning',
          duration: 3000
        });
      }
      // Save to localStorage
      localStorage.setItem('disabledSettingsCategories', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Check if a category is disabled
  const isCategoryDisabled = (categoryKey) => {
    return disabledCategories.has(categoryKey);
  };

  // Load disabled categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('disabledSettingsCategories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDisabledCategories(new Set(parsed));
      } catch (error) {
        console.error('Error loading disabled categories:', error);
      }
    }
  }, []);

  const allTabs = [
    { label: 'Search', icon: SearchIcon, key: 'search-filter' },
    { label: 'System', icon: FaServer, key: 'system' },
    { label: 'Security', icon: FaShieldAlt, key: 'security' },
    { label: 'Notifications', icon: FaBell, key: 'notifications' },
    { label: 'Maps & GPS', icon: FaMap, key: 'maps' },
    { label: 'Business', icon: FaBuilding, key: 'business' },
    { label: 'Integration', icon: FaPlug, key: 'integration' },
    { label: 'Audit Logs', icon: FaClipboardList, key: 'audit' },
    { label: 'Holidays', icon: FaCalendarAlt, key: 'holidays' },
    { label: 'Rate Limits', icon: FaShieldAlt, key: 'rate-limits' },
    { label: 'Sessions', icon: FaShieldAlt, key: 'sessions' },
    { label: 'Encryption', icon: FaLock, key: 'encryption' },
    { label: 'Permissions', icon: FaKey, key: 'permissions' },
    { label: 'Security Alerts', icon: FaExclamationTriangle, key: 'security-alerts' },
    { label: 'Login Attempts', icon: FaShieldAlt, key: 'login-attempts' },
    { label: 'Geo-Security', icon: FaMap, key: 'geo-security' },
    { label: 'Sidebar', icon: FaBars, key: 'sidebar-settings' },
    { label: 'Templates', icon: FaCog, key: 'templates' },
    { label: 'Notifications', icon: FaBell, key: 'notifications-config' },
    { label: 'Rollback', icon: FaHistory, key: 'rollback' },
    { label: 'Compare', icon: FaExchangeAlt, key: 'comparison' },
    { label: 'Import/Export', icon: FaFileImport, key: 'import-export' },
    { label: 'History', icon: FaHistory, key: 'settings-history' }
  ];
  
  // Filter tabs only for display in TabList, but keep all TabPanels rendered
  const filteredTabs = searchTerm 
    ? allTabs.filter(tab => 
        tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tab.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allTabs;

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
    <Box bg={bgColor} minH="100vh">
      <Navbar />
      
      {/* Main Content Container */}
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
        <Container maxW={containerMaxW} py={{ base: 4, md: 6 }} px={{ base: 4, md: 6 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Enhanced Responsive Header */}
            <ScaleFade in={true} initialScale={0.9}>
              <Card bg={cardBg} borderColor={borderColor} shadow="lg" borderRadius="xl">
                <CardBody p={{ base: 4, md: 6 }}>
                  <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                    {/* Mobile-friendly Breadcrumbs */}
                    <Breadcrumb fontSize="sm" color={mutedTextColor} display={{ base: 'none', sm: 'block' }}>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink>System Settings</BreadcrumbLink>
                      </BreadcrumbItem>
                    </Breadcrumb>

                    {/* Responsive Header Content */}
                    <Flex 
                      direction={{ base: 'column', lg: 'row' }}
                      justify="space-between" 
                      align={{ base: 'start', lg: 'center' }} 
                      gap={{ base: 4, lg: 6 }}
                    >
                      <VStack align="start" spacing={2} flex="1">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            bg={accentColor}
                            borderRadius="lg"
                            color="white"
                          >
                            <Icon as={FaCog} boxSize={{ base: 5, md: 6 }} />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Heading 
                              size={{ base: 'md', md: 'lg' }} 
                              color={textColor}
                              lineHeight="shorter"
                            >
                              System Settings
                            </Heading>
                            <Text fontSize={{ base: 'sm', md: 'md' }} color={mutedTextColor}>
                              Configure system-wide settings and integrations
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {/* Status Indicators */}
                        <HStack spacing={3} wrap="wrap">
                          {lastSaved && (
                            <HStack spacing={1}>
                              <Icon as={TimeIcon} boxSize={3} color="green.500" />
                              <Text fontSize="xs" color={mutedTextColor}>
                                Last saved: {lastSaved.toLocaleString()}
                              </Text>
                            </HStack>
                          )}
                          {hasChanges && (
                            <Badge colorScheme="orange" fontSize="xs" px={2} py={1} borderRadius="full">
                              <HStack spacing={1}>
                                <Icon as={FaExclamationTriangle} boxSize={2} />
                                <Text>Unsaved Changes</Text>
                              </HStack>
                            </Badge>
                          )}
                          <HStack spacing={1}>
                            <CircularProgress 
                              value={systemHealth.score} 
                              size="20px" 
                              color={systemHealth.score > 80 ? 'green.500' : 'orange.500'}
                              thickness="8px"
                            />
                            <Text fontSize="xs" color={mutedTextColor}>
                              System Health: {systemHealth.score}%
                            </Text>
                          </HStack>
                        </HStack>
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
                                // Flatten mock settings structure
                                const flattenedSettings = {};
                                Object.keys(mockSettings).forEach(category => {
                                  flattenedSettings[category] = {};
                                  Object.keys(mockSettings[category]).forEach(field => {
                                    flattenedSettings[category][field] = mockSettings[category][field].value;
                                  });
                                });
                                setSettings(flattenedSettings);
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
                        bg={searchInputBg}
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
            </ScaleFade>

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
                    {filteredTabs.map((tab) => (
                      <Tab key={tab.key} minW="fit-content">
                        <HStack spacing={2}>
                          <Icon as={tab.icon} boxSize={4} />
                          <Text>{tab.label}</Text>
                        </HStack>
                      </Tab>
                    ))}
                  </TabList>

                  <TabPanels>
                    {/* Search & Filter Panel */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsSearchFilter 
                          settings={settings}
                          changeHistory={changeHistory}
                          onFilteredSettingsChange={setFilteredSettings}
                        />
                      </VStack>
                    </TabPanel>

                    {/* System Settings Panel */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        {/* Category Toggle Control */}
                        <Card bg={isCategoryDisabled('system') ? 'gray.100' : cardBg} borderWidth={2} borderColor={isCategoryDisabled('system') ? 'orange.300' : borderColor}>
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Icon as={FaServer} color={isCategoryDisabled('system') ? 'gray.400' : 'blue.500'} />
                                  <Heading size="md" color={isCategoryDisabled('system') ? 'gray.500' : textColor}>
                                    System Configuration
                                  </Heading>
                                </HStack>
                                <Text fontSize="sm" color={isCategoryDisabled('system') ? 'gray.500' : mutedTextColor}>
                                  {isCategoryDisabled('system') 
                                    ? '⚠️ This category is disabled. Enable it to modify settings.' 
                                    : 'Core system settings and application configuration'}
                                </Text>
                              </VStack>
                              <HStack spacing={3}>
                                <Text fontSize="sm" fontWeight="medium" color={isCategoryDisabled('system') ? 'orange.500' : 'green.500'}>
                                  {isCategoryDisabled('system') ? 'Disabled' : 'Enabled'}
                                </Text>
                                <Switch 
                                  size="lg" 
                                  colorScheme={isCategoryDisabled('system') ? 'orange' : 'green'}
                                  isChecked={!isCategoryDisabled('system')}
                                  onChange={() => toggleCategoryEnabled('system')}
                                />
                              </HStack>
                            </HStack>
                          </CardBody>
                        </Card>

                        <VStack spacing={4} align="stretch" opacity={isCategoryDisabled('system') ? 0.5 : 1}>
                          <SettingRow
                            label="Site Name"
                            description="The name of your transportation system"
                          >
                            <Input
                              value={settings.system?.siteName || ''}
                              onChange={(e) => handleSettingChange('system', 'siteName', e.target.value)}
                              placeholder="Enter site name"
                              isDisabled={isCategoryDisabled('system')}
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
                              isDisabled={isCategoryDisabled('system')}
                            />
                          </SettingRow>

                          <SettingRow
                            label="Maximum Users"
                            description="Maximum number of concurrent users"
                            error={validationErrors['system.maxUsers']}
                          >
                            <NumberInput
                              value={settings.system?.maxUsers}
                              onChange={(value) => handleSettingChange('system', 'maxUsers', parseInt(value))}
                              min={1}
                              max={10000}
                              isInvalid={!!validationErrors['system.maxUsers']}
                              isDisabled={isCategoryDisabled('system')}
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
                              isDisabled={isCategoryDisabled('system')}
                            />
                          </SettingRow>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* Security Settings Panel */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        {/* Category Toggle Control */}
                        <Card bg={isCategoryDisabled('security') ? 'gray.100' : cardBg} borderWidth={2} borderColor={isCategoryDisabled('security') ? 'orange.300' : borderColor}>
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Icon as={FaShieldAlt} color={isCategoryDisabled('security') ? 'gray.400' : 'red.500'} />
                                  <Heading size="md" color={isCategoryDisabled('security') ? 'gray.500' : textColor}>
                                    Security & Authentication
                                  </Heading>
                                </HStack>
                                <Text fontSize="sm" color={isCategoryDisabled('security') ? 'gray.500' : mutedTextColor}>
                                  {isCategoryDisabled('security') 
                                    ? '⚠️ This category is disabled. Enable it to modify settings.' 
                                    : 'Security policies and authentication settings'}
                                </Text>
                              </VStack>
                              <HStack spacing={3}>
                                <Text fontSize="sm" fontWeight="medium" color={isCategoryDisabled('security') ? 'orange.500' : 'green.500'}>
                                  {isCategoryDisabled('security') ? 'Disabled' : 'Enabled'}
                                </Text>
                                <Switch 
                                  size="lg" 
                                  colorScheme={isCategoryDisabled('security') ? 'orange' : 'green'}
                                  isChecked={!isCategoryDisabled('security')}
                                  onChange={() => toggleCategoryEnabled('security')}
                                />
                              </HStack>
                            </HStack>
                          </CardBody>
                        </Card>

                        <VStack spacing={4} align="stretch" opacity={isCategoryDisabled('security') ? 0.5 : 1}>
                          <SettingRow
                            label="Password Min Length"
                            description="Minimum password length required"
                          >
                            <NumberInput
                              value={settings.security?.passwordMinLength}
                              onChange={(value) => handleSettingChange('security', 'passwordMinLength', parseInt(value))}
                              min={6}
                              isDisabled={isCategoryDisabled('security')}
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

                    {/* Audit Logs Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <AuditLogViewer />
                      </VStack>
                    </TabPanel>

                    {/* Holidays Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <HolidayManagement />
                      </VStack>
                    </TabPanel>

                    {/* Rate Limits Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <RateLimitMonitor />
                      </VStack>
                    </TabPanel>

                    {/* Sessions Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SessionManager />
                      </VStack>
                    </TabPanel>

                    {/* Encryption Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <EncryptionManager />
                      </VStack>
                    </TabPanel>

                    {/* Permissions Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <PermissionMatrix />
                      </VStack>
                    </TabPanel>

                    {/* Security Alerts Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SecurityMonitor />
                      </VStack>
                    </TabPanel>

                    {/* Login Attempts Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <LoginAttemptMonitor />
                      </VStack>
                    </TabPanel>

                    {/* Geo-Security Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <GeoSecurityManager />
                      </VStack>
                    </TabPanel>

                    {/* Sidebar Settings Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SidebarSettings />
                      </VStack>
                    </TabPanel>

                    {/* Templates Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsTemplates 
                          currentSettings={settings}
                          onApplyTemplate={handleApplyTemplate}
                        />
                      </VStack>
                    </TabPanel>

                    {/* Notifications Configuration Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsNotifications />
                      </VStack>
                    </TabPanel>

                    {/* Rollback Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsRollback 
                          currentSettings={settings}
                          onRollback={handleRollback}
                        />
                      </VStack>
                    </TabPanel>

                    {/* Comparison Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsComparison 
                          currentSettings={settings}
                        />
                      </VStack>
                    </TabPanel>

                    {/* Import/Export Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsImportExport 
                          currentSettings={settings}
                          onImport={handleImport}
                        />
                      </VStack>
                    </TabPanel>

                    {/* Settings History Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={6} align="stretch">
                        <SettingsHistory />
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