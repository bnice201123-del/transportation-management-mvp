import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import UnassignedTripAlert from '../models/UnassignedTripAlert.js';
import DriverProgressTracking from '../models/DriverProgressTracking.js';
import Trip from '../models/Trip.js';

const router = express.Router();

// ==================== UNASSIGNED TRIP ALERTS ====================

/**
 * GET /api/trip-monitoring/unassigned-alerts
 * Get all active unassigned trip alerts
 */
router.get('/unassigned-alerts', authenticateToken, async (req, res) => {
  try {
    const { status = 'alerting' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const alerts = await UnassignedTripAlert.find(query)
      .populate({
        path: 'trip',
        populate: [
          { path: 'rider', select: 'name phone email' },
          { path: 'driver', select: 'name phone email' }
        ]
      })
      .sort({ thresholdTime: 1 });
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching unassigned alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned alerts',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/unassigned-alerts/:id
 * Get specific unassigned trip alert
 */
router.get('/unassigned-alerts/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await UnassignedTripAlert.findById(req.params.id)
      .populate({
        path: 'trip',
        populate: [
          { path: 'rider', select: 'name phone email' },
          { path: 'driver', select: 'name phone email' }
        ]
      });
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/unassigned-alerts/trip/:tripId
 * Get alert for specific trip
 */
router.get('/unassigned-alerts/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const alert = await UnassignedTripAlert.getActiveForTrip(req.params.tripId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'No active alert for this trip'
      });
    }
    
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error fetching trip alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip alert',
      error: error.message
    });
  }
});

/**
 * POST /api/trip-monitoring/unassigned-alerts/:id/resolve
 * Manually resolve an unassigned trip alert
 */
router.post('/unassigned-alerts/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { reason = 'manual_resolution' } = req.body;
    
    const alert = await UnassignedTripAlert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    await alert.resolve(reason, req.user.userId);
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/unassigned-alerts/statistics
 * Get unassigned alert statistics
 */
router.get('/unassigned-alerts-statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await UnassignedTripAlert.getStatistics(start, end);
    
    res.json({
      success: true,
      period: { start, end },
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// ==================== DRIVER PROGRESS TRACKING ====================

/**
 * GET /api/trip-monitoring/driver-progress
 * Get all active driver progress tracking
 */
router.get('/driver-progress', authenticateToken, async (req, res) => {
  try {
    const { status = 'active', driverId } = req.query;
    
    const query = { status };
    if (driverId) {
      query.driver = driverId;
    }
    
    const tracking = await DriverProgressTracking.find(query)
      .populate('trip')
      .populate('driver', 'name phone email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tracking.length,
      tracking
    });
  } catch (error) {
    console.error('Error fetching driver progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver progress',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/driver-progress/trip/:tripId
 * Get driver progress for specific trip
 */
router.get('/driver-progress/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const tracking = await DriverProgressTracking.getActiveByTrip(req.params.tripId);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking for this trip'
      });
    }
    
    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('Error fetching trip tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip tracking',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/driver-progress/driver/:driverId
 * Get active progress tracking for specific driver
 */
router.get('/driver-progress/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const tracking = await DriverProgressTracking.getActiveByDriver(req.params.driverId);
    
    res.json({
      success: true,
      count: tracking.length,
      tracking
    });
  } catch (error) {
    console.error('Error fetching driver tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver tracking',
      error: error.message
    });
  }
});

/**
 * POST /api/trip-monitoring/driver-progress/:id/location
 * Update driver location for tracking
 */
router.post('/driver-progress/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, speed, accuracy } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const tracking = await DriverProgressTracking.findById(req.params.id);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }
    
    await tracking.updateLocation(latitude, longitude, speed, accuracy);
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      tracking
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/driver-progress/alerts/lateness
 * Get all drivers with lateness alerts
 */
router.get('/driver-progress/alerts/lateness', authenticateToken, async (req, res) => {
  try {
    const tracking = await DriverProgressTracking.find({
      status: 'active',
      latenessDetected: true
    })
      .populate('trip')
      .populate('driver', 'name phone email')
      .sort({ firstLatenessDetectedAt: -1 });
    
    res.json({
      success: true,
      count: tracking.length,
      tracking
    });
  } catch (error) {
    console.error('Error fetching lateness alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lateness alerts',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/driver-progress/alerts/stopped
 * Get all drivers with stopped movement alerts
 */
router.get('/driver-progress/alerts/stopped', authenticateToken, async (req, res) => {
  try {
    const tracking = await DriverProgressTracking.find({
      status: 'active',
      stoppedMovementDetected: true
    })
      .populate('trip')
      .populate('driver', 'name phone email')
      .sort({ firstStoppedDetectedAt: -1 });
    
    res.json({
      success: true,
      count: tracking.length,
      tracking
    });
  } catch (error) {
    console.error('Error fetching stopped alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stopped alerts',
      error: error.message
    });
  }
});

/**
 * GET /api/trip-monitoring/driver-progress/statistics
 * Get driver progress statistics
 */
router.get('/driver-progress-statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await DriverProgressTracking.getStatistics(start, end);
    
    res.json({
      success: true,
      period: { start, end },
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching progress statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// ==================== DASHBOARD OVERVIEW ====================

/**
 * GET /api/trip-monitoring/dashboard
 * Get overall monitoring dashboard data
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get active unassigned alerts
    const unassignedAlerts = await UnassignedTripAlert.find({
      status: { $in: ['pending', 'alerting'] }
    }).populate('trip', 'trip_number pickup_time pickup_location');
    
    // Get drivers with issues
    const lateDrivers = await DriverProgressTracking.find({
      status: 'active',
      latenessDetected: true
    })
      .populate('trip', 'trip_number pickup_time')
      .populate('driver', 'name phone');
    
    const stoppedDrivers = await DriverProgressTracking.find({
      status: 'active',
      stoppedMovementDetected: true
    })
      .populate('trip', 'trip_number pickup_time')
      .populate('driver', 'name phone');
    
    // Get upcoming trips without drivers (next 4 hours)
    const fourHoursFromNow = new Date(Date.now() + (4 * 60 * 60 * 1000));
    const upcomingUnassigned = await Trip.countDocuments({
      driver: null,
      pickup_time: {
        $gte: new Date(),
        $lte: fourHoursFromNow
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    // Get active trips count
    const activeTripsCount = await Trip.countDocuments({
      status: 'in_progress'
    });
    
    res.json({
      success: true,
      dashboard: {
        unassignedAlerts: {
          count: unassignedAlerts.length,
          alerts: unassignedAlerts
        },
        lateDrivers: {
          count: lateDrivers.length,
          drivers: lateDrivers
        },
        stoppedDrivers: {
          count: stoppedDrivers.length,
          drivers: stoppedDrivers
        },
        upcomingUnassigned: {
          count: upcomingUnassigned
        },
        activeTrips: {
          count: activeTripsCount
        },
        summary: {
          totalIssues: unassignedAlerts.length + lateDrivers.length + stoppedDrivers.length,
          criticalAlerts: unassignedAlerts.filter(a => a.isEscalated).length
        }
      }
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

export default router;
