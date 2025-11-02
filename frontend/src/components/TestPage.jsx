import React from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TestPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Box p={8} bg="green.50" minHeight="100vh">
      <VStack spacing={6}>
        <Heading color="green.600">🎉 Test Page Reached!</Heading>
        <Text fontSize="lg">Navigation is working correctly.</Text>
        
        <Box p={4} bg="white" borderRadius="md" shadow="md">
          <Text><strong>Authentication Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</Text>
          <Text><strong>User:</strong> {user ? `${user.email} (${user.role})` : 'No user data'}</Text>
        </Box>

        <VStack spacing={3}>
          <Button colorScheme="blue" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button colorScheme="gray" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
          <Button colorScheme="red" onClick={logout}>
            Logout
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default TestPage;