import express from 'express';
import DriverPreference from '../models/DriverPreference.js';
import DriverMatchingService from '../services/driverMatchingService.js';
import { authenticateToken } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// ============================================
// Driver Preference Management
// ============================================

/**
 * Get driver preferences
 * GET /api/driver-preferences/:driverId
 */
router.get('/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Authorization: drivers can only view their own, admin/dispatcher can view all
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view these preferences'
      });
    }

    const preferences = await DriverPreference.findOne({ driver: driverId })
      .populate('driver', 'firstName lastName email phone role rating')
      .populate('geographic.preferredAreas.geofenceId', 'name category')
      .populate('geographic.avoidAreas.geofenceId', 'name category')
      .populate('riderPreferences.preferredRiders.rider', 'firstName lastName rating')
      .populate('riderPreferences.avoidRiders.rider', 'firstName lastName');

    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found for this driver'
      });
    }

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching driver preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver preferences',
      details: error.message
    });
  }
});

/**
 * Create or update driver preferences
 * POST /api/driver-preferences/:driverId
 */
router.post('/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const preferenceData = req.body;

    // Authorization: drivers can only update their own, admin/dispatcher can update all
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update these preferences'
      });
    }

    // Check if preferences already exist
    let preferences = await DriverPreference.findOne({ driver: driverId });

    if (preferences) {
      // Update existing preferences
      Object.assign(preferences, preferenceData);
      preferences.lastModified = new Date();
      await preferences.save();

      await ActivityLog.create({
        userId: req.user.id,
        action: 'driver_preferences_updated',
        resourceType: 'DriverPreference',
        resourceId: preferences._id,
        details: {
          driverId,
          updatedBy: req.user.id,
          updatedFields: Object.keys(preferenceData)
        }
      });
    } else {
      // Create new preferences
      preferences = new DriverPreference({
        driver: driverId,
        ...preferenceData,
        createdBy: req.user.id
      });
      await preferences.save();

      await ActivityLog.create({
        userId: req.user.id,
        action: 'driver_preferences_created',
        resourceType: 'DriverPreference',
        resourceId: preferences._id,
        details: {
          driverId,
          createdBy: req.user.id
        }
      });
    }

    res.json({
      success: true,
      preferences,
      message: preferences ? 'Preferences updated successfully' : 'Preferences created successfully'
    });
  } catch (error) {
    console.error('Error saving driver preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save driver preferences',
      details: error.message
    });
  }
});

/**
 * Update specific preference section
 * PATCH /api/driver-preferences/:driverId/:section
 */
router.patch('/:driverId/:section', authenticateToken, async (req, res) => {
  try {
    const { driverId, section } = req.params;
    const updates = req.body;

    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.user.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update these preferences'
      });
    }

    const validSections = [
      'availability',
      'geographic',
      'tripPreferences',
      'riderPreferences',
      'languages',
      'vehiclePreferences',
      'compensation',
      'skills',
      'performance',
      'matchingWeights',
      'autoAccept',
      'notifications'
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preference section',
        validSections
      });
    }

    const preferences = await DriverPreference.findOne({ driver: driverId });
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    preferences[section] = { ...preferences[section], ...updates };
    preferences.lastModified = new Date();
    await preferences.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'driver_preferences_updated',
      resourceType: 'DriverPreference',
      resourceId: preferences._id,
      details: {
        driverId,
        section,
        updatedBy: req.user.id
      }
    });

    res.json({
      success: true,
      preferences,
      message: `${section} preferences updated successfully`
    });
  } catch (error) {
    console.error('Error updating preference section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preference section',
      details: error.message
    });
  }
});

/**
 * Delete driver preferences
 * DELETE /api/driver-preferences/:driverId
 */
router.delete('/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Only admin can delete preferences
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete driver preferences'
      });
    }

    const preferences = await DriverPreference.findOneAndDelete({ driver: driverId });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    await ActivityLog.create({
      userId: req.user.id,
      action: 'driver_preferences_deleted',
      resourceType: 'DriverPreference',
      resourceId: preferences._id,
      details: {
        driverId,
        deletedBy: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Driver preferences deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete driver preferences',
      details: error.message
    });
  }
});

/**
 * Record trip response (accept/reject) for statistics
 * POST /api/driver-preferences/:driverId/record-response
 */
router.post('/:driverId/record-response', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { accepted, responseTime } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'accepted field is required (boolean)'
      });
    }

    const preferences = await DriverPreference.findOne({ driver: driverId });
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    await preferences.recordTripResponse(accepted, responseTime || 0);

    res.json({
      success: true,
      statistics: preferences.statistics,
      message: 'Trip response recorded'
    });
  } catch (error) {
    console.error('Error recording trip response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record trip response',
      details: error.message
    });
  }
});

// ============================================
// Driver Matching Endpoints
// ============================================

/**
 * Find best matching drivers for a trip
 * POST /api/driver-preferences/match/find-drivers
 */
router.post('/match/find-drivers', authenticateToken, async (req, res) => {
  try {
    const { trip, options } = req.body;

    // Validate required fields
    if (!trip || !trip.pickupLocation) {
      return res.status(400).json({
        success: false,
        error: 'Trip with pickupLocation is required'
      });
    }

    // Only admin, dispatcher, or scheduler can find matches
    if (!['admin', 'dispatcher', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access driver matching'
      });
    }

    const matches = await DriverMatchingService.findBestMatches(trip, options);

    await ActivityLog.create({
      userId: req.user.id,
      action: 'driver_match_search',
      resourceType: 'Trip',
      details: {
        tripLocation: trip.pickupLocation,
        matchesFound: matches.matches?.length || 0,
        requestedBy: req.user.id
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Error finding driver matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find driver matches',
      details: error.message
    });
  }
});

/**
 * Assign trip to best available driver
 * POST /api/driver-preferences/match/assign-best
 */
router.post('/match/assign-best', authenticateToken, async (req, res) => {
  try {
    const { tripId, options } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: 'tripId is required'
      });
    }

    // Only admin, dispatcher, or scheduler can assign trips
    if (!['admin', 'dispatcher', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to assign trips'
      });
    }

    const result = await DriverMatchingService.assignToBestDriver(tripId, options);

    if (result.success) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'trip_auto_assigned',
        resourceType: 'Trip',
        resourceId: tripId,
        details: {
          assignedDriver: result.assignedDriver?.id,
          matchScore: result.matchScore,
          autoAccepted: result.autoAccepted,
          assignedBy: req.user.id
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error assigning trip to driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign trip',
      details: error.message
    });
  }
});

/**
 * Reassign trip to next best driver
 * POST /api/driver-preferences/match/reassign
 */
router.post('/match/reassign', authenticateToken, async (req, res) => {
  try {
    const { tripId, excludeDriverIds, options } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: 'tripId is required'
      });
    }

    // Only admin, dispatcher, or scheduler can reassign
    if (!['admin', 'dispatcher', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to reassign trips'
      });
    }

    const result = await DriverMatchingService.reassignTrip(
      tripId,
      excludeDriverIds || [],
      options
    );

    if (result.success) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'trip_reassigned',
        resourceType: 'Trip',
        resourceId: tripId,
        details: {
          newDriver: result.assignedDriver?.id,
          matchScore: result.matchScore,
          reassignmentCount: result.reassignmentCount,
          reassignedBy: req.user.id
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error reassigning trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reassign trip',
      details: error.message
    });
  }
});

/**
 * Batch assign multiple trips
 * POST /api/driver-preferences/match/batch-assign
 */
router.post('/match/batch-assign', authenticateToken, async (req, res) => {
  try {
    const { tripIds, options } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tripIds array is required'
      });
    }

    // Only admin, dispatcher, or scheduler
    if (!['admin', 'dispatcher', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to batch assign trips'
      });
    }

    const result = await DriverMatchingService.batchMatchTrips(tripIds, options);

    await ActivityLog.create({
      userId: req.user.id,
      action: 'trips_batch_assigned',
      resourceType: 'Trip',
      details: {
        totalTrips: tripIds.length,
        successful: result.summary.successful,
        failed: result.summary.failed,
        assignedBy: req.user.id
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error batch assigning trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch assign trips',
      details: error.message
    });
  }
});

/**
 * Get driver availability and readiness
 * GET /api/driver-preferences/match/availability/:driverId
 */
router.get('/match/availability/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const availability = await DriverMatchingService.getDriverAvailability(driverId);

    res.json(availability);
  } catch (error) {
    console.error('Error getting driver availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver availability',
      details: error.message
    });
  }
});

// ============================================
// List and Query Endpoints
// ============================================

/**
 * Get all driver preferences (admin/dispatcher only)
 * GET /api/driver-preferences
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin and dispatcher can view all preferences
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view all driver preferences'
      });
    }

    const { active, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const preferences = await DriverPreference.find(query)
      .populate('driver', 'firstName lastName email phone role rating isAvailable')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastModified: -1 });

    const total = await DriverPreference.countDocuments(query);

    res.json({
      success: true,
      preferences,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all driver preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver preferences',
      details: error.message
    });
  }
});

export default router;
