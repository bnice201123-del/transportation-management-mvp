import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getRateLimitInfo, resetRateLimit, getRateLimitStats } from '../middleware/rateLimiter.js';
import RateLimitViolation from '../models/RateLimitViolation.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * GET /api/rate-limit/info
 * Get current user's rate limit info
 */
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const key = req.user?._id ? `user:${req.user._id}` : `ip:${req.ip}`;
    const info = await getRateLimitInfo(key);

    res.json({
      key,
      limits: info || {},
      message: info ? 'Rate limit information retrieved' : 'Using memory store - info not available'
    });
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    res.status(500).json({
      message: 'Failed to get rate limit information',
      error: error.message
    });
  }
});

/**
 * GET /api/rate-limit/violations
 * Get user's own violations
 */
router.get('/violations', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, startDate } = req.query;
    
    const violations = await RateLimitViolation.getByUser(req.user._id, {
      limit: parseInt(limit),
      startDate
    });

    res.json({
      violations: violations.map(v => ({
        id: v._id,
        endpoint: v.endpoint,
        method: v.method,
        limiterType: v.limiterType,
        severity: v.severity,
        violatedAt: v.violatedAt,
        responseMessage: v.responseMessage
      })),
      total: violations.length
    });
  } catch (error) {
    console.error('Error getting violations:', error);
    res.status(500).json({
      message: 'Failed to get violations',
      error: error.message
    });
  }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/rate-limit/admin/stats
 * Get rate limit statistics (admin only)
 */
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const redisStats = await getRateLimitStats();
    const { startDate, endDate, limiterType, severity } = req.query;

    const violationStats = await RateLimitViolation.getStatistics({
      startDate,
      endDate,
      limiterType,
      severity
    });

    res.json({
      redis: redisStats,
      violations: violationStats
    });
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    res.status(500).json({
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/rate-limit/admin/violations
 * Get all violations with filtering (admin only)
 */
router.get('/admin/violations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      limiterType,
      severity,
      ipAddress,
      userId,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (limiterType) query.limiterType = limiterType;
    if (severity) query.severity = severity;
    if (ipAddress) query.ipAddress = ipAddress;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.violatedAt = {};
      if (startDate) query.violatedAt.$gte = new Date(startDate);
      if (endDate) query.violatedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const violations = await RateLimitViolation.find(query)
      .populate('userId', 'firstName lastName email username role')
      .sort({ violatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RateLimitViolation.countDocuments(query);

    res.json({
      violations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting violations:', error);
    res.status(500).json({
      message: 'Failed to get violations',
      error: error.message
    });
  }
});

/**
 * GET /api/rate-limit/admin/violations/ip/:ipAddress
 * Get violations by IP (admin only)
 */
router.get('/admin/violations/ip/:ipAddress', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const { limit = 50, startDate } = req.query;

    const violations = await RateLimitViolation.getByIP(ipAddress, {
      limit: parseInt(limit),
      startDate
    });

    const shouldBlock = await RateLimitViolation.shouldBlockIP(ipAddress);

    res.json({
      ipAddress,
      violations,
      total: violations.length,
      shouldBlock,
      recommendation: shouldBlock ? 'Consider blocking this IP' : 'No action needed'
    });
  } catch (error) {
    console.error('Error getting violations by IP:', error);
    res.status(500).json({
      message: 'Failed to get violations',
      error: error.message
    });
  }
});

/**
 * GET /api/rate-limit/admin/violations/user/:userId
 * Get violations by user (admin only)
 */
router.get('/admin/violations/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, startDate } = req.query;

    const violations = await RateLimitViolation.getByUser(userId, {
      limit: parseInt(limit),
      startDate
    });

    res.json({
      userId,
      violations,
      total: violations.length
    });
  } catch (error) {
    console.error('Error getting violations by user:', error);
    res.status(500).json({
      message: 'Failed to get violations',
      error: error.message
    });
  }
});

/**
 * GET /api/rate-limit/admin/suspicious-ips
 * Get suspicious IPs (admin only)
 */
router.get('/admin/suspicious-ips', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { minViolations = 10, timeWindow = 3600000 } = req.query;

    const suspiciousIPs = await RateLimitViolation.getSuspiciousIPs({
      minViolations: parseInt(minViolations),
      timeWindow: parseInt(timeWindow)
    });

    res.json({
      suspiciousIPs,
      total: suspiciousIPs.length,
      criteria: {
        minViolations: parseInt(minViolations),
        timeWindow: parseInt(timeWindow)
      }
    });
  } catch (error) {
    console.error('Error getting suspicious IPs:', error);
    res.status(500).json({
      message: 'Failed to get suspicious IPs',
      error: error.message
    });
  }
});

/**
 * POST /api/rate-limit/admin/reset/:key
 * Reset rate limit for specific key (admin only)
 */
router.post('/admin/reset/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const success = await resetRateLimit(key);

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'rate_limit_reset',
      category: 'security',
      description: `Reset rate limit for key: ${key}`,
      targetType: 'RateLimit',
      targetId: key,
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'warning',
      success: true
    });

    if (success) {
      res.json({
        message: 'Rate limit reset successfully',
        key
      });
    } else {
      res.status(404).json({
        message: 'No rate limit found for this key or Redis not configured',
        key
      });
    }
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    res.status(500).json({
      message: 'Failed to reset rate limit',
      error: error.message
    });
  }
});

/**
 * POST /api/rate-limit/admin/cleanup
 * Clean up old violations (admin only)
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;

    if (daysOld < 7) {
      return res.status(400).json({
        message: 'Cannot delete violations newer than 7 days'
      });
    }

    const deletedCount = await RateLimitViolation.cleanup(daysOld);

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'rate_limit_cleanup',
      category: 'system',
      description: `Cleaned up ${deletedCount} old rate limit violations`,
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'], daysOld },
      severity: 'info',
      success: true
    });

    res.json({
      message: 'Cleanup completed',
      deletedCount,
      daysOld
    });
  } catch (error) {
    console.error('Error cleaning up violations:', error);
    res.status(500).json({
      message: 'Failed to clean up violations',
      error: error.message
    });
  }
});

/**
 * DELETE /api/rate-limit/admin/violations/:id
 * Delete specific violation (admin only)
 */
router.delete('/admin/violations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const violation = await RateLimitViolation.findByIdAndDelete(id);

    if (!violation) {
      return res.status(404).json({
        message: 'Violation not found'
      });
    }

    res.json({
      message: 'Violation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting violation:', error);
    res.status(500).json({
      message: 'Failed to delete violation',
      error: error.message
    });
  }
});

export default router;
