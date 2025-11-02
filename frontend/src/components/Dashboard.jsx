import React from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Debug logging
  console.log('Dashboard - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <Center minHeight="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600">Loading your dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Dashboard - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/overview';
      case 'scheduler':
        return '/scheduler';
      case 'dispatcher':
        return '/dispatcher';
      case 'driver':
        return '/driver';
      default:
        return '/login'; // Fallback for unknown roles
    }
  };

  const dashboardRoute = getDashboardRoute(user?.role);
  console.log('Dashboard - Redirecting to:', dashboardRoute, 'for role:', user?.role);

  // Redirect to appropriate dashboard
  return <Navigate to={dashboardRoute} replace />;
};

export default Dashboard;