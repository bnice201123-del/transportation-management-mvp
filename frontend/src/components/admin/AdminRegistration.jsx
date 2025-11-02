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
  Center,
  Container,
  Select,
  Grid,
  GridItem,
  Switch,
  HStack,
  Textarea,
  useToast,
  Divider
} from '@chakra-ui/react';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';

const AdminRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'driver',
    licenseNumber: '',
    sendCredentials: true,
    customMessage: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        setError(result.error);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="gray.50" minH="100vh">
      <Navbar title="User Registration" />
      
      <Container maxW="container.md" pt={20}>
        <Center>
          <Card width="100%" maxW="600px" shadow="lg">
            <CardBody>
              <VStack spacing={6}>
                <Heading textAlign="center" color="purple.600" size="lg">
                  Register New User
                </Heading>
                <Text textAlign="center" color="gray.600">
                  Create user accounts and manage login credentials
                </Text>

                {error && (
                  <Alert status="error" borderRadius="md">
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
        </Center>
      </Container>
    </Box>
  );
};

export default AdminRegistration;