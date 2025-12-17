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
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
  Select,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  Box
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon } from '@chakra-ui/icons';

const TimeOffRequestModal = ({
  isOpen,
  onClose,
  vacationBalance,
  onSubmit,
  isLoading = false
}) => {
  const [timeOffType, setTimeOffType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('gray.50', 'gray.700');

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays();
  const hasInsufficientBalance = timeOffType === 'vacation' && totalDays > (vacationBalance?.available || 0);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    // If new start date is after current end date, adjust end date
    if (e.target.value > endDate && endDate) {
      setEndDate(e.target.value);
    }
  };

  const handleEndDateChange = (e) => {
    if (e.target.value >= startDate) {
      setEndDate(e.target.value);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        type: timeOffType,
        startDate,
        endDate,
        totalDays,
        reason
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Request Time Off</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Time Off Type */}
            <FormControl>
              <FormLabel fontWeight="bold">Type of Time Off</FormLabel>
              <Select
                value={timeOffType}
                onChange={(e) => setTimeOffType(e.target.value)}
                isDisabled={isLoading}
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Day</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="other">Other</option>
              </Select>
              <FormHelperText>
                {timeOffType === 'vacation' && vacationBalance && (
                  <>
                    Available vacation days: <Badge colorScheme="blue">{vacationBalance.available}</Badge>
                  </>
                )}
                {timeOffType === 'sick' && 'Sick leave may require medical documentation'}
              </FormHelperText>
            </FormControl>

            <Divider />

            {/* Date Range */}
            <HStack spacing={4} align="flex-start">
              <FormControl>
                <FormLabel fontWeight="bold">Start Date</FormLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  isDisabled={isLoading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold">End Date</FormLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  isDisabled={isLoading}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </FormControl>
            </HStack>

            {/* Duration Summary */}
            {totalDays > 0 && (
              <Card bg={cardBgColor}>
                <CardBody>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">Total Duration</Text>
                      <Text color="gray.600">{startDate} to {endDate}</Text>
                    </VStack>
                    <Badge colorScheme="blue" fontSize="lg" px={3} py={1}>
                      {totalDays} day{totalDays !== 1 ? 's' : ''}
                    </Badge>
                  </HStack>
                </CardBody>
              </Card>
            )}

            {/* Vacation Balance Warning */}
            {hasInsufficientBalance && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={0}>
                  <AlertTitle>Insufficient Vacation Balance</AlertTitle>
                  <Text fontSize="sm">
                    You requested {totalDays} days but only have {vacationBalance.available} available.
                    You may submit for approval, but it may be denied.
                  </Text>
                </VStack>
              </Alert>
            )}

            <Divider />

            {/* Reason */}
            <FormControl>
              <FormLabel fontWeight="bold">Reason (Optional)</FormLabel>
              <Textarea
                placeholder="Provide a reason for your time-off request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                isDisabled={isLoading}
                minH="80px"
              />
            </FormControl>

            {/* Important Information */}
            <Card bg="blue.50" borderLeft="4px" borderColor="blue.500">
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold" color="blue.700">ℹ️ Before You Submit</Text>
                  <Text fontSize="sm" color="blue.600">
                    • Requests are reviewed by your manager
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • You'll receive a notification once approved or denied
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Approved vacation days will be deducted from your balance
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    • Requests must be submitted at least 2 weeks in advance when possible
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
            isDisabled={!startDate || !endDate}
            isLoading={isLoading}
          >
            Submit Request
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TimeOffRequestModal;
