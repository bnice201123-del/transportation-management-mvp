/**
 * Phone Verification Routes
 * 
 * Endpoints for phone number verification via SMS.
 */

import express from 'express';
import PhoneVerification from '../models/PhoneVerification.js';
import User from '../models/User.js';
import { sendVerificationCode } from '../services/smsService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * @route   POST /api/phone-verification/send
 * @desc    Send verification code to phone number
 * @access  Public (with rate limiting)
 */
router.post('/send', passwordResetLimiter, async (req, res) => {
  try {
    const { phoneNumber, purpose = 'registration' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check rate limiting - max 3 attempts per hour per phone
    const recentAttempts = await PhoneVerification.getRecentAttempts(phoneNumber, 1);
    if (recentAttempts >= 3) {
      return res.status(429).json({
        message: 'Too many verification requests. Please try again later.',
        retryAfter: 3600 // 1 hour in seconds
      });
    }

    // For authenticated users, use their ID
    let userId = req.user?._id;

    // For registration, check if phone already exists
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ phone: phoneNumber });
      if (existingUser) {
        return res.status(409).json({
          message: 'This phone number is already registered'
        });
      }
      // Create temporary verification without user (will link later on registration)
      userId = null;
    } else if (!userId) {
      // For other purposes, user must be authenticated
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Create verification
    const { verificationId, code, expiresAt } = await PhoneVerification.createVerification(
      userId,
      phoneNumber,
      purpose,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );

    // Send SMS
    const smsResult = await sendVerificationCode(phoneNumber, code, purpose);

    if (!smsResult.success) {
      return res.status(500).json({
        message: 'Failed to send verification code',
        error: smsResult.error
      });
    }

    // Log audit
    await logAudit({
      userId: userId || null,
      action: 'phone_verification_sent',
      category: 'authentication',
      details: { phoneNumber, purpose },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Verification code sent successfully',
      verificationId,
      expiresAt,
      ...(smsResult.simulated && { code }) // Only include code in dev mode
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      message: 'Failed to send verification code',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/phone-verification/verify
 * @desc    Verify phone number with code
 * @access  Public
 */
router.post('/verify', authLimiter, async (req, res) => {
  try {
    const { phoneNumber, code, purpose } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: 'Phone number and code are required' });
    }

    // Verify code
    const result = await PhoneVerification.verifyCode(phoneNumber, code, purpose);

    if (!result.success) {
      // Log failed attempt
      await logAudit({
        userId: null,
        action: 'phone_verification_failed',
        category: 'authentication',
        details: { phoneNumber, purpose, errorCode: result.code, attemptsRemaining: result.attemptsRemaining },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.status(400).json(result);
    }

    // Update user's phone verification status if user exists
    if (result.userId) {
      await User.findByIdAndUpdate(result.userId, {
        phoneVerified: true,
        phoneVerifiedAt: result.verifiedAt
      });
    }

    // Log successful verification
    await logAudit({
      userId: result.userId,
      action: 'phone_verification_success',
      category: 'authentication',
      details: { phoneNumber, purpose },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Phone number verified successfully',
      verified: true,
      verifiedAt: result.verifiedAt
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      message: 'Failed to verify phone number',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/phone-verification/resend
 * @desc    Resend verification code
 * @access  Public (with rate limiting)
 */
router.post('/resend', passwordResetLimiter, async (req, res) => {
  try {
    const { phoneNumber, purpose } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check rate limiting
    const recentAttempts = await PhoneVerification.getRecentAttempts(phoneNumber, 1);
    if (recentAttempts >= 5) {
      return res.status(429).json({
        message: 'Too many verification requests. Please try again later.',
        retryAfter: 3600
      });
    }

    // Create new verification
    const userId = req.user?._id || null;
    const { verificationId, code, expiresAt } = await PhoneVerification.createVerification(
      userId,
      phoneNumber,
      purpose,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );

    // Send SMS
    const smsResult = await sendVerificationCode(phoneNumber, code, purpose);

    if (!smsResult.success) {
      return res.status(500).json({
        message: 'Failed to send verification code',
        error: smsResult.error
      });
    }

    res.json({
      message: 'Verification code resent successfully',
      verificationId,
      expiresAt,
      ...(smsResult.simulated && { code })
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      message: 'Failed to resend verification code',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/phone-verification/status
 * @desc    Check phone verification status for current user
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('phone phoneVerified phoneVerifiedAt');

    res.json({
      phone: user.phone,
      verified: user.phoneVerified || false,
      verifiedAt: user.phoneVerifiedAt || null
    });
  } catch (error) {
    console.error('Phone status error:', error);
    res.status(500).json({
      message: 'Failed to get phone status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/phone-verification/update-phone
 * @desc    Update phone number (requires verification)
 * @access  Private
 */
router.post('/update-phone', authenticateToken, async (req, res) => {
  try {
    const { newPhone, verificationCode } = req.body;

    if (!newPhone || !verificationCode) {
      return res.status(400).json({ message: 'New phone number and verification code are required' });
    }

    // Verify the code
    const result = await PhoneVerification.verifyCode(newPhone, verificationCode, 'phone_change');

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Check if new phone is already in use
    const existing = await User.findOne({ phone: newPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ message: 'This phone number is already in use' });
    }

    // Update user's phone
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        phone: newPhone,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      },
      { new: true }
    ).select('-password -twoFactorSecret');

    // Log audit
    await logAudit({
      userId: req.user._id,
      action: 'user_updated',
      category: 'user_management',
      details: { field: 'phoneNumber', newPhone },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Phone number updated successfully',
      user
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({
      message: 'Failed to update phone number',
      error: error.message
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * @route   GET /api/phone-verification/admin/statistics
 * @desc    Get phone verification statistics
 * @access  Admin
 */
router.get('/admin/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await PhoneVerification.getStatistics(parseInt(days));

    res.json(stats);
  } catch (error) {
    console.error('Phone verification statistics error:', error);
    res.status(500).json({
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/phone-verification/admin/cleanup
 * @desc    Cleanup old verifications
 * @access  Admin
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    const result = await PhoneVerification.cleanup(daysOld);

    // Log audit
    await logAudit({
      userId: req.user._id,
      action: 'system_maintenance',
      category: 'system',
      details: { task: 'phone_verification_cleanup', deletedCount: result.deletedCount, daysOld },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: `Cleaned up ${result.deletedCount} old verifications`,
      ...result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      message: 'Failed to cleanup verifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/phone-verification/admin/recent
 * @desc    Get recent verifications
 * @access  Admin
 */
router.get('/admin/recent', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { limit = 50, status, purpose } = req.query;

    const query = {};
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;

    const verifications = await PhoneVerification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName username email')
      .select('-verificationCode');

    res.json({
      verifications,
      count: verifications.length
    });
  } catch (error) {
    console.error('Recent verifications error:', error);
    res.status(500).json({
      message: 'Failed to get recent verifications',
      error: error.message
    });
  }
});

export default router;
