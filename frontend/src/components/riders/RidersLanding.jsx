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
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  IconButton,
  Flex,
  Spacer,
  Grid,
  GridItem,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import {
  SearchIcon,
  AddIcon,
  EditIcon,
  PhoneIcon,
  EmailIcon,
  CalendarIcon,
  ViewIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const RidersLanding = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'id'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  // Check if modal should open automatically (from sidebar)
  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      onOpen();
    }
  }, [searchParams, onOpen]);

  const fetchRiders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users?role=rider', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRiders(response.data.users);
      setFilteredRiders(response.data.users);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load riders',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleSearch = () => {
    let filtered = riders;

    if (searchTerm.trim()) {
      if (searchType === 'name') {
        filtered = riders.filter(rider =>
          `${rider.firstName} ${rider.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rider.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rider.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else if (searchType === 'id') {
        filtered = riders.filter(rider =>
          rider.riderId.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }

    setFilteredRiders(filtered);
    onClose();
  };

  const handleNewRider = () => {
    onClose();
    navigate('/riders/new');
  };

  const handleViewProfile = (riderId) => {
    navigate(`/riders/${riderId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading riders...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
          <CardBody>
            <VStack align="start" spacing={3}>
              <Heading size="lg" color="blue.700">
                Riders Management
              </Heading>
              <Text color="gray.600">
                Search, view, and manage all registered riders in the system.
              </Text>
              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                onClick={onOpen}
                size="sm"
              >
                Filter Riders
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Riders</StatLabel>
                <StatNumber>{riders.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active This Month</StatLabel>
                <StatNumber>
                  {riders.filter(rider => {
                    const lastTrip = rider.trips?.[rider.trips.length - 1];
                    if (!lastTrip) return false;
                    const lastTripDate = new Date(lastTrip.date);
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return lastTripDate > oneMonthAgo;
                  }).length}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Filtered Results</StatLabel>
                <StatNumber>{filteredRiders.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Riders Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Riders</Heading>
          </CardHeader>
          <CardBody>
            {filteredRiders.length === 0 ? (
              <Center py={8}>
                <VStack spacing={4}>
                  <Text color="gray.500">No riders found matching your criteria.</Text>
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleNewRider}>
                    Add New Rider
                  </Button>
                </VStack>
              </Center>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rider ID</Th>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Last Trip</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRiders.map((rider) => (
                    <Tr key={rider._id}>
                      <Td fontWeight="bold">{rider.riderId}</Td>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={`${rider.firstName} ${rider.lastName}`} />
                          <Text>{rider.firstName} {rider.lastName}</Text>
                        </HStack>
                      </Td>
                      <Td>{rider.phone || 'N/A'}</Td>
                      <Td>
                        {rider.trips && rider.trips.length > 0
                          ? formatDate(rider.trips[rider.trips.length - 1].date)
                          : 'No trips'
                        }
                      </Td>
                      <Td>
                        <Badge colorScheme={rider.isActive ? 'green' : 'gray'}>
                          {rider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            size="sm"
                            icon={<ViewIcon />}
                            onClick={() => handleViewProfile(rider._id)}
                            title="View Profile"
                          />
                          <IconButton
                            size="sm"
                            icon={<EditIcon />}
                            onClick={() => navigate(`/riders/${rider._id}/edit`)}
                            title="Edit Rider"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Filter Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filter Riders</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Search riders by name or ID</Text>

              <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                <option value="name">First or Last Name</option>
                <option value="id">Rider ID</option>
              </Select>

              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder={searchType === 'name' ? 'Enter name...' : 'Enter Rider ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </InputGroup>

              <Text fontSize="sm" color="gray.500">
                {searchType === 'name'
                  ? 'Search by first name, last name, or full name'
                  : 'Search by Rider ID (e.g., Smith1985123)'
                }
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" mr={3} onClick={handleSearch}>
              Search
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="green" onClick={handleNewRider}>
              New Rider
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RidersLanding;