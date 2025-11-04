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
  FaBus, 
  FaClipboardList, 
  FaHistory, 
  FaPrint,
  FaShare,
  FaSync
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdvancedSearchModal from '../search/AdvancedSearchModal';

const Sidebar = ({ isMobileOpen, onMobileClose, onMobileOpen }) => {
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
        { label: 'Reports', icon: SearchIcon, action: () => navigate('/admin/reports') },
        { label: 'Full Dashboard', icon: EditIcon, action: () => navigate('/admin') }
      ]
    }] : []),
    {
      id: 'schedule',
      label: 'Schedule Management',
      icon: CalendarIcon,
      color: 'green.500',
      path: '/scheduler',
      roles: ['scheduler', 'admin', 'dispatcher'],
      subItems: [
        // Core Scheduling Features
        { 
          label: 'Manage Trips', 
          icon: FaClipboardList, 
          action: () => navigate('/scheduler/manage'),
          description: 'Create, view, edit, and delete trips - All-in-one management'
        },
        { 
          label: 'Recurring Trips', 
          icon: RepeatIcon, 
          action: () => navigate('/scheduler/recurring'),
          description: 'Create and manage recurring trip patterns',
          roles: ['admin', 'scheduler', 'dispatcher']
        },
        
        // Advanced Features
        { 
          label: 'Driver Assignment', 
          icon: FaUser, 
          action: () => navigate('/scheduler/assign-drivers'),
          description: 'Assign drivers to scheduled trips'
        },
        { 
          label: 'Vehicle Assignment', 
          icon: FaBus, 
          action: () => navigate('/scheduler/assign-vehicles'),
          description: 'Assign vehicles to trips'
        },
        
        // Calendar and Timeline Views
        { 
          label: 'Calendar View', 
          icon: CalendarIcon, 
          action: () => navigate('/scheduler/calendar'),
          description: 'Monthly calendar interface'
        },
        
        // Schedule History and Tracking
        { 
          label: 'Schedule History', 
          icon: FaHistory, 
          action: () => navigate('/scheduler/history'),
          description: 'View past individual schedules and changes'
        },
        { 
          label: 'Completed Trips', 
          icon: FaCalendarCheck, 
          action: () => navigate('/scheduler/completed'),
          description: 'Review individual completed trips'
        },
        
        // Communication and Sharing
        { 
          label: 'Share Schedules', 
          icon: FaShare, 
          action: () => navigate('/scheduler/share'),
          description: 'Share schedules with drivers/riders'
        },
        { 
          label: 'Print Schedules', 
          icon: FaPrint, 
          action: () => navigate('/scheduler/print'),
          description: 'Print-friendly schedule formats'
        },
        { 
          label: 'Sync with External', 
          icon: FaSync, 
          action: () => navigate('/scheduler/sync'),
          description: 'Sync with external calendar systems',
          roles: ['admin']
        }
      ].filter(item => {
        // Filter items based on user role if item has specific role requirements
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
      })
    },
    {
      id: 'search',
      label: 'Search & History',
      icon: SearchIcon,
      color: 'purple.500',
      path: '/search',
      roles: ['scheduler', 'dispatcher', 'admin'],
      isModal: true, // Special flag to indicate this opens a modal
      subItems: [
        { label: 'Advanced Search', icon: SearchIcon, isModal: true },
        { label: 'Trip History', icon: TimeIcon, action: () => navigate('/trips/history') },
        { label: 'Rider History', icon: ViewIcon, action: () => navigate('/riders/history') },
        { label: 'Driver Reports', icon: InfoIcon, action: () => navigate('/drivers/reports') },
        { label: 'Vehicle Logs', icon: SettingsIcon, action: () => navigate('/vehicles/logs') }
      ]
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: TimeIcon,
      color: 'orange.500',
      path: '/dispatcher',
      roles: ['dispatcher', 'admin'],
      subItems: [
        { label: 'Active Trips', icon: ViewIcon, action: () => navigate('/dispatcher') },
        { label: 'Assign Driver', icon: AddIcon, action: () => navigate('/dispatcher/assign') },
        { label: 'Trip Status', icon: InfoIcon, action: () => navigate('/dispatcher/status') },
        { label: 'Emergency', icon: StarIcon, action: () => navigate('/dispatcher/emergency') },
        { label: 'Route Monitor', icon: SearchIcon, action: () => navigate('/dispatcher/monitor') }
      ]
    },
    // System Administration - for admin users only
    ...(user?.role === 'admin' ? [{
      id: 'system-admin',
      label: 'System Administration',
      icon: SettingsIcon,
      color: 'red.500',
      path: '/admin/settings',
      roles: ['admin'],
      subItems: [
        { label: 'System Settings', icon: SettingsIcon, action: () => navigate('/admin/settings') },
        { label: 'User Management', icon: AddIcon, action: () => navigate('/admin/register') },
        { label: 'System Config', icon: EditIcon, action: () => navigate('/admin/config') },
        { label: 'Audit Logs', icon: TimeIcon, action: () => navigate('/admin/logs') },
        { label: 'Backup & Restore', icon: CalendarIcon, action: () => navigate('/admin/backup') },
        { label: 'Security', icon: UnlockIcon, action: () => navigate('/admin/security') }
      ]
    }] : []),
    // User Management - for admin users only
    ...(user?.role === 'admin' ? [{
      id: 'user-management',
      label: 'User Management',
      icon: UnlockIcon,
      color: 'teal.500',
      path: '/admin/register',
      roles: ['admin'],
      subItems: [
        { label: 'Register New User', icon: UnlockIcon, action: () => navigate('/admin/register') },
        { label: 'Manage Users', icon: SettingsIcon, action: () => navigate('/admin/users') },
        { label: 'User Roles & Permissions', icon: InfoIcon, action: () => navigate('/admin/roles') },
        { label: 'Access Control', icon: EditIcon, action: () => navigate('/admin/access') },
        { label: 'Bulk Operations', icon: AddIcon, action: () => navigate('/admin/import') }
      ]
    }] : []),
    {
      id: 'rider',
      label: 'Riders',
      icon: FaUser,
      color: 'pink.500',
      path: '/riders',
      roles: ['scheduler', 'dispatcher', 'admin'],
      subItems: [
        { label: 'All Riders', icon: ViewIcon, action: () => navigate('/riders') },
        { label: 'Add Rider', icon: AddIcon, action: () => navigate('/riders/add') },
        { label: 'Search Riders', icon: SearchIcon, action: () => navigate('/riders/search') },
        { label: 'Ride History', icon: TimeIcon, action: () => navigate('/riders/history') },
        { label: 'Manage Riders', icon: SettingsIcon, action: () => navigate('/riders/manage') }
      ]
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: FaCar,
      color: 'cyan.500',
      path: '/vehicles',
      roles: ['scheduler', 'dispatcher', 'admin'],
      subItems: [
        { label: 'All Vehicles', icon: ViewIcon, action: () => navigate('/vehicles') },
        { label: 'Add Vehicle', icon: AddIcon, action: () => navigate('/vehicles/add') },
        { label: 'Vehicle Assignment', icon: SettingsIcon, action: () => navigate('/vehicles/assign') },
        { label: 'Out of Service', icon: DeleteIcon, action: () => navigate('/vehicles/maintenance') },
        { label: 'Vehicle Reports', icon: SearchIcon, action: () => navigate('/vehicles/reports') }
      ]
    },
    {
      id: 'maps',
      label: 'Maps',
      icon: FaMap,
      color: 'green.500',
      path: '/maps',
      roles: ['scheduler', 'dispatcher', 'admin'],
      subItems: [
        { label: 'Trip Maps', icon: ViewIcon, action: () => navigate('/maps') },
        { label: 'Route Planning', icon: SearchIcon, action: () => navigate('/maps/routes') },
        { label: 'Live Tracking', icon: TimeIcon, action: () => navigate('/maps/tracking') }
      ]
    },
    {
      id: 'driver',
      label: 'Driver',
      icon: StarIcon,
      color: 'teal.500',
      path: '/driver',
      roles: ['driver', 'admin'],
      subItems: [
        { label: 'My Trips', icon: ViewIcon, action: () => navigate('/driver') },
        { label: 'Check In/Out', icon: TimeIcon, action: () => navigate('/driver/checkin') },
        { label: 'Vehicle Status', icon: InfoIcon, action: () => navigate('/driver/vehicle') },
        { label: 'Trip History', icon: SearchIcon, action: () => navigate('/driver/history') },
        { label: 'Profile', icon: SettingsIcon, action: () => navigate('/driver/profile') }
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
    <Drawer isOpen={isMobileOpen} placement="left" onClose={onMobileClose} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Text fontSize="lg" fontWeight="bold" color="green.600">
            TransportHub
          </Text>
        </DrawerHeader>
        <DrawerBody p={0}>
          <VStack spacing={1} align="stretch">
            {filteredMenuItems.map((item) => (
              <Box key={item.id}>
                <Flex
                  align="center"
                  p={4}
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
                  <Text ml={3} fontSize="md" fontWeight="medium" flex={1}>
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
                    <VStack spacing={0} align="stretch" bg="gray.50">
                      {item.subItems.map((subItem, index) => (
                        <Flex
                          key={index}
                          align="center"
                          p={3}
                          pl={12}
                          cursor="pointer"
                          _hover={{ bg: hoverBg, color: item.color }}
                          transition="all 0.1s"
                          onClick={(e) => {
                            e.stopPropagation();
                            subItem.action();
                          }}
                        >
                          <Icon as={subItem.icon} boxSize={4} />
                          <Text ml={2} fontSize="sm">
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
      
      {/* Mobile Menu Button */}
      <IconButton
        aria-label="Open menu"
        icon={<HamburgerIcon />}
        position="fixed"
        top={4}
        left={4}
        zIndex={1001}
        display={{ base: "flex", md: "none" }}
        onClick={onMobileOpen}
        colorScheme="green"
        size="sm"
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal 
        isOpen={isSearchOpen} 
        onClose={onSearchClose} 
      />
    </>
  );
};

export default Sidebar;