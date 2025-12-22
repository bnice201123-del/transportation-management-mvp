import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDualLogin } from '../../contexts/useDualLogin';
import { Box, Spinner, Center } from '@chakra-ui/react';

/**
 * ProtectedDriverRoute Component
 * Wraps driver routes to require dual login authentication
 */
const ProtectedDriverRoute = ({ children, requireTracker = false }) => {
  const { driverAuth, trackerAuth, loadingDriver, loadingTracker } =
    useDualLogin();

  // Still loading
  if (loadingDriver || loadingTracker) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.400" />
      </Center>
    );
  }

  // Check driver authentication
  if (!driverAuth.isAuthenticated && !requireTracker) {
    return <Navigate to="/driver/dual-login" replace />;
  }

  // Check tracker authentication if required
  if (requireTracker && !trackerAuth.isAuthenticated) {
    return <Navigate to="/driver/dual-login" replace />;
  }

  return children;
};

export default ProtectedDriverRoute;
