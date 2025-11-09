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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
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
  useColorModeValue,
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
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ChevronDownIcon,
  ViewIcon,
  EmailIcon,
  PhoneIcon,
  CalendarIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { FaUserPlus, FaUserCog, FaFilter, FaUsers, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import axios from '../../config/axios';

const ManageUsers = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: ''
  });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2025-11-09',
      createdAt: '2025-01-15',
      phone: '+1 (555) 123-4567'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'scheduler',
      status: 'active',
      lastLogin: '2025-11-08',
      createdAt: '2025-02-20',
      phone: '+1 (555) 234-5678'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'dispatcher',
      status: 'inactive',
      lastLogin: '2025-10-15',
      createdAt: '2025-03-10',
      phone: '+1 (555) 345-6789'
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      role: 'driver',
      status: 'active',
      lastLogin: '2025-11-09',
      createdAt: '2025-04-05',
      phone: '+1 (555) 456-7890'
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await axios.get('/api/admin/users');
      // setUsers(response.data);
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsEditMode(false);
    onOpen();
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setIsEditMode(true);
    onOpen();
  };

  const handleSaveUser = async () => {
    try {
      // Replace with actual API call
      // await axios.put(`/api/admin/users/${selectedUser.id}`, editFormData);

      // Update local state
      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editFormData }
          : user
      ));

      toast({
        title: 'Success',
        description: 'User updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
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

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Flex align="center" mb={2}>
              <FaUsers size={32} color="#3182ce" style={{ marginRight: '16px' }} />
              <Heading size="xl" color="gray.800">
                Manage Users
              </Heading>
            </Flex>
            <Text color="gray.600" fontSize="lg">
              View, edit, and manage all users in the system
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {stats.map((stat, index) => (
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