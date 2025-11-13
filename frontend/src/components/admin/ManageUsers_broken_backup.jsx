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
  InputRightElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  useColorModeValue,
  useBreakpointValue,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Grid,
  GridItem,
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
  useToast,
  Spinner,
  Center,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tooltip,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Switch,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Stack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Image,
  Icon,
  Fade,
  ScaleFade,
  Slide,
  Collapse,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  TableContainer,
  Code,
  Kbd
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewIcon,
  ViewOffIcon,
  EmailIcon,
  PhoneIcon,
  CalendarIcon,
  SettingsIcon,
  InfoIcon,
  WarningIcon,
  CheckIcon,
  CloseIcon,
  RepeatIcon,
  DownloadIcon,
  UploadIcon,
  CopyIcon,
  ExternalLinkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TimeIcon,
  UnlockIcon,
  LockIcon
} from '@chakra-ui/icons';
import { 
  FaUserPlus, 
  FaUserCog, 
  FaFilter, 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrash,
  FaDownload,
  FaUpload,
  FaCopy,
  FaShare,
  FaHistory,
  FaBan,
  FaUnlock,
  FaLock,
  FaUserShield,
  FaUserTag,
  FaIdCard,
  FaCar,
  FaClipboard,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaClock,
  FaMapMarker,
  FaChartBar,
  FaFileExport,
  FaFileImport,
  FaSync,
  FaSearch,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaInfo
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import axios from '../../config/axios';

const ManageUsers = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Enhanced modal management
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();

  // Enhanced state management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // table, grid, compact
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [quickFilters, setQuickFilters] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Enhanced form data with validation
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    department: '',
    employeeId: '',
    startDate: '',
    licenseNumber: '',
    emergencyContact: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Responsive design hooks
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: '7xl' });
  const cardColumns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  // Enhanced mock data with additional fields
  const mockUsers = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      role: 'admin',
      status: 'active',
      department: 'Operations',
      employeeId: 'EMP001',
      startDate: '2024-01-15',
      lastLogin: '2025-11-09T14:30:00Z',
      createdAt: '2024-01-15T09:00:00Z',
      licenseNumber: 'ADM12345',
      emergencyContact: 'Mary Doe - +1 (555) 987-6543',
      notes: 'System Administrator with full access',
      avatar: null,
      isVerified: true,
      permissions: ['read', 'write', 'delete', 'admin'],
      lastActivity: '2025-11-09T14:30:00Z'
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      role: 'scheduler',
      status: 'active',
      department: 'Scheduling',
      employeeId: 'EMP002',
      startDate: '2024-02-20',
      lastLogin: '2025-11-08T16:45:00Z',
      createdAt: '2024-02-20T10:30:00Z',
      licenseNumber: 'SCH23456',
      emergencyContact: 'Bob Smith - +1 (555) 876-5432',
      notes: 'Senior Scheduler with route optimization expertise',
      avatar: null,
      isVerified: true,
      permissions: ['read', 'write'],
      lastActivity: '2025-11-08T16:45:00Z'
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Johnson',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 345-6789',
      role: 'dispatcher',
      status: 'inactive',
      department: 'Dispatch',
      employeeId: 'EMP003',
      startDate: '2024-03-10',
      lastLogin: '2025-10-15T11:20:00Z',
      createdAt: '2024-03-10T08:15:00Z',
      licenseNumber: 'DIS34567',
      emergencyContact: 'Lisa Johnson - +1 (555) 765-4321',
      notes: 'On extended leave - medical reasons',
      avatar: null,
      isVerified: false,
      permissions: ['read'],
      lastActivity: '2025-10-15T11:20:00Z'
    },
    {
      id: 4,
      firstName: 'Sarah',
      lastName: 'Wilson',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      phone: '+1 (555) 456-7890',
      role: 'driver',
      status: 'active',
      department: 'Transportation',
      employeeId: 'EMP004',
      startDate: '2024-04-05',
      lastLogin: '2025-11-09T13:15:00Z',
      createdAt: '2024-04-05T07:45:00Z',
      licenseNumber: 'CDL45678A',
      emergencyContact: 'Tom Wilson - +1 (555) 654-3210',
      notes: 'Certified for oversized vehicles',
      avatar: null,
      isVerified: true,
      permissions: ['read'],
      lastActivity: '2025-11-09T13:15:00Z'
    },
    {
      id: 5,
      firstName: 'Alex',
      lastName: 'Chen',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      phone: '+1 (555) 567-8901',
      role: 'driver',
      status: 'active',
      department: 'Transportation',
      employeeId: 'EMP005',
      startDate: '2024-05-12',
      lastLogin: '2025-11-09T12:00:00Z',
      createdAt: '2024-05-12T09:30:00Z',
      licenseNumber: 'CDL56789B',
      emergencyContact: 'Emma Chen - +1 (555) 543-2109',
      notes: 'Specialized in hazmat transport',
      avatar: null,
      isVerified: true,
      permissions: ['read'],
      lastActivity: '2025-11-09T12:00:00Z'
    }
  ];

  // Enhanced data fetching with error handling
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, replace with actual API call
      // const response = await api.get('/users');
      // setUsers(response.data);
      
      setUsers(mockUsers);
      
      toast({
        title: 'Users loaded successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error loading users',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Enhanced filtering with multiple criteria
  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Text search across multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchTerm) ||
        user.employeeId.toLowerCase().includes(searchLower) ||
        (user.department && user.department.toLowerCase().includes(searchLower))
      );
    }

    // Role filtering
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filtering
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Department filtering
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    // Date filtering
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(user => 
            new Date(user.lastLogin) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(user => 
            new Date(user.lastLogin) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(user => 
            new Date(user.lastLogin) >= filterDate
          );
          break;
        default:
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastLogin':
          aValue = new Date(a.lastLogin);
          bValue = new Date(b.lastLogin);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter, dateFilter, sortField, sortDirection]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply filters when dependencies change

  // Enhanced utility functions for user management
  const validateUserForm = (formData) => {
    const errors = {};
    
    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.employeeId?.trim()) errors.employeeId = 'Employee ID is required';
    
    return errors;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectUser = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk actions',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      const selectedUserIds = Array.from(selectedUsers);
      
      switch (action) {
        case 'activate':
          setUsers(users.map(user => 
            selectedUserIds.includes(user.id) 
              ? { ...user, status: 'active' }
              : user
          ));
          toast({
            title: 'Users activated',
            description: `${selectedUserIds.length} users have been activated`,
            status: 'success',
            duration: 3000,
            isClosable: true
          });
          break;
        case 'deactivate':
          setUsers(users.map(user => 
            selectedUserIds.includes(user.id) 
              ? { ...user, status: 'inactive' }
              : user
          ));
          toast({
            title: 'Users deactivated',
            description: `${selectedUserIds.length} users have been deactivated`,
            status: 'success',
            duration: 3000,
            isClosable: true
          });
          break;
        case 'delete':
          setUsers(users.filter(user => !selectedUserIds.includes(user.id)));
          toast({
            title: 'Users deleted',
            description: `${selectedUserIds.length} users have been deleted`,
            status: 'success',
            duration: 3000,
            isClosable: true
          });
          break;
        default:
          break;
      }
      
      setSelectedUsers(new Set());
    } catch (error) {
      toast({
        title: 'Bulk action failed',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportUsers = async (format = 'csv') => {
    setExportLoading(true);
    try {
      const dataToExport = filteredUsers.map(user => ({
        'Employee ID': user.employeeId,
        'Name': user.name,
        'Email': user.email,
        'Phone': user.phone,
        'Role': user.role,
        'Department': user.department,
        'Status': user.status,
        'Start Date': user.startDate,
        'Last Login': new Date(user.lastLogin).toLocaleDateString()
      }));

      if (format === 'csv') {
        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export successful',
        description: `${filteredUsers.length} users exported to ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsEditMode(false);
    onViewOpen();
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      department: user.department,
      employeeId: user.employeeId,
      startDate: user.startDate,
      licenseNumber: user.licenseNumber,
      emergencyContact: user.emergencyContact,
      notes: user.notes
    });
    setFormErrors({});
    setIsEditMode(true);
    onEditOpen();
  };

  const handleSaveUser = async () => {
    const errors = validateUserForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Update local state
      const updatedUser = {
        ...selectedUser,
        ...editFormData,
        name: `${editFormData.firstName} ${editFormData.lastName}`,
        lastActivity: new Date().toISOString()
      };

      setUsers(users.map(user =>
        user.id === selectedUser.id ? updatedUser : user
      ));

      toast({
        title: 'User updated successfully',
        description: `${updatedUser.name} has been updated`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
      setIsEditMode(false);
      setFormErrors({});
    } catch (error) {
      toast({
        title: 'Error updating user',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      // Replace with actual API call
      // await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'scheduler': return 'blue';
      case 'dispatcher': return 'green';
      case 'driver': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'green' : 'red';
  };

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: FaUsers,
      color: 'blue.500'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'active').length,
      icon: FaUserCheck,
      color: 'green.500'
    },
    {
      label: 'Inactive Users',
      value: users.filter(u => u.status === 'inactive').length,
      icon: FaUserTimes,
      color: 'red.500'
    },
    {
      label: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      icon: FaUserCog,
      color: 'purple.500'
    }
  ];

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Center height="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading users...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Stats calculations
  const stats = useMemo(() => [
    {
      label: 'Total Users',
      value: users.length,
      icon: HiUsers,
      color: 'blue',
      trend: '+12% this month'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'active').length,
      icon: HiCheckCircle,
      color: 'green',
      trend: '+5% this week'
    },
    {
      label: 'Inactive Users',
      value: users.filter(u => u.status === 'inactive').length,
      icon: HiXCircle,
      color: 'red',
      trend: '-2% this month'
    },
    {
      label: 'New This Month',
      value: users.filter(u => {
        const created = new Date(u.createdAt);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return created >= thisMonth;
      }).length,
      icon: HiUserAdd,
      color: 'purple',
      trend: '+8% vs last month'
    }
  ], [users]);

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
                Manage Users
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <Box>
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              justify="space-between" 
              align={{ base: 'stretch', md: 'center' }}
              gap={4}
            >
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
                <Flex align="center" gap={3}>
                  <Icon as={HiUsers} boxSize={8} color={accentColor} />
                  <Heading 
                    size={{ base: 'lg', md: 'xl' }} 
                    color={textColor}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    User Management
                  </Heading>
                </Flex>
                <Text 
                  color={mutedColor} 
                  fontSize={{ base: 'md', md: 'lg' }}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  Comprehensive user administration and management
                </Text>
              </VStack>

              <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
                <Button
                  leftIcon={<HiUserAdd />}
                  colorScheme="blue"
                  size={{ base: 'md', md: 'lg' }}
                  onClick={() => navigate('/admin/register')}
                  width={{ base: 'full', sm: 'auto' }}
                >
                  Add New User
                </Button>
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    size={{ base: 'md', md: 'lg' }}
                    width={{ base: 'full', sm: 'auto' }}
                    isLoading={exportLoading}
                  >
                    Export
                  </MenuButton>
                  <MenuList>
                    <MenuItem 
                      icon={<HiDownload />} 
                      onClick={() => handleExportUsers('csv')}
                    >
                      Export as CSV
                    </MenuItem>
                    <MenuItem 
                      icon={<HiDownload />} 
                      onClick={() => handleExportUsers('excel')}
                    >
                      Export as Excel
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>
          </Box>
        </VStack>
      </Container>

      <Container maxW={containerMaxW} px={6}>
        <VStack spacing={8} align="stretch">
          {/* Enhanced Stats Dashboard */}
          <Card bg={cardBg} shadow="lg" borderRadius="xl" overflow="hidden">
            <CardHeader bg={`linear-gradient(135deg, ${accentColor} 0%, blue.600 100%)`} py={6}>
              <Flex align="center" justify="space-between">
                <VStack align="flex-start" spacing={1}>
                  <Text color="white" fontSize="lg" fontWeight="bold">
                    User Statistics
                  </Text>
                  <Text color="blue.100" fontSize="sm">
                    Real-time overview of user metrics
                  </Text>
                </VStack>
                <Icon as={HiChartBar} boxSize={6} color="white" />
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    bg={cardBg}
                    borderRadius="lg"
                    shadow="md"
                    transition="all 0.2s"
                    _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <CardBody p={6}>
                      <VStack spacing={4} align="flex-start">
                        <Flex align="center" justify="space-between" width="full">
                          <Box
                            p={3}
                            borderRadius="lg"
                            bg={useColorModeValue(`${stat.color}.50`, `${stat.color}.900`)}
                          >
                            <Icon
                              as={stat.icon}
                              boxSize={6}
                              color={useColorModeValue(`${stat.color}.600`, `${stat.color}.300`)}
                            />
                          </Box>
                          <Badge
                            colorScheme={stat.color}
                            variant="subtle"
                            fontSize="xs"
                            borderRadius="full"
                            px={2}
                            py={1}
                          >
                            {stat.trend}
                          </Badge>
                        </Flex>
                        <VStack align="flex-start" spacing={1}>
                          <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                            {stat.value}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} fontWeight="medium">
                            {stat.label}
                          </Text>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Enhanced Search and Filters */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                {/* Search Bar and View Toggle */}
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                  align={{ base: 'stretch', md: 'center' }}
                  justify="space-between"
                >
                  <HStack spacing={4} flex={1} maxW={{ base: 'full', md: '500px' }}>
                    <InputGroup size="lg">
                      <InputLeftElement>
                        <Icon as={HiSearch} color={mutedColor} />
                      </InputLeftElement>
                      <Input
                        placeholder="Search users by name, email, or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg={useColorModeValue('white', 'gray.700')}
                        border="2px solid"
                        borderColor={borderColor}
                        _focus={{ borderColor: accentColor, shadow: 'md' }}
                        borderRadius="lg"
                      />
                      {searchTerm && (
                        <InputRightElement>
                          <IconButton
                            aria-label="Clear search"
                            icon={<CloseIcon />}
                            size="sm"
                            variant="ghost"
                            onClick={() => setSearchTerm('')}
                          />
                        </InputRightElement>
                      )}
                    </InputGroup>
                  </HStack>

                  <HStack spacing={2}>
                    {/* View Mode Toggle */}
                    <ButtonGroup isAttached variant="outline">
                      <Button
                        leftIcon={<HiViewList />}
                        isActive={viewMode === 'table'}
                        onClick={() => setViewMode('table')}
                        size="md"
                      >
                        {!isMobile && 'Table'}
                      </Button>
                      <Button
                        leftIcon={<HiViewGrid />}
                        isActive={viewMode === 'grid'}
                        onClick={() => setViewMode('grid')}
                        size="md"
                      >
                        {!isMobile && 'Grid'}
                      </Button>
                    </ButtonGroup>

                    {/* Advanced Filters Button */}
                    <Button
                      leftIcon={<HiFilter />}
                      variant="outline"
                      onClick={onFilterOpen}
                      size="md"
                    >
                      Filters
                    </Button>
                  </HStack>
                </Flex>

                {/* Quick Filters */}
                <Wrap spacing={3}>
                  <WrapItem>
                    <Select
                      placeholder="All Roles"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      size="md"
                      bg={cardBg}
                      borderColor={borderColor}
                      maxW="150px"
                    >
                      <option value="admin">Admin</option>
                      <option value="scheduler">Scheduler</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="driver">Driver</option>
                    </Select>
                  </WrapItem>
                  <WrapItem>
                    <Select
                      placeholder="All Status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      size="md"
                      bg={cardBg}
                      borderColor={borderColor}
                      maxW="150px"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </WrapItem>
                  <WrapItem>
                    <Select
                      placeholder="All Departments"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      size="md"
                      bg={cardBg}
                      borderColor={borderColor}
                      maxW="180px"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Scheduling">Scheduling</option>
                      <option value="Dispatch">Dispatch</option>
                      <option value="Transportation">Transportation</option>
                    </Select>
                  </WrapItem>
                  {(roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || searchTerm) && (
                    <WrapItem>
                      <Button
                        leftIcon={<CloseIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                          setDepartmentFilter('all');
                        }}
                      >
                        Clear All
                      </Button>
                    </WrapItem>
                  )}
                </Wrap>

                {/* Bulk Actions and Results Info */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                      {filteredUsers.length} of {users.length} users
                    </Text>
                    {selectedUsers.size > 0 && (
                      <Text fontSize="sm" color={accentColor} fontWeight="medium">
                        {selectedUsers.size} selected
                      </Text>
                    )}
                  </VStack>

                  {selectedUsers.size > 0 && (
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="green"
                        variant="outline"
                        leftIcon={<HiCheckCircle />}
                        onClick={() => handleBulkAction('activate')}
                        isLoading={bulkActionLoading}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        leftIcon={<HiXCircle />}
                        onClick={() => handleBulkAction('deactivate')}
                        isLoading={bulkActionLoading}
                      >
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<HiTrash />}
                        onClick={() => handleBulkAction('delete')}
                        isLoading={bulkActionLoading}
                      >
                        Delete
                      </Button>
                    </HStack>
                  )}
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default ManageUsers;
              <Card key={index} bg={cardBg} shadow="md" borderRadius="lg">
                <CardBody>
                  <Flex align="center">
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={`${stat.color.split('.')[0]}.50`}
                      mr={4}
                    >
                      <stat.icon size={20} color={stat.color} />
                    </Box>
                    <Box>
                      <Stat>
                        <StatLabel fontSize="sm" color="gray.600">{stat.label}</StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold">{stat.value}</StatNumber>
                      </Stat>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Filters and Actions */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardHeader>
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <Heading size="md">User Directory</Heading>
                <HStack spacing={4}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={() => navigate('/admin/register')}
                    size="sm"
                  >
                    Add New User
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Search and Filters */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.600">Search Users</FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.600">Filter by Role</FormLabel>
                    <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="scheduler">Scheduler</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="driver">Driver</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.600">Filter by Status</FormLabel>
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Users Table */}
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>User</Th>
                        <Th>Role</Th>
                        <Th>Status</Th>
                        <Th>Last Login</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredUsers.map((user) => (
                        <Tr key={user.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td>
                            <Flex align="center">
                              <Avatar size="sm" name={user.name} mr={3} />
                              <Box>
                                <Text fontWeight="medium">{user.name}</Text>
                                <Text fontSize="sm" color="gray.500">{user.email}</Text>
                              </Box>
                            </Flex>
                          </Td>
                          <Td>
                            <Badge colorScheme={getRoleBadgeColor(user.role)} borderRadius="full" px={3}>
                              {user.role}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusBadgeColor(user.status)} borderRadius="full" px={3}>
                              {user.status}
                            </Badge>
                          </Td>
                          <Td>{user.lastLogin}</Td>
                          <Td>{user.createdAt}</Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<ChevronDownIcon />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem icon={<ViewIcon />} onClick={() => handleViewUser(user)}>
                                  View Details
                                </MenuItem>
                                <MenuItem icon={<EditIcon />} onClick={() => handleEditUser(user)}>
                                  Edit User
                                </MenuItem>
                                <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => handleDeleteUser(user.id)}>
                                  Delete User
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {filteredUsers.length === 0 && (
                  <Center py={8}>
                    <VStack spacing={4}>
                      <FaUsers size={48} color="#a0aec0" />
                      <Text color="gray.500">No users found matching your criteria</Text>
                    </VStack>
                  </Center>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* User Details/Edit Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {isEditMode ? 'Edit User' : 'User Details'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedUser && !isEditMode && (
                  <VStack spacing={4} align="stretch">
                    <Flex align="center">
                      <Avatar size="lg" name={selectedUser.name} mr={4} />
                      <Box>
                        <Heading size="md">{selectedUser.name}</Heading>
                        <Text color="gray.500">{selectedUser.email}</Text>
                      </Box>
                    </Flex>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Role</Text>
                        <Badge colorScheme={getRoleBadgeColor(selectedUser.role)} mt={1}>
                          {selectedUser.role}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Status</Text>
                        <Badge colorScheme={getStatusBadgeColor(selectedUser.status)} mt={1}>
                          {selectedUser.status}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Phone</Text>
                        <Text>{selectedUser.phone}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.600">Last Login</Text>
                        <Text>{selectedUser.lastLogin}</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                )}

                {selectedUser && isEditMode && (
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      >
                        <option value="admin">Admin</option>
                        <option value="scheduler">Scheduler</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="driver">Driver</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </Select>
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>

              {isEditMode && (
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={handleSaveUser}>
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                </ModalFooter>
              )}
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </Box>
  );
};

export default ManageUsers;