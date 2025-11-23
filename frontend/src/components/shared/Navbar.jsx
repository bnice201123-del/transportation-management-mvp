import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  HStack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  VStack,
  Heading,
  Badge,
  Container,
  Spacer
} from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon, SettingsIcon } from '@chakra-ui/icons';
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from './Sidebar';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationTimeoutRef = useRef(null);
  const isNavigatingRef = useRef(false);
  
  // Active role state for multi-role users
  const [activeRole, setActiveRole] = useState(null);

  // Initialize active role from localStorage or user's primary role
  useEffect(() => {
    if (user) {
      const savedRole = localStorage.getItem('activeRole');
      const userRoles = user.roles || [user.role];
      
      if (savedRole && userRoles.includes(savedRole)) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(user.role);
        // Save the default role to prevent re-initialization
        localStorage.setItem('activeRole', user.role);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]); // Only re-run when user role changes, not on every user object change

  // Handle role switching with debounce to prevent navigation flooding
  const handleRoleSwitch = (role) => {
    // Prevent multiple simultaneous navigation attempts
    if (isNavigatingRef.current) {
      return;
    }

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    setActiveRole(role);
    localStorage.setItem('activeRole', role);
    
    // Get target path based on role
    let targetPath = '/dashboard';
    if (role === 'admin') {
      targetPath = '/admin/overview';
    } else if (role === 'dispatcher') {
      targetPath = '/dispatcher';
    } else if (role === 'scheduler') {
      targetPath = '/scheduler';
    } else if (role === 'driver') {
      targetPath = '/driver-dashboard';
    }

    // Only navigate if not already on the target path
    if (location.pathname !== targetPath) {
      isNavigatingRef.current = true;
      navigationTimeoutRef.current = setTimeout(() => {
        navigate(targetPath);
        // Reset navigation flag after a delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }, 150);
    }
  };

  // Navigate to dashboard based on active role with debounce
  const navigateToDashboard = () => {
    // Prevent multiple simultaneous navigation attempts
    if (isNavigatingRef.current) {
      return;
    }

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const currentRole = activeRole || user?.role;
    let targetPath = '/dashboard';
    
    if (currentRole === 'admin') {
      targetPath = '/admin/overview';
    } else if (currentRole === 'dispatcher') {
      targetPath = '/dispatcher';
    } else if (currentRole === 'scheduler') {
      targetPath = '/scheduler';
    } else if (currentRole === 'driver') {
      targetPath = '/driver-dashboard';
    }

    // Only navigate if not already on the target path
    if (location.pathname !== targetPath) {
      isNavigatingRef.current = true;
      navigationTimeoutRef.current = setTimeout(() => {
        navigate(targetPath);
        // Reset navigation flag after a delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }, 150);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Get available roles for the user
  const getAvailableRoles = () => {
    if (!user) return [];
    return user.roles || [user.role];
  };

  const availableRoles = getAvailableRoles();
  const hasMultipleRoles = availableRoles.length > 1;

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'dispatcher':
        return 'purple';
      case 'scheduler':
        return 'secondary'; // green
      case 'driver':
        return 'brand'; // blue
      default:
        return 'gray';
    }
  };

  return (
    <>
      {/* Responsive Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={onMobileMenuClose}
      />
      
      <Box
        bg="brand.50"
        borderBottom="2px"
        borderColor="brand.200"
        position="sticky"
        top={0}
        zIndex={1000}
        shadow="md"
        ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} // Responsive left margin for sidebar
      >
        <Container maxW="container.xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 6 }}>
          <Flex alignItems="center" minH={{ base: "50px", md: "60px" }}>
            
            {/* Mobile: Three Column Layout - Hamburger | Logo | User Profile */}
            <Flex 
              display={{ base: "flex", md: "none" }} 
              width="100%" 
              alignItems="center" 
              justifyContent="space-between"
            >
              {/* Column 1: Hamburger Menu */}
              <Box flex="0 0 auto">
                <IconButton
                  size="sm"
                  icon={<HamburgerIcon />}
                  aria-label="Open menu"
                  onClick={onMobileMenuOpen}
                  variant="ghost"
                  colorScheme="brand"
                />
              </Box>

              {/* Column 2: Company Logo/Name (Centered) */}
              <Box 
                flex="1" 
                display="flex" 
                justifyContent="center"
                cursor="pointer"
                onClick={navigateToDashboard}
              >
                <VStack spacing={0}>
                  <Text fontSize="md" fontWeight="bold" color="brand.600" lineHeight="1.2">
                    TransportHub
                  </Text>
                  <Text fontSize="xx-small" color="secondary.600" lineHeight="1">
                    Transportation Management
                  </Text>
                </VStack>
              </Box>

              {/* Column 3: User Profile */}
              <Box flex="0 0 auto">
                <HStack spacing={1}>
                  <VStack spacing={0} align="end">
                    <Text fontSize="xs" fontWeight="medium" color="gray.700" lineHeight="1.2">
                      {user ? `${user.firstName}` : 'User'}
                    </Text>
                    <Badge 
                      colorScheme={getRoleBadgeColor(activeRole || user?.role)} 
                      variant="subtle"
                      fontSize="xx-small"
                      px={1}
                      py={0}
                    >
                      {user ? getRoleDisplayName(activeRole || user.role).toUpperCase() : 'ROLE'}
                    </Badge>
                  </VStack>
                  <Avatar
                    size="sm"
                    name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                    bg={`${getRoleBadgeColor(activeRole || user?.role)}.500`}
                  />
                </HStack>
              </Box>
            </Flex>

            {/* Desktop: Logo Section */}
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Box 
                cursor="pointer"
                onClick={navigateToDashboard}
              >
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="brand.600">
                  TransportHub
                </Text>
                <Text fontSize="xs" color="secondary.600" mt="-1">
                  Transportation Management
                </Text>
              </Box>
            </Box>

            {/* Center: Page Title (Hidden on mobile) */}
            <Box flex="1" textAlign="center" display={{ base: "none", md: "block" }}>
              <VStack spacing={1}>
                <Heading size={{ base: "md", lg: "lg" }} color="gray.700">
                  {title}
                </Heading>
                <HStack spacing={2} justify="center" display={{ base: "none", lg: "flex" }}>
                  <Avatar
                    size="xs"
                    name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                    bg={`${getRoleBadgeColor(activeRole || user?.role)}.500`}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
                  
                  {/* Role Badge with switcher for multi-role users */}
                  {hasMultipleRoles ? (
                    <Menu>
                      <MenuButton
                        as={Badge}
                        colorScheme={getRoleBadgeColor(activeRole || user?.role)}
                        variant="subtle"
                        fontSize="xs"
                        cursor="pointer"
                        px={2}
                        py={1}
                        borderRadius="md"
                        _hover={{ transform: 'scale(1.05)' }}
                      >
                        {getRoleDisplayName(activeRole || user.role)} <ChevronDownIcon />
                      </MenuButton>
                      <MenuList>
                        <Text fontSize="xs" color="gray.500" px={3} py={1} fontWeight="bold">
                          Switch Role
                        </Text>
                        <MenuDivider />
                        {availableRoles.map((role) => (
                          <MenuItem
                            key={role}
                            onClick={() => handleRoleSwitch(role)}
                            bg={role === activeRole ? `${getRoleBadgeColor(role)}.50` : 'transparent'}
                            fontWeight={role === activeRole ? 'bold' : 'normal'}
                          >
                            <Badge colorScheme={getRoleBadgeColor(role)} mr={2}>
                              {getRoleDisplayName(role)}
                            </Badge>
                            {role === activeRole && '✓'}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  ) : (
                    <Badge 
                      colorScheme={getRoleBadgeColor(activeRole || user?.role)} 
                      variant="subtle"
                      fontSize="xs"
                    >
                      {user ? getRoleDisplayName(activeRole || user.role) : 'Role'}
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Box>

            {/* Right: Account Settings (Desktop Only) */}
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Flex justify="flex-end">
                <Menu>
                  <MenuButton
                    as={Button}
                    leftIcon={<SettingsIcon />}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    colorScheme="brand"
                    size="md"
                    bg="brand.100"
                    _hover={{ bg: "brand.200" }}
                    _active={{ bg: "brand.300" }}
                  >
                    Account Settings
                  </MenuButton>
                  <MenuList border="1px" borderColor="brand.200" shadow="lg">
                    <MenuItem 
                      icon={<Avatar size="xs" name={user ? `${user.firstName} ${user.lastName}` : 'User'} />}
                      _hover={{ bg: "green.50" }}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {user ? `${user.firstName} ${user.lastName}` : 'User'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {user?.email}
                        </Text>
                      </VStack>
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem _hover={{ bg: "green.50" }}>
                      Profile Settings
                    </MenuItem>
                    <MenuItem _hover={{ bg: "green.50" }}>
                      Account Preferences
                    </MenuItem>
                    <MenuItem _hover={{ bg: "green.50" }}>
                      Notification Settings
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem 
                      onClick={handleLogout}
                      _hover={{ bg: "red.50", color: "red.600" }}
                      color="red.500"
                    >
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Box>

          </Flex>
        </Container>
      </Box>

    </>
  );
};

export default Navbar;