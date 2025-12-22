import React, { useState, useEffect } from 'react';
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
  Flex,
  Spacer,
  Tag,
  TagLabel,
  TagLeftIcon,
  Checkbox
} from '@chakra-ui/react';
import {
  CheckIcon,
  WarningIcon,
  InfoIcon,
  TimeIcon,
  PhoneIcon
} from '@chakra-ui/icons';
import {
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from '../../config/axios';

const ConflictDetectionModal = ({
  isOpen,
  onClose,
  tripData,
  driverId,
  vehicleId,
  onConflictsDetected,
  onProceedWithConflicts,
  onProceedWithoutConflicts
}) => {
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);

  const alertBg = useColorModeValue('red.50', 'red.900');
  const alertBorder = useColorModeValue('red.200', 'red.700');
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.700');
  const infoBg = useColorModeValue('blue.50', 'blue.900');
  const infoBorder = useColorModeValue('blue.200', 'blue.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Check for conflicts when modal opens
  useEffect(() => {
    const checkForConflicts = async () => {
      try {
        setLoading(true);
        setConflicts([]);
        setHasConflicts(false);
        setAlternatives([]);

        // Call conflict detection endpoint
        const response = await axios.post('/api/schedules/check-conflicts', {
          driverId,
          vehicleId: vehicleId || undefined,
          scheduledDate: tripData.scheduledDate,
          scheduledTime: tripData.scheduledTime,
          estimatedDuration: tripData.estimatedDuration || 60, // minutes
          pickupAddress: tripData.pickupAddress,
          dropoffAddress: tripData.dropoffAddress
        });

        const { hasConflict, conflicts: detectedConflicts, suggestions } = response.data;

        if (hasConflict) {
          setHasConflicts(true);
          setConflicts(detectedConflicts || []);
          setAlternatives(suggestions || []);
          onConflictsDetected?.(detectedConflicts, suggestions);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
        // If endpoint doesn't exist yet, just proceed
        if (error.response?.status === 404) {
          setHasConflicts(false);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && tripData && driverId) {
      checkForConflicts();
    }
  }, [isOpen, tripData, driverId, vehicleId, onConflictsDetected]);

  const handleProceed = () => {
    if (hasConflicts && !ignoreConflicts) {
      return;
    }

    if (hasConflicts && ignoreConflicts) {
      onProceedWithConflicts?.();
    } else {
      onProceedWithoutConflicts?.();
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            {loading ? (
              <Spinner size="sm" color="blue.500" />
            ) : hasConflicts ? (
              <Icon as={FaExclamationTriangle} color="orange.500" boxSize={6} />
            ) : (
              <Icon as={FaCheckCircle} color="green.500" boxSize={6} />
            )}
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                {loading ? 'Checking Schedule...' : hasConflicts ? 'Scheduling Conflicts Detected' : 'No Conflicts Found'}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>

        <ModalCloseButton isDisabled={loading} />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {loading ? (
              <Center py={8}>
                <VStack spacing={4}>
                  <Spinner size="lg" color="blue.500" thickness="4px" />
                  <Text color="gray.600">Analyzing driver schedule and vehicle availability...</Text>
                </VStack>
              </Center>
            ) : hasConflicts ? (
              <>
                {/* Trip Summary */}
                <Card bg={infoBg} border="1px" borderColor={infoBorder}>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="semibold" color="blue.600">TRIP DETAILS</Text>
                      <SimpleGrid columns={2} spacing={3}>
                        <HStack fontSize="sm">
                          <Icon as={FaUser} />
                          <Text>{tripData.riderName}</Text>
                        </HStack>
                        <HStack fontSize="sm">
                          <Icon as={TimeIcon} />
                          <Text>{new Date(`${tripData.scheduledDate}T${tripData.scheduledTime}`).toLocaleString()}</Text>
                        </HStack>
                        <HStack fontSize="sm">
                          <Icon as={FaMapMarkerAlt} />
                          <Text>{tripData.pickupAddress.substring(0, 30)}...</Text>
                        </HStack>
                        <HStack fontSize="sm">
                          <Icon as={FaCar} />
                          <Text>{vehicleId ? 'Assigned' : 'Any'}</Text>
                        </HStack>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Conflicts List */}
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={3} color="red.600">
                    <HStack>
                      <WarningIcon />
                      <Text>DETECTED CONFLICTS ({conflicts.length})</Text>
                    </HStack>
                  </Text>

                  <VStack spacing={3} align="stretch">
                    {conflicts.map((conflict, idx) => (
                      <Card key={idx} bg={alertBg} border="1px" borderColor={alertBorder}>
                        <CardBody>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <HStack>
                                <Icon as={FaTimesCircle} color="red.500" />
                                <Text fontWeight="semibold" color="red.600">
                                  {conflict.type === 'overlap' ? 'Time Overlap' : 'Travel Time Conflict'}
                                </Text>
                              </HStack>
                              <Badge colorScheme="red">{conflict.severity}</Badge>
                            </HStack>

                            <Text fontSize="sm" color="gray.700">
                              {conflict.description}
                            </Text>

                            {conflict.existingTrip && (
                              <Box bg={cardBg} p={2} borderRadius="md" fontSize="xs">
                                <Text fontWeight="semibold" mb={1}>Conflicting Trip:</Text>
                                <VStack spacing={1} align="start">
                                  <HStack>
                                    <Tag size="sm">
                                      <TagLeftIcon as={TimeIcon} />
                                      <TagLabel>{conflict.existingTrip.time}</TagLabel>
                                    </Tag>
                                  </HStack>
                                  <Text>{conflict.existingTrip.riderName}</Text>
                                  <Text color="gray.600">{conflict.existingTrip.route}</Text>
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>

                {/* Alternatives */}
                {alternatives.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={3} color="blue.600">
                      <HStack>
                        <InfoIcon />
                        <Text>SUGGESTED ALTERNATIVES ({alternatives.length})</Text>
                      </HStack>
                    </Text>

                    <VStack spacing={3} align="stretch">
                      {alternatives.map((alt, idx) => (
                        <Card key={idx} bg={successBg} border="1px" borderColor={successBorder}>
                          <CardBody>
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between">
                                <HStack>
                                  <Icon as={FaCheckCircle} color="green.500" />
                                  <Text fontWeight="semibold" color="green.600">
                                    {alt.driverName}
                                  </Text>
                                </HStack>
                                <Badge colorScheme="green">Available</Badge>
                              </HStack>

                              <SimpleGrid columns={2} spacing={2} fontSize="xs">
                                <HStack>
                                  <Tag size="sm">
                                    <TagLabel>{alt.vehicleType}</TagLabel>
                                  </Tag>
                                </HStack>
                                <HStack>
                                  <Tag size="sm">
                                    <TagLabel>{alt.rating} ⭐</TagLabel>
                                  </Tag>
                                </HStack>
                              </SimpleGrid>

                              <Text fontSize="sm" color="gray.700">
                                {alt.reason}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Override Checkbox */}
                <Divider />
                <HStack spacing={3}>
                  <Checkbox
                    isChecked={ignoreConflicts}
                    onChange={(e) => setIgnoreConflicts(e.target.checked)}
                  >
                    <Text fontSize="sm">
                      I understand the conflicts and want to proceed anyway
                    </Text>
                  </Checkbox>
                </HStack>
              </>
            ) : (
              // No conflicts
              <Card bg={successBg} border="1px" borderColor={successBorder}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Icon as={FaCheckCircle} color="green.500" boxSize={6} />
                      <Box>
                        <Text fontWeight="semibold" color="green.600" fontSize="lg">
                          Schedule is Clear
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          No conflicts detected with existing trips
                        </Text>
                      </Box>
                    </HStack>

                    <Divider />

                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>Trip Details:</Text>
                      <SimpleGrid columns={2} spacing={2} fontSize="sm">
                        <HStack>
                          <Icon as={TimeIcon} color="green.600" />
                          <Text>{new Date(`${tripData.scheduledDate}T${tripData.scheduledTime}`).toLocaleString()}</Text>
                        </HStack>
                        <HStack>
                          <Icon as={FaClock} color="green.600" />
                          <Text>~{tripData.estimatedDuration || 60} min</Text>
                        </HStack>
                        <HStack>
                          <Icon as={FaMapMarkerAlt} color="green.600" />
                          <Text>{tripData.pickupAddress.substring(0, 25)}...</Text>
                        </HStack>
                      </SimpleGrid>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              colorScheme={hasConflicts && !ignoreConflicts ? 'gray' : 'blue'}
              onClick={handleProceed}
              isDisabled={loading || (hasConflicts && !ignoreConflicts)}
              isLoading={loading}
            >
              {loading ? 'Checking...' : hasConflicts ? 'Proceed with Conflicts' : 'Proceed'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConflictDetectionModal;
