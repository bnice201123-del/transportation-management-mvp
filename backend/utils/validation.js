/**
 * Backend Validation Utilities
 * Matches frontend validation rules in validationSchemas.js
 * Applied to all API endpoints for data integrity and security
 */

// Utility validation functions
export const validators = {
  // Check if string is empty or only whitespace
  isEmpty: (value) => !value || String(value).trim().length === 0,
  
  // Check if string length is within range
  isLengthValid: (value, min = 0, max = Infinity) => {
    const len = String(value || '').length;
    return len >= min && len <= max;
  },
  
  // Validate username: 3-30 chars, alphanumeric + underscore
  isValidUsername: (username) => {
    if (!username) return false;
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  },
  
  // Validate email format
  isValidEmail: (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate password: minimum 6 characters
  isValidPassword: (password) => {
    if (!password) return false;
    return String(password).length >= 6;
  },
  
  // Validate phone number: 10+ digits
  isValidPhone: (phone) => {
    if (!phone) return true; // Allow empty
    const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  },
  
  // Validate first/last name: 1-50 characters, allow spaces and hyphens
  isValidName: (name) => {
    if (!name) return false;
    const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
    return nameRegex.test(name);
  },
  
  // Validate address: 5-200 characters
  isValidAddress: (address) => {
    if (!address) return false;
    return String(address).length >= 5 && String(address).length <= 200;
  },
  
  // Validate date format (YYYY-MM-DD)
  isValidDateFormat: (dateString) => {
    if (!dateString) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },
  
  // Validate time format (HH:MM)
  isValidTimeFormat: (timeString) => {
    if (!timeString) return false;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  },
  
  // Validate latitude/longitude ranges
  isValidCoordinates: (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return (
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180
    );
  },
  
  // Validate latitude only
  isValidLatitude: (lat) => {
    const latNum = parseFloat(lat);
    return !isNaN(latNum) && latNum >= -90 && latNum <= 90;
  },
  
  // Validate longitude only
  isValidLongitude: (lng) => {
    const lngNum = parseFloat(lng);
    return !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;
  },
  
  // Validate positive number (for passenger count, speed, etc)
  isPositiveNumber: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },
  
  // Validate non-negative number (for accuracy, altitude, etc)
  isNonNegativeNumber: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  },
};

// Validation schemas for specific forms
export const validationSchemas = {
  // Login form validation
  login: {
    username: (value) => {
      if (validators.isEmpty(value)) {
        return 'Username or email is required';
      }
      // Accept either username format or email format
      const isUsername = validators.isValidUsername(value);
      const isEmail = validators.isValidEmail(value);
      if (!isUsername && !isEmail) {
        return 'Username must be 3-30 alphanumeric characters, or a valid email address';
      }
      return null;
    },
    password: (value) => {
      if (validators.isEmpty(value)) {
        return 'Password is required';
      }
      if (!validators.isValidPassword(value)) {
        return 'Password must be at least 6 characters';
      }
      return null;
    },
  },

  // Registration form validation
  register: {
    username: (value) => {
      if (validators.isEmpty(value)) {
        return 'Username is required';
      }
      if (!validators.isValidUsername(value)) {
        return 'Username must be 3-30 characters (letters, numbers, underscore only)';
      }
      return null;
    },
    email: (value) => {
      if (validators.isEmpty(value)) {
        return 'Email is required';
      }
      if (!validators.isValidEmail(value)) {
        return 'Email format is invalid';
      }
      return null;
    },
    password: (value) => {
      if (validators.isEmpty(value)) {
        return 'Password is required';
      }
      if (!validators.isValidPassword(value)) {
        return 'Password must be at least 6 characters';
      }
      return null;
    },
    firstName: (value) => {
      if (validators.isEmpty(value)) {
        return 'First name is required';
      }
      if (!validators.isValidName(value)) {
        return 'First name must be 1-50 characters (letters, spaces, hyphens only)';
      }
      return null;
    },
    lastName: (value) => {
      if (validators.isEmpty(value)) {
        return 'Last name is required';
      }
      if (!validators.isValidName(value)) {
        return 'Last name must be 1-50 characters (letters, spaces, hyphens only)';
      }
      return null;
    },
    phone: (value) => {
      if (!value) return null; // Optional
      if (!validators.isValidPhone(value)) {
        return 'Phone number must contain at least 10 digits';
      }
      return null;
    },
  },

  // Trip creation/update validation
  trip: {
    pickupAddress: (value) => {
      if (validators.isEmpty(value)) {
        return 'Pickup address is required';
      }
      if (!validators.isValidAddress(value)) {
        return 'Pickup address must be between 5 and 200 characters';
      }
      return null;
    },
    dropoffAddress: (value) => {
      if (validators.isEmpty(value)) {
        return 'Dropoff address is required';
      }
      if (!validators.isValidAddress(value)) {
        return 'Dropoff address must be between 5 and 200 characters';
      }
      return null;
    },
    scheduledDate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Date is required';
      }
      if (!validators.isValidDateFormat(value)) {
        return 'Date must be in YYYY-MM-DD format';
      }
      return null;
    },
    scheduledTime: (value) => {
      if (validators.isEmpty(value)) {
        return 'Time is required';
      }
      if (!validators.isValidTimeFormat(value)) {
        return 'Time must be in HH:MM format';
      }
      return null;
    },
    numberOfPassengers: (value) => {
      if (!value) return 'Number of passengers is required';
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 6) {
        return 'Number of passengers must be between 1 and 6';
      }
      return null;
    },
    specialRequirements: (value) => {
      if (!value) return null; // Optional
      if (String(value).length > 500) {
        return 'Special requirements must be less than 500 characters';
      }
      return null;
    },
  },

  // GPS location validation
  location: {
    latitude: (value) => {
      if (value === undefined || value === null || value === '') {
        return 'Latitude is required';
      }
      if (!validators.isValidLatitude(value)) {
        return 'Latitude must be between -90 and 90 degrees';
      }
      return null;
    },
    longitude: (value) => {
      if (value === undefined || value === null || value === '') {
        return 'Longitude is required';
      }
      if (!validators.isValidLongitude(value)) {
        return 'Longitude must be between -180 and 180 degrees';
      }
      return null;
    },
    accuracy: (value) => {
      if (!value) return null; // Optional
      if (!validators.isNonNegativeNumber(value)) {
        return 'Accuracy must be a positive number (meters)';
      }
      return null;
    },
    altitude: (value) => {
      if (!value) return null; // Optional
      if (isNaN(parseFloat(value))) {
        return 'Altitude must be a number';
      }
      return null;
    },
    speed: (value) => {
      if (!value) return null; // Optional
      if (!validators.isNonNegativeNumber(value)) {
        return 'Speed must be a positive number (m/s)';
      }
      return null;
    },
  },
};

/**
 * Validate a form/object against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - { isValid: boolean, errors: { field: 'error message' } }
 */
export const validateAgainstSchema = (data, schema) => {
  const errors = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    if (typeof validator === 'function') {
      const error = validator(data[field]);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login data
 * @param {Object} data - { username/email, password }
 * @returns {Object} - { isValid, errors }
 */
export const validateLogin = (data) => {
  // Accept username OR email, not both required
  const usernameError = validationSchemas.login.username(data.username || data.email);
  const passwordError = validationSchemas.login.password(data.password);
  
  const errors = {};
  if (usernameError) errors.username = usernameError;
  if (passwordError) errors.password = passwordError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate registration data
 * @param {Object} data - { username, email, password, firstName, lastName, phone }
 * @returns {Object} - { isValid, errors }
 */
export const validateRegistration = (data) => {
  return validateAgainstSchema(data, validationSchemas.register);
};

/**
 * Validate trip data
 * @param {Object} data - Trip data
 * @returns {Object} - { isValid, errors }
 */
export const validateTrip = (data) => {
  return validateAgainstSchema(data, validationSchemas.trip);
};

/**
 * Validate GPS location data
 * @param {Object} data - { latitude, longitude, accuracy, altitude, speed }
 * @returns {Object} - { isValid, errors }
 */
export const validateLocation = (data) => {
  return validateAgainstSchema(data, validationSchemas.location);
};

export default {
  validators,
  validationSchemas,
  validateAgainstSchema,
  validateLogin,
  validateRegistration,
  validateTrip,
  validateLocation,
};
