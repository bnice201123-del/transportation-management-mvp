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
  Input,
  Select,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { AddIcon, ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons';
import { FaEllipsisV, FaGasPump, FaTools, FaFileInvoiceDollar } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const VehicleExpenseTracker = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState({
    category: 'all',
    startDate: '',
    endDate: ''
  });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'fuel',
    description: '',
    amount: '',
    vendor: '',
    mileage: '',
    paymentMethod: '',
    notes: ''
  });

  const expenseCategories = [
    { value: 'fuel', label: 'Fuel', icon: FaGasPump, color: 'blue' },
    { value: 'maintenance', label: 'Maintenance', icon: FaTools, color: 'orange' },
    { value: 'insurance', label: 'Insurance', icon: FaFileInvoiceDollar, color: 'green' },
    { value: 'registration', label: 'Registration', icon: FaFileInvoiceDollar, color: 'purple' },
    { value: 'tolls', label: 'Tolls', icon: FaFileInvoiceDollar, color: 'cyan' },
    { value: 'parking', label: 'Parking', icon: FaFileInvoiceDollar, color: 'teal' },
    { value: 'cleaning', label: 'Cleaning', icon: FaFileInvoiceDollar, color: 'pink' },
    { value: 'other', label: 'Other', icon: FaFileInvoiceDollar, color: 'gray' }
  ];

  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId, filter]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);

      // Fetch vehicle details
      const vehicleResponse = await axios.get(`/api/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVehicle(vehicleResponse.data);

      // Fetch expenses with filters
      const params = new URLSearchParams();
      if (filter.category !== 'all') params.append('category', filter.category);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const expensesResponse = await axios.get(
        `/api/vehicle-management/${vehicleId}/expenses?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setExpenses(expensesResponse.data.expenses || []);
      setSummary(expensesResponse.data.summary || {});
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate form
      if (!formData.amount || !formData.category || !formData.description) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      await axios.post(
        `/api/vehicle-management/${vehicleId}/expenses`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast({
        title: 'Success',
        description: 'Expense added successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'fuel',
        description: '',
        amount: '',
        vendor: '',
        mileage: '',
        paymentMethod: '',
        notes: ''
      });

      onClose();
      fetchVehicleData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add expense',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category) => {
    const cat = expenseCategories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Vendor', 'Mileage', 'Payment Method'];
    const rows = expenses.map(exp => [
      new Date(exp.date).toLocaleDateString(),
      exp.category,
      exp.description,
      exp.amount,
      exp.vendor || '',
      exp.mileage || '',
      exp.paymentMethod || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-expenses-${vehicle?.licensePlate}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderSummaryCards = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
      <Card bg={cardBg}>
        <CardBody>
          <Stat>
            <StatLabel>Total Expenses</StatLabel>
            <StatNumber>${summary.total?.toFixed(2) || '0.00'}</StatNumber>
            <StatHelpText>{summary.count || 0} transactions</StatHelpText>
          </Stat>
        </CardBody>
      </Card>

      {Object.entries(summary.byCategory || {}).slice(0, 3).map(([category, amount]) => (
        <Card key={category} bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel textTransform="capitalize">{category}</StatLabel>
              <StatNumber>${amount.toFixed(2)}</StatNumber>
              <StatHelpText>
                {((amount / summary.total) * 100).toFixed(1)}% of total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
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
          {/* Header */}
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Button
                leftIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/vehicles/${vehicleId}`)}
                variant="ghost"
                mb={2}
              >
                Back to Vehicle
              </Button>
              <Heading size="lg">Expense Tracker</Heading>
              <Text color="gray.500">
                {vehicle?.year} {vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}
              </Text>
            </VStack>
            <HStack>
              <Button
                leftIcon={<DownloadIcon />}
                onClick={exportToCSV}
                variant="outline"
                isDisabled={expenses.length === 0}
              >
                Export CSV
              </Button>
              <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
                Add Expense
              </Button>
            </HStack>
          </HStack>

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Filters */}
          <Card bg={cardBg}>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={filter.category}
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  >
                    <option value="all">All Categories</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                  />
                </FormControl>
              </Grid>
            </CardBody>
          </Card>

          {/* Expenses Table */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Expense History</Heading>
            </CardHeader>
            <CardBody>
              {expenses.length === 0 ? (
                <Center py={8}>
                  <Text color="gray.500">No expenses found</Text>
                </Center>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Category</Th>
                        <Th>Description</Th>
                        <Th>Vendor</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Mileage</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {expenses.map((expense, index) => (
                        <Tr key={index}>
                          <Td>{new Date(expense.date).toLocaleDateString()}</Td>
                          <Td>
                            <Badge colorScheme={getCategoryColor(expense.category)}>
                              {expense.category}
                            </Badge>
                          </Td>
                          <Td>{expense.description}</Td>
                          <Td>{expense.vendor || '-'}</Td>
                          <Td isNumeric fontWeight="semibold">
                            ${expense.amount.toFixed(2)}
                          </Td>
                          <Td>{expense.mileage ? `${expense.mileage.toLocaleString()} mi` : '-'}</Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FaEllipsisV />}
                                variant="ghost"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem>View Details</MenuItem>
                                <MenuItem>Edit</MenuItem>
                                <MenuItem color="red.500">Delete</MenuItem>
                              </MenuList>
                            </Menu>
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

      {/* Add Expense Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Expense</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Vendor</FormLabel>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Vendor name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Mileage</FormLabel>
                  <Input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="Current mileage"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="debit-card">Debit Card</option>
                    <option value="company-account">Company Account</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
              </Grid>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the expense"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              Add Expense
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default VehicleExpenseTracker;
