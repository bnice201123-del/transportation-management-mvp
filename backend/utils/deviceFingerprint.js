/**
 * Device Fingerprinting Utility
 * Generates unique device identifiers based on browser/device characteristics
 */

import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

/**
 * Generate a device fingerprint from request headers and client data
 * @param {Object} req - Express request object
 * @param {Object} clientData - Additional client data from frontend
 * @returns {Object} Device fingerprint data
 */
export const generateDeviceFingerprint = (req, clientData = {}) => {
  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();

  const fingerprintData = {
    // User Agent parsing
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || 'Unknown',
      major: result.browser.major || 'Unknown'
    },
    engine: {
      name: result.engine.name || 'Unknown',
      version: result.engine.version || 'Unknown'
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || 'Unknown'
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || 'Unknown',
      model: result.device.model || 'Unknown'
    },
    cpu: {
      architecture: result.cpu.architecture || 'Unknown'
    },

    // Network/Request data
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    acceptLanguage: req.headers['accept-language'] || 'Unknown',
    acceptEncoding: req.headers['accept-encoding'] || 'Unknown',
    
    // Client-provided data (from browser fingerprinting)
    screen: clientData.screen || {},
    timezone: clientData.timezone || null,
    platform: clientData.platform || null,
    vendor: clientData.vendor || null,
    webgl: clientData.webgl || null,
    canvas: clientData.canvas || null,
    fonts: clientData.fonts || [],
    plugins: clientData.plugins || [],
    audioContext: clientData.audioContext || null,
    touchSupport: clientData.touchSupport || false,
    hardwareConcurrency: clientData.hardwareConcurrency || null,
    deviceMemory: clientData.deviceMemory || null,
    colorDepth: clientData.colorDepth || null,
    
    // Timestamp
    timestamp: new Date()
  };

  // Generate hash of the fingerprint
  const fingerprintHash = hashFingerprint(fingerprintData);

  return {
    ...fingerprintData,
    fingerprint: fingerprintHash
  };
};

/**
 * Generate a hash from fingerprint data
 * @param {Object} data - Fingerprint data
 * @returns {String} SHA-256 hash
 */
export const hashFingerprint = (data) => {
  // Extract stable characteristics for hashing
  const stableData = {
    browser: data.browser,
    os: data.os,
    device: data.device,
    screen: data.screen,
    timezone: data.timezone,
    platform: data.platform,
    webgl: data.webgl,
    canvas: data.canvas,
    hardwareConcurrency: data.hardwareConcurrency,
    deviceMemory: data.deviceMemory,
    colorDepth: data.colorDepth
  };

  const dataString = JSON.stringify(stableData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Calculate trust score for a device (0-100)
 * @param {Object} device - Device object from database
 * @param {Object} currentFingerprint - Current fingerprint data
 * @returns {Number} Trust score (0-100)
 */
export const calculateDeviceTrustScore = (device, currentFingerprint) => {
  let score = 0;

  // Base score for verified devices
  if (device.isVerified) {
    score += 40;
  }

  // Score based on how long device has been trusted
  const daysTrusted = device.trustLevel === 'trusted' 
    ? (Date.now() - device.createdAt) / (1000 * 60 * 60 * 24)
    : 0;
  score += Math.min(daysTrusted * 2, 20); // Max 20 points for age

  // Score based on successful logins
  if (device.loginCount > 0) {
    score += Math.min(device.loginCount * 2, 20); // Max 20 points
  }

  // Penalty for failed attempts
  if (device.failedAttempts > 0) {
    score -= device.failedAttempts * 5; // -5 per failed attempt
  }

  // Score for consistency (fingerprint match)
  if (currentFingerprint && device.fingerprint === currentFingerprint.fingerprint) {
    score += 20;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
};

/**
 * Detect if device characteristics have changed significantly
 * @param {Object} oldFingerprint - Previous fingerprint
 * @param {Object} newFingerprint - Current fingerprint
 * @returns {Object} Change detection result
 */
export const detectFingerprintChanges = (oldFingerprint, newFingerprint) => {
  const changes = [];

  // Browser changes
  if (oldFingerprint.browser?.name !== newFingerprint.browser?.name) {
    changes.push({ field: 'browser.name', old: oldFingerprint.browser?.name, new: newFingerprint.browser?.name });
  }
  if (oldFingerprint.browser?.version !== newFingerprint.browser?.version) {
    changes.push({ field: 'browser.version', old: oldFingerprint.browser?.version, new: newFingerprint.browser?.version });
  }

  // OS changes
  if (oldFingerprint.os?.name !== newFingerprint.os?.name) {
    changes.push({ field: 'os.name', old: oldFingerprint.os?.name, new: newFingerprint.os?.name });
  }

  // Device changes
  if (oldFingerprint.device?.type !== newFingerprint.device?.type) {
    changes.push({ field: 'device.type', old: oldFingerprint.device?.type, new: newFingerprint.device?.type });
  }

  // Screen resolution changes
  if (JSON.stringify(oldFingerprint.screen) !== JSON.stringify(newFingerprint.screen)) {
    changes.push({ field: 'screen', old: oldFingerprint.screen, new: newFingerprint.screen });
  }

  // Timezone changes
  if (oldFingerprint.timezone !== newFingerprint.timezone) {
    changes.push({ field: 'timezone', old: oldFingerprint.timezone, new: newFingerprint.timezone });
  }

  // Calculate severity (minor changes like browser version vs major changes like OS)
  const majorChanges = changes.filter(c => 
    ['browser.name', 'os.name', 'device.type', 'platform'].includes(c.field)
  ).length;

  const severity = majorChanges > 2 ? 'high' : majorChanges > 0 ? 'medium' : 'low';

  return {
    hasChanges: changes.length > 0,
    changes,
    severity,
    majorChanges,
    totalChanges: changes.length
  };
};

/**
 * Parse IP address for geolocation (basic extraction)
 * @param {String} ip - IP address
 * @returns {Object} IP info
 */
export const parseIPAddress = (ip) => {
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');
  
  // Check if localhost
  const isLocalhost = ['127.0.0.1', '::1', 'localhost'].includes(cleanIP);
  
  // Check if private IP
  const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(cleanIP);

  return {
    ip: cleanIP,
    isLocalhost,
    isPrivate,
    isPublic: !isLocalhost && !isPrivate
  };
};

/**
 * Get device type category
 * @param {Object} device - Device fingerprint
 * @returns {String} Device category
 */
export const getDeviceCategory = (device) => {
  const deviceType = device.device?.type?.toLowerCase() || 'desktop';
  
  if (['mobile', 'smartphone'].includes(deviceType)) return 'mobile';
  if (deviceType === 'tablet') return 'tablet';
  if (deviceType === 'wearable') return 'wearable';
  return 'desktop';
};

/**
 * Check if device is likely a bot/crawler
 * @param {Object} fingerprint - Device fingerprint
 * @returns {Boolean} True if likely a bot
 */
export const isLikelyBot = (fingerprint) => {
  const userAgent = `${fingerprint.browser?.name} ${fingerprint.os?.name}`.toLowerCase();
  
  const botKeywords = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'python', 'java', 'http', 'axios', 'node', 'fetch'
  ];

  return botKeywords.some(keyword => userAgent.includes(keyword));
};

export default {
  generateDeviceFingerprint,
  hashFingerprint,
  calculateDeviceTrustScore,
  detectFingerprintChanges,
  parseIPAddress,
  getDeviceCategory,
  isLikelyBot
};
