/**
 * SMS Service
 * 
 * Handles sending SMS messages via Twilio for phone verification,
 * 2FA backup codes, and other notifications.
 */

import twilio from 'twilio';

// Initialize Twilio client
let twilioClient = null;
const twilioEnabled = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

if (twilioEnabled) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error.message);
  }
} else {
  console.warn('⚠️  Twilio not configured. SMS functionality will be simulated in development mode.');
}

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If doesn't start with country code, assume US (+1)
  if (!digits.startsWith('1') && digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Add + if not present
  if (!phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phoneNumber;
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} Validation result
 */
export function validatePhoneNumber(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length < 10) {
    return {
      valid: false,
      error: 'Phone number must be at least 10 digits'
    };
  }
  
  if (digits.length > 15) {
    return {
      valid: false,
      error: 'Phone number is too long'
    };
  }
  
  return {
    valid: true,
    formatted: formatPhoneNumber(phoneNumber)
  };
}

/**
 * Send SMS via Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message body
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Send result
 */
async function sendSMS(to, body, options = {}) {
  // Validate phone number
  const validation = validatePhoneNumber(to);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  const formattedPhone = validation.formatted;

  // Development mode - simulate SMS
  if (!twilioEnabled || process.env.NODE_ENV === 'development') {
    console.log('\n📱 [SMS SIMULATION]');
    console.log(`To: ${formattedPhone}`);
    console.log(`Body: ${body}`);
    console.log(`Options:`, options);
    
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
      to: formattedPhone,
      body,
      status: 'delivered'
    };
  }

  // Production - actually send SMS
  try {
    const message = await twilioClient.messages.create({
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
      ...options
    });

    return {
      success: true,
      messageId: message.sid,
      to: message.to,
      from: message.from,
      status: message.status,
      dateCreated: message.dateCreated,
      price: message.price,
      priceUnit: message.priceUnit
    };
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Send verification code SMS
 * @param {string} phoneNumber - Phone number
 * @param {string} code - Verification code
 * @param {string} purpose - Purpose of verification
 * @returns {Promise<Object>}
 */
export async function sendVerificationCode(phoneNumber, code, purpose = 'verification') {
  const purposeText = {
    registration: 'account registration',
    login: 'login',
    phone_change: 'phone number update',
    '2fa_backup': 'two-factor authentication',
    password_reset: 'password reset'
  };

  const body = `Your verification code for ${purposeText[purpose] || 'verification'} is: ${code}. This code expires in 10 minutes.`;

  const result = await sendSMS(phoneNumber, body);

  return {
    ...result,
    purpose,
    code: result.simulated ? code : undefined // Only return code in dev mode
  };
}

/**
 * Send 2FA backup code via SMS
 * @param {string} phoneNumber - Phone number
 * @param {string} code - Backup code
 * @returns {Promise<Object>}
 */
export async function send2FABackupCode(phoneNumber, code) {
  const body = `Your 2FA login code is: ${code}. If you didn't request this, please secure your account immediately.`;
  return await sendSMS(phoneNumber, body);
}

/**
 * Send password reset code
 * @param {string} phoneNumber - Phone number
 * @param {string} code - Reset code
 * @returns {Promise<Object>}
 */
export async function sendPasswordResetCode(phoneNumber, code) {
  const body = `Your password reset code is: ${code}. This code expires in 10 minutes. If you didn't request this, please ignore this message.`;
  return await sendSMS(phoneNumber, body);
}

/**
 * Send security alert SMS
 * @param {string} phoneNumber - Phone number
 * @param {string} alertType - Type of alert
 * @param {Object} details - Alert details
 * @returns {Promise<Object>}
 */
export async function sendSecurityAlert(phoneNumber, alertType, details = {}) {
  const alertMessages = {
    suspicious_login: `Security Alert: A login attempt was detected from ${details.location || 'an unknown location'}. If this wasn't you, please secure your account immediately.`,
    password_changed: 'Security Alert: Your password was just changed. If you didn\'t do this, please contact support immediately.',
    '2fa_disabled': 'Security Alert: Two-factor authentication was disabled on your account. If you didn\'t do this, please contact support immediately.',
    account_locked: 'Security Alert: Your account has been locked due to multiple failed login attempts. Please contact support to unlock.',
    new_device: `Security Alert: A new device logged into your account from ${details.location || 'an unknown location'}. If this wasn't you, please secure your account.`
  };

  const body = alertMessages[alertType] || `Security Alert: ${alertType}`;
  return await sendSMS(phoneNumber, body);
}

/**
 * Send custom notification SMS
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Message to send
 * @returns {Promise<Object>}
 */
export async function sendNotification(phoneNumber, message) {
  return await sendSMS(phoneNumber, message);
}

/**
 * Check if SMS service is enabled
 * @returns {boolean}
 */
export function isSMSEnabled() {
  return twilioEnabled && !!twilioClient;
}

/**
 * Get SMS service status
 * @returns {Object}
 */
export function getSMSServiceStatus() {
  return {
    enabled: twilioEnabled,
    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    mode: process.env.NODE_ENV === 'development' ? 'simulation' : 'production',
    from: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
  };
}

export default {
  sendSMS,
  sendVerificationCode,
  send2FABackupCode,
  sendPasswordResetCode,
  sendSecurityAlert,
  sendNotification,
  formatPhoneNumber,
  validatePhoneNumber,
  isSMSEnabled,
  getSMSServiceStatus
};
