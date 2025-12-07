/**
 * Login Attempts Routes
 * Monitor and analyze login attempts
 */

import express from 'express';
import LoginAttempt from '../models/LoginAttempt.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { adminLimiter, apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// User Routes (view own login attempts)

/**
 * @route   GET /api/login-attempts/my-attempts
 * @desc    Get current user's login attempts
 * @access  Private
 */
router.get('/my-attempts', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { limit = 50, success, suspicious } = req.query;
    
    const options = {
      limit: parseInt(limit),
      success: success !== undefined ? success === 'true' : undefined,
      suspicious: suspicious === 'true'
    };

    const attempts = await LoginAttempt.getUserAttempts(req.user.userId, options);

    res.json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login attempts',
      error: error.message
    });
  }
});

// Admin Routes

/**
 * @route   GET /api/login-attempts/admin/dashboard
 * @desc    Get login attempts dashboard data (admin)
 * @access  Admin
 */
router.get('/admin/dashboard', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { timeWindow = 24 } = req.query; // hours
    const timeWindowMs = parseInt(timeWindow) * 60 * 60 * 1000;

    const statistics = await LoginAttempt.getStatistics({ timeWindow: timeWindowMs });
    const hourlyTrends = await LoginAttempt.getHourlyTrends(parseInt(timeWindow));

    // Get recent suspicious attempts
    const recentSuspicious = await LoginAttempt.find({
      isSuspicious: true,
      createdAt: { $gte: new Date(Date.now() - timeWindowMs) }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email role')
      .lean();

    // Get recent failed attempts
    const recentFailed = await LoginAttempt.find({
      success: false,
      createdAt: { $gte: new Date(Date.now() - timeWindowMs) }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email role')
      .lean();

    res.json({
      success: true,
      statistics,
      hourlyTrends,
      recentSuspicious,
      recentFailed
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/all
 * @desc    Get all login attempts with filtering (admin)
 * @access  Admin
 */
router.get('/admin/all', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      success,
      suspicious,
      userId,
      email,
      ip,
      deviceFingerprint,
      failureReason,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Apply filters
    if (success !== undefined) query.success = success === 'true';
    if (suspicious === 'true') query.isSuspicious = true;
    if (userId) query.userId = userId;
    if (email) query.email = email.toLowerCase();
    if (ip) query['location.ip'] = ip;
    if (deviceFingerprint) query.deviceFingerprint = deviceFingerprint;
    if (failureReason) query.failureReason = failureReason;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attempts, total] = await Promise.all([
      LoginAttempt.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LoginAttempt.countDocuments(query)
    ]);

    res.json({
      success: true,
      attempts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login attempts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/statistics
 * @desc    Get comprehensive login attempt statistics (admin)
 * @access  Admin
 */
router.get('/admin/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { timeWindow = 24 } = req.query; // hours
    const timeWindowMs = parseInt(timeWindow) * 60 * 60 * 1000;

    const statistics = await LoginAttempt.getStatistics({ timeWindow: timeWindowMs });

    // Additional statistics
    const [
      totalAllTime,
      successfulAllTime,
      suspiciousAllTime,
      patternsAllTime
    ] = await Promise.all([
      LoginAttempt.countDocuments(),
      LoginAttempt.countDocuments({ success: true }),
      LoginAttempt.countDocuments({ isSuspicious: true }),
      LoginAttempt.countDocuments({ isPartOfPattern: true })
    ]);

    // Get statistics by auth method
    const byAuthMethod = await LoginAttempt.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - timeWindowMs) }
        }
      },
      {
        $group: {
          _id: '$authMethod',
          count: { $sum: 1 },
          successful: {
            $sum: { $cond: ['$success', 1, 0] }
          }
        }
      }
    ]);

    // Get statistics by device type
    const byDeviceType = await LoginAttempt.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - timeWindowMs) }
        }
      },
      {
        $group: {
          _id: '$deviceInfo.device.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      statistics: {
        ...statistics,
        allTime: {
          total: totalAllTime,
          successful: successfulAllTime,
          suspicious: suspiciousAllTime,
          patterns: patternsAllTime
        },
        byAuthMethod: byAuthMethod.map(m => ({
          method: m._id,
          count: m.count,
          successful: m.successful,
          successRate: ((m.successful / m.count) * 100).toFixed(2)
        })),
        byDeviceType: byDeviceType.map(d => ({
          type: d._id || 'unknown',
          count: d.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/user/:userId
 * @desc    Get login attempts for specific user (admin)
 * @access  Admin
 */
router.get('/admin/user/:userId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const attempts = await LoginAttempt.getUserAttempts(req.params.userId, {
      limit: parseInt(limit)
    });

    // Get user statistics
    const stats = {
      total: attempts.length,
      successful: attempts.filter(a => a.success).length,
      failed: attempts.filter(a => !a.success).length,
      suspicious: attempts.filter(a => a.isSuspicious).length
    };

    res.json({
      success: true,
      userId: req.params.userId,
      stats,
      attempts
    });
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user login attempts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/email/:email
 * @desc    Get login attempts by email (admin)
 * @access  Admin
 */
router.get('/admin/email/:email', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { limit = 100, timeWindow = 24 } = req.query;
    const timeWindowMs = parseInt(timeWindow) * 60 * 60 * 1000;

    const attempts = await LoginAttempt.getAttemptsByEmail(req.params.email, {
      limit: parseInt(limit),
      timeWindow: timeWindowMs
    });

    // Check for brute force
    const bruteForceCheck = await LoginAttempt.detectBruteForce(req.params.email);

    res.json({
      success: true,
      email: req.params.email,
      count: attempts.length,
      bruteForceDetected: bruteForceCheck.isBruteForce,
      bruteForceDetails: bruteForceCheck,
      attempts
    });
  } catch (error) {
    console.error('Error fetching email attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email login attempts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/ip/:ip
 * @desc    Get login attempts by IP address (admin)
 * @access  Admin
 */
router.get('/admin/ip/:ip', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { limit = 100, timeWindow = 24 } = req.query;
    const timeWindowMs = parseInt(timeWindow) * 60 * 60 * 1000;

    const attempts = await LoginAttempt.getAttemptsByIP(req.params.ip, {
      limit: parseInt(limit),
      timeWindow: timeWindowMs
    });

    // Get unique accounts attempted from this IP
    const uniqueEmails = [...new Set(attempts.map(a => a.email))];

    res.json({
      success: true,
      ip: req.params.ip,
      count: attempts.length,
      uniqueAccounts: uniqueEmails.length,
      accounts: uniqueEmails,
      attempts
    });
  } catch (error) {
    console.error('Error fetching IP attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IP login attempts',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/login-attempts/admin/detect-patterns
 * @desc    Detect attack patterns (admin)
 * @access  Admin
 */
router.post('/admin/detect-patterns', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { ip, deviceFingerprint, email } = req.body;

    const patterns = [];

    // Check for brute force
    if (email) {
      const bruteForce = await LoginAttempt.detectBruteForce(email);
      if (bruteForce.isBruteForce) {
        patterns.push({
          type: 'brute_force',
          target: email,
          details: bruteForce
        });
      }
    }

    // Check for credential stuffing
    if (ip || deviceFingerprint) {
      const credentialStuffing = await LoginAttempt.detectCredentialStuffing(
        ip,
        deviceFingerprint
      );
      if (credentialStuffing.isCredentialStuffing) {
        patterns.push({
          type: 'credential_stuffing',
          source: ip || deviceFingerprint,
          details: credentialStuffing
        });
      }
    }

    res.json({
      success: true,
      patternsDetected: patterns.length > 0,
      patterns
    });
  } catch (error) {
    console.error('Error detecting patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect patterns',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/login-attempts/admin/:attemptId/review
 * @desc    Mark an attempt as reviewed (admin)
 * @access  Admin
 */
router.post('/admin/:attemptId/review', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { notes } = req.body;

    const attempt = await LoginAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Login attempt not found'
      });
    }

    await attempt.markReviewed(req.user.userId, notes);

    res.json({
      success: true,
      message: 'Login attempt marked as reviewed',
      attempt
    });
  } catch (error) {
    console.error('Error reviewing attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review login attempt',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/suspicious
 * @desc    Get all suspicious login attempts (admin)
 * @access  Admin
 */
router.get('/admin/suspicious', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 50, reviewed } = req.query;

    const query = { isSuspicious: true };
    if (reviewed !== undefined) query.reviewed = reviewed === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attempts, total] = await Promise.all([
      LoginAttempt.find(query)
        .populate('userId', 'name email role')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      LoginAttempt.countDocuments(query)
    ]);

    res.json({
      success: true,
      attempts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching suspicious attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suspicious attempts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/login-attempts/admin/trends
 * @desc    Get login attempt trends (admin)
 * @access  Admin
 */
router.get('/admin/trends', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const hourlyTrends = await LoginAttempt.getHourlyTrends(parseInt(hours));

    // Format trends for easier consumption
    const formattedTrends = Array.from({ length: parseInt(hours) }, (_, i) => {
      const hour = i;
      const successful = hourlyTrends.find(t => t._id.hour === hour && t._id.success)?.count || 0;
      const failed = hourlyTrends.find(t => t._id.hour === hour && !t._id.success)?.count || 0;
      
      return {
        hour,
        successful,
        failed,
        total: successful + failed
      };
    });

    res.json({
      success: true,
      trends: formattedTrends
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error.message
    });
  }
});

export default router;
