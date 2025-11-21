// src/layout/AppLayout.jsx
import React from "react";
import {
  Box,
  Flex,
  IconButton,
  Text,
  HStack,
  VStack,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  useColorModeValue,
  Spacer,
  Show,
  Hide,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { 
  FiMenu, 
  FiHome, 
  FiMapPin, 
  FiUsers, 
  FiSettings,
  FiPlus,
  FiCalendar,
  FiBell,
  FiSearch,
  FiMoreVertical,
} from "react-icons/fi";

// ---------- Sidebar ----------
const Sidebar = ({ current, onNavigate }) => {
  const bg = useColorModeValue("bg.card", "bg.card");
  const activeBg = useColorModeValue("brand.50", "neutral.800");
  const activeColor = useColorModeValue("brand.600", "brand.300");

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: FiHome },
    { key: "trips", label: "Trips", icon: FiMapPin },
    { key: "drivers", label: "Drivers", icon: FiUsers },
    { key: "settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <Box
      as="nav"
      bg={bg}
      h="100%"
      w={{ base: "full", md: "230px", lg: "260px" }}
      borderRightWidth={{ base: 0, md: "1px" }}
      borderColor="border.subtle"
      px={3}
      py={4}
    >
      <Text
        fontWeight="bold"
        fontSize={{ base: "lg", md: "xl" }}
        mb={{ base: 4, md: 6 }}
      >
        Elicia Transport
      </Text>

      <VStack align="stretch" spacing={1}>
        {navItems.map((item) => {
          const isActive = current === item.key;
          const Icon = item.icon;
          return (
            <Button
              key={item.key}
              justifyContent="flex-start"
              variant="ghost"
              size="md"
              leftIcon={<Icon />}
              onClick={() => onNavigate(item.key)}
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : "text.main"}
              _hover={{
                bg: isActive ? activeBg : "bg.subtle",
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </VStack>
    </Box>
  );
};

// ---------- Navbar ----------
const Navbar = ({ title, onOpenSidebar, notificationCount = 3 }) => {
  const bg = useColorModeValue("white", "neutral.900");
  const borderColor = useColorModeValue("border.subtle", "border.subtle");
  const iconColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "neutral.700");

  return (
    <Flex
      as="header"
      align="center"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 2, sm: 3, md: 5, lg: 6 }}
      py={{ base: 2, md: 3 }}
      position="sticky"
      top={0}
      zIndex={20}
      minH={{ base: "56px", md: "64px" }}
      gap={{ base: 2, md: 3 }}
    >
      {/* Left Section: Menu + Title */}
      <Flex align="center" gap={{ base: 2, md: 3 }} flex="1" minW={0}>
        {/* Hamburger for mobile only */}
        <Hide above="md">
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            size={{ base: "sm", sm: "md" }}
            color={iconColor}
            onClick={onOpenSidebar}
            _hover={{ bg: hoverBg }}
            _active={{ bg: hoverBg }}
          />
        </Hide>

        {/* Title - Truncated on small screens */}
        <Text
          fontWeight="semibold"
          fontSize={{ base: "md", sm: "lg", md: "xl" }}
          noOfLines={1}
          flex="1"
          minW={0}
        >
          {title}
        </Text>
      </Flex>

      {/* Right Section: Actions */}
      <HStack spacing={{ base: 1, sm: 2, md: 3 }} flexShrink={0}>
        {/* Search - Hidden on small mobile */}
        <Show above="sm">
          <IconButton
            aria-label="Search"
            icon={<FiSearch />}
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color={iconColor}
            _hover={{ bg: hoverBg }}
            display={{ base: "none", sm: "flex", md: "flex" }}
          />
        </Show>

        {/* Notifications - Icon with badge */}
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<FiBell />}
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color={iconColor}
            _hover={{ bg: hoverBg }}
          />
          {notificationCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Box>

        {/* Quick Actions - Desktop and Tablet */}
        <Show above="md">
          <Button
            leftIcon={<FiCalendar />}
            size="sm"
            variant="outline"
            colorScheme="brand"
          >
            Schedule
          </Button>
        </Show>

        {/* New Trip Button - All screens */}
        <Hide below="sm">
          <Button
            leftIcon={<FiPlus />}
            size={{ base: "sm", md: "md" }}
            variant="solid"
            colorScheme="brand"
          >
            <Show above="sm">New Trip</Show>
            <Hide above="sm">New</Hide>
          </Button>
        </Hide>

        {/* Mobile: Compact Plus Button */}
        <Show below="sm">
          <IconButton
            aria-label="New Trip"
            icon={<FiPlus />}
            size="sm"
            variant="solid"
            colorScheme="brand"
            borderRadius="full"
          />
        </Show>

        {/* More Menu - Mobile only */}
        <Show below="md">
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="More options"
              icon={<FiMoreVertical />}
              variant="ghost"
              size={{ base: "sm", sm: "md" }}
              color={iconColor}
              _hover={{ bg: hoverBg }}
            />
            <MenuList>
              <MenuItem icon={<FiSearch />}>Search</MenuItem>
              <MenuItem icon={<FiCalendar />}>Schedule Trip</MenuItem>
              <MenuItem icon={<FiMapPin />}>View All Trips</MenuItem>
              <Divider />
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
            </MenuList>
          </Menu>
        </Show>

        {/* User Avatar - Desktop only */}
        <Show above="lg">
          <Menu>
            <MenuButton>
              <Avatar
                size="sm"
                name="User"
                bg="brand.500"
                color="white"
                cursor="pointer"
                _hover={{ opacity: 0.8 }}
              />
            </MenuButton>
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <Divider />
              <MenuItem color="red.500">Logout</MenuItem>
            </MenuList>
          </Menu>
        </Show>
      </HStack>
    </Flex>
  );
};

// ---------- Layout Shell ----------
export const AppLayout = ({ children, title = "Dashboard" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentView, setCurrentView] = React.useState("dashboard");
  const bgPage = useColorModeValue("bg.page", "bg.page");

  const handleNavigate = (view) => {
    setCurrentView(view);
    onClose();
  };

  return (
    <Flex h="100vh" bg={bgPage} overflow="hidden">
      {/* Pinned sidebar for iPad + desktop (md and up) */}
      <Show above="md">
        <Sidebar current={currentView} onNavigate={handleNavigate} />
      </Show>

      {/* Drawer sidebar for phones (base / sm) */}
      <Drawer placement="left" isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody p={0}>
            <Sidebar current={currentView} onNavigate={handleNavigate} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main section: navbar + page content */}
      <Flex direction="column" flex="1" h="100vh" overflow="hidden">
        <Navbar title={title} onOpenSidebar={onOpen} />
        <Box
          as="main"
          flex="1"
          overflowY="auto"
          px={{ base: 3, md: 6, lg: 8 }}
          py={{ base: 3, md: 5 }}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;
