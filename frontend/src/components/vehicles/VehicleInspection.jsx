import React, { useState, useEffect } from 'react';
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
  Checkbox,
  CheckboxGroup,
  Textarea,
  Input,
  Select,
  useToast,
  Spinner,
  Center,
  Badge,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Divider,
  useColorModeValue,
  Image,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  AlertIcon,
  Progress
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const VehicleInspection = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [viewHistory, setViewHistory] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Inspection form state
  const [formData, setFormData] = useState({
    type: 'pre-trip',
    mileage: '',
    notes: '',
    checklistItems: []
  });

  // Inspection checklist categories
  const inspectionCategories = {
    'Exterior': [
      'Body condition (dents, scratches)',
      'Paint condition',
      'Windshield and windows (cracks, chips)',
      'Mirrors (clean, adjusted)',
      'License plate visible and secure',
      'Headlights (working)',
      'Taillights and brake lights (working)',
      'Turn signals (working)',
      'Door locks and handles',
      'Wipers and washer fluid'
    ],
    'Tires & Wheels': [
      'Tire tread depth (all tires)',
      'Tire pressure (all tires)',
      'Spare tire condition',
      'Wheel lug nuts tight',
      'No visible damage to rims'
    ],
    'Under Hood': [
      'Engine oil level',
      'Coolant level',
      'Brake fluid level',
      'Power steering fluid',
      'Transmission fluid',
      'Battery terminals (clean, tight)',
      'Belts (condition, tension)',
      'Hoses (condition, leaks)',
      'Air filter condition'
    ],
    'Interior': [
      'Seat belts (all functioning)',
      'Seats (condition, adjusted)',
      'Steering wheel (condition)',
      'Dashboard lights (functioning)',
      'Horn (working)',
      'Interior lights (working)',
      'Air conditioning/heating',
      'Radio/communication system',
      'Cleanliness (interior)',
      'First aid kit present'
    ],
    'Brakes & Safety': [
      'Brake pedal (firm, responsive)',
      'Parking brake (functioning)',
      'Emergency triangles/flares',
      'Fire extinguisher',
      'Emergency exits accessible',
      'Safety equipment present'
    ],
    'Documentation': [
      'Registration current',
      'Insurance card present',
      'Vehicle manual present',
      'Maintenance records current'
    ]
  };

  useEffect(() => {
    fetchVehicle();
    fetchInspectionHistory();
  }, [vehicleId]);

  useEffect(() => {
    // Initialize checklist items
    const items = [];
    Object.entries(inspectionCategories).forEach(([category, categoryItems]) => {
      categoryItems.forEach(item => {
        items.push({
          category,
          item,
          status: 'pass',
          notes: ''
        });
      });
    });
    setFormData(prev => ({ ...prev, checklistItems: items }));
  }, []);

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVehicle(response.data);
      setFormData(prev => ({ ...prev, mileage: response.data.mileage || '' }));
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchInspectionHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vehicle-management/${vehicleId}/inspections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInspectionHistory(response.data.inspections || []);
    } catch (error) {
      console.error('Error fetching inspection history:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = (index, field, value) => {
    const updatedItems = [...formData.checklistItems];
    updatedItems[index][field] = value;
    setFormData({ ...formData, checklistItems: updatedItems });
  };

  const calculateOverallStatus = () => {
    const failedItems = formData.checklistItems.filter(item => item.status === 'fail');
    const warningItems = formData.checklistItems.filter(item => item.status === 'warning');
    
    if (failedItems.length > 0) return 'failed';
    if (warningItems.length > 0) return 'needs-attention';
    return 'passed';
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const inspectionData = {
        ...formData,
        overallStatus: calculateOverallStatus()
      };

      await axios.post(
        `/api/vehicle-management/${vehicleId}/inspections`,
        inspectionData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast({
        title: 'Success',
        description: 'Inspection submitted successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form or navigate away
      navigate(`/vehicles/${vehicleId}`);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit inspection',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'green';
      case 'fail': return 'red';
      case 'warning': return 'yellow';
      case 'not-applicable': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircleIcon color="green.500" />;
      case 'fail': return <CloseIcon color="red.500" />;
      case 'warning': return <WarningIcon color="yellow.500" />;
      default: return null;
    }
  };

  const renderInspectionForm = () => {
    const completedItems = formData.checklistItems.filter(item => 
      item.status !== 'not-applicable'
    ).length;
    const totalItems = formData.checklistItems.length;
    const progress = (completedItems / totalItems) * 100;

    return (
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg}>
          <CardHeader>
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Heading size="md">New Vehicle Inspection</Heading>
                <Text fontSize="sm" color="gray.500">
                  {vehicle?.year} {vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}
                </Text>
              </VStack>
              <Badge colorScheme="blue" fontSize="lg" p={2}>
                {Math.round(progress)}% Complete
              </Badge>
            </HStack>
            <Progress value={progress} colorScheme="blue" size="sm" mt={4} />
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={6}>
              <FormControl>
                <FormLabel>Inspection Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="pre-trip">Pre-Trip</option>
                  <option value="post-trip">Post-Trip</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="random">Random</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Current Mileage</FormLabel>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="Enter current mileage"
                />
              </FormControl>
            </Grid>

            <Divider my={6} />

            <Heading size="sm" mb={4}>Inspection Checklist</Heading>

            <Accordion allowMultiple defaultIndex={[0]}>
              {Object.entries(inspectionCategories).map(([category, items], categoryIndex) => {
                const categoryItems = formData.checklistItems.filter(
                  item => item.category === category
                );
                const passedItems = categoryItems.filter(item => item.status === 'pass').length;
                const failedItems = categoryItems.filter(item => item.status === 'fail').length;

                return (
                  <AccordionItem key={category}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Text fontWeight="semibold">{category}</Text>
                          <Badge colorScheme={failedItems > 0 ? 'red' : 'green'}>
                            {passedItems}/{items.length}
                          </Badge>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={3}>
                        {items.map((item, itemIndex) => {
                          const checklistIndex = formData.checklistItems.findIndex(
                            ci => ci.category === category && ci.item === item
                          );
                          const checklistItem = formData.checklistItems[checklistIndex];

                          return (
                            <Card key={itemIndex} variant="outline" size="sm">
                              <CardBody>
                                <VStack align="stretch" spacing={2}>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm" flex={1}>{item}</Text>
                                    {getStatusIcon(checklistItem?.status)}
                                  </HStack>
                                  
                                  <HStack spacing={2}>
                                    <Button
                                      size="xs"
                                      colorScheme={checklistItem?.status === 'pass' ? 'green' : 'gray'}
                                      onClick={() => updateChecklistItem(checklistIndex, 'status', 'pass')}
                                    >
                                      Pass
                                    </Button>
                                    <Button
                                      size="xs"
                                      colorScheme={checklistItem?.status === 'warning' ? 'yellow' : 'gray'}
                                      onClick={() => updateChecklistItem(checklistIndex, 'status', 'warning')}
                                    >
                                      Warning
                                    </Button>
                                    <Button
                                      size="xs"
                                      colorScheme={checklistItem?.status === 'fail' ? 'red' : 'gray'}
                                      onClick={() => updateChecklistItem(checklistIndex, 'status', 'fail')}
                                    >
                                      Fail
                                    </Button>
                                    <Button
                                      size="xs"
                                      colorScheme={checklistItem?.status === 'not-applicable' ? 'gray' : 'gray'}
                                      variant="outline"
                                      onClick={() => updateChecklistItem(checklistIndex, 'status', 'not-applicable')}
                                    >
                                      N/A
                                    </Button>
                                  </HStack>

                                  {(checklistItem?.status === 'fail' || checklistItem?.status === 'warning') && (
                                    <Input
                                      size="sm"
                                      placeholder="Add notes about this issue..."
                                      value={checklistItem?.notes || ''}
                                      onChange={(e) => updateChecklistItem(checklistIndex, 'notes', e.target.value)}
                                    />
                                  )}
                                </VStack>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <FormControl mt={6}>
              <FormLabel>Additional Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional comments about this inspection..."
                rows={4}
              />
            </FormControl>

            <HStack justify="space-between" mt={6}>
              <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate(`/vehicles/${vehicleId}`)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={submitting}
                isDisabled={!formData.mileage}
              >
                Submit Inspection
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    );
  };

  const renderInspectionHistory = () => (
    <VStack spacing={4} align="stretch">
      <Card bg={cardBg}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">Inspection History</Heading>
            <Button size="sm" onClick={() => setViewHistory(false)}>
              New Inspection
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          {inspectionHistory.length === 0 ? (
            <Center py={8}>
              <Text color="gray.500">No inspection records found</Text>
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              {inspectionHistory.map((inspection, index) => (
                <Card key={index} variant="outline">
                  <CardBody>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">Date</Text>
                        <Text fontWeight="semibold">
                          {new Date(inspection.date).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">Type</Text>
                        <Badge colorScheme="blue">{inspection.type}</Badge>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">Status</Text>
                        <Badge
                          colorScheme={
                            inspection.overallStatus === 'passed' ? 'green' :
                            inspection.overallStatus === 'failed' ? 'red' : 'yellow'
                          }
                        >
                          {inspection.overallStatus}
                        </Badge>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">Mileage</Text>
                        <Text>{inspection.mileage?.toLocaleString()} mi</Text>
                      </VStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">Inspector</Text>
                        <Text>
                          {inspection.inspectedBy?.firstName} {inspection.inspectedBy?.lastName}
                        </Text>
                      </VStack>
                      {inspection.notes && (
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" color="gray.500">Notes</Text>
                          <Text fontSize="sm">{inspection.notes}</Text>
                        </VStack>
                      )}
                    </Grid>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    </VStack>
  );

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          <HStack>
            <Button
              leftIcon={<ArrowBackIcon />}
              onClick={() => navigate('/vehicles')}
              variant="ghost"
            >
              Back to Vehicles
            </Button>
          </HStack>

          {viewHistory ? renderInspectionHistory() : renderInspectionForm()}
        </VStack>
      </Container>
    </Box>
  );
};

export default VehicleInspection;
