
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only navigate when not loading and user is authenticated
    if (!loading) {
      if (!isAuthenticated || !user) {
        navigate('/login', { replace: true });
        return;
      }

      // Determine role-specific route
      const getDashboardRoute = (role) => {
        switch (role) {
          case 'admin':
            return '/admin';
          case 'scheduler':
            return '/scheduler';
          case 'dispatcher':
            return '/dispatcher';
          case 'driver':
            return '/driver';
          default:
            return '/login';
        }
      };

      // Use user's primary role for routing
      const destination = getDashboardRoute(user.role);
      navigate(destination, { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Show loading spinner
  return (
    <Center minHeight="100vh" bg="gray.50">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">
          {loading ? 'Loading your dashboard...' : 'Redirecting...'}
        </Text>
      </VStack>
    </Center>
  );
};

export default Dashboard;