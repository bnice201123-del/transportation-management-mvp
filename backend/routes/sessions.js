import express from 'express';
import Session from '../models/Session.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { extractToken, hashToken, revokeAllUserSessions } from '../middleware/sessionTracking.js';
import { logAudit } from '../middleware/audit.js';
import { apiLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/sessions/my-sessions
 * Get current user's active sessions
 */
router.get('/my-sessions', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.getActiveSessions(req.user._id);
    
    // Mark current session
    const currentToken = extractToken(req);
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;
    
    const sessionsWithCurrent = sessions.map(session => ({
      ...session.toObject(),
      isCurrent: session.tokenHash === currentTokenHash
    }));

    res.json({
      sessions: sessionsWithCurrent,
      total: sessionsWithCurrent.length
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
});

/**
 * GET /api/sessions/history
 * Get current user's session history
 */
router.get('/history', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const { limit = 20, includeRevoked = true } = req.query;
    
    const sessions = await Session.getUserSessions(req.user._id, {
      limit: parseInt(limit),
      includeRevoked: includeRevoked === 'true'
    });

    res.json({
      sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({
      message: 'Failed to fetch session history',
      error: error.message
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Revoke a specific session (user can only revoke their own sessions)
 */
router.delete('/:sessionId', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session belongs to user
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only revoke your own sessions' });
    }

    await Session.revokeSession(sessionId, req.user._id, 'user-logout');

    // Log audit trail
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'session_revoked',
      category: 'security',
      description: `User revoked their own session`,
      targetType: 'Session',
      targetId: sessionId,
      metadata: { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId
      },
      severity: 'info',
      success: true
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({
      message: 'Failed to revoke session',
      error: error.message
    });
  }
});

/**
 * POST /api/sessions/revoke-all-except-current
 * Revoke all user sessions except the current one
 */
router.post('/revoke-all-except-current', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const currentToken = extractToken(req);
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;
    
    // Find current session ID
    const currentSession = await Session.findOne({ tokenHash: currentTokenHash });
    if (!currentSession) {
      return res.status(404).json({ message: 'Current session not found' });
    }

    const result = await Session.revokeAllExceptCurrent(
      req.user._id,
      currentSession._id,
      req.user._id,
      'user-logout'
    );

    // Log audit trail
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'sessions_revoked_bulk',
      category: 'security',
      description: `User revoked ${result.modifiedCount} session(s) except current`,
      metadata: { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        count: result.modifiedCount
      },
      severity: 'info',
      success: true
    });

    res.json({
      message: `Revoked ${result.modifiedCount} session(s)`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({
      message: 'Failed to revoke sessions',
      error: error.message
    });
  }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/sessions/admin/all
 * Get all sessions with filtering (admin only)
 */
router.get('/admin/all', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      isActive,
      isSuspicious,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (isActive) query.isActive = isActive === 'true';
    if (isSuspicious) query.isSuspicious = isSuspicious === 'true';

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const sessions = await Session.find(query)
      .populate('userId', 'firstName lastName email username role')
      .populate('revokedBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    res.status(500).json({
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
});

/**
 * GET /api/sessions/admin/stats
 * Get session statistics (admin only)
 */
router.get('/admin/stats', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const stats = await Session.getStatistics({
      startDate,
      endDate,
      userId
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching session statistics:', error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/sessions/admin/user/:userId
 * Get all sessions for a specific user (admin only)
 */
router.get('/admin/user/:userId', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, includeRevoked = true } = req.query;

    const sessions = await Session.getUserSessions(userId, {
      limit: parseInt(limit),
      includeRevoked: includeRevoked === 'true'
    });

    // Get anomalies for this user
    const anomalies = await Session.detectAnomalies(userId);

    res.json({
      sessions,
      total: sessions.length,
      anomalies
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      message: 'Failed to fetch user sessions',
      error: error.message
    });
  }
});

/**
 * GET /api/sessions/admin/suspicious
 * Get suspicious sessions (admin only)
 */
router.get('/admin/suspicious', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, minReasons = 1 } = req.query;

    const sessions = await Session.getSuspiciousSessions({
      limit: parseInt(limit),
      minReasons: parseInt(minReasons)
    });

    res.json({
      sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching suspicious sessions:', error);
    res.status(500).json({
      message: 'Failed to fetch suspicious sessions',
      error: error.message
    });
  }
});

/**
 * DELETE /api/sessions/admin/revoke/:sessionId
 * Revoke any session (admin only)
 */
router.delete('/admin/revoke/:sessionId', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'admin-revoke' } = req.body;

    const session = await Session.findById(sessionId).populate('userId');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await Session.revokeSession(sessionId, req.user._id, reason);

    // Log audit trail
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'session_revoked_admin',
      category: 'security',
      description: `Admin revoked session for user ${session.userId.username}`,
      targetType: 'Session',
      targetId: sessionId,
      metadata: { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        targetUserId: session.userId._id,
        targetUsername: session.userId.username,
        reason
      },
      severity: 'warning',
      success: true
    });

    res.json({
      message: 'Session revoked successfully',
      session: session.userId.username
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({
      message: 'Failed to revoke session',
      error: error.message
    });
  }
});

/**
 * POST /api/sessions/admin/revoke-all/:userId
 * Revoke all sessions for a user (admin only)
 */
router.post('/admin/revoke-all/:userId', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'admin-revoke' } = req.body;

    const result = await revokeAllUserSessions(userId, req.user._id, reason);

    // Get user info for audit log
    const User = (await import('../models/User.js')).default;
    const targetUser = await User.findById(userId);

    // Log audit trail
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'sessions_revoked_all_admin',
      category: 'security',
      description: `Admin revoked all sessions for user ${targetUser?.username}`,
      targetType: 'User',
      targetId: userId,
      metadata: { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        targetUserId: userId,
        targetUsername: targetUser?.username,
        count: result.modifiedCount,
        reason
      },
      severity: 'high',
      success: true
    });

    res.json({
      message: `Revoked ${result.modifiedCount} session(s) for user`,
      count: result.modifiedCount,
      user: targetUser?.username
    });
  } catch (error) {
    console.error('Error revoking all user sessions:', error);
    res.status(500).json({
      message: 'Failed to revoke sessions',
      error: error.message
    });
  }
});

/**
 * POST /api/sessions/admin/cleanup
 * Clean up old expired sessions (admin only)
 */
router.post('/admin/cleanup', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;

    if (daysOld < 7) {
      return res.status(400).json({
        message: 'Cannot delete sessions newer than 7 days'
      });
    }

    const deletedCount = await Session.cleanup(daysOld);

    // Log audit trail
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'sessions_cleanup',
      category: 'system',
      description: `Cleaned up ${deletedCount} old sessions`,
      metadata: { 
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        daysOld,
        deletedCount
      },
      severity: 'info',
      success: true
    });

    res.json({
      message: 'Cleanup completed',
      deletedCount,
      daysOld
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      message: 'Failed to cleanup sessions',
      error: error.message
    });
  }
});

/**
 * POST /api/sessions/admin/mark-suspicious/:sessionId
 * Mark a session as suspicious (admin only)
 */
router.post('/admin/mark-suspicious/:sessionId', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reasons = [] } = req.body;

    const session = await Session.markSuspicious(sessionId, reasons);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
      message: 'Session marked as suspicious',
      session
    });
  } catch (error) {
    console.error('Error marking session as suspicious:', error);
    res.status(500).json({
      message: 'Failed to mark session',
      error: error.message
    });
  }
});

export default router;
