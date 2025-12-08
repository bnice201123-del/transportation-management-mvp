/**
 * Settings Validation Utility
 * Provides comprehensive validation for different setting types
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true, error: null };
};

// URL validation
export const validateURL = (url, options = {}) => {
  const { requireHTTPS = false, allowLocalhost = true } = options;
  
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (requireHTTPS && urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'HTTPS protocol required' };
    }
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check localhost
    if (!allowLocalhost && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return { isValid: false, error: 'Localhost URLs are not allowed' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Phone number validation (international format)
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return { isValid: false, error: 'Invalid phone format. Use international format (+1234567890)' };
  }
  return { isValid: true, error: null };
};

// Number range validation
export const validateNumberRange = (value, min, max, options = {}) => {
  const { isInteger = false, allowNull = false } = options;
  
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return { isValid: true, error: null };
    }
    return { isValid: false, error: 'Value is required' };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  
  if (isInteger && !Number.isInteger(num)) {
    return { isValid: false, error: 'Must be a whole number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Must be at most ${max}` };
  }
  
  return { isValid: true, error: null };
};

// IP Address validation
export const validateIPAddress = (ip, version = 'both') => {
  if (!ip) {
    return { isValid: false, error: 'IP address is required' };
  }
  
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  const isIPv4 = ipv4Regex.test(ip);
  const isIPv6 = ipv6Regex.test(ip);
  
  if (version === 'ipv4' && !isIPv4) {
    return { isValid: false, error: 'Invalid IPv4 address' };
  }
  
  if (version === 'ipv6' && !isIPv6) {
    return { isValid: false, error: 'Invalid IPv6 address' };
  }
  
  if (version === 'both' && !isIPv4 && !isIPv6) {
    return { isValid: false, error: 'Invalid IP address' };
  }
  
  // Validate IPv4 octets
  if (isIPv4) {
    const octets = ip.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { isValid: false, error: 'IPv4 octets must be between 0-255' };
      }
    }
  }
  
  return { isValid: true, error: null };
};

// Port number validation
export const validatePort = (port) => {
  return validateNumberRange(port, 1, 65535, { isInteger: true });
};

// Regex pattern validation
export const validateRegex = (pattern) => {
  if (!pattern) {
    return { isValid: false, error: 'Pattern is required' };
  }
  
  try {
    new RegExp(pattern);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid regular expression pattern' };
  }
};

// JSON validation
export const validateJSON = (jsonString) => {
  if (!jsonString) {
    return { isValid: false, error: 'JSON is required' };
  }
  
  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: `Invalid JSON: ${error.message}` };
  }
};

// Password strength validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;
  
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain an uppercase letter' };
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain a lowercase letter' };
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain a number' };
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain a special character' };
  }
  
  return { isValid: true, error: null };
};

// Timezone validation
export const validateTimezone = (timezone) => {
  if (!timezone) {
    return { isValid: false, error: 'Timezone is required' };
  }
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid timezone' };
  }
};

// Domain name validation
export const validateDomain = (domain) => {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  
  if (!domain) {
    return { isValid: false, error: 'Domain is required' };
  }
  
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: 'Invalid domain format' };
  }
  
  return { isValid: true, error: null };
};

// Cron expression validation (basic)
export const validateCron = (cron) => {
  if (!cron) {
    return { isValid: false, error: 'Cron expression is required' };
  }
  
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return { isValid: false, error: 'Cron expression must have 5 or 6 parts' };
  }
  
  return { isValid: true, error: null };
};

// Color hex validation
export const validateHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  if (!color) {
    return { isValid: false, error: 'Color is required' };
  }
  
  if (!hexRegex.test(color)) {
    return { isValid: false, error: 'Invalid hex color format (use #RGB or #RRGGBB)' };
  }
  
  return { isValid: true, error: null };
};

// Required field validation
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
};

// String length validation
export const validateStringLength = (value, min, max) => {
  if (!value) {
    return { isValid: false, error: 'Value is required' };
  }
  
  if (min !== undefined && value.length < min) {
    return { isValid: false, error: `Must be at least ${min} characters` };
  }
  
  if (max !== undefined && value.length > max) {
    return { isValid: false, error: `Must be at most ${max} characters` };
  }
  
  return { isValid: true, error: null };
};

// Validation schema builder
export const createValidationSchema = (rules) => {
  return (value, context = {}) => {
    for (const rule of rules) {
      const result = rule(value, context);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true, error: null };
  };
};

// Pre-built validation schemas for common settings
export const settingsValidators = {
  email: (value) => validateEmail(value),
  url: (value) => validateURL(value),
  httpsUrl: (value) => validateURL(value, { requireHTTPS: true }),
  phone: (value) => validatePhone(value),
  port: (value) => validatePort(value),
  ipAddress: (value) => validateIPAddress(value),
  timezone: (value) => validateTimezone(value),
  domain: (value) => validateDomain(value),
  hexColor: (value) => validateHexColor(value),
  positiveInteger: (value) => validateNumberRange(value, 0, Infinity, { isInteger: true }),
  percentage: (value) => validateNumberRange(value, 0, 100),
  password: (value) => validatePassword(value),
  required: (value) => validateRequired(value),
};

export default settingsValidators;
