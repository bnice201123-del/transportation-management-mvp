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
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  SimpleGrid,
  Badge,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import {
  CalendarIcon,
  TimeIcon,
  PhoneIcon,
  EmailIcon,
  EditIcon,
  WarningIcon
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
  FaSave,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from '../../config/axios';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';
import useConflictDetection from '../../hooks/useConflictDetection';
import ConflictDetectionModal from './ConflictDetectionModal';

const TripEditModal = ({ isOpen, onClose, trip, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Conflict detection
  const conflictDetection = useConflictDetection();
  const [shouldProceedWithSave, setShouldProceedWithSave] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    riderEmail: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'scheduled',
    assignedDriver: '',
    assignedVehicle: '',
    fare: '',
    passengers: 1,
    notes: '',
    specialInstructions: '',
    wheelchairAccessible: false,
    priority: 'medium',
    paymentMethod: 'cash',
    tripType: 'regular',
    isRecurring: false,
    recurringPattern: 'weekly',
    emergencyContact: '',
    estimatedDuration: '',
    estimatedDistance: ''
  });

  // Options data
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Initialize form data when trip changes
  useEffect(() => {
    if (trip) {
      setFormData({
        riderName: trip.riderName || '',
        riderPhone: trip.riderPhone || '',
        riderEmail: trip.riderEmail || '',
        pickupAddress: trip.pickupLocation?.address || '',
        dropoffAddress: trip.dropoffLocation?.address || '',
        scheduledDate: trip.scheduledDate ? new Date(trip.scheduledDate).toISOString().split('T')[0] : '',
        scheduledTime: trip.scheduledTime || '',
        status: trip.status || 'scheduled',
        assignedDriver: trip.assignedDriver?._id || '',
        assignedVehicle: trip.assignedVehicle?._id || '',
        fare: trip.fare ? trip.fare.replace(/[^0-9.]/g, '') : '',
        passengers: trip.passengers || 1,
        notes: trip.notes || '',
        specialInstructions: trip.specialInstructions || '',
        wheelchairAccessible: trip.wheelchairAccessible || false,
        priority: trip.priority || 'medium',
        paymentMethod: trip.paymentMethod || 'cash',
        tripType: trip.tripType || 'regular',
        isRecurring: trip.isRecurring || false,
        recurringPattern: trip.recurringPattern || 'weekly',
        emergencyContact: trip.emergencyContact || '',
        estimatedDuration: trip.estimatedDuration || '',
        estimatedDistance: trip.estimatedDistance || ''
      });
    }
  }, [trip]);

  // Fetch drivers and vehicles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchDriversAndVehicles = async () => {
        try {
          setLoading(true);
          
          const [driversResponse, vehiclesResponse] = await Promise.all([
            axios.get('/api/users?role=driver&status=active'),
            axios.get('/api/vehicles?status=active')
          ]);

          setDrivers(driversResponse.data || []);
          setVehicles(vehiclesResponse.data || []);
        } catch (error) {
          console.error('Error fetching drivers and vehicles:', error);
          toast({
            title: 'Error',
            description: 'Failed to load drivers and vehicles',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchDriversAndVehicles();
    }
  }, [isOpen, toast]);

  const handleInputChange = (field, value) => {
    console.log('TripEditModal handleInputChange:', { field, value });
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('Updated formData:', { field, value, currentValue: updated[field] });
      return updated;
    });

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.riderName.trim()) {
      newErrors.riderName = 'Rider name is required';
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.dropoffAddress.trim()) {
      newErrors.dropoffAddress = 'Dropoff address is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    }

    // Phone number validation
    if (formData.riderPhone && !/^\+?[\d\s\-()]+$/.test(formData.riderPhone)) {
      newErrors.riderPhone = 'Please enter a valid phone number';
    }

    // Email validation
    if (formData.riderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.riderEmail)) {
      newErrors.riderEmail = 'Please enter a valid email address';
    }

    // Date validation - cannot be in the past (except for completed trips)
    if (formData.scheduledDate && formData.status !== 'completed') {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Cannot schedule trips in the past';
      }
    }

    // Passengers validation
    if (formData.passengers < 1 || formData.passengers > 8) {
      newErrors.passengers = 'Passengers must be between 1 and 8';
    }

    // Fare validation
    if (formData.fare && (isNaN(formData.fare) || parseFloat(formData.fare) < 0)) {
      newErrors.fare = 'Fare must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check for scheduling conflicts if driver is assigned
    if (formData.assignedDriver && !shouldProceedWithSave) {
      conflictDetection.checkConflicts(
        {
          riderName: formData.riderName,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          pickupAddress: formData.pickupAddress,
          dropoffAddress: formData.dropoffAddress,
          estimatedDuration: formData.estimatedDuration || 60
        },
        formData.assignedDriver,
        formData.assignedVehicle
      );
      return;
    }

    try {
      setSaving(true);
      setShouldProceedWithSave(false);

      // Prepare data for API
      const updateData = {
        riderName: formData.riderName.trim(),
        riderPhone: formData.riderPhone.trim(),
        riderEmail: formData.riderEmail.trim(),
        pickupLocation: {
          address: formData.pickupAddress.trim(),
          notes: ''
        },
        dropoffLocation: {
          address: formData.dropoffAddress.trim(),
          notes: ''
        },
        scheduledDate: new Date(formData.scheduledDate),
        scheduledTime: formData.scheduledTime,
        status: formData.status,
        assignedDriver: formData.assignedDriver || null,
        assignedVehicle: formData.assignedVehicle || null,
        fare: formData.fare ? `$${parseFloat(formData.fare).toFixed(2)}` : null,
        passengers: parseInt(formData.passengers),
        notes: formData.notes.trim(),
        specialInstructions: formData.specialInstructions.trim(),
        wheelchairAccessible: formData.wheelchairAccessible,
        priority: formData.priority,
        paymentMethod: formData.paymentMethod,
        tripType: formData.tripType,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
        emergencyContact: formData.emergencyContact.trim(),
        estimatedDuration: formData.estimatedDuration.trim(),
        estimatedDistance: formData.estimatedDistance.trim()
      };

      await axios.put(`/api/trips/${trip._id}`, updateData);

      toast({
        title: 'Trip Updated',
        description: 'The trip has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update trip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!trip) return null;

  return (
    <>
      {/* Conflict Detection Modal */}
      <ConflictDetectionModal
        isOpen={conflictDetection.isOpen}
        onClose={() => {
          conflictDetection.onClose();
          setShouldProceedWithSave(false);
        }}
        tripData={conflictDetection.tripDataForCheck}
        driverId={conflictDetection.driverIdForCheck}
        vehicleId={conflictDetection.vehicleIdForCheck}
        onConflictsDetected={conflictDetection.onConflictsDetected}
        onProceedWithConflicts={() => {
          conflictDetection.onProceedWithConflicts();
          setShouldProceedWithSave(true);
          conflictDetection.onClose();
          // Re-trigger save
          setTimeout(() => handleSave(), 100);
        }}
        onProceedWithoutConflicts={() => {
          conflictDetection.onProceedWithoutConflicts();
          setShouldProceedWithSave(true);
          conflictDetection.onClose();
          // Re-trigger save
          setTimeout(() => handleSave(), 100);
        }}
      />

      {/* Main Trip Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="95vh">
        <ModalHeader>
          <HStack>
            <EditIcon color="blue" />
            <Box>
              <Text fontSize="xl" fontWeight="bold">Edit Trip</Text>
              <Text fontSize="sm" color="gray.600">
                Trip ID: {trip.tripId || trip._id?.substring(0, 8)}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Center py={8}>
              <VStack>
                <Spinner size="xl" color="blue.500" />
                <Text>Loading form data...</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Error Summary Alert */}
              {Object.keys(errors).length > 0 && (
                <Alert status="error" borderRadius="md" variant="subtle">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold" mb={2}>Please fix the following errors:</Text>
                    <VStack align="start" spacing={1} ml={2}>
                      {Object.entries(errors).map(([field, message], index) => (
                        <Text key={field} fontSize="sm">
                          {index + 1}. {message}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                </Alert>
              )}
              {/* Rider Information */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaUser />
                    <Text>Rider Information</Text>
                  </HStack>
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired isInvalid={!!errors.riderName}>
                    <FormLabel fontSize="sm">Rider Name</FormLabel>
                    <Input
                      placeholder="Enter rider's full name"
                      value={formData.riderName}
                      onChange={(e) => handleInputChange('riderName', e.target.value)}
                    />
                    <FormErrorMessage>{errors.riderName}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.riderPhone}>
                    <FormLabel fontSize="sm">Phone Number</FormLabel>
                    <Input
                      placeholder="(555) 123-4567"
                      value={formData.riderPhone}
                      onChange={(e) => handleInputChange('riderPhone', e.target.value)}
                    />
                    <FormErrorMessage>{errors.riderPhone}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.riderEmail}>
                    <FormLabel fontSize="sm">Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="rider@example.com"
                      value={formData.riderEmail}
                      onChange={(e) => handleInputChange('riderEmail', e.target.value)}
                    />
                    <FormErrorMessage>{errors.riderEmail}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Emergency Contact</FormLabel>
                    <Input
                      placeholder="Emergency contact name and phone"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Trip Route */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaMapMarkerAlt />
                    <Text>Trip Route</Text>
                  </HStack>
                </Text>
                
                <VStack spacing={4}>
                  <FormControl isRequired isInvalid={!!errors.pickupAddress}>
                    <FormLabel fontSize="sm">Pickup Address</FormLabel>
                    <PlacesAutocomplete
                      placeholder="Enter pickup location address"
                      value={formData.pickupAddress}
                      onChange={(address) => handleInputChange('pickupAddress', address)}
                      onPlaceSelected={(place) => handleInputChange('pickupAddress', place.address)}
                    />
                    <FormErrorMessage>{errors.pickupAddress}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.dropoffAddress}>
                    <FormLabel fontSize="sm">Dropoff Address</FormLabel>
                    <PlacesAutocomplete
                      placeholder="Enter dropoff location address"
                      value={formData.dropoffAddress}
                      onChange={(address) => handleInputChange('dropoffAddress', address)}
                      onPlaceSelected={(place) => handleInputChange('dropoffAddress', place.address)}
                    />
                    <FormErrorMessage>{errors.dropoffAddress}</FormErrorMessage>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl>
                      <FormLabel fontSize="sm">Estimated Distance</FormLabel>
                      <Input
                        placeholder="e.g., 5.2 miles"
                        value={formData.estimatedDistance}
                        onChange={(e) => handleInputChange('estimatedDistance', e.target.value)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Estimated Duration</FormLabel>
                      <Input
                        placeholder="e.g., 15 minutes"
                        value={formData.estimatedDuration}
                        onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                      />
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </Box>

              <Divider />

              {/* Schedule Information */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaClock />
                    <Text>Schedule Information</Text>
                  </HStack>
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl isRequired isInvalid={!!errors.scheduledDate}>
                    <FormLabel fontSize="sm">Scheduled Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    />
                    <FormErrorMessage>{errors.scheduledDate}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.scheduledTime}>
                    <FormLabel fontSize="sm">Scheduled Time</FormLabel>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    />
                    <FormErrorMessage>{errors.scheduledTime}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="pending">Pending</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl>
                    <HStack>
                      <Switch
                        isChecked={formData.isRecurring}
                        onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                      />
                      <FormLabel fontSize="sm" mb={0}>This is a recurring trip</FormLabel>
                    </HStack>
                  </FormControl>

                  {formData.isRecurring && (
                    <FormControl>
                      <FormLabel fontSize="sm">Recurring Pattern</FormLabel>
                      <Select
                        value={formData.recurringPattern}
                        onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </Select>
                    </FormControl>
                  )}
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Assignment */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaCar />
                    <Text>Driver & Vehicle Assignment</Text>
                  </HStack>
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Assigned Driver</FormLabel>
                    <Select
                      placeholder="Select a driver"
                      value={formData.assignedDriver}
                      onChange={(e) => handleInputChange('assignedDriver', e.target.value)}
                    >
                      {drivers.map((driver) => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} - {driver.phone}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Assigned Vehicle</FormLabel>
                    <Select
                      placeholder="Select a vehicle"
                      value={formData.assignedVehicle}
                      onChange={(e) => handleInputChange('assignedVehicle', e.target.value)}
                    >
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Trip Details */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaDollarSign />
                    <Text>Trip Details & Billing</Text>
                  </HStack>
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl isInvalid={!!errors.fare}>
                    <FormLabel fontSize="sm">Fare Amount ($)</FormLabel>
                    <NumberInput
                      min={0}
                      step={0.01}
                      precision={2}
                      value={formData.fare}
                      onChange={(valueString) => handleInputChange('fare', valueString)}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors.fare}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.passengers}>
                    <FormLabel fontSize="sm">Number of Passengers</FormLabel>
                    <NumberInput
                      min={1}
                      max={8}
                      value={formData.passengers}
                      onChange={(valueString) => handleInputChange('passengers', valueString)}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors.passengers}</FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Payment Method</FormLabel>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="credit">Credit Card</option>
                      <option value="insurance">Insurance</option>
                      <option value="voucher">Voucher</option>
                      <option value="account">Account Billing</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Trip Type</FormLabel>
                    <Select
                      value={formData.tripType}
                      onChange={(e) => handleInputChange('tripType', e.target.value)}
                    >
                      <option value="regular">Regular</option>
                      <option value="medical">Medical</option>
                      <option value="wheelchair">Wheelchair Accessible</option>
                      <option value="emergency">Emergency</option>
                      <option value="group">Group</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Priority</FormLabel>
                    <RadioGroup
                      value={formData.priority}
                      onChange={(value) => handleInputChange('priority', value)}
                    >
                      <Stack direction="row" spacing={4}>
                        <Radio value="low">Low</Radio>
                        <Radio value="medium">Medium</Radio>
                        <Radio value="high">High</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Special Requirements */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={4} color="blue.600">
                  <HStack>
                    <FaStickyNote />
                    <Text>Special Requirements & Notes</Text>
                  </HStack>
                </Text>
                
                <VStack spacing={4}>
                  <FormControl>
                    <HStack>
                      <Checkbox
                        isChecked={formData.wheelchairAccessible}
                        onChange={(e) => handleInputChange('wheelchairAccessible', e.target.checked)}
                      />
                      <FormLabel fontSize="sm" mb={0}>Wheelchair accessible vehicle required</FormLabel>
                    </HStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Special Instructions</FormLabel>
                    <Textarea
                      placeholder="Any special instructions for the driver..."
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Additional Notes</FormLabel>
                    <Textarea
                      placeholder="Any additional notes about this trip..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            leftIcon={<FaTimes />}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Saving..."
            leftIcon={<FaSave />}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
};

export default TripEditModal;