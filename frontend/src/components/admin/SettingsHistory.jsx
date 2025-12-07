import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Input,
  Select,
  Flex,
  IconButton,
  Tooltip,
  useColorModeValue,
  Spinner,
  Center,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code,
  Divider,
  Avatar,
  Tag,
  TagLabel,
  TagLeftIcon,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  SearchIcon,
  TimeIcon,
  RepeatIcon,
  InfoIcon,
  CheckIcon,
  WarningIcon
} from '@chakra-ui/icons';
import { FaHistory, FaUser, FaClock, FaEdit } from 'react-icons/fa';
import axios from '../../config/axios';
import { format } from 'date-fns';

const SettingsHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedChange, setSelectedChange] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings/history');
      setHistory(response.data.history || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load settings history',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (change) => {
    setSelectedChange(change);
    onOpen();
  };

  const handleRevert = async (changeId) => {
    try {
      await axios.post(`/api/settings/history/${changeId}/revert`);
      toast({
        title: 'Success',
        description: 'Setting reverted successfully',
        status: 'success',
        duration: 3000,
      });
      fetchHistory();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to revert setting',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getFilteredHistory = () => {
    return history.filter(item => {
      // Search filter
      const searchMatch = 
        item.settingKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.changedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const categoryMatch = 
        categoryFilter === 'all' || item.category === categoryFilter;

      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'all') {
        const changeDate = new Date(item.changedAt);
        const now = new Date();
        const diffDays = Math.floor((now - changeDate) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            dateMatch = diffDays === 0;
            break;
          case 'week':
            dateMatch = diffDays <= 7;
            break;
          case 'month':
            dateMatch = diffDays <= 30;
            break;
          default:
            dateMatch = true;
        }
      }

      return searchMatch && categoryMatch && dateMatch;
    });
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getCategoryColor = (category) => {
    const colors = {
      system: 'blue',
      security: 'red',
      notifications: 'purple',
      maps: 'green',
      business: 'orange',
      integration: 'cyan',
      default: 'gray'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  const filteredHistory = getFilteredHistory();

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
      <CardHeader>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box
                p={2}
                bg="purple.500"
                borderRadius="lg"
                color="white"
              >
                <FaHistory size={20} />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="md">Settings Change History</Heading>
                <Text fontSize="sm" color={mutedColor}>
                  Track all changes to system settings
                </Text>
              </VStack>
            </HStack>
            <Button
              leftIcon={<RepeatIcon />}
              size="sm"
              colorScheme="blue"
              onClick={fetchHistory}
              isLoading={loading}
            >
              Refresh
            </Button>
          </HStack>

          {/* Filters */}
          <Flex gap={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Select
              maxW="200px"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="notifications">Notifications</option>
              <option value="maps">Maps & GPS</option>
              <option value="business">Business</option>
              <option value="integration">Integration</option>
            </Select>

            <Select
              maxW="200px"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </Select>

            <Badge colorScheme="blue" alignSelf="center" px={3} py={1}>
              {filteredHistory.length} changes
            </Badge>
          </Flex>
        </VStack>
      </CardHeader>

      <CardBody>
        {filteredHistory.length === 0 ? (
          <Center py={10}>
            <VStack spacing={3}>
              <InfoIcon boxSize={10} color="gray.400" />
              <Text color={mutedColor}>No changes found</Text>
              {(searchTerm || categoryFilter !== 'all' || dateFilter !== 'all') && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </VStack>
          </Center>
        ) : (
          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Timestamp</Th>
                  <Th>Category</Th>
                  <Th>Setting</Th>
                  <Th>Changed By</Th>
                  <Th>Old Value</Th>
                  <Th>New Value</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredHistory.map((item) => (
                  <Tr
                    key={item._id}
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {format(new Date(item.changedAt), 'MMM dd, yyyy')}
                        </Text>
                        <Text fontSize="xs" color={mutedColor}>
                          {format(new Date(item.changedAt), 'hh:mm a')}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontWeight="medium">
                        {item.settingKey}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Avatar size="xs" name={item.changedBy?.name} />
                        <Text fontSize="sm">{item.changedBy?.name || 'Unknown'}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Code fontSize="xs" colorScheme="red">
                        {String(item.oldValue).substring(0, 20)}
                        {String(item.oldValue).length > 20 ? '...' : ''}
                      </Code>
                    </Td>
                    <Td>
                      <Code fontSize="xs" colorScheme="green">
                        {String(item.newValue).substring(0, 20)}
                        {String(item.newValue).length > 20 ? '...' : ''}
                      </Code>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Tooltip label="View Details">
                          <IconButton
                            icon={<InfoIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(item);
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Revert Change">
                          <IconButton
                            icon={<RepeatIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="orange"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevert(item._id);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </CardBody>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Setting Change Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedChange && (
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Tag size="lg" colorScheme={getCategoryColor(selectedChange.category)}>
                    <TagLeftIcon as={FaEdit} />
                    <TagLabel>{selectedChange.category}</TagLabel>
                  </Tag>
                  <Text fontSize="sm" color={mutedColor}>
                    {format(new Date(selectedChange.changedAt), 'PPpp')}
                  </Text>
                </HStack>

                <Divider />

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Setting Key</Text>
                  <Code p={2} borderRadius="md" w="full" display="block">
                    {selectedChange.settingKey}
                  </Code>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>Changed By</Text>
                  <HStack>
                    <Avatar size="sm" name={selectedChange.changedBy?.name} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {selectedChange.changedBy?.name}
                      </Text>
                      <Text fontSize="xs" color={mutedColor}>
                        {selectedChange.changedBy?.email}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2} color="red.500">
                    Old Value
                  </Text>
                  <Code
                    p={3}
                    borderRadius="md"
                    w="full"
                    display="block"
                    whiteSpace="pre-wrap"
                    bg="red.50"
                    borderLeft="4px"
                    borderColor="red.500"
                  >
                    {formatValue(selectedChange.oldValue)}
                  </Code>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2} color="green.500">
                    New Value
                  </Text>
                  <Code
                    p={3}
                    borderRadius="md"
                    w="full"
                    display="block"
                    whiteSpace="pre-wrap"
                    bg="green.50"
                    borderLeft="4px"
                    borderColor="green.500"
                  >
                    {formatValue(selectedChange.newValue)}
                  </Code>
                </Box>

                {selectedChange.reason && (
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Reason</Text>
                    <Text fontSize="sm" p={3} bg={hoverBg} borderRadius="md">
                      {selectedChange.reason}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="orange"
              leftIcon={<RepeatIcon />}
              onClick={() => handleRevert(selectedChange._id)}
            >
              Revert This Change
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default SettingsHistory;
