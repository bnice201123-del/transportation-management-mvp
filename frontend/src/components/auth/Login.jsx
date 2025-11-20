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
  Container
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    } else {
      // Navigate directly to role-specific dashboard
      const userRole = result.user?.role;
      const roleRoutes = {
        'admin': '/admin/overview',
        'scheduler': '/scheduler',
        'dispatcher': '/dispatcher',
        'driver': '/driver'
      };
      
      const destination = roleRoutes[userRole] || '/dashboard';
      navigate(destination, { replace: true });
    }
  };

  return (
    <Center minHeight="calc(100vh - 200px)" bg="gray.50" p={{ base: 4, md: 8 }} py={{ base: 8, md: 16 }}>
      <Container maxW={{ base: "container.sm", md: "container.md" }} centerContent>
        <Box 
          width="100%" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
        >
      <Card width="100%" maxW={{ base: "350px", md: "450px" }} shadow="lg">
        <CardBody p={{ base: 6, md: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }}>
            <Heading 
              textAlign="center" 
              color="blue.600" 
              size={{ base: "md", md: "lg" }}
            >
              Transportation System
            </Heading>
              <Text 
                textAlign="center" 
                color="gray.600"
                fontSize={{ base: "sm", md: "md" }}
              >
                Sign in to your account
              </Text>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Box as="form" onSubmit={handleSubmit} width="100%">
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={loading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>
              </Box>

              <Text textAlign="center" color="gray.500" fontSize="sm">
                Need an account? Contact your administrator.
              </Text>
            </VStack>
          </CardBody>
        </Card>
        </Box>
      </Container>
    </Center>
  );
};

export default Login;