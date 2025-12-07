/**
 * Trusted Devices Routes
 * Manage user's trusted devices
 */

import express from 'express';
import TrustedDevice from '../models/TrustedDevice.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { adminLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../utils/logger.js';
import deviceFingerprintUtils from '../utils/deviceFingerprint.js';

const router = express.Router();

// User Routes (manage own devices)

/**
 * @route   GET /api/trusted-devices
 * @desc    Get current user's trusted devices
 * @access  Private
 */
router.get('/', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { includeBlocked, trustLevel, limit } = req.query;
    
    const options = {
      includeBlocked: includeBlocked === 'true',
      trustLevel,
      limit: limit ? parseInt(limit) : 50
    };

    const devices = await TrustedDevice.getUserDevices(req.user.userId, options);

    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Error fetching trusted devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trusted devices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trusted-devices/stats
 * @desc    Get statistics for current user's devices
 * @access  Private
 */
router.get('/stats', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const stats = await TrustedDevice.getUserDeviceStats(req.user.userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trusted-devices/:deviceId
 * @desc    Get specific device details
 * @access  Private
 */
router.get('/:deviceId', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      device
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/trusted-devices/:deviceId/name
 * @desc    Update device name
 * @access  Private
 */
router.put('/:deviceId/name', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { deviceName } = req.body;

    if (!deviceName || deviceName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Device name is required'
      });
    }

    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    device.deviceName = deviceName.trim();
    await device.save();

    await logActivity(req.user.userId, 'device', 'update_name', 'security', {
      deviceId: device._id,
      newName: deviceName
    });

    res.json({
      success: true,
      message: 'Device name updated successfully',
      device
    });
  } catch (error) {
    console.error('Error updating device name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device name',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/:deviceId/remember
 * @desc    Set device to be remembered
 * @access  Private
 */
router.post('/:deviceId/remember', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { duration } = req.body; // duration in days

    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const durationDays = duration || 30; // default 30 days
    device.rememberDevice = true;
    device.rememberUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await device.save();

    await logActivity(req.user.userId, 'device', 'remember', 'security', {
      deviceId: device._id,
      duration: durationDays
    });

    res.json({
      success: true,
      message: `Device will be remembered for ${durationDays} days`,
      device
    });
  } catch (error) {
    console.error('Error setting device remember:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set device remember',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/:deviceId/forget
 * @desc    Stop remembering device
 * @access  Private
 */
router.post('/:deviceId/forget', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    device.rememberDevice = false;
    device.rememberUntil = null;
    await device.save();

    await logActivity(req.user.userId, 'device', 'forget', 'security', {
      deviceId: device._id
    });

    res.json({
      success: true,
      message: 'Device will no longer be remembered',
      device
    });
  } catch (error) {
    console.error('Error forgetting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forget device',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/trusted-devices/:deviceId
 * @desc    Remove a trusted device
 * @access  Private
 */
router.delete('/:deviceId', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await TrustedDevice.findByIdAndDelete(req.params.deviceId);

    await logActivity(req.user.userId, 'device', 'delete', 'security', {
      deviceId: device._id,
      deviceName: device.deviceName
    });

    res.json({
      success: true,
      message: 'Device removed successfully'
    });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/:deviceId/verify
 * @desc    Verify a device (user-initiated)
 * @access  Private
 */
router.post('/:deviceId/verify', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { method } = req.body; // email, sms, authenticator

    const device = await TrustedDevice.findOne({
      _id: req.params.deviceId,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (device.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Device is already verified'
      });
    }

    await device.verify(method || 'manual');

    await logActivity(req.user.userId, 'device', 'verify', 'security', {
      deviceId: device._id,
      method: method || 'manual'
    });

    res.json({
      success: true,
      message: 'Device verified successfully',
      device
    });
  } catch (error) {
    console.error('Error verifying device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify device',
      error: error.message
    });
  }
});

// Admin Routes

/**
 * @route   GET /api/trusted-devices/admin/all
 * @desc    Get all trusted devices (admin)
 * @access  Admin
 */
router.get('/admin/all', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId, trustLevel, isBlocked, isSuspicious, page = 1, limit = 50 } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (trustLevel) query.trustLevel = trustLevel;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
    if (isSuspicious !== undefined) query.isSuspicious = isSuspicious === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [devices, total] = await Promise.all([
      TrustedDevice.find(query)
        .populate('userId', 'name email role')
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TrustedDevice.countDocuments(query)
    ]);

    res.json({
      success: true,
      devices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trusted-devices/admin/statistics
 * @desc    Get global device statistics (admin)
 * @access  Admin
 */
router.get('/admin/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const [
      total,
      trusted,
      verified,
      blocked,
      suspicious,
      remembered
    ] = await Promise.all([
      TrustedDevice.countDocuments(),
      TrustedDevice.countDocuments({ trustLevel: { $in: ['trusted', 'verified'] } }),
      TrustedDevice.countDocuments({ isVerified: true }),
      TrustedDevice.countDocuments({ isBlocked: true }),
      TrustedDevice.countDocuments({ isSuspicious: true }),
      TrustedDevice.countDocuments({ rememberDevice: true, rememberUntil: { $gt: new Date() } })
    ]);

    // Get devices by trust level
    const byTrustLevel = await TrustedDevice.aggregate([
      {
        $group: {
          _id: '$trustLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get most active devices
    const mostActive = await TrustedDevice.find()
      .populate('userId', 'name email')
      .sort({ loginCount: -1 })
      .limit(10)
      .select('userId deviceName loginCount lastSeen trustLevel')
      .lean();

    res.json({
      success: true,
      statistics: {
        total,
        trusted,
        verified,
        blocked,
        suspicious,
        remembered,
        byTrustLevel: byTrustLevel.map(t => ({ level: t._id, count: t.count })),
        mostActive
      }
    });
  } catch (error) {
    console.error('Error fetching device statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/admin/:deviceId/block
 * @desc    Block a device (admin)
 * @access  Admin
 */
router.post('/admin/:deviceId/block', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { reason } = req.body;

    const device = await TrustedDevice.findById(req.params.deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await device.block(reason || 'Admin action');

    await logActivity(req.user.userId, 'device', 'admin_block', 'security', {
      deviceId: device._id,
      targetUserId: device.userId,
      reason
    });

    res.json({
      success: true,
      message: 'Device blocked successfully',
      device
    });
  } catch (error) {
    console.error('Error blocking device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block device',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/admin/:deviceId/unblock
 * @desc    Unblock a device (admin)
 * @access  Admin
 */
router.post('/admin/:deviceId/unblock', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const device = await TrustedDevice.findById(req.params.deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await device.unblock();

    await logActivity(req.user.userId, 'device', 'admin_unblock', 'security', {
      deviceId: device._id,
      targetUserId: device.userId
    });

    res.json({
      success: true,
      message: 'Device unblocked successfully',
      device
    });
  } catch (error) {
    console.error('Error unblocking device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock device',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/trusted-devices/admin/:deviceId
 * @desc    Delete any device (admin)
 * @access  Admin
 */
router.delete('/admin/:deviceId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const device = await TrustedDevice.findById(req.params.deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    await TrustedDevice.findByIdAndDelete(req.params.deviceId);

    await logActivity(req.user.userId, 'device', 'admin_delete', 'security', {
      deviceId: device._id,
      targetUserId: device.userId,
      deviceName: device.deviceName
    });

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trusted-devices/admin/cleanup
 * @desc    Clean up old inactive devices (admin)
 * @access  Admin
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { daysInactive = 90 } = req.body;

    const deletedCount = await TrustedDevice.cleanupOldDevices(daysInactive);

    await logActivity(req.user.userId, 'device', 'admin_cleanup', 'security', {
      daysInactive,
      deletedCount
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} inactive devices`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up devices',
      error: error.message
    });
  }
});

export default router;
