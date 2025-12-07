import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Spinner,
  Center,
  Badge,
  Input,
  PinInput,
  PinInputField,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Code,
  List,
  ListItem,
  ListIcon,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
  SimpleGrid
} from '@chakra-ui/react';
import {
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const TwoFactorAuthentication = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const { isOpen: isSetupOpen, onOpen: onSetupOpen, onClose: onSetupClose } = useDisclosure();
  const { isOpen: isDisableOpen, onOpen: onDisableOpen, onClose: onDisableClose } = useDisclosure();
  const { isOpen: isBackupCodesOpen, onOpen: onBackupCodesOpen, onClose: onBackupCodesClose } = useDisclosure();
  const { isOpen: isRegenerateOpen, onOpen: onRegenerateOpen, onClose: onRegenerateClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/2fa/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load 2FA status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    try {
      const response = await axios.post('/api/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      onSetupOpen();
    } catch (error) {
      console.error('Error starting 2FA setup:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start 2FA setup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleVerifySetup = async () => {
    try {
      if (verificationCode.length !== 6) {
        toast({
          title: 'Error',
          description: 'Please enter a 6-digit code',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.post('/api/2fa/verify-setup', {
        token: verificationCode
      });

      setBackupCodes(response.data.backupCodes);
      toast({
        title: 'Success',
        description: '2FA enabled successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSetupClose();
      onBackupCodesOpen();
      fetchStatus();
      setVerificationCode('');
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid verification code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      if (!password || disableCode.length !== 6) {
        toast({
          title: 'Error',
          description: 'Please enter your password and a 6-digit code',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await axios.post('/api/2fa/disable', {
        password,
        token: disableCode
      });

      toast({
        title: 'Success',
        description: '2FA disabled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onDisableClose();
      fetchStatus();
      setPassword('');
      setDisableCode('');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to disable 2FA',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      if (!password || verificationCode.length !== 6) {
        toast({
          title: 'Error',
          description: 'Please enter your password and a 6-digit code',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await axios.post('/api/2fa/regenerate-backup-codes', {
        password,
        token: verificationCode
      });

      setBackupCodes(response.data.backupCodes);
      toast({
        title: 'Success',
        description: 'Backup codes regenerated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onRegenerateClose();
      onBackupCodesOpen();
      setPassword('');
      setVerificationCode('');
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to regenerate backup codes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack>
              <ShieldCheckIcon style={{ width: '24px', height: '24px' }} />
              <Heading size="md">Two-Factor Authentication</Heading>
            </HStack>
            <Badge colorScheme={status?.twoFactorEnabled ? 'green' : 'gray'} fontSize="md">
              {status?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={6}>
            <Text color="gray.600">
              Add an extra layer of security to your account. When enabled, you'll need to enter a code from your
              authenticator app in addition to your password when logging in.
            </Text>

            {!status?.twoFactorEnabled ? (
              <>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    2FA is currently disabled. Enable it to protect your account.
                  </AlertDescription>
                </Alert>

                <Box>
                  <Heading size="sm" mb={3}>How it works:</Heading>
                  <List spacing={2}>
                    <ListItem>
                      <HStack>
                        <ListIcon as={CheckCircleIcon} color="green.500" w={5} h={5} />
                        <Text>Download an authenticator app (Google Authenticator, Authy, etc.)</Text>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack>
                        <ListIcon as={CheckCircleIcon} color="green.500" w={5} h={5} />
                        <Text>Scan the QR code or enter the secret key</Text>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack>
                        <ListIcon as={CheckCircleIcon} color="green.500" w={5} h={5} />
                        <Text>Enter the 6-digit code to verify and enable 2FA</Text>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack>
                        <ListIcon as={CheckCircleIcon} color="green.500" w={5} h={5} />
                        <Text>Save your backup codes in a safe place</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </Box>

                <Button
                  colorScheme="brand"
                  leftIcon={<ShieldCheckIcon style={{ width: '20px', height: '20px' }} />}
                  onClick={handleStartSetup}
                  size="lg"
                >
                  Enable Two-Factor Authentication
                </Button>
              </>
            ) : (
              <>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    2FA is enabled. Your account is protected with two-factor authentication.
                  </AlertDescription>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="bold">Enabled Since</Text>
                        <Text fontSize="sm" color="gray.600">
                          {new Date(status.twoFactorEnabledAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  <Card variant="outline">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="bold">Backup Codes Remaining</Text>
                        <HStack>
                          <Badge colorScheme={status.backupCodesRemaining > 3 ? 'green' : 'orange'} fontSize="lg">
                            {status.backupCodesRemaining} / 10
                          </Badge>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Divider />

                <VStack align="stretch" spacing={3}>
                  <Button
                    leftIcon={<KeyIcon style={{ width: '20px', height: '20px' }} />}
                    onClick={onRegenerateOpen}
                  >
                    Regenerate Backup Codes
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<XCircleIcon style={{ width: '20px', height: '20px' }} />}
                    onClick={onDisableOpen}
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </VStack>
              </>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Setup Modal */}
      <Modal isOpen={isSetupOpen} onClose={onSetupClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enable Two-Factor Authentication</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="sm" mb={3}>Step 1: Scan QR Code</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </Text>
                {qrCode && (
                  <Center>
                    <Image src={qrCode} alt="QR Code" boxSize="250px" />
                  </Center>
                )}
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mb={3}>Or enter this key manually:</Heading>
                <HStack>
                  <Code p={2} borderRadius="md" flex="1">{secret}</Code>
                  <Tooltip label="Copy to clipboard">
                    <IconButton
                      icon={<DocumentDuplicateIcon style={{ width: '20px', height: '20px' }} />}
                      onClick={() => copyToClipboard(secret)}
                      size="sm"
                    />
                  </Tooltip>
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mb={3}>Step 2: Enter Verification Code</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Enter the 6-digit code from your authenticator app
                </Text>
                <Center>
                  <HStack>
                    <PinInput size="lg" value={verificationCode} onChange={setVerificationCode}>
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </Center>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSetupClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleVerifySetup}>
              Verify and Enable
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal isOpen={isBackupCodesOpen} onClose={onBackupCodesClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save Your Backup Codes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Save these backup codes in a safe place. You can use them to access your account if you lose access
                  to your authenticator app.
                </AlertDescription>
              </Alert>

              <Box p={4} bg="gray.50" borderRadius="md">
                <SimpleGrid columns={2} spacing={2}>
                  {backupCodes.map((code, index) => (
                    <Code key={index} p={2} textAlign="center">
                      {code}
                    </Code>
                  ))}
                </SimpleGrid>
              </Box>

              <HStack>
                <Button
                  flex="1"
                  leftIcon={<DocumentDuplicateIcon style={{ width: '20px', height: '20px' }} />}
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  Copy All
                </Button>
                <Button flex="1" onClick={downloadBackupCodes}>
                  Download
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" onClick={onBackupCodesClose}>
              I've Saved My Codes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal isOpen={isDisableOpen} onClose={onDisableClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Disable Two-Factor Authentication</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Disabling 2FA will make your account less secure. Are you sure you want to continue?
                </AlertDescription>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Verification Code</FormLabel>
                <Center>
                  <HStack>
                    <PinInput size="lg" value={disableCode} onChange={setDisableCode}>
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </Center>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDisableClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDisable2FA}>
              Disable 2FA
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Regenerate Backup Codes Modal */}
      <Modal isOpen={isRegenerateOpen} onClose={onRegenerateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Regenerate Backup Codes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  Regenerating backup codes will invalidate all existing codes. Make sure to save the new codes.
                </AlertDescription>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Verification Code</FormLabel>
                <Center>
                  <HStack>
                    <PinInput size="lg" value={verificationCode} onChange={setVerificationCode}>
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </Center>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRegenerateClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleRegenerateBackupCodes}>
              Regenerate Codes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TwoFactorAuthentication;
