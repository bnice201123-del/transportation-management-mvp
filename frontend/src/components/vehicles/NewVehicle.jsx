import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Spinner,
  Center,
  Flex,
  Spacer,
  IconButton,
  Divider,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  CheckIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NewVehicle = () => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    status: 'active',
    capacity: '',
    fuelType: '',
    lastServiceDate: '',
    nextServiceDate: '',
    mileage: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.make || !formData.model || !formData.year || !formData.licensePlate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Make, Model, Year, License Plate)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const vehicleData = {
        ...formData,
        year: parseInt(formData.year),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        trips: [],
        maintenanceHistory: []
      };

      const response = await axios.post('/api/vehicles', vehicleData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: `${formData.year} ${formData.make} ${formData.model} added successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to the new vehicle's profile
      navigate(`/vehicles/${response.data._id}`);

    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create vehicle',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => navigate('/vehicles')}
            mr={4}
            title="Back to Vehicles"
          />
          <Heading size="lg">Add New Vehicle</Heading>
        </Flex>

        {/* Info Alert */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Vehicle Information</Text>
            <Text fontSize="sm">
              Add a new vehicle to the transportation fleet. All vehicles start with 'Active' status.
            </Text>
          </Box>
        </Alert>

        {/* Form */}
        <Card>
          <CardHeader>
            <Heading size="md">Vehicle Details</Heading>
            <Text color="gray.600" fontSize="sm">
              Enter the vehicle information. Required fields are marked with *
            </Text>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {/* Basic Information */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Make</FormLabel>
                    <Input
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      placeholder="e.g., Toyota, Ford, Honda"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Model</FormLabel>
                    <Input
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g., Camry, F-150, Civic"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Year</FormLabel>
                    <Input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="e.g., 2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>License Plate</FormLabel>
                    <Input
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                      placeholder="e.g., ABC-1234"
                      textTransform="uppercase"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
                    <Input
                      value={formData.vin}
                      onChange={(e) => handleInputChange('vin', e.target.value)}
                      placeholder="17-character VIN"
                      maxLength="17"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Color</FormLabel>
                    <Input
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="e.g., White, Blue, Silver"
                    />
                  </FormControl>
                </SimpleGrid>

                <Divider />

                {/* Vehicle Specifications */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Passenger Capacity</FormLabel>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="e.g., 4, 7"
                      min="1"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select
                      value={formData.fuelType}
                      onChange={(e) => handleInputChange('fuelType', e.target.value)}
                      placeholder="Select fuel type"
                    >
                      <option value="gasoline">Gasoline</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="cng">Compressed Natural Gas</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Current Mileage</FormLabel>
                    <Input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => handleInputChange('mileage', e.target.value)}
                      placeholder="Current odometer reading"
                      min="0"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out-of-service">Out of Service</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <Divider />

                {/* Service Information */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Last Service Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.lastServiceDate}
                      onChange={(e) => handleInputChange('lastServiceDate', e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Next Service Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.nextServiceDate}
                      onChange={(e) => handleInputChange('nextServiceDate', e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Notes */}
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes about the vehicle..."
                    rows={3}
                  />
                </FormControl>

                <Divider />

                {/* Submit Buttons */}
                <HStack spacing={4} w="full">
                  <Spacer />
                  <Button
                    variant="outline"
                    onClick={() => navigate('/vehicles')}
                    isDisabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<CheckIcon />}
                    isLoading={loading}
                    loadingText="Adding Vehicle..."
                  >
                    Add Vehicle
                  </Button>
                </HStack>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default NewVehicle;