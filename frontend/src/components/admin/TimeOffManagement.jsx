import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  useColorModeValue
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import Navbar from '../shared/Navbar';

const TimeOffManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/work-schedule/time-off/pending');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load pending requests',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReviewRequest = (request) => {
    setSelectedRequest(request);
    setReviewNotes('');
    onOpen();
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await axios.patch(`/api/work-schedule/time-off/${selectedRequest._id}`, {
        status: 'approved',
        reviewNotes
      });

      toast({
        title: 'Success',
        description: 'Time-off request approved',
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onClose();
      fetchPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve request',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;

    if (!reviewNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for denial',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setProcessing(true);
    try {
      await axios.patch(`/api/work-schedule/time-off/${selectedRequest._id}`, {
        status: 'denied',
        reviewNotes
      });

      toast({
        title: 'Success',
        description: 'Time-off request denied',
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onClose();
      fetchPendingRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deny request',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = (startDate, endDate) => {
    const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <>
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Time-Off Requests</Heading>
            <Text color="gray.600">Review and manage employee time-off requests</Text>
          </Box>

          {loading ? (
            <Center py={10}>
              <Spinner size="xl" color="blue.500" />
            </Center>
          ) : requests.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              No pending time-off requests
            </Alert>
          ) : (
            <Card bg={bgColor}>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Employee</Th>
                        <Th>Role</Th>
                        <Th>Dates</Th>
                        <Th>Duration</Th>
                        <Th>Reason</Th>
                        <Th>Requested</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {requests.map((request) => (
                        <Tr key={request._id}>
                          <Td>
                            <HStack spacing={2}>
                              <Box as={UserIcon} w={5} h={5} color="gray.500" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{request.userId?.name}</Text>
                                <Text fontSize="xs" color="gray.500">{request.userId?.email}</Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="purple">
                              {Array.isArray(request.userId?.roles) 
                                ? request.userId.roles.join(', ')
                                : request.userId?.role}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm">{formatDate(request.startDate)}</Text>
                              <Text fontSize="xs" color="gray.500">to</Text>
                              <Text fontSize="sm">{formatDate(request.endDate)}</Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue">
                              {calculateDays(request.startDate, request.endDate)} days
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm" noOfLines={2} maxW="200px">
                              {request.reason || 'No reason provided'}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(request.requestedAt)}
                            </Text>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleReviewRequest(request)}
                            >
                              Review
                            </Button>
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

      {/* Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Review Time-Off Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequest && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg={cardBg} borderRadius="md">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Box as={UserIcon} w={5} h={5} color="blue.500" />
                      <Text fontWeight="bold">{selectedRequest.userId?.name}</Text>
                    </HStack>
                    <HStack>
                      <Box as={CalendarDaysIcon} w={5} h={5} color="blue.500" />
                      <Text>
                        {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                      </Text>
                      <Badge colorScheme="blue">
                        {calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days
                      </Badge>
                    </HStack>
                    {selectedRequest.reason && (
                      <Box>
                        <Text fontWeight="medium" fontSize="sm" color="gray.600">
                          Reason:
                        </Text>
                        <Text>{selectedRequest.reason}</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel>Review Notes (Optional for approval, required for denial)</FormLabel>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                leftIcon={<XCircleIcon className="h-5 w-5" />}
                colorScheme="red"
                onClick={handleDeny}
                isLoading={processing}
              >
                Deny
              </Button>
              <Button
                leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                colorScheme="green"
                onClick={handleApprove}
                isLoading={processing}
              >
                Approve
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TimeOffManagement;
