import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useColorModeValue,
  useBreakpointValue,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  Spinner,
  Center,
  Flex,
  Wrap,
  WrapItem,
  ButtonGroup,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Checkbox,
  Switch,
  Tooltip,
  Progress,
  Divider
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  SettingsIcon,
  CheckIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import {
  HiUsers,
  HiUserAdd,
  HiCheckCircle,
  HiXCircle,
  HiChartBar,
  HiHome,
  HiSearch,
  HiFilter,
  HiViewList,
  HiViewGrid,
  HiDownload,
  HiTrash,
  HiPencil,
  HiEye,
  HiMail,
  HiPhone,
  HiLocationMarker,
  HiCalendar,
  HiClock,
  HiStar,
  HiRefresh
} from 'react-icons/hi';
import Navbar from '../shared/Navbar';

const ManageUsers = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Enhanced modal management
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Enhanced state management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [viewMode, setViewMode] = useState('table');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Enhanced form data
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    department: '',
    employeeId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const containerMaxW = useBreakpointValue({ base: 'full', md: 'full' });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const statIconBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  // Enhanced mock data
  const mockUsers = useMemo(() => [
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
      avatar: null
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
      avatar: null
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
      avatar: null
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
      avatar: null
    }
  ], []);

  // Enhanced data fetching
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [mockUsers, toast]);

  // Enhanced filtering
  const filterUsers = useCallback(() => {
    let filtered = [...users];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchTerm) ||
        user.employeeId.toLowerCase().includes(searchLower)
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
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortDirection]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  // Utility functions
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
        default:
          break;
      }
      
      setSelectedUsers(new Set());
    } catch (error) {
      console.error(error);
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

  const handleViewUser = (user) => {
    setSelectedUser(user);
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
      employeeId: user.employeeId
    });
    setFormErrors({});
    onEditOpen();
  };

  const handleSaveUser = async () => {
    const errors = validateUserForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const updatedUser = {
        ...selectedUser,
        ...editFormData,
        name: `${editFormData.firstName} ${editFormData.lastName}`
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
      setFormErrors({});
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error updating user',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'scheduler': return 'blue';
      case 'dispatcher': return 'green';
      case 'driver': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'green' : 'red';
  };

  // Stats calculations
  const stats = useMemo(() => [
    {
      label: 'Total Users',
      value: users.length,
      icon: HiUsers,
      color: 'blue.500'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'active').length,
      icon: HiCheckCircle,
      color: 'green.500'
    },
    {
      label: 'Inactive Users',
      value: users.filter(u => u.status === 'inactive').length,
      icon: HiXCircle,
      color: 'red.500'
    },
    {
      label: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      icon: HiStar,
      color: 'purple.500'
    }
  ], [users]);

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

  return (
    <Box minHeight="100vh" bg={bgColor} pb={8}>
      <Navbar />
      
      {/* Back to Admin Button - Desktop Only */}
      <Container maxW={containerMaxW} pt={4}>
        <Flex mb={2} justifyContent="flex-start" display={{ base: 'none', lg: 'flex' }}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            colorScheme="blue"
          >
            Back to Admin Dashboard
          </Button>
        </Flex>
      </Container>

      {/* Enhanced Header */}
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

              <Button
                leftIcon={<HiUserAdd />}
                colorScheme="blue"
                size={{ base: 'md', md: 'lg' }}
                onClick={() => navigate('/admin/register')}
                width={{ base: 'full', sm: 'auto' }}
              >
                Add New User
              </Button>
            </Flex>
          </Box>
        </VStack>
      </Container>

      <Container maxW={containerMaxW} px={6}>
        <VStack spacing={8} align="stretch">
          {/* Stats Dashboard */}
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
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
                            bg={statIconBg}
                          >
                            <Icon
                              as={stat.icon}
                              boxSize={6}
                              color={stat.color}
                            />
                          </Box>
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

          {/* Search and Filters */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                {/* Search Bar */}
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                  align={{ base: 'stretch', md: 'center' }}
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
                        bg={inputBg}
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
                  {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                    <WrapItem>
                      <Button
                        leftIcon={<CloseIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        }}
                      >
                        Clear All
                      </Button>
                    </WrapItem>
                  )}
                </Wrap>

                {/* Results Info and Bulk Actions */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {filteredUsers.length} of {users.length} users
                  </Text>

                  {selectedUsers.size > 0 && (
                    <HStack spacing={2}>
                      <Text fontSize="sm" color={accentColor} fontWeight="medium">
                        {selectedUsers.size} selected
                      </Text>
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
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<HiXCircle />}
                        onClick={() => handleBulkAction('deactivate')}
                        isLoading={bulkActionLoading}
                      >
                        Deactivate
                      </Button>
                    </HStack>
                  )}
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          {/* Users Table */}
          <Card bg={cardBg} shadow="md" borderRadius="lg">
            <CardBody p={0}>
              <Box overflowX="auto">
                <Table variant="simple" size={tableSize}>
                  <Thead bg={tableHeaderBg}>
                    <Tr>
                      <Th>
                        <Checkbox
                          isChecked={selectedUsers.size === filteredUsers.length}
                          isIndeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                          onChange={() => {
                            if (selectedUsers.size === filteredUsers.length) {
                              setSelectedUsers(new Set());
                            } else {
                              setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
                            }
                          }}
                        />
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('name')}>
                        User {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('role')}>
                        Role {sortField === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th cursor="pointer" onClick={() => handleSort('status')}>
                        Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Th>
                      <Th>Last Login</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id} _hover={{ bg: hoverBg }}>
                        <Td>
                          <Checkbox
                            isChecked={selectedUsers.has(user.id)}
                            onChange={() => {
                              const newSelection = new Set(selectedUsers);
                              if (newSelection.has(user.id)) {
                                newSelection.delete(user.id);
                              } else {
                                newSelection.add(user.id);
                              }
                              setSelectedUsers(newSelection);
                            }}
                          />
                        </Td>
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
                          <Badge colorScheme={getRoleBadgeColor(user.role)} variant="subtle">
                            {user.role}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusBadgeColor(user.status)} variant="subtle">
                            {user.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color={mutedColor}>
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Tooltip label="View Details">
                              <IconButton
                                aria-label="View user"
                                icon={<HiEye />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewUser(user)}
                              />
                            </Tooltip>
                            <Tooltip label="Edit User">
                              <IconButton
                                aria-label="Edit user"
                                icon={<HiPencil />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUser(user)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* View User Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Avatar size="lg" name={selectedUser.name} />
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xl" fontWeight="bold">
                      {selectedUser.name}
                    </Text>
                    <Text color={mutedColor}>
                      {selectedUser.email}
                    </Text>
                    <Badge colorScheme={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </VStack>
                </HStack>
                <Divider />
                <SimpleGrid columns={2} spacing={4}>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Phone</Text>
                    <Text fontSize="sm">{selectedUser.phone}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Employee ID</Text>
                    <Text fontSize="sm">{selectedUser.employeeId}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Department</Text>
                    <Text fontSize="sm">{selectedUser.department}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Start Date</Text>
                    <Text fontSize="sm">{new Date(selectedUser.startDate).toLocaleDateString()}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Last Login</Text>
                    <Text fontSize="sm">{new Date(selectedUser.lastLogin).toLocaleString()}</Text>
                  </VStack>
                  <VStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold">Status</Text>
                    <Badge colorScheme={getStatusBadgeColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </VStack>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onViewClose}>
              Close
            </Button>
            <Button colorScheme="blue" ml={3} onClick={() => {
              onViewClose();
              handleEditUser(selectedUser);
            }}>
              Edit User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="full">
                <FormControl isInvalid={formErrors.firstName}>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                  />
                  <FormErrorMessage>{formErrors.firstName}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={formErrors.lastName}>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                  />
                  <FormErrorMessage>{formErrors.lastName}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={formErrors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                />
                <FormErrorMessage>{formErrors.email}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={formErrors.phone}>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                />
                <FormErrorMessage>{formErrors.phone}</FormErrorMessage>
              </FormControl>
              <HStack spacing={4} width="full">
                <FormControl isInvalid={formErrors.role}>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="driver">Driver</option>
                  </Select>
                  <FormErrorMessage>{formErrors.role}</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" ml={3} onClick={handleSaveUser}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageUsers;