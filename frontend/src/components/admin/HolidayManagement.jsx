import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
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
  IconButton,
  Flex,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Textarea
} from '@chakra-ui/react';
import { CalendarIcon, PlusIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const HolidayManagement = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [customHolidays, setCustomHolidays] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    description: ''
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchFederalHolidays(),
        fetchCustomHolidays(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Error fetching holiday data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFederalHolidays = async () => {
    try {
      const response = await axios.get(`/api/holidays/federal/${selectedYear}`);
      setHolidays(response.data.holidays || []);
    } catch (error) {
      console.error('Error fetching federal holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to load federal holidays',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchCustomHolidays = async () => {
    try {
      const response = await axios.get('/api/holidays/custom');
      setCustomHolidays(response.data.customHolidays || []);
    } catch (error) {
      console.error('Error fetching custom holidays:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/holidays/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleAddCustomHoliday = async () => {
    try {
      if (!newHoliday.name || !newHoliday.date) {
        toast({
          title: 'Error',
          description: 'Name and date are required',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await axios.post('/api/holidays/custom', newHoliday);
      
      toast({
        title: 'Success',
        description: 'Custom holiday added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewHoliday({ name: '', date: '', description: '' });
      onAddClose();
      fetchCustomHolidays();
    } catch (error) {
      console.error('Error adding custom holiday:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add custom holiday',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteCustomHoliday = async (date, name) => {
    try {
      await axios.delete(`/api/holidays/custom/${date}/${encodeURIComponent(name)}`);
      
      toast({
        title: 'Success',
        description: 'Custom holiday deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchCustomHolidays();
    } catch (error) {
      console.error('Error deleting custom holiday:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete custom holiday',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateSettings = async (updatedSettings) => {
    try {
      await axios.put('/api/holidays/settings', updatedSettings);
      
      toast({
        title: 'Success',
        description: 'Holiday settings updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleYearChange = (direction) => {
    setSelectedYear(prev => prev + direction);
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel>Federal Holidays ({selectedYear})</StatLabel>
              <StatNumber>{holidays.length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel>Custom Holidays</StatLabel>
              <StatNumber>{customHolidays.length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel>Holiday Checking</StatLabel>
              <StatNumber>
                <Badge colorScheme={settings?.enableHolidayChecking ? 'green' : 'gray'}>
                  {settings?.enableHolidayChecking ? 'Enabled' : 'Disabled'}
                </Badge>
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Settings Alert */}
      {settings && !settings.enableHolidayChecking && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Holiday checking is currently disabled. Recurring trips will not skip holidays automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Federal Holidays Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack>
              <CalendarIcon style={{ width: '24px', height: '24px' }} />
              <Heading size="md">US Federal Holidays</Heading>
            </HStack>
            <HStack>
              <Button size="sm" onClick={() => handleYearChange(-1)}>Previous Year</Button>
              <Text fontWeight="bold">{selectedYear}</Text>
              <Button size="sm" onClick={() => handleYearChange(1)}>Next Year</Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Holiday</Th>
                  <Th>Date</Th>
                  <Th>Day of Week</Th>
                </Tr>
              </Thead>
              <Tbody>
                {holidays.map((holiday, index) => (
                  <Tr key={index}>
                    <Td fontWeight="medium">{holiday.name}</Td>
                    <Td>{holiday.date}</Td>
                    <Td>
                      <Badge colorScheme={holiday.dayOfWeek === 'Saturday' || holiday.dayOfWeek === 'Sunday' ? 'blue' : 'gray'}>
                        {holiday.dayOfWeek}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Custom Holidays Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack>
              <CalendarIcon style={{ width: '24px', height: '24px' }} />
              <Heading size="md">Custom Holidays</Heading>
            </HStack>
            <Button
              leftIcon={<PlusIcon style={{ width: '20px', height: '20px' }} />}
              colorScheme="brand"
              size="sm"
              onClick={onAddOpen}
            >
              Add Custom Holiday
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {customHolidays.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={4}>
              No custom holidays added yet
            </Text>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Holiday</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customHolidays.map((holiday, index) => (
                    <Tr key={index}>
                      <Td fontWeight="medium">{holiday.name}</Td>
                      <Td>{holiday.date}</Td>
                      <Td>{holiday.description || '-'}</Td>
                      <Td>
                        <IconButton
                          icon={<TrashIcon style={{ width: '16px', height: '16px' }} />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteCustomHoliday(holiday.date, holiday.name)}
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

      {/* Settings Card */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack>
              <Cog6ToothIcon style={{ width: '24px', height: '24px' }} />
              <Heading size="md">Holiday Settings</Heading>
            </HStack>
            <Button size="sm" onClick={onSettingsOpen}>
              Edit Settings
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          {settings && (
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text>Enable Holiday Checking</Text>
                <Badge colorScheme={settings.enableHolidayChecking ? 'green' : 'gray'}>
                  {settings.enableHolidayChecking ? 'Enabled' : 'Disabled'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Include Federal Holidays</Text>
                <Badge colorScheme={settings.includeFederalHolidays ? 'green' : 'gray'}>
                  {settings.includeFederalHolidays ? 'Yes' : 'No'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Skip Holiday Trips</Text>
                <Badge colorScheme={settings.skipHolidayTrips ? 'green' : 'gray'}>
                  {settings.skipHolidayTrips ? 'Yes' : 'No'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Reschedule to Next Day</Text>
                <Badge colorScheme={settings.rescheduleToNextDay ? 'green' : 'gray'}>
                  {settings.rescheduleToNextDay ? 'Yes' : 'No'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Treat Weekends as Holidays</Text>
                <Badge colorScheme={settings.treatWeekendsAsHolidays ? 'green' : 'gray'}>
                  {settings.treatWeekendsAsHolidays ? 'Yes' : 'No'}
                </Badge>
              </HStack>
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Add Custom Holiday Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Custom Holiday</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Holiday Name</FormLabel>
                <Input
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  placeholder="e.g., Company Anniversary"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description (Optional)</FormLabel>
                <Textarea
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                  placeholder="Additional details about this holiday"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleAddCustomHoliday}>
              Add Holiday
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Holiday Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {settings && (
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Enable Holiday Checking</FormLabel>
                  <Switch
                    isChecked={settings.enableHolidayChecking}
                    onChange={(e) => setSettings({ ...settings, enableHolidayChecking: e.target.checked })}
                  />
                </FormControl>
                <Divider />
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Include Federal Holidays</FormLabel>
                  <Switch
                    isChecked={settings.includeFederalHolidays}
                    onChange={(e) => setSettings({ ...settings, includeFederalHolidays: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Skip Holiday Trips</FormLabel>
                  <Switch
                    isChecked={settings.skipHolidayTrips}
                    onChange={(e) => setSettings({ ...settings, skipHolidayTrips: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Reschedule to Next Day</FormLabel>
                  <Switch
                    isChecked={settings.rescheduleToNextDay}
                    onChange={(e) => setSettings({ ...settings, rescheduleToNextDay: e.target.checked })}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Treat Weekends as Holidays</FormLabel>
                  <Switch
                    isChecked={settings.treatWeekendsAsHolidays}
                    onChange={(e) => setSettings({ ...settings, treatWeekendsAsHolidays: e.target.checked })}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => {
                handleUpdateSettings(settings);
                onSettingsClose();
              }}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HolidayManagement;
