import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children, currentView }) => {
  const [sidebarView, setSidebarView] = useState(currentView || 'dashboard');
  const { isAuthenticated } = useAuth();

  // Don't show sidebar for non-authenticated users or on login/register pages
  if (!isAuthenticated) {
    return (
      <Flex direction="column" minHeight="100vh">
        <Box 
          flex="1" 
          overflowY="auto"
          overflowX="hidden"
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
        >
          {children}
        </Box>
        <Footer />
      </Flex>
    );
  }

  const handleViewChange = (viewId) => {
    setSidebarView(viewId);
    
    // Handle navigation based on view
    switch (viewId) {
      case 'schedule':
      case 'schedule-create-trip':
      case 'schedule-manage-trips':
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
      <Flex 
        direction="column"
        ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} // Responsive margin for sidebar
        minHeight="100vh"
      >
        {/* Main Content - Scrollable Area */}
        <Box 
          flex="1" 
          overflowY="auto"
          overflowX="hidden"
          maxHeight="calc(100vh - 0px)" // Ensure proper height calculation
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
        >
          {children}
        </Box>
        
        {/* Footer - Always at bottom */}
        <Footer />
      </Flex>
    </Box>
  );
};

export default Layout;