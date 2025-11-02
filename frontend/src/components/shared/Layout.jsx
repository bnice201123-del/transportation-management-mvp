import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children, currentView }) => {
  const [sidebarView, setSidebarView] = useState(currentView || 'dashboard');
  const { isAuthenticated } = useAuth();

  // Don't show sidebar for non-authenticated users or on login/register pages
  if (!isAuthenticated) {
    return children;
  }

  const handleViewChange = (viewId) => {
    setSidebarView(viewId);
    
    // Handle navigation based on view
    switch (viewId) {
      case 'schedule':
      case 'schedule-create-trip':
      case 'schedule-manage-trips':
      case 'schedule-recurring-trips':
        window.location.href = '/scheduler';
        break;
      case 'dispatch':
      case 'dispatch-active-trips':
      case 'dispatch-assign-drivers':
      case 'dispatch-track-vehicles':
        window.location.href = '/dispatcher';
        break;
      case 'admin':
      case 'admin-user-management':
      case 'admin-system-settings':
      case 'admin-reports':
      case 'admin-audit-logs':
        window.location.href = '/admin';
        break;
      case 'driver':
      case 'driver-my-trips':
      case 'driver-trip-history':
      case 'driver-earnings':
        window.location.href = '/driver';
        break;
      default:
        break;
    }
  };

  return (
    <Box minHeight="100vh" position="relative">
      <Sidebar 
        currentView={sidebarView}
        onViewChange={handleViewChange}
      />
      
      {/* Main Content Area with left margin for sidebar */}
      <Box 
        ml="60px" // Margin to account for collapsed sidebar width
        minHeight="100vh"
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;