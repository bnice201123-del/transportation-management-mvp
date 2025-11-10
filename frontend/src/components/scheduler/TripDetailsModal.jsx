import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Heading,
  IconButton,
  Tooltip,
  Link,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import TripMap from '../maps/TripMap';
import {
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  TimeIcon,
  EditIcon,
  ExternalLinkIcon
} from '@chakra-ui/icons';
import {
  FaUser,
  FaMapMarkerAlt,
  FaCar,
  FaRoute,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaDollarSign,
  FaStickyNote,
  FaCalendarCheck,
  FaIdCard,
  FaMapPin,
  FaStopwatch,
  FaRoad,
  FaGasPump,
  FaClipboardList
} from 'react-icons/fa';

const TripDetailsModal = ({ isOpen, onClose, trip }) => {
  if (!trip) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'cancelled': return 'red';
      case 'scheduled': return 'orange';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Not specified';
    return time;
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openInGoogleMaps = (pickup, dropoff) => {
    const pickupAddr = encodeURIComponent(pickup?.address || '');
    const dropoffAddr = encodeURIComponent(dropoff?.address || '');
    const url = `https://www.google.com/maps/dir/${pickupAddr}/${dropoffAddr}`;
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <Flex align="center" gap={4}>
            <Box>
              <HStack>
                <FaRoute color="blue" />
                <Text fontSize="xl" fontWeight="bold">Trip Details</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Trip ID: {trip.tripId || trip._id?.substring(0, 8)}
              </Text>
            </Box>
            <Spacer />
            <Badge colorScheme={getStatusColor(trip.status)} fontSize="md" p={2}>
              {trip.status?.charAt(0)?.toUpperCase() + trip.status?.slice(1)}
            </Badge>
          </Flex>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>
                <HStack>
                  <FaInfo />
                  <Text>Trip Details</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <FaMap />
                  <Text>Route Map</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Rider Information */}
            <Card>
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <FaUser color="blue" />
                    <Text>Rider Information</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Full Name</Text>
                      <Text fontSize="lg" fontWeight="semibold">{trip.riderName || 'Not provided'}</Text>
                    </Box>
                    
                    {trip.riderPhone && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Phone Number</Text>
                        <HStack>
                          <FaPhone color="green" />
                          <Link href={`tel:${trip.riderPhone}`} color="blue.500">
                            {trip.riderPhone}
                          </Link>
                        </HStack>
                      </Box>
                    )}
                    
                    {trip.riderEmail && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Email Address</Text>
                        <HStack>
                          <FaEnvelope color="blue" />
                          <Link href={`mailto:${trip.riderEmail}`} color="blue.500">
                            {trip.riderEmail}
                          </Link>
                        </HStack>
                      </Box>
                    )}
                  </VStack>

                  <VStack align="start" spacing={3}>
                    {trip.riderNotes && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Special Requirements</Text>
                        <Text>{trip.riderNotes}</Text>
                      </Box>
                    )}
                    
                    {trip.wheelchairAccessible && (
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        Wheelchair accessible vehicle required
                      </Alert>
                    )}
                    
                    {trip.emergencyContact && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Emergency Contact</Text>
                        <Text>{trip.emergencyContact}</Text>
                      </Box>
                    )}
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Trip Route */}
            <Card>
              <CardHeader>
                <Flex align="center" justify="space-between">
                  <Heading size="md">
                    <HStack>
                      <FaMapMarkerAlt color="red" />
                      <Text>Trip Route</Text>
                    </HStack>
                  </Heading>
                  <Button
                    size="sm"
                    leftIcon={<ExternalLinkIcon />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => openInGoogleMaps(trip.pickupLocation, trip.dropoffLocation)}
                  >
                    View in Maps
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Pickup Location */}
                  <Box p={4} borderWidth="1px" borderRadius="md" borderColor="green.200" bg="green.50">
                    <HStack spacing={3} mb={2}>
                      <FaMapPin color="green" />
                      <Text fontWeight="semibold" color="green.700">Pickup Location</Text>
                    </HStack>
                    <Text>{trip.pickupLocation?.address || 'Address not provided'}</Text>
                    {trip.pickupLocation?.notes && (
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        📝 {trip.pickupLocation.notes}
                      </Text>
                    )}
                  </Box>

                  {/* Route Arrow */}
                  <Center>
                    <VStack spacing={2}>
                      <FaRoute size={20} color="gray.400" />
                      {trip.estimatedDistance && (
                        <Text fontSize="sm" color="gray.600">
                          📏 {trip.estimatedDistance}
                        </Text>
                      )}
                      {trip.estimatedDuration && (
                        <Text fontSize="sm" color="gray.600">
                          ⏱️ {trip.estimatedDuration}
                        </Text>
                      )}
                    </VStack>
                  </Center>

                  {/* Dropoff Location */}
                  <Box p={4} borderWidth="1px" borderRadius="md" borderColor="red.200" bg="red.50">
                    <HStack spacing={3} mb={2}>
                      <FaMapPin color="red" />
                      <Text fontWeight="semibold" color="red.700">Dropoff Location</Text>
                    </HStack>
                    <Text>{trip.dropoffLocation?.address || 'Address not provided'}</Text>
                    {trip.dropoffLocation?.notes && (
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        📝 {trip.dropoffLocation.notes}
                      </Text>
                    )}
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <FaCalendarCheck color="orange" />
                    <Text>Schedule Information</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Scheduled Date</Text>
                      <HStack>
                        <CalendarIcon color="blue.500" />
                        <Text fontSize="lg" fontWeight="semibold">
                          {formatDate(trip.scheduledDate)}
                        </Text>
                      </HStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Scheduled Time</Text>
                      <HStack>
                        <TimeIcon color="blue.500" />
                        <Text fontSize="lg" fontWeight="semibold">
                          {formatTime(trip.scheduledTime)}
                        </Text>
                      </HStack>
                    </Box>

                    {trip.isRecurring && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Recurring Pattern</Text>
                        <Badge colorScheme="purple" p={2}>
                          🔄 {trip.recurringPattern || 'Weekly'}
                        </Badge>
                      </Box>
                    )}
                  </VStack>

                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Created On</Text>
                      <Text>{formatDateTime(trip.createdAt)}</Text>
                    </Box>
                    
                    {trip.updatedAt && trip.updatedAt !== trip.createdAt && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Last Modified</Text>
                        <Text>{formatDateTime(trip.updatedAt)}</Text>
                      </Box>
                    )}

                    {trip.priority && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Priority</Text>
                        <Badge 
                          colorScheme={trip.priority === 'high' ? 'red' : trip.priority === 'medium' ? 'orange' : 'green'}
                        >
                          {trip.priority?.charAt(0)?.toUpperCase() + trip.priority?.slice(1)}
                        </Badge>
                      </Box>
                    )}
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Driver & Vehicle Assignment */}
            <Card>
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <FaCar color="blue" />
                    <Text>Driver & Vehicle Assignment</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Assigned Driver</Text>
                    {trip.assignedDriver ? (
                      <VStack align="start" spacing={2}>
                        <Text fontSize="lg" fontWeight="semibold">
                          👨‍✈️ {trip.assignedDriver.name}
                        </Text>
                        {trip.assignedDriver.phone && (
                          <Link href={`tel:${trip.assignedDriver.phone}`} color="blue.500">
                            📞 {trip.assignedDriver.phone}
                          </Link>
                        )}
                        {trip.assignedDriver.email && (
                          <Link href={`mailto:${trip.assignedDriver.email}`} color="blue.500">
                            📧 {trip.assignedDriver.email}
                          </Link>
                        )}
                      </VStack>
                    ) : (
                      <Alert status="warning">
                        <AlertIcon />
                        No driver assigned
                      </Alert>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Assigned Vehicle</Text>
                    {trip.assignedVehicle ? (
                      <VStack align="start" spacing={2}>
                        <Text fontSize="lg" fontWeight="semibold">
                          🚗 {trip.assignedVehicle.make} {trip.assignedVehicle.model}
                        </Text>
                        <Text color="gray.600">
                          🏷️ {trip.assignedVehicle.licensePlate}
                        </Text>
                        <Text color="gray.600">
                          🎨 {trip.assignedVehicle.color}
                        </Text>
                      </VStack>
                    ) : (
                      <Alert status="warning">
                        <AlertIcon />
                        No vehicle assigned
                      </Alert>
                    )}
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <Heading size="md">
                  <HStack>
                    <FaClipboardList color="green" />
                    <Text>Trip Details & Billing</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="start" spacing={3}>
                    {trip.fare && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Fare</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          💰 {trip.fare}
                        </Text>
                      </Box>
                    )}

                    {trip.paymentMethod && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Payment Method</Text>
                        <Text>{trip.paymentMethod}</Text>
                      </Box>
                    )}

                    {trip.tripType && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trip Type</Text>
                        <Badge colorScheme="blue">{trip.tripType}</Badge>
                      </Box>
                    )}
                  </VStack>

                  <VStack align="start" spacing={3}>
                    {trip.estimatedCost && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Estimated Cost</Text>
                        <Text fontSize="lg" fontWeight="semibold">
                          {trip.estimatedCost}
                        </Text>
                      </Box>
                    )}

                    {trip.actualCost && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Actual Cost</Text>
                        <Text fontSize="lg" fontWeight="semibold">
                          {trip.actualCost}
                        </Text>
                      </Box>
                    )}

                    {trip.passengers && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Number of Passengers</Text>
                        <Text fontSize="lg" fontWeight="semibold">
                          👥 {trip.passengers}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Notes & Additional Information */}
            {(trip.notes || trip.specialInstructions || trip.cancellationReason) && (
              <Card>
                <CardHeader>
                  <Heading size="md">
                    <HStack>
                      <FaStickyNote color="orange" />
                      <Text>Notes & Additional Information</Text>
                    </HStack>
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    {trip.notes && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>Trip Notes</Text>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text>{trip.notes}</Text>
                        </Box>
                      </Box>
                    )}

                    {trip.specialInstructions && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>Special Instructions</Text>
                        <Box p={3} bg="blue.50" borderRadius="md">
                          <Text>{trip.specialInstructions}</Text>
                        </Box>
                      </Box>
                    )}

                    {trip.cancellationReason && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={1}>Cancellation Reason</Text>
                        <Box p={3} bg="red.50" borderRadius="md" borderLeft="4px" borderLeftColor="red.400">
                          <Text>{trip.cancellationReason}</Text>
                        </Box>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Trip Timeline */}
            {(trip.actualPickupTime || trip.actualDropoffTime || trip.startTime || trip.endTime) && (
              <Card>
                <CardHeader>
                  <Heading size="md">
                    <HStack>
                      <FaStopwatch color="purple" />
                      <Text>Trip Timeline</Text>
                    </HStack>
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    {trip.startTime && (
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600">Trip Started:</Text>
                        <Text fontWeight="semibold">{formatDateTime(trip.startTime)}</Text>
                      </Flex>
                    )}

                    {trip.actualPickupTime && (
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600">Actual Pickup:</Text>
                        <Text fontWeight="semibold">{formatDateTime(trip.actualPickupTime)}</Text>
                      </Flex>
                    )}

                    {trip.actualDropoffTime && (
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600">Actual Dropoff:</Text>
                        <Text fontWeight="semibold">{formatDateTime(trip.actualDropoffTime)}</Text>
                      </Flex>
                    )}

                    {trip.endTime && (
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600">Trip Completed:</Text>
                        <Text fontWeight="semibold">{formatDateTime(trip.endTime)}</Text>
                      </Flex>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}
                </VStack>
              </TabPanel>

              {/* Map Tab Panel */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {/* Route Statistics */}
                  {trip.pickupLocation && trip.dropoffLocation && (
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat>
                        <StatLabel>Estimated Distance</StatLabel>
                        <StatNumber>
                          {trip.estimatedDistance ? `${trip.estimatedDistance.toFixed(2)} miles` : 'Calculating...'}
                        </StatNumber>
                        <StatHelpText>Direct route</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Estimated Duration</StatLabel>
                        <StatNumber>
                          {trip.estimatedDuration ? `${trip.estimatedDuration} min` : 'Calculating...'}
                        </StatNumber>
                        <StatHelpText>Based on traffic</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Trip Type</StatLabel>
                        <StatNumber fontSize="lg">
                          {trip.isRecurring ? 'Recurring' : 'One-time'}
                        </StatNumber>
                        <StatHelpText>{trip.status}</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  )}

                  {/* Interactive Map */}
                  {trip.pickupLocation && trip.dropoffLocation && (
                    <Card>
                      <CardHeader>
                        <HStack justify="space-between">
                          <Heading size="md">Route Preview</Heading>
                          <Button
                            size="sm"
                            leftIcon={<FaRoute />}
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => openInGoogleMaps(trip.pickupLocation, trip.dropoffLocation)}
                          >
                            Open in Google Maps
                          </Button>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <TripMap
                          trip={trip}
                          height="400px"
                          showRoute={true}
                          showControls={true}
                        />
                      </CardBody>
                    </Card>
                  )}

                  {/* Quick Actions for Navigation */}
                  {trip.pickupLocation && trip.dropoffLocation && (
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Navigation Quick Actions</Heading>
                      </CardHeader>
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Button
                            leftIcon={<FaMapPin />}
                            colorScheme="green"
                            variant="outline"
                            onClick={() => {
                              const addr = encodeURIComponent(trip.pickupLocation.address);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                            }}
                          >
                            Navigate to Pickup
                          </Button>
                          
                          <Button
                            leftIcon={<FaMapPin />}
                            colorScheme="red"
                            variant="outline"
                            onClick={() => {
                              const addr = encodeURIComponent(trip.dropoffLocation.address);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                            }}
                          >
                            Navigate to Dropoff
                          </Button>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="blue" leftIcon={<EditIcon />}>
            Edit Trip
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TripDetailsModal;