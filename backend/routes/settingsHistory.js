import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import Settings from '../models/Settings.js';
import {
  trackSettingsChanges,
  validateSettings,
  requireSettingsPermission,
  alertOnCriticalChanges
} from '../middleware/settingsMiddleware.js';

const router = express.Router();

// Model for settings history
const settingsHistorySchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['system', 'security', 'notifications', 'maps', 'business', 'integration', 'audit', 'holidays', 'rate-limits', 'sessions', 'encryption', 'permissions'],
    index: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  changedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reason: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
});

// TTL index to auto-delete old history after 90 days
settingsHistorySchema.index({ changedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const SettingsHistory = mongoose.model('SettingsHistory', settingsHistorySchema);

/**
 * SETTINGS CRUD ROUTES
 */

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Admin
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

/**
 * SETTINGS HISTORY ROUTES (must come before /:key routes)
 */

/**
 * @route   GET /api/settings/history
 * @desc    Get settings change history with filtering
 * @access  Admin
 */
router.get('/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      category,
      settingKey,
      userId,
      startDate,
      endDate,
      limit = 100,
      skip = 0
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (settingKey) {
      query.settingKey = { $regex: settingKey, $options: 'i' };
    }

    if (userId) {
      query.changedBy = userId;
    }

    if (startDate || endDate) {
      query.changedAt = {};
      if (startDate) query.changedAt.$gte = new Date(startDate);
      if (endDate) query.changedAt.$lte = new Date(endDate);
    }

    // Get history with pagination
    const history = await SettingsHistory
      .find(query)
      .populate('changedBy', 'name email')
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SettingsHistory.countDocuments(query);

    res.json({
      success: true,
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings history',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/settings/reset
 * @desc    Reset all settings to defaults
 * @access  Admin
 */
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});
    
    // Create new default settings
    const settings = await Settings.getSingleton();
    
    // Log the reset
    await logSettingChange(
      'ALL_SETTINGS',
      'system',
      'various',
      'defaults',
      req.user._id,
      req,
      'Settings reset to defaults'
    );
    
    res.json({
      success: true,
      message: 'Settings reset to defaults',
      settings: settings.toObject()
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/settings/:key
 * @desc    Get specific setting by key
 * @access  Admin
 */
router.get('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const value = await Settings.getSetting(req.params.key);
    res.json({
      success: true,
      key: req.params.key,
      value
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update multiple settings
 * @access  Admin
 */
router.put('/',
  authenticateToken,
  requireSettingsPermission,
  validateSettings,
  trackSettingsChanges,
  alertOnCriticalChanges,
  async (req, res) => {
    try {
      const settings = await Settings.bulkUpdate(req.body, req.user._id, req);
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: settings.toObject()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/settings/:key
 * @desc    Update single setting
 * @access  Admin
 */
router.put('/:key',
  authenticateToken,
  requireSettingsPermission,
  validateSettings,
  trackSettingsChanges,
  alertOnCriticalChanges,
  async (req, res) => {
    try {
      const { value, reason } = req.body;
      const settings = await Settings.updateSetting(
        req.params.key,
        value,
        req.user._id,
        req
      );
      
      res.json({
        success: true,
        message: 'Setting updated successfully',
        key: req.params.key,
        value: settings.get(req.params.key)
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/settings/history/:id
 * @desc    Get single setting change details
 * @access  Admin
 */
router.get('/history/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const change = await SettingsHistory
      .findById(req.params.id)
      .populate('changedBy', 'name email role');

    if (!change) {
      return res.status(404).json({
        success: false,
        message: 'Change record not found'
      });
    }

    res.json({
      success: true,
      change
    });
  } catch (error) {
    console.error('Error fetching change details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch change details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/settings/history/:id/revert
 * @desc    Revert a setting to previous value
 * @access  Admin
 */
router.post('/history/:id/revert', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const change = await SettingsHistory.findById(req.params.id);

    if (!change) {
      return res.status(404).json({
        success: false,
        message: 'Change record not found'
      });
    }

    // Get the settings model
    const Settings = mongoose.model('Settings');
    
    // Update the setting back to old value
    const updateQuery = {};
    updateQuery[change.settingKey] = change.oldValue;

    await Settings.findOneAndUpdate(
      {},
      { $set: updateQuery },
      { upsert: true }
    );

    // Log this revert as a new history entry
    await SettingsHistory.create({
      settingKey: change.settingKey,
      category: change.category,
      oldValue: change.newValue,
      newValue: change.oldValue,
      changedBy: req.user._id,
      reason: `Reverted change from ${change.changedAt}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Setting reverted successfully'
    });
  } catch (error) {
    console.error('Error reverting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revert setting',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/settings/history/stats
 * @desc    Get settings change statistics
 * @access  Admin
 */
router.get('/history/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get change counts by category
    const byCategory = await SettingsHistory.aggregate([
      { $match: { changedAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get change counts by user
    const byUser = await SettingsHistory.aggregate([
      { $match: { changedAt: { $gte: startDate } } },
      { $group: { _id: '$changedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          count: 1,
          name: '$user.name',
          email: '$user.email'
        }
      }
    ]);

    // Get total changes
    const totalChanges = await SettingsHistory.countDocuments({
      changedAt: { $gte: startDate }
    });

    // Get most changed settings
    const mostChanged = await SettingsHistory.aggregate([
      { $match: { changedAt: { $gte: startDate } } },
      { $group: { _id: '$settingKey', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalChanges,
        byCategory,
        byUser,
        mostChanged,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Error fetching history stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/settings/history/cleanup
 * @desc    Manually cleanup old history (older than specified days)
 * @access  Admin
 */
router.delete('/history/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await SettingsHistory.deleteMany({
      changedAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old history records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup history',
      error: error.message
    });
  }
});

// Middleware to log setting changes
const logSettingChange = async (settingKey, category, oldValue, newValue, userId, req, reason = null) => {
  try {
    await SettingsHistory.create({
      settingKey,
      category,
      oldValue,
      newValue,
      changedBy: userId,
      reason,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('user-agent') || 'unknown'
    });
  } catch (error) {
    console.error('Error logging setting change:', error);
  }
};

export default router;
export { logSettingChange, SettingsHistory };

