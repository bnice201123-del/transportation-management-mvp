import crypto from 'crypto';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return {};

  const deviceInfo = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown',
    isMobile: false,
    isDesktop: false,
    isTablet: false
  };

  // Browser detection
  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) deviceInfo.browser = 'Chrome';
  else if (/Firefox/.test(userAgent)) deviceInfo.browser = 'Firefox';
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) deviceInfo.browser = 'Safari';
  else if (/Edg/.test(userAgent)) deviceInfo.browser = 'Edge';
  else if (/MSIE|Trident/.test(userAgent)) deviceInfo.browser = 'Internet Explorer';

  // OS detection
  if (/Windows/.test(userAgent)) deviceInfo.os = 'Windows';
  else if (/Mac OS X/.test(userAgent)) deviceInfo.os = 'macOS';
  else if (/Linux/.test(userAgent)) deviceInfo.os = 'Linux';
  else if (/Android/.test(userAgent)) deviceInfo.os = 'Android';
  else if (/iOS|iPhone|iPad/.test(userAgent)) deviceInfo.os = 'iOS';

  // Device type detection
  if (/Mobile|Android|iPhone/.test(userAgent)) {
    deviceInfo.device = 'Mobile';
    deviceInfo.isMobile = true;
  } else if (/Tablet|iPad/.test(userAgent)) {
    deviceInfo.device = 'Tablet';
    deviceInfo.isTablet = true;
  } else {
    deviceInfo.device = 'Desktop';
    deviceInfo.isDesktop = true;
  }

  return deviceInfo;
}

/**
 * Create a hash of the JWT token for secure storage
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Middleware to create session on successful login
 */
export const createSession = async (req, res, next) => {
  // This middleware should be called AFTER token generation
  // It expects req.user and req.token to be set by the login handler
  
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const tokenHash = hashToken(req.token);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Decode token to get expiration
    const decoded = jwt.decode(req.token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Create session
    const session = await Session.createSession({
      userId: req.user._id,
      token: req.token,
      tokenHash,
      ipAddress,
      userAgent,
      deviceInfo,
      loginMethod: req.loginMethod || 'password',
      expiresIn: expiresAt - Date.now()
    });

    // Check for anomalies
    const anomalies = await Session.detectAnomalies(req.user._id);
    if (anomalies.length > 0) {
      const reasons = anomalies.map(a => a.type);
      await Session.markSuspicious(session._id, reasons);
      
      console.warn(`Suspicious session detected for user ${req.user.username}:`, anomalies);
    }

    // Attach session to request for further use
    req.session = session;

    next();
  } catch (error) {
    console.error('Error creating session:', error);
    // Don't fail the login if session creation fails
    next();
  }
};

/**
 * Middleware to track session activity
 */
export const trackActivity = async (req, res, next) => {
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const tokenHash = hashToken(req.token);
    await Session.updateActivity(tokenHash);
  } catch (error) {
    console.error('Error tracking session activity:', error);
    // Don't fail the request if activity tracking fails
  }

  next();
};

/**
 * Middleware to validate session is still active
 */
export const validateSession = async (req, res, next) => {
  if (!req.user || !req.token) {
    return next();
  }

  try {
    const tokenHash = hashToken(req.token);
    
    const session = await Session.findOne({
      tokenHash,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired',
        code: 'SESSION_INVALID'
      });
    }

    // Check if session is suspicious
    if (session.isSuspicious) {
      console.warn(`Suspicious session accessed: ${session._id}`, {
        user: req.user.username,
        reasons: session.suspiciousReasons
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('Error validating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating session',
      error: error.message
    });
  }
};

/**
 * Middleware to revoke session on logout
 */
export const revokeSession = async (req, res, next) => {
  if (!req.token) {
    return next();
  }

  try {
    const tokenHash = hashToken(req.token);
    
    await Session.findOneAndUpdate(
      { tokenHash },
      {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'user-logout'
      }
    );
  } catch (error) {
    console.error('Error revoking session:', error);
    // Don't fail logout if session revocation fails
  }

  next();
};

/**
 * Helper: Get current session from token
 */
export async function getSessionFromToken(token) {
  const tokenHash = hashToken(token);
  return Session.findOne({ tokenHash, isActive: true }).populate('userId');
}

/**
 * Helper: Revoke all sessions for a user (e.g., on password change)
 */
export async function revokeAllUserSessions(userId, revokedBy = null, reason = 'security-breach') {
  return Session.revokeAllUserSessions(userId, revokedBy, reason);
}

/**
 * Helper: Extract token from request
 */
export function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export default {
  createSession,
  trackActivity,
  validateSession,
  revokeSession,
  getSessionFromToken,
  revokeAllUserSessions,
  extractToken,
  hashToken
};
