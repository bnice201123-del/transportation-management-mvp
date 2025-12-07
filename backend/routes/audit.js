import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 */
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      action,
      category,
      severity,
      success,
      targetType,
      targetId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sort = '-createdAt'
    } = req.query;

    const filters = {
      userId,
      action,
      category,
      severity,
      success: success !== undefined ? success === 'true' : undefined,
      targetType,
      targetId,
      startDate,
      endDate,
      search
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    };

    const result = await AuditLog.getLogs(filters, options);

    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
});

/**
 * @route   GET /api/audit/logs/:id
 * @desc    Get single audit log by ID
 * @access  Admin only
 */
router.get('/logs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'firstName lastName username email role')
      .lean();

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: 'Server error fetching audit log' });
  }
});

/**
 * @route   GET /api/audit/statistics
 * @desc    Get audit log statistics
 * @access  Admin only
 */
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const filters = {
      startDate,
      endDate,
      userId
    };

    const statistics = await AuditLog.getStatistics(filters);

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

/**
 * @route   GET /api/audit/timeline
 * @desc    Get activity timeline
 * @access  Admin only
 */
router.get('/timeline', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, userId, groupBy = 'day' } = req.query;

    const filters = {
      startDate,
      endDate,
      userId,
      groupBy
    };

    const timeline = await AuditLog.getTimeline(filters);

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching audit timeline:', error);
    res.status(500).json({ message: 'Server error fetching timeline' });
  }
});

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Admin or own user
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Allow users to view their own logs, admins can view all
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      action,
      category
    } = req.query;

    const filters = {
      userId,
      startDate,
      endDate,
      action,
      category
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt'
    };

    const result = await AuditLog.getLogs(filters, options);

    res.json(result);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ message: 'Server error fetching user logs' });
  }
});

/**
 * @route   GET /api/audit/actions
 * @desc    Get list of all available actions
 * @access  Admin only
 */
router.get('/actions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const actions = await AuditLog.distinct('action');
    const categories = await AuditLog.distinct('category');
    
    res.json({
      actions: actions.sort(),
      categories: categories.sort()
    });
  } catch (error) {
    console.error('Error fetching actions list:', error);
    res.status(500).json({ message: 'Server error fetching actions' });
  }
});

/**
 * @route   GET /api/audit/export
 * @desc    Export audit logs as CSV
 * @access  Admin only
 */
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      action,
      category,
      startDate,
      endDate
    } = req.query;

    const filters = {
      userId,
      action,
      category,
      startDate,
      endDate
    };

    const options = {
      page: 1,
      limit: 10000, // Max export limit
      sort: '-createdAt'
    };

    const result = await AuditLog.getLogs(filters, options);

    // Convert to CSV
    const csv = convertToCSV(result.logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Server error exporting logs' });
  }
});

/**
 * @route   DELETE /api/audit/logs/:id
 * @desc    Delete audit log (should be restricted, mainly for testing)
 * @access  Admin only
 */
router.delete('/logs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const log = await AuditLog.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({ message: 'Audit log deleted successfully' });
  } catch (error) {
    console.error('Error deleting audit log:', error);
    res.status(500).json({ message: 'Server error deleting log' });
  }
});

/**
 * @route   POST /api/audit/cleanup
 * @desc    Cleanup old audit logs
 * @access  Admin only
 */
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { olderThan } = req.body; // days
    
    if (!olderThan || olderThan < 30) {
      return res.status(400).json({ message: 'Must specify olderThan (minimum 30 days)' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThan);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
      severity: { $nin: ['critical', 'error'] } // Keep critical/error logs
    });

    res.json({
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ message: 'Server error during cleanup' });
  }
});

/**
 * @route   GET /api/audit/recent
 * @desc    Get recent audit logs (last 24 hours)
 * @access  Admin only
 */
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const logs = await AuditLog.find({
      createdAt: { $gte: oneDayAgo }
    })
      .sort('-createdAt')
      .limit(100)
      .populate('userId', 'firstName lastName username')
      .lean();

    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ message: 'Server error fetching recent logs' });
  }
});

/**
 * Helper function to convert logs to CSV
 */
function convertToCSV(logs) {
  const headers = [
    'Timestamp',
    'User',
    'Role',
    'Action',
    'Category',
    'Description',
    'Target Type',
    'Target Name',
    'Severity',
    'Success',
    'IP Address',
    'Status Code'
  ];

  const rows = logs.map(log => [
    new Date(log.createdAt).toISOString(),
    log.username,
    log.userRole,
    log.action,
    log.category,
    log.description,
    log.targetType || '',
    log.targetName || '',
    log.severity,
    log.success,
    log.metadata?.ipAddress || '',
    log.metadata?.statusCode || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  return csvContent;
}

export default router;
