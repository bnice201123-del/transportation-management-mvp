/**
 * Input Sanitization Middleware
 * Removes XSS vectors and malicious content from request body
 * Applied to all POST/PUT requests
 */

/**
 * Sanitize a string value
 * @param {string} value - Value to sanitize
 * @returns {string} - Sanitized value
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove HTML tags and dangerous characters
  let sanitized = value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')  // Remove all HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '');
  
  return sanitized.trim();
};

/**
 * Sanitize an object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      }
      if (typeof item === 'object') {
        return sanitizeObject(item);
      }
      return item;
    });
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Express middleware to sanitize request body
 * Usage: app.use(sanitizeRequestBody)
 */
export const sanitizeRequestBody = (req, res, next) => {
  // Only sanitize POST and PUT requests with body
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    // Fields to sanitize (all string fields in typical requests)
    const fieldsToSanitize = [
      'username', 'email', 'password', 'firstName', 'lastName', 'phone',
      'pickupAddress', 'dropoffAddress', 'specialRequirements',
      'licenseNumber', 'riderName', 'riderPhone', 'riderEmail',
      'description', 'notes', 'comments', 'remarks',
      'title', 'message', 'reason', 'feedback'
    ];
    
    for (const field of fieldsToSanitize) {
      if (req.body[field]) {
        req.body[field] = sanitizeString(req.body[field]);
      }
    }
  }
  
  next();
};

/**
 * Alternative: Sanitize all string fields in request body
 * More comprehensive but less performant
 */
export const sanitizeAllStrings = (req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize specific fields before saving to database
 * @param {object} data - Data object to sanitize
 * @param {array} fields - Fields to sanitize
 * @returns {object} - Sanitized data
 */
export const sanitizeData = (data, fields = []) => {
  if (!fields || fields.length === 0) {
    return data; // No fields specified, return as-is
  }
  
  const sanitized = { ...data };
  for (const field of fields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  }
  
  return sanitized;
};

/**
 * Sanitize output before sending to client
 * @param {object} data - Data to sanitize
 * @returns {object} - Sanitized data safe to send
 */
export const sanitizeOutput = (data) => {
  if (!data) return data;
  
  // Remove sensitive fields
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Remove sensitive fields that shouldn't be exposed
  if (sanitized.password) delete sanitized.password;
  if (sanitized.twoFactorSecret) delete sanitized.twoFactorSecret;
  if (sanitized.twoFactorBackupCodes) delete sanitized.twoFactorBackupCodes;
  
  return sanitized;
};

/**
 * Validate email format before sanitization
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - Is valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeAllStrings,
  sanitizeData,
  sanitizeOutput,
  isValidEmail,
  isValidUrl,
};
