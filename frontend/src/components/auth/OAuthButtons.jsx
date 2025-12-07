import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Divider,
  Icon,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import axios from 'axios';

// Social provider icons (using simple SVG paths)
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#00a4ef" d="M13 1h10v10H13z" />
    <path fill="#7fba00" d="M1 13h10v10H1z" />
    <path fill="#ffb900" d="M13 13h10v10H13z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

/**
 * OAuth Login Buttons Component
 * Provides social login options with Google, Microsoft, and Apple
 * 
 * @param {Object} props
 * @param {string} props.redirectPath - Path to redirect after successful login (default: '/dashboard')
 * @param {Function} props.onSuccess - Callback function on successful OAuth
 * @param {Function} props.onError - Callback function on OAuth error
 */
const OAuthButtons = ({ redirectPath = '/dashboard', onSuccess, onError }) => {
  const [providers, setProviders] = useState({
    google: false,
    microsoft: false,
    apple: false
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    checkOAuthStatus();
  }, []);

  const checkOAuthStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/oauth/status`
      );
      if (response.data.success) {
        setProviders(response.data.providers);
      }
    } catch (error) {
      console.error('Error checking OAuth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Store redirect path in sessionStorage for use after OAuth callback
      sessionStorage.setItem('oauth_redirect', redirectPath);
      
      // Redirect to OAuth provider
      window.location.href = `${backendUrl}/api/auth/${provider}`;
    } catch (error) {
      console.error(`Error initiating ${provider} OAuth:`, error);
      toast({
        title: 'Authentication Error',
        description: `Failed to initiate ${provider} login. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      if (onError) {
        onError(error);
      }
    }
  };

  // Check if any providers are enabled
  const hasProviders = providers.google || providers.microsoft || providers.apple;

  if (loading) {
    return (
      <Center py={4}>
        <Spinner size="sm" />
      </Center>
    );
  }

  if (!hasProviders) {
    return null; // Don't show anything if no providers are configured
  }

  return (
    <Box width="100%">
      <HStack spacing={4} mb={4}>
        <Divider />
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
          Or continue with
        </Text>
        <Divider />
      </HStack>

      <VStack spacing={3} width="100%">
        {providers.google && (
          <Button
            width="100%"
            variant="outline"
            leftIcon={<GoogleIcon />}
            onClick={() => handleOAuthLogin('google')}
            _hover={{ bg: 'gray.50' }}
            height="44px"
          >
            Continue with Google
          </Button>
        )}

        {providers.microsoft && (
          <Button
            width="100%"
            variant="outline"
            leftIcon={<MicrosoftIcon />}
            onClick={() => handleOAuthLogin('microsoft')}
            _hover={{ bg: 'gray.50' }}
            height="44px"
          >
            Continue with Microsoft
          </Button>
        )}

        {providers.apple && (
          <Button
            width="100%"
            variant="outline"
            leftIcon={<AppleIcon />}
            onClick={() => handleOAuthLogin('apple')}
            _hover={{ bg: 'gray.50' }}
            height="44px"
          >
            Continue with Apple
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default OAuthButtons;
