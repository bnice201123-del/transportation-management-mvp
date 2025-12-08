import React, { useState, useRef } from 'react';
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
  useColorModeValue,
  Code,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, 
  WarningIcon, 
  DownloadIcon, 
  AttachmentIcon 
} from '@chakra-ui/icons';
import { 
  FaFileImport, 
  FaFileExport, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimesCircle 
} from 'react-icons/fa';
import settingsValidators from '../../utils/settingsValidation';

const SettingsImportExport = ({ currentSettings, onImport }) => {
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const successBg = useColorModeValue('green.50', 'green.900');

  // Validation rules for settings
  const validationRules = {
    system: {
      supportEmail: settingsValidators.email,
      apiBaseUrl: settingsValidators.url,
      maxUsers: settingsValidators.positiveInteger
    },
    security: {
      passwordMinLength: (value) => {
        const result = settingsValidators.positiveInteger(value);
        if (!result.isValid) return result;
        if (value < 6 || value > 50) return { isValid: false, error: 'Must be between 6-50' };
        return { isValid: true, error: null };
      },
      sessionTimeout: settingsValidators.positiveInteger,
      maxLoginAttempts: settingsValidators.positiveInteger
    },
    notifications: {
      adminEmail: settingsValidators.email,
      fromEmail: settingsValidators.email,
      smtpPort: settingsValidators.port
    },
    maps: {
      apiKey: settingsValidators.required,
      defaultZoom: (value) => {
        const result = settingsValidators.positiveInteger(value);
        if (!result.isValid) return result;
        if (value < 1 || value > 20) return { isValid: false, error: 'Must be between 1-20' };
        return { isValid: true, error: null };
      }
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      // Create export data with metadata
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportedBy: 'admin',
        settings: currentSettings,
        metadata: {
          totalCategories: Object.keys(currentSettings).length,
          totalSettings: Object.keys(currentSettings).reduce(
            (total, category) => total + Object.keys(currentSettings[category] || {}).length,
            0
          )
        }
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${exportData.metadata.totalSettings} settings from ${exportData.metadata.totalCategories} categories`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JSON file (.json)',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setImportFile(file);

    // Read and parse file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setImportData(parsed);
        
        // Validate and create preview
        validateImport(parsed);
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'Failed to parse JSON file. Please check the file format.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        setImportFile(null);
        setImportData(null);
      }
    };
    reader.readAsText(file);
  };

  const validateImport = (data) => {
    const results = {
      valid: [],
      warnings: [],
      errors: [],
      changes: []
    };

    // Check file structure
    if (!data.settings) {
      results.errors.push({
        category: 'file',
        field: 'structure',
        message: 'Invalid file structure: missing "settings" object'
      });
      setValidationResults(results);
      return;
    }

    const importSettings = data.settings;

    // Validate each category and setting
    Object.keys(importSettings).forEach(category => {
      const categorySettings = importSettings[category];
      
      if (typeof categorySettings !== 'object') {
        results.warnings.push({
          category,
          field: 'category',
          message: 'Category is not an object, skipping'
        });
        return;
      }

      Object.keys(categorySettings).forEach(field => {
        const value = categorySettings[field];
        const currentValue = currentSettings[category]?.[field];

        // Check if setting exists in current settings
        if (currentValue === undefined) {
          results.warnings.push({
            category,
            field,
            message: 'Setting does not exist in current configuration'
          });
        }

        // Run validation if rules exist
        const validator = validationRules[category]?.[field];
        if (validator) {
          const validation = validator(value);
          if (!validation.isValid) {
            results.errors.push({
              category,
              field,
              message: validation.error,
              value
            });
          } else {
            results.valid.push({
              category,
              field,
              value
            });
          }
        } else {
          results.valid.push({
            category,
            field,
            value
          });
        }

        // Track changes
        if (JSON.stringify(value) !== JSON.stringify(currentValue)) {
          results.changes.push({
            category,
            field,
            oldValue: currentValue,
            newValue: value,
            type: currentValue === undefined ? 'added' : 'modified'
          });
        }
      });
    });

    setValidationResults(results);
    setImportPreview(results.changes);
    
    // Auto-open preview if no errors
    if (results.errors.length === 0) {
      onOpen();
    }
  };

  const handleImport = () => {
    if (!importData || !validationResults) return;

    setImporting(true);
    try {
      // Apply imported settings
      onImport(importData.settings);

      toast({
        title: 'Import Successful',
        description: `Imported ${validationResults.changes.length} settings`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Reset state
      setImportFile(null);
      setImportData(null);
      setValidationResults(null);
      setImportPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to apply imported settings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setImporting(false);
    }
  };

  const formatValue = (value) => {
    if (value === undefined) return '(not set)';
    if (value === null) return '(null)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getValidationSummary = () => {
    if (!validationResults) return null;

    const total = validationResults.valid.length + 
                  validationResults.warnings.length + 
                  validationResults.errors.length;

    return {
      total,
      valid: validationResults.valid.length,
      warnings: validationResults.warnings.length,
      errors: validationResults.errors.length,
      changes: validationResults.changes.length,
      validPercent: total > 0 ? Math.round((validationResults.valid.length / total) * 100) : 0
    };
  };

  const summary = getValidationSummary();

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Bulk Import/Export Settings</Heading>
          <Text fontSize="sm" color="gray.600">
            Export current settings or import from a JSON file with validation
          </Text>
        </Box>

        {/* Export Section */}
        <Card borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Icon as={FaFileExport} color="blue.500" />
                    <Heading size="sm">Export Settings</Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Download all settings as a JSON file
                  </Text>
                </VStack>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="blue"
                  onClick={handleExport}
                  isLoading={exporting}
                >
                  Export
                </Button>
              </HStack>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Exported file includes metadata and all current settings. Use this for backup or migration.
                </AlertDescription>
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Import Section */}
        <Card borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Icon as={FaFileImport} color="green.500" />
                    <Heading size="sm">Import Settings</Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Upload a JSON file to import settings with validation
                  </Text>
                </VStack>
                <Button
                  leftIcon={<AttachmentIcon />}
                  colorScheme="green"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </HStack>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {importFile && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      File selected: {importFile.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Size: {(importFile.size / 1024).toFixed(2)} KB
                    </Text>
                  </VStack>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Validation Results */}
        {validationResults && (
          <Card borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="sm">Validation Results</Heading>

                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box p={4} bg={successBg} borderRadius="md" textAlign="center">
                    <Icon as={FaCheckCircle} boxSize={8} color="green.500" mb={2} />
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {summary.valid}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Valid</Text>
                  </Box>
                  <Box p={4} bg={warningBg} borderRadius="md" textAlign="center">
                    <Icon as={FaExclamationTriangle} boxSize={8} color="orange.500" mb={2} />
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                      {summary.warnings}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Warnings</Text>
                  </Box>
                  <Box p={4} bg={errorBg} borderRadius="md" textAlign="center">
                    <Icon as={FaTimesCircle} boxSize={8} color="red.500" mb={2} />
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                      {summary.errors}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Errors</Text>
                  </Box>
                  <Box p={4} bg={bgColor} borderRadius="md" borderWidth={1} textAlign="center">
                    <Text fontSize="xs" color="gray.600" mb={1}>Changes</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {summary.changes}
                    </Text>
                    <Text fontSize="sm" color="gray.600">settings</Text>
                  </Box>
                </SimpleGrid>

                {/* Validation Progress */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">Validation Status</Text>
                    <Text fontSize="sm" color="gray.600">{summary.validPercent}% valid</Text>
                  </HStack>
                  <Progress 
                    value={summary.validPercent} 
                    colorScheme={summary.errors > 0 ? 'red' : summary.warnings > 0 ? 'orange' : 'green'}
                    borderRadius="full"
                    hasStripe
                    isAnimated
                  />
                </Box>

                {/* Tabs for Details */}
                <Tabs size="sm" colorScheme="blue">
                  <TabList>
                    <Tab>Changes ({summary.changes})</Tab>
                    {summary.errors > 0 && <Tab>Errors ({summary.errors})</Tab>}
                    {summary.warnings > 0 && <Tab>Warnings ({summary.warnings})</Tab>}
                  </TabList>

                  <TabPanels>
                    {/* Changes Tab */}
                    <TabPanel p={0} pt={4}>
                      <Box maxH="300px" overflowY="auto">
                        <List spacing={2}>
                          {validationResults.changes.map((change, index) => (
                            <ListItem key={index} fontSize="sm">
                              <HStack align="start">
                                <ListIcon as={CheckCircleIcon} color="blue.500" mt={1} />
                                <VStack align="start" spacing={0} flex={1}>
                                  <Code fontSize="xs">{change.category}.{change.field}</Code>
                                  <HStack fontSize="xs" color="gray.600">
                                    <Text as="span" color="red.500" textDecoration="line-through">
                                      {formatValue(change.oldValue)}
                                    </Text>
                                    <Text>→</Text>
                                    <Text as="span" color="green.500" fontWeight="medium">
                                      {formatValue(change.newValue)}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <Badge colorScheme="blue" fontSize="xs">
                                  {change.type}
                                </Badge>
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </TabPanel>

                    {/* Errors Tab */}
                    {summary.errors > 0 && (
                      <TabPanel p={0} pt={4}>
                        <Box maxH="300px" overflowY="auto">
                          <List spacing={2}>
                            {validationResults.errors.map((error, index) => (
                              <ListItem key={index} fontSize="sm">
                                <HStack align="start">
                                  <ListIcon as={WarningIcon} color="red.500" mt={1} />
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Code fontSize="xs" colorScheme="red">
                                      {error.category}.{error.field}
                                    </Code>
                                    <Text fontSize="xs" color="red.600">
                                      {error.message}
                                    </Text>
                                    {error.value !== undefined && (
                                      <Text fontSize="xs" color="gray.600">
                                        Value: {formatValue(error.value)}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </TabPanel>
                    )}

                    {/* Warnings Tab */}
                    {summary.warnings > 0 && (
                      <TabPanel p={0} pt={4}>
                        <Box maxH="300px" overflowY="auto">
                          <List spacing={2}>
                            {validationResults.warnings.map((warning, index) => (
                              <ListItem key={index} fontSize="sm">
                                <HStack align="start">
                                  <ListIcon as={WarningIcon} color="orange.500" mt={1} />
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Code fontSize="xs" colorScheme="orange">
                                      {warning.category}.{warning.field}
                                    </Code>
                                    <Text fontSize="xs" color="orange.600">
                                      {warning.message}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>

                {/* Action Buttons */}
                <HStack spacing={4}>
                  <Button
                    colorScheme="green"
                    onClick={onOpen}
                    isDisabled={summary.errors > 0 || summary.changes === 0}
                    leftIcon={<CheckCircleIcon />}
                  >
                    Preview & Import
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportFile(null);
                      setImportData(null);
                      setValidationResults(null);
                      setImportPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </HStack>

                {summary.errors > 0 && (
                  <Alert status="error">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      Cannot import: {summary.errors} validation error{summary.errors !== 1 ? 's' : ''} found. 
                      Please fix the errors and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Import Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>Import Preview</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  You are about to import {importPreview?.length || 0} settings. 
                  Review the changes below before confirming.
                </AlertDescription>
              </Alert>

              {importPreview && importPreview.length > 0 && (
                <Box maxH="400px" overflowY="auto" borderWidth={1} borderColor={borderColor} borderRadius="md">
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
                      <Tr>
                        <Th>Category</Th>
                        <Th>Setting</Th>
                        <Th>Current Value</Th>
                        <Th>New Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {importPreview.map((change, index) => (
                        <Tr key={index}>
                          <Td>
                            <Code fontSize="xs">{change.category}</Code>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium">
                              {change.field}
                            </Text>
                          </Td>
                          <Td>
                            <Code 
                              fontSize="xs" 
                              colorScheme="red"
                              textDecoration="line-through"
                            >
                              {formatValue(change.oldValue)}
                            </Code>
                          </Td>
                          <Td>
                            <Code 
                              fontSize="xs" 
                              colorScheme="green"
                              fontWeight="bold"
                            >
                              {formatValue(change.newValue)}
                            </Code>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleImport}
              isLoading={importing}
              leftIcon={<CheckCircleIcon />}
            >
              Confirm Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SettingsImportExport;
