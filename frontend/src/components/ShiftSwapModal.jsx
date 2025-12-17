import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Text,
  Heading,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  useColorModeValue,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';

const ShiftSwapModal = ({
  isOpen,
  onClose,
  requestingDriver,
  targetDriver,
  originalShift,
  proposedShift,
  swapType = 'one-way',
  onSubmit,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [selectedSwapType, setSelectedSwapType] = useState(swapType);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return Math.round(ms / (1000 * 60 * 60)); // hours
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        reason,
        swapType: selectedSwapType
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Request Shift Swap</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Swap Type Selection */}
            <FormControl>
              <FormLabel fontWeight="bold">Swap Type</FormLabel>
              <Select
                value={selectedSwapType}
                onChange={(e) => setSelectedSwapType(e.target.value)}
                isDisabled={isLoading}
              >
                <option value="one-way">One-way (You take their shift)</option>
                <option value="mutual">Mutual (Shift exchange)</option>
                <option value="cover">Cover Request (Someone covers your shift)</option>
              </Select>
            </FormControl>

            <Divider />

            {/* Shift Information */}
            <VStack spacing={3} align="stretch">
              <Heading size="sm">Shift Details</Heading>
              
              {/* Your Shift */}
              <Card bg={cardBgColor}>
                <CardHeader pb={2}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Your Shift</Text>
                    {requestingDriver && (
                      <Badge colorScheme="blue">{requestingDriver.firstName} {requestingDriver.lastName}</Badge>
                    )}
                  </HStack>
                </CardHeader>
                <CardBody pt={2}>
                  {originalShift ? (
                    <TableContainer>
                      <Table size="sm">
                        <Tbody>
                          <Tr>
                            <Td fontWeight="bold" width="40%">Start Time</Td>
                            <Td>{formatDateTime(originalShift.startTime)}</Td>
                          </Tr>
                          <Tr>
                            <Td fontWeight="bold">Duration</Td>
                            <Td>
                              {calculateDuration(originalShift.startTime, originalShift.endTime)} hours
                            </Td>
                          </Tr>
                          <Tr>
                            <Td fontWeight="bold">Status</Td>
                            <Td>
                              <Badge colorScheme="blue" variant="subtle">
                                {originalShift.status}
                              </Badge>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text color="gray.500">No shift information available</Text>
                  )}
                </CardBody>
              </Card>

              {/* Their Shift (for mutual swaps) */}
              {selectedSwapType === 'mutual' && proposedShift && (
                <Card bg={cardBgColor}>
                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Their Shift</Text>
                      {targetDriver && (
                        <Badge colorScheme="purple">{targetDriver.firstName} {targetDriver.lastName}</Badge>
                      )}
                    </HStack>
                  </CardHeader>
                  <CardBody pt={2}>
                    <TableContainer>
                      <Table size="sm">
                        <Tbody>
                          <Tr>
                            <Td fontWeight="bold" width="40%">Start Time</Td>
                            <Td>{formatDateTime(proposedShift.startTime)}</Td>
                          </Tr>
                          <Tr>
                            <Td fontWeight="bold">Duration</Td>
                            <Td>
                              {calculateDuration(proposedShift.startTime, proposedShift.endTime)} hours
                            </Td>
                          </Tr>
                          <Tr>
                            <Td fontWeight="bold">Status</Td>
                            <Td>
                              <Badge colorScheme="purple" variant="subtle">
                                {proposedShift.status}
                              </Badge>
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>
              )}
            </VStack>

            <Divider />

            {/* Reason */}
            <FormControl>
              <FormLabel fontWeight="bold">Reason for Swap</FormLabel>
              <Textarea
                placeholder="Explain why you want to swap shifts..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                isDisabled={isLoading}
                minH="100px"
              />
            </FormControl>

            {/* Important Notes */}
            <Card bg="blue.50" borderLeft="4px" borderColor="blue.500">
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold" color="blue.700">ℹ️ Important Information</Text>
                  <Text fontSize="sm" color="blue.600">
                    • Your shift swap request will be sent to {targetDriver?.firstName || 'the other driver'} for approval
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Once approved by both parties, a manager must review and confirm the swap
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • You can cancel this request anytime before it's approved
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            leftIcon={<CheckIcon />}
            onClick={handleSubmit}
            isDisabled={!reason.trim()}
            isLoading={isLoading}
          >
            Send Swap Request
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShiftSwapModal;
