import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FaSignOutAlt,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaTruck,
  FaBatteryFull,
  FaSignal,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useDualLogin } from '../../contexts/useDualLogin';
import axios from 'axios';

/**
 * DualLoginDriverDashboard Component
 * Dashboard for dual login driver section
 * Shows driver info, active trackers, and statistics
 */
const DualLoginDriverDashboard = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [trackers, setTrackers] = useState([]);
  const [error, setError] = useState(null);

  // Hooks
  const { driverAuth, logoutDriver } = useDualLogin();
  const navigate = useNavigate();
  const toast = useToast();

  // Colors
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  /**
   * Fetch dashboard data on mount
   */
  useEffect(() => {
    if (!driverAuth.isAuthenticated) {
      navigate('/driver/dual-login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/drivers/${driverAuth.userId}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${driverAuth.token}`
            }
          }
        );

        setDashboardData(response.data.data);
        setTrackers(response.data.data.recentTrackers || []);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || 'Failed to load dashboard';
        setError(errorMessage);

        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [driverAuth.isAuthenticated, driverAuth.userId, driverAuth.token, navigate, toast]);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logoutDriver();
    toast({
      title: 'Logged Out',
      description: 'You have been logged out of the driver section',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
    navigate('/driver/dual-login');
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'suspended':
        return 'red';
      default:
        return 'blue';
    }
  };

  /**
   * Get signal quality color
   */
  const getSignalColor = (signal) => {
    switch (signal) {
      case 'excellent':
        return 'green';
      case 'good':
        return 'blue';
      case 'fair':
        return 'orange';
      case 'poor':
        return 'red';
      case 'no_signal':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.400" />
          <Text color="gray.600">Loading dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pb={8}>
      {/* Header */}
      <Box
        bg="linear(to-r, blue.400, purple.500)"
        color="white"
        py={8}
        shadow="sm"
      >
        <Container maxW="7xl">
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading size="lg">Driver Dashboard</Heading>
              <Text opacity={0.9}>
                Welcome back, {driverAuth.userName}!
              </Text>
            </VStack>
            <Button
              leftIcon={<FaSignOutAlt />}
              variant="solid"
              bg="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </HStack>

          {/* Driver Info */}
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <Box>
              <Text fontSize="xs" opacity={0.8} mb={1}>
                Driver ID
              </Text>
              <HStack spacing={2}>
                <Icon as={FaUser} />
                <Text fontWeight="bold">{driverAuth.driverId}</Text>
              </HStack>
            </Box>
            <Box>
              <Text fontSize="xs" opacity={0.8} mb={1}>
                Account Type
              </Text>
              <Badge colorScheme="cyan" fontSize="sm">
                {dashboardData?.accountType || 'Regular'}
              </Badge>
            </Box>
            <Box>
              <Text fontSize="xs" opacity={0.8} mb={1}>
                Login Type
              </Text>
              <Text fontSize="sm">{dashboardData?.loginType || 'Driver ID'}</Text>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        {error && (
          <Box
            bg="red.50"
            p={4}
            rounded="md"
            mb={6}
            borderLeft="4px"
            borderColor="red.400"
          >
            <HStack spacing={2}>
              <Icon as={FaExclamationTriangle} color="red.500" />
              <Text color="red.800">{error}</Text>
            </HStack>
          </Box>
        )}

        {/* Statistics Grid */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={8}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaTruck} />
                  Total Trackers
                </StatLabel>
                <StatNumber>{dashboardData?.trackerCount || 0}</StatNumber>
                <StatHelpText>
                  Vehicles under management
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaCheckCircle} color="green.400" />
                  Active
                </StatLabel>
                <StatNumber color="green.500">
                  {dashboardData?.trackerStats?.active || 0}
                </StatNumber>
                <StatHelpText>
                  Operational trackers
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaClock} color="orange.400" />
                  Inactive
                </StatLabel>
                <StatNumber color="orange.500">
                  {dashboardData?.trackerStats?.inactive || 0}
                </StatNumber>
                <StatHelpText>
                  Waiting to be activated
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaExclamationTriangle} color="red.400" />
                  Issues
                </StatLabel>
                <StatNumber color="red.500">
                  {(dashboardData?.trackerStats?.suspended || 0) +
                    (dashboardData?.trackerStats?.archived || 0)}
                </StatNumber>
                <StatHelpText>
                  Suspended or archived
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Recent Trackers Section */}
        <Card bg={cardBg} mb={8}>
          <CardHeader pb={2}>
            <Heading size="md">Recent Vehicle Trackers</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            {trackers.length === 0 ? (
              <Box py={8} textAlign="center">
                <Icon as={FaTruck} boxSize={8} color="gray.300" mb={2} />
                <Text color="gray.500">No trackers available</Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {trackers.map((tracker) => (
                  <Box
                    key={tracker._id}
                    p={4}
                    border="1px"
                    borderColor={borderColor}
                    rounded="md"
                    _hover={{
                      shadow: 'md',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Grid
                      templateColumns="1fr auto"
                      gap={4}
                      mb={3}
                    >
                      <Box>
                        <Heading size="sm" mb={1}>
                          {tracker.vehicleId?.name || 'Unknown Vehicle'}
                        </Heading>
                        <HStack spacing={4} fontSize="sm" color="gray.600">
                          <HStack spacing={1}>
                            <Icon as={FaPhone} />
                            <Text>{tracker.phoneNumber}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={FaMapMarkerAlt} />
                            <Text>
                              {tracker.lastKnownLocation?.address || 'No location'}
                            </Text>
                          </HStack>
                        </HStack>
                      </Box>
                      <Badge
                        colorScheme={getStatusColor(tracker.status)}
                        fontSize="sm"
                        height="fit-content"
                      >
                        {tracker.status}
                      </Badge>
                    </Grid>

                    {/* Tracker Details */}
                    <Grid templateColumns="repeat(4, 1fr)" gap={2}>
                      <Box bg={statBg} p={3} rounded="md">
                        <Text fontSize="xs" color="gray.600" mb={1}>
                          Battery
                        </Text>
                        <HStack spacing={1}>
                          <Icon as={FaBatteryFull} color="green.400" />
                          <Text fontWeight="bold">{tracker.batteryLevel}%</Text>
                        </HStack>
                      </Box>

                      <Box bg={statBg} p={3} rounded="md">
                        <Text fontSize="xs" color="gray.600" mb={1}>
                          Signal
                        </Text>
                        <HStack spacing={1}>
                          <Icon
                            as={FaSignal}
                            color={getSignalColor(tracker.signalStrength)}
                          />
                          <Text fontWeight="bold" fontSize="sm">
                            {tracker.signalStrength}
                          </Text>
                        </HStack>
                      </Box>

                      <Box bg={statBg} p={3} rounded="md">
                        <Text fontSize="xs" color="gray.600" mb={1}>
                          Last Update
                        </Text>
                        <Text fontWeight="bold" fontSize="sm">
                          {tracker.lastTrackedAt
                            ? new Date(tracker.lastTrackedAt).toLocaleTimeString()
                            : 'Never'}
                        </Text>
                      </Box>

                      <Box bg={statBg} p={3} rounded="md">
                        <Text fontSize="xs" color="gray.600" mb={1}>
                          Health
                        </Text>
                        <HStack spacing={1}>
                          <Icon
                            as={
                              tracker.batteryLevel > 20 &&
                              tracker.signalStrength !== 'no_signal'
                                ? FaCheckCircle
                                : FaExclamationTriangle
                            }
                            color={
                              tracker.batteryLevel > 20 &&
                              tracker.signalStrength !== 'no_signal'
                                ? 'green.400'
                                : 'red.400'
                            }
                          />
                          <Text fontWeight="bold" fontSize="sm">
                            {tracker.batteryLevel > 20 &&
                            tracker.signalStrength !== 'no_signal'
                              ? 'Good'
                              : 'Alert'}
                          </Text>
                        </HStack>
                      </Box>
                    </Grid>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      mt={3}
                      w="full"
                      onClick={() =>
                        navigate(`/driver/tracker/${tracker._id}`)
                      }
                    >
                      View Details & Configure
                    </Button>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/driver/trackers')}
          >
            View All Trackers
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/driver/settings')}
          >
            Driver Settings
          </Button>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default DualLoginDriverDashboard;
