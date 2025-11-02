import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  Badge,
  Center,
  Spinner,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';

const SimpleDriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('/trips');
        const driverTrips = response.data.trips.filter(trip => 
          trip.assignedDriver && trip.assignedDriver._id === user._id
        );
        setTrips(driverTrips);
      } catch (error) {
        console.error('Error fetching trips:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch trips',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user, toast]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      case 'assigned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box>
        <Navbar title="Driver Dashboard" />
        <Center h="50vh">
          <Spinner size="xl" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar title="Driver Dashboard" />
      
      <Box ml={{ base: 0, md: "60px", lg: "200px", xl: "240px" }} pt={{ base: 4, md: 0 }}>
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 4, md: 6, lg: 8 }}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Welcome, {user?.firstName}!</Heading>
          
          <Card>
            <CardHeader>
              <Heading size="md">Your Assigned Trips</Heading>
            </CardHeader>
            <CardBody>
              {trips.length === 0 ? (
                <Text color="gray.500">No trips assigned to you at the moment.</Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {trips.map((trip) => (
                    <Card key={trip._id} variant="outline">
                      <CardBody>
                        <VStack align="start" spacing={{ base: 3, md: 2 }}>
                          <Box w="full">
                            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="blue.600">
                              Trip ID: {trip.tripId}
                            </Text>
                            <Badge colorScheme={getStatusColor(trip.status)} mt={1}>
                              {trip.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </Box>
                          
                          <Box w="full">
                            <Text fontSize={{ base: "sm", md: "md" }}>
                              <strong>Rider:</strong> {trip.riderName}
                            </Text>
                            <Text fontSize={{ base: "sm", md: "md" }} color="blue.600">
                              <strong>Phone:</strong> {trip.riderPhone}
                            </Text>
                          </Box>
                          
                          <Box w="full" p={3} bg="gray.50" rounded="md">
                            <Text fontSize={{ base: "xs", md: "sm" }} mb={1}>
                              <strong>Pickup:</strong>
                            </Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.700" mb={2}>
                              {trip.pickupLocation.address}
                            </Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} mb={1}>
                              <strong>Dropoff:</strong>
                            </Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.700">
                              {trip.dropoffLocation.address}
                            </Text>
                          </Box>
                          
                          <Text fontSize={{ base: "sm", md: "md" }}>
                            <strong>Scheduled:</strong> {formatDate(trip.scheduledDate)}
                          </Text>
                          
                          {trip.notes && (
                            <Box w="full" p={2} bg="yellow.50" rounded="md" border="1px solid" borderColor="yellow.200">
                              <Text fontSize={{ base: "xs", md: "sm" }}>
                                <strong>Notes:</strong> {trip.notes}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default SimpleDriverDashboard;