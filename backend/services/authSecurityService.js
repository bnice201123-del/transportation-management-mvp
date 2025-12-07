/**
 * Enhanced Authentication Service
 * Integrates all security features into the login flow
 */

import TrustedDevice from '../models/TrustedDevice.js';
import LoginAttempt from '../models/LoginAttempt.js';
import GeoSecurityRule from '../models/GeoSecurityRule.js';
import deviceFingerprintUtils from '../utils/deviceFingerprint.js';

/**
 * Process login with all security checks
 * @param {Object} req - Express request
 * @param {Object} user - User object
 * @param {Object} options - Additional options
 * @returns {Object} Security assessment result
 */
export const processSecureLogin = async (req, user, options = {}) => {
  const startTime = Date.now();
  
  try {
    // 1. Generate device fingerprint
    const clientData = req.body.deviceFingerprint || {};
    const fingerprintData = deviceFingerprintUtils.generateDeviceFingerprint(req, clientData);
    
    // 2. Extract location info
    const location = {
      ip: req.ip || req.connection.remoteAddress,
      country: req.headers['cf-ipcountry'] || clientData.country || 'Unknown',
      region: clientData.region || 'Unknown',
      city: clientData.city || 'Unknown',
      latitude: clientData.latitude,
      longitude: clientData.longitude,
      timezone: clientData.timezone || fingerprintData.timezone
    };

    // 3. Check geo-security rules
    const geoEvaluation = await GeoSecurityRule.evaluateLocation(
      user._id,
      user.role,
      location
    );

    // If denied by geo rules, record failed attempt and return
    if (!geoEvaluation.allowed) {
      await recordFailedAttempt(req, user, 'geo_restriction', fingerprintData, location);
      return {
        allowed: false,
        reason: 'geo_restriction',
        message: geoEvaluation.denyReason || 'Access denied from this location',
        requiresAction: false
      };
    }

    // 4. Find or create trusted device
    const device = await TrustedDevice.findOrCreateDevice(
      user._id,
      fingerprintData.fingerprint,
      fingerprintData,
      {
        screen: fingerprintData.screen,
        timezone: fingerprintData.timezone,
        language: req.headers['accept-language'],
        hardwareConcurrency: fingerprintData.hardwareConcurrency,
        deviceMemory: fingerprintData.deviceMemory,
        touchSupport: fingerprintData.touchSupport
      }
    );

    // 5. Check if device is blocked
    if (device.isBlocked) {
      await recordFailedAttempt(req, user, 'device_not_trusted', fingerprintData, location);
      return {
        allowed: false,
        reason: 'device_blocked',
        message: device.blockedReason || 'This device has been blocked',
        requiresAction: false
      };
    }

    // 6. Check device fingerprint changes
    const fingerprintChanges = deviceFingerprintUtils.detectFingerprintChanges(
      device.deviceInfo,
      fingerprintData
    );

    if (fingerprintChanges.hasChanges && fingerprintChanges.severity === 'high') {
      // Significant device changes detected
      await device.updateFingerprint(fingerprintData.fingerprint, fingerprintChanges.changes);
      
      return {
        allowed: true,
        requiresVerification: true,
        reason: 'device_changed',
        message: 'Significant device changes detected. Additional verification required.',
        device,
        changes: fingerprintChanges
      };
    }

    // 7. Check geo-security requirements
    if (geoEvaluation.requires2FA && !options.twoFactorVerified) {
      return {
        allowed: true,
        requires2FA: true,
        reason: 'geo_requires_2fa',
        message: geoEvaluation.customMessage || 'Two-factor authentication required from this location',
        device
      };
    }

    if (geoEvaluation.shouldChallenge) {
      return {
        allowed: true,
        requiresChallenge: true,
        challengeType: geoEvaluation.challengeType,
        reason: 'geo_challenge',
        message: geoEvaluation.customMessage || 'Additional verification required',
        device
      };
    }

    // 8. Calculate device trust score
    const trustScore = deviceFingerprintUtils.calculateDeviceTrustScore(device, fingerprintData);
    await device.updateTrustScore(deviceFingerprintUtils);

    // 9. Update device with successful login
    await device.recordSuccessfulLogin(location);

    // 10. Record successful login attempt
    const duration = Date.now() - startTime;
    await LoginAttempt.recordAttempt({
      userId: user._id,
      email: user.email,
      success: true,
      deviceFingerprint: fingerprintData.fingerprint,
      deviceInfo: fingerprintData,
      location,
      authMethod: options.authMethod || 'password',
      sessionId: options.sessionId,
      tokenIssued: true,
      requestHeaders: {
        userAgent: req.headers['user-agent'],
        acceptLanguage: req.headers['accept-language'],
        referer: req.headers['referer']
      },
      attemptDuration: duration
    });

    // 11. Check for alerts
    if (geoEvaluation.shouldAlert) {
      // TODO: Send alerts to admins
      console.log(`[SECURITY ALERT] User ${user.email} logged in from ${location.country}`);
    }

    return {
      allowed: true,
      device,
      trustScore,
      location,
      geoEvaluation,
      fingerprintData,
      requiresVerification: false,
      requires2FA: false,
      requiresChallenge: false
    };

  } catch (error) {
    console.error('Error in processSecureLogin:', error);
    
    // Record failed attempt due to error
    await recordFailedAttempt(req, user, 'other', null, null, error.message);
    
    // Don't block login on security check errors
    return {
      allowed: true,
      securityChecksFailed: true,
      error: error.message,
      fallbackMode: true
    };
  }
};

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = async (req, user, failureReason, fingerprintData, location, additionalInfo = null) => {
  try {
    const duration = Date.now();
    
    await LoginAttempt.recordAttempt({
      userId: user._id,
      email: user.email,
      success: false,
      failureReason,
      deviceFingerprint: fingerprintData?.fingerprint,
      deviceInfo: fingerprintData,
      location: location || {
        ip: req.ip || req.connection.remoteAddress,
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown'
      },
      authMethod: 'password',
      requestHeaders: {
        userAgent: req.headers['user-agent'],
        acceptLanguage: req.headers['accept-language'],
        referer: req.headers['referer']
      },
      attemptDuration: duration,
      metadata: additionalInfo ? { error: additionalInfo } : null
    });

    // Update device with failed attempt if exists
    if (fingerprintData?.fingerprint) {
      const device = await TrustedDevice.findOne({
        userId: user._id,
        fingerprint: fingerprintData.fingerprint
      });

      if (device) {
        await device.recordFailedAttempt();
      }
    }
  } catch (error) {
    console.error('Error recording failed attempt:', error);
  }
};

/**
 * Check if brute force attack is in progress
 * @param {String} email - User email
 * @returns {Object} Brute force check result
 */
export const checkBruteForce = async (email) => {
  try {
    const result = await LoginAttempt.detectBruteForce(email);
    return result;
  } catch (error) {
    console.error('Error checking brute force:', error);
    return { isBruteForce: false };
  }
};

/**
 * Check if credential stuffing attack is in progress
 * @param {String} ip - IP address
 * @param {String} deviceFingerprint - Device fingerprint
 * @returns {Object} Credential stuffing check result
 */
export const checkCredentialStuffing = async (ip, deviceFingerprint) => {
  try {
    const result = await LoginAttempt.detectCredentialStuffing(ip, deviceFingerprint);
    return result;
  } catch (error) {
    console.error('Error checking credential stuffing:', error);
    return { isCredentialStuffing: false };
  }
};

/**
 * Get device info from request
 * @param {Object} req - Express request
 * @returns {Object} Device info
 */
export const getDeviceInfo = (req) => {
  const clientData = req.body.deviceFingerprint || {};
  return deviceFingerprintUtils.generateDeviceFingerprint(req, clientData);
};

export default {
  processSecureLogin,
  recordFailedAttempt,
  checkBruteForce,
  checkCredentialStuffing,
  getDeviceInfo
};
