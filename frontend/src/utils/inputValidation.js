/**
 * Input Validation Utilities
 * Provides validation functions and input handlers for enforcing data type constraints
 */

/**
 * Validate and format phone number (digits only, with optional formatting)
 * @param {string} value - The input value
 * @returns {string} - Formatted phone number with only digits
 */
export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits (US phone number)
  const limited = digits.slice(0, 10);
  
  // Format as (XXX) XXX-XXXX
  if (limited.length >= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else if (limited.length >= 3) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else if (limited.length > 0) {
    return `(${limited}`;
  }
  return '';
};

/**
 * Get raw phone number (digits only)
 * @param {string} value - The formatted phone number
 * @returns {string} - Phone number with only digits
 */
export const getRawPhoneNumber = (value) => {
  return value.replace(/\D/g, '');
};

/**
 * Validate phone number
 * @param {string} value - The phone number to validate
 * @returns {boolean} - True if valid (10 digits)
 */
export const isValidPhoneNumber = (value) => {
  const digits = getRawPhoneNumber(value);
  return digits.length === 10;
};

/**
 * Allow only letters and spaces (for names)
 * @param {string} value - The input value
 * @returns {string} - Filtered value with only letters and spaces
 */
export const formatNameInput = (value) => {
  return value.replace(/[^a-zA-Z\s'-]/g, '');
};

/**
 * Allow only alphanumeric characters (for IDs, license plates)
 * @param {string} value - The input value
 * @returns {string} - Filtered value with only alphanumeric characters
 */
export const formatAlphanumeric = (value) => {
  return value.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Allow only alphanumeric with spaces and hyphens (for addresses)
 * @param {string} value - The input value
 * @returns {string} - Filtered value
 */
export const formatAddressInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
};

/**
 * Allow only numbers (for numeric fields)
 * @param {string} value - The input value
 * @returns {string} - Filtered value with only numbers
 */
export const formatNumericInput = (value) => {
  return value.replace(/[^0-9]/g, '');
};

/**
 * Allow only numbers with decimal point (for prices, distances)
 * @param {string} value - The input value
 * @param {number} decimals - Maximum decimal places (default: 2)
 * @returns {string} - Filtered value
 */
export const formatDecimalInput = (value, decimals = 2) => {
  // Remove all except digits and decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (parts.length === 2 && parts[1].length > decimals) {
    cleaned = parts[0] + '.' + parts[1].slice(0, decimals);
  }
  
  return cleaned;
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format VIN (Vehicle Identification Number) - 17 alphanumeric characters
 * @param {string} value - The input value
 * @returns {string} - Formatted VIN (uppercase alphanumeric, max 17 chars)
 */
export const formatVIN = (value) => {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 17);
};

/**
 * Format license plate (uppercase alphanumeric with spaces and hyphens)
 * @param {string} value - The input value
 * @param {number} maxLength - Maximum length (default: 10)
 * @returns {string} - Formatted license plate
 */
export const formatLicensePlate = (value, maxLength = 10) => {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase().slice(0, maxLength);
};

/**
 * Format year (4 digits, range validation)
 * @param {string} value - The input value
 * @returns {string} - Formatted year
 */
export const formatYear = (value) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  return digits;
};

/**
 * Validate year range
 * @param {string} year - The year to validate
 * @param {number} minYear - Minimum year (default: 1900)
 * @param {number} maxYear - Maximum year (default: current year + 1)
 * @returns {boolean} - True if valid year
 */
export const isValidYear = (year, minYear = 1900, maxYear = new Date().getFullYear() + 1) => {
  const yearNum = parseInt(year, 10);
  return !isNaN(yearNum) && yearNum >= minYear && yearNum <= maxYear;
};

/**
 * Format ZIP code (5 or 9 digits)
 * @param {string} value - The input value
 * @returns {string} - Formatted ZIP code
 */
export const formatZipCode = (value) => {
  const digits = value.replace(/[^0-9]/g, '');
  
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
};

/**
 * Format time input (HH:MM format, 24-hour)
 * @param {string} value - The input value
 * @returns {string} - Formatted time
 */
export const formatTimeInput = (value) => {
  const digits = value.replace(/[^0-9]/g, '');
  
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

/**
 * Validate time format (HH:MM, 24-hour)
 * @param {string} time - The time to validate
 * @returns {boolean} - True if valid time
 */
export const isValidTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Format mileage/odometer reading
 * @param {string} value - The input value
 * @returns {string} - Formatted mileage with commas
 */
export const formatMileage = (value) => {
  const digits = value.replace(/[^0-9]/g, '');
  // Add commas for thousands
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Get raw mileage value (no commas)
 * @param {string} value - The formatted mileage
 * @returns {number} - Raw mileage number
 */
export const getRawMileage = (value) => {
  return parseInt(value.replace(/,/g, ''), 10) || 0;
};

/**
 * Create onChange handler with validation
 * @param {Function} setter - State setter function
 * @param {Function} validator - Validation/formatting function
 * @returns {Function} - onChange handler
 */
export const createValidatedHandler = (setter, validator) => {
  return (e) => {
    const value = e.target ? e.target.value : e;
    setter(validator(value));
  };
};

/**
 * Input validation patterns for HTML5 pattern attribute
 */
export const validationPatterns = {
  phone: '[0-9]{10}',
  email: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  zipCode: '[0-9]{5}(-[0-9]{4})?',
  alphanumeric: '[a-zA-Z0-9]+',
  letters: '[a-zA-Z\\s]+',
  numbers: '[0-9]+',
  time: '([01]?[0-9]|2[0-3]):[0-5][0-9]',
  date: '\\d{4}-\\d{2}-\\d{2}',
  year: '[1-2][0-9]{3}',
  vin: '[A-HJ-NPR-Z0-9]{17}',
  licensePlate: '[A-Z0-9\\s-]{1,10}'
};

/**
 * Error messages for validation failures
 */
export const validationMessages = {
  phone: 'Please enter a valid 10-digit phone number',
  email: 'Please enter a valid email address',
  zipCode: 'Please enter a valid ZIP code (12345 or 12345-6789)',
  required: 'This field is required',
  alphanumeric: 'Only letters and numbers are allowed',
  letters: 'Only letters are allowed',
  numbers: 'Only numbers are allowed',
  time: 'Please enter a valid time (HH:MM)',
  year: 'Please enter a valid year',
  vin: 'VIN must be 17 alphanumeric characters',
  licensePlate: 'Please enter a valid license plate'
};

/**
 * Comprehensive field validators by field type
 */
export const fieldValidators = {
  // Name fields
  firstName: formatNameInput,
  lastName: formatNameInput,
  riderName: formatNameInput,
  driverName: formatNameInput,
  name: formatNameInput,
  
  // Phone fields
  phone: formatPhoneNumber,
  phoneNumber: formatPhoneNumber,
  trackingPhone: formatPhoneNumber,
  emergencyContact: formatPhoneNumber,
  
  // Numeric fields
  capacity: formatNumericInput,
  mileage: formatMileage,
  fuelLevel: formatNumericInput,
  year: formatYear,
  age: formatNumericInput,
  
  // Decimal fields
  price: (val) => formatDecimalInput(val, 2),
  distance: (val) => formatDecimalInput(val, 2),
  
  // Vehicle fields
  vin: formatVIN,
  licensePlate: formatLicensePlate,
  
  // Address fields
  address: formatAddressInput,
  pickupLocation: formatAddressInput,
  dropoffLocation: formatAddressInput,
  
  // ID fields
  tripId: formatAlphanumeric,
  vehicleId: formatAlphanumeric,
  userId: formatAlphanumeric,
  
  // Default (no formatting)
  default: (val) => val
};

/**
 * Get validator function for a field
 * @param {string} fieldName - The name of the field
 * @returns {Function} - Validator function for that field
 */
export const getValidator = (fieldName) => {
  return fieldValidators[fieldName] || fieldValidators.default;
};

export default {
  formatPhoneNumber,
  getRawPhoneNumber,
  isValidPhoneNumber,
  formatNameInput,
  formatAlphanumeric,
  formatAddressInput,
  formatNumericInput,
  formatDecimalInput,
  isValidEmail,
  formatVIN,
  formatLicensePlate,
  formatYear,
  isValidYear,
  formatZipCode,
  formatTimeInput,
  isValidTime,
  formatMileage,
  getRawMileage,
  createValidatedHandler,
  validationPatterns,
  validationMessages,
  fieldValidators,
  getValidator
};
