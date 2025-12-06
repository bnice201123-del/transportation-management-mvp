import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Center,
  VStack,
  Spinner,
  Text,
  Icon,
  useToast
} from '@chakra-ui/react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * OAuth Callback Handler
 * Handles the OAuth provider callback and processes the JWT token
 * Route: /auth/callback
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get token and provider from URL params
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        toast({
          title: 'Authentication Failed',
          description: getErrorMessage(error),
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      if (!token) {
        throw new Error('No token received from OAuth provider');
      }

      // Store the token
      localStorage.setItem('token', token);

      // Store provider info
      localStorage.setItem('loginMethod', `${provider}_oauth`);

      setStatus('success');

      toast({
        title: 'Login Successful',
        description: `Successfully authenticated with ${capitalizeFirst(provider)}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // Get redirect path from sessionStorage or default to dashboard
      const redirectPath = sessionStorage.getItem('oauth_redirect') || '/dashboard';
      sessionStorage.removeItem('oauth_redirect');

      // Redirect after a brief delay
      setTimeout(() => {
        navigate(redirectPath);
        // Reload to update auth state
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      
      toast({
        title: 'Authentication Error',
        description: 'Failed to process authentication. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  const getErrorMessage = (error) => {
    const errorMessages = {
      'google_auth_failed': 'Google authentication failed. Please try again.',
      'google_callback_failed': 'Failed to process Google authentication.',
      'microsoft_auth_failed': 'Microsoft authentication failed. Please try again.',
      'microsoft_callback_failed': 'Failed to process Microsoft authentication.',
      'apple_auth_failed': 'Apple authentication failed. Please try again.',
      'apple_callback_failed': 'Failed to process Apple authentication.',
      'no_email': 'No email address found in your account.',
      'account_disabled': 'Your account has been disabled.'
    };

    return errorMessages[error] || 'An error occurred during authentication.';
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Center minH="100vh" bg="gray.50">
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        maxW="md"
        w="full"
      >
        <VStack spacing={6}>
          {status === 'processing' && (
            <>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="semibold">
                  Authenticating...
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Please wait while we complete your login
                </Text>
              </VStack>
            </>
          )}

          {status === 'success' && (
            <>
              <Icon
                as={CheckCircleIcon}
                w={16}
                h={16}
                color="green.500"
              />
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="semibold" color="green.600">
                  Authentication Successful!
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Redirecting you to the application...
                </Text>
              </VStack>
            </>
          )}

          {status === 'error' && (
            <>
              <Icon
                as={ExclamationCircleIcon}
                w={16}
                h={16}
                color="red.500"
              />
              <VStack spacing={2}>
                <Text fontSize="xl" fontWeight="semibold" color="red.600">
                  Authentication Failed
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Redirecting you back to login...
                </Text>
              </VStack>
            </>
          )}
        </VStack>
      </Box>
    </Center>
  );
};

export default OAuthCallback;
