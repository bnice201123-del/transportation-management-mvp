import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  SimpleGrid,
  useColorModeValue,
  Badge,
  Flex,
  Spacer,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  SettingsIcon,
  UnlockIcon,
  AddIcon,
  InfoIcon,
  EditIcon,
  TimeIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { FaUserPlus, FaUserCog, FaUserShield, FaFileImport, FaServer, FaLock, FaShieldAlt, FaDatabase, FaHistory, FaUsers, FaCog, FaKey } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const SystemAdministration = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)');
  const categoryBg = useColorModeValue('gray.100', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const dividerColor = useColorModeValue('gray.300', 'gray.600');

  const adminFunctions = [
    {
      title: 'User Management & Access Control',
      description: 'Comprehensive user management, roles, permissions, and access control',
      icon: FaUsers,
      color: 'blue.500',
      functions: [
        {
          name: 'Register New User',
          description: 'Add new users to the system with role assignment',
          icon: FaUserPlus,
          path: '/admin/register',
          color: 'green.500'
        },
        {
          name: 'Manage Users',
          description: 'View, edit, activate/deactivate existing users',
          icon: FaUserCog,
          path: '/admin/users',
          color: 'blue.500'
        },
        {
          name: 'User Roles & Permissions',
          description: 'Configure roles, permissions, and access levels',
          icon: FaUserShield,
          path: '/admin/roles',
          color: 'purple.500'
        },
        {
          name: 'Access Control',
          description: 'Manage user access, sessions, and security policies',
          icon: FaKey,
          path: '/admin/access',
          color: 'orange.500'
        },
        {
          name: 'Bulk User Operations',
          description: 'Import/export users, bulk updates, and mass operations',
          icon: FaFileImport,
          path: '/admin/import',
          color: 'teal.500'
        },
        {
          name: 'User Activity Monitor',
          description: 'Track user login history and activity patterns',
          icon: FaHistory,
          path: '/admin/activity',
          color: 'cyan.500'
        }
      ]
    },
    {
      title: 'System Configuration',
      description: 'Configure system settings and preferences',
      icon: FaCog,
      color: 'green.500',
      functions: [
        {
          name: 'System Settings',
          description: 'General system configuration',
          icon: SettingsIcon,
          path: '/admin/settings', // This is the current page
          color: 'blue.500'
        },
        {
          name: 'Database Management',
          description: 'Database configuration and maintenance',
          icon: FaDatabase,
          path: '/admin/overview', // Using existing admin overview for now
          color: 'green.500'
        },
        {
          name: 'Server Configuration',
          description: 'Server settings and performance',
          icon: FaServer,
          path: '/admin/overview', // Using existing admin overview for now
          color: 'orange.500'
        }
      ]
    },
    {
      title: 'Security & Monitoring',
      description: 'Security settings and system monitoring',
      icon: FaShieldAlt,
      color: 'red.500',
      functions: [
        {
          name: 'Security Settings',
          description: 'Security policies and authentication',
          icon: FaShieldAlt,
          path: '/admin/security', // Link to the new Security dashboard
          color: 'red.500'
        },
        {
          name: 'Audit Logs',
          description: 'System activity and audit trails',
          icon: FaHistory,
          path: '/admin/overview', // Using existing admin overview for now
          color: 'purple.500'
        },
        {
          name: 'Backup & Restore',
          description: 'Data backup and recovery options',
          icon: CalendarIcon,
          path: '/admin/backup-restore', // Link to the new Backup and Restore dashboard
          color: 'teal.500'
        }
      ]
    }
  ];

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Navbar />
      <Container maxW="full" py={{ base: 4, md: 6, lg: 8 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 6, md: 8, lg: 10 }} align="stretch">
          {/* Header */}
          <Box
            bg={headerBg}
            borderRadius="xl"
            p={{ base: 6, md: 8, lg: 12 }}
            textAlign={{ base: "center", md: "center" }}
            color="white"
            boxShadow="2xl"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bg: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'xl'
            }}
          >
            <VStack spacing={{ base: 3, md: 4 }} position="relative" zIndex={1}>
              <Icon as={SettingsIcon} boxSize={{ base: 10, md: 12 }} opacity={0.8} />
              <Heading 
                size={{ base: "lg", md: "xl", lg: "2xl" }}
                fontWeight="bold"
              >
                System Administration
              </Heading>
              <Text 
                fontSize={{ base: "md", md: "lg", lg: "xl" }}
                opacity={0.9} 
                maxW="2xl"
              >
                Comprehensive control center for managing users, configuring system settings, and monitoring security
              </Text>
            </VStack>
          </Box>

          {/* System Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
            <Card
              bg={cardBg}
              shadow="md"
              borderRadius="lg"
              _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
              transition="all 0.3s"
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                <Icon as={FaUsers} boxSize={{ base: 6, md: 8 }} color="blue.500" mb={3} />
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }} color="gray.600" fontWeight="medium">Total Users</StatLabel>
                  <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.600">0</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card
              bg={cardBg}
              shadow="md"
              borderRadius="lg"
              _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
              transition="all 0.3s"
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                <Icon as={TimeIcon} boxSize={{ base: 6, md: 8 }} color="green.500" mb={3} />
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }} color="gray.600" fontWeight="medium">Active Sessions</StatLabel>
                  <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.600">0</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card
              bg={cardBg}
              shadow="md"
              borderRadius="lg"
              _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
              transition="all 0.3s"
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <CardBody textAlign="center" py={{ base: 4, md: 6 }}>
                <Icon as={FaShieldAlt} boxSize={{ base: 6, md: 8 }} color="purple.500" mb={3} />
                <Stat>
                  <StatLabel fontSize={{ base: "xs", md: "sm" }} color="gray.600" fontWeight="medium">System Status</StatLabel>
                  <StatNumber fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                    <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize={{ base: "xs", md: "sm" }}>
                      Online
                    </Badge>
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Administration Functions */}
          <VStack spacing={{ base: 8, md: 10, lg: 12 }} align="stretch">
            {adminFunctions.map((category, categoryIndex) => (
              <Box key={categoryIndex}>
                <Box
                  bg={categoryBg}
                  p={{ base: 4, md: 6 }}
                  borderRadius="lg"
                  mb={{ base: 4, md: 6 }}
                  borderLeft="4px solid"
                  borderLeftColor={category.color}
                >
                  <Flex align="center" mb={3}>
                    <Icon as={category.icon} color={category.color} boxSize={{ base: 6, md: 8 }} mr={3} />
                    <Heading size={{ base: "md", md: "lg" }} color="teal.600" fontWeight="semibold">
                      {category.title}
                    </Heading>
                  </Flex>
                  <Text color={textColor} fontSize={{ base: "sm", md: "md" }}>
                    {category.description}
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
                  {category.functions.map((func, funcIndex) => (
                    <Card
                      key={funcIndex}
                      bg={cardBg}
                      shadow="md"
                      borderRadius="xl"
                      cursor="pointer"
                      transition="all 0.3s"
                      _hover={{
                        shadow: '2xl',
                        transform: 'translateY(-4px) scale(1.02)',
                        borderColor: func.color,
                        _before: { opacity: 1 }
                      }}
                    >
                      <CardBody p={{ base: 4, md: 5, lg: 6 }}>
                        <VStack spacing={{ base: 3, md: 4 }} align="start" h="full">
                          <Flex align="center" w="full" flexWrap="wrap" gap={2}>
                            <Box
                              p={{ base: 2, md: 3 }}
                              borderRadius="lg"
                              bg={`${func.color.split('.')[0]}.50`}
                              mr={{ base: 2, md: 4 }}
                            >
                              <Icon as={func.icon} color={func.color} boxSize={{ base: 5, md: 6 }} />
                            </Box>
                            <Heading 
                              size={{ base: "sm", md: "md" }}
                              color={headingColor} 
                              flex="1" 
                              fontWeight="semibold"
                              minW="150px"
                            >
                              {func.name}
                            </Heading>
                          </Flex>
                          <Text color={textColor} fontSize={{ base: "xs", md: "sm" }} lineHeight="1.5" flex="1">
                            {func.description}
                          </Text>
                          <Button
                            size={{ base: "xs", md: "sm" }}
                            colorScheme="teal"
                            variant="solid"
                            alignSelf="flex-end"
                            borderRadius="lg"
                            fontWeight="medium"
                            _hover={{
                              transform: 'translateY(-1px)',
                              shadow: 'md'
                            }}
                            transition="all 0.2s"
                            onClick={() => navigate(func.path)}
                          >
                            Access →
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {categoryIndex < adminFunctions.length - 1 && (
                  <Divider
                    my={{ base: 8, md: 10, lg: 12 }}
                    borderColor={dividerColor}
                    borderWidth="1px"
                    opacity={0.5}
                  />
                )}
              </Box>
            ))}
          </VStack>

          {/* Quick Actions */}
          <Card
            bg={cardBg}
            shadow="xl"
            borderRadius="xl"
            border="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            overflow="hidden"
          >
            <CardHeader
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderBottom="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
            >
              <Flex align="center">
                <Icon as={FaCog} color="blue.500" boxSize={6} mr={3} />
                <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
                  Quick Actions
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Button
                  leftIcon={<TimeIcon />}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  height="auto"
                  py={4}
                  borderRadius="lg"
                  _hover={{
                    bg: 'blue.50',
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  transition="all 0.3s"
                  fontWeight="medium"
                >
                  <VStack spacing={1} align="start">
                    <Text fontSize="sm" opacity={0.8}>View Recent</Text>
                    <Text>Activity</Text>
                  </VStack>
                </Button>
                <Button
                  leftIcon={<FaShieldAlt />}
                  colorScheme="green"
                  variant="outline"
                  size="lg"
                  height="auto"
                  py={4}
                  borderRadius="lg"
                  _hover={{
                    bg: 'green.50',
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  transition="all 0.3s"
                  fontWeight="medium"
                >
                  <VStack spacing={1} align="start">
                    <Text fontSize="sm" opacity={0.8}>System Health</Text>
                    <Text>Check</Text>
                  </VStack>
                </Button>
                <Button
                  leftIcon={<InfoIcon />}
                  colorScheme="purple"
                  variant="outline"
                  size="lg"
                  height="auto"
                  py={4}
                  borderRadius="lg"
                  _hover={{
                    bg: 'purple.50',
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  transition="all 0.3s"
                  fontWeight="medium"
                >
                  <VStack spacing={1} align="start">
                    <Text fontSize="sm" opacity={0.8}>Generate</Text>
                    <Text>Report</Text>
                  </VStack>
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default SystemAdministration;