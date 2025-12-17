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
  useColorModeValue,
  Divider,
  Select
} from '@chakra-ui/react';
import { WarningIcon, CheckIcon, TimeIcon } from '@chakra-ui/icons';

const ConflictModal = ({
  isOpen,
  onClose,
  conflicts = [],
  suggestedAlternatives = [],
  onSelectAlternative,
  onOverride,
  isLoadingAlternatives = false
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const severityColors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue'
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') {
      return <WarningIcon color="red.500" />;
    }
    return <TimeIcon color="orange.500" />;
  };

  const handleSelectAlternative = (alternative) => {
    setSelectedAlternative(alternative);
  };

  const handleConfirmAlternative = () => {
    if (selectedAlternative && onSelectAlternative) {
      onSelectAlternative(selectedAlternative);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader display="flex" alignItems="center" gap={2}>
          <WarningIcon color="red.500" />
          <Text>Scheduling Conflicts Detected</Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Conflicts Section */}
            <VStack spacing={3} align="stretch">
              <Heading size="sm" color="red.600">Conflicts Found:</Heading>
              {conflicts.length > 0 ? (
                conflicts.map((conflict, idx) => (
                  <Card key={idx} borderLeft="4px" borderColor={`${severityColors[conflict.severity]}.500`}>
                    <CardHeader pb={2}>
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          {getSeverityIcon(conflict.severity)}
                          <Heading size="xs" textTransform="uppercase">
                            {conflict.type}
                          </Heading>
                        </HStack>
                        <Badge colorScheme={severityColors[conflict.severity]}>
                          {conflict.severity}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm">{conflict.description}</Text>
                        {conflict.suggestedAction && (
                          <Text fontSize="xs" color="gray.600" fontStyle="italic">
                            💡 {conflict.suggestedAction}
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Text color="green.600">✓ No conflicts detected</Text>
              )}
            </VStack>

            <Divider />

            {/* Suggested Alternatives Section */}
            {suggestedAlternatives && suggestedAlternatives.length > 0 && (
              <VStack spacing={3} align="stretch">
                <Heading size="sm" color="blue.600">Suggested Alternative Drivers:</Heading>
                <VStack spacing={2}>
                  {suggestedAlternatives.map((alternative, idx) => (
                    <Card
                      key={idx}
                      cursor="pointer"
                      borderWidth={selectedAlternative?.driverId === alternative.driverId ? '2px' : '1px'}
                      borderColor={selectedAlternative?.driverId === alternative.driverId ? 'blue.500' : 'gray.200'}
                      bg={selectedAlternative?.driverId === alternative.driverId ? 'blue.50' : 'white'}
                      onClick={() => handleSelectAlternative(alternative)}
                      _hover={{ shadow: 'md' }}
                      width="100%"
                    >
                      <CardBody>
                        <VStack align="start" spacing={1}>
                          <HStack justify="space-between" width="100%">
                            <Text fontWeight="bold">
                              {alternative.firstName} {alternative.lastName}
                            </Text>
                            <Badge colorScheme={alternative.conflictCount > 0 ? 'orange' : 'green'}>
                              {alternative.conflictCount > 0 ? `${alternative.conflictCount} conflicts` : 'Available'}
                            </Badge>
                          </HStack>
                          {alternative.availability && (
                            <Text fontSize="xs" color="gray.600">
                              Available: {alternative.availability.availableHours} hours this week
                            </Text>
                          )}
                          {alternative.conflicts && alternative.conflicts.length > 0 && (
                            <Text fontSize="xs" color="orange.600">
                              Minor conflicts: {alternative.conflicts.map(c => c.type).join(', ')}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            )}

            {isLoadingAlternatives && (
              <Text textAlign="center" color="gray.500">Loading alternative drivers...</Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          
          {selectedAlternative && (
            <Button
              colorScheme="blue"
              onClick={handleConfirmAlternative}
              leftIcon={<CheckIcon />}
            >
              Use Alternative Driver
            </Button>
          )}
          
          <Button
            colorScheme="orange"
            variant="outline"
            onClick={() => {
              if (onOverride) onOverride();
              onClose();
            }}
          >
            Override & Continue
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConflictModal;
