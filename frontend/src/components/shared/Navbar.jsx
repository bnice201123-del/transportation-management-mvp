import React, { useEffect, useRef, useState } from 'react';
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
  Spacer,
  Tooltip
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  ChevronDownIcon, 
  SettingsIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  BellIcon
} from '@chakra-ui/icons';
import { BellIcon as BellIconOutline } from '@heroicons/react/24/outline';
import { 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useNotifications } from "../../contexts/NotificationContext";
import useCloseOnScroll from "../../hooks/useCloseOnScroll";
import Sidebar from './Sidebar';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { isSidebarVisible, toggleSidebar } = useSidebar();
  const { unreadCount } = useNotifications(); // Use notification context
  const { isOpen: isMobileMenuOpen, onOpen: onMobileMenuOpen, onClose: onMobileMenuClose } = useDisclosure();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationTimeoutRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Close user menu dropdown on scroll (desktop only)
  useCloseOnScroll(isUserMenuOpen, () => setIsUserMenuOpen(false));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Navigate to dashboard based on active role with debounce
  const navigateToDashboard = () => {
    if (isNavigatingRef.current) {
      return;
    }

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const currentRole = user?.role;
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
      >
        <Container maxW="container.xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 0 }} pl={{ md: 0 }} pr={{ md: 6 }}>
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

              {/* Column 3: Notifications + User Profile */}
              <Box flex="0 0 auto">
                <HStack spacing={2}>
                  {/* Notification Bell Icon */}
                  <Box position="relative">
                    <IconButton
                      icon={<Box as={BellIconOutline} w={5} h={5} />}
                      aria-label="Notifications"
                      onClick={() => navigate('/notifications')}
                      variant="ghost"
                      size="sm"
                      position="relative"
                    />
                    {unreadCount > 0 && (
                      <Badge
                        position="absolute"
                        top="0"
                        right="0"
                        colorScheme="red"
                        borderRadius="full"
                        fontSize="2xs"
                        minW="16px"
                        h="16px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Box>
                  
                  {/* User Profile */}
                  <HStack spacing={1}>
                    <VStack spacing={0} align="end">
                      <Text fontSize="xs" fontWeight="medium" color="gray.700" lineHeight="1.2">
                        {user ? `${user.firstName}` : 'User'}
                      </Text>
                      <Badge 
                        colorScheme={getRoleBadgeColor(user?.role)} 
                        variant="subtle"
                        fontSize="xx-small"
                        px={1}
                        py={0}
                      >
                        {user ? getRoleDisplayName(user.role).toUpperCase() : 'ROLE'}
                      </Badge>
                    </VStack>
                    <Avatar
                      size="sm"
                      name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                      src={user?.profileImage}
                      bg={user?.profileImage ? 'transparent' : `${getRoleBadgeColor(user?.role)}.500`}
                    />
                  </HStack>
                </HStack>
              </Box>
            </Flex>

            {/* Desktop: Sidebar Toggle + Logo Section */}
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <HStack spacing={3}>
                {/* Sidebar Toggle Button */}
                <Tooltip label={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"} placement="bottom">
                  <IconButton
                    icon={isSidebarVisible ? <ChevronLeftIcon boxSize={6} /> : <ChevronRightIcon boxSize={6} />}
                    aria-label={isSidebarVisible ? "Hide sidebar" : "Show sidebar"}
                    onClick={toggleSidebar}
                    variant="ghost"
                    colorScheme="brand"
                    size="md"
                  />
                </Tooltip>
                
                {/* Logo */}
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
              </HStack>
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
                    src={user?.profileImage}
                    bg={user?.profileImage ? 'transparent' : `${getRoleBadgeColor(user?.role)}.500`}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
                  
                  {/* Role Badge (static display) */}
                  <Badge
                    colorScheme={getRoleBadgeColor(user?.role)}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {user ? getRoleDisplayName(user.role) : 'Role'}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            {/* Right: Account Settings (Desktop Only) */}
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Flex justify="flex-end" align="center" gap={3}>
                {/* Notifications Bell Icon */}
                <Tooltip label="Notifications" placement="bottom">
                  <Box position="relative">
                    <IconButton
                      icon={<Box as={BellIconOutline} w={6} h={6} />}
                      aria-label="Notifications"
                      onClick={() => navigate('/notifications')}
                      variant="ghost"
                      colorScheme="brand"
                      size="md"
                      position="relative"
                    />
                    {unreadCount > 0 && (
                      <Badge
                        position="absolute"
                        top="-1"
                        right="-1"
                        colorScheme="red"
                        borderRadius="full"
                        fontSize="xs"
                        minW="20px"
                        h="20px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Box>
                </Tooltip>

                {/* Account Settings Menu */}
                <Menu 
                  isOpen={isUserMenuOpen} 
                  onClose={() => setIsUserMenuOpen(false)}
                  onOpen={() => setIsUserMenuOpen(true)}
                  closeOnBlur={true}
                  closeOnSelect={true}
                >
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
                      icon={<Avatar size="xs" name={user ? `${user.firstName} ${user.lastName}` : 'User'} src={user?.profileImage} bg={user?.profileImage ? 'transparent' : 'blue.500'} />}
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
                    <MenuItem 
                      icon={<Box as={UserCircleIcon} w={5} h={5} />}
                      _hover={{ bg: "green.50" }} 
                      onClick={() => navigate('/profile')}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">Profile Settings</Text>
                        <Text fontSize="xs" color="gray.500">Personal info & preferences</Text>
                      </VStack>
                    </MenuItem>
                    <MenuItem 
                      icon={<Box as={Cog6ToothIcon} w={5} h={5} />}
                      _hover={{ bg: "green.50" }}
                      onClick={() => navigate('/settings/preferences')}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">Account Preferences</Text>
                        <Text fontSize="xs" color="gray.500">Display, privacy & more</Text>
                      </VStack>
                    </MenuItem>
                    <MenuItem 
                      icon={<BellIcon />}
                      _hover={{ bg: "green.50" }} 
                      onClick={() => navigate('/settings/notifications')}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">Notification Settings</Text>
                        <Text fontSize="xs" color="gray.500">Manage alerts & emails</Text>
                      </VStack>
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem 
                      icon={<Box as={ArrowRightOnRectangleIcon} w={5} h={5} />}
                      onClick={handleLogout}
                      _hover={{ bg: "red.50", color: "red.600" }}
                      color="red.500"
                    >
                      <Text fontSize="sm" fontWeight="medium">Sign Out</Text>
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