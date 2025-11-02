import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import components
import Dashboard from './components/Dashboard';
import TestPage from './components/TestPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SchedulerDashboard from './components/scheduler/SchedulerDashboard';
import DispatcherDashboard from './components/dispatcher/DispatcherDashboard';
import SimpleDriverDashboard from './components/driver/SimpleDriverDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOverview from './components/admin/AdminOverview';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminReports from './components/admin/AdminReports';
import AdminRegistration from './components/admin/AdminRegistration';
import ErrorBoundary from './components/shared/ErrorBoundary';
import RidersDashboard from './components/riders/RidersDashboard';
import VehiclesDashboard from './components/vehicles/VehiclesDashboard';
import MapsDashboard from './components/maps/MapsDashboard';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'user:', user, 'loading:', loading, 'allowedRoles:', allowedRoles);

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    console.log('ProtectedRoute - User role not allowed:', user?.role, 'allowed:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  console.log('AppRoutes - isAuthenticated:', isAuthenticated);

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Dashboard />} 
      />

      {/* Dashboard route - automatically redirects to appropriate role dashboard */}
      <Route 
        path="/dashboard" 
        element={<Dashboard />} 
      />

      {/* Test page for debugging navigation */}
      <Route 
        path="/test" 
        element={<TestPage />} 
      />

      {/* Protected routes */}
      <Route 
        path="/scheduler" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin']}>
            <SchedulerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dispatcher" 
        element={
          <ProtectedRoute allowedRoles={['dispatcher', 'admin']}>
            <DispatcherDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/driver" 
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <SimpleDriverDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Dashboard. Please try refreshing the page.">
              <AdminDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/overview" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Overview. Please try refreshing the page.">
              <AdminOverview />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/analytics" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Analytics. Please try refreshing the page.">
              <AdminAnalytics />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Reports. Please try refreshing the page.">
              <AdminReports />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/register" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Registration. Please try refreshing the page.">
              <AdminRegistration />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/riders" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <RidersDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vehicles" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehiclesDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/maps" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <MapsDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Default route redirect */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Dashboard /> : 
            <Navigate to="/login" replace />
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Box 
        minWidth="320px"
        minHeight="100vh"
        width="100%" 
        bg="gray.50" 
        position="relative"
        overflowX="hidden"
      >
        <AppRoutes />
      </Box>
    </AuthProvider>
  );
}

export default App;
