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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
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
  Checkbox,
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
  WrapItem
} from '@chakra-ui/react';
import {
  SearchIcon,
  SettingsIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  UnlockIcon
} from '@chakra-ui/icons';
import { FaUserShield, FaUsers, FaKey, FaLock, FaUnlock, FaFilter, FaCog, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const UserRolesPermissions = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Mock data for demonstration
  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      status: 'active',
      permissions: ['all'],
      lastLogin: '2025-11-09T10:30:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'scheduler',
      status: 'active',
      permissions: ['view_trips', 'create_trips', 'edit_trips', 'view_reports'],
      lastLogin: '2025-11-09T09:45:00Z'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      role: 'dispatcher',
      status: 'active',
      permissions: ['view_trips', 'assign_drivers', 'view_vehicles', 'view_riders'],
      lastLogin: '2025-11-09T08:20:00Z'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      role: 'driver',
      status: 'inactive',
      permissions: ['view_assigned_trips', 'update_trip_status'],
      lastLogin: '2025-11-08T16:15:00Z'
    }
  ];

  const mockRoles = [
    {
      id: 1,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access',
      permissions: ['all'],
      userCount: 1
    },
    {
      id: 2,
      name: 'scheduler',
      displayName: 'Scheduler',
      description: 'Trip scheduling and management',
      permissions: ['view_trips', 'create_trips', 'edit_trips', 'delete_trips', 'view_reports', 'manage_recurring'],
      userCount: 1
    },
    {
      id: 3,
      name: 'dispatcher',
      displayName: 'Dispatcher',
      description: 'Real-time dispatch operations',
      permissions: ['view_trips', 'assign_drivers', 'view_vehicles', 'view_riders', 'update_trip_status', 'emergency_access'],
      userCount: 1
    },
    {
      id: 4,
      name: 'driver',
      displayName: 'Driver',
      description: 'Trip execution and updates',
      permissions: ['view_assigned_trips', 'update_trip_status', 'view_vehicle_info', 'report_issues'],
      userCount: 1
    }
  ];

  const allPermissions = [
    // Trip Management
    { id: 'view_trips', name: 'View Trips', category: 'Trip Management', description: 'View all trip information' },
    { id: 'create_trips', name: 'Create Trips', category: 'Trip Management', description: 'Create new trips' },
    { id: 'edit_trips', name: 'Edit Trips', category: 'Trip Management', description: 'Modify existing trips' },
    { id: 'delete_trips', name: 'Delete Trips', category: 'Trip Management', description: 'Remove trips from system' },
    { id: 'assign_drivers', name: 'Assign Drivers', category: 'Trip Management', description: 'Assign drivers to trips' },
    { id: 'update_trip_status', name: 'Update Trip Status', category: 'Trip Management', description: 'Change trip status' },
    { id: 'view_assigned_trips', name: 'View Assigned Trips', category: 'Trip Management', description: 'View only assigned trips' },

    // User Management
    { id: 'view_users', name: 'View Users', category: 'User Management', description: 'View user information' },
    { id: 'create_users', name: 'Create Users', category: 'User Management', description: 'Add new users' },
    { id: 'edit_users', name: 'Edit Users', category: 'User Management', description: 'Modify user information' },
    { id: 'delete_users', name: 'Delete Users', category: 'User Management', description: 'Remove users from system' },
    { id: 'manage_roles', name: 'Manage Roles', category: 'User Management', description: 'Assign and modify user roles' },

    // Vehicle Management
    { id: 'view_vehicles', name: 'View Vehicles', category: 'Vehicle Management', description: 'View vehicle information' },
    { id: 'create_vehicles', name: 'Create Vehicles', category: 'Vehicle Management', description: 'Add new vehicles' },
    { id: 'edit_vehicles', name: 'Edit Vehicles', category: 'Vehicle Management', description: 'Modify vehicle information' },
    { id: 'delete_vehicles', name: 'Delete Vehicles', category: 'Vehicle Management', description: 'Remove vehicles from system' },
    { id: 'view_vehicle_info', name: 'View Vehicle Info', category: 'Vehicle Management', description: 'View assigned vehicle details' },

    // Rider Management
    { id: 'view_riders', name: 'View Riders', category: 'Rider Management', description: 'View rider information' },
    { id: 'create_riders', name: 'Create Riders', category: 'Rider Management', description: 'Add new riders' },
    { id: 'edit_riders', name: 'Edit Riders', category: 'Rider Management', description: 'Modify rider information' },
    { id: 'delete_riders', name: 'Delete Riders', category: 'Rider Management', description: 'Remove riders from system' },

    // Reports & Analytics
    { id: 'view_reports', name: 'View Reports', category: 'Reports & Analytics', description: 'Access system reports' },
    { id: 'generate_reports', name: 'Generate Reports', category: 'Reports & Analytics', description: 'Create custom reports' },
    { id: 'export_data', name: 'Export Data', category: 'Reports & Analytics', description: 'Export system data' },

    // System Administration
    { id: 'system_settings', name: 'System Settings', category: 'System Administration', description: 'Modify system settings' },
    { id: 'security_settings', name: 'Security Settings', category: 'System Administration', description: 'Manage security policies' },
    { id: 'audit_logs', name: 'Audit Logs', category: 'System Administration', description: 'View system audit logs' },
    { id: 'manage_recurring', name: 'Manage Recurring Trips', category: 'System Administration', description: 'Create and manage recurring trips' },
    { id: 'emergency_access', name: 'Emergency Access', category: 'System Administration', description: 'Access during emergencies' },
    { id: 'report_issues', name: 'Report Issues', category: 'System Administration', description: 'Report system issues' }
  ];

  const permissionCategories = [...new Set(allPermissions.map(p => p.category))];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Replace with actual API calls
      setTimeout(() => {
        setUsers(mockUsers);
        setRoles(mockRoles);
        setPermissions(allPermissions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user roles and permissions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setIsEditMode(true);
    onOpen();
  };

  const handleSavePermissions = async () => {
    try {
      // Update user permissions
      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, permissions: selectedPermissions }
          : user
      ));

      toast({
        title: 'Success',
        description: 'User permissions updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user permissions',
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

  const hasPermission = (userPermissions, permission) => {
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Container maxW="7xl" py={8}>
          <Flex align="center" justify="center" minHeight="60vh">
            <VStack spacing={4}>
              <FaUserShield size={48} color="#3182ce" />
              <Text fontSize="lg">Loading user roles and permissions...</Text>
            </VStack>
          </Flex>
        </Container>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box
            bg={useColorModeValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)')}
            borderRadius="xl"
            p={8}
            textAlign="center"
            color="white"
            boxShadow="2xl"
          >
            <VStack spacing={4}>
              <FaUserShield size={48} />
              <Heading size="2xl" fontWeight="bold">
                User Roles & Permissions
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Manage user access control, roles, and permissions across the system
              </Text>
            </VStack>
          </Box>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg} shadow="lg" borderRadius="lg" _hover={{ shadow: 'xl' }} transition="all 0.3s">
              <CardBody textAlign="center" py={6}>
                <Icon as={FaUsers} boxSize={8} color="blue.500" mb={3} />
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Total Users</StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="blue.600">{users.length}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} shadow="lg" borderRadius="lg" _hover={{ shadow: 'xl' }} transition="all 0.3s">
              <CardBody textAlign="center" py={6}>
                <Icon as={FaUserShield} boxSize={8} color="green.500" mb={3} />
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Active Roles</StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="green.600">{roles.length}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} shadow="lg" borderRadius="lg" _hover={{ shadow: 'xl' }} transition="all 0.3s">
              <CardBody textAlign="center" py={6}>
                <Icon as={FaKey} boxSize={8} color="purple.500" mb={3} />
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Total Permissions</StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600">{permissions.length}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} shadow="lg" borderRadius="lg" _hover={{ shadow: 'xl' }} transition="all 0.3s">
              <CardBody textAlign="center" py={6}>
                <Icon as={FaLock} boxSize={8} color="red.500" mb={3} />
                <Stat>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Restricted Access</StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="red.600">
                    {users.filter(u => u.status === 'inactive').length}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content Tabs */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab fontWeight="semibold">User Permissions</Tab>
              <Tab fontWeight="semibold">Role Management</Tab>
              <Tab fontWeight="semibold">Permission Matrix</Tab>
            </TabList>

            <TabPanels>
              {/* User Permissions Tab */}
              <TabPanel>
                <Card bg={cardBg} shadow="lg" borderRadius="lg">
                  <CardHeader>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                      <Box>
                        <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
                          User Permissions Management
                        </Heading>
                        <Text color="gray.600" mt={1}>
                          Control individual user access to system features
                        </Text>
                      </Box>
                      <Button leftIcon={<AddIcon />} colorScheme="blue" variant="outline">
                        Add User
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {/* Filters */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>

                      <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="all">All Roles</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.name}>{role.displayName}</option>
                        ))}
                      </Select>

                      <Button leftIcon={<FaFilter />} colorScheme="gray" variant="outline">
                        Advanced Filters
                      </Button>
                    </SimpleGrid>

                    {/* Users Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>User</Th>
                            <Th>Role</Th>
                            <Th>Status</Th>
                            <Th>Permissions Count</Th>
                            <Th>Last Login</Th>
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
                                    <Text fontWeight="semibold">{user.name}</Text>
                                    <Text fontSize="sm" color="gray.600">{user.email}</Text>
                                  </Box>
                                </Flex>
                              </Td>
                              <Td>
                                <Badge colorScheme={getRoleBadgeColor(user.role)}>
                                  {user.role}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusBadgeColor(user.status)}>
                                  {user.status}
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontWeight="semibold">
                                  {user.permissions.includes('all') ? 'All' : user.permissions.length}
                                </Text>
                              </Td>
                              <Td fontSize="sm">
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<ChevronDownIcon />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem icon={<ViewIcon />} onClick={() => handleEditPermissions(user)}>
                                      Manage Permissions
                                    </MenuItem>
                                    <MenuItem icon={<EditIcon />}>
                                      Edit User
                                    </MenuItem>
                                    <MenuItem icon={<DeleteIcon />} color="red.500">
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
                      <Flex align="center" justify="center" py={8}>
                        <VStack spacing={4}>
                          <FaUsers size={48} color="#a0aec0" />
                          <Text color="gray.500">No users found matching your criteria</Text>
                        </VStack>
                      </Flex>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* Role Management Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {roles.map((role) => (
                    <Card key={role.id} bg={cardBg} shadow="lg" borderRadius="lg">
                      <CardHeader>
                        <Flex align="center" justify="space-between">
                          <Box>
                            <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                              {role.displayName}
                            </Heading>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {role.description}
                            </Text>
                          </Box>
                          <Badge colorScheme={getRoleBadgeColor(role.name)} fontSize="sm" px={3} py={1}>
                            {role.userCount} users
                          </Badge>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Box>
                          <Text fontWeight="semibold" mb={3}>Permissions:</Text>
                          <Wrap spacing={2}>
                            {role.permissions.map((permissionId) => {
                              const permission = permissions.find(p => p.id === permissionId);
                              return permission ? (
                                <WrapItem key={permissionId}>
                                  <Tag size="sm" colorScheme="blue" borderRadius="full">
                                    <TagLabel>{permission.name}</TagLabel>
                                  </Tag>
                                </WrapItem>
                              ) : null;
                            })}
                          </Wrap>
                        </Box>
                        <Flex justify="flex-end" mt={4}>
                          <Button size="sm" leftIcon={<EditIcon />} colorScheme="blue" variant="outline">
                            Edit Role
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Permission Matrix Tab */}
              <TabPanel>
                <Card bg={cardBg} shadow="lg" borderRadius="lg">
                  <CardHeader>
                    <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
                      Permission Matrix
                    </Heading>
                    <Text color="gray.600" mt={2}>
                      Overview of permissions across different system features
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {permissionCategories.map((category) => (
                        <Box key={category}>
                          <Heading size="md" color={useColorModeValue('gray.800', 'white')} mb={4}>
                            {category}
                          </Heading>
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                            {permissions
                              .filter(p => p.category === category)
                              .map((permission) => (
                                <Card key={permission.id} size="sm" border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
                                  <CardBody py={3}>
                                    <Flex align="center" justify="space-between">
                                      <Box flex="1">
                                        <Text fontWeight="semibold" fontSize="sm">
                                          {permission.name}
                                        </Text>
                                        <Text fontSize="xs" color="gray.600" mt={1}>
                                          {permission.description}
                                        </Text>
                                      </Box>
                                      <Icon
                                        as={FaCheckCircle}
                                        color="green.500"
                                        boxSize={5}
                                      />
                                    </Flex>
                                  </CardBody>
                                </Card>
                              ))}
                          </SimpleGrid>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Permission Edit Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                Manage Permissions - {selectedUser?.name}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedUser && (
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" mb={4}>Current Role: {selectedUser.role}</Text>
                      <Text fontSize="sm" color="gray.600">
                        Users with this role automatically inherit certain permissions.
                        You can grant additional permissions below.
                      </Text>
                    </Box>

                    <Divider />

                    {permissionCategories.map((category) => (
                      <Box key={category}>
                        <Heading size="md" color={useColorModeValue('gray.800', 'white')} mb={4}>
                          {category}
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          {permissions
                            .filter(p => p.category === category)
                            .map((permission) => (
                              <FormControl key={permission.id}>
                                <Checkbox
                                  isChecked={hasPermission(selectedPermissions, permission.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPermissions([...selectedPermissions, permission.id]);
                                    } else {
                                      setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                                    }
                                  }}
                                >
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="semibold" fontSize="sm">
                                      {permission.name}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      {permission.description}
                                    </Text>
                                  </VStack>
                                </Checkbox>
                              </FormControl>
                            ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </VStack>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSavePermissions}>
                  Save Permissions
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </Box>
  );
};

export default UserRolesPermissions;