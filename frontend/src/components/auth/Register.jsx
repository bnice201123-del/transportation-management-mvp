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
  Heading,
  Link,
  Center,
  Container,
  Select,
  Grid,
  GridItem,
  FormErrorMessage
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
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

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'driver',
    licenseNumber: ''
  });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  
  // Mobile keyboard handling
  const { handleInputFocus, handleInputBlur } = useMobileKeyboard();

  // Validation helpers
  const firstNameValidation = validateName(formData.firstName, 'First name');
  const isFirstNameInvalid = touched.firstName && !firstNameValidation.isValid;

  const lastNameValidation = validateName(formData.lastName, 'Last name');
  const isLastNameInvalid = touched.lastName && !lastNameValidation.isValid;

  const emailValidation = isValidEmail(formData.email);
  const isEmailInvalid = touched.email && !emailValidation.isValid;

  const phoneValidation = isValidPhoneNumber(formData.phone);
  const isPhoneInvalid = touched.phone && !isEmpty(formData.phone) && !phoneValidation.isValid;

  const isPasswordEmpty = isEmpty(formData.password);
  const isPasswordTooShort = !isPasswordEmpty && formData.password.length < 6;
  const isPasswordInvalid = touched.password && (isPasswordEmpty || isPasswordTooShort);
  const passwordError = isPasswordEmpty ? 'Password is required' : 'Password must be at least 6 characters long';

  const isConfirmPasswordInvalid = touched.confirmPassword && formData.password !== formData.confirmPassword;


  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for name fields - only allow letters, spaces, hyphens, and apostrophes
    if (name === 'firstName' || name === 'lastName') {
      setFormData(prev => ({
        ...prev,
        [name]: formatNameInput(value)
      }));
      return;
    }
    
    // Validation for phone field - format as (XXX) XXX-XXXX
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      firstName: true,
      lastName: true,
      phone: true,
      licenseNumber: true
    });

    // Validate first name
    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      setError(firstNameValidation.error);
      return;
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      setError(lastNameValidation.error);
      return;
    }

    // Validate email
    const emailValidation = isValidEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    // Validate phone (optional but must be valid if provided)
    if (!isEmpty(formData.phone)) {
      const phoneValidation = isValidPhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        setError(phoneValidation.error);
        return;
      }
    }

    // Validate password
    if (isEmpty(formData.password)) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate driver-specific fields
    if (formData.role === 'driver' && isEmpty(formData.licenseNumber)) {
      setError('License number is required for drivers');
      return;
    }

    // Prepare data for submission
    const userData = {
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: getRawPhoneNumber(formData.phone), // Store raw phone number
      role: formData.role
    };

    // Add driver-specific fields if role is driver
    if (formData.role === 'driver') {
      userData.licenseNumber = formData.licenseNumber.trim();
    }

    const result = await register(userData);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <Center minHeight="100vh" bg="gray.50" p={4}>
      <Container maxW="container.sm" centerContent>
        <Box 
          width="100%" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
      <Card width="100%" maxW="600px" shadow="lg">
        <CardBody>
          <VStack spacing={6}>
            <Heading textAlign="center" color="blue.600" size="lg">
              Register New Account
            </Heading>
              <Text textAlign="center" color="gray.600">
                Create your transportation system account
              </Text>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Box as="form" onSubmit={handleSubmit} width="100%">
                <VStack spacing={4}>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                    <GridItem>
                      <FormControl isRequired isInvalid={isFirstNameInvalid}>
                        <FormLabel>First Name</FormLabel>
                        <Input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          onFocus={handleInputFocus}
                          onBlur={(e) => {
                            setTouched(prev => ({ ...prev, firstName: true }));
                            handleInputBlur(e);
                          }}
                          placeholder="First name"
                        />
                        <FormErrorMessage>
                          {firstNameValidation.error}
                        </FormErrorMessage>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired isInvalid={isLastNameInvalid}>
                        <FormLabel>Last Name</FormLabel>
                        <Input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          onFocus={handleInputFocus}
                          onBlur={(e) => {
                            setTouched(prev => ({ ...prev, lastName: true }));
                            handleInputBlur(e);
                          }}
                          placeholder="Last name"
                        />
                        <FormErrorMessage>
                          {lastNameValidation.error}
                        </FormErrorMessage>
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <FormControl isRequired isInvalid={isEmailInvalid}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, email: true }));
                        handleInputBlur(e);
                      }}
                      placeholder="Enter your email"
                    />
                    <FormErrorMessage>
                      {emailValidation.error}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={isPhoneInvalid}>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, phone: true }));
                        handleInputBlur(e);
                      }}
                      placeholder="(555) 123-4567"
                      maxLength={14}
                    />
                    <FormErrorMessage>
                      {phoneValidation.error}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Role</FormLabel>
                    <Select name="role" value={formData.role} onChange={handleChange}>
                      <option value="driver">Driver</option>
                      <option value="scheduler">Scheduler</option>
                      <option value="dispatcher">Dispatcher</option>
                    </Select>
                  </FormControl>

                  {formData.role === 'driver' && (
                    <>
                      <FormControl>
                        <FormLabel>License Number</FormLabel>
                        <Input
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="Driver's license number"
                        />
                      </FormControl>


                    </>
                  )}

                  <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                    <GridItem>
                      <FormControl isRequired isInvalid={isPasswordInvalid}>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={handleInputFocus}
                          onBlur={(e) => {
                            setTouched(prev => ({ ...prev, password: true }));
                            handleInputBlur(e);
                          }}
                          placeholder="Enter your password"
                        />
                        <FormErrorMessage>
                          {passwordError}
                        </FormErrorMessage>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired isInvalid={isConfirmPasswordInvalid}>
                        <FormLabel>Confirm Password</FormLabel>
                        <Input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={handleInputFocus}
                          onBlur={(e) => {
                            setTouched(prev => ({ ...prev, confirmPassword: true }));
                            handleInputBlur(e);
                          }}
                          placeholder="Confirm your password"
                        />
                        <FormErrorMessage>
                          Passwords do not match
                        </FormErrorMessage>
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    mt={4}
                  >
                    Create Account
                  </Button>
                </VStack>
              </Box>

              <Text textAlign="center">
                Already have an account?{' '}
                <Link as={RouterLink} to="/login" color="blue.600">
                  Sign in here
                </Link>
              </Text>
            </VStack>
          </CardBody>
        </Card>
        </Box>
      </Container>
    </Center>
  );
};

export default Register;