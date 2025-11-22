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
  GridItem
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

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
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for name fields - only allow letters, spaces, hyphens, and apostrophes
    if ((name === 'firstName' || name === 'lastName') && value) {
      if (!/^[a-zA-Z\s'-]*$/.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    // Validation for phone field - only allow numbers, spaces, parentheses, hyphens, and plus signs
    if (name === 'phone' && value) {
      if (!/^[\d\s()+-]*$/.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Prepare data for submission
    const userData = {
      email: formData.email,
      password: formData.password,
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
                      placeholder="Enter your email"
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
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Confirm Password</FormLabel>
                        <Input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                        />
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