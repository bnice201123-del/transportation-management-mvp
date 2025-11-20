import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Memoize the dashboard route calculation to prevent unnecessary re-renders
  const dashboardRoute = useMemo(() => {
    if (!user) return '/login';

    const getDashboardRoute = (role) => {
      switch (role) {
        case 'admin':
          return '/admin/overview';
        case 'scheduler':
          return '/scheduler';
        case 'dispatcher':
          return '/dispatcher';
        case 'driver':
          return '/driver-dashboard';
        default:
          return '/login';
      }
    };

    // Get active role from localStorage or use user's primary role
    const activeRole = localStorage.getItem('activeRole');
    const userRoles = user.roles || [user.role];
    
    // Use activeRole if it's valid for this user, otherwise use first role in array
    let roleToUse = user.role;
    if (activeRole && userRoles.includes(activeRole)) {
      roleToUse = activeRole;
    } else if (userRoles.length > 0) {
      roleToUse = userRoles[0];
    }

    return getDashboardRoute(roleToUse);
  }, [user]);

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
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard
  return <Navigate to={dashboardRoute} replace />;
};

export default Dashboard;