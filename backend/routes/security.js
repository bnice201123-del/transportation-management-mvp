/**
 * Security Monitoring Routes
 * 
 * API endpoints for managing security alerts and monitoring system security.
 */

import express from 'express';
import SecurityAlert from '../models/SecurityAlert.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

/**
 * GET /api/security/alerts
 * Get all security alerts with filtering and pagination
 */
router.get('/alerts', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      type,
      status,
      userId,
      ipAddress,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Filters
    if (severity) {
      query.severity = Array.isArray(severity) ? { $in: severity } : severity;
    }

    if (type) {
      query.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (userId) {
      query['actor.userId'] = userId;
    }

    if (ipAddress) {
      query['actor.ipAddress'] = ipAddress;
    }

    if (startDate) {
      query.firstOccurrence = { $gte: new Date(startDate) };
    }

    if (endDate) {
      query.lastOccurrence = { 
        ...query.lastOccurrence, 
        $lte: new Date(endDate) 
      };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { alertId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total] = await Promise.all([
      SecurityAlert.find(query)
        .sort({ severity: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('actor.userId', 'username email role')
        .populate('acknowledgedBy', 'username email')
        .populate('resolvedBy', 'username email')
        .populate('investigation.assignedTo', 'username email'),
      SecurityAlert.countDocuments(query)
    ]);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alerts_viewed',
      category: 'security',
      description: `Viewed security alerts with filters: severity=${severity || 'all'}, type=${type || 'all'}, status=${status || 'all'}`,
      targetType: null,
      severity: 'low',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        filters: { severity, type, status },
        resultCount: alerts.length
      }
    });

    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch security alerts', 
      error: error.message 
    });
  }
});

/**
 * GET /api/security/alerts/:alertId
 * Get specific alert details
 */
router.get('/alerts/:alertId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await SecurityAlert.findOne({ alertId })
      .populate('actor.userId', 'username email role')
      .populate('acknowledgedBy', 'username email')
      .populate('resolvedBy', 'username email')
      .populate('investigation.assignedTo', 'username email')
      .populate('notes.addedBy', 'username email');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Get correlated alerts
    const correlatedAlerts = await SecurityAlert.correlateAlerts(alertId);

    res.json({
      alert,
      correlatedAlerts
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ 
      message: 'Failed to fetch alert', 
      error: error.message 
    });
  }
});

/**
 * POST /api/security/alerts
 * Create a new security alert
 */
router.post('/alerts', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const alertData = req.body;

    const alert = await SecurityAlert.createAlert(alertData);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_created',
      category: 'security',
      description: `Created security alert ${alert.alertId} - Type: ${alert.type}, Severity: ${alert.severity}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alert.alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alert.alertId,
        type: alert.type,
        severity: alert.severity
      }
    });

    res.status(201).json({
      message: 'Security alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ 
      message: 'Failed to create alert', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/security/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.put('/alerts/:alertId/acknowledge', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.acknowledge(req.user._id);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_acknowledged',
      category: 'security',
      description: `Acknowledged security alert ${alertId} - Type: ${alert.type}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        type: alert.type
      }
    });

    res.json({
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ 
      message: 'Failed to acknowledge alert', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/security/alerts/:alertId/investigate
 * Start investigation on an alert
 */
router.put('/alerts/:alertId/investigate', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.startInvestigation(req.user._id);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_investigation_started',
      category: 'security',
      description: `Started investigation on security alert ${alertId} - Type: ${alert.type}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        type: alert.type
      }
    });

    res.json({
      message: 'Investigation started successfully',
      alert
    });
  } catch (error) {
    console.error('Error starting investigation:', error);
    res.status(500).json({ 
      message: 'Failed to start investigation', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/security/alerts/:alertId/resolve
 * Resolve an alert
 */
router.put('/alerts/:alertId/resolve', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { findings, recommendations } = req.body;

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.resolve(req.user._id, findings, recommendations);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_resolved',
      category: 'security',
      description: `Resolved security alert ${alertId} - Type: ${alert.type}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        type: alert.type,
        hasFindings: !!findings
      }
    });

    res.json({
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ 
      message: 'Failed to resolve alert', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/security/alerts/:alertId/false-positive
 * Mark alert as false positive
 */
router.put('/alerts/:alertId/false-positive', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.markFalsePositive(req.user._id, reason);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_false_positive',
      category: 'security',
      description: `Marked security alert ${alertId} as false positive - Reason: ${reason}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        reason: reason
      }
    });

    res.json({
      message: 'Alert marked as false positive',
      alert
    });
  } catch (error) {
    console.error('Error marking false positive:', error);
    res.status(500).json({ 
      message: 'Failed to mark as false positive', 
      error: error.message 
    });
  }
});

/**
 * POST /api/security/alerts/:alertId/notes
 * Add a note to an alert
 */
router.post('/alerts/:alertId/notes', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.addNote(req.user._id, text);

    res.json({
      message: 'Note added successfully',
      alert
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ 
      message: 'Failed to add note', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/security/alerts/:alertId/suppress
 * Suppress an alert temporarily
 */
router.put('/alerts/:alertId/suppress', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { durationMinutes = 60 } = req.body;

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    await alert.suppress(durationMinutes);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_suppressed',
      category: 'security',
      description: `Suppressed security alert ${alertId} for ${durationMinutes} minutes`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'low',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        durationMinutes: durationMinutes
      }
    });

    res.json({
      message: 'Alert suppressed successfully',
      alert
    });
  } catch (error) {
    console.error('Error suppressing alert:', error);
    res.status(500).json({ 
      message: 'Failed to suppress alert', 
      error: error.message 
    });
  }
});

/**
 * GET /api/security/statistics
 * Get security statistics and metrics
 */
router.get('/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    const statistics = await SecurityAlert.getStatistics(timeRange);

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
});

/**
 * GET /api/security/dashboard
 * Get comprehensive security dashboard data
 */
router.get('/dashboard', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      activeAlerts,
      criticalAlerts,
      statistics24h,
      statistics7d,
      recentFailedLogins,
      activeSessions,
      topThreats
    ] = await Promise.all([
      SecurityAlert.getActiveAlerts(),
      SecurityAlert.find({ 
        severity: 'critical',
        status: { $in: ['active', 'acknowledged', 'investigating'] }
      }).sort({ createdAt: -1 }).limit(10),
      SecurityAlert.getStatistics('24h'),
      SecurityAlert.getStatistics('7d'),
      AuditLog.find({ 
        action: 'login_failed',
        timestamp: { $gte: oneDayAgo }
      }).sort({ timestamp: -1 }).limit(20),
      Session.countDocuments({ 
        isActive: true,
        expiresAt: { $gt: now }
      }),
      SecurityAlert.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            severity: { $in: ['critical', 'high'] }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            latestOccurrence: { $max: '$lastOccurrence' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Calculate trend
    const alertsLastHour = await SecurityAlert.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });

    const alertsPreviousHour = await SecurityAlert.countDocuments({
      createdAt: { 
        $gte: new Date(oneHourAgo - 60 * 60 * 1000),
        $lt: oneHourAgo
      }
    });

    const trend = alertsPreviousHour > 0 
      ? ((alertsLastHour - alertsPreviousHour) / alertsPreviousHour * 100).toFixed(2)
      : 0;

    res.json({
      summary: {
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        alertsLastHour,
        trend: parseFloat(trend),
        activeSessions,
        recentFailedLogins: recentFailedLogins.length
      },
      criticalAlerts,
      statistics: {
        '24h': statistics24h,
        '7d': statistics7d
      },
      topThreats,
      recentFailedLogins: recentFailedLogins.slice(0, 10),
      timestamp: now
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data', 
      error: error.message 
    });
  }
});

/**
 * POST /api/security/detect-anomalies
 * Trigger anomaly detection
 */
router.post('/detect-anomalies', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const alerts = await SecurityAlert.detectAnomalies();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_anomaly_detection_triggered',
      category: 'security',
      description: `Triggered security anomaly detection - Created ${alerts.length} alerts`,
      targetType: 'System',
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertsCreated: alerts.length
      }
    });

    res.json({
      message: 'Anomaly detection completed',
      alertsCreated: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ 
      message: 'Failed to detect anomalies', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/security/alerts/:alertId
 * Delete an alert (admin only, for old/irrelevant alerts)
 */
router.delete('/alerts/:alertId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await SecurityAlert.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Only allow deletion of resolved or false positive alerts
    if (!['resolved', 'false_positive', 'ignored'].includes(alert.status)) {
      return res.status(400).json({ 
        message: 'Only resolved or false positive alerts can be deleted' 
      });
    }

    await SecurityAlert.deleteOne({ alertId });

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_alert_deleted',
      category: 'security',
      description: `Deleted security alert ${alertId} - Type: ${alert.type}`,
      targetType: 'System',
      targetId: alert._id,
      targetName: alertId,
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        alertId: alertId,
        type: alert.type
      }
    });

    res.json({
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ 
      message: 'Failed to delete alert', 
      error: error.message 
    });
  }
});

/**
 * POST /api/security/bulk-actions
 * Perform bulk actions on multiple alerts
 */
router.post('/bulk-actions', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { action, alertIds, data } = req.body;

    if (!action || !alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({ 
        message: 'Action and alertIds array are required' 
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const alertId of alertIds) {
      try {
        const alert = await SecurityAlert.findOne({ alertId });
        if (!alert) {
          results.failed++;
          results.errors.push({ alertId, error: 'Alert not found' });
          continue;
        }

        switch (action) {
          case 'acknowledge':
            await alert.acknowledge(req.user._id);
            break;
          case 'resolve':
            await alert.resolve(req.user._id, data?.findings, data?.recommendations);
            break;
          case 'suppress':
            await alert.suppress(data?.durationMinutes || 60);
            break;
          case 'delete':
            if (['resolved', 'false_positive', 'ignored'].includes(alert.status)) {
              await SecurityAlert.deleteOne({ alertId });
            } else {
              throw new Error('Only resolved alerts can be deleted');
            }
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ alertId, error: error.message });
      }
    }

    // Log the bulk action
    await AuditLog.create({
      userId: req.user._id,
      username: req.user.username || req.user.email,
      userRole: req.user.role,
      action: 'security_bulk_action',
      category: 'security',
      description: `Performed bulk ${action} on ${alertIds.length} alerts - ${results.success} successful, ${results.failed} failed`,
      targetType: 'System',
      severity: 'medium',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: action,
        totalAlerts: alertIds.length,
        successful: results.success,
        failed: results.failed
      }
    });

    res.json({
      message: 'Bulk action completed',
      results
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ 
      message: 'Failed to perform bulk action', 
      error: error.message 
    });
  }
});

export default router;
