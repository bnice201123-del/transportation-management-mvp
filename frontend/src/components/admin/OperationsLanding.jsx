import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  SimpleGrid,
  Flex
} from '@chakra-ui/react';
import {
  FaRoute,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaCar
} from 'react-icons/fa';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Navbar from '../shared/Navbar';

const OperationsLanding = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  const operations = [
    {
      title: 'Dispatch',
      description: 'Comprehensive dispatch operations hub with active trip monitoring, driver assignment center, and live tracking capabilities',
      icon: FaRoute,
      path: '/dispatcher',
      color: 'blue.500'
    },
    {
      title: 'Scheduler Center',
      description: 'Comprehensive trip scheduling and management hub with advanced scheduling tools, recurring trips, and calendar analytics',
      icon: FaCalendarAlt,
      path: '/scheduler',
      color: 'green.500'
    },
    {
      title: 'Driver Hub',
      description: 'Comprehensive driver management center with trip tracking, performance reports, vehicle assignment, location services, and availability controls',
      icon: FaUser,
      path: '/driver',
      color: 'teal.500'
    },
    {
      title: 'Riders',
      description: 'Comprehensive rider management: profiles, trip history, analytics, and new rider creation',
      icon: FaUsers,
      path: '/riders',
      color: 'pink.500'
    },
    {
      title: 'Vehicles',
      description: 'Comprehensive fleet management: vehicle profiles, maintenance tracking, analytics, and fleet performance',
      icon: FaCar,
      path: '/vehicles',
      color: 'orange.500'
    }
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar title="Operations Center" />

      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
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