import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Progress,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  useToast,
  Select,
  Flex,
  Icon,
  SimpleGrid,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, CheckCircleIcon, WarningIcon, TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons';
import { FaCar, FaUser, FaRoute, FaDollarSign, FaChartLine } from 'react-icons/fa';
import axios from '../../config/axios';
import Navbar from '../shared/Navbar';

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [statistics, setStatistics] = useState({});
  const toast = useToast();

  // Mock data for demonstration - replace with actual API calls
  const mockStatistics = {
    overview: {
      totalTrips: 1247,
      totalUsers: 89,
      totalDrivers: 23,
      totalVehicles: 18,
      activeTrips: 12,
      completedTrips: 1198,
      cancelledTrips: 37,
      revenue: 45678.90,
      efficiency: 94.2
    },
    performance: {
      avgTripDuration: 35.5,
      avgWaitTime: 8.2,
      customerSatisfaction: 4.6,
      fuelEfficiency: 12.8,
      onTimePercentage: 92.3
    },
    trends: {
      tripsByDay: [
        { day: 'Mon', trips: 45, revenue: 1250 },
        { day: 'Tue', trips: 52, revenue: 1430 },
        { day: 'Wed', trips: 48, revenue: 1320 },
        { day: 'Thu', trips: 61, revenue: 1680 },
        { day: 'Fri', trips: 58, revenue: 1590 },
        { day: 'Sat', trips: 73, revenue: 2010 },
        { day: 'Sun', trips: 67, revenue: 1840 }
      ]
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Replace with actual API calls
      // const response = await axios.get(`/analytics/statistics?range=${timeRange}`);
      // setStatistics(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setStatistics(mockStatistics);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: 'Error loading statistics',
        description: 'Failed to load statistics data',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card>
      <CardBody>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.500">
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
            {subtitle && (
              <HStack>
                {trend && (
                  <Icon 
                    as={trend > 0 ? TriangleUpIcon : TriangleDownIcon} 
                    color={trend > 0 ? 'green.500' : 'red.500'}
                    w={3}
                    h={3}
                  />
                )}
                <Text fontSize="sm" color={trend > 0 ? 'green.500' : 'red.500'}>
                  {subtitle}
                </Text>
              </HStack>
            )}
          </VStack>
          <Box>
            <Icon as={icon} boxSize={8} color={color} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );

  const MetricCard = ({ title, value, unit, progress, color }) => (
    <Card>
      <CardBody>
        <VStack align="center" spacing={3}>
          <CircularProgress value={progress} color={color} size="60px">
            <CircularProgressLabel fontSize="xs">
              {progress}%
            </CircularProgressLabel>
          </CircularProgress>
          <VStack spacing={0}>
            <Text fontSize="lg" fontWeight="bold">
              {value}{unit}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {title}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const ChartPlaceholder = ({ title, description }) => (
    <Card>
      <CardHeader>
        <Heading size="md">{title}</Heading>
      </CardHeader>
      <CardBody>
        <Box
          height={300}
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          border="2px dashed"
          borderColor="gray.300"
        >
          <VStack>
            <Icon as={FaChartLine} boxSize={12} color="gray.400" />
            <Text color="gray.500" textAlign="center">
              {description || 'Chart visualization coming soon'}
            </Text>
          </VStack>
        </Box>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box minH="100vh">
        <Navbar />
        <Center mt={20}>
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      <Navbar />
      <Container maxW="7xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="gray.700">
              System Statistics
            </Heading>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              width="200px"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </Select>
          </Flex>

          {/* Key Metrics Overview */}
          <Card>
            <CardHeader>
              <Heading size="md">Key Metrics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
                <StatCard
                  title="Total Trips"
                  value={statistics.overview?.totalTrips?.toLocaleString()}
                  subtitle="+12% from last period"
                  icon={FaRoute}
                  color="blue.500"
                  trend={12}
                />
                <StatCard
                  title="Active Users"
                  value={statistics.overview?.totalUsers}
                  subtitle="+8% from last period"
                  icon={FaUser}
                  color="green.500"
                  trend={8}
                />
                <StatCard
                  title="Revenue"
                  value={`$${statistics.overview?.revenue?.toLocaleString()}`}
                  subtitle="+15% from last period"
                  icon={FaDollarSign}
                  color="purple.500"
                  trend={15}
                />
                <StatCard
                  title="Active Drivers"
                  value={statistics.overview?.totalDrivers}
                  subtitle="+3% from last period"
                  icon={FaCar}
                  color="orange.500"
                  trend={3}
                />
                <StatCard
                  title="Efficiency"
                  value={`${statistics.overview?.efficiency}%`}
                  subtitle="+2.1% from last period"
                  icon={FaChartLine}
                  color="teal.500"
                  trend={2.1}
                />
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <Heading size="md">Performance Metrics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
                <MetricCard
                  title="Avg Trip Duration"
                  value={statistics.performance?.avgTripDuration}
                  unit=" min"
                  progress={75}
                  color="blue.400"
                />
                <MetricCard
                  title="Avg Wait Time"
                  value={statistics.performance?.avgWaitTime}
                  unit=" min"
                  progress={65}
                  color="orange.400"
                />
                <MetricCard
                  title="Customer Rating"
                  value={statistics.performance?.customerSatisfaction}
                  unit="/5"
                  progress={92}
                  color="green.400"
                />
                <MetricCard
                  title="Fuel Efficiency"
                  value={statistics.performance?.fuelEfficiency}
                  unit=" mpg"
                  progress={80}
                  color="teal.400"
                />
                <MetricCard
                  title="On-Time Rate"
                  value={statistics.performance?.onTimePercentage}
                  unit="%"
                  progress={statistics.performance?.onTimePercentage}
                  color="purple.400"
                />
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Charts Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <ChartPlaceholder
              title="Daily Trip Statistics"
              description="Bar chart showing trips per day"
            />
            <ChartPlaceholder
              title="Trip Status Distribution"
              description="Pie chart showing trip status breakdown"
            />
          </SimpleGrid>

          {/* Trends Section */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <ChartPlaceholder
              title="Revenue Trend"
              description="Area chart showing revenue over time"
            />
            <ChartPlaceholder
              title="User Growth"
              description="Line chart showing user growth trend"
            />
          </SimpleGrid>

          {/* Real-time Status */}
          <Card>
            <CardHeader>
              <Heading size="md">Real-time System Status</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.activeTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Active Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={CalendarIcon} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.completedTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Completed Today</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.cancelledTrips}</Text>
                    <Text fontSize="sm" color="gray.500">Cancelled Trips</Text>
                  </VStack>
                </HStack>
                <HStack>
                  <Icon as={FaCar} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{statistics.overview?.totalVehicles}</Text>
                    <Text fontSize="sm" color="gray.500">Total Vehicles</Text>
                  </VStack>
                </HStack>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <Heading size="md">Weekly Performance Breakdown</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 7 }} spacing={4}>
                {statistics.trends?.tripsByDay?.map((day, index) => (
                  <VStack key={index} align="center" spacing={2}>
                    <Text fontWeight="bold" color="blue.600">{day.day}</Text>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold">{day.trips}</Text>
                      <Text fontSize="xs" color="gray.500">trips</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="md" fontWeight="semibold" color="green.600">
                        ${day.revenue}
                      </Text>
                      <Text fontSize="xs" color="gray.500">revenue</Text>
                    </VStack>
                    <Progress
                      value={(day.trips / 80) * 100}
                      size="sm"
                      width="60px"
                      colorScheme="blue"
                    />
                  </VStack>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminStatistics;