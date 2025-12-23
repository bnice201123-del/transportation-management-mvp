import React, { useState } from 'react';
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
  Card,
  CardBody,
  CardHeader,
  Heading,
  Link,
  Center,
  Container,
  FormErrorMessage,
  Divider,
  HStack,
  useToast,
  Progress,
  List,
  ListItem,
  ListIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import axios from '../../config/axios';
import { 
  formatPhoneNumber, 
  getRawPhoneNumber,
  formatNameInput,
  isValidPhoneNumber,
  isValidEmail,
  validateName,
  isEmpty
} from '../../utils/inputValidation';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';

const AgencyRegistration = () => {
  const [step, setStep] = useState(1); // Step 1: Company Info, Step 2: Admin Account
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { handleInputFocus, handleInputBlur } = useMobileKeyboard();

  // Company Information
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: 'transportation',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Admin Account Information
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false
  });

  const [touched, setTouched] = useState({});

  // Validation for Company Data
  const companyNameValidation = isEmpty(companyData.companyName) 
    ? { isValid: false, error: 'Company name is required' }
    : { isValid: true };
  const isCompanyNameInvalid = touched.companyName && !companyNameValidation.isValid;

  const phoneValidation = isEmpty(companyData.phone)
    ? { isValid: false, error: 'Phone is required' }
    : isValidPhoneNumber(companyData.phone);
  const isCompanyPhoneInvalid = touched.phone && !phoneValidation.isValid;

  const emailValidation = isEmpty(companyData.email)
    ? { isValid: false, error: 'Email is required' }
    : isValidEmail(companyData.email);
  const isCompanyEmailInvalid = touched.email && !emailValidation.isValid;

  const addressValidation = isEmpty(companyData.address)
    ? { isValid: false, error: 'Address is required' }
    : { isValid: true };
  const isAddressInvalid = touched.address && !addressValidation.isValid;

  const cityValidation = isEmpty(companyData.city)
    ? { isValid: false, error: 'City is required' }
    : { isValid: true };
  const isCityInvalid = touched.city && !cityValidation.isValid;

  // Validation for Admin Data
  const firstNameValidation = validateName(adminData.firstName, 'First name');
  const isFirstNameInvalid = touched.firstName && !firstNameValidation.isValid;

  const lastNameValidation = validateName(adminData.lastName, 'Last name');
  const isLastNameInvalid = touched.lastName && !lastNameValidation.isValid;

  const adminEmailValidation = isEmpty(adminData.adminEmail)
    ? { isValid: false, error: 'Admin email is required' }
    : isValidEmail(adminData.adminEmail);
  const isAdminEmailInvalid = touched.adminEmail && !adminEmailValidation.isValid;

  const adminPhoneValidation = isEmpty(adminData.phone)
    ? { isValid: false, error: 'Phone is required' }
    : isValidPhoneNumber(adminData.phone);
  const isAdminPhoneInvalid = touched.phone && !adminPhoneValidation.isValid;

  const isPasswordEmpty = isEmpty(adminData.password);
  const isPasswordTooShort = !isPasswordEmpty && adminData.password.length < 6;
  const isPasswordInvalid = touched.password && (isPasswordEmpty || isPasswordTooShort);
  const passwordError = isPasswordEmpty ? 'Password is required' : 'Password must be at least 6 characters';

  const isConfirmPasswordInvalid = touched.confirmPassword && adminData.password !== adminData.confirmPassword;

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      setCompanyData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
      return;
    }

    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setAdminData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    if (name === 'firstName' || name === 'lastName') {
      setAdminData(prev => ({
        ...prev,
        [name]: formatNameInput(value)
      }));
      return;
    }

    if (name === 'phone') {
      setAdminData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
      return;
    }

    setAdminData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    const newTouched = {
      companyName: true,
      phone: true,
      email: true,
      address: true,
      city: true
    };
    setTouched(newTouched);

    if (!companyNameValidation.isValid || !phoneValidation.isValid || 
        !emailValidation.isValid || !addressValidation.isValid || !cityValidation.isValid) {
      setError('Please fix all errors before proceeding');
      return false;
    }

    setError('');
    return true;
  };

  const validateStep2 = () => {
    const newTouched = {
      ...touched,
      firstName: true,
      lastName: true,
      adminEmail: true,
      password: true,
      confirmPassword: true,
      phone: true
    };
    setTouched(newTouched);

    if (!firstNameValidation.isValid || !lastNameValidation.isValid ||
        !adminEmailValidation.isValid || isPasswordInvalid || isConfirmPasswordInvalid ||
        !adminPhoneValidation.isValid || !adminData.agreeToTerms) {
      setError('Please fix all errors before submitting');
      return false;
    }

    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine company and admin data
      const registrationData = {
        companyName: companyData.companyName,
        email: adminData.adminEmail,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: getRawPhoneNumber(adminData.phone),
        role: 'admin',
        companyPhone: getRawPhoneNumber(companyData.phone),
        companyEmail: companyData.email,
        companyAddress: companyData.address,
        companyCity: companyData.city,
        companyState: companyData.state,
        companyZipCode: companyData.zipCode,
        companyIndustry: companyData.industry
      };

      // Register the agency
      const response = await axios.post('/api/auth/register-agency', registrationData);

      if (response.data.success) {
        toast({
          title: 'Registration Successful!',
          description: 'Your agency has been registered. Redirecting to login...',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Agency registered successfully! Please log in with your credentials.',
              email: adminData.adminEmail 
            } 
          });
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Registration Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Center minHeight="100vh" py={10}>
      <Container maxW="lg">
        <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
          <CardHeader bg="brand.500" color="white" borderRadius="md 0 0 0">
            <Heading size="lg">Register Your Transportation Agency</Heading>
            <Text mt={2} fontSize="sm" opacity={0.9}>
              Create an account to get started with our platform
            </Text>
          </CardHeader>

          <CardBody>
            {/* Progress Bar */}
            <Box mb={6}>
              <HStack justify="space-between" mb={3}>
                <Text fontSize="sm" fontWeight="bold">
                  Step {step} of 2
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {step === 1 ? 'Company Information' : 'Admin Account'}
                </Text>
              </HStack>
              <Progress value={step === 1 ? 50 : 100} colorScheme="brand" size="md" borderRadius="full" />
            </Box>

            {error && (
              <Alert status="error" mb={6} borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Registration Error</Text>
                  <Text fontSize="sm">{error}</Text>
                </Box>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* STEP 1: Company Information */}
              {step === 1 && (
                <VStack spacing={5}>
                  <Heading size="md" alignSelf="flex-start" color="brand.600">
                    Company Information
                  </Heading>

                  <FormControl isInvalid={isCompanyNameInvalid}>
                    <FormLabel fontWeight="bold">Company Name *</FormLabel>
                    <Input
                      name="companyName"
                      value={companyData.companyName}
                      onChange={handleCompanyChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, companyName: true })}
                      placeholder="e.g., ABC Transportation Services"
                      size="lg"
                    />
                    <FormErrorMessage>{companyNameValidation.error}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isCompanyEmailInvalid}>
                    <FormLabel fontWeight="bold">Company Email *</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={companyData.email}
                      onChange={handleCompanyChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, email: true })}
                      placeholder="contact@yourcompany.com"
                      size="lg"
                    />
                    <FormErrorMessage>{emailValidation.error}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isCompanyPhoneInvalid}>
                    <FormLabel fontWeight="bold">Company Phone *</FormLabel>
                    <Input
                      name="phone"
                      value={companyData.phone}
                      onChange={handleCompanyChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, phone: true })}
                      placeholder="(555) 123-4567"
                      size="lg"
                    />
                    <FormErrorMessage>{phoneValidation.error}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isAddressInvalid}>
                    <FormLabel fontWeight="bold">Street Address *</FormLabel>
                    <Input
                      name="address"
                      value={companyData.address}
                      onChange={handleCompanyChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, address: true })}
                      placeholder="123 Main Street"
                      size="lg"
                    />
                    <FormErrorMessage>{addressValidation.error}</FormErrorMessage>
                  </FormControl>

                  <HStack width="full" spacing={4}>
                    <FormControl isInvalid={isCityInvalid}>
                      <FormLabel fontWeight="bold">City *</FormLabel>
                      <Input
                        name="city"
                        value={companyData.city}
                        onChange={handleCompanyChange}
                        onFocus={handleInputFocus}
                        onBlur={() => setTouched({ ...touched, city: true })}
                        placeholder="New York"
                        size="lg"
                      />
                      <FormErrorMessage>{cityValidation.error}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="bold">State</FormLabel>
                      <Input
                        name="state"
                        value={companyData.state}
                        onChange={handleCompanyChange}
                        onFocus={handleInputFocus}
                        placeholder="NY"
                        size="lg"
                        maxLength={2}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="bold">ZIP Code</FormLabel>
                      <Input
                        name="zipCode"
                        value={companyData.zipCode}
                        onChange={handleCompanyChange}
                        onFocus={handleInputFocus}
                        placeholder="10001"
                        size="lg"
                      />
                    </FormControl>
                  </HStack>

                  <Button
                    width="full"
                    colorScheme="brand"
                    size="lg"
                    mt={4}
                    onClick={handleNextStep}
                  >
                    Continue to Admin Account
                  </Button>

                  <Divider my={4} />

                  <HStack width="full" justify="center" fontSize="sm">
                    <Text>Already have an account?</Text>
                    <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
                      Sign In
                    </Link>
                  </HStack>
                </VStack>
              )}

              {/* STEP 2: Admin Account */}
              {step === 2 && (
                <VStack spacing={5}>
                  <Heading size="md" alignSelf="flex-start" color="brand.600">
                    Admin Account Setup
                  </Heading>

                  <Text fontSize="sm" color="gray.600">
                    Create the administrator account for <strong>{companyData.companyName}</strong>
                  </Text>

                  <HStack width="full" spacing={4}>
                    <FormControl isInvalid={isFirstNameInvalid}>
                      <FormLabel fontWeight="bold">First Name *</FormLabel>
                      <Input
                        name="firstName"
                        value={adminData.firstName}
                        onChange={handleAdminChange}
                        onFocus={handleInputFocus}
                        onBlur={() => setTouched({ ...touched, firstName: true })}
                        placeholder="John"
                        size="lg"
                      />
                      <FormErrorMessage>{firstNameValidation.error}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={isLastNameInvalid}>
                      <FormLabel fontWeight="bold">Last Name *</FormLabel>
                      <Input
                        name="lastName"
                        value={adminData.lastName}
                        onChange={handleAdminChange}
                        onFocus={handleInputFocus}
                        onBlur={() => setTouched({ ...touched, lastName: true })}
                        placeholder="Doe"
                        size="lg"
                      />
                      <FormErrorMessage>{lastNameValidation.error}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <FormControl isInvalid={isAdminEmailInvalid}>
                    <FormLabel fontWeight="bold">Admin Email *</FormLabel>
                    <Input
                      name="adminEmail"
                      type="email"
                      value={adminData.adminEmail}
                      onChange={handleAdminChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, adminEmail: true })}
                      placeholder="admin@yourcompany.com"
                      size="lg"
                    />
                    <FormErrorMessage>{adminEmailValidation.error}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isAdminPhoneInvalid}>
                    <FormLabel fontWeight="bold">Phone *</FormLabel>
                    <Input
                      name="phone"
                      value={adminData.phone}
                      onChange={handleAdminChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, phone: true })}
                      placeholder="(555) 987-6543"
                      size="lg"
                    />
                    <FormErrorMessage>{adminPhoneValidation.error}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isPasswordInvalid}>
                    <FormLabel fontWeight="bold">Password *</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      value={adminData.password}
                      onChange={handleAdminChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      placeholder="Enter a strong password"
                      size="lg"
                    />
                    <FormErrorMessage>{passwordError}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isConfirmPasswordInvalid}>
                    <FormLabel fontWeight="bold">Confirm Password *</FormLabel>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={adminData.confirmPassword}
                      onChange={handleAdminChange}
                      onFocus={handleInputFocus}
                      onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                      placeholder="Confirm your password"
                      size="lg"
                    />
                    <FormErrorMessage>
                      {isConfirmPasswordInvalid && 'Passwords do not match'}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Terms and Conditions */}
                  <FormControl isInvalid={touched.agreeToTerms && !adminData.agreeToTerms}>
                    <HStack spacing={3}>
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={adminData.agreeToTerms}
                        onChange={handleAdminChange}
                      />
                      <Text fontSize="sm">
                        I agree to the{' '}
                        <Link as={RouterLink} to="#" color="brand.500">
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link as={RouterLink} to="#" color="brand.500">
                          Privacy Policy
                        </Link>
                      </Text>
                    </HStack>
                    {touched.agreeToTerms && !adminData.agreeToTerms && (
                      <Text color="red.500" fontSize="sm" mt={2}>
                        You must agree to the terms and conditions
                      </Text>
                    )}
                  </FormControl>

                  {/* Password Requirements */}
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box fontSize="sm">
                      <Text fontWeight="bold" mb={2}>Password Requirements:</Text>
                      <List spacing={1}>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          At least 6 characters
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          Mix of uppercase and lowercase letters
                        </ListItem>
                        <ListItem>
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          Include numbers or special characters
                        </ListItem>
                      </List>
                    </Box>
                  </Alert>

                  <Button
                    width="full"
                    colorScheme="brand"
                    size="lg"
                    isLoading={loading}
                    type="submit"
                  >
                    Create Agency Account
                  </Button>

                  <Button
                    width="full"
                    variant="outline"
                    size="lg"
                    onClick={handlePreviousStep}
                    isDisabled={loading}
                  >
                    Back to Company Info
                  </Button>

                  <Divider my={4} />

                  <HStack width="full" justify="center" fontSize="sm">
                    <Text>Already have an account?</Text>
                    <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
                      Sign In
                    </Link>
                  </HStack>
                </VStack>
              )}
            </form>
          </CardBody>
        </Card>
      </Container>
    </Center>
  );
};

export default AgencyRegistration;
