import React from 'react';
import {
  VStack,
  HStack,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Box,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import {
  FiChevronDown,
  FiLogOut,
  FiHome,
  FiMapPin,
  FiSettings,
  FiBarChart2,
  FiUser,
  FiMenu,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDualLogin } from '../../contexts/DualLoginContext';

/**
 * DriverNavigation Component
 * 
 * Navigation menu for driver section with:
 * - Quick links to main sections
 * - Breadcrumb navigation
 * - User menu with settings and logout
 */
const DriverNavigation = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { driverAuth, logoutDriver } = useDualLogin();

  // Parse current route for breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  const getBreadcrumbLabel = (part) => {
    const labels = {
      driver: 'Driver',
      dual: 'Login',
      dashboard: 'Dashboard',
      trackers: 'Trackers',
      tracker: 'Tracker',
      config: 'Configuration',
      settings: 'Settings',
    };
    return labels[part] || part.charAt(0).toUpperCase() + part.slice(1);
  };

  const handleLogout = () => {
    logoutDriver();
    navigate('/driver/dual-login');
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Top Navigation Bar */}
      <HStack justify="space-between" px={4} py={3} bg="white" borderBottomWidth={1}>
        {/* Menu toggle for mobile */}
        <Button
          display={{ base: 'flex', md: 'none' }}
          variant="ghost"
          icon={<FiMenu />}
          onClick={onMenuToggle}
        />

        {/* Logo/Title */}
        <HStack spacing={2}>
          <Icon as={FiHome} boxSize={6} color="blue.600" />
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="bold">
              Driver Portal
            </Text>
            <Badge colorScheme="blue" fontSize="xs">
              {driverAuth?.driverId || 'Not Authenticated'}
            </Badge>
          </VStack>
        </HStack>

        {/* User Menu */}
        <Menu>
          <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="ghost">
            <HStack spacing={1}>
              <Icon as={FiUser} />
              <Text display={{ base: 'none', md: 'block' }} fontSize="sm">
                {driverAuth?.userName || 'Driver'}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiSettings />} onClick={() => navigate('/driver/settings')}>
              Settings
            </MenuItem>
            <MenuItem icon={<FiBarChart2 />} onClick={() => navigate('/driver/dashboard')}>
              Dashboard
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={<FiLogOut />} onClick={handleLogout} color="red.600">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Breadcrumb Navigation */}
      {pathParts.length > 1 && (
        <Box px={4} py={2}>
          <Breadcrumb spacing="8px" separator="/">
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/driver/dashboard')}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathParts.slice(1).map((part, idx) => (
              <BreadcrumbItem key={idx}>
                <Text fontSize="sm" color="gray.600">
                  {getBreadcrumbLabel(part)}
                </Text>
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </Box>
      )}

      {/* Quick Navigation Links */}
      <HStack spacing={2} px={4} flexWrap="wrap">
        <Button
          size="sm"
          variant={location.pathname.includes('/dashboard') ? 'solid' : 'outline'}
          colorScheme={location.pathname.includes('/dashboard') ? 'blue' : 'gray'}
          leftIcon={<FiHome />}
          onClick={() => navigate('/driver/dashboard')}
        >
          Dashboard
        </Button>
        <Button
          size="sm"
          variant={location.pathname.includes('/trackers') ? 'solid' : 'outline'}
          colorScheme={location.pathname.includes('/trackers') ? 'blue' : 'gray'}
          leftIcon={<FiMapPin />}
          onClick={() => navigate('/driver/trackers')}
        >
          Trackers
        </Button>
        <Button
          size="sm"
          variant={location.pathname.includes('/settings') ? 'solid' : 'outline'}
          colorScheme={location.pathname.includes('/settings') ? 'blue' : 'gray'}
          leftIcon={<FiSettings />}
          onClick={() => navigate('/driver/settings')}
        >
          Settings
        </Button>
      </HStack>
    </VStack>
  );
};

export default DriverNavigation;
