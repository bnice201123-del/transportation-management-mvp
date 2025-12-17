import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Import components
import Dashboard from './components/Dashboard';
import TestPage from './components/TestPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SchedulerDashboard from './components/scheduler/SchedulerDashboard';
import RecurringTrips from './components/scheduler/RecurringTrips';
import CompletedTrips from './components/scheduler/CompletedTrips';
import ScheduleTemplates from './components/ScheduleTemplates';
import UpcomingTrips from './components/trips/UpcomingTrips';
import AllTrips from './components/trips/AllTrips';
import ActiveTrips from './components/trips/ActiveTrips';
import SearchPage from './components/trips/SearchPage';
import SchedulePage from './components/trips/SchedulePage';
import DriversManagement from './components/drivers/DriversManagement';
import RiderHistory from './components/riders/RiderHistory';
import DispatcherDashboard from './components/dispatcher/DispatcherDashboard';
import DriverLanding from './components/driver/DriverLanding';
import DriverReport from './components/driver/DriverReport';
import ComprehensiveDriverDashboard from './components/driver/ComprehensiveDriverDashboard';
import VehicleLog from './components/vehicles/VehicleLog';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOverview from './components/admin/AdminOverview';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminReports from './components/admin/AdminReports';
import AdminRegistration from './components/admin/AdminRegistration';
import AdminStatistics from './components/admin/AdminStatistics';
import AdminSettings from './components/admin/AdminSettings';
import OperationsLanding from './components/admin/OperationsLanding';
import LiveTrackingDashboard from './components/admin/LiveTrackingDashboard';
import SystemAdministration from './components/admin/SystemAdministration';
import ManageUsers from './components/admin/ManageUsers';
import UserRolesPermissions from './components/admin/UserRolesPermissionsSimple';
import ManageUserRoles from './components/admin/ManageUserRoles';
import TimeOffManagement from './components/admin/TimeOffManagement';
import Security from './components/admin/SecuritySimple';
import BackupRestore from './components/admin/BackupRestore';
import AdminPlaceholder from './components/admin/AdminPlaceholder';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ReactObjectErrorBoundary from './components/shared/ReactObjectErrorBoundary';
import Layout from './components/shared/Layout';
import ScrollTestPage from './components/test/ScrollTestPage';
import ComprehensiveRiderDashboard from './components/riders/ComprehensiveRiderDashboard';
import RidersDashboard from './components/riders/RidersDashboard';
import RidersLanding from './components/riders/RidersLanding';
import RiderProfile from './components/riders/RiderProfile';
import NewRider from './components/riders/NewRider';
import ComprehensiveVehicleDashboard from './components/vehicles/ComprehensiveVehicleDashboard';
import DebugVehicleDashboard from './components/vehicles/DebugVehicleDashboard';
import VehiclesDashboard from './components/vehicles/VehiclesDashboard';
import VehiclesLanding from './components/vehicles/VehiclesLanding';
import VehicleProfile from './components/vehicles/VehicleProfile';
import VehicleProfilePage from './components/vehicles/VehicleProfilePage';
import NewVehicle from './components/vehicles/NewVehicle';
import VehicleAssignment from './components/vehicles/VehicleAssignment';
import VehicleMaintenance from './components/vehicles/VehicleMaintenance';
import MapsDashboard from './components/maps/MapsDashboard';
import TripMaps from './components/maps/TripMaps';
import LiveTracking from './components/maps/LiveTracking';
import RoutePlanning from './components/maps/RoutePlanning';
import DriverLocationTracking from './components/driver/DriverLocationTracking';
import UserProfile from './components/shared/UserProfile';
import NotificationsPage from './components/shared/NotificationsPage';
import NotificationSettings from './components/shared/NotificationSettings';
import AccountPreferences from './components/settings/AccountPreferences';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRoles = user?.roles || [user?.role];
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
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
            <ScheduleTemplates />
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
          <ProtectedRoute allowedRoles={['driver', 'scheduler', 'dispatcher', 'admin']}>
            <ComprehensiveDriverDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/driver/tracking" 
        element={
          <ProtectedRoute allowedRoles={['driver', 'scheduler', 'dispatcher', 'admin']}>
            <DriverLocationTracking />
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
            <ReactObjectErrorBoundary>
              <ErrorBoundary fallbackMessage="Failed to load Admin Overview. Please try refreshing the page.">
                <AdminOverview />
              </ErrorBoundary>
            </ReactObjectErrorBoundary>
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
        path="/admin/live-tracking" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
            <ErrorBoundary fallbackMessage="Failed to load Live Tracking Dashboard. Please try refreshing the page.">
              <LiveTrackingDashboard />
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
      
      {/* User Profile Route - Available to all authenticated users */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load User Profile. Please try refreshing the page.">
              <UserProfile />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      {/* Notifications Page - Available to all authenticated users */}
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Notifications. Please try refreshing the page.">
              <NotificationsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      {/* Notification Settings - Available to all authenticated users */}
      <Route 
        path="/settings/notifications" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Notification Settings. Please try refreshing the page.">
              <NotificationSettings />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      {/* Account Preferences - Available to all authenticated users */}
      <Route 
        path="/settings/preferences" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Account Preferences. Please try refreshing the page.">
              <AccountPreferences />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      {/* Work Schedule Routes - Available to authenticated users */}
      <Route 
        path="/schedule/calendar" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Schedule Calendar. Please try refreshing the page.">
              <AdminPlaceholder title="Schedule Calendar" description="View and manage your work schedule in a calendar format. See upcoming shifts, request time off, and coordinate with your team." />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/schedule/time-off" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Time Off Requests. Please try refreshing the page.">
              <AdminPlaceholder title="Time Off Requests" description="Submit and manage time off requests. View approval status and upcoming approved time off." />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/schedule/shift-swaps" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load Shift Swaps. Please try refreshing the page.">
              <AdminPlaceholder title="Shift Swaps" description="Request to swap shifts with other drivers. Browse available swap opportunities and manage your swap requests." />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/schedule/templates" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Schedule Templates. Please try refreshing the page.">
              <AdminPlaceholder title="Schedule Templates" description="Create and manage schedule templates for recurring shifts and assignments." />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/system" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load System Administration. Please try refreshing the page.">
              <SystemAdministration />
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
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load User Management. Please try refreshing the page.">
              <ManageUsers />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/roles" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load User Roles & Permissions. Please try refreshing the page.">
              <UserRolesPermissions />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/manage-roles" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Manage User Roles. Please try refreshing the page.">
              <ManageUserRoles />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/time-off" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'scheduler']}>
            <ErrorBoundary fallbackMessage="Failed to load Time-Off Management. Please try refreshing the page.">
              <TimeOffManagement />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/security" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Security Dashboard. Please try refreshing the page.">
              <Security />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/backup" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Backup & Restore. Please try refreshing the page.">
              <BackupRestore />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/activity" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load User Activity Monitor. Please try refreshing the page.">
              <AdminPlaceholder />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route
        path="/riders"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <ComprehensiveRiderDashboard />
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
          <ProtectedRoute allowedRoles={['driver', 'scheduler', 'dispatcher', 'admin']}>
            <DriverReport />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <ErrorBoundary fallbackMessage="Failed to load Vehicle Dashboard. Please check console for details.">
              <ComprehensiveVehicleDashboard />
            </ErrorBoundary>
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
        path="/vehicles/assignment"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehicleAssignment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:vehicleId/maintenance"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <VehicleMaintenance />
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
        path="/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin', 'driver']}>
            <VehicleProfilePage />
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
      <Route 
        path="/maps/trips" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <TripMaps />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/maps/tracking" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <ErrorBoundary fallbackMessage="Failed to load live tracking. Please check your internet connection and try again.">
              <LiveTracking />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/maps/routes" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <ErrorBoundary fallbackMessage="Failed to load route planning. Please check your internet connection and try again.">
              <RoutePlanning />
            </ErrorBoundary>
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

      {/* Canonical Trip Routes */}
      <Route 
        path="/trips/create" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/manage" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <SchedulerDashboard view="manage" />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/map" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <LiveTrackingDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/upcoming" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <UpcomingTrips />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/completed" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <CompletedTrips />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/all" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <AllTrips />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/active" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <ActiveTrips />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/trips/recurring" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'scheduler', 'dispatcher']}>
            <RecurringTrips />
          </ProtectedRoute>
        } 
      />

      {/* Canonical User/Management Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ErrorBoundary fallbackMessage="Failed to load User Management. Please try refreshing the page.">
              <ManageUsers />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tracking" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
            <ErrorBoundary fallbackMessage="Failed to load Live Tracking Dashboard. Please try refreshing the page.">
              <LiveTrackingDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/drivers" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <DriversManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Failed to load User Profile. Please try refreshing the page.">
              <UserProfile />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/schedule" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <SchedulePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/search" 
        element={
          <ProtectedRoute allowedRoles={['scheduler', 'dispatcher', 'admin']}>
            <SearchPage />
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
      <NotificationProvider>
        <SidebarProvider>
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
        </SidebarProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
