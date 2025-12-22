import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
  Center,
  Spinner,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { FaUserShield, FaUsers, FaKey, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';

const UserRolesPermissions = () => {
  const navigate = useNavigate();
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  
  // State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box minHeight="100vh" bg={bgColor}>
        <Navbar />
        <Center height="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading User Roles & Permissions...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Back to Admin Button - Desktop Only */}
          <Flex mb={2} justifyContent="flex-start" display={{ base: 'none', lg: 'flex' }}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              colorScheme="blue"
            >
              Back to Admin Dashboard
            </Button>
          </Flex>
          {/* Header */}
          <Box>
            <Flex align="center" mb={2}>
              <FaUserShield size={32} color="#3182ce" style={{ marginRight: '16px' }} />
              <Heading size="xl" color="gray.800">
                User Roles & Permissions
              </Heading>
            </Flex>
            <Text color={textColor} fontSize="lg">
              Manage user roles and system permissions
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Icon as={FaUsers} boxSize={8} color="blue.500" mb={3} />
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber color="blue.600">156</StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Icon as={FaUserShield} boxSize={8} color="green.500" mb={3} />
                <Stat>
                  <StatLabel>Active Roles</StatLabel>
                  <StatNumber color="green.600">8</StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Icon as={FaKey} boxSize={8} color="purple.500" mb={3} />
                <Stat>
                  <StatLabel>Permissions</StatLabel>
                  <StatNumber color="purple.600">24</StatNumber>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody textAlign="center">
                <Icon as={FaCog} boxSize={8} color="orange.500" mb={3} />
                <Stat>
                  <StatLabel>System Roles</StatLabel>
                  <StatNumber color="orange.600">5</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Content */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* User Roles Section */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">User Roles Management</Heading>
                <Text fontSize="sm" color={textColor}>
                  Configure and assign roles to users
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Admin</Text>
                    <Badge colorScheme="red">5 Users</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Dispatcher</Text>
                    <Badge colorScheme="orange">12 Users</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Driver</Text>
                    <Badge colorScheme="green">89 Users</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Scheduler</Text>
                    <Badge colorScheme="blue">25 Users</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Rider</Text>
                    <Badge colorScheme="purple">25 Users</Badge>
                  </HStack>
                  
                  <Button colorScheme="blue" size="sm" mt={4}>
                    Manage Roles
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Permissions Section */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">System Permissions</Heading>
                <Text fontSize="sm" color={textColor}>
                  Configure system-wide permissions
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Create Trips</Text>
                    <Badge colorScheme="green">Enabled</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Manage Users</Text>
                    <Badge colorScheme="red">Admin Only</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">View Reports</Text>
                    <Badge colorScheme="blue">Role Based</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">System Settings</Text>
                    <Badge colorScheme="red">Admin Only</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Dispatch Control</Text>
                    <Badge colorScheme="orange">Dispatcher+</Badge>
                  </HStack>
                  
                  <Button colorScheme="purple" size="sm" mt={4}>
                    Configure Permissions
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Info Alert */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">User Roles & Permissions Management</Text>
              <Text fontSize="sm">
                This comprehensive system allows administrators to manage user roles, assign permissions, 
                and control access to various features of the transportation management platform.
              </Text>
            </VStack>
          </Alert>

          {/* Action Buttons */}
          <HStack justify="center" spacing={4}>
            <Button leftIcon={<FaUsers />} colorScheme="blue" size="lg">
              Manage Users
            </Button>
            <Button leftIcon={<FaUserShield />} colorScheme="green" size="lg">
              Create Role
            </Button>
            <Button leftIcon={<FaKey />} colorScheme="purple" size="lg">
              Edit Permissions
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default UserRolesPermissions;