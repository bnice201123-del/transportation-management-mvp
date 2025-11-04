import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Badge,
  Progress,
  SimpleGrid,
  Icon,
  Flex,
  Spinner,
  Center,
  useToast,
  Divider,
  Avatar,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  CalendarIcon,
  ViewIcon,
  SettingsIcon,
  StarIcon,
  TimeIcon,
  WarningIcon,
  CheckCircleIcon,
  InfoIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { FaCar, FaUser, FaRoute, FaTachometerAlt, FaUsers, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const AdminOverview = () => {
  const [overviewData, setOverviewData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch multiple data sources for overview
      const [analyticsRes, healthRes, usersRes, tripsRes] = await Promise.all([
        axios.get('/analytics/dashboard').catch((err) => {
          console.warn('Analytics API not available:', err.message);
          return { data: null };
        }),
        axios.get('/health').catch((err) => {
          console.warn('Health API not available:', err.message);
          return { data: { status: 'Unknown', message: 'Health check failed' } };
        }),
        axios.get('/users').catch((err) => {
          console.warn('Users API not available:', err.message);
          return { data: [] };
        }),
        axios.get('/trips').catch((err) => {
          console.warn('Trips API not available:', err.message);
          return { data: [] };
        })
      ]);

      // Safely access data with null checks
      const users = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const trips = Array.isArray(tripsRes?.data) ? tripsRes.data : [];
      const analytics = analyticsRes?.data;

      // Calculate overview metrics with safe operations
      const overviewMetrics = {
        totalUsers: users.length || 0,
        activeUsers: users.filter(u => u && u.isActive !== false).length || 0,
        totalTrips: trips.length || 0,
        todayTrips: trips.filter(t => {
          try {
            if (!t || (!t.pickupDateTime && !t.createdAt)) return false;
            const tripDate = new Date(t.pickupDateTime || t.createdAt);
            const today = new Date();
            return tripDate.toDateString() === today.toDateString();
          } catch (dateError) {
            console.warn('Date parsing error for trip:', t, dateError);
            return false;
          }
        }).length || 0,
        activeDrivers: users.filter(u => u && u.role === 'driver' && u.isActive !== false).length || 0,
        totalDrivers: users.filter(u => u && u.role === 'driver').length || 0,
        pendingTrips: trips.filter(t => t && t.status === 'pending').length || 0,
        completedTrips: trips.filter(t => t && t.status === 'completed').length || 0,
        recentActivity: (analytics?.recentActivity && Array.isArray(analytics.recentActivity)) 
          ? analytics.recentActivity.slice(0, 5) 
          : [],
        usersByRole: {
          admin: users.filter(u => u && u.role === 'admin').length || 0,
          scheduler: users.filter(u => u && u.role === 'scheduler').length || 0,
          dispatcher: users.filter(u => u && u.role === 'dispatcher').length || 0,
          driver: users.filter(u => u && u.role === 'driver').length || 0
        }
      };

      setOverviewData(overviewMetrics);
      setSystemHealth(healthRes.data);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError(error.message || 'Failed to load overview data');
      
      // Set fallback data to prevent crashes
      setOverviewData({
        totalUsers: 0,
        activeUsers: 0,
        totalTrips: 0,
        todayTrips: 0,
        activeDrivers: 0,
        totalDrivers: 0,
        pendingTrips: 0,
        completedTrips: 0,
        recentActivity: [],
        usersByRole: {
          admin: 0,
          scheduler: 0,
          dispatcher: 0,
          driver: 0
        }
      });
      
      setSystemHealth({ 
        status: 'Error', 
        message: 'System health check unavailable' 
      });

      toast({
        title: 'Error loading overview',
        description: 'Using fallback data. Please check your connection.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const StatCard = ({ title, value, change, changeType, icon, color, subtitle }) => (
    <Card>
      <CardBody>
        <Flex align="center" justify="space-between">
          <Box>
            <Stat>
              <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
              {subtitle && (
                <Text fontSize="xs" color="gray.400" mt={1}>{subtitle}</Text>
              )}
              {change && (
                <StatHelpText>
                  <StatArrow type={changeType} />
                  {change}
                </StatHelpText>
              )}
            </Stat>
          </Box>
          <Icon as={icon} boxSize={8} color={color} />
        </Flex>
      </CardBody>
    </Card>
  );

  const SystemHealthCard = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaTachometerAlt} />
          System Health
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="stretch" spacing={3}>
          <Alert 
            status={systemHealth?.status === 'OK' ? 'success' : 'warning'} 
            borderRadius="md"
            size="sm"
          >
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">
                Backend Status: {systemHealth?.status || 'Unknown'}
              </AlertTitle>
              <AlertDescription fontSize="xs">
                {systemHealth?.message || 'Status unavailable'}
              </AlertDescription>
            </Box>
          </Alert>
          
          <Box>
            <Text fontSize="sm" mb={2}>Server Performance</Text>
            <Progress 
              value={systemHealth?.status === 'OK' ? 95 : 60} 
              colorScheme={systemHealth?.status === 'OK' ? 'green' : 'orange'}
              size="sm"
              borderRadius="md"
            />
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );

  const QuickActionsCard = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={SettingsIcon} />
          Quick Actions
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2}>
          <Button 
            size="sm" 
            width="full" 
            leftIcon={<Icon as={FaUser} />}
            variant="outline"
            onClick={() => window.location.href = '/admin/register'}
          >
            Register New User
          </Button>
          <Button 
            size="sm" 
            width="full" 
            leftIcon={<ViewIcon />}
            variant="outline"
            onClick={() => window.location.href = '/admin/analytics'}
          >
            View Analytics
          </Button>
          <Button 
            size="sm" 
            width="full" 
            leftIcon={<SearchIcon />}
            variant="outline"
            onClick={() => window.location.href = '/admin/reports'}
          >
            Generate Reports
          </Button>
          <Button 
            size="sm" 
            width="full" 
            leftIcon={<SettingsIcon />}
            variant="outline"
          >
            System Settings
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );

  const RecentActivityCard = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <TimeIcon />
          Recent Activity
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="stretch" spacing={3} maxH="300px" overflowY="auto">
          {overviewData?.recentActivity && Array.isArray(overviewData.recentActivity) && overviewData.recentActivity.length > 0 ? (
            overviewData.recentActivity.map((activity, index) => {
              // Safety check for activity object
              if (!activity || typeof activity !== 'object') return null;
              
              return (
                <Box key={activity.id || index} p={3} bg="gray.50" rounded="md" borderLeft="3px solid" borderLeftColor="blue.400">
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {activity.userId && activity.userId.firstName && activity.userId.lastName ? 
                          `${activity.userId.firstName} ${activity.userId.lastName}` : 
                          'System'}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {activity.description || 'No description available'}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Badge size="sm" colorScheme="blue" variant="subtle">
                        {activity.action ? activity.action.replace('_', ' ').toUpperCase() : 'ACTION'}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              );
            }).filter(Boolean) // Remove null entries
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No recent activity
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const UserRoleDistribution = () => (
    <Card>
      <CardHeader>
        <Heading size="sm" display="flex" alignItems="center" gap={2}>
          <Icon as={FaUsers} />
          User Distribution
        </Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3}>
          {overviewData?.usersByRole && typeof overviewData.usersByRole === 'object' ? 
            Object.entries(overviewData.usersByRole).map(([role, count]) => {
              const safeCount = typeof count === 'number' ? count : 0;
              const totalUsers = typeof overviewData.totalUsers === 'number' && overviewData.totalUsers > 0 
                ? overviewData.totalUsers 
                : 1; // Prevent division by zero
              
              return (
                <Box key={role} width="full">
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" textTransform="capitalize">{role}s</Text>
                    <Text fontSize="sm" fontWeight="bold">{safeCount}</Text>
                  </HStack>
                  <Progress 
                    value={safeCount > 0 ? Math.min((safeCount / totalUsers) * 100, 100) : 0}
                    colorScheme={
                      role === 'admin' ? 'red' :
                      role === 'scheduler' ? 'blue' :
                      role === 'dispatcher' ? 'green' : 'purple'
                    }
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              );
            }) : (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No user data available
              </Text>
            )
          }
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Center flex="1">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading overview...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (error && !overviewData) {
    return (
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <Navbar />
        <Box flex="1" p={{ base: 4, md: 6, lg: 8 }}>
          <Container maxW="7xl">
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Failed to Load Overview!</AlertTitle>
                <AlertDescription mt={2}>
                  {error}
                </AlertDescription>
                <Button 
                  mt={4} 
                  size="sm" 
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchOverviewData();
                  }}
                >
                  Try Again
                </Button>
              </Box>
            </Alert>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box flex="1" p={{ base: 4, md: 6, lg: 8 }}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={6}>
            {/* Header */}
            <Box>
              <Heading size="lg" mb={2}>Admin Overview</Heading>
              <Text color="gray.600">
                System overview and key metrics at a glance
              </Text>
            </Box>

            {/* Key Metrics */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <StatCard
                title="Total Users"
                value={overviewData?.totalUsers || 0}
                subtitle={`${overviewData?.activeUsers || 0} active`}
                icon={FaUsers}
                color="blue.500"
              />
              <StatCard
                title="Today's Trips"
                value={overviewData?.todayTrips || 0}
                subtitle={`${overviewData?.totalTrips || 0} total trips`}
                icon={FaRoute}
                color="green.500"
              />
              <StatCard
                title="Active Drivers"
                value={`${overviewData?.activeDrivers || 0}/${overviewData?.totalDrivers || 0}`}
                subtitle="Available for assignments"
                icon={FaCar}
                color="purple.500"
              />
              <StatCard
                title="Pending Trips"
                value={overviewData?.pendingTrips || 0}
                subtitle={`${overviewData?.completedTrips || 0} completed`}
                icon={TimeIcon}
                color="orange.500"
              />
            </SimpleGrid>

            {/* Dashboard Grid */}
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
              {/* Left Column */}
              <VStack spacing={6}>
                <RecentActivityCard />
                <UserRoleDistribution />
              </VStack>

              {/* Right Column */}
              <VStack spacing={6}>
                <SystemHealthCard />
                <QuickActionsCard />
              </VStack>
            </Grid>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminOverview;