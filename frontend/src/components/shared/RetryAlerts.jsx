import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  Progress,
  Text,
  Box,
  Spinner,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

/**
 * Retry Alert Component
 * Displays retry progress with countdown and cancel option
 */
export const RetryAlert = ({
  isVisible,
  attempt,
  maxAttempts,
  delayMs,
  onCancel,
  operationName = 'Operation',
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(delayMs / 1000));

  useEffect(() => {
    if (!isVisible || delayMs <= 0) return;

    setCountdown(Math.ceil(delayMs / 1000));
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, delayMs]);

  if (!isVisible) return null;

  const progress = ((attempt - 1) / maxAttempts) * 100;

  return (
    <Alert
      status="warning"
      variant="left-accent"
      borderRadius="md"
      mb={4}
      alignItems="flex-start"
    >
      <HStack spacing={3} w="full" align="flex-start">
        <Spinner size="sm" mt={1} />
        <Box flex={1}>
          <AlertTitle>
            {operationName} - Retrying ({attempt}/{maxAttempts})
          </AlertTitle>
          <AlertDescription fontSize="sm" mt={2}>
            {countdown > 0
              ? `Retrying in ${countdown} second${countdown !== 1 ? 's' : ''}...`
              : 'Attempting again now...'}
          </AlertDescription>
          <Progress
            value={progress}
            size="sm"
            mt={2}
            mb={2}
            borderRadius="full"
          />
          <Text fontSize="xs" color="gray.600">
            Attempt {attempt} of {maxAttempts}
          </Text>
        </Box>
        {onCancel && (
          <Button
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={onCancel}
            minH="44px"
          >
            Cancel
          </Button>
        )}
      </HStack>
    </Alert>
  );
};

/**
 * Error Recovery Alert Component
 * Displays error with retry button
 */
export const ErrorRecoveryAlert = ({
  isVisible,
  error,
  attempt,
  maxAttempts,
  onRetry,
  onDismiss,
  operationName = 'Operation',
}) => {
  if (!isVisible) return null;

  const hasMoreAttempts = attempt < maxAttempts;
  const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';

  return (
    <Alert
      status="error"
      variant="left-accent"
      borderRadius="md"
      mb={4}
      alignItems="flex-start"
    >
      <HStack spacing={3} w="full" align="flex-start">
        <AlertIcon boxSize={5} mt={1} />
        <Box flex={1}>
          <AlertTitle>{operationName} Failed</AlertTitle>
          <AlertDescription fontSize="sm" mt={2}>
            {errorMessage}
          </AlertDescription>
          {hasMoreAttempts && (
            <Text fontSize="xs" color="gray.600" mt={2}>
              You can retry. {maxAttempts - attempt} attempt{maxAttempts - attempt !== 1 ? 's' : ''} remaining.
            </Text>
          )}
        </Box>
        <HStack spacing={2}>
          {hasMoreAttempts && onRetry && (
            <Button
              size="sm"
              colorScheme="orange"
              onClick={onRetry}
              minH="44px"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              minH="44px"
            >
              <CloseIcon />
            </Button>
          )}
        </HStack>
      </HStack>
    </Alert>
  );
};

/**
 * Success Alert Component
 * Displays success message
 */
export const SuccessAlert = ({
  isVisible,
  message = 'Operation completed successfully',
  onDismiss,
  autoCloseDuration = 3000,
}) => {
  useEffect(() => {
    if (!isVisible || !autoCloseDuration) return;

    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [isVisible, autoCloseDuration, onDismiss]);

  if (!isVisible) return null;

  return (
    <Alert status="success" borderRadius="md" mb={4}>
      <AlertIcon />
      <Box flex={1}>
        <AlertDescription>{message}</AlertDescription>
      </Box>
      {onDismiss && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          minH="44px"
        >
          <CloseIcon />
        </Button>
      )}
    </Alert>
  );
};

export default {
  RetryAlert,
  ErrorRecoveryAlert,
  SuccessAlert,
};
