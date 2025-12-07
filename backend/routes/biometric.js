/**
 * Biometric Authentication Routes
 * WebAuthn / FIDO2 biometric authentication endpoints
 */

import express from 'express';
import BiometricCredential from '../models/BiometricCredential.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { apiLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../utils/logger.js';
import webauthn from '../utils/webauthn.js';

const router = express.Router();

// Store challenges temporarily (in production, use Redis)
const challenges = new Map();

/**
 * @route   GET /api/biometric/supported
 * @desc    Check if biometric authentication is supported
 * @access  Public
 */
router.get('/supported', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isSupported = webauthn.isWebAuthnSupported(userAgent);
  
  res.json({
    success: true,
    supported: isSupported,
    userAgent
  });
});

/**
 * @route   POST /api/biometric/register/begin
 * @desc    Begin biometric registration (get challenge)
 * @access  Private
 */
router.post('/register/begin', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const user = {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name || req.user.email
    };

    const rpName = process.env.APP_NAME || 'Transportation Management';
    const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';

    const options = webauthn.generateRegistrationOptions(user, rpName, rpId);
    
    // Store challenge temporarily
    challenges.set(req.user.userId, {
      challenge: options.challenge,
      timestamp: Date.now()
    });

    // Clean up old challenges (older than 5 minutes)
    setTimeout(() => {
      for (const [userId, data] of challenges.entries()) {
        if (Date.now() - data.timestamp > 5 * 60 * 1000) {
          challenges.delete(userId);
        }
      }
    }, 1000);

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error beginning biometric registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to begin biometric registration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/biometric/register/complete
 * @desc    Complete biometric registration (verify and store credential)
 * @access  Private
 */
router.post('/register/complete', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { credential, deviceInfo } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Credential is required'
      });
    }

    // Get stored challenge
    const storedChallenge = challenges.get(req.user.userId);
    if (!storedChallenge) {
      return res.status(400).json({
        success: false,
        message: 'No registration in progress'
      });
    }

    // Verify the credential
    const expectedOrigin = process.env.FRONTEND_URL || 'http://localhost:5174';
    const expectedRPID = process.env.WEBAUTHN_RP_ID || 'localhost';

    const verification = await webauthn.verifyRegistrationResponse(
      credential,
      storedChallenge.challenge,
      expectedOrigin,
      expectedRPID
    );

    if (!verification.verified) {
      challenges.delete(req.user.userId);
      return res.status(400).json({
        success: false,
        message: 'Credential verification failed',
        error: verification.error
      });
    }

    // Format and store credential
    const credentialData = webauthn.formatCredentialForStorage(verification, deviceInfo);
    
    const biometricCredential = new BiometricCredential({
      userId: req.user.userId,
      ...credentialData,
      registrationIP: req.ip,
      registrationLocation: {
        // These would come from a geolocation service in production
        country: req.headers['cf-ipcountry'] || 'Unknown',
        region: 'Unknown',
        city: 'Unknown'
      }
    });

    await biometricCredential.save();

    // Clean up challenge
    challenges.delete(req.user.userId);

    await logActivity(req.user.userId, 'biometric', 'register', 'security', {
      credentialId: biometricCredential._id,
      authenticatorType: credentialData.authenticator.type
    });

    res.json({
      success: true,
      message: 'Biometric authentication registered successfully',
      credential: {
        id: biometricCredential._id,
        friendlyName: biometricCredential.friendlyName,
        registeredAt: biometricCredential.registeredAt
      }
    });
  } catch (error) {
    console.error('Error completing biometric registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete biometric registration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/biometric/authenticate/begin
 * @desc    Begin biometric authentication (get challenge)
 * @access  Public (but needs email)
 */
router.post('/authenticate/begin', apiLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user's credentials (simplified - in production, look up user first)
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return res.status(400).json({
        success: false,
        message: 'Invalid email or no biometric credentials registered'
      });
    }

    const credentials = await BiometricCredential.getUserCredentials(user._id);

    if (credentials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No biometric credentials registered'
      });
    }

    const rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
    const allowCredentials = credentials.map(c => c.credentialId);

    const options = webauthn.generateAuthenticationOptions(allowCredentials, rpId);
    
    // Store challenge temporarily
    challenges.set(user._id.toString(), {
      challenge: options.challenge,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error beginning biometric authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to begin biometric authentication',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/biometric/authenticate/complete
 * @desc    Complete biometric authentication (verify and issue token)
 * @access  Public
 */
router.post('/authenticate/complete', apiLimiter, async (req, res) => {
  try {
    const { credential, email } = req.body;

    if (!credential || !email) {
      return res.status(400).json({
        success: false,
        message: 'Credential and email are required'
      });
    }

    // Find user
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    // Get stored challenge
    const storedChallenge = challenges.get(user._id.toString());
    if (!storedChallenge) {
      return res.status(400).json({
        success: false,
        message: 'No authentication in progress'
      });
    }

    // Find the credential
    const biometricCredential = await BiometricCredential.findByCredentialId(credential.id);

    if (!biometricCredential || biometricCredential.userId.toString() !== user._id.toString()) {
      challenges.delete(user._id.toString());
      return res.status(400).json({
        success: false,
        message: 'Invalid credential'
      });
    }

    // Verify the authentication
    const expectedOrigin = process.env.FRONTEND_URL || 'http://localhost:5174';
    const expectedRPID = process.env.WEBAUTHN_RP_ID || 'localhost';

    const verification = await webauthn.verifyAuthenticationResponse(
      credential,
      storedChallenge.challenge,
      expectedOrigin,
      expectedRPID,
      biometricCredential.publicKey,
      biometricCredential.counter
    );

    if (!verification.verified) {
      challenges.delete(user._id.toString());
      return res.status(400).json({
        success: false,
        message: 'Authentication verification failed',
        error: verification.error
      });
    }

    // Update credential usage
    await biometricCredential.recordUse(verification.counter);

    // Clean up challenge
    challenges.delete(user._id.toString());

    // Generate JWT token (using existing auth logic)
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(user._id, 'biometric', 'authenticate', 'security', {
      credentialId: biometricCredential._id,
      success: true
    });

    res.json({
      success: true,
      message: 'Biometric authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error completing biometric authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete biometric authentication',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/biometric/credentials
 * @desc    Get user's biometric credentials
 * @access  Private
 */
router.get('/credentials', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const credentials = await BiometricCredential.getUserCredentials(req.user.userId, false);

    res.json({
      success: true,
      count: credentials.length,
      credentials: credentials.map(c => ({
        id: c._id,
        friendlyName: c.friendlyName,
        authenticatorType: c.authenticator?.type,
        deviceInfo: c.deviceInfo,
        registeredAt: c.registeredAt,
        lastUsed: c.lastUsed,
        usageCount: c.usageCount,
        isActive: c.isActive
      }))
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credentials',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/biometric/credentials/:credentialId/name
 * @desc    Update credential friendly name
 * @access  Private
 */
router.put('/credentials/:credentialId/name', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { friendlyName } = req.body;

    if (!friendlyName) {
      return res.status(400).json({
        success: false,
        message: 'Friendly name is required'
      });
    }

    const credential = await BiometricCredential.findOne({
      _id: req.params.credentialId,
      userId: req.user.userId
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    await credential.updateName(friendlyName);

    res.json({
      success: true,
      message: 'Credential name updated',
      credential: {
        id: credential._id,
        friendlyName: credential.friendlyName
      }
    });
  } catch (error) {
    console.error('Error updating credential name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update credential name',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/biometric/credentials/:credentialId
 * @desc    Revoke a biometric credential
 * @access  Private
 */
router.delete('/credentials/:credentialId', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const credential = await BiometricCredential.findOne({
      _id: req.params.credentialId,
      userId: req.user.userId
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    await credential.revoke('User revocation');

    await logActivity(req.user.userId, 'biometric', 'revoke', 'security', {
      credentialId: credential._id
    });

    res.json({
      success: true,
      message: 'Biometric credential revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke credential',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/biometric/stats
 * @desc    Get user's biometric statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const stats = await BiometricCredential.getUserStats(req.user.userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching biometric stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch biometric statistics',
      error: error.message
    });
  }
});

// Admin Routes

/**
 * @route   GET /api/biometric/admin/statistics
 * @desc    Get global biometric statistics (admin)
 * @access  Admin
 */
router.get('/admin/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const stats = await BiometricCredential.getGlobalStats();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching global statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/biometric/admin/cleanup
 * @desc    Clean up old revoked credentials (admin)
 * @access  Admin
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;

    const deletedCount = await BiometricCredential.cleanupRevoked(daysOld);

    await logActivity(req.user.userId, 'biometric', 'admin_cleanup', 'security', {
      daysOld,
      deletedCount
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old credentials`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up credentials',
      error: error.message
    });
  }
});

export default router;
