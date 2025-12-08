import React, { useState } from 'react';
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
  List,
  ListItem,
  ListIcon,
  Icon
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { FaRocket, FaFlask, FaCode } from 'react-icons/fa';

// Predefined templates for different environments
const environmentTemplates = {
  development: {
    name: 'Development',
    description: 'Optimized for local development with verbose logging and relaxed security',
    icon: FaCode,
    color: 'blue',
    settings: {
      system: {
        siteName: 'Transport Dev',
        maintenanceMode: false,
        maxUsers: 100,
        debugMode: true,
        logLevel: 'debug'
      },
      security: {
        passwordMinLength: 6,
        twoFactorAuth: false,
        sessionTimeout: 480, // 8 hours
        maxLoginAttempts: 10
      },
      notifications: {
        emailEnabled: false,
        smsEnabled: false,
        pushEnabled: true
      },
      maps: {
        defaultZoom: 12,
        cacheEnabled: false
      }
    }
  },
  staging: {
    name: 'Staging',
    description: 'Pre-production environment with moderate security and logging',
    icon: FaFlask,
    color: 'orange',
    settings: {
      system: {
        siteName: 'Transport Staging',
        maintenanceMode: false,
        maxUsers: 500,
        debugMode: true,
        logLevel: 'info'
      },
      security: {
        passwordMinLength: 8,
        twoFactorAuth: true,
        sessionTimeout: 240, // 4 hours
        maxLoginAttempts: 5
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      },
      maps: {
        defaultZoom: 12,
        cacheEnabled: true
      }
    }
  },
  production: {
    name: 'Production',
    description: 'Production environment with maximum security and performance',
    icon: FaRocket,
    color: 'green',
    settings: {
      system: {
        siteName: 'Transport Management',
        maintenanceMode: false,
        maxUsers: 10000,
        debugMode: false,
        logLevel: 'error'
      },
      security: {
        passwordMinLength: 12,
        twoFactorAuth: true,
        sessionTimeout: 120, // 2 hours
        maxLoginAttempts: 3
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true
      },
      maps: {
        defaultZoom: 12,
        cacheEnabled: true
      }
    }
  }
};

const SettingsTemplates = ({ currentSettings, onApplyTemplate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const toast = useToast();

  const handleSelectTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    onOpen();
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const template = environmentTemplates[selectedTemplate];
    
    onApplyTemplate(template.settings);
    
    toast({
      title: 'Template Applied',
      description: `${template.name} settings have been applied successfully`,
      status: 'success',
      duration: 3000,
      isClosable: true
    });
    
    onClose();
    setSelectedTemplate(null);
  };

  const getChangeSummary = () => {
    if (!selectedTemplate) return [];
    
    const template = environmentTemplates[selectedTemplate];
    const changes = [];

    // Compare template settings with current settings
    Object.keys(template.settings).forEach(category => {
      Object.keys(template.settings[category]).forEach(key => {
        const newValue = template.settings[category][key];
        const oldValue = currentSettings[category]?.[key];
        
        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          changes.push({
            category,
            key,
            oldValue,
            newValue
          });
        }
      });
    });

    return changes;
  };

  const selectedTemplateData = selectedTemplate ? environmentTemplates[selectedTemplate] : null;
  const changes = selectedTemplate ? getChangeSummary() : [];

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Environment Templates</Heading>
          <Text fontSize="sm" color="gray.600">
            Quick apply pre-configured settings optimized for different environments
          </Text>
        </Box>

        <HStack spacing={4} align="stretch">
          {Object.entries(environmentTemplates).map(([key, template]) => (
            <Card 
              key={key}
              flex={1}
              borderWidth={2}
              borderColor={`${template.color}.200`}
              _hover={{ 
                borderColor: `${template.color}.400`,
                shadow: 'md',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              }}
              cursor="pointer"
              onClick={() => handleSelectTemplate(key)}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Icon 
                      as={template.icon} 
                      boxSize={6} 
                      color={`${template.color}.500`}
                    />
                    <Heading size="sm">{template.name}</Heading>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600">
                    {template.description}
                  </Text>

                  <Badge colorScheme={template.color} fontSize="xs">
                    {Object.keys(template.settings).length} Categories
                  </Badge>

                  <Button 
                    size="sm" 
                    colorScheme={template.color}
                    width="full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(key);
                    }}
                  >
                    Apply Template
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </HStack>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            Applying a template will override your current settings. Make sure to save a backup before applying.
          </AlertDescription>
        </Alert>
      </VStack>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              {selectedTemplateData && (
                <>
                  <Icon 
                    as={selectedTemplateData.icon} 
                    color={`${selectedTemplateData.color}.500`}
                  />
                  <Text>Apply {selectedTemplateData.name} Template</Text>
                </>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  This will change {changes.length} setting{changes.length !== 1 ? 's' : ''}. 
                  Review the changes below before applying.
                </AlertDescription>
              </Alert>

              {changes.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3}>Changes to be applied:</Heading>
                  <List spacing={2} maxH="300px" overflowY="auto">
                    {changes.map((change, index) => (
                      <ListItem key={index} fontSize="sm">
                        <HStack align="start">
                          <ListIcon as={CheckCircleIcon} color="green.500" mt={1} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {change.category}.{change.key}
                            </Text>
                            <Text color="gray.600" fontSize="xs">
                              <Text as="span" color="red.500" textDecoration="line-through">
                                {String(change.oldValue)}
                              </Text>
                              {' → '}
                              <Text as="span" color="green.500" fontWeight="medium">
                                {String(change.newValue)}
                              </Text>
                            </Text>
                          </VStack>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {changes.length === 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    No changes needed. Your current settings already match this template.
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
              colorScheme={selectedTemplateData?.color || 'blue'}
              onClick={handleApplyTemplate}
              isDisabled={changes.length === 0}
            >
              Apply Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SettingsTemplates;
