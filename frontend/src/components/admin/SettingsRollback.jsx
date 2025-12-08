import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Spinner,
  Center,
  useColorModeValue,
  Tooltip,
  Code
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, ArrowBackIcon, TimeIcon } from '@chakra-ui/icons';
import { FaHistory, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const SettingsRollback = ({ currentSettings, onRollback }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const latestRowBg = useColorModeValue('blue.50', 'blue.900');

  const saveCurrentVersion = useCallback(() => {
    try {
      // Get existing versions from localStorage
      const existingVersions = JSON.parse(localStorage.getItem('settingsVersions') || '[]');
      
      // Create new version
      const newVersion = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        settings: currentSettings,
        user: 'admin',
        description: 'Auto-saved version'
      };

      // Keep only last 10 versions
      const updatedVersions = [newVersion, ...existingVersions.slice(0, 9)];
      
      // Save to localStorage
      localStorage.setItem('settingsVersions', JSON.stringify(updatedVersions));
      
      // Try to save to backend
      axios.post('/api/admin/settings/versions', newVersion).catch(err => {
        console.error('Failed to save version to backend:', err);
      });
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }, [currentSettings]);

  useEffect(() => {
    fetchVersionHistory();
    // Auto-save current version
    saveCurrentVersion();
  }, [saveCurrentVersion]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/settings/versions');
      if (response.data) {
        setVersions(response.data);
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
      // Load from localStorage as fallback
      const saved = localStorage.getItem('settingsVersions');
      if (saved) {
        setVersions(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    onOpen();
  };

  const calculateDiff = () => {
    if (!selectedVersion) return [];

    const changes = [];
    const oldSettings = selectedVersion.settings;

    // Compare each category
    Object.keys(currentSettings).forEach(category => {
      if (!oldSettings[category]) return;

      Object.keys(currentSettings[category]).forEach(key => {
        const currentValue = currentSettings[category][key];
        const oldValue = oldSettings[category][key];

        if (JSON.stringify(currentValue) !== JSON.stringify(oldValue)) {
          changes.push({
            category,
            key,
            currentValue,
            oldValue,
            type: oldValue === undefined ? 'added' : currentValue === undefined ? 'removed' : 'modified'
          });
        }
      });

      // Check for removed keys
      Object.keys(oldSettings[category]).forEach(key => {
        if (currentSettings[category][key] === undefined) {
          changes.push({
            category,
            key,
            currentValue: undefined,
            oldValue: oldSettings[category][key],
            type: 'removed'
          });
        }
      });
    });

    return changes;
  };

  const handleRollback = async () => {
    if (!selectedVersion) return;

    setRollbackLoading(true);
    try {
      // Apply the old settings
      onRollback(selectedVersion.settings);

      // Log the rollback action
      await axios.post('/api/admin/settings/rollback', {
        versionId: selectedVersion.id,
        timestamp: new Date().toISOString(),
        user: 'admin'
      }).catch(err => console.error('Failed to log rollback:', err));

      // Save this as a new version
      saveCurrentVersion();

      toast({
        title: 'Settings Rolled Back',
        description: `Successfully restored settings from ${new Date(selectedVersion.timestamp).toLocaleString()}`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onClose();
      setSelectedVersion(null);
      
      // Refresh version history
      fetchVersionHistory();
    } catch (error) {
      console.error('Error during rollback:', error);
      toast({
        title: 'Rollback Failed',
        description: 'Failed to restore previous settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setRollbackLoading(false);
    }
  };

  const createManualSnapshot = () => {
    try {
      const existingVersions = JSON.parse(localStorage.getItem('settingsVersions') || '[]');
      
      const newVersion = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        settings: currentSettings,
        user: 'admin',
        description: 'Manual snapshot'
      };

      const updatedVersions = [newVersion, ...existingVersions.slice(0, 9)];
      localStorage.setItem('settingsVersions', JSON.stringify(updatedVersions));
      setVersions(updatedVersions);

      // Save to backend
      axios.post('/api/admin/settings/versions', newVersion).catch(err => {
        console.error('Failed to save version to backend:', err);
      });

      toast({
        title: 'Snapshot Created',
        description: 'Current settings have been saved as a new version',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error creating snapshot:', error);
      toast({
        title: 'Snapshot Failed',
        description: 'Failed to create snapshot. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const deleteVersion = async (versionId) => {
    try {
      const updatedVersions = versions.filter(v => v.id !== versionId);
      setVersions(updatedVersions);
      localStorage.setItem('settingsVersions', JSON.stringify(updatedVersions));

      // Delete from backend
      await axios.delete(`/api/admin/settings/versions/${versionId}`).catch(err => {
        console.error('Failed to delete version from backend:', err);
      });

      toast({
        title: 'Version Deleted',
        description: 'Version has been removed from history',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete version. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'added':
        return 'green';
      case 'removed':
        return 'red';
      case 'modified':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatValue = (value) => {
    if (value === undefined) return '(not set)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const changes = selectedVersion ? calculateDiff() : [];

  if (loading) {
    return (
      <Center p={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading version history...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" mb={2}>
            <VStack align="start" spacing={0}>
              <Heading size="md">Settings Version History</Heading>
              <Text fontSize="sm" color="gray.600">
                Rollback to previous settings configurations (last 10 versions stored)
              </Text>
            </VStack>
            <Button
              leftIcon={<Icon as={FaHistory} />}
              colorScheme="blue"
              onClick={createManualSnapshot}
            >
              Create Snapshot
            </Button>
          </HStack>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            Settings are automatically saved before each change. You can rollback to any of the last 10 versions.
          </AlertDescription>
        </Alert>

        {versions.length === 0 ? (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>
              No version history available yet. Settings will be saved automatically as you make changes.
            </AlertDescription>
          </Alert>
        ) : (
          <Card borderWidth={1} borderColor={borderColor}>
            <CardBody p={0}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Timestamp</Th>
                    <Th>Description</Th>
                    <Th>User</Th>
                    <Th>Settings Count</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {versions.map((version, index) => {
                    const settingsCount = Object.keys(version.settings || {}).reduce((total, category) => {
                      return total + Object.keys(version.settings[category] || {}).length;
                    }, 0);

                    const isLatest = index === 0;

                    return (
                      <Tr 
                        key={version.id}
                        _hover={{ bg: hoverBg }}
                        bg={isLatest ? latestRowBg : 'transparent'}
                      >
                        <Td>
                          <HStack>
                            <Icon as={TimeIcon} color="gray.500" />
                            <Text fontSize="sm">
                              {new Date(version.timestamp).toLocaleString()}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Text fontSize="sm">{version.description}</Text>
                            {isLatest && (
                              <Badge colorScheme="blue" fontSize="xs">
                                Latest
                              </Badge>
                            )}
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{version.user}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme="purple">{settingsCount}</Badge>
                        </Td>
                        <Td textAlign="right">
                          <HStack spacing={2} justify="flex-end">
                            {!isLatest && (
                              <Tooltip label="Rollback to this version">
                                <Button
                                  size="sm"
                                  leftIcon={<Icon as={FaUndo} />}
                                  colorScheme="orange"
                                  onClick={() => handleSelectVersion(version)}
                                >
                                  Rollback
                                </Button>
                              </Tooltip>
                            )}
                            {!isLatest && (
                              <Tooltip label="Delete this version">
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => deleteVersion(version.id)}
                                >
                                  Delete
                                </Button>
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Rollback Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            <HStack>
              <Icon as={FaExclamationTriangle} color="orange.500" />
              <Text>Confirm Settings Rollback</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  You are about to rollback to settings from{' '}
                  <strong>{selectedVersion && new Date(selectedVersion.timestamp).toLocaleString()}</strong>.
                  This will replace your current configuration.
                </AlertDescription>
              </Alert>

              {changes.length > 0 ? (
                <Box>
                  <Heading size="sm" mb={3}>
                    Changes ({changes.length} setting{changes.length !== 1 ? 's' : ''})
                  </Heading>
                  <Card borderWidth={1} borderColor={borderColor}>
                    <CardBody maxH="400px" overflowY="auto" p={0}>
                      <Table variant="simple" size="sm">
                        <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
                          <Tr>
                            <Th>Category</Th>
                            <Th>Setting</Th>
                            <Th>Current Value</Th>
                            <Th>Rollback Value</Th>
                            <Th>Type</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {changes.map((change, index) => (
                            <Tr key={index}>
                              <Td>
                                <Code fontSize="xs" colorScheme="gray">
                                  {change.category}
                                </Code>
                              </Td>
                              <Td>
                                <Text fontSize="sm" fontWeight="medium">
                                  {change.key}
                                </Text>
                              </Td>
                              <Td>
                                <Text 
                                  fontSize="sm" 
                                  color="red.500"
                                  textDecoration="line-through"
                                >
                                  {formatValue(change.currentValue)}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm" color="green.500" fontWeight="medium">
                                  {formatValue(change.oldValue)}
                                </Text>
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={getChangeTypeColor(change.type)}
                                  fontSize="xs"
                                >
                                  {change.type}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Box>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    No changes detected. This version matches your current settings.
                  </AlertDescription>
                </Alert>
              )}

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  <strong>Note:</strong> A new snapshot of your current settings will be automatically saved before rollback.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              leftIcon={<Icon as={FaUndo} />}
              colorScheme="orange"
              onClick={handleRollback}
              isLoading={rollbackLoading}
              isDisabled={changes.length === 0}
            >
              Confirm Rollback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SettingsRollback;
