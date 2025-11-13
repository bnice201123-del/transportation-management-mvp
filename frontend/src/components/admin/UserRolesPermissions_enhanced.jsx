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
  useBreakpointValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Checkbox,
  Icon,
  CheckboxGroup,
  Divider,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  useToast,
  Avatar,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Progress,
  Center,
  Spinner,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  Stack,
  RadioGroup,
  Radio,
  Textarea,
  Collapse
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  InfoIcon,
  CopyIcon,
  DownloadIcon,
  TimeIcon,
  CalendarIcon,
  StarIcon,
  SmallCloseIcon
} from '@chakra-ui/icons';
import {
  HiUsers,
  HiUserGroup,
  HiShieldCheck,
  HiShieldExclamation,
  HiKey,
  HiLockClosed,
  HiLockOpen,
  HiFilter,
  HiCog,
  HiEye,
  HiEyeOff,
  HiCheckCircle,
  HiXCircle,
  HiPlus,
  HiPencil,
  HiTrash,
  HiRefresh,
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
  HiUserAdd,
  HiUserRemove,
  HiSave,
  HiX,
  HiCheck
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const UserRolesPermissions = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Enhanced modal management
  const { isOpen: isUserEditOpen, onOpen: onUserEditOpen, onClose: onUserEditClose } = useDisclosure();
  const { isOpen: isRoleEditOpen, onOpen: onRoleEditOpen, onClose: onRoleEditClose } = useDisclosure();
  
  // Enhanced state management
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: '7xl' });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const cardColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const statIconBg = useColorModeValue('gray.50', 'gray.700');

  // Enhanced mock data
  const mockUsers = useMemo(() => [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      status: 'active',
      permissions: ['all'],
      lastLogin: '2025-11-09T10:30:00Z',
      createdAt: '2024-01-15T08:00:00Z',
      department: 'Administration',
      avatar: null,
      isVerified: true,
      loginCount: 245,
      permissionLevel: 'full'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'scheduler',
      status: 'active',
      permissions: ['view_trips', 'create_trips', 'edit_trips', 'view_reports', 'manage_recurring'],
      lastLogin: '2025-11-09T09:45:00Z',
      createdAt: '2024-02-20T10:30:00Z',
      department: 'Operations',
      avatar: null,
      isVerified: true,
      loginCount: 189,
      permissionLevel: 'high'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'dispatcher',
      status: 'active',
      permissions: ['view_trips', 'assign_drivers', 'view_vehicles', 'view_riders', 'update_trip_status', 'emergency_access'],
      lastLogin: '2025-11-09T08:20:00Z',
      createdAt: '2024-03-10T09:15:00Z',
      department: 'Dispatch',
      avatar: null,
      isVerified: true,
      loginCount: 156,
      permissionLevel: 'medium'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      role: 'driver',
      status: 'inactive',
      permissions: ['view_assigned_trips', 'update_trip_status', 'view_vehicle_info', 'report_issues'],
      lastLogin: '2025-11-08T16:15:00Z',
      createdAt: '2024-04-05T07:45:00Z',
      department: 'Transportation',
      avatar: null,
      isVerified: false,
      loginCount: 89,
      permissionLevel: 'basic'
    },
    {
      id: 5,
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      role: 'scheduler',
      status: 'active',
      permissions: ['view_trips', 'create_trips', 'edit_trips', 'view_reports'],
      lastLogin: '2025-11-09T07:30:00Z',
      createdAt: '2024-05-15T11:20:00Z',
      department: 'Operations',
      avatar: null,
      isVerified: true,
      loginCount: 134,
      permissionLevel: 'medium'
    }
  ], []);

  const mockRoles = useMemo(() => [
    {
      id: 1,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['all'],
      userCount: 1,
      color: 'red',
      icon: HiShieldCheck,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'scheduler',
      displayName: 'Scheduler',
      description: 'Trip scheduling and management operations',
      permissions: ['view_trips', 'create_trips', 'edit_trips', 'delete_trips', 'view_reports', 'manage_recurring'],
      userCount: 2,
      color: 'blue',
      icon: HiClipboard,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: 'dispatcher',
      displayName: 'Dispatcher',
      description: 'Real-time dispatch and driver coordination',
      permissions: ['view_trips', 'assign_drivers', 'view_vehicles', 'view_riders', 'update_trip_status', 'emergency_access'],
      userCount: 1,
      color: 'green',
      icon: HiUsers,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      name: 'driver',
      displayName: 'Driver',
      description: 'Trip execution and status updates',
      permissions: ['view_assigned_trips', 'update_trip_status', 'view_vehicle_info', 'report_issues'],
      userCount: 1,
      color: 'orange',
      icon: HiKey,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ], []);

  const allPermissions = useMemo(() => [
    // Trip Management
    { id: 'view_trips', name: 'View Trips', category: 'Trip Management', description: 'View all trip information and details', risk: 'low' },
    { id: 'create_trips', name: 'Create Trips', category: 'Trip Management', description: 'Create new trips and schedules', risk: 'medium' },
    { id: 'edit_trips', name: 'Edit Trips', category: 'Trip Management', description: 'Modify existing trip details', risk: 'medium' },
    { id: 'delete_trips', name: 'Delete Trips', category: 'Trip Management', description: 'Remove trips from the system', risk: 'high' },
    { id: 'assign_drivers', name: 'Assign Drivers', category: 'Trip Management', description: 'Assign drivers to trips', risk: 'medium' },
    { id: 'update_trip_status', name: 'Update Trip Status', category: 'Trip Management', description: 'Change trip status and progress', risk: 'low' },
    { id: 'view_assigned_trips', name: 'View Assigned Trips', category: 'Trip Management', description: 'View only personally assigned trips', risk: 'low' },
    { id: 'manage_recurring', name: 'Manage Recurring Trips', category: 'Trip Management', description: 'Create and manage recurring trip schedules', risk: 'medium' },

    // User Management
    { id: 'view_users', name: 'View Users', category: 'User Management', description: 'View user information and profiles', risk: 'low' },
    { id: 'create_users', name: 'Create Users', category: 'User Management', description: 'Add new users to the system', risk: 'high' },
    { id: 'edit_users', name: 'Edit Users', category: 'User Management', description: 'Modify user information and settings', risk: 'high' },
    { id: 'delete_users', name: 'Delete Users', category: 'User Management', description: 'Remove users from the system', risk: 'high' },
    { id: 'manage_roles', name: 'Manage Roles', category: 'User Management', description: 'Assign and modify user roles and permissions', risk: 'high' },

    // Vehicle Management
    { id: 'view_vehicles', name: 'View Vehicles', category: 'Vehicle Management', description: 'View vehicle information and status', risk: 'low' },
    { id: 'create_vehicles', name: 'Create Vehicles', category: 'Vehicle Management', description: 'Add new vehicles to the fleet', risk: 'medium' },
    { id: 'edit_vehicles', name: 'Edit Vehicles', category: 'Vehicle Management', description: 'Modify vehicle information and settings', risk: 'medium' },
    { id: 'delete_vehicles', name: 'Delete Vehicles', category: 'Vehicle Management', description: 'Remove vehicles from the fleet', risk: 'high' },
    { id: 'view_vehicle_info', name: 'View Vehicle Info', category: 'Vehicle Management', description: 'View detailed vehicle information', risk: 'low' },

    // Rider Management
    { id: 'view_riders', name: 'View Riders', category: 'Rider Management', description: 'View rider information and profiles', risk: 'low' },
    { id: 'create_riders', name: 'Create Riders', category: 'Rider Management', description: 'Add new riders to the system', risk: 'medium' },
    { id: 'edit_riders', name: 'Edit Riders', category: 'Rider Management', description: 'Modify rider information', risk: 'medium' },
    { id: 'delete_riders', name: 'Delete Riders', category: 'Rider Management', description: 'Remove riders from the system', risk: 'high' },

    // Reports & Analytics
    { id: 'view_reports', name: 'View Reports', category: 'Reports & Analytics', description: 'Access system reports and analytics', risk: 'low' },
    { id: 'generate_reports', name: 'Generate Reports', category: 'Reports & Analytics', description: 'Create custom reports and analytics', risk: 'medium' },
    { id: 'export_data', name: 'Export Data', category: 'Reports & Analytics', description: 'Export system data and reports', risk: 'medium' },

    // System Administration
    { id: 'system_settings', name: 'System Settings', category: 'System Administration', description: 'Modify core system settings', risk: 'high' },
    { id: 'security_settings', name: 'Security Settings', category: 'System Administration', description: 'Manage security policies and settings', risk: 'high' },
    { id: 'audit_logs', name: 'Audit Logs', category: 'System Administration', description: 'View system audit logs and activities', risk: 'medium' },
    { id: 'emergency_access', name: 'Emergency Access', category: 'System Administration', description: 'Access system during emergency situations', risk: 'high' },
    { id: 'report_issues', name: 'Report Issues', category: 'System Administration', description: 'Report system issues and problems', risk: 'low' }
  ], []);

  const permissionCategories = useMemo(() => 
    [...new Set(allPermissions.map(p => p.category))], 
    [allPermissions]
  );

  // Enhanced data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(mockUsers);
      setRoles(mockRoles);
      setPermissions(allPermissions);
      
      toast({
        title: 'Data loaded successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [mockUsers, mockRoles, allPermissions, toast]);

  // Enhanced filtering
  const filterUsers = useCallback(() => {
    let filtered = [...users];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'lastLogin') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  const filterRoles = useCallback(() => {
    let filtered = [...roles];
    setFilteredRoles(filtered);
  }, [roles]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterUsers();
    filterRoles();
  }, [filterUsers, filterRoles]);

  // Utility functions
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

  const getPermissionLevelColor = (level) => {
    switch (level) {
      case 'full': return 'purple';
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'basic': return 'blue';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };



  const handleEditUser = (user) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    onUserEditOpen();
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
    onRoleEditOpen();
  };

  const handleSaveUserPermissions = async () => {
    try {
      const updatedUser = {
        ...selectedUser,
        permissions: selectedPermissions
      };

      setUsers(users.map(user =>
        user.id === selectedUser.id ? updatedUser : user
      ));

      toast({
        title: 'Permissions updated',
        description: `${selectedUser.name}'s permissions have been updated successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onUserEditClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error updating permissions',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Statistics calculations
  const stats = useMemo(() => [
    {
      label: 'Total Users',
      value: users.length,
      icon: HiUsers,
      color: 'blue.500',
      change: '+5 this week'
    },
    {
      label: 'Active Roles',
      value: roles.length,
      icon: HiShieldCheck,
      color: 'green.500',
      change: 'No changes'
    },
    {
      label: 'Total Permissions',
      value: permissions.length,
      icon: HiKey,
      color: 'purple.500',
      change: '+2 this month'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'active').length,
      icon: HiCheckCircle,
      color: 'teal.500',
      change: '+3 this week'
    }
  ], [users, roles, permissions]);

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Center height="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color={accentColor} />
            <Text color={textColor} fontSize="lg">Loading roles and permissions...</Text>
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
                User Roles & Permissions
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Header Section */}
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
                    User Roles & Permissions Management
                  </Heading>
                  <Text 
                    fontSize={{ base: 'md', md: 'lg' }} 
                    opacity={0.9}
                    maxW="600px"
                  >
                    Comprehensive access control system for managing user roles, permissions, and security policies across the platform
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
                    Security Overview
                  </Heading>
                  <Text fontSize="sm" color={mutedColor}>
                    System-wide access control metrics
                  </Text>
                </VStack>
                <Icon as={HiChartBar} boxSize={6} color={accentColor} />
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
                {stats.map((stat, index) => (
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
                      <VStack spacing={4}>
                        <Box
                          p={3}
                          borderRadius="full"
                          bg={cardBg}
                          border="2px solid"
                          borderColor={stat.color}
                        >
                          <Icon as={stat.icon} boxSize={6} color={stat.color} />
                        </Box>
                        <VStack spacing={1}>
                          <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                            {stat.value}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} fontWeight="medium">
                            {stat.label}
                          </Text>
                          <Badge variant="subtle" colorScheme="gray" fontSize="xs">
                            {stat.change}
                          </Badge>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
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
                  <HiUsers style={{ marginRight: '8px' }} />
                  User Management
                </Tab>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiShieldCheck style={{ marginRight: '8px' }} />
                  Role Management  
                </Tab>
                <Tab _selected={{ color: accentColor, borderColor: accentColor }}>
                  <HiViewGrid style={{ marginRight: '8px' }} />
                  Permission Matrix
                </Tab>
              </TabList>

              <TabPanels>
                {/* User Management Tab */}
                <TabPanel p={6}>
                  <VStack spacing={6} align="stretch">
                    {/* Search and Filter Controls */}
                    <Flex
                      direction={{ base: 'column', md: 'row' }}
                      gap={4}
                      align={{ base: 'stretch', md: 'center' }}
                    >
                      <HStack spacing={4} flex={1}>
                        <InputGroup maxW="400px">
                          <InputLeftElement>
                            <Icon as={HiSearch} color={mutedColor} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search users by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg={cardBg}
                            border="2px solid"
                            borderColor={borderColor}
                            _focus={{ borderColor: accentColor }}
                          />
                          {searchTerm && (
                            <InputRightElement>
                              <IconButton
                                aria-label="Clear search"
                                icon={<SmallCloseIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => setSearchTerm('')}
                              />
                            </InputRightElement>
                          )}
                        </InputGroup>
                      </HStack>

                      <HStack spacing={3}>
                        <Select
                          placeholder="All Roles"
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          maxW="150px"
                          bg={cardBg}
                          borderColor={borderColor}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.name}>
                              {role.displayName}
                            </option>
                          ))}
                        </Select>
                        
                        <Select
                          placeholder="All Status"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          maxW="120px"
                          bg={cardBg}
                          borderColor={borderColor}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Select>

                        <ButtonGroup isAttached variant="outline">
                          <Button
                            leftIcon={<HiViewList />}
                            isActive={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                          >
                            {!isMobile && 'Table'}
                          </Button>
                          <Button
                            leftIcon={<HiViewGrid />}
                            isActive={viewMode === 'grid'}
                            onClick={() => setViewMode('grid')}
                          >
                            {!isMobile && 'Grid'}
                          </Button>
                        </ButtonGroup>
                      </HStack>
                    </Flex>

                    {/* Results Info */}
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color={textColor}>
                        Showing {filteredUsers.length} of {users.length} users
                      </Text>
                      <Button
                        leftIcon={<HiRefresh />}
                        variant="ghost"
                        size="sm"
                        onClick={fetchData}
                      >
                        Refresh
                      </Button>
                    </Flex>

                    {/* User Table */}
                    {viewMode === 'table' ? (
                      <Card shadow="md" borderRadius="lg">
                        <Box overflowX="auto">
                          <Table variant="simple" size={tableSize}>
                            <Thead bg={tableHeaderBg}>
                              <Tr>
                                <Th>
                                  <HStack spacing={2}>
                                    <Text>User</Text>
                                    <IconButton
                                      aria-label="Sort by name"
                                      icon={sortField === 'name' && sortDirection === 'asc' ? <HiSortAscending /> : <HiSortDescending />}
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => handleSort('name')}
                                    />
                                  </HStack>
                                </Th>
                                <Th>Role & Status</Th>
                                <Th>Department</Th>
                                <Th>Permissions</Th>
                                <Th>Last Login</Th>
                                <Th>Actions</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {filteredUsers.map((user) => (
                                <Tr key={user.id} _hover={{ bg: hoverBg }}>
                                  <Td>
                                    <HStack spacing={3}>
                                      <Avatar size="sm" name={user.name} />
                                      <VStack align="flex-start" spacing={0}>
                                        <Text fontWeight="medium" fontSize="sm">
                                          {user.name}
                                        </Text>
                                        <Text color={mutedColor} fontSize="xs">
                                          {user.email}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <VStack align="flex-start" spacing={2}>
                                      <Badge 
                                        colorScheme={getRoleBadgeColor(user.role)}
                                        variant="subtle"
                                      >
                                        {user.role}
                                      </Badge>
                                      <Badge 
                                        colorScheme={getStatusBadgeColor(user.status)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        {user.status}
                                      </Badge>
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" color={textColor}>
                                      {user.department}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <VStack align="flex-start" spacing={1}>
                                      <Badge 
                                        colorScheme={getPermissionLevelColor(user.permissionLevel)}
                                        variant="subtle"
                                      >
                                        {user.permissionLevel}
                                      </Badge>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {user.permissions.includes('all') 
                                          ? 'All permissions' 
                                          : `${user.permissions.length} permissions`}
                                      </Text>
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <VStack align="flex-start" spacing={0}>
                                      <Text fontSize="xs" color={textColor}>
                                        {new Date(user.lastLogin).toLocaleDateString()}
                                      </Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {new Date(user.lastLogin).toLocaleTimeString()}
                                      </Text>
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <HStack spacing={1}>
                                      <Tooltip label="Edit Permissions">
                                        <IconButton
                                          aria-label="Edit permissions"
                                          icon={<HiPencil />}
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditUser(user)}
                                        />
                                      </Tooltip>
                                      <Menu>
                                        <MenuButton
                                          as={IconButton}
                                          aria-label="More options"
                                          icon={<HiDotsVertical />}
                                          size="sm"
                                          variant="ghost"
                                        />
                                        <MenuList>
                                          <MenuItem icon={<HiEye />}>
                                            View Details
                                          </MenuItem>
                                          <MenuItem icon={<HiPencil />}>
                                            Edit User
                                          </MenuItem>
                                          <MenuDivider />
                                          <MenuItem icon={<HiXCircle />} color={errorColor}>
                                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                          </MenuItem>
                                        </MenuList>
                                      </Menu>
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </Card>
                    ) : (
                      /* User Grid View */
                      <SimpleGrid columns={cardColumns} spacing={6}>
                        {filteredUsers.map((user) => (
                          <Card 
                            key={user.id} 
                            bg={cardBg} 
                            shadow="md" 
                            borderRadius="lg"
                            transition="all 0.2s"
                            _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                          >
                            <CardBody p={6}>
                              <VStack spacing={4} align="stretch">
                                <HStack justify="space-between" align="start">
                                  <HStack spacing={3}>
                                    <Avatar size="md" name={user.name} />
                                    <VStack align="flex-start" spacing={1}>
                                      <Text fontWeight="bold" fontSize="sm">
                                        {user.name}
                                      </Text>
                                      <Text color={mutedColor} fontSize="xs">
                                        {user.email}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <Badge 
                                    colorScheme={getStatusBadgeColor(user.status)}
                                    variant="subtle"
                                  >
                                    {user.status}
                                  </Badge>
                                </HStack>

                                <VStack spacing={2} align="stretch">
                                  <HStack justify="space-between">
                                    <Text fontSize="xs" color={mutedColor}>Role:</Text>
                                    <Badge colorScheme={getRoleBadgeColor(user.role)} size="sm">
                                      {user.role}
                                    </Badge>
                                  </HStack>
                                  <HStack justify="space-between">
                                    <Text fontSize="xs" color={mutedColor}>Department:</Text>
                                    <Text fontSize="xs" color={textColor}>
                                      {user.department}
                                    </Text>
                                  </HStack>
                                  <HStack justify="space-between">
                                    <Text fontSize="xs" color={mutedColor}>Permission Level:</Text>
                                    <Badge 
                                      colorScheme={getPermissionLevelColor(user.permissionLevel)}
                                      size="sm"
                                    >
                                      {user.permissionLevel}
                                    </Badge>
                                  </HStack>
                                </VStack>

                                <Divider />

                                <Button
                                  leftIcon={<HiPencil />}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit Permissions
                                </Button>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </TabPanel>

                {/* Role Management Tab */}
                <TabPanel p={6}>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <VStack align="flex-start" spacing={1}>
                        <Heading size="md" color={textColor}>
                          System Roles
                        </Heading>
                        <Text fontSize="sm" color={mutedColor}>
                          Manage role definitions and their associated permissions
                        </Text>
                      </VStack>
                      <Button
                        leftIcon={<HiPlus />}
                        colorScheme="blue"
                        size="sm"
                      >
                        Create Role
                      </Button>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {filteredRoles.map((role) => (
                        <Card 
                          key={role.id}
                          bg={cardBg}
                          shadow="md"
                          borderRadius="lg"
                          border="2px solid"
                          borderColor={borderColor}
                          transition="all 0.2s"
                          _hover={{ 
                            shadow: 'lg', 
                            transform: 'translateY(-2px)',
                            borderColor: accentColor
                          }}
                        >
                          <CardBody p={6}>
                            <VStack spacing={4} align="stretch">
                              <HStack justify="space-between" align="start">
                                <HStack spacing={3}>
                                  <Box
                                    p={2}
                                    borderRadius="md"
                                    bg={`${role.color}.50`}
                                    color={`${role.color}.600`}
                                  >
                                    <Icon as={role.icon} boxSize={5} />
                                  </Box>
                                  <VStack align="flex-start" spacing={1}>
                                    <Text fontWeight="bold" fontSize="md">
                                      {role.displayName}
                                    </Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                      {role.userCount} users
                                    </Text>
                                  </VStack>
                                </HStack>
                                {role.isSystem && (
                                  <Badge colorScheme="gray" variant="subtle" size="sm">
                                    System
                                  </Badge>
                                )}
                              </HStack>

                              <Text fontSize="sm" color={mutedColor}>
                                {role.description}
                              </Text>

                              <VStack spacing={2} align="stretch">
                                <Text fontSize="xs" fontWeight="bold" color={textColor}>
                                  Permissions ({role.permissions.length})
                                </Text>
                                <Wrap spacing={1}>
                                  {role.permissions.includes('all') ? (
                                    <Badge colorScheme="purple" size="sm">
                                      All Permissions
                                    </Badge>
                                  ) : (
                                    role.permissions.slice(0, 3).map(permission => (
                                      <Badge key={permission} colorScheme="gray" size="sm" variant="outline">
                                        {allPermissions.find(p => p.id === permission)?.name || permission}
                                      </Badge>
                                    ))
                                  )}
                                  {role.permissions.length > 3 && !role.permissions.includes('all') && (
                                    <Badge colorScheme="gray" size="sm" variant="outline">
                                      +{role.permissions.length - 3} more
                                    </Badge>
                                  )}
                                </Wrap>
                              </VStack>

                              <Divider />

                              <HStack spacing={2}>
                                <Button
                                  leftIcon={<HiPencil />}
                                  size="sm"
                                  variant="outline"
                                  flex={1}
                                  onClick={() => handleEditRole(role)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  leftIcon={<HiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActiveTab(2)}
                                >
                                  View
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </TabPanel>

                {/* Permission Matrix Tab */}
                <TabPanel p={6}>
                  <VStack spacing={6} align="stretch">
                    <VStack align="flex-start" spacing={2}>
                      <Heading size="md" color={textColor}>
                        Permission Matrix
                      </Heading>
                      <Text fontSize="sm" color={mutedColor}>
                        Overview of permissions across all roles and categories
                      </Text>
                    </VStack>

                    <Accordion allowMultiple defaultIndex={[0]}>
                      {permissionCategories.map((category) => (
                        <AccordionItem key={category} border="1px solid" borderColor={borderColor} borderRadius="lg" mb={4}>
                          <AccordionButton
                            bg={cardBg}
                            _hover={{ bg: hoverBg }}
                            borderRadius="lg"
                            p={4}
                          >
                            <Box flex="1" textAlign="left">
                              <HStack spacing={3}>
                                <Icon as={HiKey} color={accentColor} />
                                <Text fontWeight="bold" color={textColor}>
                                  {category}
                                </Text>
                                <Badge colorScheme="blue" variant="subtle">
                                  {allPermissions.filter(p => p.category === category).length} permissions
                                </Badge>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                              {allPermissions
                                .filter(permission => permission.category === category)
                                .map((permission) => (
                                  <Card
                                    key={permission.id}
                                    size="sm"
                                    variant="outline"
                                    borderColor={borderColor}
                                  >
                                    <CardBody p={4}>
                                      <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between" align="start">
                                          <VStack align="flex-start" spacing={1}>
                                            <Text fontSize="sm" fontWeight="bold" color={textColor}>
                                              {permission.name}
                                            </Text>
                                            <Text fontSize="xs" color={mutedColor}>
                                              {permission.description}
                                            </Text>
                                          </VStack>
                                          <Badge
                                            colorScheme={getRiskColor(permission.risk)}
                                            variant="subtle"
                                            size="sm"
                                          >
                                            {permission.risk} risk
                                          </Badge>
                                        </HStack>

                                        <VStack spacing={2} align="stretch">
                                          <Text fontSize="xs" fontWeight="bold" color={textColor}>
                                            Assigned to:
                                          </Text>
                                          <Wrap spacing={1}>
                                            {roles.map(role => {
                                              const hasAccess = role.permissions.includes('all') || 
                                                               role.permissions.includes(permission.id);
                                              return hasAccess ? (
                                                <Badge
                                                  key={role.id}
                                                  colorScheme={role.color}
                                                  size="sm"
                                                  variant="subtle"
                                                >
                                                  {role.displayName}
                                                </Badge>
                                              ) : null;
                                            })}
                                          </Wrap>
                                        </VStack>
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                ))}
                            </SimpleGrid>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </VStack>
      </Container>

      {/* Edit User Permissions Modal */}
      <Modal isOpen={isUserEditOpen} onClose={onUserEditClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={HiPencil} color={accentColor} />
              <VStack align="flex-start" spacing={0}>
                <Text>Edit User Permissions</Text>
                {selectedUser && (
                  <Text fontSize="sm" color={mutedColor} fontWeight="normal">
                    {selectedUser.name} ({selectedUser.email})
                  </Text>
                )}
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={6} align="stretch">
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Current Role: {selectedUser.role}</AlertTitle>
                    <AlertDescription>
                      Modifying permissions will override the default role permissions for this user.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Accordion allowMultiple defaultIndex={[0]}>
                  {permissionCategories.map((category) => (
                    <AccordionItem key={category}>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{category}</Text>
                            <Badge colorScheme="blue" variant="subtle">
                              {selectedPermissions.filter(p => 
                                allPermissions.find(perm => perm.id === p)?.category === category
                              ).length} selected
                            </Badge>
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <CheckboxGroup
                          value={selectedPermissions}
                          onChange={setSelectedPermissions}
                        >
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            {allPermissions
                              .filter(permission => permission.category === category)
                              .map((permission) => (
                                <Checkbox
                                  key={permission.id}
                                  value={permission.id}
                                  isDisabled={selectedPermissions.includes('all')}
                                >
                                  <VStack align="flex-start" spacing={1}>
                                    <HStack spacing={2}>
                                      <Text fontSize="sm" fontWeight="medium">
                                        {permission.name}
                                      </Text>
                                      <Badge
                                        colorScheme={getRiskColor(permission.risk)}
                                        size="sm"
                                        variant="outline"
                                      >
                                        {permission.risk}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="xs" color={mutedColor}>
                                      {permission.description}
                                    </Text>
                                  </VStack>
                                </Checkbox>
                              ))}
                          </SimpleGrid>
                        </CheckboxGroup>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUserEditClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={<HiSave />}
              onClick={handleSaveUserPermissions}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isRoleEditOpen} onClose={onRoleEditClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={HiShieldCheck} color={accentColor} />
              <Text>Edit Role Permissions</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRole && (
              <VStack spacing={6} align="stretch">
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>System Role</AlertTitle>
                    <AlertDescription>
                      Changes to this role will affect all users assigned to it ({selectedRole.userCount} users).
                    </AlertDescription>
                  </Box>
                </Alert>

                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {selectedRole.displayName} Role Permissions
                </Text>

                {/* Similar permission editing interface as user modal */}
                <Text fontSize="sm" color={mutedColor}>
                  Role editing interface would be implemented here...
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRoleEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" leftIcon={<HiSave />}>
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};



export default UserRolesPermissions;