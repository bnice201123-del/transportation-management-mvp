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
  InputRightElement,
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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  RadioGroup,
  Radio,
  Stack,
  Checkbox,
  CheckboxGroup,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  Center,
  Spinner,
  Skeleton,
  SkeletonText,
  Avatar,
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
  DownloadIcon,
  DeleteIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  TimeIcon,
  CalendarIcon,
  RepeatIcon,
  AddIcon,
  ViewIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  SmallCloseIcon,
  ExternalLinkIcon,
  AttachmentIcon,
  LockIcon,
  UnlockIcon
} from '@chakra-ui/icons';
import {
  HiCloudDownload,
  HiCloudUpload,
  HiDatabase,
  HiDocumentDuplicate,
  HiFolder,
  HiFolderOpen,
  HiServer,
  HiShieldCheck,
  HiShieldExclamation,
  HiClock,
  HiRefresh,
  HiPlay,
  HiPause,
  HiStop,
  HiFilter,
  HiCog,
  HiEye,
  HiEyeOff,
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiPencil,
  HiTrash,
  HiDownload,
  HiUpload,
  HiHome,
  HiSearch,
  HiAdjustments,
  HiClipboard,
  HiClipboardCheck,
  HiExclamation,
  HiInformationCircle,
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
  HiShare
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const BackupRestore = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Enhanced modal management
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const { isOpen: isRestoreModalOpen, onOpen: onRestoreModalOpen, onClose: onRestoreModalClose } = useDisclosure();
  const { isOpen: isSettingsModalOpen, onOpen: onSettingsModalOpen, onClose: onSettingsModalClose } = useDisclosure();

  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: '7xl' });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const tableVariant = useBreakpointValue({ base: 'simple', md: 'striped' });

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedRowBg = useColorModeValue('blue.50', 'blue.900');
  const headerBg = useColorModeValue('linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)');
  const successColor = useColorModeValue('green.500', 'green.300');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const statIconBg = useColorModeValue('gray.50', 'gray.700');

  // Enhanced state management
  const [activeTab, setActiveTab] = useState(0);
  const [backups, setBackups] = useState([]);
  const [filteredBackups, setFilteredBackups] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [backupSchedules, setBackupSchedules] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingBackup] = useState(null);
  const [restoringBackup] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  // Enhanced filter and sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [processingItems, setProcessingItems] = useState([]);

  // Form states
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [backupType, setBackupType] = useState('full');
  const [includeDatabase, setIncludeDatabase] = useState(true);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [compressionLevel, setCompressionLevel] = useState(6);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);

  // Settings states
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [retentionDays, setRetentionDays] = useState(30);
  const [maxBackups, setMaxBackups] = useState(10);

  // Filter and sort handlers
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;
    
    setProcessingItems(selectedItems);
    try {
      // Simulate bulk operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (bulkAction === 'delete') {
        setBackups(prev => prev.filter(backup => !selectedItems.includes(backup.id)));
        toast({
          title: 'Items Deleted',
          description: `${selectedItems.length} backup(s) deleted successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setSelectedItems([]);
      setBulkAction('');
    } catch (err) {
      console.error('Bulk action failed:', err);
      toast({
        title: 'Bulk Action Failed',
        description: 'Failed to complete bulk operation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingItems([]);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  // Mock data for demonstration
  useEffect(() => {
    const mockBackups = [
      {
        id: 1,
        name: 'Full System Backup - Nov 9',
        description: 'Complete system backup including database and files',
        type: 'full',
        status: 'completed',
        size: '2.4 GB',
        createdAt: '2025-11-09T10:30:00Z',
        duration: '45 minutes',
        location: 'local',
        includes: ['database', 'files', 'configurations']
      },
      {
        id: 2,
        name: 'Database Only - Nov 8',
        description: 'Database backup for user data',
        type: 'database',
        status: 'completed',
        size: '850 MB',
        createdAt: '2025-11-08T22:00:00Z',
        duration: '12 minutes',
        location: 'cloud',
        includes: ['database']
      },
      {
        id: 3,
        name: 'Incremental Backup - Nov 8',
        description: 'Incremental backup of changed files',
        type: 'incremental',
        status: 'failed',
        size: '0 MB',
        createdAt: '2025-11-08T14:30:00Z',
        duration: '5 minutes',
        location: 'local',
        includes: ['files'],
        error: 'Storage space insufficient'
      },
      {
        id: 4,
        name: 'Full System Backup - Nov 7',
        description: 'Scheduled weekly backup',
        type: 'full',
        status: 'completed',
        size: '2.1 GB',
        createdAt: '2025-11-07T10:30:00Z',
        duration: '42 minutes',
        location: 'cloud',
        includes: ['database', 'files', 'configurations']
      }
    ];

    const mockRestoreHistory = [
      {
        id: 1,
        backupName: 'Full System Backup - Nov 5',
        restoredAt: '2025-11-06T09:15:00Z',
        status: 'completed',
        restoredBy: 'admin@example.com',
        duration: '28 minutes',
        type: 'full'
      },
      {
        id: 2,
        backupName: 'Database Only - Nov 3',
        restoredAt: '2025-11-04T16:45:00Z',
        status: 'completed',
        restoredBy: 'admin@example.com',
        duration: '8 minutes',
        type: 'database'
      }
    ];

    const mockSchedules = [
      {
        id: 1,
        name: 'Daily Database Backup',
        type: 'database',
        frequency: 'daily',
        time: '22:00',
        enabled: true,
        lastRun: '2025-11-09T22:00:00Z',
        nextRun: '2025-11-10T22:00:00Z'
      },
      {
        id: 3,
        name: 'Weekly Full Backup',
        type: 'full',
        frequency: 'weekly',
        time: '10:30',
        enabled: true,
        lastRun: '2025-11-07T10:30:00Z',
        nextRun: '2025-11-14T10:30:00Z'
      }
    ];

    setBackups(mockBackups);
    setFilteredBackups(mockBackups);
    setRestoreHistory(mockRestoreHistory);
    setBackupSchedules(mockSchedules);
    setLoading(false);
  }, []);

  // Filter backups based on search and filters
  useEffect(() => {
    let filtered = backups.filter(backup => {
      const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           backup.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || backup.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;

      let matchesDate = true;
      if (dateRange !== 'all') {
        const backupDate = new Date(backup.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));

        switch (dateRange) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    setFilteredBackups(filtered);
  }, [backups, searchTerm, typeFilter, statusFilter, dateRange]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'green', icon: CheckCircleIcon },
      failed: { color: 'red', icon: WarningIcon },
      'in-progress': { color: 'blue', icon: TimeIcon },
      scheduled: { color: 'gray', icon: CalendarIcon }
    };

    const config = statusConfig[status] || statusConfig.completed;
    return (
      <Badge colorScheme={config.color} display="flex" alignItems="center" gap={1}>
        <config.icon size="12px" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'full': return HiDatabase;
      case 'database': return HiServer;
      case 'incremental': return HiDocumentDuplicate;
      case 'files': return HiFolder;
      case 'configuration': return HiCog;
      default: return HiDatabase;
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newBackup = {
        id: Date.now(),
        name: newBackupName || `Backup ${new Date().toLocaleDateString()}`,
        description: newBackupDescription,
        type: backupType,
        status: 'in-progress',
        size: 'Calculating...',
        createdAt: new Date().toISOString(),
        duration: 'In progress',
        location: 'local',
        includes: []
      };

      if (includeDatabase) newBackup.includes.push('database');
      if (includeFiles) newBackup.includes.push('files');
      if (backupType === 'full') newBackup.includes.push('configurations');

      setBackups(prev => [newBackup, ...prev]);

      toast({
        title: 'Backup Started',
        description: 'Backup creation has been initiated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onCreateModalClose();
      resetCreateForm();

      // Simulate completion after 30 seconds
      setTimeout(() => {
        setBackups(prev => prev.map(backup =>
          backup.id === newBackup.id
            ? { ...backup, status: 'completed', size: '1.8 GB', duration: '32 minutes' }
            : backup
        ));
      }, 30000);

    } catch (err) {
      console.error('Backup creation failed:', err);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const restoreRecord = {
        id: Date.now(),
        backupName: selectedBackup.name,
        restoredAt: new Date().toISOString(),
        status: 'completed',
        restoredBy: 'admin@example.com',
        duration: '25 minutes',
        type: selectedBackup.type
      };

      setRestoreHistory(prev => [restoreRecord, ...prev]);

      toast({
        title: 'Restore Completed',
        description: `Successfully restored from ${selectedBackup.name}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onRestoreModalClose();
      setSelectedBackup(null);

    } catch (err) {
      console.error('Restore failed:', err);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBackups(prev => prev.filter(backup => backup.id !== backupId));

      toast({
        title: 'Backup Deleted',
        description: 'Backup has been permanently deleted.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Delete failed:', err);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      // Simulate download
      toast({
        title: 'Download Started',
        description: `Downloading ${backup.name}...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // In a real app, this would trigger a file download
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        title: 'Download Failed',
        description: 'Failed to download backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetCreateForm = () => {
    setNewBackupName('');
    setNewBackupDescription('');
    setBackupType('full');
    setIncludeDatabase(true);
    setIncludeFiles(true);
    setCompressionLevel(6);
    setEncryptionEnabled(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStorageStats = () => {
    const totalSize = filteredBackups.reduce((acc, backup) => {
      if (backup.status === 'completed') {
        const size = parseFloat(backup.size.replace(' GB', '').replace(' MB', ''));
        const unit = backup.size.includes('GB') ? 'GB' : 'MB';
        return acc + (unit === 'GB' ? size : size / 1024);
      }
      return acc;
    }, 0);

    return {
      totalBackups: filteredBackups.length,
      completedBackups: filteredBackups.filter(b => b.status === 'completed').length,
      failedBackups: filteredBackups.filter(b => b.status === 'failed').length,
      totalSize: `${totalSize.toFixed(1)} GB`
    };
  };

  const stats = getStorageStats();

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Center height="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color={accentColor} />
            <Text color={textColor} fontSize="lg">Loading backup and restore data...</Text>
          </VStack>
        </Center>
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
                Backup & Restore
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Enhanced Header Section */}
          <Card
            bg={headerBg}
            borderRadius="xl"
            overflow="hidden"
            shadow="2xl"
          >
            <CardBody p={8} textAlign="center" color="white">
              <VStack spacing={4}>
                <Icon as={HiShieldCheck} boxSize={12} />
                <VStack spacing={2}>
                  <Heading 
                    size={{ base: 'lg', md: 'xl' }} 
                    fontWeight="bold"
                  >
                    Backup & Restore Management
                  </Heading>
                  <Text 
                    fontSize={{ base: 'md', md: 'lg' }} 
                    opacity={0.9}
                    maxW="600px"
                  >
                    Comprehensive data protection with automated backups, instant recovery, and intelligent scheduling
                  </Text>
                </VStack>
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
                    System Health & Statistics
                  </Heading>
                  <Text fontSize="sm" color={mutedColor}>
                    Real-time backup system metrics and performance indicators
                  </Text>
                </VStack>
                <Icon as={HiChartBar} boxSize={6} color={accentColor} />
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                <Card
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
                        <Icon as={HiDatabase} color="blue.500" />
                        Total Backups
                      </StatLabel>
                      <StatNumber fontSize="3xl" color={textColor}>
                        {stats.totalBackups}
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        Active system
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
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
                        <Icon as={HiCheckCircle} color={successColor} />
                        Success Rate
                      </StatLabel>
                      <StatNumber fontSize="3xl" color={successColor}>
                        {Math.round((stats.completedBackups / stats.totalBackups) * 100) || 0}%
                      </StatNumber>
                      <StatHelpText>
                        {stats.completedBackups} completed
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
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
                        <Icon as={HiCloudDownload} color="purple.500" />
                        Storage Used
                      </StatLabel>
                      <StatNumber fontSize="3xl" color={textColor}>
                        {stats.totalSize}
                      </StatNumber>
                      <StatHelpText>
                        System storage
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
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
                        <Icon as={HiClock} color="orange.500" />
                        Failed Backups
                      </StatLabel>
                      <StatNumber fontSize="3xl" color={stats.failedBackups > 0 ? errorColor : textColor}>
                        {stats.failedBackups}
                      </StatNumber>
                      <StatHelpText>
                        Requires attention
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Enhanced Tabs Interface */}
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <Tabs 
              index={activeTab} 
              onChange={setActiveTab} 
              variant="enclosed"
              colorScheme="blue"
            >
              <TabList mb={4} borderColor={borderColor}>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiDatabase style={{ marginRight: '8px' }} />
                  {!isMobile && 'Backup Management'}
                </Tab>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiRefresh style={{ marginRight: '8px' }} />
                  {!isMobile && 'Restore History'}  
                </Tab>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiClock style={{ marginRight: '8px' }} />
                  {!isMobile && 'Schedules'}
                </Tab>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiCog style={{ marginRight: '8px' }} />
                  {!isMobile && 'Settings'}
                </Tab>
              </TabList>

                <TabPanels>
                  {/* Backups Tab */}
                  <TabPanel px={6} py={6}>
                    <VStack spacing={6} align="stretch">
                      {/* Filters */}
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={4}
                        align={{ base: 'stretch', md: 'center' }}
                      >
                        <InputGroup maxW={{ base: 'full', md: '300px' }}>
                          <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.300" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search backups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>

                        <HStack spacing={4} flex={1}>
                          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} maxW="150px">
                            <option value="all">All Types</option>
                            <option value="full">Full</option>
                            <option value="database">Database</option>
                            <option value="incremental">Incremental</option>
                            <option value="files">Files</option>
                          </Select>

                          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} maxW="150px">
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="in-progress">In Progress</option>
                          </Select>

                          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} maxW="150px">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                          </Select>
                        </HStack>

                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="blue"
                          onClick={onCreateModalOpen}
                        >
                          Create Backup
                        </Button>
                      </Flex>

                      {/* Enhanced Toolbar */}
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={4}
                        align={{ base: 'stretch', md: 'center' }}
                        justify="space-between"
                        mb={4}
                      >
                        <HStack spacing={2}>
                          <Checkbox
                            isChecked={selectedItems.length === filteredBackups.length && filteredBackups.length > 0}
                            isIndeterminate={selectedItems.length > 0 && selectedItems.length < filteredBackups.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(filteredBackups.map(b => b.id));
                              } else {
                                setSelectedItems([]);
                              }
                            }}
                          >
                            {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
                          </Checkbox>
                          {selectedItems.length > 0 && (
                            <HStack spacing={2}>
                              <Select
                                placeholder="Bulk actions"
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                size="sm"
                                maxW="150px"
                              >
                                <option value="delete">Delete</option>
                                <option value="download">Download</option>
                              </Select>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={handleBulkAction}
                                isDisabled={!bulkAction}
                                isLoading={processingItems.length > 0}
                              >
                                Apply
                              </Button>
                            </HStack>
                          )}
                        </HStack>
                        
                        <HStack spacing={2}>
                          <IconButton
                            icon={viewMode === 'table' ? <HiViewList /> : <HiViewGrid />}
                            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                            variant="outline"
                            aria-label="Toggle view"
                          />
                          <Text fontSize="sm" color={mutedColor}>
                            {filteredBackups.length} backup{filteredBackups.length !== 1 ? 's' : ''}
                          </Text>
                        </HStack>
                      </Flex>

                      {/* Enhanced Backups Table */}
                      <Box overflowX="auto">
                        <Table variant={tableVariant} size={tableSize}>
                          <Thead bg={tableHeaderBg}>
                            <Tr>
                              <Th>
                                <Checkbox
                                  isChecked={selectedItems.length === filteredBackups.length && filteredBackups.length > 0}
                                  isIndeterminate={selectedItems.length > 0 && selectedItems.length < filteredBackups.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems(filteredBackups.map(b => b.id));
                                    } else {
                                      setSelectedItems([]);
                                    }
                                  }}
                                />
                              </Th>
                              <Th cursor="pointer" onClick={() => handleSortChange('name')}>
                                <HStack spacing={1}>
                                  <Text>Name</Text>
                                  {sortBy === 'name' && (
                                    <Icon as={sortOrder === 'asc' ? HiSortAscending : HiSortDescending} />
                                  )}
                                </HStack>
                              </Th>
                              <Th cursor="pointer" onClick={() => handleSortChange('type')}>
                                <HStack spacing={1}>
                                  <Text>Type</Text>
                                  {sortBy === 'type' && (
                                    <Icon as={sortOrder === 'asc' ? HiSortAscending : HiSortDescending} />
                                  )}
                                </HStack>
                              </Th>
                              <Th cursor="pointer" onClick={() => handleSortChange('status')}>
                                <HStack spacing={1}>
                                  <Text>Status</Text>
                                  {sortBy === 'status' && (
                                    <Icon as={sortOrder === 'asc' ? HiSortAscending : HiSortDescending} />
                                  )}
                                </HStack>
                              </Th>
                              <Th cursor="pointer" onClick={() => handleSortChange('size')}>
                                <HStack spacing={1}>
                                  <Text>Size</Text>
                                  {sortBy === 'size' && (
                                    <Icon as={sortOrder === 'asc' ? HiSortAscending : HiSortDescending} />
                                  )}
                                </HStack>
                              </Th>
                              <Th cursor="pointer" onClick={() => handleSortChange('createdAt')}>
                                <HStack spacing={1}>
                                  <Text>Created</Text>
                                  {sortBy === 'createdAt' && (
                                    <Icon as={sortOrder === 'asc' ? HiSortAscending : HiSortDescending} />
                                  )}
                                </HStack>
                              </Th>
                              <Th>Duration</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {getPaginatedData(filteredBackups).map((backup) => (
                              <Tr 
                                key={backup.id}
                                bg={selectedItems.includes(backup.id) ? selectedRowBg : 'transparent'}
                                _hover={{ bg: hoverBg }}
                                opacity={processingItems.includes(backup.id) ? 0.6 : 1}
                              >
                                <Td>
                                  <Checkbox
                                    isChecked={selectedItems.includes(backup.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedItems(prev => [...prev, backup.id]);
                                      } else {
                                        setSelectedItems(prev => prev.filter(id => id !== backup.id));
                                      }
                                    }}
                                    isDisabled={processingItems.includes(backup.id)}
                                  />
                                </Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">{backup.name}</Text>
                                    <Text fontSize="sm" color="gray.500">{backup.description}</Text>
                                    {backup.includes && (
                                      <HStack spacing={1}>
                                        {backup.includes.map((item, index) => (
                                          <Tag key={index} size="sm" colorScheme="blue">
                                            <TagLabel>{item}</TagLabel>
                                          </Tag>
                                        ))}
                                      </HStack>
                                    )}
                                  </VStack>
                                </Td>
                                <Td>
                                  <HStack>
                                    <Box as={getTypeIcon(backup.type)} />
                                    <Text>{backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}</Text>
                                  </HStack>
                                </Td>
                                <Td>{getStatusBadge(backup.status)}</Td>
                                <Td>{backup.size}</Td>
                                <Td>{formatDate(backup.createdAt)}</Td>
                                <Td>{backup.duration}</Td>
                                <Td>
                                  <Menu>
                                    <MenuButton as={IconButton} icon={<ChevronDownIcon />} variant="ghost" size="sm" />
                                    <MenuList>
                                      <MenuItem icon={<ViewIcon />} onClick={() => setSelectedBackup(backup)}>
                                        View Details
                                      </MenuItem>
                                      {backup.status === 'completed' && (
                                        <>
                                          <MenuItem icon={<DownloadIcon />} onClick={() => handleDownloadBackup(backup)}>
                                            Download
                                          </MenuItem>
                                          <MenuItem
                                            icon={<RepeatIcon />}
                                            onClick={() => {
                                              setSelectedBackup(backup);
                                              onRestoreModalOpen();
                                            }}
                                          >
                                            Restore
                                          </MenuItem>
                                        </>
                                      )}
                                      <MenuItem
                                        icon={<DeleteIcon />}
                                        color="red.500"
                                        onClick={() => handleDeleteBackup(backup.id)}
                                      >
                                        Delete
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>

                      {/* Enhanced Pagination */}
                      {filteredBackups.length > itemsPerPage && (
                        <Flex
                          justify="space-between"
                          align="center"
                          mt={6}
                          direction={{ base: 'column', md: 'row' }}
                          gap={4}
                        >
                          <Text fontSize="sm" color={mutedColor}>
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBackups.length)} of {filteredBackups.length} results
                          </Text>
                          <ButtonGroup size="sm" isAttached variant="outline">
                            <Button
                              onClick={() => handlePageChange(currentPage - 1)}
                              isDisabled={currentPage === 1}
                              leftIcon={<ChevronLeftIcon />}
                            >
                              Previous
                            </Button>
                            {Array.from({ length: Math.ceil(filteredBackups.length / itemsPerPage) }, (_, i) => i + 1)
                              .filter(page => 
                                page === 1 || 
                                page === Math.ceil(filteredBackups.length / itemsPerPage) || 
                                Math.abs(page - currentPage) <= 1
                              )
                              .map((page, index, array) => (
                                <React.Fragment key={page}>
                                  {index > 0 && array[index - 1] !== page - 1 && (
                                    <Button isDisabled>...</Button>
                                  )}
                                  <Button
                                    onClick={() => handlePageChange(page)}
                                    variant={currentPage === page ? 'solid' : 'outline'}
                                    colorScheme={currentPage === page ? 'blue' : 'gray'}
                                  >
                                    {page}
                                  </Button>
                                </React.Fragment>
                              ))}
                            <Button
                              onClick={() => handlePageChange(currentPage + 1)}
                              isDisabled={currentPage === Math.ceil(filteredBackups.length / itemsPerPage)}
                              rightIcon={<ChevronRightIcon />}
                            >
                              Next
                            </Button>
                          </ButtonGroup>
                        </Flex>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Restore History Tab */}
                  <TabPanel px={6} py={6}>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md">Restore History</Heading>
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Backup Name</Th>
                              <Th>Type</Th>
                              <Th>Status</Th>
                              <Th>Restored At</Th>
                              <Th>Duration</Th>
                              <Th>Restored By</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {restoreHistory.map((restore) => (
                              <Tr key={restore.id}>
                                <Td>{restore.backupName}</Td>
                                <Td>{restore.type.charAt(0).toUpperCase() + restore.type.slice(1)}</Td>
                                <Td>{getStatusBadge(restore.status)}</Td>
                                <Td>{formatDate(restore.restoredAt)}</Td>
                                <Td>{restore.duration}</Td>
                                <Td>{restore.restoredBy}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Schedule Tab */}
                  <TabPanel px={6} py={6}>
                    <VStack spacing={6} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Backup Schedules</Heading>
                        <Button leftIcon={<AddIcon />} colorScheme="blue" size="sm">
                          Add Schedule
                        </Button>
                      </Flex>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {backupSchedules.map((schedule) => (
                          <Card key={schedule.id} bg={cardBg} shadow="sm">
                            <CardBody>
                              <VStack align="start" spacing={3}>
                                <Flex justify="space-between" w="full">
                                  <Heading size="sm">{schedule.name}</Heading>
                                  <Switch
                                    isChecked={schedule.enabled}
                                    onChange={() => {
                                      // Toggle schedule
                                    }}
                                  />
                                </Flex>
                                <HStack spacing={4}>
                                  <Badge colorScheme="blue">{schedule.type}</Badge>
                                  <Badge colorScheme="green">{schedule.frequency}</Badge>
                                  <Text fontSize="sm">{schedule.time}</Text>
                                </HStack>
                                <VStack align="start" spacing={1} w="full">
                                  <Text fontSize="sm" color="gray.600">
                                    Last run: {formatDate(schedule.lastRun)}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Next run: {formatDate(schedule.nextRun)}
                                  </Text>
                                </VStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Settings Tab */}
                  <TabPanel px={6} py={6}>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md">Backup Settings</Heading>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">General Settings</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="auto-backup" mb="0">
                                  Automatic Backups
                                </FormLabel>
                                <Switch
                                  id="auto-backup"
                                  isChecked={autoBackupEnabled}
                                  onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel>Backup Frequency</FormLabel>
                                <Select value={backupFrequency} onChange={(e) => setBackupFrequency(e.target.value)}>
                                  <option value="hourly">Hourly</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </Select>
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>

                        <Card bg={cardBg} shadow="sm">
                          <CardHeader>
                            <Heading size="sm">Retention Policy</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <FormControl>
                                <FormLabel>Retention Period (days)</FormLabel>
                                <NumberInput
                                  value={retentionDays}
                                  onChange={(valueString) => setRetentionDays(parseInt(valueString))}
                                  min={1}
                                  max={365}
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>

                              <FormControl>
                                <FormLabel>Maximum Backups</FormLabel>
                                <NumberInput
                                  value={maxBackups}
                                  onChange={(valueString) => setMaxBackups(parseInt(valueString))}
                                  min={1}
                                  max={100}
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>
                      </SimpleGrid>

                      <Flex justify="end">
                        <Button colorScheme="blue" onClick={onSettingsModalOpen}>
                          Advanced Settings
                        </Button>
                      </Flex>
                    </VStack>
                  </TabPanel>
                </TabPanels>
            </Tabs>
          </Card>
        </VStack>
      </Container>

      {/* Create Backup Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Backup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Backup Name</FormLabel>
                <Input
                  placeholder="Enter backup name"
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter backup description"
                  value={newBackupDescription}
                  onChange={(e) => setNewBackupDescription(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Backup Type</FormLabel>
                <RadioGroup value={backupType} onChange={setBackupType}>
                  <Stack direction="row">
                    <Radio value="full">Full System</Radio>
                    <Radio value="database">Database Only</Radio>
                    <Radio value="incremental">Incremental</Radio>
                    <Radio value="files">Files Only</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Include Components</FormLabel>
                <VStack align="start" spacing={2}>
                  <Checkbox
                    isChecked={includeDatabase}
                    onChange={(e) => setIncludeDatabase(e.target.checked)}
                    isDisabled={backupType === 'files'}
                  >
                    Database
                  </Checkbox>
                  <Checkbox
                    isChecked={includeFiles}
                    onChange={(e) => setIncludeFiles(e.target.checked)}
                    isDisabled={backupType === 'database'}
                  >
                    Files and Media
                  </Checkbox>
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel>Compression Level: {compressionLevel}</FormLabel>
                <Slider
                  value={compressionLevel}
                  onChange={setCompressionLevel}
                  min={1}
                  max={9}
                  step={1}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Higher values = better compression but slower backup
                </Text>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="encryption" mb="0">
                  Enable Encryption
                </FormLabel>
                <Switch
                  id="encryption"
                  isChecked={encryptionEnabled}
                  onChange={(e) => setEncryptionEnabled(e.target.checked)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateBackup}
              isLoading={processingBackup === 'creating'}
              loadingText="Creating Backup..."
            >
              Create Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Restore Modal */}
      <Modal isOpen={isRestoreModalOpen} onClose={onRestoreModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Restore from Backup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedBackup && (
              <VStack spacing={4} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Warning!</AlertTitle>
                    <AlertDescription>
                      Restoring from a backup will overwrite current data. This action cannot be undone.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Heading size="sm" mb={2}>Backup Details</Heading>
                  <VStack align="start" spacing={2}>
                    <Text><strong>Name:</strong> {selectedBackup.name}</Text>
                    <Text><strong>Type:</strong> {selectedBackup.type}</Text>
                    <Text><strong>Created:</strong> {formatDate(selectedBackup.createdAt)}</Text>
                    <Text><strong>Size:</strong> {selectedBackup.size}</Text>
                    <Text><strong>Includes:</strong> {selectedBackup.includes?.join(', ')}</Text>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel>Restore Options</FormLabel>
                  <VStack align="start" spacing={2}>
                    <Checkbox defaultChecked>Restore Database</Checkbox>
                    <Checkbox defaultChecked>Restore Files</Checkbox>
                    <Checkbox>Restore User Permissions</Checkbox>
                    <Checkbox>Send Notification After Restore</Checkbox>
                  </VStack>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRestoreModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleRestoreBackup}
              isLoading={restoringBackup !== null}
              loadingText="Restoring..."
            >
              Start Restore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={onSettingsModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Advanced Backup Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="sm" mb={4}>Storage Configuration</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Primary Storage Location</FormLabel>
                    <Select defaultValue="local">
                      <option value="local">Local Storage</option>
                      <option value="cloud">Cloud Storage</option>
                      <option value="external">External Drive</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Secondary Storage Location</FormLabel>
                    <Select defaultValue="cloud">
                      <option value="none">None</option>
                      <option value="cloud">Cloud Storage</option>
                      <option value="external">External Drive</option>
                    </Select>
                  </FormControl>
                </VStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mb={4}>Security Settings</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="encrypt-all" mb="0">
                      Encrypt All Backups
                    </FormLabel>
                    <Switch id="encrypt-all" defaultChecked />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Encryption Algorithm</FormLabel>
                    <Select defaultValue="aes256">
                      <option value="aes256">AES-256</option>
                      <option value="aes128">AES-128</option>
                    </Select>
                  </FormControl>
                </VStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mb={4}>Notification Settings</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="notify-success" mb="0">
                      Notify on Successful Backup
                    </FormLabel>
                    <Switch id="notify-success" defaultChecked />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="notify-failure" mb="0">
                      Notify on Backup Failure
                    </FormLabel>
                    <Switch id="notify-failure" defaultChecked />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onSettingsModalClose}>
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BackupRestore;