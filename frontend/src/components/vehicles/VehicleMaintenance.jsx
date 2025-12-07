import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  Input,
  Textarea,
  useToast,
  Spinner,
  Center,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CalendarIcon,
  TimeIcon,
  ArrowBackIcon
} from '@chakra-ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const VehicleMaintenance = () => {
  const [vehicle, setVehicle] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingRecord, setEditingRecord] = useState(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Form state
  const [formData, setFormData] = useState({
    type: 'service',
    description: '',
    mileage: '',
    cost: '',
    performedBy: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(`/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setVehicle(response.data);
      setMaintenanceRecords(response.data.maintenanceHistory || []);
    } catch (error) {
      console.error('Error fetching vehicle maintenance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load maintenance data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, toast, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const maintenanceData = {
        ...formData,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        date: formData.date || new Date().toISOString()
      };

      const response = await axios.post(`/api/vehicles/${vehicleId}/maintenance`, maintenanceData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Maintenance record added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setFormData({
          type: 'service',
          description: '',
          mileage: '',
          cost: '',
          performedBy: '',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });

        onClose();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add maintenance record',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      type: record.type || 'service',
      description: record.description || '',
      mileage: record.mileage?.toString() || '',
      cost: record.cost?.toString() || '',
      performedBy: record.performedBy || '',
      notes: record.notes || '',
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    onOpen();
  };

  const getStatusBadge = (type) => {
    switch (type) {
      case 'service':
        return <Badge colorScheme="blue">Service</Badge>;
      case 'repair':
        return <Badge colorScheme="red">Repair</Badge>;
      case 'inspection':
        return <Badge colorScheme="green">Inspection</Badge>;
      default:
        return <Badge colorScheme="gray">{type}</Badge>;
    }
  };

  const getMaintenanceStats = () => {
    const totalRecords = maintenanceRecords.length;
    const totalCost = maintenanceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    const avgCost = totalRecords > 0 ? totalCost / totalRecords : 0;
    const lastService = maintenanceRecords.length > 0 ?
      maintenanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;

    return { totalRecords, totalCost, avgCost, lastService };
  };

  const stats = getMaintenanceStats();

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading maintenance data...</Text>
        </VStack>
      </Center>
    );
  }

  if (!vehicle) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Text>Vehicle not found</Text>
          <Button onClick={() => navigate('/vehicles')}>Back to Vehicles</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack>
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={() => navigate(`/vehicles/${vehicleId}`)}
                title="Back to Vehicle Profile"
              />
              <VStack align="start" spacing={0}>
                <Heading size="lg">Maintenance History</Heading>
                <Text fontSize="sm" color="gray.600">
                  {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                </Text>
              </VStack>
            </HStack>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => {
              setEditingRecord(null);
              setFormData({
                type: 'service',
                description: '',
                mileage: '',
                cost: '',
                performedBy: '',
                notes: '',
                date: new Date().toISOString().split('T')[0]
              });
              onOpen();
            }}>
              Add Maintenance Record
            </Button>
          </HStack>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Records</StatLabel>
                  <StatNumber>{stats.totalRecords}</StatNumber>
                  <StatHelpText>Maintenance entries</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Cost</StatLabel>
                  <StatNumber>${stats.totalCost.toFixed(2)}</StatNumber>
                  <StatHelpText>All maintenance</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Average Cost</StatLabel>
                  <StatNumber>${stats.avgCost.toFixed(2)}</StatNumber>
                  <StatHelpText>Per maintenance</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Last Service</StatLabel>
                  <StatNumber>
                    {stats.lastService ? new Date(stats.lastService.date).toLocaleDateString() : 'N/A'}
                  </StatNumber>
                  <StatHelpText>Most recent</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Maintenance Records */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Maintenance Records</Heading>
            </CardHeader>
            <CardBody>
              {maintenanceRecords.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  <Text>No maintenance records found. Add the first maintenance record to get started.</Text>
                </Alert>
              ) : (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Type</Th>
                        <Th>Description</Th>
                        <Th>Mileage</Th>
                        <Th>Cost</Th>
                        <Th>Performed By</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {maintenanceRecords
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((record, index) => (
                        <Tr key={record._id || index}>
                          <Td>{new Date(record.date).toLocaleDateString()}</Td>
                          <Td>{getStatusBadge(record.type)}</Td>
                          <Td>
                            <Text fontSize="sm" maxW="200px" isTruncated title={record.description}>
                              {record.description}
                            </Text>
                          </Td>
                          <Td>{record.mileage ? `${record.mileage.toLocaleString()} mi` : 'N/A'}</Td>
                          <Td>${record.cost ? record.cost.toFixed(2) : '0.00'}</Td>
                          <Td>{record.performedBy || 'N/A'}</Td>
                          <Td>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(record)}
                              title="Edit Record"
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Add/Edit Maintenance Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="service">Service</option>
                      <option value="repair">Repair</option>
                      <option value="inspection">Inspection</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the maintenance work performed..."
                    rows={3}
                  />
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Mileage</FormLabel>
                    <Input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                      placeholder="Current mileage"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Cost ($)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      placeholder="0.00"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Performed By</FormLabel>
                    <Input
                      value={formData.performedBy}
                      onChange={(e) => setFormData({...formData, performedBy: e.target.value})}
                      placeholder="Technician/Service center"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
              loadingText="Saving..."
            >
              {editingRecord ? 'Update Record' : 'Add Record'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VehicleMaintenance;