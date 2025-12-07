import Settings from '../models/Settings.js';
import { logSettingChange } from '../routes/settingsHistory.js';

/**
 * Middleware to track settings changes
 * Wraps the request to log any setting modifications
 */
export const trackSettingsChanges = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Store request body for later comparison
  req.originalSettings = null;
  
  // If this is a settings update request, get current values
  if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') {
    try {
      req.originalSettings = await Settings.getAll();
    } catch (error) {
      // Settings might not exist yet, continue
      console.log('No existing settings found, will create new');
    }
  }
  
  // Override send function to capture response
  res.send = function(data) {
    res.send = originalSend; // Restore original send
    
    // If this was a successful settings update, log the changes
    if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') && 
        res.statusCode >= 200 && res.statusCode < 300) {
      
      // Log changes asynchronously (don't block response)
      setImmediate(async () => {
        try {
          if (req.body && req.originalSettings && req.user) {
            await logSettingsChangesFromBody(
              req.body,
              req.originalSettings,
              req.user._id,
              req
            );
          }
        } catch (error) {
          console.error('Error logging settings changes:', error);
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Helper function to log changes from request body
 */
async function logSettingsChangesFromBody(body, originalSettings, userId, req) {
  const changes = [];
  
  // Compare body with original settings
  for (const [key, value] of Object.entries(body)) {
    const oldValue = originalSettings[key];
    
    // Only log if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      const category = key.split('.')[0] || 'system';
      changes.push({
        key,
        category,
        oldValue,
        newValue: value
      });
    }
  }
  
  // Log all changes
  for (const change of changes) {
    await logSettingChange(
      change.key,
      change.category,
      change.oldValue,
      change.newValue,
      userId,
      req,
      body.reason || null // Optional reason from request body
    );
  }
}

/**
 * Middleware to validate setting values before update
 */
export const validateSettings = (req, res, next) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
    return next();
  }
  
  const errors = [];
  
  // Validate each setting in the request body
  for (const [key, value] of Object.entries(req.body)) {
    // Skip metadata fields
    if (['reason', 'lastUpdated', 'lastUpdatedBy'].includes(key)) {
      continue;
    }
    
    // Validate based on setting type
    const validation = validateSettingValue(key, value);
    if (!validation.valid) {
      errors.push({
        setting: key,
        message: validation.message
      });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid setting values',
      errors
    });
  }
  
  next();
};

/**
 * Validate individual setting values
 */
function validateSettingValue(key, value) {
  // Email validation
  if (key.includes('Email') || key.includes('email')) {
    if (value && typeof value === 'string' && value.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Invalid email format' };
      }
    }
  }
  
  // URL validation
  if (key.includes('Url') || key.includes('url') || key.includes('webhook')) {
    if (value && typeof value === 'string' && value.length > 0) {
      try {
        new URL(value);
      } catch {
        return { valid: false, message: 'Invalid URL format' };
      }
    }
  }
  
  // Number range validation
  if (key.includes('Min') || key.includes('Max') || key.includes('Limit')) {
    if (typeof value === 'number') {
      if (value < 0) {
        return { valid: false, message: 'Value must be positive' };
      }
      if (key.includes('passwordMinLength') && value < 6) {
        return { valid: false, message: 'Password minimum length must be at least 6' };
      }
      if (key.includes('maxLoginAttempts') && (value < 1 || value > 20)) {
        return { valid: false, message: 'Max login attempts must be between 1 and 20' };
      }
    }
  }
  
  // Boolean validation
  if (key.includes('Enabled') || key.includes('Required') || key.includes('Allow')) {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return { valid: false, message: 'Value must be boolean' };
    }
  }
  
  // Phone number validation
  if (key.includes('Phone') || key.includes('phone')) {
    if (value && typeof value === 'string' && value.length > 0) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return { valid: false, message: 'Invalid phone number format' };
      }
    }
  }
  
  // Timezone validation
  if (key === 'system.timezone') {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
    } catch {
      return { valid: false, message: 'Invalid timezone' };
    }
  }
  
  // Array validation
  if (Array.isArray(value)) {
    if (key.includes('ipWhitelist')) {
      // Validate IP addresses
      for (const ip of value) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        if (!ipRegex.test(ip)) {
          return { valid: false, message: `Invalid IP address: ${ip}` };
        }
      }
    }
  }
  
  return { valid: true };
}

/**
 * Middleware to check if user has permission to modify settings
 */
export const requireSettingsPermission = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Only admins can modify settings
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required to modify settings'
    });
  }
  
  next();
};

/**
 * Middleware to log critical setting changes immediately
 */
export const alertOnCriticalChanges = async (req, res, next) => {
  // Store original send
  const originalSend = res.send;
  
  res.send = function(data) {
    res.send = originalSend;
    
    // Check for critical setting changes
    if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') && 
        res.statusCode >= 200 && res.statusCode < 300) {
      
      setImmediate(async () => {
        try {
          await checkCriticalChanges(req.body, req.user);
        } catch (error) {
          console.error('Error checking critical changes:', error);
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Check if any critical settings were changed
 */
async function checkCriticalChanges(body, user) {
  const criticalSettings = [
    'security.twoFactorRequired',
    'security.sessionEncryption',
    'security.maxLoginAttempts',
    'security.ipWhitelist',
    'rateLimit.enabled',
    'rateLimit.maxRequests',
    'system.maintenanceMode'
  ];
  
  const changedCritical = Object.keys(body).filter(key => 
    criticalSettings.includes(key)
  );
  
  if (changedCritical.length > 0) {
    console.log('⚠️  CRITICAL SETTING CHANGE DETECTED:');
    console.log(`   Changed by: ${user.name} (${user.email})`);
    console.log(`   Settings: ${changedCritical.join(', ')}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    
    // TODO: Send email notification here
    // You can integrate with your email service
  }
}

export default {
  trackSettingsChanges,
  validateSettings,
  requireSettingsPermission,
  alertOnCriticalChanges
};
