import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FaRoute,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaCar
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';

const OperationsLanding = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  const operations = [
    {
      title: 'Dispatch',
      description: 'Manage active trips, assign drivers, and monitor dispatch operations',
      icon: FaRoute,
      path: '/dispatcher',
      color: 'blue.500'
    },
    {
      title: 'Scheduler',
      description: 'Create and manage trip schedules, recurring trips, and calendar views',
      icon: FaCalendarAlt,
      path: '/scheduler',
      color: 'green.500'
    },
    {
      title: 'Drivers',
      description: 'View driver profiles, manage assignments, and track driver performance',
      icon: FaUser,
      path: '/driver',
      color: 'teal.500'
    },
    {
      title: 'Riders',
      description: 'Manage rider information, view ride history, and handle rider requests',
      icon: FaUsers,
      path: '/riders',
      color: 'pink.500'
    },
    {
      title: 'Vehicles',
      description: 'Monitor fleet status, manage vehicle assignments, and track maintenance',
      icon: FaCar,
      path: '/vehicles',
      color: 'cyan.500'
    }
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Operations Center" />

      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Heading size="xl" color="gray.700" mb={4}>
                Operations Control Center
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
                Access all operational modules from this central hub. Manage dispatch, scheduling,
                drivers, riders, and vehicles efficiently.
              </Text>
            </Box>

            {/* Operations Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {operations.map((op, index) => (
                <Card
                  key={index}
                  bg={cardBg}
                  shadow="lg"
                  borderRadius="lg"
                  _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => navigate(op.path)}
                >
                  <CardBody>
                    <VStack spacing={4} align="center" textAlign="center">
                      <Icon as={op.icon} size="3rem" color={op.color} />
                      <Heading size="md" color="gray.700">
                        {op.title}
                      </Heading>
                      <Text color="gray.600" fontSize="sm">
                        {op.description}
                      </Text>
                      <Button
                        colorScheme={op.color.split('.')[0]}
                        variant="solid"
                        size="sm"
                        w="full"
                      >
                        Access {op.title}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {/* Quick Stats or Additional Info */}
            <Card bg={cardBg} shadow="md" borderRadius="lg">
              <CardBody>
                <HStack justify="space-around" wrap="wrap" spacing={4}>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">24</Text>
                    <Text fontSize="sm" color="gray.600">Active Trips</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">12</Text>
                    <Text fontSize="sm" color="gray.600">Available Drivers</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">8</Text>
                    <Text fontSize="sm" color="gray.600">Pending Trips</Text>
                  </VStack>
                  <VStack>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.500">15</Text>
                    <Text fontSize="sm" color="gray.600">Fleet Vehicles</Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default OperationsLanding;