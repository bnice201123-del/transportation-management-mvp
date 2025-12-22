import express from 'express';
import User from '../models/User.js';
import VehicleTracker from '../models/VehicleTracker.js';
import DualLoginService from '../services/dualLoginService.js';
import { authenticateToken, requirePermission } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

/**
 * Rate limiting for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const driverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // More lenient for driver operations
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/drivers/section-login
 * Driver section authentication using driver number
 * 
 * Body:
 * - driverId (string, required): Driver ID in format DRV-XXXX-YYYY
 * - pin (string, optional): PIN for additional security
 */
router.post('/section-login', authLimiter, async (req, res) => {
  try {
    const { driverId, pin } = req.body;
    
    // Validation
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }
    
    // Authenticate driver
    const result = await DualLoginService.authenticateDriver(driverId, pin);
    
    res.json({
      success: true,
      data: result,
      message: 'Driver section login successful'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
});

/**
 * POST /api/drivers/:userId/generate-driver-id
 * Generate or regenerate a driver ID for a user
 * 
 * Params:
 * - userId (string): User ID
 * 
 * Body:
 * - expiryDays (number, optional): Days until ID expires (default: 365)
 * - regenerate (boolean, optional): Force regenerate even if valid ID exists
 */
router.post('/:userId/generate-driver-id', authenticateToken, requirePermission('drivers:manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryDays = 365, regenerate = false } = req.body;
    
    // Authorization check
    if (req.user.userId !== userId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage this user'
      });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let result;
    
    if (regenerate && user.driverId) {
      // Regenerate existing ID
      result = await DualLoginService.regenerateDriverId(userId);
    } else if (user.driverId && !regenerate) {
      // Return existing valid ID
      result = {
        success: true,
        driverId: user.driverId,
        expiryDate: user.driverIdExpiryDate,
        message: 'Driver ID already assigned'
      };
    } else {
      // Generate new ID
      result = await DualLoginService.assignDriverId(userId, expiryDays);
    }
    
    res.json({
      success: true,
      data: result,
      message: 'Driver ID generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate driver ID'
    });
  }
});

/**
 * POST /api/drivers/:userId/enable-dual-login
 * Enable dual login for a user
 * 
 * Params:
 * - userId (string): User ID
 * 
 * Body:
 * - loginType (string, optional): 'driver_number' or 'vehicle_phone' (default: driver_number)
 */
router.post('/:userId/enable-dual-login', authenticateToken, requirePermission('drivers:manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { loginType = 'driver_number' } = req.body;
    
    // Authorization
    if (req.user.userId !== userId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this user'
      });
    }
    
    const result = await DualLoginService.enableDualLogin(userId, loginType);
    
    res.json({
      success: true,
      data: result,
      message: 'Dual login enabled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to enable dual login'
    });
  }
});

/**
 * POST /api/drivers/:userId/disable-dual-login
 * Disable dual login for a user
 * 
 * Params:
 * - userId (string): User ID
 */
router.post('/:userId/disable-dual-login', authenticateToken, requirePermission('drivers:manage'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Authorization
    if (req.user.userId !== userId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this user'
      });
    }
    
    const result = await DualLoginService.disableDualLogin(userId, req.user.userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Dual login disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disable dual login'
    });
  }
});

/**
 * GET /api/drivers/:userId/check-eligibility
 * Check if user is eligible for dual login
 * 
 * Params:
 * - userId (string): User ID
 */
router.get('/:userId/check-eligibility', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Authorization
    if (req.user.userId !== userId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to check this user'
      });
    }
    
    const eligibility = await DualLoginService.checkDualLoginEligibility(userId);
    
    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check eligibility'
    });
  }
});

/**
 * POST /api/vehicles/:vehicleId/setup-tracking-account
 * Setup autonomous vehicle tracker
 * 
 * Params:
 * - vehicleId (string): Vehicle ID
 * 
 * Body:
 * - phoneNumber (string, required): Phone number for tracker
 * - simCardNumber (string, optional): SIM card number
 * - trackingFrequency (number, optional): Tracking frequency in seconds (default: 30)
 * - gpsEnabled (boolean, optional): Enable GPS (default: true)
 * - cellularEnabled (boolean, optional): Enable cellular (default: true)
 * - lowBatteryThreshold (number, optional): Low battery alert threshold (default: 20)
 * - notes (string, optional): Setup notes
 */
router.post('/vehicles/:vehicleId/setup-tracking-account', authenticateToken, requirePermission('vehicles:manage'), driverLimiter, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const setupData = req.body;
    
    // Validation
    if (!setupData.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const result = await DualLoginService.setupVehicleTracker(
      vehicleId,
      setupData.phoneNumber,
      setupData,
      req.user.userId
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Vehicle tracker setup initiated'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to setup vehicle tracker'
    });
  }
});

/**
 * POST /api/vehicles/:vehicleId/activate-tracker
 * Activate a vehicle tracker after device setup
 * 
 * Params:
 * - vehicleId (string): Vehicle ID
 * 
 * Body:
 * - deviceImei (string, optional): Device IMEI for verification
 * - osVersion (string, optional): OS version
 * - appVersion (string, optional): App version
 */
router.post('/vehicles/:vehicleId/activate-tracker', authenticateToken, driverLimiter, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { deviceImei, osVersion, appVersion } = req.body;
    
    const tracker = await VehicleTracker.findOne({ vehicleId });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found for this vehicle'
      });
    }
    
    // Update device information
    if (deviceImei) tracker.deviceImei = deviceImei;
    if (osVersion) tracker.osVersion = osVersion;
    if (appVersion) tracker.appVersion = appVersion;
    
    // Activate tracker
    await tracker.activate();
    
    res.json({
      success: true,
      data: {
        trackerId: tracker._id,
        vehicleId: tracker.vehicleId,
        status: tracker.status,
        message: 'Tracker activated successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate tracker'
    });
  }
});

/**
 * POST /api/drivers/bulk-generate-driver-ids
 * Bulk generate driver IDs for multiple users
 * Admin only endpoint
 * 
 * Body:
 * - userIds (array): Array of user IDs
 * - expiryDays (number, optional): Days until ID expires (default: 365)
 */
router.post('/bulk-generate-driver-ids', authenticateToken, requirePermission('admin:drivers'), async (req, res) => {
  try {
    const { userIds = [], expiryDays = 365 } = req.body;
    
    // Validation
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of user IDs is required'
      });
    }
    
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 users per request'
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userId of userIds) {
      try {
        const result = await DualLoginService.assignDriverId(userId, expiryDays);
        results.successful.push({
          userId,
          driverId: result.driverId,
          expiryDate: result.expiryDate
        });
      } catch (error) {
        results.failed.push({
          userId,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: userIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Bulk operation failed'
    });
  }
});

/**
 * GET /api/drivers/:userId/dashboard
 * Get driver section dashboard data
 * 
 * Params:
 * - userId (string): User ID
 */
router.get('/:userId/dashboard', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Authorization
    if (req.user.userId !== userId && !req.user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this dashboard'
      });
    }
    
    const data = await DualLoginService.getDriverDashboardData(userId);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/vehicles/:vehicleId/tracker-status
 * Get tracker status for a vehicle
 * 
 * Params:
 * - vehicleId (string): Vehicle ID
 */
router.get('/vehicles/:vehicleId/tracker-status', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const tracker = await VehicleTracker.findOne({ vehicleId })
      .select('-credentials')
      .lean();
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'No tracker found for this vehicle'
      });
    }
    
    const health = {
      status: tracker.status,
      battery: tracker.batteryLevel,
      signal: tracker.signalStrength,
      lastTracked: tracker.lastTrackedAt,
      location: tracker.lastKnownLocation,
      isHealthy: tracker.batteryLevel > tracker.alertSettings.lowBatteryThreshold &&
                 tracker.signalStrength !== 'no_signal' &&
                 (!tracker.lastTrackedAt || (Date.now() - tracker.lastTrackedAt) < 30 * 60000)
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tracker status'
    });
  }
});

/**
 * PUT /api/vehicles/:vehicleId/update-tracking-settings
 * Update tracking settings for a vehicle tracker
 * 
 * Params:
 * - vehicleId (string): Vehicle ID
 * 
 * Body:
 * - frequency (number, optional): Tracking frequency in seconds
 * - gpsEnabled (boolean, optional): Enable/disable GPS
 * - lowPowerMode (boolean, optional): Enable/disable low power mode
 * - alertSettings (object, optional): Alert settings update
 */
router.put('/vehicles/:vehicleId/update-tracking-settings', authenticateToken, driverLimiter, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { frequency, gpsEnabled, lowPowerMode, alertSettings } = req.body;
    
    const tracker = await VehicleTracker.findOne({ vehicleId });
    
    if (!tracker) {
      return res.status(404).json({
        success: false,
        message: 'Tracker not found for this vehicle'
      });
    }
    
    // Update settings
    if (frequency !== undefined) {
      if (frequency < 10 || frequency > 300) {
        return res.status(400).json({
          success: false,
          message: 'Frequency must be between 10 and 300 seconds'
        });
      }
      tracker.trackingSettings.frequency = frequency;
    }
    
    if (gpsEnabled !== undefined) {
      tracker.trackingSettings.gpsEnabled = gpsEnabled;
    }
    
    if (lowPowerMode !== undefined) {
      tracker.trackingSettings.lowPowerMode = lowPowerMode;
    }
    
    if (alertSettings) {
      tracker.alertSettings = { ...tracker.alertSettings, ...alertSettings };
    }
    
    // Log activity
    tracker.activityLog.push({
      action: 'settings_updated',
      performedBy: req.user.userId,
      details: {
        frequency,
        gpsEnabled,
        lowPowerMode,
        alertSettings
      },
      performedAt: new Date()
    });
    
    await tracker.save();
    
    res.json({
      success: true,
      data: {
        trackerId: tracker._id,
        trackingSettings: tracker.trackingSettings,
        alertSettings: tracker.alertSettings,
        message: 'Tracking settings updated successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tracking settings'
    });
  }
});

export default router;
