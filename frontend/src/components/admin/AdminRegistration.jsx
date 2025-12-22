import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Center,
  Container,
  Select,
  Grid,
  GridItem,
  Switch,
  HStack,
  Textarea,
  useToast,
  Divider,
  Badge,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Tooltip,
  Flex,
  useColorModeValue,
  useBreakpointValue,
  Progress,
  Spinner,
  Fade,
  ScaleFade,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormErrorMessage,
  FormHelperText,
  List,
  ListItem,
  ListIcon,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps
} from '@chakra-ui/react';
import {
  EmailIcon,
  PhoneIcon,
  ViewIcon,
  ViewOffIcon,
  CopyIcon,
  CheckIcon,
  WarningIcon,
  InfoIcon,
  AddIcon,
  RepeatIcon,
  SettingsIcon,
  TimeIcon,
  LockIcon,
  UnlockIcon,
  EditIcon,
  ArrowForwardIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaUserPlus,
  FaIdCard,
  FaShieldAlt,
  FaRandom,
  FaEnvelope,
  FaKey,
  FaUserCheck,
  FaUserCog,
  FaUserTie,
  FaCar,
  FaClipboard,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfo,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';

const AdminRegistration = () => {
  const navigate = useNavigate();
  // Enhanced state management
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'driver',
    licenseNumber: '',
    employeeId: '',
    department: '',
    startDate: '',
    sendCredentials: true,
    notifyByEmail: true,
    notifyBySMS: false,
    customMessage: '',
    generateStrongPassword: true,
    requirePasswordChange: true
  });
  
  // Enhanced error and validation state
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registrationHistory, setRegistrationHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Hooks
  const { register } = useAuth();
  const toast = useToast();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardMaxW = useBreakpointValue({ base: 'full', md: 'container.md', lg: 'container.lg' });
  const gridCols = useBreakpointValue({ base: 1, md: 2 });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Enhanced validation rules
  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'First name must be 2-50 characters long'
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'Last name must be 2-50 characters long'
    },
    phone: {
      pattern: /^\+?[\d\s\-\(\)]{10,}$/,
      message: 'Please enter a valid phone number'
    },
    licenseNumber: {
      minLength: 5,
      maxLength: 20,
      message: 'License number must be 5-20 characters long'
    },
    employeeId: {
      pattern: /^[A-Za-z0-9\-]{3,20}$/,
      message: 'Employee ID must be 3-20 alphanumeric characters'
    }
  };

  // Role configurations with specific requirements and permissions
  const roleConfigs = {
    driver: {
      label: 'Driver',
      icon: FaCar,
      color: 'green.500',
      description: 'Vehicle operators and field personnel',
      requiredFields: ['licenseNumber'],
      permissions: ['drive_vehicles', 'view_routes', 'update_status']
    },
    scheduler: {
      label: 'Scheduler',
      icon: FaClipboard,
      color: 'blue.500',
      description: 'Route planning and scheduling staff',
      requiredFields: ['department'],
      permissions: ['create_schedules', 'manage_routes', 'assign_drivers']
    },
    dispatcher: {
      label: 'Dispatcher',
      icon: FaUserCog,
      color: 'orange.500',
      description: 'Operations coordination and monitoring',
      requiredFields: ['department'],
      permissions: ['monitor_operations', 'communicate_drivers', 'manage_emergencies']
    },
    admin: {
      label: 'Administrator',
      icon: FaUserTie,
      color: 'red.500',
      description: 'System administration and management',
      requiredFields: ['employeeId', 'department'],
      permissions: ['full_access', 'user_management', 'system_configuration']
    }
  };

  // Enhanced form change handler with validation
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Validation for name fields - only allow letters, spaces, hyphens, and apostrophes
    if ((name === 'firstName' || name === 'lastName') && newValue) {
      if (!/^[a-zA-Z\s'-]*$/.test(newValue)) {
        return; // Don't update if invalid characters
      }
    }
    
    // Validation for phone field - only allow numbers, spaces, parentheses, hyphens, and plus signs
    if (name === 'phone' && newValue) {
      if (!/^[\d\s()+-]*$/.test(newValue)) {
        return; // Don't update if invalid characters
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation
    if (validationRules[name]) {
      validateField(name, newValue);
    }

    // Update validation progress
    updateValidationProgress();
  }, []);

  // Field validation function
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    let error = null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    } else if (rules.pattern && value && !rules.pattern.test(value)) {
      error = rules.message;
    } else if (rules.minLength && value && value.length < rules.minLength) {
      error = rules.message;
    } else if (rules.maxLength && value && value.length > rules.maxLength) {
      error = rules.message;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return error;
  }, []);

  // Validation progress calculator
  const updateValidationProgress = useCallback(() => {
    const requiredFields = ['email', 'firstName', 'lastName', 'role'];
    const roleRequiredFields = roleConfigs[formData.role]?.requiredFields || [];
    const allRequiredFields = [...requiredFields, ...roleRequiredFields];
    
    const completedFields = allRequiredFields.filter(field => {
      const value = formData[field];
      return value && value.toString().trim() !== '';
    });

    const progress = (completedFields.length / allRequiredFields.length) * 100;
    setValidationProgress(Math.round(progress));
  }, [formData]);

  // Enhanced password generation with strength calculation
  const generateSecurePassword = useCallback((length = 16) => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }, []);

  // Password strength calculator
  const calculatePasswordStrength = useCallback((password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    
    return Math.min(strength, 100);
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Enhanced form submission with comprehensive validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Generate a secure password
      const generatedPassword = generateRandomPassword();

      const userData = {
        email: formData.email,
        password: generatedPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role
      };

      // Add driver-specific fields if role is driver
      if (formData.role === 'driver') {
        userData.licenseNumber = formData.licenseNumber;
      }

      const result = await register(userData);
      
      if (result.success) {
        // Show success message with credentials
        toast({
          title: "User Created Successfully!",
          description: `User account created for ${formData.firstName} ${formData.lastName}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // If send credentials is enabled, show the credentials
        if (formData.sendCredentials) {
          alert(`User Registration Successful!\n\nLogin Credentials:\nEmail: ${formData.email}\nPassword: ${generatedPassword}\n\nPlease send these credentials to the user securely.`);
        }

        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'driver',
          licenseNumber: '',
          sendCredentials: true,
          customMessage: ''
        });
      } else {
        setErrors({ general: result.error });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Navbar />
      
      <Container maxW={cardMaxW} py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          {/* Back to Admin Button - Desktop Only */}
          <Flex mb={2} justifyContent="flex-start" display={{ base: 'none', lg: 'flex' }}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              colorScheme="blue"
            >
              Back to Admin Dashboard
            </Button>
          </Flex>

          {/* Enhanced Header with Breadcrumbs */}
          <ScaleFade in={true} initialScale={0.9}>
            <Card bg={cardBg} borderColor={borderColor} shadow="lg" borderRadius="xl">
              <CardHeader pb={2}>
                <VStack spacing={3} align="stretch">
                  <Breadcrumb fontSize="sm" color={mutedColor} display={{ base: 'none', sm: 'block' }}>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin">Admin Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin/system">System Administration</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                      <BreadcrumbLink>Register New User</BreadcrumbLink>
                    </BreadcrumbItem>
                  </Breadcrumb>

                  <Flex 
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between" 
                    align={{ base: 'start', md: 'center' }} 
                    gap={4}
                  >
                    <HStack spacing={3}>
                      <Box
                        p={3}
                        bg={accentColor}
                        borderRadius="xl"
                        color="white"
                      >
                        <Icon as={FaUserPlus} boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Heading size={{ base: 'md', md: 'lg' }} color={textColor}>
                          Register New User
                        </Heading>
                        <Text fontSize={{ base: 'sm', md: 'md' }} color={mutedColor}>
                          Create user accounts with role-based access and credentials
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Progress and Actions */}
                    <VStack align={{ base: 'start', md: 'end' }} spacing={2}>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color={mutedColor}>
                          Completion: {validationProgress}%
                        </Text>
                        <Progress 
                          value={validationProgress} 
                          size="sm" 
                          w="100px"
                          colorScheme={validationProgress === 100 ? 'green' : 'blue'}
                          borderRadius="full"
                        />
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Tooltip label="View registration history">
                          <IconButton
                            icon={<FaHistory />}
                            size="sm"
                            variant="ghost"
                            onClick={onHistoryOpen}
                            aria-label="Registration history"
                          />
                        </Tooltip>
                        <Tooltip label="Preview registration">
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            onClick={onPreviewOpen}
                            isDisabled={validationProgress < 80}
                            aria-label="Preview registration"
                          />
                        </Tooltip>
                      </HStack>
                    </VStack>
                  </Flex>
                </VStack>
              </CardHeader>
            </Card>
          </ScaleFade>

          {/* Main Registration Form */}
          <ScaleFade in={true} initialScale={0.9}>
            <Card bg={cardBg} borderColor={borderColor} shadow="lg" borderRadius="xl">
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={{ base: 4, md: 6 }} align="stretch">

                {errors.general && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <Box as="form" onSubmit={handleSubmit} width="100%">
                  <VStack spacing={4}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel>First Name</FormLabel>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First name"
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl isRequired>
                          <FormLabel>Last Name</FormLabel>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last name"
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>

                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter user's email"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone number"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Role</FormLabel>
                      <Select name="role" value={formData.role} onChange={handleChange}>
                        <option value="driver">Driver</option>
                        <option value="scheduler">Scheduler</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </FormControl>

                    {formData.role === 'driver' && (
                      <FormControl>
                        <FormLabel>License Number</FormLabel>
                        <Input
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="Driver's license number"
                        />
                      </FormControl>
                    )}

                    <Divider />
                    
                    <Box width="100%">
                      <Heading size="md" color="purple.600" mb={4}>
                        Credential Management
                      </Heading>
                      
                      <VStack spacing={4}>
                        <HStack width="100%" justify="space-between">
                          <Text>Generate and display login credentials</Text>
                          <Switch
                            name="sendCredentials"
                            isChecked={formData.sendCredentials}
                            onChange={handleChange}
                            colorScheme="purple"
                          />
                        </HStack>

                        {formData.sendCredentials && (
                          <FormControl>
                            <FormLabel>Custom Message (Optional)</FormLabel>
                            <Textarea
                              name="customMessage"
                              value={formData.customMessage}
                              onChange={handleChange}
                              placeholder="Add a custom message to include with the credentials..."
                              rows={3}
                            />
                          </FormControl>
                        )}
                      </VStack>
                    </Box>

                    <Button
                      type="submit"
                      colorScheme="purple"
                      width="100%"
                      isLoading={isLoading}
                      loadingText="Creating user..."
                      mt={4}
                      size="lg"
                    >
                      Create User Account
                    </Button>

                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      A secure password will be automatically generated for the user
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </ScaleFade>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminRegistration;