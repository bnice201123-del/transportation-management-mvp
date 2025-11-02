import React from 'react';
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
        return 'green';
      case 'driver':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <>
      {/* Responsive Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileOpen={onMobileMenuOpen}
        onMobileClose={onMobileMenuClose}
      />
      
      <Box
        bg="green.50"
        borderBottom="2px"
        borderColor="green.200"
        position="sticky"
        top={0}
        zIndex={10}
        shadow="sm"
        ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} // Responsive left margin for sidebar
      >
        <Container maxW="container.xl" py={{ base: 2, md: 3 }} px={{ base: 4, md: 6 }}>
          <Flex alignItems="center" minH={{ base: "50px", md: "60px" }}>
            
            {/* Mobile: Logo + Menu Button */}
            <Box display={{ base: "flex", md: "none" }} alignItems="center" flex="1">
              <HStack spacing={3}>
                <IconButton
                  size={{ base: "sm", md: "md" }}
                  icon={<HamburgerIcon />}
                  aria-label="Open menu"
                  onClick={onMobileMenuOpen}
                  variant="ghost"
                  colorScheme="green"
                />
                <Box 
                  cursor="pointer"
                  onClick={() => {
                    if (user?.role === 'admin') {
                      window.location.href = '/admin/overview';
                    } else {
                      window.location.href = '/dashboard';
                    }
                  }}
                >
                  <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="green.600">
                    TransportHub
                  </Text>
                  <Text fontSize="xs" color="green.500" mt="-1" display={{ base: "none", sm: "block" }}>
                    Transportation Management
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Desktop: Logo Section */}
            <Box flex="1" display={{ base: "none", md: "block" }}>
              <Box 
                cursor="pointer"
                onClick={() => {
                  if (user?.role === 'admin') {
                    window.location.href = '/admin/overview';
                  } else {
                    window.location.href = '/dashboard';
                  }
                }}
              >
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold" color="green.600">
                  TransportHub
                </Text>
                <Text fontSize="xs" color="green.500" mt="-1">
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
                    bg={`${getRoleBadgeColor(user?.role)}.500`}
                  />
                  <Text fontSize="sm" color="gray.600">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
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

            {/* Right: Account Settings */}
            <Box flex="1">
              <Flex justify="flex-end">
                <Menu>
                  <MenuButton
                    as={Button}
                    leftIcon={<SettingsIcon />}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    colorScheme="green"
                    size={{ base: "sm", md: "md" }}
                    bg="green.100"
                    _hover={{ bg: "green.200" }}
                    _active={{ bg: "green.300" }}
                  >
                    <Text display={{ base: 'none', md: 'block' }}>
                      Account Settings
                    </Text>
                  </MenuButton>
                  <MenuList border="1px" borderColor="green.200" shadow="lg">
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

            {/* Mobile: User Info + Menu */}
            <Box display={{ base: "flex", md: "none" }} alignItems="center" ml="auto">
              <HStack spacing={2}>
                <VStack spacing={0} align="end">
                  <Text fontSize="xs" fontWeight="medium" color="gray.700">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </Text>
                  <Badge 
                    colorScheme={getRoleBadgeColor(user?.role)} 
                    variant="subtle"
                    fontSize="xs"
                  >
                    {user ? getRoleDisplayName(user.role) : 'Role'}
                  </Badge>
                </VStack>
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                  bg={`${getRoleBadgeColor(user?.role)}.500`}
                />
                <IconButton
                  size="sm"
                  icon={<SettingsIcon />}
                  aria-label="Account Settings"
                  variant="ghost"
                  colorScheme="green"
                  onClick={handleLogout}
                />
              </HStack>
            </Box>

          </Flex>
        </Container>
      </Box>

    </>
  );
};

export default Navbar;