/**
 * API Error Handler
 * Converts API errors to user-friendly messages with retry logic
 */

/**
 * Handle API errors and provide user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - Context/operation name for debugging
 * @returns {Object} - { title, description, status, isRetryable, originalError }
 */
export const handleApiError = (error, context = '') => {
  const statusCode = error.response?.status;
  const errorData = error.response?.data;
  const isNetworkError = !error.response;
  
  // Map specific status codes to user-friendly messages
  const errorMessages = {
    400: errorData?.message || 'Invalid request. Please check your input and try again.',
    401: 'Session expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: errorData?.message || 'This resource already exists.',
    429: 'Too many requests. Please wait a moment before trying again.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable. Please try again.',
    503: 'Service is under maintenance. Please try again soon.',
    504: 'Request timeout. Please try again.',
  };
  
  const userMessage = errorMessages[statusCode] || 
    (isNetworkError 
      ? 'Connection error. Please check your internet connection.' 
      : 'Something went wrong. Please try again.');
  
  const isRetryable = isNetworkError || [429, 502, 503, 504].includes(statusCode);
  
  return {
    title: isNetworkError ? 'Connection Error' : 'Error',
    description: userMessage,
    status: 'error',
    isRetryable,
    context,
    originalError: error,
    statusCode,
  };
};

/**
 * Get specific error message from response data
 * @param {Object} error - The error object
 * @returns {string} - Error message or generic fallback
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred. Please try again.';
};

/**
 * Check if error is a specific type
 * @param {Error} error - The error object
 * @param {number|string} statusCode - Status code to check
 * @returns {boolean}
 */
export const isErrorStatus = (error, statusCode) => {
  return error.response?.status === statusCode;
};

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error.response || error.code === 'ECONNABORTED';
};

/**
 * Check if error should be retried
 * @param {Error} error - The error object
 * @returns {boolean}
 */
export const isRetryableError = (error) => {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return isNetworkError(error) || retryableStatuses.includes(error.response?.status);
};

/**
 * Log error for debugging (production-safe)
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      context,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  
  // In production, could send to error tracking service (Sentry, etc)
  // Example:
  // if (process.env.REACT_APP_SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
};

/**
 * Format validation error messages
 * @param {Object} errors - Error object from validation
 * @returns {string} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
  const errorList = Object.values(errors)
    .filter(Boolean)
    .slice(0, 3); // Show max 3 errors
  
  if (errorList.length === 0) {
    return 'Please fix the errors in your form.';
  }
  
  if (errorList.length === 1) {
    return errorList[0];
  }
  
  return errorList.map((err, i) => `${i + 1}. ${err}`).join('\n');
};

export default {
  handleApiError,
  getErrorMessage,
  isErrorStatus,
  isNetworkError,
  isRetryableError,
  logError,
  formatValidationErrors,
};
