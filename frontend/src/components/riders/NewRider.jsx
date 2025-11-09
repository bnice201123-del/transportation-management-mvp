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
import { useAuth } from '../../contexts/AuthContext';

const NewRider = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    preferredVehicleType: ''
  });
  const [generatedId, setGeneratedId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Generate Rider ID when last name or birth year changes
  const generateRiderId = (lastName, birthYear) => {
    if (!lastName || !birthYear) return '';

    // Format: [LastName][BirthYear][###]
    // Remove spaces and special characters from last name
    const cleanLastName = lastName.replace(/[^a-zA-Z]/g, '');

    // Generate a random 3-digit number
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999

    return `${cleanLastName}${birthYear}${randomNum}`;
  };

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Auto-generate ID when last name or date of birth changes
    if (field === 'lastName' || field === 'dateOfBirth') {
      const birthYear = newFormData.dateOfBirth ? new Date(newFormData.dateOfBirth).getFullYear() : '';
      const newId = generateRiderId(newFormData.lastName, birthYear);
      setGeneratedId(newId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (First Name, Last Name, Date of Birth)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const riderData = {
        ...formData,
        riderId: generatedId,
        isActive: true,
        trips: []
      };

      const response = await axios.post('/api/riders', riderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: `Rider ${formData.firstName} ${formData.lastName} created successfully with ID: ${generatedId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate to the new rider's profile
      navigate(`/riders/${response.data._id}`);

    } catch (error) {
      console.error('Error creating rider:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create rider',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatIdPreview = () => {
    if (!generatedId) return 'ID will be generated automatically';
    return `Generated ID: ${generatedId}`;
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center">
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => navigate('/riders')}
            mr={4}
            title="Back to Riders"
          />
          <Heading size="lg">Create New Rider</Heading>
        </Flex>

        {/* ID Generation Info */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Automatic ID Generation</Text>
            <Text fontSize="sm">
              Rider IDs are automatically generated in the format: [LastName][BirthYear][###]
              <br />
              Example: Smith1985123
            </Text>
          </Box>
        </Alert>

        {/* Form */}
        <Card>
          <CardHeader>
            <Heading size="md">Rider Information</Heading>
            <Text color="gray.600" fontSize="sm">
              Fill in the rider's details. Required fields are marked with *
            </Text>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {/* Generated ID Display */}
                <Box w="full" p={4} bg="gray.50" borderRadius="md">
                  <HStack>
                    <InfoIcon color="blue.500" />
                    <Text fontWeight="bold" color="blue.700">{formatIdPreview()}</Text>
                  </HStack>
                </Box>

                {/* Name Fields */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </FormControl>
                </HStack>

                {/* Date of Birth */}
                <FormControl isRequired>
                  <FormLabel>Date of Birth</FormLabel>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </FormControl>

                {/* Address */}
                <FormControl>
                  <FormLabel>Current Address</FormLabel>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </FormControl>

                {/* Phone */}
                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </FormControl>

                {/* Preferred Vehicle Type */}
                <FormControl>
                  <FormLabel>Preferred Vehicle Type</FormLabel>
                  <Select
                    value={formData.preferredVehicleType}
                    onChange={(e) => handleInputChange('preferredVehicleType', e.target.value)}
                    placeholder="Select preferred vehicle type"
                  >
                    <option value="standard">Standard</option>
                    <option value="wheelchair-accessible">Wheelchair Accessible</option>
                    <option value="van">Van</option>
                    <option value="luxury">Luxury</option>
                  </Select>
                </FormControl>

                <Divider />

                {/* Submit Buttons */}
                <HStack spacing={4} w="full">
                  <Spacer />
                  <Button
                    variant="outline"
                    onClick={() => navigate('/riders')}
                    isDisabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<CheckIcon />}
                    isLoading={loading}
                    loadingText="Creating Rider..."
                  >
                    Create Rider
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

export default NewRider;