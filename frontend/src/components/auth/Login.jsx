import React, { useState, useEffect } from 'react';
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
  FormErrorMessage,
  Divider,
  HStack,
  Icon,
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { isValidEmail, isEmpty } from '../../utils/inputValidation';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';
import { FaFingerprint } from 'react-icons/fa';
import axios from '../../config/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Mobile keyboard handling
  const { handleInputFocus, handleInputBlur } = useMobileKeyboard();

  // Check biometric support on mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const supported = window.PublicKeyCredential !== undefined &&
                         navigator.credentials !== undefined;
        if (supported) {
          const res = await axios.get('/api/biometric/supported');
          setBiometricSupported(res.data.supported);
        }
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setBiometricSupported(false);
      }
    };
    checkBiometricSupport();
  }, []);

  // Validation helpers using enhanced validation
  const emailValidation = isValidEmail(email);
  const isEmailInvalid = touched.email && !emailValidation.isValid;
  const emailError = isEmailInvalid ? emailValidation.error : '';

  const isPasswordEmpty = isEmpty(password);
  const isPasswordTooShort = !isPasswordEmpty && password.trim().length < 6;
  const isPasswordInvalid = touched.password && (isPasswordEmpty || isPasswordTooShort);
  const passwordError = isPasswordInvalid 
    ? (isPasswordEmpty ? 'Password is required' : 'Password must be at least 6 characters long')
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched for validation
    setTouched({ email: true, password: true });

    // Validate email using enhanced validation
    const emailValidation = isValidEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    // Validate password
    const trimmedPassword = password.trim();
    if (isEmpty(trimmedPassword)) {
      setError('Password is required');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const trimmedEmail = email.trim();
    const result = await login(trimmedEmail, trimmedPassword);
    
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

  const handleBiometricLogin = async () => {
    try {
      setBiometricLoading(true);
      setError('');

      // Helper functions for base64url encoding/decoding
      const base64urlToArrayBuffer = (base64url) => {
        const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer;
      };

      const arrayBufferToBase64url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      };

      // Step 1: Begin authentication - get challenge from server
      const beginRes = await axios.post('/api/biometric/authenticate/begin');
      const { options } = beginRes.data;

      // Convert challenge and allowCredentials from base64url to ArrayBuffer
      options.challenge = base64urlToArrayBuffer(options.challenge);
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(cred => ({
          ...cred,
          id: base64urlToArrayBuffer(cred.id)
        }));
      }

      // Step 2: Get credential from authenticator
      const credential = await navigator.credentials.get({
        publicKey: options
      });

      if (!credential) {
        throw new Error('No credential received from authenticator');
      }

      // Step 3: Send credential to server for verification
      const credentialData = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: arrayBufferToBase64url(credential.response.authenticatorData),
          signature: arrayBufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle 
            ? arrayBufferToBase64url(credential.response.userHandle)
            : null
        }
      };

      const authRes = await axios.post('/api/biometric/authenticate/complete', credentialData);

      // Store token and user data
      localStorage.setItem('token', authRes.data.token);
      
      toast({
        title: 'Success',
        description: 'Logged in successfully with biometric authentication',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to appropriate dashboard
      const userRole = authRes.data.user?.role;
      const roleRoutes = {
        'admin': '/admin/overview',
        'scheduler': '/scheduler',
        'dispatcher': '/dispatcher',
        'driver': '/driver'
      };
      
      const destination = roleRoutes[userRole] || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Biometric login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Biometric authentication failed';
      setError(errorMessage);
      toast({
        title: 'Authentication Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBiometricLoading(false);
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
              color="brand.600" 
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
                  <FormControl isRequired isInvalid={isEmailInvalid}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={(e) => {
                        setTouched(prev => ({ ...prev, email: true }));
                        handleInputBlur(e);
                      }}
                      placeholder="Enter your email"
                    />
                    <FormErrorMessage>
                      {emailError}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={isPasswordInvalid}>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                  <Button
                    type="submit"
                    colorScheme="brand"
                    width="100%"
                    isLoading={loading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>

                  {biometricSupported && (
                    <>
                      <HStack width="100%">
                        <Divider />
                        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={2}>
                          OR
                        </Text>
                        <Divider />
                      </HStack>

                      <Button
                        variant="outline"
                        colorScheme="purple"
                        width="100%"
                        leftIcon={<Icon as={FaFingerprint} />}
                        onClick={handleBiometricLogin}
                        isLoading={biometricLoading}
                        loadingText="Authenticating..."
                      >
                        Sign In with Biometric
                      </Button>
                    </>
                  )}
                </VStack>
              </Box>

              <Divider my={4} />

              <VStack spacing={3} width="100%" textAlign="center">
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    New to our platform?
                  </Text>
                  <Link
                    as={RouterLink}
                    to="/register"
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Button
                      width="full"
                      variant="outline"
                      colorScheme="brand"
                      size="md"
                    >
                      Create Agency Account
                    </Button>
                  </Link>
                </Box>

                <Text textAlign="center" color="gray.500" fontSize="xs">
                  Existing employee? Contact your administrator for credentials.
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
        </Box>
      </Container>
    </Center>
  );
};

export default Login;
