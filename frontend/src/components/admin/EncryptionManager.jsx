/**
 * Encryption Manager Component
 * 
 * Admin interface for managing data encryption at rest.
 * Features:
 * - View encryption status and statistics
 * - Initialize encryption system
 * - Rotate encryption keys
 * - Encrypt existing unencrypted data
 * - Re-encrypt data with new keys
 * - Monitor key lifecycle and usage
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  Progress,
  Select,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Code,
  IconButton,
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import {
  FaLock,
  FaUnlock,
  FaKey,
  FaSync,
  FaShieldAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaCopy,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const EncryptionManager = () => {
  const [status, setStatus] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [rotationIntervalDays, setRotationIntervalDays] = useState(90);
  const [notes, setNotes] = useState('');
  const [encryptionCollection, setEncryptionCollection] = useState('all');
  const [reencryptOldKeyVersion, setReencryptOldKeyVersion] = useState('');
  const [generatedMasterKey, setGeneratedMasterKey] = useState('');
  
  const toast = useToast();
  const { isOpen: isInitOpen, onOpen: onInitOpen, onClose: onInitClose } = useDisclosure();
  const { isOpen: isRotateOpen, onOpen: onRotateOpen, onClose: onRotateClose } = useDisclosure();
  const { isOpen: isEncryptOpen, onOpen: onEncryptOpen, onClose: onEncryptClose } = useDisclosure();
  const { isOpen: isReencryptOpen, onOpen: onReencryptOpen, onClose: onReencryptClose } = useDisclosure();
  const { isOpen: isMasterKeyOpen, onOpen: onMasterKeyOpen, onClose: onMasterKeyClose } = useDisclosure();

  useEffect(() => {
    fetchStatus();
    fetchKeys();
  }, []);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/encryption/status`, getAuthHeader());
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching encryption status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch encryption status',
        status: 'error',
        duration: 5000
      });
    }
  };

  const fetchKeys = async () => {
    try {
      const response = await axios.get(`${API_URL}/encryption/keys`, getAuthHeader());
      setKeys(response.data.keys);
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const handleInitialize = async () => {
    setOperationInProgress(true);
    try {
      const response = await axios.post(
        `${API_URL}/encryption/initialize`,
        { rotationIntervalDays, notes },
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000
      });
      
      onInitClose();
      await fetchStatus();
      await fetchKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initialize encryption',
        status: 'error',
        duration: 5000
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleRotateKey = async () => {
    setOperationInProgress(true);
    try {
      const response = await axios.post(
        `${API_URL}/encryption/rotate-key`,
        { rotationIntervalDays, notes },
        getAuthHeader()
      );
      
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 7000
      });
      
      onRotateClose();
      await fetchStatus();
      await fetchKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to rotate key',
        status: 'error',
        duration: 5000
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleEncryptData = async () => {
    setOperationInProgress(true);
    try {
      const response = await axios.post(
        `${API_URL}/encryption/encrypt-data`,
        { collection: encryptionCollection, limit: 100 },
        getAuthHeader()
      );
      
      const results = response.data.results;
      const totalEncrypted = results.users.encrypted + results.riders.encrypted;
      
      toast({
        title: 'Encryption Complete',
        description: `Encrypted ${totalEncrypted} records (${results.users.encrypted} users, ${results.riders.encrypted} riders)`,
        status: 'success',
        duration: 7000
      });
      
      onEncryptClose();
      await fetchStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to encrypt data',
        status: 'error',
        duration: 5000
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleReencryptData = async () => {
    if (!reencryptOldKeyVersion) {
      toast({
        title: 'Error',
        description: 'Please select old key version',
        status: 'error',
        duration: 3000
      });
      return;
    }
    
    setOperationInProgress(true);
    try {
      const response = await axios.post(
        `${API_URL}/encryption/reencrypt-data`,
        { 
          collection: encryptionCollection, 
          oldKeyVersion: parseInt(reencryptOldKeyVersion),
          limit: 100
        },
        getAuthHeader()
      );
      
      const results = response.data.results;
      const totalReencrypted = results.users.reencrypted + results.riders.reencrypted;
      
      toast({
        title: 'Re-encryption Complete',
        description: `Re-encrypted ${totalReencrypted} records (${results.users.reencrypted} users, ${results.riders.reencrypted} riders)`,
        status: 'success',
        duration: 7000
      });
      
      onReencryptClose();
      await fetchStatus();
      await fetchKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to re-encrypt data',
        status: 'error',
        duration: 5000
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleGenerateMasterKey = async () => {
    try {
      const response = await axios.get(`${API_URL}/encryption/generate-master-key`, getAuthHeader());
      setGeneratedMasterKey(response.data.masterKey);
      onMasterKeyOpen();
      
      toast({
        title: 'Master Key Generated',
        description: response.data.message,
        status: 'info',
        duration: 7000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate master key',
        status: 'error',
        duration: 5000
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Master key copied to clipboard',
      status: 'success',
      duration: 2000
    });
  };

  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'active': return 'green';
      case 'retired': return 'orange';
      case 'deprecated': return 'red';
      case 'scheduled': return 'blue';
      default: return 'gray';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatPercentage = (value) => {
    return `${value}%`;
  };

  if (!status) {
    return (
      <Box p={6}>
        <Heading size="md" mb={4}>Loading encryption status...</Heading>
      </Box>
    );
  }

  return (
    <Box>
      {!status.configured && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Encryption Not Configured</AlertTitle>
            <AlertDescription>
              Please set the ENCRYPTION_MASTER_KEY environment variable to enable encryption.
              <Button size="sm" ml={4} onClick={handleGenerateMasterKey}>
                Generate Master Key
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {status.configured && !status.initialized && (
        <Alert status="warning" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Encryption Not Initialized</AlertTitle>
            <AlertDescription>
              Encryption is configured but not initialized. Click below to create the first encryption key.
              <Button size="sm" ml={4} colorScheme="blue" onClick={onInitOpen}>
                Initialize Encryption
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {status.rotationDue > 0 && (
        <Alert status="warning" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Key Rotation Due</AlertTitle>
            <AlertDescription>
              {status.rotationDue} encryption key(s) are due for rotation.
              <Button size="sm" ml={4} colorScheme="orange" onClick={onRotateOpen}>
                Rotate Key
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Tabs colorScheme="blue">
        <TabList>
          <Tab><HStack><FaShieldAlt /><Text>Overview</Text></HStack></Tab>
          <Tab><HStack><FaKey /><Text>Encryption Keys</Text></HStack></Tab>
          <Tab><HStack><FaDatabase /><Text>Data Encryption</Text></HStack></Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack spacing={4}>
                <Card flex={1}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Configuration Status</StatLabel>
                      <StatNumber>
                        <HStack>
                          {status.configured ? <FaLock color="green" /> : <FaUnlock color="red" />}
                          <Text>{status.configured ? 'Configured' : 'Not Configured'}</Text>
                        </HStack>
                      </StatNumber>
                      <StatHelpText>
                        {status.initialized ? 'System initialized' : 'Awaiting initialization'}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                {status.activeKey && (
                  <Card flex={1}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Active Key</StatLabel>
                        <StatNumber>{status.activeKey.version}</StatNumber>
                        <StatHelpText>
                          Age: {status.activeKey.ageInDays} days
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                )}

                <Card flex={1}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Total Keys</StatLabel>
                      <StatNumber>{status.statistics?.total || 0}</StatNumber>
                      <StatHelpText>
                        {status.statistics?.active || 0} active, {status.statistics?.retired || 0} retired
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </HStack>

              {status.dataEncryption && (
                <>
                  <Heading size="md" mt={4}>Data Encryption Progress</Heading>
                  
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold">Users</Text>
                            <Text>
                              {status.dataEncryption.users.encrypted} / {status.dataEncryption.users.total}
                              ({formatPercentage(status.dataEncryption.users.percentage)})
                            </Text>
                          </HStack>
                          <Progress 
                            value={status.dataEncryption.users.percentage} 
                            colorScheme="blue"
                            size="lg"
                          />
                        </Box>

                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold">Riders</Text>
                            <Text>
                              {status.dataEncryption.riders.encrypted} / {status.dataEncryption.riders.total}
                              ({formatPercentage(status.dataEncryption.riders.percentage)})
                            </Text>
                          </HStack>
                          <Progress 
                            value={status.dataEncryption.riders.percentage} 
                            colorScheme="green"
                            size="lg"
                          />
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </>
              )}

              <HStack spacing={4} mt={4}>
                {status.configured && !status.initialized && (
                  <Button 
                    leftIcon={<FaKey />} 
                    colorScheme="blue" 
                    onClick={onInitOpen}
                    isDisabled={operationInProgress}
                  >
                    Initialize Encryption
                  </Button>
                )}
                
                {status.initialized && (
                  <>
                    <Button 
                      leftIcon={<FaSync />} 
                      colorScheme="orange" 
                      onClick={onRotateOpen}
                      isDisabled={operationInProgress}
                    >
                      Rotate Key
                    </Button>
                    
                    <Button 
                      leftIcon={<FaLock />} 
                      colorScheme="green" 
                      onClick={onEncryptOpen}
                      isDisabled={operationInProgress}
                    >
                      Encrypt Data
                    </Button>
                    
                    {status.statistics?.retired > 0 && (
                      <Button 
                        leftIcon={<FaSync />} 
                        colorScheme="purple" 
                        onClick={onReencryptOpen}
                        isDisabled={operationInProgress}
                      >
                        Re-encrypt Data
                      </Button>
                    )}
                  </>
                )}

                <Button 
                  leftIcon={<FaKey />} 
                  variant="outline" 
                  onClick={handleGenerateMasterKey}
                >
                  Generate Master Key
                </Button>
              </HStack>
            </VStack>
          </TabPanel>

          {/* Encryption Keys Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Version</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Age (days)</Th>
                      <Th>Next Rotation</Th>
                      <Th>Encryptions</Th>
                      <Th>Decryptions</Th>
                      <Th>Notes</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {keys.map((key) => (
                      <Tr key={key.version}>
                        <Td fontWeight="bold">{key.version}</Td>
                        <Td>
                          <HStack>
                            <Badge colorScheme={getStatusColor(key.status)}>
                              {key.status.toUpperCase()}
                            </Badge>
                            {key.isActive && <FaCheckCircle color="green" />}
                            {key.isRotationDue && (
                              <Tooltip label="Rotation due">
                                <span><FaExclamationTriangle color="orange" /></span>
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                        <Td>{formatDate(key.createdAt)}</Td>
                        <Td>{key.ageInDays}</Td>
                        <Td>{formatDate(key.nextRotationAt)}</Td>
                        <Td>{key.usageStats?.encryptionCount || 0}</Td>
                        <Td>{key.usageStats?.decryptionCount || 0}</Td>
                        <Td>
                          <Text noOfLines={1} maxW="200px">
                            {key.notes || '-'}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {keys.length === 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <Text>No encryption keys found. Initialize encryption to get started.</Text>
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Data Encryption Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Data Encryption Information</AlertTitle>
                  <AlertDescription>
                    Encrypt sensitive fields in your database including emails, phone numbers, addresses, and dates of birth.
                    Encryption uses AES-256-GCM with key versioning for secure rotation.
                  </AlertDescription>
                </Box>
              </Alert>

              {status.dataEncryption && (
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Encryption Coverage</Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text>Users Encrypted:</Text>
                        <Badge colorScheme={status.dataEncryption.users.percentage === 100 ? 'green' : 'orange'} fontSize="md">
                          {status.dataEncryption.users.encrypted} / {status.dataEncryption.users.total}
                          ({formatPercentage(status.dataEncryption.users.percentage)})
                        </Badge>
                      </HStack>

                      <HStack justify="space-between">
                        <Text>Riders Encrypted:</Text>
                        <Badge colorScheme={status.dataEncryption.riders.percentage === 100 ? 'green' : 'orange'} fontSize="md">
                          {status.dataEncryption.riders.encrypted} / {status.dataEncryption.riders.total}
                          ({formatPercentage(status.dataEncryption.riders.percentage)})
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardBody>
                  <Heading size="sm" mb={4}>Encrypted Fields</Heading>
                  <VStack align="stretch" spacing={2}>
                    <Text><strong>User Model:</strong> email, phone, licenseNumber, twoFactorSecret</Text>
                    <Text><strong>Rider Model:</strong> email, phone, address, dateOfBirth</Text>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      <FaInfoCircle style={{ display: 'inline', marginRight: '4px' }} />
                      Searchable fields (email, phone) use deterministic encryption with hashed indexes
                    </Text>
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
          <ModalHeader>Initialize Encryption</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Rotation Interval (days)</Text>
                <Input 
                  type="number" 
                  value={rotationIntervalDays}
                  onChange={(e) => setRotationIntervalDays(parseInt(e.target.value))}
                  placeholder="90"
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Set to 0 for manual rotation only
                </Text>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Notes (optional)</Text>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Initial encryption key"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onInitClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleInitialize}
              isLoading={operationInProgress}
            >
              Initialize
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rotate Key Modal */}
      <Modal isOpen={isRotateOpen} onClose={onRotateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rotate Encryption Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertDescription>
                    After key rotation, you must re-encrypt all existing data with the new key.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontWeight="bold" mb={2}>Rotation Interval (days)</Text>
                <Input 
                  type="number" 
                  value={rotationIntervalDays}
                  onChange={(e) => setRotationIntervalDays(parseInt(e.target.value))}
                  placeholder="90"
                />
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Notes (optional)</Text>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Scheduled rotation"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRotateClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="orange" 
              onClick={handleRotateKey}
              isLoading={operationInProgress}
            >
              Rotate Key
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Encrypt Data Modal */}
      <Modal isOpen={isEncryptOpen} onClose={onEncryptClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Encrypt Existing Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertDescription>
                    This will encrypt unencrypted sensitive fields in your database.
                    Process runs in batches of 100 records.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontWeight="bold" mb={2}>Collection</Text>
                <Select 
                  value={encryptionCollection}
                  onChange={(e) => setEncryptionCollection(e.target.value)}
                >
                  <option value="all">All Collections</option>
                  <option value="users">Users Only</option>
                  <option value="riders">Riders Only</option>
                </Select>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEncryptClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleEncryptData}
              isLoading={operationInProgress}
            >
              Encrypt Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Re-encrypt Data Modal */}
      <Modal isOpen={isReencryptOpen} onClose={onReencryptClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Re-encrypt Data with New Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertDescription>
                    This will decrypt data encrypted with the old key and re-encrypt it with the new active key.
                    Process runs in batches of 100 records.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box>
                <Text fontWeight="bold" mb={2}>Old Key Version</Text>
                <Select 
                  value={reencryptOldKeyVersion}
                  onChange={(e) => setReencryptOldKeyVersion(e.target.value)}
                  placeholder="Select old key version"
                >
                  {keys.filter(k => !k.isActive && k.status === 'retired').map(key => (
                    <option key={key.version} value={key.version}>
                      Version {key.version} ({key.ageInDays} days old)
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Collection</Text>
                <Select 
                  value={encryptionCollection}
                  onChange={(e) => setEncryptionCollection(e.target.value)}
                >
                  <option value="all">All Collections</option>
                  <option value="users">Users Only</option>
                  <option value="riders">Riders Only</option>
                </Select>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReencryptClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleReencryptData}
              isLoading={operationInProgress}
            >
              Re-encrypt Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Master Key Modal */}
      <Modal isOpen={isMasterKeyOpen} onClose={onMasterKeyClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generated Master Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Save This Key Securely!</AlertTitle>
                  <AlertDescription>
                    This key will not be shown again. Copy it and store it in your environment variables as ENCRYPTION_MASTER_KEY.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box position="relative">
                <Code p={4} w="100%" display="block" wordBreak="break-all">
                  {generatedMasterKey}
                </Code>
                <IconButton
                  icon={<FaCopy />}
                  position="absolute"
                  top={2}
                  right={2}
                  size="sm"
                  onClick={() => copyToClipboard(generatedMasterKey)}
                  aria-label="Copy master key"
                />
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Add to .env file:</Text>
                <Code p={2} w="100%" display="block">
                  ENCRYPTION_MASTER_KEY={generatedMasterKey}
                </Code>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onMasterKeyClose}>
              I Have Saved The Key
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EncryptionManager;
