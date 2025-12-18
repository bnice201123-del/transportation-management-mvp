import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  VStack,
  HStack,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  useDisclosure,
  Badge,
  Spinner,
  Center,
  Text,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle
} from '@chakra-ui/react';
import { ChevronDownIcon, EditIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Navbar from "./shared/Navbar";

const ScheduleTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose
  } = useDisclosure();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();

  const {
    isOpen: isApplyOpen,
    onOpen: onApplyOpen,
    onClose: onApplyClose
  } = useDisclosure();

  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose
  } = useDisclosure();

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/schedules/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTemplates(response.data);
    } catch (err) {
      toast({
        title: 'Error fetching templates',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await axios.delete(`/api/schedules/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: 'Template deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      fetchTemplates();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleCloneTemplate = async (templateId) => {
    try {
      await axios.post(
        `/api/schedules/templates/${templateId}/clone`,
        { name: `${selectedTemplate?.name} (Copy)` },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast({
        title: 'Success',
        description: 'Template cloned',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      fetchTemplates();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'weekly': 'blue',
      'monthly': 'green',
      'seasonal': 'orange',
      'custom': 'purple',
      'shift': 'cyan'
    };
    return colors[category] || 'gray';
  };

  const filteredTemplates = templates.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterActive === 'active' && !t.isActive) return false;
    if (filterActive === 'inactive' && t.isActive) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="lg">Schedule Templates</Heading>
              <Text color="gray.500" mt={1}>Create and manage shift patterns</Text>
            </Box>
            <Button
              colorScheme="green"
              leftIcon={<AddIcon />}
              onClick={onCreateOpen}
            >
              New Template
            </Button>
          </HStack>

          {/* Filters */}
          <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <HStack spacing={4}>
                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Category</FormLabel>
                  <Select
                    placeholder="All Categories"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="custom">Custom</option>
                    <option value="shift">Shift</option>
                  </Select>
                </FormControl>

                <FormControl maxW="200px">
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select
                    placeholder="All Status"
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </FormControl>

                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterCategory('');
                    setFilterActive('');
                  }}
                  mt={6}
                >
                  Clear Filters
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Templates List */}
          {loading ? (
            <Center minH="400px">
              <Spinner size="lg" />
            </Center>
          ) : filteredTemplates.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>No templates found</AlertTitle>
                <Text fontSize="sm">Create your first template to get started</Text>
              </Box>
            </Alert>
          ) : (
            <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
              <CardHeader borderBottomWidth={1} borderColor={borderColor}>
                <Heading size="md">Templates ({filteredTemplates.length})</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Category</Th>
                        <Th>Description</Th>
                        <Th>Status</Th>
                        <Th>Usage</Th>
                        <Th>Created</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredTemplates.map((template) => (
                        <Tr key={template._id} _hover={{ bg: hoverBg }}>
                          <Td fontWeight="bold">{template.name}</Td>
                          <Td>
                            <Badge colorScheme={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </Td>
                          <Td fontSize="sm">{template.description || '—'}</Td>
                          <Td>
                            <Badge colorScheme={template.isActive ? 'green' : 'red'}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                          <Td>{template.usageCount || 0} times</Td>
                          <Td fontSize="sm">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<ChevronDownIcon />}
                                variant="outline"
                                size="sm"
                              />
                              <MenuList>
                                <MenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    onEditOpen();
                                  }}
                                  icon={<EditIcon />}
                                >
                                  Edit
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    onPreviewOpen();
                                  }}
                                >
                                  Preview
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    onApplyOpen();
                                  }}
                                >
                                  Apply
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    handleCloneTemplate(template._id);
                                  }}
                                  icon={<CopyIcon />}
                                >
                                  Clone
                                </MenuItem>
                                <MenuItem
                                  onClick={() => handleDeleteTemplate(template._id)}
                                  icon={<DeleteIcon />}
                                  color="red.500"
                                >
                                  Delete
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>

      {/* Create/Edit Template Modal */}
      <TemplateEditorModal
        isOpen={isCreateOpen || isEditOpen}
        onClose={isCreateOpen ? onCreateClose : onEditClose}
        template={selectedTemplate}
        onSave={() => {
          fetchTemplates();
          if (isCreateOpen) onCreateClose();
          if (isEditOpen) onEditClose();
          setSelectedTemplate(null);
        }}
      />

      {/* Apply Template Modal */}
      <ApplyTemplateModal
        isOpen={isApplyOpen}
        onClose={onApplyClose}
        template={selectedTemplate}
        onApply={() => {
          fetchTemplates();
          onApplyClose();
          setSelectedTemplate(null);
        }}
      />

      {/* Preview Modal */}
      <PreviewTemplateModal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        template={selectedTemplate}
      />
    </>
  );
};

// Template Editor Modal
const TemplateEditorModal = ({ isOpen, onClose, template, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    notes: '',
    pattern: {
      monday: { enabled: true, shifts: [] },
      tuesday: { enabled: true, shifts: [] },
      wednesday: { enabled: true, shifts: [] },
      thursday: { enabled: true, shifts: [] },
      friday: { enabled: true, shifts: [] },
      saturday: { enabled: false, shifts: [] },
      sunday: { enabled: false, shifts: [] }
    }
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template, isOpen]);

  const handleAddShift = (dayName) => {
    const newPattern = { ...formData.pattern };
    if (!newPattern[dayName].shifts) {
      newPattern[dayName].shifts = [];
    }
    newPattern[dayName].shifts.push({
      startTime: '09:00',
      endTime: '17:00',
      shiftType: 'standard',
      breaks: []
    });
    setFormData({ ...formData, pattern: newPattern });
  };

  const handleRemoveShift = (dayName, index) => {
    const newPattern = { ...formData.pattern };
    newPattern[dayName].shifts.splice(index, 1);
    setFormData({ ...formData, pattern: newPattern });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.name) {
        toast({
          title: 'Validation Error',
          description: 'Template name is required',
          status: 'error',
          duration: 3000
        });
        return;
      }

      const url = template?._id
        ? `/api/schedules/templates/${template._id}`
        : '/api/schedules/templates';

      const method = template ? 'put' : 'post';

      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: `Template ${template ? 'updated' : 'created'}`,
        status: 'success',
        duration: 3000
      });

      onSave();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{template ? 'Edit' : 'Create'} Template</ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH="80vh" overflowY="auto">
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Template Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard 40-Hour Week"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="seasonal">Seasonal</option>
                <option value="custom">Custom</option>
                <option value="shift">Shift</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this template"
                rows={3}
              />
            </FormControl>

            {/* Weekly Pattern */}
            <Box w="full">
              <Heading size="sm" mb={3}>Weekly Pattern</Heading>
              {Object.entries(formData.pattern).map(([day, dayData]) => (
                <Card key={day} mb={3} variant="outline">
                  <CardBody>
                    <HStack mb={2} justify="space-between">
                      <HStack>
                        <Checkbox
                          isChecked={dayData.enabled}
                          onChange={(e) => {
                            const newPattern = { ...formData.pattern };
                            newPattern[day].enabled = e.target.checked;
                            setFormData({ ...formData, pattern: newPattern });
                          }}
                        />
                        <Text fontWeight="bold" textTransform="capitalize">{day}</Text>
                      </HStack>
                      {dayData.enabled && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleAddShift(day)}
                        >
                          Add Shift
                        </Button>
                      )}
                    </HStack>

                    {dayData.enabled && dayData.shifts && dayData.shifts.map((shift, idx) => (
                      <HStack key={idx} mb={2} spacing={2}>
                        <Input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => {
                            const newPattern = { ...formData.pattern };
                            newPattern[day].shifts[idx].startTime = e.target.value;
                            setFormData({ ...formData, pattern: newPattern });
                          }}
                          w="100px"
                        />
                        <Text>to</Text>
                        <Input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => {
                            const newPattern = { ...formData.pattern };
                            newPattern[day].shifts[idx].endTime = e.target.value;
                            setFormData({ ...formData, pattern: newPattern });
                          }}
                          w="100px"
                        />
                        <Select
                          value={shift.shiftType}
                          onChange={(e) => {
                            const newPattern = { ...formData.pattern };
                            newPattern[day].shifts[idx].shiftType = e.target.value;
                            setFormData({ ...formData, pattern: newPattern });
                          }}
                          w="120px"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                          <option value="standard">Standard</option>
                        </Select>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleRemoveShift(day, idx)}
                        >
                          Remove
                        </Button>
                      </HStack>
                    ))}
                  </CardBody>
                </Card>
              ))}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="green"
              onClick={handleSave}
              isLoading={loading}
            >
              Save Template
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Apply Template Modal
const ApplyTemplateModal = ({ isOpen, onClose, template, onApply }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDrivers, setFetchingDrivers] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setEndDate(nextMonth.toISOString().split('T')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchDrivers = async () => {
    try {
      setFetchingDrivers(true);
      const response = await axios.get('/api/users?role=driver&limit=500', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDrivers(response.data.data?.users || response.data.users || []);
    } catch (err) {
      toast({
        title: 'Error fetching drivers',
        description: err.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setFetchingDrivers(false);
    }
  };

  const handleApply = async () => {
    try {
      if (!selectedDrivers.length) {
        toast({
          title: 'Validation Error',
          description: 'Select at least one driver',
          status: 'error',
          duration: 3000
        });
        return;
      }

      if (!startDate || !endDate) {
        toast({
          title: 'Validation Error',
          description: 'Select date range',
          status: 'error',
          duration: 3000
        });
        return;
      }

      setLoading(true);

      const response = await axios.post(
        `/api/schedules/templates/${template._id}/apply`,
        {
          driverIds: selectedDrivers,
          startDate,
          endDate,
          overwriteExisting: false
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast({
        title: 'Success',
        description: `Created ${response.data.createdCount} schedules`,
        status: 'success',
        duration: 3000
      });

      onApply();
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || err.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Apply Template: {template?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Select Drivers</FormLabel>
              {fetchingDrivers ? (
                <Spinner />
              ) : (
                <Box
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  maxH="300px"
                  overflowY="auto"
                  p={2}
                >
                  {drivers.map((driver) => (
                    <HStack
                      key={driver._id}
                      p={2}
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => {
                        setSelectedDrivers(prev =>
                          prev.includes(driver._id)
                            ? prev.filter(id => id !== driver._id)
                            : [...prev, driver._id]
                        );
                      }}
                      cursor="pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDrivers.includes(driver._id)}
                        onChange={() => {}}
                      />
                      <Text>{driver.firstName} {driver.lastName}</Text>
                    </HStack>
                  ))}
                </Box>
              )}
              <Text fontSize="sm" color="gray.500" mt={1}>
                Selected: {selectedDrivers.length} drivers
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormControl>

            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                This will create schedules for all selected drivers based on the template pattern for the selected date range.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="green"
              onClick={handleApply}
              isLoading={loading}
            >
              Apply Template
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Preview Template Modal
const PreviewTemplateModal = ({ isOpen, onClose, template }) => {
  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Preview: {template.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold">Category</Text>
              <Badge>{template.category}</Badge>
            </Box>

            <Box>
              <Text fontWeight="bold">Description</Text>
              <Text>{template.description || '—'}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold">Weekly Pattern</Text>
              <SimpleGrid columns={2} spacing={3} mt={2}>
                {Object.entries(template.pattern || {}).map(([day, dayData]) => (
                  <Card key={day} variant="outline">
                    <CardBody p={3}>
                      <Text fontWeight="bold" textTransform="capitalize" mb={2}>
                        {day}
                      </Text>
                      {dayData.enabled ? (
                        dayData.shifts && dayData.shifts.map((shift, idx) => (
                          <Text key={idx} fontSize="sm">
                            {shift.startTime} - {shift.endTime} ({shift.shiftType})
                          </Text>
                        ))
                      ) : (
                        <Text fontSize="sm" color="gray.500">Off</Text>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>

            {template.notes && (
              <Box>
                <Text fontWeight="bold">Notes</Text>
                <Text>{template.notes}</Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Simple Checkbox component for driver selection
const Checkbox = ({ isChecked, onChange }) => (
  <input
    type="checkbox"
    checked={isChecked}
    onChange={onChange}
    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
  />
);

export default ScheduleTemplates;
