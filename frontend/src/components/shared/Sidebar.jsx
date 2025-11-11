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
  useBreakpointValue
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
  FaMap, 
  FaRoute, 
  FaCalendarPlus, 
  FaCalendarCheck, 
  FaCalendarTimes, 
  FaClipboardList, 
  FaPrint,
  FaShare
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdvancedSearchModal from '../search/AdvancedSearchModal';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { user } = useAuth();
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
  
  // Responsive sidebar width
  const sidebarWidth = useBreakpointValue({ 
    base: 0, 
    md: "60px", 
    lg: "200px", 
    xl: "240px" 
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
    {
      id: 'search',
      label: 'Search & History',
      icon: SearchIcon,
      color: 'purple.500',
      path: '/search',
      roles: ['scheduler', 'dispatcher', 'admin'],
      isModal: true, // Special flag to indicate this opens a modal
      subItems: [
        { label: 'Rider History', icon: ViewIcon, action: () => navigate('/riders/history?openFilter=true') },
        { label: 'Driver Reports', icon: InfoIcon, action: () => navigate('/driver/report?openFilter=true') },
        { label: 'Vehicle Logs', icon: SettingsIcon, action: () => navigate('/vehicles/log?openFilter=true') }
      ]
    },
    // System Administration - for admin users only
    ...(user?.role === 'admin' ? [{
      id: 'system-admin',
      label: 'System Administration',
      icon: SettingsIcon,
      color: 'red.500',
      path: '/admin/system',
      roles: ['admin'],
      subItems: [
        { label: 'System Landing', icon: SettingsIcon, action: () => navigate('/admin/system') },
        { label: 'System Settings', icon: SettingsIcon, action: () => navigate('/admin/settings') },
        { label: 'Register New User', icon: UnlockIcon, action: () => navigate('/admin/register') },
        { label: 'Manage Users', icon: SettingsIcon, action: () => navigate('/admin/users') },
        { label: 'User Roles & Permissions', icon: InfoIcon, action: () => navigate('/admin/roles') },
        { label: 'Backup & Restore', icon: CalendarIcon, action: () => navigate('/admin/backup') },
        { label: 'Security', icon: UnlockIcon, action: () => navigate('/admin/security') }
      ]
    }] : []),


    // Operations - for scheduler, dispatcher, and admin users
    ...(user?.role === 'scheduler' || user?.role === 'dispatcher' || user?.role === 'admin' ? [{
      id: 'operations',
      label: 'Operations',
      icon: FaRoute,
      color: 'orange.500',
      path: '/admin/operations',
      roles: ['scheduler', 'dispatcher', 'admin'],
      subItems: [
        ...(user?.role === 'dispatcher' || user?.role === 'admin' ? [
          { label: 'Dispatch', icon: TimeIcon, action: () => navigate('/dispatcher') }
        ] : []),
        ...(user?.role === 'scheduler' || user?.role === 'admin' ? [
          { label: 'Scheduler', icon: CalendarIcon, action: () => navigate('/scheduler') }
        ] : []),
        ...(user?.role === 'admin' ? [
          { label: 'Drivers', icon: StarIcon, action: () => navigate('/driver') },
          { label: 'Riders', icon: FaUser, action: () => navigate('/riders?openModal=true') },
          { label: 'Vehicles', icon: FaCar, action: () => navigate('/vehicles') }
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
        { label: 'Route Planning', icon: SearchIcon, action: () => navigate('/maps/routes') }
      ]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'guest')
  );

  const handleItemClick = (item) => {
    if (item.id === 'search' || item.isModal) {
      onSearchOpen();
    } else {
      navigate(item.path || item);
      if (onMobileClose) {
        onMobileClose(); // Close mobile menu on navigation
      }
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
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
      zIndex={999}
      shadow="xl"
      py={4}
      display={{ base: "none", md: "block" }}
      overflowY="auto"
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
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
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