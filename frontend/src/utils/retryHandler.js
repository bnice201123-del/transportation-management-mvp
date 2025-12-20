/**
 * Retry Handler Utility
 * Implements exponential backoff with configurable retry logic
 * Used for handling transient network failures and API errors
 */

/**
 * Determine if an error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} - Whether the error should trigger a retry
 */
export const isRetryableError = (error) => {
  // Network errors
  if (error.message === 'Network Error' || 
      error.message === 'Failed to fetch' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP status codes that should be retried
  const retryableStatuses = [429, 502, 503, 504];
  if (error.response?.status && retryableStatuses.includes(error.response.status)) {
    return true;
  }

  return false;
};

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (1-based)
 * @param {number} minDelay - Minimum delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @param {number} multiplier - Exponential multiplier (default: 2)
 * @returns {number} - Delay in milliseconds
 */
export const calculateDelay = (
  attempt,
  minDelay = 1000,
  maxDelay = 30000,
  multiplier = 2
) => {
  // First attempt is immediate (0ms)
  if (attempt <= 1) return 0;

  // Calculate exponential delay: minDelay * (multiplier ^ (attempt - 1))
  const exponentialDelay = minDelay * Math.pow(multiplier, attempt - 2);

  // Add jitter (random ±10% to prevent thundering herd)
  const jitter = exponentialDelay * (0.9 + Math.random() * 0.2);

  // Cap at maxDelay
  return Math.min(jitter, maxDelay);
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Configuration options
 * @returns {Promise} - Result of successful function call
 */
export const retryWithExponentialBackoff = async (
  fn,
  options = {}
) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    onAttempt = null,
    onSuccess = null,
    onFailure = null,
    shouldRetry = isRetryableError,
  } = options;

  let lastError = null;
  let cancelled = false;

  // Create cancel function
  const cancel = () => {
    cancelled = true;
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (cancelled) {
      throw new Error('Retry operation cancelled by user');
    }

    try {
      const result = await fn();
      
      if (onSuccess) {
        onSuccess(result, attempt);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        if (onFailure) {
          onFailure(error, attempt, false);
        }
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxAttempts) {
        if (onFailure) {
          onFailure(error, attempt, true);
        }
        throw error;
      }

      // Calculate delay before next attempt
      const delay = calculateDelay(attempt, initialDelay, maxDelay, multiplier);

      // Notify about retry attempt
      if (onAttempt) {
        onAttempt({
          attempt,
          nextAttempt: attempt + 1,
          maxAttempts,
          delay,
          error,
          cancel,
        });
      }

      // Wait before retrying
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (cancelled) {
      throw new Error('Retry operation cancelled by user');
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Unknown retry error');
};

/**
 * Create a retryable promise wrapper
 * @param {Promise} promise - Promise to wrap
 * @param {Object} options - Configuration options
 * @returns {Promise} - Result or throws error
 */
export const createRetryablePromise = (promise, options = {}) => {
  return retryWithExponentialBackoff(
    () => promise,
    options
  );
};

/**
 * Retry configuration class for managing retry state
 */
export class RetryConfig {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.multiplier = options.multiplier || 2;
    this.onAttempt = options.onAttempt || null;
    this.onSuccess = options.onSuccess || null;
    this.onFailure = options.onFailure || null;
    this.shouldRetry = options.shouldRetry || isRetryableError;
    
    this.currentAttempt = 0;
    this.totalAttempts = 0;
    this.lastError = null;
    this.cancelled = false;
  }

  cancel() {
    this.cancelled = true;
  }

  reset() {
    this.currentAttempt = 0;
    this.cancelled = false;
  }

  getProgress() {
    return {
      currentAttempt: this.currentAttempt,
      maxAttempts: this.maxAttempts,
      progress: (this.currentAttempt / this.maxAttempts) * 100,
      remaining: this.maxAttempts - this.currentAttempt,
    };
  }

  async execute(fn) {
    return retryWithExponentialBackoff(fn, {
      maxAttempts: this.maxAttempts,
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      multiplier: this.multiplier,
      onAttempt: (details) => {
        this.currentAttempt = details.attempt;
        this.totalAttempts = details.maxAttempts;
        if (this.onAttempt) this.onAttempt(details);
      },
      onSuccess: (result) => {
        if (this.onSuccess) this.onSuccess(result);
      },
      onFailure: (error, attempt, exhausted) => {
        this.lastError = error;
        if (this.onFailure) this.onFailure(error, attempt, exhausted);
      },
      shouldRetry: this.shouldRetry,
    });
  }
}

export default {
  isRetryableError,
  calculateDelay,
  retryWithExponentialBackoff,
  createRetryablePromise,
  RetryConfig,
};
