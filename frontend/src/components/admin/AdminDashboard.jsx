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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  useToast,
  VStack,
  HStack,
  Badge,
  Progress
} from '@chakra-ui/react';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [driverStats, setDriverStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const fetchDriverStats = useCallback(async () => {
    try {
      const response = await axios.get('/analytics/drivers');
      setDriverStats(response.data);
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchAnalytics();
      await fetchDriverStats();
    };
    loadData();
  }, [fetchAnalytics, fetchDriverStats]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };



  if (loading) {
    return (
      <Box>
        <Navbar title="Admin Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Admin Dashboard" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
        {analytics && (
          <>
            {/* Overview Statistics - Responsive Grid */}
            <Grid 
              templateColumns={{ 
                base: "1fr", 
                sm: "repeat(2, 1fr)", 
                lg: "repeat(3, 1fr)",
                xl: "repeat(4, 1fr)"
              }} 
              gap={{ base: 4, md: 6 }} 
              mb={{ base: 6, md: 8 }}
            >
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Trips</StatLabel>
                    <StatNumber>{analytics.tripStats.total}</StatNumber>
                    <StatHelpText>
                      {analytics.tripStats.today} today
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Completed Trips</StatLabel>
                    <StatNumber>{analytics.tripStats.completed}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Success rate: {analytics.tripStats.total > 0 ? 
                        Math.round((analytics.tripStats.completed / analytics.tripStats.total) * 100) : 0}%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Active Trips</StatLabel>
                    <StatNumber>
                      {analytics.tripStats.pending + analytics.tripStats.inProgress}
                    </StatNumber>
                    <StatHelpText>
                      {analytics.tripStats.pending} pending, {analytics.tripStats.inProgress} in progress
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Drivers</StatLabel>
                    <StatNumber>{analytics.driverStats.total}</StatNumber>
                    <StatHelpText>
                      {analytics.driverStats.available} available, {analytics.driverStats.active} active
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>

            <Tabs>
              <TabList>
                <Tab>Trip Analytics</Tab>
                <Tab>Driver Performance</Tab>
                <Tab>Recent Activity</Tab>
              </TabList>

              <TabPanels>
                {/* Trip Analytics Tab */}
                <TabPanel>
                  <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {/* Weekly Stats Chart (Simple display) */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Weekly Trip Statistics</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          {analytics.weeklyStats.map((stat) => (
                            <Box key={stat._id}>
                              <HStack justify="space-between" mb={2}>
                                <Text>{formatDate(stat._id)}</Text>
                                <Text fontWeight="bold">
                                  {stat.completed}/{stat.count} completed
                                </Text>
                              </HStack>
                              <Progress 
                                value={stat.count > 0 ? (stat.completed / stat.count) * 100 : 0}
                                colorScheme="green"
                                size="sm"
                              />
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                      <CardHeader>
                        <Heading size="md">Trip Status Breakdown</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between">
                            <Text>Completed</Text>
                            <Badge colorScheme="green" variant="solid">
                              {analytics.tripStats.completed}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>In Progress</Text>
                            <Badge colorScheme="blue" variant="solid">
                              {analytics.tripStats.inProgress}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Pending</Text>
                            <Badge colorScheme="orange" variant="solid">
                              {analytics.tripStats.pending}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Cancelled</Text>
                            <Badge colorScheme="red" variant="solid">
                              {analytics.tripStats.cancelled}
                            </Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </Grid>
                </TabPanel>

                {/* Driver Performance Tab */}
                <TabPanel>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Driver Performance Metrics</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Total Trips</Th>
                              <Th>Completed</Th>
                              <Th>Completion Rate</Th>
                              <Th>Vehicle</Th>
                              <Th>Rating</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {driverStats.map((driver) => (
                              <Tr key={driver._id}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">
                                      {driver.driver.firstName} {driver.driver.lastName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                      {driver.driver.phone}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>{driver.totalTrips}</Td>
                                <Td>{driver.completedTrips}</Td>
                                <Td>
                                  <HStack>
                                    <Text>{Math.round(driver.completionRate)}%</Text>
                                    <Progress
                                      value={driver.completionRate}
                                      size="sm"
                                      colorScheme={driver.completionRate > 90 ? 'green' : 
                                                driver.completionRate > 70 ? 'yellow' : 'red'}
                                      width="60px"
                                    />
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.driver.vehicleInfo?.make} {driver.driver.vehicleInfo?.model}
                                  </Text>
                                </Td>
                                <Td>
                                  {driver.averageRating ? (
                                    <Badge colorScheme="yellow">
                                      ⭐ {driver.averageRating}
                                    </Badge>
                                  ) : (
                                    <Text fontSize="sm" color="gray.500">No ratings</Text>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Recent Activity Tab */}
                <TabPanel>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Recent System Activity</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        {analytics.recentActivity.map((activity) => (
                          <Box key={activity._id} p={4} bg="gray.50" rounded="md">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">
                                  {activity.userId ? 
                                    `${activity.userId.firstName} ${activity.userId.lastName}` : 
                                    'System'}
                                </Text>
                                <Text fontSize="sm">{activity.description}</Text>
                              </VStack>
                              <VStack align="end" spacing={0}>
                                <Badge colorScheme="blue">
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;