import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Textarea
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiChevronUp,
  FiEye,
  FiTrash2
} from 'react-icons/fi';
import axios from 'axios';

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const toast = useToast();
  const cancelRef = React.useRef();

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/approvals/queue', {
        params: {
          status: statusFilter || undefined,
          approvalType: typeFilter || undefined,
          priority: priorityFilter || undefined,
          page,
          limit: 15,
          sortBy
        }
      });

      setApprovals(response.data.data || []);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch approvals',
        status: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter, page, sortBy, toast]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/approvals/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    fetchStats();
  }, [fetchApprovals, fetchStats]);

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      await axios.post(`/api/approvals/${selectedApproval._id}/approve`, {
        approvalNotes
      });

      toast({
        title: 'Success',
        description: 'Approval request approved',
        status: 'success',
        duration: 3000
      });

      onApproveClose();
      setApprovalNotes('');
      fetchApprovals();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve request',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        status: 'error',
        duration: 3000
      });
      return;
    }

    try {
      await axios.post(`/api/approvals/${selectedApproval._id}/reject`, {
        rejectionReason
      });

      toast({
        title: 'Success',
        description: 'Approval request rejected',
        status: 'success',
        duration: 3000
      });

      onRejectClose();
      setRejectionReason('');
      fetchApprovals();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject request',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedApproval) return;

    try {
      await axios.delete(`/api/approvals/${selectedApproval._id}`);

      toast({
        title: 'Success',
        description: 'Approval request deleted',
        status: 'success',
        duration: 3000
      });

      onDeleteClose();
      fetchApprovals();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete request',
        status: 'error',
        duration: 5000
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'withdrawn': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      conflict_override: 'Conflict Override',
      schedule_exception: 'Schedule Exception',
      high_cost: 'High Cost',
      policy_exception: 'Policy Exception',
      manual_request: 'Manual Request'
    };
    return labels[type] || type;
  };

  return (
    <Box w="full">
      {/* Statistics Cards */}
      {stats && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }} gap={4} mb={6}>
          <Card bg="yellow.50" borderLeft="4px" borderColor="yellow.400">
            <CardBody>
              <VStack align="flex-start">
                <Text fontSize="sm" color="gray.600" fontWeight="600">
                  Pending
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.700">
                  {stats.totalPending}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="blue.50" borderLeft="4px" borderColor="blue.400">
            <CardBody>
              <VStack align="flex-start">
                <Text fontSize="sm" color="gray.600" fontWeight="600">
                  Overdue
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                  {stats.overdue}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="green.50" borderLeft="4px" borderColor="green.400">
            <CardBody>
              <VStack align="flex-start">
                <Text fontSize="sm" color="gray.600" fontWeight="600">
                  Approved
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.700">
                  {stats.totalApproved}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="red.50" borderLeft="4px" borderColor="red.400">
            <CardBody>
              <VStack align="flex-start">
                <Text fontSize="sm" color="gray.600" fontWeight="600">
                  Rejected
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.700">
                  {stats.totalRejected}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="purple.50" borderLeft="4px" borderColor="purple.400">
            <CardBody>
              <VStack align="flex-start">
                <Text fontSize="sm" color="gray.600" fontWeight="600">
                  Escalated
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.700">
                  {stats.escalated}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Grid>
      )}

      {/* Filters and Search */}
      <Card mb={6}>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Search */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by trip ID or requester name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            {/* Filters */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
              <Select
                placeholder="All Statuses"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </Select>

              <Select
                placeholder="All Types"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="conflict_override">Conflict Override</option>
                <option value="schedule_exception">Schedule Exception</option>
                <option value="high_cost">High Cost</option>
                <option value="policy_exception">Policy Exception</option>
                <option value="manual_request">Manual Request</option>
              </Select>

              <Select
                placeholder="All Priorities"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>

              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Newest First</option>
                <option value="priority">Priority</option>
                <option value="deadline">Deadline</option>
              </Select>
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      {/* Approval Queue Table */}
      <Card>
        <CardHeader pb={4}>
          <Text fontSize="lg" fontWeight="bold">
            Approval Queue
          </Text>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Center py={10}>
              <Spinner />
            </Center>
          ) : approvals.length === 0 ? (
            <Center py={10}>
              <Text color="gray.500">No approvals found</Text>
            </Center>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Trip ID</Th>
                    <Th>Type</Th>
                    <Th>Requester</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th>Requested</Th>
                    <Th>Time Left</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {approvals.map((approval) => (
                    <Tr key={approval._id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="500">{approval.tripId?.tripId || 'N/A'}</Td>
                      <Td>
                        <Badge variant="subtle" colorScheme="blue">
                          {getTypeLabel(approval.approvalType)}
                        </Badge>
                      </Td>
                      <Td>{approval.requestedBy?.firstName} {approval.requestedBy?.lastName}</Td>
                      <Td>
                        <Badge colorScheme={getPriorityColor(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                      </Td>
                      <Td fontSize="xs">
                        {new Date(approval.requestedAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          {approval.isOverdue && (
                            <Icon as={FiAlertCircle} color="red.500" />
                          )}
                          <Text fontSize="xs">
                            {approval.minutesRemaining ? `${approval.minutesRemaining}m` : '-'}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            leftIcon={<FiEye />}
                            onClick={() => {
                              setSelectedApproval(approval);
                              onDetailOpen();
                            }}
                          >
                            View
                          </Button>
                          {approval.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                                leftIcon={<FiCheck />}
                                onClick={() => {
                                  setSelectedApproval(approval);
                                  onApproveOpen();
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiX />}
                                onClick={() => {
                                  setSelectedApproval(approval);
                                  onRejectOpen();
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" mt={6} gap={2}>
          <Button
            size="sm"
            isDisabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <HStack spacing={1}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={page === p ? 'solid' : 'outline'}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </HStack>
          <Button
            size="sm"
            isDisabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </Flex>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approval Request Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApproval && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Trip ID
                  </Text>
                  <Text>{selectedApproval.tripId?.tripId || 'N/A'}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Approval Type
                  </Text>
                  <Badge colorScheme="blue">{getTypeLabel(selectedApproval.approvalType)}</Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Justification
                  </Text>
                  <Text whiteSpace="pre-wrap">{selectedApproval.justification}</Text>
                </Box>

                {selectedApproval.conflictDetails?.detectedConflicts?.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>
                      Detected Conflicts
                    </Text>
                    {selectedApproval.conflictDetails.detectedConflicts.map((conflict, idx) => (
                      <Card key={idx} size="sm" mb={2} bg="gray.50">
                        <CardBody>
                          <VStack align="flex-start" spacing={1} fontSize="sm">
                            <Text><strong>Driver:</strong> {conflict.driverName}</Text>
                            <Text><strong>Time:</strong> {new Date(conflict.startTime).toLocaleString()} - {new Date(conflict.endTime).toLocaleString()}</Text>
                            <Text><strong>Overlap:</strong> {conflict.overlapMinutes} minutes</Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Box>
                )}

                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Requested By
                  </Text>
                  <Text>{selectedApproval.requestedBy?.firstName} {selectedApproval.requestedBy?.lastName}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                    Status
                  </Text>
                  <Badge colorScheme={getStatusColor(selectedApproval.status)}>
                    {selectedApproval.status}
                  </Badge>
                </Box>

                {selectedApproval.approvalAction?.approvedAt && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Approved By
                    </Text>
                    <Text>{selectedApproval.approvalAction.approvedBy?.firstName} {selectedApproval.approvalAction.approvedBy?.lastName}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(selectedApproval.approvalAction.approvedAt).toLocaleString()}
                    </Text>
                  </Box>
                )}

                {selectedApproval.approvalAction?.rejectedAt && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Rejected By
                    </Text>
                    <Text>{selectedApproval.approvalAction.rejectedBy?.firstName} {selectedApproval.approvalAction.rejectedBy?.lastName}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(selectedApproval.approvalAction.rejectedAt).toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="red.600" mt={2}>
                      <strong>Reason:</strong> {selectedApproval.approvalAction.rejectionReason}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={isApproveOpen} onClose={onApproveClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approve Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Are you sure you want to approve this request?</Text>
              <Textarea
                placeholder="Add optional approval notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApproveClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleApprove}>
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Please provide a reason for rejecting this request:</Text>
              <Textarea
                placeholder="Rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                isRequired
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRejectClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleReject}>
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Alert Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Approval Request
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this approval request? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ApprovalQueue;
