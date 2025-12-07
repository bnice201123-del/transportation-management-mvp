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
  Center,
  Spinner,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import Navbar from '../shared/Navbar';
import { DriverTripCard } from './shared';

const SimpleDriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('/api/trips');
        const driverTrips = (response.data.data?.trips || []).filter(trip => 
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
      
      <Box pt={{ base: 4, md: 0 }}>
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
                    <DriverTripCard
                      key={trip._id}
                      trip={trip}
                      compact={false}
                    />
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