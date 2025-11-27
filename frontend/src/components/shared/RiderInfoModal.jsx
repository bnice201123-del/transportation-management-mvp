import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  Divider,
  Badge,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  EnvelopeIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

const RiderInfoModal = ({ isOpen, onClose, riderId, riderName }) => {
  const [riderData, setRiderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isOpen && riderId) {
      fetchRiderInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, riderId]);

  const fetchRiderInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch rider details
      const riderResponse = await axios.get(`/api/riders/${riderId}`);
      const rider = riderResponse.data;

      // Fetch rider's trips
      const tripsResponse = await axios.get(`/api/trips?riderName=${encodeURIComponent(rider.firstName + ' ' + rider.lastName)}&limit=10`);
      const trips = tripsResponse.data?.trips || tripsResponse.data?.data?.trips || [];

      // Calculate trip statistics
      const totalTrips = trips.length;
      const completedTrips = trips.filter(t => t.status === 'completed').length;
      const mostRecentTrip = trips.length > 0 ? trips[0] : null;

      setRiderData({
        ...rider,
        tripStats: {
          total: totalTrips,
          completed: completedTrips,
          recentTrip: mostRecentTrip
        }
      });
    } catch (error) {
      console.error('Error fetching rider info:', error);
      setError('Failed to load rider information');
      
      // Fallback to basic info if we have the rider name
      if (riderName) {
        setRiderData({
          firstName: riderName.split(' ')[0],
          lastName: riderName.split(' ').slice(1).join(' '),
          _id: riderId,
          tripStats: {
            total: 0,
            completed: 0,
            recentTrip: null
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/riders/${riderId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not available';
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={UserIcon} w={6} h={6} color="blue.500" />
            <Text>Rider Information</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <VStack py={8} spacing={4}>
              <Spinner size="lg" color="blue.500" />
              <Text color={textColor}>Loading rider information...</Text>
            </VStack>
          ) : error && !riderData ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          ) : riderData ? (
            <VStack spacing={4} align="stretch">
              {/* Rider Header */}
              <HStack spacing={4} pb={4} borderBottom="1px" borderColor={borderColor}>
                <Avatar 
                  size="lg" 
                  name={`${riderData.firstName} ${riderData.lastName}`}
                  bg="blue.500"
                  color="white"
                />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="xl" fontWeight="bold">
                    {riderData.firstName} {riderData.lastName}
                  </Text>
                  {riderData.role && (
                    <Badge colorScheme="blue" fontSize="xs">
                      {riderData.role.charAt(0).toUpperCase() + riderData.role.slice(1)}
                    </Badge>
                  )}
                </VStack>
              </HStack>

              {/* Contact Information */}
              <VStack spacing={3} align="stretch">
                <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                  CONTACT INFORMATION
                </Text>
                
                <HStack spacing={3}>
                  <Icon as={PhoneIcon} w={5} h={5} color="gray.500" />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" color={textColor}>Phone</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {formatPhoneNumber(riderData.phone)}
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={3}>
                  <Icon as={EnvelopeIcon} w={5} h={5} color="gray.500" />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" color={textColor}>Email</Text>
                    <Text fontSize="sm" fontWeight="medium" isTruncated maxW="300px">
                      {riderData.email || 'Not available'}
                    </Text>
                  </VStack>
                </HStack>

                {riderData.address && (
                  <HStack spacing={3}>
                    <Icon as={MapPinIcon} w={5} h={5} color="gray.500" />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" color={textColor}>Address</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {typeof riderData.address === 'string' 
                          ? riderData.address 
                          : `${riderData.address.street || ''} ${riderData.address.city || ''} ${riderData.address.state || ''} ${riderData.address.zip || ''}`.trim() || 'Not available'
                        }
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </VStack>

              <Divider />

              {/* Trip Statistics */}
              <VStack spacing={3} align="stretch">
                <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                  TRIP STATISTICS
                </Text>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box p={3} bg={statBg} borderRadius="md">
                    <Stat>
                      <StatLabel fontSize="xs">Total Trips</StatLabel>
                      <StatNumber fontSize="2xl">
                        {riderData.tripStats?.total || 0}
                      </StatNumber>
                    </Stat>
                  </Box>
                  
                  <Box p={3} bg={statBg} borderRadius="md">
                    <Stat>
                      <StatLabel fontSize="xs">Completed</StatLabel>
                      <StatNumber fontSize="2xl" color="green.500">
                        {riderData.tripStats?.completed || 0}
                      </StatNumber>
                    </Stat>
                  </Box>
                </SimpleGrid>

                {/* Most Recent Trip */}
                {riderData.tripStats?.recentTrip ? (
                  <Box p={3} bg={statBg} borderRadius="md">
                    <HStack spacing={3} mb={2}>
                      <Icon as={ClockIcon} w={4} h={4} color="gray.500" />
                      <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                        MOST RECENT TRIP
                      </Text>
                    </HStack>
                    <VStack align="start" spacing={1} fontSize="sm">
                      <HStack>
                        <Icon as={CalendarDaysIcon} w={4} h={4} color="gray.400" />
                        <Text>
                          {formatDate(riderData.tripStats.recentTrip.scheduledDate)}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={MapPinIcon} w={4} h={4} color="green.500" />
                        <Text isTruncated maxW="350px">
                          {typeof riderData.tripStats.recentTrip.pickupLocation === 'object'
                            ? riderData.tripStats.recentTrip.pickupLocation.address
                            : riderData.tripStats.recentTrip.pickupLocation}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={MapPinIcon} w={4} h={4} color="red.500" />
                        <Text isTruncated maxW="350px">
                          {typeof riderData.tripStats.recentTrip.dropoffLocation === 'object'
                            ? riderData.tripStats.recentTrip.dropoffLocation.address
                            : riderData.tripStats.recentTrip.dropoffLocation}
                        </Text>
                      </HStack>
                      <Badge colorScheme={
                        riderData.tripStats.recentTrip.status === 'completed' ? 'green' :
                        riderData.tripStats.recentTrip.status === 'in-progress' ? 'blue' :
                        riderData.tripStats.recentTrip.status === 'cancelled' ? 'red' : 'gray'
                      }>
                        {riderData.tripStats.recentTrip.status}
                      </Badge>
                    </VStack>
                  </Box>
                ) : (
                  <Box p={3} bg={statBg} borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color={textColor}>
                      No recent trips found
                    </Text>
                  </Box>
                )}
              </VStack>
            </VStack>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleViewProfile}
            isDisabled={!riderId}
          >
            View Full Profile
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RiderInfoModal;
