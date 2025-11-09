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
import RecurringTrips from './components/scheduler/RecurringTrips';
import CompletedTrips from './components/scheduler/CompletedTrips';
import RiderHistory from './components/riders/RiderHistory';
import DispatcherDashboard from './components/dispatcher/DispatcherDashboard';
import DriverLanding from './components/driver/DriverLanding';
import DriverReport from './components/driver/DriverReport';
import VehicleLog from './components/vehicles/VehicleLog';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOverview from './components/admin/AdminOverview';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminReports from './components/admin/AdminReports';
import AdminRegistration from './components/admin/AdminRegistration';
import AdminStatistics from './components/admin/AdminStatistics';
import AdminSettings from './components/admin/AdminSettings';
import OperationsLanding from './components/admin/OperationsLanding';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Layout from './components/shared/Layout';
import ScrollTestPage from './components/test/ScrollTestPage';
import RidersDashboard from './components/riders/RidersDashboard';
import RidersLanding from './components/riders/RidersLanding';
import RiderProfile from './components/riders/RiderProfile';
import NewRider from './components/riders/NewRider';
import VehiclesDashboard from './components/vehicles/VehiclesDashboard';
import VehiclesLanding from './components/vehicles/VehiclesLanding';
import VehicleProfile from './components/vehicles/VehicleProfile';
import NewVehicle from './components/vehicles/NewVehicle';
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
      {/* Scheduler Routes - Comprehensive Schedule Management */}
      <Route 
        path="/scheduler" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/manage" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/recurring" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'scheduler', 'dispatcher']}>
            <RecurringTrips />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/completed" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'scheduler', 'dispatcher']}>
            <CompletedTrips />
          </ProtectedRoute>
        } 
      />
      {/* Legacy routes redirect to manage */}
      <Route 
        path="/scheduler/add-trip" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/edit" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/all" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/assign-drivers" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="assign-drivers" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/assign-vehicles" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="assign-vehicles" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/calendar" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="calendar" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/timeline" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="timeline" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/map" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="map" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/history" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="history" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/completed" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="completed" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/import" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin']}>
            <SchedulerDashboard view="import" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/export" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="export" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/templates" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="templates" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/alerts" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="alerts" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/notifications" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="notifications" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/reports" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="reports" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/analytics" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="analytics" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/share" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="share" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/print" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin', 'dispatcher']}>
            <SchedulerDashboard view="print" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/settings" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin']}>
            <SchedulerDashboard view="settings" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scheduler/sync" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SchedulerDashboard view="sync" />
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
          <ProtectedRoute allowedRoles={['driver', 'admin']}>
            <DriverLanding />
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
        path="/admin/statistics" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Statistics. Please try refreshing the page.">
              <AdminStatistics />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Admin Settings. Please try refreshing the page.">
              <AdminSettings />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/operations" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Operations Center. Please try refreshing the page.">
              <OperationsLanding />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route
        path="/riders"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <RidersLanding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders/new"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <NewRider />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders/:riderId"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <RiderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders/:riderId/edit"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <RiderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders/history"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <RiderHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/driver/report" 
        element={
          <ProtectedRoute allowedRoles={['driver', 'admin']}>
            <DriverReport />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehiclesLanding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <NewVehicle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:vehicleId"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehicleProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:vehicleId/edit"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehicleProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/assignment"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehiclesLanding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/out-of-service"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehiclesLanding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/log"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehicleLog />
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

      {/* Test Pages */}
      <Route 
        path="/test/scroll" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ScrollTestPage />
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
        <Layout>
          <AppRoutes />
        </Layout>
      </Box>
    </AuthProvider>
  );
}

export default App;
