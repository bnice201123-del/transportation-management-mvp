import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useSwipeable } from 'react-swipeable';
import FocusLock from 'react-focus-lock';
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
  FaMapMarkedAlt,
  FaClock,
  FaExchangeAlt,
  FaFileAlt
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
  const sidebarRef = useRef(null);
  const lastFocusedElement = useRef(null);
  
  // Settings from localStorage (with defaults)
  const [overlayOpacity, setOverlayOpacity] = useState(() => {
    return localStorage.getItem('sidebar.overlayOpacity') || '600';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sidebar.soundEnabled') !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem('sidebar.hapticEnabled') !== 'false';
  });
  
  // Audio elements for sound effects
  const audioRefs = useRef({
    open: null,
    close: null,
    click: null
  });
  
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
  
  // Utility functions for sound and haptic feedback
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    
    // Create audio elements on first use
    if (!audioRefs.current[type]) {
      const audio = new Audio();
      // Using data URIs for simple sound effects (short beeps)
      const sounds = {
        open: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgoOFhoeJi42Oj5GSk5SVl5manJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==',
        close: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAD+/fz7+vn4+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6aloqGgn56dnJuamZiXlpWUk5KRkI+OjYyLioiHhYSCgQ==',
        click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkA=='
      };
      audio.src = sounds[type];
      audio.volume = 0.3; // Low volume for subtlety
      audioRefs.current[type] = audio;
    }
    
    // Play the sound
    try {
      audioRefs.current[type].currentTime = 0;
      audioRefs.current[type].play().catch(() => {
        // Ignore errors (e.g., user hasn't interacted with page yet)
      });
    } catch {
      // Ignore errors silently
    }
  }, [soundEnabled]);
  
  const triggerHaptic = (pattern = 'light') => {
    if (!hapticEnabled) return;
    
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        strong: 30,
        double: [10, 50, 10]
      };
      navigator.vibrate(patterns[pattern] || patterns.light);
    }
  };
  
  // Save last focused element when sidebar opens
  useEffect(() => {
    if (isMobileOpen || isSidebarVisible) {
      lastFocusedElement.current = document.activeElement;
      playSound('open');
    }
  }, [isMobileOpen, isSidebarVisible, playSound]);
  
  // Enhanced close function with focus restoration
  const handleClose = () => {
    playSound('close');
    if (onMobileClose) {
      onMobileClose();
    }
    hideSidebar();
    
    // Restore focus after a short delay to allow animations
    setTimeout(() => {
      if (lastFocusedElement.current && typeof lastFocusedElement.current.focus === 'function') {
        lastFocusedElement.current.focus();
      }
    }, 100);
  };
  
  // Swipe handlers for mobile drawer
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      triggerHaptic('light');
      handleClose();
    },
    preventScrollOnSwipe: true,
    trackMouse: false, // Only track touch events, not mouse
    delta: 50 // Minimum distance for swipe detection
  });
  
  // Show full sidebar or collapsed version
  const isExpanded = useBreakpointValue({ 
    base: false, 
    md: false, 
    lg: true, 
    xl: true 
  });

  // Current breakpoint for conditional logic
  const currentBreakpoint = useBreakpointValue({ 
    base: 'base',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  });

  // Click outside handler for tablet sidebar (md breakpoint only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle clicks when:
      // 1. Sidebar is visible
      // 2. On tablet (md) breakpoint only (not lg/xl where sidebar is part of layout)
      // 3. Click is outside the sidebar element
      if (isSidebarVisible && currentBreakpoint === 'md' && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if click is not on the toggle button or inside a dropdown menu
        const isToggleButton = event.target.closest('[aria-label="Hide sidebar"]') || 
                               event.target.closest('[aria-label="Show sidebar"]');
        const isDropdownMenu = event.target.closest('.menu-dropdown');
        
        if (!isToggleButton && !isDropdownMenu) {
          hideSidebar();
        }
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarVisible, hideSidebar, currentBreakpoint]);

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
    ...((user?.role === 'admin') ? [{
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
        { label: 'Backup & Restore', icon: CalendarIcon, action: () => navigate('/admin/backup') },
        { label: 'Security', icon: UnlockIcon, action: () => navigate('/admin/security') },
        { label: 'Register New User', icon: UnlockIcon, action: () => navigate('/admin/register') },
        { label: 'Manage Users', icon: FaUser, action: () => navigate('/admin/users') },
        { label: 'User Roles & Permissions', icon: InfoIcon, action: () => navigate('/admin/roles') }
      ]
    }] : []),

    // Operations - supporting resources (dispatcher, scheduler, driver, riders, vehicles, search)
    ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'driver' || user?.role === 'admin' ? [{
      id: 'operations',
      label: 'Operations',
      icon: FaRoute,
      color: 'orange.500',
      path: '/admin/operations',
      roles: ['scheduler', 'dispatcher', 'driver', 'admin'],
      subItems: [
        ...(user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Dispatcher', icon: TimeIcon, action: () => navigate('/dispatcher') }
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

    // Work Schedule - for schedulers, dispatchers, drivers, and admins
    ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'driver' || user?.role === 'admin' ? [{
      id: 'work-schedule',
      label: 'Work Schedule',
      icon: FaClock,
      color: 'teal.500',
      path: '/schedule',
      roles: ['scheduler', 'dispatcher', 'driver', 'admin'],
      subItems: [
        { label: 'Schedule Calendar', icon: CalendarIcon, action: () => navigate('/schedule/calendar') },
        { label: 'Time Off Requests', icon: FaCalendarTimes, action: () => navigate('/schedule/time-off') },
        { label: 'Shift Swaps', icon: FaExchangeAlt, action: () => navigate('/schedule/shift-swaps') },
        ...(user?.role === 'scheduler' || user?.role === 'admin' ? [
          { label: 'Templates', icon: FaFileAlt, action: () => navigate('/schedule/templates') }
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

  const filteredMenuItems = menuItems.filter(item => {
    const userRoles = user?.roles || [user?.role];
    return item.roles.some(role => userRoles.includes(role));
  });

  // Mobile-specific menu items (simplified for mobile UX)
  const mobileMenuItems = [
    // Admin Dashboard Overview - for users with admin role
    ...((user?.roles?.includes('admin') || user?.role === 'admin') ? [{
      id: 'admin-overview-mobile',
      label: 'Admin Dashboard',
      icon: ViewIcon,
      color: 'purple.600',
      path: '/admin/overview',
      roles: ['admin']
    }] : []),
    
    // Dispatcher - for users with dispatcher role
    ...((user?.roles?.includes('dispatcher') || user?.role === 'dispatcher') ? [{
      id: 'dispatch-mobile',
      label: 'Dispatch',
      icon: TimeIcon,
      color: 'blue.500',
      path: '/dispatcher',
      roles: ['dispatcher']
    }] : []),
    
    // Scheduler - for users with scheduler role
    ...((user?.roles?.includes('scheduler') || user?.role === 'scheduler') ? [{
      id: 'scheduler-mobile',
      label: 'Scheduler',
      icon: CalendarIcon,
      color: 'teal.500',
      path: '/scheduler',
      roles: ['scheduler']
    }] : []),

    // Driver View - for users with driver role
    ...((user?.roles?.includes('driver') || user?.role === 'driver') ? [{
      id: 'drivers-mobile',
      label: 'Driver View',
      icon: FaUserTie,
      color: 'purple.500',
      path: '/driver',
      roles: ['driver']
    }] : []),
    
    // Reports - for admin users
    ...((user?.roles?.includes('admin') || user?.role === 'admin') ? [{
      id: 'reports-mobile',
      label: 'Reports',
      icon: SearchIcon,
      color: 'orange.500',
      path: '/admin/reports',
      roles: ['admin']
    }] : []),
    
    // Register New User - for admin users
    ...((user?.roles?.includes('admin') || user?.role === 'admin') ? [{
      id: 'register-mobile',
      label: 'Register New User',
      icon: UnlockIcon,
      color: 'green.500',
      path: '/admin/register',
      roles: ['admin']
    }] : []),
    
    // Manage Users - for admin users
    ...((user?.roles?.includes('admin') || user?.role === 'admin') ? [{
      id: 'users-mobile',
      label: 'Manage Users',
      icon: SettingsIcon,
      color: 'red.500',
      path: '/admin/users',
      roles: ['admin']
    }] : []),
    
    // Riders - for scheduler, dispatcher, admin
    ...((user?.roles?.includes('scheduler') || user?.roles?.includes('dispatcher') || user?.roles?.includes('admin') || 
        user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin') ? [{
      id: 'riders-mobile',
      label: 'Riders',
      icon: FaUsers,
      color: 'cyan.500',
      path: '/riders',
      roles: ['scheduler', 'dispatcher', 'admin']
    }] : []),
    
    // Vehicles - for scheduler, dispatcher, admin
    ...((user?.roles?.includes('scheduler') || user?.roles?.includes('dispatcher') || user?.roles?.includes('admin') || 
        user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin') ? [{
      id: 'vehicles-mobile',
      label: 'Vehicles',
      icon: FaCar,
      color: 'yellow.600',
      path: '/vehicles',
      roles: ['scheduler', 'dispatcher', 'admin']
    }] : []),
    
    // Live Tracking - for scheduler, dispatcher, admin
    ...((user?.roles?.includes('scheduler') || user?.roles?.includes('dispatcher') || user?.roles?.includes('admin') || 
        user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin') ? [{
      id: 'tracking-mobile',
      label: 'Live Tracking',
      icon: FaMap,
      color: 'green.500',
      path: '/maps/tracking',
      roles: ['scheduler', 'dispatcher', 'admin']
    }] : [])
  ];

  const filteredMobileMenuItems = mobileMenuItems.filter(item => {
    const userRoles = user?.roles || [user?.role];
    return item.roles.some(role => userRoles.includes(role));
  });

  const handleItemClick = (item) => {
    playSound('click');
    triggerHaptic('light');
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
      ref={sidebarRef}
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
      onClose={handleClose}
      size={{ base: "xs", sm: "sm" }}
      closeOnOverlayClick={true}
      closeOnEsc={true}
    >
      <DrawerOverlay 
        bg={`blackAlpha.${overlayOpacity}`}
        backdropFilter="blur(4px)"
        onClick={() => {
          triggerHaptic('light');
          handleClose();
        }}
      />
      <DrawerContent maxW={{ base: "280px", sm: "320px" }} {...swipeHandlers}>
        <FocusLock returnFocus>
          <DrawerCloseButton 
            size="md"
            color="gray.600"
            _hover={{ color: "gray.800", bg: "gray.100" }}
            onClick={() => {
              triggerHaptic('light');
              playSound('click');
              handleClose();
            }}
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
              {filteredMobileMenuItems.map((item) => (
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
                      triggerHaptic('light');
                      playSound('click');
                      handleItemClick(item);
                      handleClose();
                    }}
                  >
                    <Icon as={item.icon} boxSize={6} />
                    <Text ml={3} fontSize="md" fontWeight="medium" flex={1}>
                      {item.label}
                    </Text>
                  </Flex>
                </Box>
              ))}
              
              {/* Account Settings Section (Mobile Only) */}
              <Box pt={4} mt={4} borderTop="1px" borderColor={borderColor}>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" px={3} mb={2}>
                  ACCOUNT
                </Text>

                {/* Account Settings Options */}
                <VStack spacing={1} align="stretch">
                  {/* Profile */}
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
                      triggerHaptic('light');
                      playSound('click');
                      navigate('/settings/profile');
                      handleClose();
                    }}
                  >
                    <Icon as={FaUser} boxSize={5} color="gray.600" />
                    <Text ml={3} fontSize="sm" fontWeight="medium">
                      Profile
                    </Text>
                  </Flex>

                  {/* Help */}
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
                      triggerHaptic('light');
                      playSound('click');
                      navigate('/help');
                      handleClose();
                    }}
                  >
                    <Icon as={InfoIcon} boxSize={5} color="blue.500" />
                    <Text ml={3} fontSize="sm" fontWeight="medium">
                      Help
                    </Text>
                  </Flex>

                  {/* Support */}
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
                      triggerHaptic('light');
                      playSound('click');
                      navigate('/support');
                      handleClose();
                    }}
                  >
                    <Icon as={PhoneIcon} boxSize={5} color="green.500" />
                    <Text ml={3} fontSize="sm" fontWeight="medium">
                      Support
                    </Text>
                  </Flex>

                  {/* Logout */}
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
                      triggerHaptic('medium');
                      playSound('click');
                      logout();
                      handleClose();
                    }}
                  >
                    <Icon as={WarningIcon} boxSize={5} />
                    <Text ml={3} fontSize="sm" fontWeight="medium">
                      Logout
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
        </FocusLock>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      {/* Overlay for desktop/tablet sidebar - shows when sidebar is open on md/lg breakpoints */}
      {isSidebarVisible && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={`blackAlpha.${overlayOpacity}`}
          backdropFilter="blur(2px)"
          display={{ base: "none", md: "block", lg: "none" }}
          zIndex={899}
          onClick={() => {
            console.log('Overlay clicked - closing sidebar');
            triggerHaptic('light');
            playSound('close');
            hideSidebar();
          }}
          cursor="pointer"
          transition="opacity 0.3s ease"
          _hover={{ bg: `blackAlpha.${Number(overlayOpacity) + 100}` }}
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