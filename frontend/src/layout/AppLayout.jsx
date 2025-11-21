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
} from "@chakra-ui/react";
import { FiMenu, FiHome, FiMapPin, FiUsers, FiSettings } from "react-icons/fi";

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
const Navbar = ({ title, onOpenSidebar }) => {
  const bg = useColorModeValue("white", "neutral.900");
  const borderColor = useColorModeValue("border.subtle", "border.subtle");

  return (
    <Flex
      as="header"
      align="center"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 3, md: 5, lg: 6 }}
      py={{ base: 2, md: 3 }}
      position="sticky"
      top={0}
      zIndex={20}
      minH={{ base: "56px", md: "64px" }}
    >
      {/* Hamburger for phones only (iPhone, small devices) */}
      <Hide above="md">
        <IconButton
          mr={2}
          aria-label="Open menu"
          icon={<FiMenu />}
          variant="ghost"
          onClick={onOpenSidebar}
          fontSize="xl"
        />
      </Hide>

      <Text
        fontWeight="semibold"
        fontSize={{ base: "lg", md: "xl" }}
        noOfLines={1}
      >
        {title}
      </Text>

      <Spacer />

      {/* Right-side actions – hide some on small screens */}
      <HStack spacing={3}>
        <Show above="md">
          <Button size="sm" variant="outline">
            Schedule Trip
          </Button>
        </Show>
        <Button size={{ base: "sm", md: "md" }} colorScheme="blue">
          New Trip
        </Button>
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
