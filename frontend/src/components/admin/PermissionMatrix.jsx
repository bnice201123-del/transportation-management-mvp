/**
 * Permission Matrix Component
 * 
 * Admin interface for managing role-based access control (RBAC) permissions.
 * Features:
 * - Visual permission matrix (roles x resources)
 * - Bulk permission updates
 * - Role cloning
 * - Permission initialization and reset
 * - Statistics and monitoring
 */

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Checkbox,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Tooltip,
  IconButton,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Wrap,
  WrapItem,
  Code
} from '@chakra-ui/react';
import {
  FaShieldAlt,
  FaSync,
  FaClone,
  FaSave,
  FaUndo,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const PermissionMatrix = () => {
  const [matrix, setMatrix] = useState({});
  const [categories, setCategories] = useState({});
  const [resources, setResources] = useState({});
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState('');
  const [cloneSource, setCloneSource] = useState('');
  const [cloneTarget, setCloneTarget] = useState('');
  
  const toast = useToast();
  const { isOpen: isCloneOpen, onOpen: onCloneOpen, onClose: onCloneClose } = useDisclosure();
  const { isOpen: isInitOpen, onOpen: onInitOpen, onClose: onInitClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();

  useEffect(() => {
    fetchMatrix();
    fetchResources();
    fetchStats();
  }, []);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchMatrix = async () => {
    try {
      const response = await axios.get(`${API_URL}/permissions/matrix`, getAuthHeader());
      setMatrix(response.data.matrix);
      setCategories(response.data.categories);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error fetching permission matrix:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch permission matrix',
        status: 'error',
        duration: 5000
      });
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API_URL}/permissions/resources`, getAuthHeader());
      setResources(response.data.resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/permissions/stats`, getAuthHeader());
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePermissionChange = (role, resource, action, granted) => {
    const key = `${role}:${resource}:${action}`;
    setChanges(prev => ({
      ...prev,
      [key]: { role, resource, action, granted }
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const permissionsArray = Object.values(changes);
      
      const response = await axios.post(
        `${API_URL}/permissions/bulk`,
        { permissions: permissionsArray },
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000
      });
      
      setChanges({});
      setHasChanges(false);
      await fetchMatrix();
      await fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save changes',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    setChanges({});
    setHasChanges(false);
    toast({
      title: 'Changes Discarded',
      description: 'All unsaved changes have been discarded',
      status: 'info',
      duration: 3000
    });
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/permissions/initialize`,
        {},
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000
      });
      
      onInitClose();
      await fetchMatrix();
      await fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initialize permissions',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    if (!cloneSource || !cloneTarget) {
      toast({
        title: 'Error',
        description: 'Please select both source and target roles',
        status: 'error',
        duration: 3000
      });
      return;
    }
    
    if (cloneSource === cloneTarget) {
      toast({
        title: 'Error',
        description: 'Source and target roles must be different',
        status: 'error',
        duration: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/permissions/clone`,
        { sourceRole: cloneSource, targetRole: cloneTarget },
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000
      });
      
      onCloneClose();
      setCloneSource('');
      setCloneTarget('');
      await fetchMatrix();
      await fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to clone permissions',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role to reset',
        status: 'error',
        duration: 3000
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/permissions/reset/${selectedRole}`,
        {},
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000
      });
      
      onResetClose();
      setSelectedRole('');
      await fetchMatrix();
      await fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset permissions',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role, resource, action) => {
    const key = `${role}:${resource}:${action}`;
    if (changes[key] !== undefined) {
      return changes[key].granted;
    }
    return matrix[role]?.[resource]?.includes(action) || false;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'red',
      dispatcher: 'blue',
      scheduler: 'purple',
      driver: 'green',
      rider: 'orange'
    };
    return colors[role] || 'gray';
  };

  return (
    <Box>
      {hasChanges && (
        <Alert status="warning" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have {Object.keys(changes).length} unsaved permission changes.
            </AlertDescription>
          </Box>
          <HStack>
            <Button size="sm" onClick={handleDiscardChanges} variant="ghost">
              Discard
            </Button>
            <Button size="sm" colorScheme="blue" onClick={handleSaveChanges} isLoading={loading}>
              Save Changes
            </Button>
          </HStack>
        </Alert>
      )}

      <Tabs colorScheme="blue">
        <TabList>
          <Tab><HStack><FaShieldAlt /><Text>Permission Matrix</Text></HStack></Tab>
          <Tab><HStack><FaInfoCircle /><Text>Statistics</Text></HStack></Tab>
          <Tab><HStack><FaCog /><Text>Management</Text></HStack></Tab>
        </TabList>

        <TabPanels>
          {/* Permission Matrix Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Role Permission Matrix</Heading>
                <HStack>
                  <Button
                    leftIcon={<FaSync />}
                    size="sm"
                    onClick={fetchMatrix}
                    isDisabled={loading}
                  >
                    Refresh
                  </Button>
                  {hasChanges && (
                    <>
                      <Button
                        leftIcon={<FaUndo />}
                        size="sm"
                        variant="ghost"
                        onClick={handleDiscardChanges}
                      >
                        Discard
                      </Button>
                      <Button
                        leftIcon={<FaSave />}
                        size="sm"
                        colorScheme="blue"
                        onClick={handleSaveChanges}
                        isLoading={loading}
                      >
                        Save Changes
                      </Button>
                    </>
                  )}
                </HStack>
              </HStack>

              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Toggle permissions for each role. Click the checkboxes to grant or revoke access.
                  Remember to save your changes when done.
                </Text>
              </Alert>

              <Accordion allowMultiple defaultIndex={[0]}>
                {Object.entries(categories).map(([category, categoryResources]) => (
                  <AccordionItem key={category}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        {category}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Resource</Th>
                              <Th>Action</Th>
                              {roles.map(role => (
                                <Th key={role} textAlign="center">
                                  <Badge colorScheme={getRoleBadgeColor(role)}>
                                    {role.toUpperCase()}
                                  </Badge>
                                </Th>
                              ))}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {categoryResources.map(resource => {
                              const actions = resources[resource] || [];
                              return actions.map((action, idx) => (
                                <Tr key={`${resource}-${action}`}>
                                  {idx === 0 && (
                                    <Td rowSpan={actions.length} fontWeight="bold">
                                      {resource}
                                    </Td>
                                  )}
                                  <Td>{action}</Td>
                                  {roles.map(role => (
                                    <Td key={role} textAlign="center">
                                      <Tooltip label={`${role} can ${action} ${resource}`}>
                                        <Checkbox
                                          isChecked={hasPermission(role, resource, action)}
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              role,
                                              resource,
                                              action,
                                              e.target.checked
                                            )
                                          }
                                          colorScheme={getRoleBadgeColor(role)}
                                        />
                                      </Tooltip>
                                    </Td>
                                  ))}
                                </Tr>
                              ));
                            })}
                          </Tbody>
                        </Table>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </TabPanel>

          {/* Statistics Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Permission Statistics</Heading>

              {stats && (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Permissions</StatLabel>
                          <StatNumber>{stats.total}</StatNumber>
                          <StatHelpText>All defined permissions</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Granted</StatLabel>
                          <StatNumber color="green.500">{stats.granted}</StatNumber>
                          <StatHelpText>Active permissions</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>System</StatLabel>
                          <StatNumber>{stats.system}</StatNumber>
                          <StatHelpText>Default permissions</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Custom</StatLabel>
                          <StatNumber>{stats.custom}</StatNumber>
                          <StatHelpText>User-defined permissions</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Permissions by Role</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {Object.entries(stats.byRole || {}).map(([role, count]) => (
                          <Box key={role} p={4} borderWidth="1px" borderRadius="md">
                            <HStack justify="space-between">
                              <Badge colorScheme={getRoleBadgeColor(role)} fontSize="md">
                                {role.toUpperCase()}
                              </Badge>
                              <Text fontWeight="bold" fontSize="2xl">{count}</Text>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </>
              )}
            </VStack>
          </TabPanel>

          {/* Management Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Permission Management</Heading>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Initialize Default Permissions</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Create default system permissions for all roles. This is useful for initial setup
                      or if permissions were accidentally deleted.
                    </Text>
                    <Button
                      leftIcon={<FaShieldAlt />}
                      colorScheme="blue"
                      onClick={onInitOpen}
                      isDisabled={loading}
                    >
                      Initialize Permissions
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Clone Role Permissions</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Copy all permissions from one role to another. This is useful for creating
                      custom roles based on existing ones.
                    </Text>
                    <Button
                      leftIcon={<FaClone />}
                      colorScheme="purple"
                      onClick={onCloneOpen}
                      isDisabled={loading}
                    >
                      Clone Permissions
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Reset Role to Defaults</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Reset a role's permissions back to system defaults. This will delete all custom
                      permissions for the selected role.
                    </Text>
                    <Alert status="warning" fontSize="sm">
                      <AlertIcon />
                      This action cannot be undone!
                    </Alert>
                    <Button
                      leftIcon={<FaUndo />}
                      colorScheme="orange"
                      onClick={onResetOpen}
                      isDisabled={loading}
                    >
                      Reset Role
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Role Descriptions</Heading>
                    <Divider />
                    <Box>
                      <Badge colorScheme="red" mb={2}>ADMIN</Badge>
                      <Text fontSize="sm">Full system access. Can manage all resources and settings.</Text>
                    </Box>
                    <Box>
                      <Badge colorScheme="blue" mb={2}>DISPATCHER</Badge>
                      <Text fontSize="sm">Manage trips and assign drivers. Can view riders and vehicles.</Text>
                    </Box>
                    <Box>
                      <Badge colorScheme="purple" mb={2}>SCHEDULER</Badge>
                      <Text fontSize="sm">Create and manage trips and recurring schedules.</Text>
                    </Box>
                    <Box>
                      <Badge colorScheme="green" mb={2}>DRIVER</Badge>
                      <Text fontSize="sm">View assigned trips and update status. Limited access.</Text>
                    </Box>
                    <Box>
                      <Badge colorScheme="orange" mb={2}>RIDER</Badge>
                      <Text fontSize="sm">View own trips and notifications only.</Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Initialize Modal */}
      <Modal isOpen={isInitOpen} onClose={onInitClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Initialize Default Permissions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertDescription>
                    This will create default system permissions for all roles. Existing permissions
                    will not be affected.
                  </AlertDescription>
                </Box>
              </Alert>
              <Text>Are you sure you want to initialize default permissions?</Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onInitClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleInitialize} isLoading={loading}>
              Initialize
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Clone Modal */}
      <Modal isOpen={isCloneOpen} onClose={onCloneClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Clone Role Permissions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Source Role</FormLabel>
                <Select
                  placeholder="Select role to copy from"
                  value={cloneSource}
                  onChange={(e) => setCloneSource(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.toUpperCase()}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Target Role</FormLabel>
                <Select
                  placeholder="Select role to copy to"
                  value={cloneTarget}
                  onChange={(e) => setCloneTarget(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.toUpperCase()}</option>
                  ))}
                </Select>
              </FormControl>

              <Alert status="warning" fontSize="sm">
                <AlertIcon />
                This will copy all permissions from {cloneSource || 'source'} to {cloneTarget || 'target'}.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloneClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleClone} isLoading={loading}>
              Clone
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Modal */}
      <Modal isOpen={isResetOpen} onClose={onResetClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Role Permissions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Select Role to Reset</FormLabel>
                <Select
                  placeholder="Select role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.toUpperCase()}</option>
                  ))}
                </Select>
              </FormControl>

              <Alert status="error" fontSize="sm">
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning!</AlertTitle>
                  <AlertDescription>
                    This will delete ALL permissions for {selectedRole || 'the selected role'} and
                    restore defaults. This action cannot be undone!
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onResetClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleReset} isLoading={loading}>
              Reset Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PermissionMatrix;
