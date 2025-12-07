import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Center,
  Card,
  CardBody,
  useColorModeValue
} from '@chakra-ui/react';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';
import { FaUserCog, FaEdit } from 'react-icons/fa';

const ManageUserRoles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [updating, setUpdating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const availableRoles = [
    { value: 'admin', label: 'Admin', color: 'red', description: 'Full system access' },
    { value: 'dispatcher', label: 'Dispatcher', color: 'purple', description: 'Trip assignment & monitoring' },
    { value: 'scheduler', label: 'Scheduler', color: 'blue', description: 'Trip scheduling & calendar' },
    { value: 'driver', label: 'Driver', color: 'green', description: 'Execute trips' },
    { value: 'rider', label: 'Rider', color: 'orange', description: 'Request trips' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.filter(user => user.role !== 'rider')); // Focus on staff
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditRoles = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || [user.role]);
    onOpen();
  };

  const handleUpdateRoles = async () => {
    if (selectedRoles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one role',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUpdating(true);
      await axios.patch(`/api/users/${selectedUser._id}/roles`, {
        roles: selectedRoles
      });

      toast({
        title: 'Success',
        description: `Roles updated for ${selectedUser.firstName} ${selectedUser.lastName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await fetchUsers();
      onClose();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update roles',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadges = (userRoles) => {
    const roles = userRoles || [];
    return roles.map(role => {
      const roleConfig = availableRoles.find(r => r.value === role);
      return (
        <Badge 
          key={role} 
          colorScheme={roleConfig?.color || 'gray'}
          mr={1}
          mb={1}
        >
          {roleConfig?.label || role}
        </Badge>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Center flex="1">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box flex="1" p={8}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={6}>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="xl" display="flex" alignItems="center" gap={2}>
                  <FaUserCog />
                  Manage User Roles
                </Heading>
                <Text color="gray.600">
                  Assign multiple roles to users for flexible access control
                </Text>
              </VStack>
            </HStack>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                <strong>Multi-Role Support:</strong> Admins, Dispatchers, and Schedulers can also be assigned the Driver role 
                to execute trips while maintaining their administrative permissions.
              </AlertDescription>
            </Alert>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Primary Role</Th>
                        <Th>All Roles</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.map((user) => (
                        <Tr key={user._id}>
                          <Td fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Td>
                          <Td>{user.email}</Td>
                          <Td>
                            <Badge colorScheme={availableRoles.find(r => r.value === user.role)?.color || 'gray'}>
                              {user.role}
                            </Badge>
                          </Td>
                          <Td>
                            {getRoleBadges(user.roles)}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              leftIcon={<FaEdit />}
                              onClick={() => handleEditRoles(user)}
                              colorScheme="blue"
                              variant="ghost"
                            >
                              Edit Roles
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* Edit Roles Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit Roles for {selectedUser?.firstName} {selectedUser?.lastName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Select all roles that apply to this user. The first selected role will be their primary role.
              </Text>
              
              <CheckboxGroup value={selectedRoles} onChange={setSelectedRoles}>
                <Stack spacing={3}>
                  {availableRoles.map((role) => (
                    <Box 
                      key={role.value} 
                      p={3} 
                      borderWidth="1px" 
                      borderRadius="md"
                      _hover={{ bg: 'gray.50' }}
                    >
                      <Checkbox value={role.value} colorScheme={role.color}>
                        <VStack align="start" spacing={0} ml={2}>
                          <Text fontWeight="medium">{role.label}</Text>
                          <Text fontSize="sm" color="gray.600">{role.description}</Text>
                        </VStack>
                      </Checkbox>
                    </Box>
                  ))}
                </Stack>
              </CheckboxGroup>

              {selectedRoles.length > 1 && selectedRoles.includes('driver') && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    This user will have driver capabilities while retaining their {selectedRoles.filter(r => r !== 'driver').join(', ')} permissions.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUpdateRoles}
              isLoading={updating}
              isDisabled={selectedRoles.length === 0}
            >
              Update Roles
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageUserRoles;
