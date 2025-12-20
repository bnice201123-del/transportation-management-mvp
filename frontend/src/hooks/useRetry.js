import { useState, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { retryWithExponentialBackoff, isRetryableError } from '../utils/retryHandler';

/**
 * Hook for using retry logic with exponential backoff
 * Tracks retry state and provides methods for retrying operations
 */
export const useRetry = (options = {}) => {
  const toast = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    showNotifications = true,
    onSuccess = null,
    onFailure = null,
  } = options;

  const executeWithRetry = useCallback(
    async (asyncFn, operationName = 'Operation') => {
      setIsRetrying(true);
      setLastError(null);

      try {
        const result = await retryWithExponentialBackoff(asyncFn, {
          maxAttempts,
          initialDelay,
          maxDelay,
          multiplier,
          onAttempt: ({ attempt, nextAttempt, delay }) => {
            setRetryCount(attempt);

            if (showNotifications && attempt > 1) {
              toast({
                title: `Retrying (Attempt ${attempt}/${maxAttempts})`,
                description: `Next retry in ${Math.round(delay / 1000)}s...`,
                status: 'warning',
                duration: null,
                isClosable: true,
                position: 'bottom-right',
              });
            }
          },
          onSuccess: (result) => {
            setIsRetrying(false);
            setRetryCount(0);

            if (showNotifications) {
              toast({
                title: `${operationName} Successful`,
                description: 'Your request was completed successfully',
                status: 'success',
                duration: 3,
                isClosable: true,
              });
            }

            if (onSuccess) {
              onSuccess(result);
            }

            return result;
          },
          onFailure: (error, attempt, exhausted) => {
            setIsRetrying(false);
            setLastError(error);

            if (showNotifications && exhausted) {
              toast({
                title: `${operationName} Failed`,
                description: `Failed after ${maxAttempts} attempts. Please try again later.`,
                status: 'error',
                duration: 5,
                isClosable: true,
              });
            }

            if (onFailure) {
              onFailure(error, attempt, exhausted);
            }

            throw error;
          },
          shouldRetry: isRetryableError,
        });

        return result;
      } catch (error) {
        setIsRetrying(false);
        setLastError(error);
        throw error;
      }
    },
    [
      maxAttempts,
      initialDelay,
      maxDelay,
      multiplier,
      showNotifications,
      onSuccess,
      onFailure,
      toast,
    ]
  );

  const retry = useCallback(
    (asyncFn, operationName) => {
      return executeWithRetry(asyncFn, operationName);
    },
    [executeWithRetry]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRetrying(false);
  }, []);

  return {
    executeWithRetry,
    retry,
    cancel,
    isRetrying,
    retryCount,
    lastError,
  };
};

/**
 * Hook for managing async operations with retry support
 */
export const useAsync = (asyncFn, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const retryUtil = useRetry({
    ...options,
    onSuccess: (result) => {
      setData(result);
      if (options.onSuccess) options.onSuccess(result);
    },
    onFailure: (err) => {
      setError(err);
      if (options.onFailure) options.onFailure(err);
    },
  });

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await retryUtil.retry(
          () => asyncFn(...args),
          options.operationName || 'Operation'
        );
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, retryUtil, options]
  );

  return {
    data,
    error,
    isLoading,
    execute,
    ...retryUtil,
  };
};

export default { useRetry, useAsync };
