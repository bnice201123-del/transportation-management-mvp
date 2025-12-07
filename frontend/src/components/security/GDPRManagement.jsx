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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  useColorModeValue,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  List,
  ListItem,
  ListIcon,
  Code,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const GDPRManagement = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [deletionReason, setDeletionReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [processing, setProcessing] = useState(false);

  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const dangerBg = useColorModeValue('red.50', 'red.900');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gdpr/requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching GDPR requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load GDPR requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExport = async () => {
    try {
      setProcessing(true);
      const response = await axios.post('/api/gdpr/export', {
        format: exportFormat,
        includeRelated: true
      });

      toast({
        title: 'Success',
        description: 'Data export request created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onExportClose();
      fetchRequests();
    } catch (error) {
      console.error('Error requesting export:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create export request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadExport = async (requestId) => {
    try {
      const response = await axios.get(`/api/gdpr/export/${requestId}/download`, {
        responseType: 'blob'
      });

      const request = requests.find(r => r.id === requestId);
      const fileName = request?.exportData?.fileName || `data-export-${Date.now()}.json`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Success',
        description: 'Data export downloaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error downloading export:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to download export',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRequestDeletion = async () => {
    try {
      if (confirmationText !== 'DELETE_MY_ACCOUNT') {
        toast({
          title: 'Invalid Confirmation',
          description: 'Please type DELETE_MY_ACCOUNT exactly to confirm',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setProcessing(true);
      await axios.post('/api/gdpr/delete', {
        confirmation: confirmationText,
        reason: deletionReason
      });

      toast({
        title: 'Deletion Requested',
        description: 'Your account deletion request has been submitted. This will be processed within 30 days.',
        status: 'info',
        duration: 7000,
        isClosable: true,
      });

      onDeleteClose();
      setConfirmationText('');
      setDeletionReason('');
      fetchRequests();
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to request deletion',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDeletion = async (requestId) => {
    try {
      await axios.delete(`/api/gdpr/delete/${requestId}`);

      toast({
        title: 'Success',
        description: 'Deletion request cancelled',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel deletion',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: ClockIcon,
      processing: ClockIcon,
      completed: CheckCircleIcon,
      failed: XCircleIcon,
      cancelled: XCircleIcon
    };
    return icons[status] || InformationCircleIcon;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  const exportRequests = requests.filter(r => r.type === 'data_export');
  const deletionRequests = requests.filter(r => r.type === 'data_deletion');

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>
            <HStack>
              <ArrowDownTrayIcon style={{ width: '20px', height: '20px' }} />
              <Text>Data Export</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <TrashIcon style={{ width: '20px', height: '20px' }} />
              <Text>Account Deletion</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <DocumentTextIcon style={{ width: '20px', height: '20px' }} />
              <Text>Your Rights</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Data Export Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Info Card */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Data Portability</AlertTitle>
                  <AlertDescription>
                    You have the right to receive your personal data in a structured, commonly used format. 
                    Export files are available for 30 days after creation.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Request Export Button */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Heading size="sm">Request Data Export</Heading>
                      <Text fontSize="sm" color="gray.500">
                        Download a copy of all your personal data
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<ArrowDownTrayIcon style={{ width: '20px', height: '20px' }} />}
                      colorScheme="blue"
                      onClick={onExportOpen}
                    >
                      Export My Data
                    </Button>
                  </Flex>
                </CardBody>
              </Card>

              {/* Export History */}
              {exportRequests.length > 0 && (
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="sm">Export History</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {exportRequests.map((request) => {
                        const StatusIcon = getStatusIcon(request.status);
                        return (
                          <Box
                            key={request.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            _hover={{ bg: hoverBg }}
                          >
                            <Flex justify="space-between" align="start">
                              <HStack spacing={3} flex={1}>
                                <StatusIcon style={{ width: '24px', height: '24px' }} />
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack>
                                    <Text fontWeight="medium">Data Export</Text>
                                    <Badge colorScheme={getStatusColor(request.status)}>
                                      {request.status}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.500">
                                    Requested: {new Date(request.requestedAt).toLocaleString()}
                                  </Text>
                                  {request.exportData && (
                                    <Text fontSize="sm" color="gray.500">
                                      Size: {formatFileSize(request.exportData.fileSize)} | 
                                      Downloads: {request.exportData.downloadCount}
                                    </Text>
                                  )}
                                  {request.expiresAt && (
                                    <Text fontSize="xs" color="orange.500">
                                      Expires: {new Date(request.expiresAt).toLocaleString()}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                              {request.status === 'completed' && (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleDownloadExport(request.id)}
                                  leftIcon={<ArrowDownTrayIcon style={{ width: '16px', height: '16px' }} />}
                                >
                                  Download
                                </Button>
                              )}
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Account Deletion Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Warning Card */}
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Permanent Action</AlertTitle>
                  <AlertDescription>
                    Account deletion is permanent and cannot be undone. All your data will be deleted or anonymized 
                    within 30 days of your request.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Request Deletion Button */}
              <Card bg={dangerBg} borderColor="red.300" borderWidth="1px">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Heading size="sm" color="red.700">Delete My Account</Heading>
                      <Text fontSize="sm" color="red.600">
                        Permanently delete your account and all associated data
                      </Text>
                    </VStack>
                    <Button
                      leftIcon={<TrashIcon style={{ width: '20px', height: '20px' }} />}
                      colorScheme="red"
                      onClick={onDeleteOpen}
                    >
                      Request Deletion
                    </Button>
                  </Flex>
                </CardBody>
              </Card>

              {/* Deletion History */}
              {deletionRequests.length > 0 && (
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardHeader>
                    <Heading size="sm">Deletion Requests</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {deletionRequests.map((request) => {
                        const StatusIcon = getStatusIcon(request.status);
                        return (
                          <Box
                            key={request.id}
                            p={4}
                            borderWidth="1px"
                            borderRadius="md"
                            _hover={{ bg: hoverBg }}
                          >
                            <Flex justify="space-between" align="start">
                              <HStack spacing={3} flex={1}>
                                <StatusIcon style={{ width: '24px', height: '24px' }} />
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack>
                                    <Text fontWeight="medium">Account Deletion</Text>
                                    <Badge colorScheme={getStatusColor(request.status)}>
                                      {request.status}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.500">
                                    Requested: {new Date(request.requestedAt).toLocaleString()}
                                  </Text>
                                  {request.completedAt && (
                                    <Text fontSize="sm" color="gray.500">
                                      Completed: {new Date(request.completedAt).toLocaleString()}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                              {request.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelDeletion(request.id)}
                                >
                                  Cancel Request
                                </Button>
                              )}
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Your Rights Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <Heading size="md">Your GDPR Rights</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <HStack mb={2}>
                        <ShieldCheckIcon style={{ width: '20px', height: '20px', color: 'green' }} />
                        <Text fontWeight="bold">Right to Access</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        You have the right to request copies of your personal data. Use the "Data Export" tab to download your information.
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <HStack mb={2}>
                        <DocumentTextIcon style={{ width: '20px', height: '20px', color: 'blue' }} />
                        <Text fontWeight="bold">Right to Rectification</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        You have the right to request correction of inaccurate personal data. Update your profile settings to make changes.
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <HStack mb={2}>
                        <TrashIcon style={{ width: '20px', height: '20px', color: 'red' }} />
                        <Text fontWeight="bold">Right to Erasure</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        You have the right to request deletion of your personal data. Use the "Account Deletion" tab to submit a request.
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <HStack mb={2}>
                        <ArrowDownTrayIcon style={{ width: '20px', height: '20px', color: 'purple' }} />
                        <Text fontWeight="bold">Right to Data Portability</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        You have the right to receive your data in a structured, machine-readable format and transfer it to another service.
                      </Text>
                    </Box>

                    <Divider />

                    <Box>
                      <HStack mb={2}>
                        <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: 'orange' }} />
                        <Text fontWeight="bold">Right to Object</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        You have the right to object to processing of your personal data for specific purposes. Contact support for assistance.
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertDescription>
                    For questions about your data rights or to exercise rights not available through this interface, 
                    please contact our Data Protection Officer at privacy@example.com
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Data Export</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Your export will include all personal data we have stored. The file will be available for download for 30 days.
                </AlertDescription>
              </Alert>

              <FormControl>
                <FormLabel>Export Format</FormLabel>
                <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="json">JSON (Recommended)</option>
                  <option value="csv">CSV</option>
                </Select>
              </FormControl>

              <Box p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" mb={2}>Data Included:</Text>
                <List spacing={1} fontSize="sm">
                  <ListItem>✓ Personal information</ListItem>
                  <ListItem>✓ Trip history</ListItem>
                  <ListItem>✓ Activity logs</ListItem>
                  <ListItem>✓ Notifications</ListItem>
                  <ListItem>✓ Work schedules</ListItem>
                  <ListItem>✓ All related data</ListItem>
                </List>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleRequestExport}
              isLoading={processing}
              loadingText="Creating..."
            >
              Create Export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Deletion Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete My Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning: This Cannot Be Undone</AlertTitle>
                  <AlertDescription fontSize="sm">
                    All your data will be permanently deleted or anonymized within 30 days. This action is irreversible.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel>Reason for Deletion (Optional)</FormLabel>
                <Textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Help us improve by telling us why you're leaving..."
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type <Code>DELETE_MY_ACCOUNT</Code> to confirm</FormLabel>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT"
                  fontFamily="mono"
                />
              </FormControl>

              <Box p={3} bg="orange.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" mb={2}>What will be deleted:</Text>
                <List spacing={1} fontSize="sm">
                  <ListItem>✗ Your account and profile</ListItem>
                  <ListItem>✗ Personal information</ListItem>
                  <ListItem>✗ Trip history (anonymized)</ListItem>
                  <ListItem>✗ Activity logs</ListItem>
                  <ListItem>✗ Notifications</ListItem>
                  <ListItem>✗ All associated data</ListItem>
                </List>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleRequestDeletion}
              isLoading={processing}
              loadingText="Submitting..."
              isDisabled={confirmationText !== 'DELETE_MY_ACCOUNT'}
            >
              Delete My Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GDPRManagement;
