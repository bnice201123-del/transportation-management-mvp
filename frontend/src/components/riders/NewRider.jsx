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
  AlertIcon,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  SimpleGrid
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  CheckIcon,
  InfoIcon
} from '@chakra-ui/icons';
import {
  CurrencyDollarIcon,
  TicketIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
  TruckIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlacesAutocomplete from '../maps/PlacesAutocomplete';

const NewRider = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    preferredVehicleType: '',
    
    // Service Balance
    serviceBalanceType: 'trips', // 'trips' or 'dollars'
    tripBalance: 20,
    dollarBalance: 500.00,
    
    // Contract Management
    isContractBased: false,
    contractStartDate: '',
    contractEndDate: '',
    
    // Pricing & Mileage
    pricePerRide: 15.00,
    mileageBalance: 500,
    pricePerMile: 0.50
  });
  const [generatedId, setGeneratedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRiderId, setCreatedRiderId] = useState(null);
  const navigate = useNavigate();
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
    // Validation for name fields - only allow letters, spaces, hyphens, and apostrophes
    if ((field === 'firstName' || field === 'lastName') && value) {
      if (!/^[a-zA-Z\s'-]*$/.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    // Validation for phone field - only allow numbers, spaces, parentheses, hyphens, and plus signs
    if (field === 'phone' && value) {
      if (!/^[\d\s()+-]*$/.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === 'password') {
      console.log('Password changed to:', value);
    }

    // Auto-generate ID when last name or date of birth changes
    if (field === 'lastName' || field === 'dateOfBirth') {
      const birthYear = newFormData.dateOfBirth ? new Date(newFormData.dateOfBirth).getFullYear() : '';
      const newId = generateRiderId(newFormData.lastName, birthYear);
      setGeneratedId(newId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form data before validation:', formData);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (First Name, Last Name, Date of Birth, Email, Password)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Contract validation
    if (formData.isContractBased) {
      if (!formData.contractStartDate || !formData.contractEndDate) {
        toast({
          title: 'Validation Error',
          description: 'Please provide both contract start and end dates for contract-based service',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (new Date(formData.contractEndDate) <= new Date(formData.contractStartDate)) {
        toast({
          title: 'Validation Error',
          description: 'Contract end date must be after the start date',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    try {
      setLoading(true);

      const riderData = {
        ...formData,
        riderId: generatedId,
        role: 'rider',
        isActive: true,
        trips: [],
        
        // Service Balance
        serviceBalance: {
          type: formData.serviceBalanceType,
          tripCount: formData.serviceBalanceType === 'trips' ? formData.tripBalance : 0,
          dollarAmount: formData.serviceBalanceType === 'dollars' ? formData.dollarBalance : 0,
          originalTripCount: formData.serviceBalanceType === 'trips' ? formData.tripBalance : 0,
          originalDollarAmount: formData.serviceBalanceType === 'dollars' ? formData.dollarBalance : 0
        },
        
        // Contract details
        contractDetails: formData.isContractBased ? {
          isActive: true,
          startDate: formData.contractStartDate,
          endDate: formData.contractEndDate,
          createdAt: new Date().toISOString()
        } : null,
        
        // Pricing & Mileage
        pricingDetails: {
          pricePerRide: formData.pricePerRide,
          pricePerMile: formData.pricePerMile
        },
        
        mileageBalance: {
          currentBalance: formData.mileageBalance,
          originalBalance: formData.mileageBalance,
          totalUsed: 0
        }
      };

      console.log('Sending rider data:', riderData);

      const response = await axios.post('/api/auth/register', riderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setCreatedRiderId(response.data._id);

      toast({
        title: 'Success',
        description: `Rider ${formData.firstName} ${formData.lastName} created successfully with ID: ${generatedId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Don't navigate immediately - show success state with profile button
      // navigate(`/riders/${response.data._id}`);

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

        {/* Success Card - shown after creation */}
        {createdRiderId && (
          <Card bg="green.50" borderColor="green.200">
            <CardHeader>
              <HStack>
                <CheckIcon color="green.600" />
                <Heading size="md" color="green.700">Rider Created Successfully!</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="start">
                <Text>
                  <strong>{formData.firstName} {formData.lastName}</strong> has been added to the system with ID: <Badge colorScheme="blue">{generatedId}</Badge>
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <Text fontSize="sm">
                    <strong>Service Balance:</strong> {formData.serviceBalanceType === 'trips' 
                      ? `${formData.tripBalance} trips`
                      : `$${formData.dollarBalance.toFixed(2)}`
                    }
                  </Text>
                  <Text fontSize="sm">
                    <strong>Mileage Balance:</strong> {formData.mileageBalance} miles
                  </Text>
                  <Text fontSize="sm">
                    <strong>Price Per Ride:</strong> ${formData.pricePerRide.toFixed(2)}
                  </Text>
                  {formData.isContractBased && (
                    <Text fontSize="sm">
                      <strong>Contract:</strong> {new Date(formData.contractStartDate).toLocaleDateString()} - {new Date(formData.contractEndDate).toLocaleDateString()}
                    </Text>
                  )}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}

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

                {/* Email and Password */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
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
                <FormControl isRequired>
                  <FormLabel>Current Address</FormLabel>
                  <PlacesAutocomplete
                    value={formData.address}
                    onChange={(address) => handleInputChange('address', address)}
                    onPlaceSelected={(place) => handleInputChange('address', place.address)}
                    placeholder="Enter full address"
                    isRequired
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

                {/* Service Balance Section */}
                <Card bg="blue.50" borderColor="blue.200">
                  <CardHeader pb={2}>
                    <HStack>
                      <Box as={TicketIcon} w={5} h={5} color="blue.600" />
                      <Heading size="sm" color="blue.700">Service Balance</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4} align="start">
                      <FormControl>
                        <FormLabel mb={2}>Balance Type</FormLabel>
                        <RadioGroup
                          value={formData.serviceBalanceType}
                          onChange={(value) => handleInputChange('serviceBalanceType', value)}
                        >
                          <Stack direction="row" spacing={6}>
                            <Radio value="trips">
                              <HStack>
                                <Box as={TicketIcon} w={4} h={4} />
                                <Text>Trip Count</Text>
                              </HStack>
                            </Radio>
                            <Radio value="dollars">
                              <HStack>
                                <Box as={CurrencyDollarIcon} w={4} h={4} />
                                <Text>Dollar Amount</Text>
                              </HStack>
                            </Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                        {formData.serviceBalanceType === 'trips' ? (
                          <FormControl>
                            <FormLabel>Number of Trips</FormLabel>
                            <NumberInput
                              value={formData.tripBalance}
                              onChange={(valueString, valueNumber) => 
                                handleInputChange('tripBalance', valueNumber || 0)
                              }
                              min={0}
                              max={999}
                            >
                              <NumberInputField placeholder="Enter number of trips" />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        ) : (
                          <FormControl>
                            <FormLabel>Dollar Amount</FormLabel>
                            <InputGroup>
                              <InputLeftElement
                                pointerEvents="none"
                                color="gray.500"
                                children="$"
                              />
                              <NumberInput
                                value={formData.dollarBalance}
                                onChange={(valueString, valueNumber) => 
                                  handleInputChange('dollarBalance', valueNumber || 0)
                                }
                                min={0}
                                precision={2}
                                step={0.01}
                                w="full"
                              >
                                <NumberInputField pl={8} placeholder="Enter dollar amount" />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </InputGroup>
                          </FormControl>
                        )}
                      </SimpleGrid>

                      <Box p={3} bg="blue.100" borderRadius="md" w="full">
                        <Text fontSize="sm" color="blue.700">
                          <strong>Balance Preview:</strong>{' '}
                          {formData.serviceBalanceType === 'trips' 
                            ? `${formData.tripBalance} trips remaining`
                            : `$${formData.dollarBalance.toFixed(2)} credit available`
                          }
                        </Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Contract Management Section */}
                <Card bg="purple.50" borderColor="purple.200">
                  <CardHeader pb={2}>
                    <HStack>
                      <Box as={DocumentTextIcon} w={5} h={5} color="purple.600" />
                      <Heading size="sm" color="purple.700">Contract Management</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={4} align="start">
                      <Checkbox
                        isChecked={formData.isContractBased}
                        onChange={(e) => handleInputChange('isContractBased', e.target.checked)}
                        colorScheme="purple"
                      >
                        This service is contract-based
                      </Checkbox>

                      {formData.isContractBased && (
                        <VStack spacing={4} w="full" pl={6}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                            <FormControl isRequired>
                              <FormLabel>Contract Start Date</FormLabel>
                              <Input
                                type="date"
                                value={formData.contractStartDate}
                                onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                              />
                            </FormControl>
                            <FormControl isRequired>
                              <FormLabel>Contract End Date</FormLabel>
                              <Input
                                type="date"
                                value={formData.contractEndDate}
                                onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                                min={formData.contractStartDate}
                              />
                            </FormControl>
                          </SimpleGrid>

                          {formData.contractStartDate && formData.contractEndDate && (
                            <Box p={3} bg="purple.100" borderRadius="md" w="full">
                              <Text fontSize="sm" color="purple.700">
                                <strong>Contract Duration:</strong>{' '}
                                {Math.ceil((new Date(formData.contractEndDate) - new Date(formData.contractStartDate)) / (1000 * 60 * 60 * 24))} days
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Pricing & Mileage Section */}
                <Card bg="green.50" borderColor="green.200">
                  <CardHeader pb={2}>
                    <HStack>
                      <Box as={CalculatorIcon} w={5} h={5} color="green.600" />
                      <Heading size="sm" color="green.700">Pricing & Mileage</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel>Price Per Ride</FormLabel>
                        <InputGroup>
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.500"
                            children="$"
                          />
                          <NumberInput
                            value={formData.pricePerRide}
                            onChange={(valueString, valueNumber) => 
                              handleInputChange('pricePerRide', valueNumber || 0)
                            }
                            min={0}
                            precision={2}
                            step={0.01}
                            w="full"
                          >
                            <NumberInputField pl={8} placeholder="0.00" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Mileage Balance</FormLabel>
                        <InputGroup>
                          <NumberInput
                            value={formData.mileageBalance}
                            onChange={(valueString, valueNumber) => 
                              handleInputChange('mileageBalance', valueNumber || 0)
                            }
                            min={0}
                            w="full"
                          >
                            <NumberInputField placeholder="Enter miles" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <InputRightAddon children="miles" />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Price Per Mile</FormLabel>
                        <InputGroup>
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.500"
                            children="$"
                          />
                          <NumberInput
                            value={formData.pricePerMile}
                            onChange={(valueString, valueNumber) => 
                              handleInputChange('pricePerMile', valueNumber || 0)
                            }
                            min={0}
                            precision={2}
                            step={0.01}
                            w="full"
                          >
                            <NumberInputField pl={8} placeholder="0.00" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <Box p={3} bg="green.100" borderRadius="md" w="full" mt={4}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="green.700">
                          <strong>Pricing Summary:</strong>
                        </Text>
                        <Badge colorScheme="green" variant="subtle">
                          {formData.mileageBalance} miles @ ${formData.pricePerMile}/mile
                        </Badge>
                      </HStack>
                    </Box>
                  </CardBody>
                </Card>

                <Divider />

                {/* Submit Buttons */}
                <HStack spacing={4} w="full">
                  <Spacer />
                  
                  {createdRiderId && (
                    <Button
                      colorScheme="green"
                      variant="outline"
                      leftIcon={<Box as={UserIcon} w={4} h={4} />}
                      rightIcon={<Box as={ArrowTopRightOnSquareIcon} w={4} h={4} />}
                      onClick={() => navigate(`/riders/${createdRiderId}`)}
                    >
                      View Rider Profile
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/riders')}
                    isDisabled={loading}
                  >
                    {createdRiderId ? 'Back to Riders' : 'Cancel'}
                  </Button>
                  
                  {!createdRiderId && (
                    <Button
                      type="submit"
                      colorScheme="blue"
                      leftIcon={<CheckIcon />}
                      isLoading={loading}
                      loadingText="Creating Rider..."
                    >
                      Create Rider
                    </Button>
                  )}
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