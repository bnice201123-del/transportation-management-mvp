import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Icon,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Center
} from '@chakra-ui/react';
import { 
  LinkIcon, 
  TrashIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * OAuth Account Management Component
 * Allows users to view, link, and unlink OAuth providers
 * Displayed in user profile/settings
 */
const OAuthAccountManagement = () => {
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlinkProvider, setUnlinkProvider] = useState(null);
  const toast = useToast();
  const cancelRef = React.useRef();

  useEffect(() => {
    fetchLinkedProviders();
  }, []);

  const fetchLinkedProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/oauth/linked`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setLinkedProviders(response.data.providers);
        setHasPassword(response.data.hasPassword);
      }
    } catch (error) {
      console.error('Error fetching linked providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load linked accounts',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/oauth/link/${provider}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.redirectUrl) {
        // Store that we're linking (not logging in)
        sessionStorage.setItem('oauth_action', 'link');
        // Redirect to OAuth provider
        window.location.href = response.data.redirectUrl;
      }
    } catch (error) {
      console.error(`Error linking ${provider}:`, error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to link ${provider} account`,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleUnlinkProvider = async () => {
    if (!unlinkProvider) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/oauth/${unlinkProvider}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: response.data.message,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        
        // Refresh linked providers
        fetchLinkedProviders();
      }
    } catch (error) {
      console.error(`Error unlinking ${unlinkProvider}:`, error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unlink account',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setUnlinkProvider(null);
    }
  };

  const getProviderIcon = (provider) => {
    // Return appropriate icon based on provider
    return <Icon as={LinkIcon} boxSize={5} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isProviderLinked = (provider) => {
    return linkedProviders.some(p => p.provider === provider);
  };

  const canUnlink = () => {
    // User must have either a password or at least one other OAuth provider
    return hasPassword || linkedProviders.length > 1;
  };

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  const allProviders = ['google', 'microsoft', 'apple'];

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>
            Connected Accounts
          </Text>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Link your social accounts for easier sign-in
          </Text>
        </Box>

        {allProviders.map((provider) => {
          const linked = linkedProviders.find(p => p.provider === provider);
          const isLinked = !!linked;

          return (
            <Box
              key={provider}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg={isLinked ? 'green.50' : 'white'}
              borderColor={isLinked ? 'green.200' : 'gray.200'}
            >
              <HStack justify="space-between">
                <HStack spacing={3}>
                  {getProviderIcon(provider)}
                  <VStack align="start" spacing={0}>
                    <HStack>
                      <Text fontWeight="semibold" textTransform="capitalize">
                        {provider}
                      </Text>
                      {isLinked && (
                        <Badge colorScheme="green" size="sm">
                          <HStack spacing={1}>
                            <Icon as={CheckCircleIcon} boxSize={3} />
                            <Text>Connected</Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                    {isLinked && (
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.600">
                          {linked.email}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Linked: {formatDate(linked.linkedAt)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Last used: {formatDate(linked.lastUsed)}
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                </HStack>

                {isLinked ? (
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<Icon as={TrashIcon} boxSize={4} />}
                    onClick={() => setUnlinkProvider(provider)}
                    isDisabled={!canUnlink()}
                  >
                    Unlink
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<Icon as={LinkIcon} boxSize={4} />}
                    onClick={() => handleLinkProvider(provider)}
                  >
                    Link
                  </Button>
                )}
              </HStack>
            </Box>
          );
        })}

        {!hasPassword && linkedProviders.length === 1 && (
          <Box
            p={3}
            bg="yellow.50"
            borderRadius="md"
            borderWidth="1px"
            borderColor="yellow.200"
          >
            <Text fontSize="sm" color="yellow.800">
              ⚠️ You must set a password or link another account before unlinking your only login method.
            </Text>
          </Box>
        )}
      </VStack>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        isOpen={!!unlinkProvider}
        leastDestructiveRef={cancelRef}
        onClose={() => setUnlinkProvider(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Unlink {unlinkProvider?.charAt(0).toUpperCase() + unlinkProvider?.slice(1)} Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to unlink your {unlinkProvider} account? 
              You will no longer be able to sign in using this provider.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setUnlinkProvider(null)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleUnlinkProvider} ml={3}>
                Unlink
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default OAuthAccountManagement;
