/**
 * Input Validation Schemas
 * Frontend validation for form inputs before API submission
 */

// Utility validation functions
export const validators = {
  // Check if string is empty or only whitespace
  isEmpty: (value) => !value || value.trim().length === 0,
  
  // Check if string length is within range
  isLengthValid: (value, min = 0, max = Infinity) => {
    const len = (value || '').length;
    return len >= min && len <= max;
  },
  
  // Validate phone number (basic format)
  isValidPhone: (phone) => {
    if (!phone) return true; // Allow empty
    const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  // Validate email format
  isValidEmail: (email) => {
    if (!email) return true; // Allow empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate date is in future
  isFutureDate: (dateString) => {
    if (!dateString) return true; // Allow empty
    const date = new Date(dateString);
    return date > new Date();
  },
  
  // Validate date format (YYYY-MM-DD)
  isValidDateFormat: (dateString) => {
    if (!dateString) return true; // Allow empty
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },
  
  // Validate time format (HH:MM)
  isValidTimeFormat: (timeString) => {
    if (!timeString) return true; // Allow empty
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  },
  
  // Validate URL format
  isValidUrl: (url) => {
    if (!url) return true; // Allow empty
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validate latitude/longitude
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
};

// Trip Form Validation
export const tripFormValidation = {
  pickupAddress: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Pickup address is required';
      }
      if (!validators.isLengthValid(value, 5, 200)) {
        return 'Address must be between 5 and 200 characters';
      }
      return null;
    },
  },
  
  dropoffAddress: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Dropoff address is required';
      }
      if (!validators.isLengthValid(value, 5, 200)) {
        return 'Address must be between 5 and 200 characters';
      }
      return null;
    },
  },
  
  riderName: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Rider name is required';
      }
      if (!validators.isLengthValid(value, 2, 100)) {
        return 'Name must be between 2 and 100 characters';
      }
      return null;
    },
  },
  
  riderPhone: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Phone number is required';
      }
      if (!validators.isValidPhone(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    },
  },
  
  scheduledDate: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Scheduled date is required';
      }
      if (!validators.isValidDateFormat(value)) {
        return 'Invalid date format. Use YYYY-MM-DD';
      }
      if (!validators.isFutureDate(value)) {
        return 'Date must be in the future';
      }
      return null;
    },
  },
  
  notes: {
    validate: (value) => {
      if (value && !validators.isLengthValid(value, 0, 500)) {
        return 'Notes must not exceed 500 characters';
      }
      return null;
    },
  },
};

// Location Filter Validation
export const locationFilterValidation = {
  lat: {
    validate: (value) => {
      if (value === '' || value === null) return null; // Optional
      const num = parseFloat(value);
      if (isNaN(num) || num < -90 || num > 90) {
        return 'Latitude must be between -90 and 90';
      }
      return null;
    },
  },
  
  lng: {
    validate: (value) => {
      if (value === '' || value === null) return null; // Optional
      const num = parseFloat(value);
      if (isNaN(num) || num < -180 || num > 180) {
        return 'Longitude must be between -180 and 180';
      }
      return null;
    },
  },
  
  radius: {
    validate: (value) => {
      if (value === '' || value === null) return null; // Optional
      const num = parseFloat(value);
      if (isNaN(num) || num < 0.1 || num > 50) {
        return 'Radius must be between 0.1 and 50 km';
      }
      return null;
    },
  },
};

// Driver/Rider Registration Validation
export const registrationValidation = {
  username: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Username is required';
      }
      if (!validators.isLengthValid(value, 3, 30)) {
        return 'Username must be between 3 and 30 characters';
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Username can only contain letters, numbers, underscores, and hyphens';
      }
      return null;
    },
  },
  
  email: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Email is required';
      }
      if (!validators.isValidEmail(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    },
  },
  
  password: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Password is required';
      }
      if (!validators.isLengthValid(value, 6, 100)) {
        return 'Password must be at least 6 characters';
      }
      return null;
    },
  },
  
  firstName: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'First name is required';
      }
      if (!validators.isLengthValid(value, 2, 50)) {
        return 'First name must be between 2 and 50 characters';
      }
      return null;
    },
  },
  
  lastName: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Last name is required';
      }
      if (!validators.isLengthValid(value, 2, 50)) {
        return 'Last name must be between 2 and 50 characters';
      }
      return null;
    },
  },
  
  phone: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'Phone number is required';
      }
      if (!validators.isValidPhone(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    },
  },
};

// Batch validation function
export const validateForm = (formData, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach((field) => {
    const validator = schema[field];
    const value = formData[field];
    const error = validator.validate(value);
    
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Single field validation
export const validateField = (fieldName, value, schema) => {
  const validator = schema[fieldName];
  
  if (!validator) {
    return null; // Field not in schema
  }
  
  return validator.validate(value);
};

// Sanitize string input
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  
  return value
    .trim() // Remove leading/trailing whitespace
    .replace(/</g, '&lt;') // Escape HTML characters
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize form data
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  Object.keys(formData).forEach((key) => {
    const value = formData[key];
    sanitized[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  });
  
  return sanitized;
};

export default {
  validators,
  tripFormValidation,
  locationFilterValidation,
  registrationValidation,
  validateForm,
  validateField,
  sanitizeInput,
  sanitizeFormData,
};
