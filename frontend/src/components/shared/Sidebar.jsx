import React, { useState } from 'react';
import {
  Box,
  VStack,
  Icon,
  Tooltip,
  useColorModeValue,
  Text,
  HStack,
  Flex,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  IconButton,
  Collapse,
  useBreakpointValue,
  Avatar
} from '@chakra-ui/react';
import {
  CalendarIcon,
  SettingsIcon,
  ViewIcon,
  StarIcon,
  TimeIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  InfoIcon,
  SearchIcon,
  AtSignIcon,
  UnlockIcon,
  HamburgerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RepeatIcon,
  CopyIcon,
  CheckIcon,
  WarningIcon,
  EmailIcon,
  PhoneIcon
} from '@chakra-ui/icons';
import { 
  FaCar, 
  FaUser, 
  FaUsers,
  FaUserTie,
  FaMap, 
  FaRoute, 
  FaCalendarPlus, 
  FaCalendarCheck, 
  FaCalendarTimes, 
  FaClipboardList, 
  FaPrint,
  FaShare,
  FaMapMarkedAlt
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import AdvancedSearchModal from '../search/AdvancedSearchModal';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { isSidebarVisible, hideSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const [expandedItems, setExpandedItems] = useState({});
  
  const bgColor = useColorModeValue('linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)', 'linear-gradient(180deg, #4a5568 0%, #2d3748 100%)');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  const activeBg = useColorModeValue('gray.300', 'gray.500');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const menuBg = useColorModeValue('white', 'gray.700');
  const menuShadow = useColorModeValue('xl', 'dark-lg');
  
  // Responsive sidebar width - returns 0 when hidden
  const sidebarWidth = useBreakpointValue({ 
    base: 0, 
    md: isSidebarVisible ? "60px" : "0", 
    lg: isSidebarVisible ? "200px" : "0", 
    xl: isSidebarVisible ? "240px" : "0" 
  });
  
  // Show full sidebar or collapsed version
  const isExpanded = useBreakpointValue({ 
    base: false, 
    md: false, 
    lg: true, 
    xl: true 
  });

  const menuItems = [
    // Dashboard for non-admin users only
    ...(user?.role !== 'admin' ? [{
      id: 'dashboard',
      label: 'Dashboard',
      icon: ViewIcon,
      color: 'blue.500',
      path: '/dashboard',
      roles: ['scheduler', 'dispatcher', 'driver'],
      subItems: [
        { label: 'Overview', icon: ViewIcon, action: () => navigate('/dashboard') },
        { label: 'Analytics', icon: InfoIcon, action: () => navigate('/dashboard/analytics') },
        { label: 'Reports', icon: SearchIcon, action: () => navigate('/dashboard/reports') },
        { label: 'Statistics', icon: StarIcon, action: () => navigate('/dashboard/stats') },
        { label: 'Settings', icon: SettingsIcon, action: () => navigate('/dashboard/settings') }
      ]
    }] : []),
    // Admin Dashboard - comprehensive for admin users
    ...(user?.role === 'admin' ? [{
      id: 'admin-dashboard',
      label: 'Admin Dashboard',
      icon: ViewIcon,
      color: 'purple.600',
      path: '/admin',
      roles: ['admin'],
      subItems: [
        { label: 'Overview', icon: ViewIcon, action: () => navigate('/admin/overview') },
        { label: 'Analytics', icon: InfoIcon, action: () => navigate('/admin/analytics') },
        { label: 'Statistics', icon: StarIcon, action: () => navigate('/admin/statistics') },
        { label: 'Reports', icon: SearchIcon, action: () => navigate('/admin/reports') }
      ]
    }] : []),

    // System Administration - for admin users only
    ...(user?.role === 'admin' ? [{
      id: 'system-admin',
      label: 'System Administration',
      icon: SettingsIcon,
      color: 'red.500',
      path: '/admin/system',
      roles: ['admin'],
      subItems: [
        { label: 'System Landing', icon: ViewIcon, action: () => navigate('/admin/system') },
        { label: 'System Settings', icon: SettingsIcon, action: () => navigate('/admin/settings') },
        { label: 'Register New User', icon: UnlockIcon, action: () => navigate('/admin/register') },
        { label: 'Manage Users', icon: SettingsIcon, action: () => navigate('/admin/users') },
        { label: 'User Roles & Permissions', icon: InfoIcon, action: () => navigate('/admin/roles') },
        { label: 'Backup & Restore', icon: CalendarIcon, action: () => navigate('/admin/backup') },
        { label: 'Security', icon: UnlockIcon, action: () => navigate('/admin/security') }
      ]
    }] : []),


    // Operations - for scheduler, dispatcher, driver, and admin users
    ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'driver' || user?.role === 'admin' ? [{
      id: 'operations',
      label: 'Operations',
      icon: FaRoute,
      color: 'orange.500',
      path: '/admin/operations',
      roles: ['scheduler', 'dispatcher', 'driver', 'admin'],
      subItems: [
        ...(user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Dispatch', icon: TimeIcon, action: () => navigate('/dispatcher') }
        ] : []),
        ...(user?.role === 'scheduler' || user?.role === 'admin' ? [
          { label: 'Scheduler', icon: CalendarIcon, action: () => navigate('/scheduler') }
        ] : []),
        ...(user?.role === 'driver' || user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Driver', icon: FaUserTie, action: () => navigate('/driver') }
        ] : []),
        ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Riders', icon: FaUsers, action: () => navigate('/riders') }
        ] : []),
        ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Vehicles', icon: FaCar, action: () => navigate('/vehicles') }
        ] : []),
        ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Search', icon: SearchIcon, action: () => onSearchOpen() }
        ] : [])
      ]
    }] : []),

    {
      id: 'maps',
      label: 'Maps',
      icon: FaMap,
      color: 'green.500',
      path: '/maps/trips',
      roles: ['scheduler', 'dispatcher', 'admin'],
      subItems: [
        { label: 'Trip Maps', icon: FaRoute, action: () => navigate('/maps/trips') },
        { label: 'Live Tracking', icon: TimeIcon, action: () => navigate('/maps/tracking') },
        { label: 'Route Planning', icon: FaMapMarkedAlt, action: () => navigate('/maps/routes') }
      ]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'guest')
  );

  const handleItemClick = (item) => {
    navigate(item.path || item);
    hideSidebar(); // Auto-close sidebar on desktop
    if (onMobileClose) {
      onMobileClose(); // Close mobile menu on navigation
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      // If clicking the currently open item, close it
      if (prev[itemId]) {
        return {
          ...prev,
          [itemId]: false
        };
      }
      
      // Otherwise, close all other items and open this one (accordion behavior)
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      newState[itemId] = true;
      
      return newState;
    });
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!user) {
    return null;
  }

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <Box
      position="fixed"
      left={0}
      top={{ base: 0, md: "60px" }}
      h={{ base: "100vh", md: "calc(100vh - 60px)" }}
      w={sidebarWidth}
      bgGradient={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      zIndex={900}
      shadow="xl"
      py={4}
      display={{ base: "none", md: isSidebarVisible ? "block" : "none" }}
      overflowY="auto"
      transition="all 0.3s ease"
      onClick={(e) => e.stopPropagation()}
    >
      {isExpanded ? (
        // Expanded sidebar for lg+ screens
        <VStack spacing={2} align="stretch" px={4}>
          {filteredMenuItems.map((item) => (
            <Box key={item.id}>
              <Flex
                align="center"
                p={3}
                borderRadius="lg"
                cursor="pointer"
                bg={isActive(item.path) ? activeBg : 'transparent'}
                color={isActive(item.path) ? item.color : textColor}
                _hover={{ bg: hoverBg, color: item.color }}
                transition="all 0.2s ease"
                onClick={() => {
                  if (item.subItems?.length > 0) {
                    toggleExpanded(item.id);
                  } else {
                    handleItemClick(item);
                  }
                }}
              >
                <Icon as={item.icon} boxSize={5} />
                <Text ml={3} fontSize="sm" fontWeight="medium" flex={1}>
                  {item.label}
                </Text>
                {item.subItems?.length > 0 && (
                  <Icon
                    as={expandedItems[item.id] ? ChevronDownIcon : ChevronRightIcon}
                    boxSize={4}
                  />
                )}
              </Flex>
              
              {/* Sub Items */}
              {item.subItems && (
                <Collapse in={expandedItems[item.id]}>
                  <VStack spacing={1} align="stretch" mt={2} ml={8}>
                    {item.subItems.map((subItem, index) => (
                      <Flex
                        key={index}
                        align="center"
                        p={2}
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ bg: hoverBg, color: item.color }}
                        transition="all 0.1s"
                        onClick={(e) => {
                          e.stopPropagation();
                          subItem.action();
                          hideSidebar(); // Auto-close sidebar when subitem is clicked
                        }}
                      >
                        <Icon as={subItem.icon} boxSize={4} />
                        <Text ml={2} fontSize="xs">
                          {subItem.label}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Collapse>
              )}
            </Box>
          ))}
        </VStack>
      ) : (
        // Collapsed sidebar for md screens
        <VStack spacing={3} align="center">
          {filteredMenuItems.map((item) => (
            <Box
              key={item.id}
              position="relative"
              _hover={{
                '& > .menu-dropdown': {
                  opacity: 1,
                  visibility: 'visible',
                  transform: 'translateX(0)'
                }
              }}
            >
              <Tooltip label={item.label} placement="right" hasArrow>
                <Box
                  w="44px"
                  h="44px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  cursor="pointer"
                  bg={isActive(item.path) ? activeBg : 'transparent'}
                  color={isActive(item.path) ? item.color : textColor}
                  _hover={{ bg: hoverBg, color: item.color, transform: 'scale(1.1)' }}
                  transition="all 0.2s ease"
                  onClick={() => handleItemClick(item)}
                >
                  <Icon as={item.icon} boxSize={5} />
                </Box>
              </Tooltip>

              {/* Hover Menu */}
              {item.subItems && (
                <Box
                  className="menu-dropdown"
                  position="absolute"
                  left="60px"
                  top="0"
                  bg={menuBg}
                  shadow={menuShadow}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                  minW="200px"
                  opacity={0}
                  visibility="hidden"
                  transform="translateX(-10px)"
                  transition="all 0.2s ease-in-out"
                  zIndex={1000}
                  py={2}
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={item.color}
                    px={3}
                    py={1}
                    borderBottom="1px"
                    borderColor={borderColor}
                    mb={1}
                  >
                    {item.label}
                  </Text>
                  {item.subItems.map((subItem, index) => (
                    <HStack
                      key={index}
                      px={3}
                      py={2}
                      cursor="pointer"
                      _hover={{ bg: hoverBg, color: item.color }}
                      transition="all 0.1s"
                      onClick={(e) => {
                        e.stopPropagation();
                        subItem.action();
                        hideSidebar(); // Auto-close sidebar when subitem is clicked
                      }}
                    >
                      <Icon as={subItem.icon} boxSize={4} />
                      <Text fontSize="sm" fontWeight="medium">
                        {subItem.label}
                      </Text>
                    </HStack>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );

  // Mobile Drawer Component
  const MobileDrawer = () => (
    <Drawer 
      isOpen={isMobileOpen} 
      placement="left" 
      onClose={onMobileClose} 
      size={{ base: "xs", sm: "sm" }}
    >
      <DrawerOverlay bg="blackAlpha.300" />
      <DrawerContent maxW={{ base: "280px", sm: "320px" }}>
        <DrawerCloseButton 
          size="md"
          color="gray.600"
          _hover={{ color: "gray.800", bg: "gray.100" }}
        />
        <DrawerHeader borderBottomWidth="1px" pb={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              TransportHub
            </Text>
            <Text fontSize="xs" color="gray.500">
              Transportation Management
            </Text>
          </VStack>
        </DrawerHeader>
        <DrawerBody p={2}>
          <VStack spacing={2} align="stretch">
            {filteredMenuItems.map((item) => (
              <Box key={item.id}>
                <Flex
                  align="center"
                  p={4}
                  minH="48px" // Touch-friendly minimum height
                  cursor="pointer"
                  bg={isActive(item.path) ? activeBg : 'transparent'}
                  color={isActive(item.path) ? item.color : textColor}
                  _hover={{ bg: hoverBg, color: item.color }}
                  _active={{ bg: activeBg, transform: "scale(0.98)" }}
                  transition="all 0.2s ease"
                  borderRadius="md"
                  onClick={() => {
                    if (item.subItems?.length > 0) {
                      toggleExpanded(item.id);
                    } else {
                      handleItemClick(item);
                      onMobileClose(); // Close drawer after navigation
                    }
                  }}
                >
                  <Icon as={item.icon} boxSize={6} />
                  <Text ml={3} fontSize="md" fontWeight="medium" flex={1}>
                    {item.label}
                  </Text>
                  {item.subItems?.length > 0 && (
                    <Icon
                      as={expandedItems[item.id] ? ChevronDownIcon : ChevronRightIcon}
                      boxSize={5}
                    />
                  )}
                </Flex>
                
                {/* Sub Items */}
                {item.subItems && (
                  <Collapse in={expandedItems[item.id]}>
                    <VStack spacing={1} align="stretch" bg="gray.50" p={2} borderRadius="md" ml={2}>
                      {item.subItems.map((subItem, index) => (
                        <Flex
                          key={index}
                          align="center"
                          p={3}
                          pl={8}
                          minH="44px" // Touch-friendly sub-item height
                          cursor="pointer"
                          _hover={{ bg: hoverBg, color: item.color }}
                          _active={{ bg: activeBg, transform: "scale(0.96)" }}
                          transition="all 0.1s"
                          borderRadius="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            subItem.action();
                            onMobileClose(); // Close drawer after navigation
                          }}
                        >
                          <Icon as={subItem.icon} boxSize={4} />
                          <Text ml={2} fontSize="sm" fontWeight="medium">
                            {subItem.label}
                          </Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Collapse>
                )}
              </Box>
            ))}
            
            {/* Account Settings Section (Mobile Only) */}
            <Box pt={4} mt={4} borderTop="1px" borderColor={borderColor}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} mb={2}>
                ACCOUNT
              </Text>
              
              {/* User Profile Info */}
              <Flex
                align="center"
                p={3}
                minH="56px"
                bg={menuBg}
                borderRadius="md"
                mb={2}
              >
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                  mr={3}
                />
                <VStack align="start" spacing={0} flex="1">
                  <Text fontSize="sm" fontWeight="medium">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {user?.email}
                  </Text>
                </VStack>
              </Flex>

              {/* Account Settings Options */}
              <VStack spacing={1} align="stretch">
                <Flex
                  align="center"
                  p={3}
                  minH="44px"
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  _active={{ bg: activeBg, transform: "scale(0.96)" }}
                  transition="all 0.1s"
                  borderRadius="md"
                  onClick={() => {
                    navigate('/settings/profile');
                    onMobileClose();
                  }}
                >
                  <Icon as={SettingsIcon} boxSize={5} color="gray.600" />
                  <Text ml={3} fontSize="sm" fontWeight="medium">
                    Profile Settings
                  </Text>
                </Flex>

                <Flex
                  align="center"
                  p={3}
                  minH="44px"
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  _active={{ bg: activeBg, transform: "scale(0.96)" }}
                  transition="all 0.1s"
                  borderRadius="md"
                  onClick={() => {
                    navigate('/settings/preferences');
                    onMobileClose();
                  }}
                >
                  <Icon as={SettingsIcon} boxSize={5} color="gray.600" />
                  <Text ml={3} fontSize="sm" fontWeight="medium">
                    Account Preferences
                  </Text>
                </Flex>

                <Flex
                  align="center"
                  p={3}
                  minH="44px"
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  _active={{ bg: activeBg, transform: "scale(0.96)" }}
                  transition="all 0.1s"
                  borderRadius="md"
                  onClick={() => {
                    navigate('/settings/notifications');
                    onMobileClose();
                  }}
                >
                  <Icon as={EmailIcon} boxSize={5} color="gray.600" />
                  <Text ml={3} fontSize="sm" fontWeight="medium">
                    Notification Settings
                  </Text>
                </Flex>

                {/* Sign Out */}
                <Flex
                  align="center"
                  p={3}
                  minH="44px"
                  cursor="pointer"
                  _hover={{ bg: "red.50", color: "red.600" }}
                  _active={{ bg: "red.100", transform: "scale(0.96)" }}
                  transition="all 0.1s"
                  borderRadius="md"
                  color="red.500"
                  onClick={() => {
                    logout();
                    onMobileClose();
                  }}
                >
                  <Icon as={UnlockIcon} boxSize={5} />
                  <Text ml={3} fontSize="sm" fontWeight="medium">
                    Sign Out
                  </Text>
                </Flex>
              </VStack>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      {/* Overlay for desktop sidebar on md breakpoint (tablet) */}
      {isSidebarVisible && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          display={{ base: "none", md: "block", lg: "none" }}
          zIndex={899}
          onClick={hideSidebar}
        />
      )}
      
      <DesktopSidebar />
      <MobileDrawer />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal 
        isOpen={isSearchOpen} 
        onClose={onSearchClose} 
      />
    </>
  );
};

export default Sidebar;