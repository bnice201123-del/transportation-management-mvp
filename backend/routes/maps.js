import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  downloadOfflineMapTiles,
  getMapStyle,
  createGeofence,
  isPointInGeofence,
  calculateSpeed,
  checkSpeedLimit,
  checkRouteDeviation,
  getFuelEfficientRoute
} from '../services/mapService.js';
import {
  generateDriverHeatmap,
  predictTraffic,
  getAreaAnalytics,
  getRoutePlayback,
  improveETAAccuracy
} from '../services/analyticsService.js';
import Geofence from '../models/Geofence.js';
import ParkingLocation from '../models/ParkingLocation.js';
import Trip from '../models/Trip.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// ========== Offline Maps ==========

// Download offline map tiles
router.post('/offline/download', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { bounds, zoomLevels } = req.body;

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bounds. Required: north, south, east, west'
      });
    }

    const result = await downloadOfflineMapTiles(bounds, zoomLevels);

    res.json(result);
  } catch (error) {
    console.error('Download offline maps error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading offline maps',
      error: error.message
    });
  }
});

// ========== Map Styles ==========

// Get map style/theme
router.get('/styles/:theme', authenticateToken, async (req, res) => {
  try {
    const { theme } = req.params;
    const result = getMapStyle(theme);

    res.json(result);
  } catch (error) {
    console.error('Get map style error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting map style',
      error: error.message
    });
  }
});

// ========== Geofences ==========

// Get all geofences
router.get('/geofences', authenticateToken, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const geofences = await Geofence.find(filter)
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      geofences
    });
  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geofences',
      error: error.message
    });
  }
});

// Get single geofence
router.get('/geofences/:id', authenticateToken, async (req, res) => {
  try {
    const geofence = await Geofence.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('notifications.notifyUsers', 'firstName lastName email');

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.json({
      success: true,
      geofence
    });
  } catch (error) {
    console.error('Get geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geofence',
      error: error.message
    });
  }
});

// Create geofence
router.post('/geofences', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const geofenceResult = createGeofence(req.body);
    
    if (!geofenceResult.success) {
      return res.status(400).json(geofenceResult);
    }

    const geofence = new Geofence({
      ...geofenceResult.geofence,
      createdBy: req.user._id
    });

    await geofence.save();

    await logActivity(
      req.user._id,
      'geofence_created',
      `Created geofence: ${geofence.name}`,
      { geofenceId: geofence.geofenceId }
    );

    res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      geofence
    });
  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating geofence',
      error: error.message
    });
  }
});

// Update geofence
router.put('/geofences/:id', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'center', 'radius', 'polygon', 'category',
      'triggerEvents', 'dwellTimeMinutes', 'schedule', 'notifications',
      'speedLimit', 'isActive', 'metadata'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        geofence[field] = req.body[field];
      }
    });

    await geofence.save();

    await logActivity(
      req.user._id,
      'geofence_updated',
      `Updated geofence: ${geofence.name}`,
      { geofenceId: geofence.geofenceId }
    );

    res.json({
      success: true,
      message: 'Geofence updated successfully',
      geofence
    });
  } catch (error) {
    console.error('Update geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating geofence',
      error: error.message
    });
  }
});

// Delete geofence
router.delete('/geofences/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    await logActivity(
      req.user._id,
      'geofence_deleted',
      `Deleted geofence: ${geofence.name}`,
      { geofenceId: geofence.geofenceId }
    );

    res.json({
      success: true,
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    console.error('Delete geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting geofence',
      error: error.message
    });
  }
});

// Check point in geofence
router.post('/geofences/:id/check-point', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    const isInside = isPointInGeofence({ lat, lng }, geofence);

    res.json({
      success: true,
      isInside,
      geofence: {
        id: geofence._id,
        name: geofence.name,
        category: geofence.category
      },
      point: { lat, lng }
    });
  } catch (error) {
    console.error('Check point in geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking point in geofence',
      error: error.message
    });
  }
});

// ========== Parking Locations ==========

// Get all parking locations
router.get('/parking', authenticateToken, async (req, res) => {
  try {
    const { facilityType, isActive, availableOnly } = req.query;
    
    const filter = {};
    if (facilityType) filter.facilityType = facilityType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (availableOnly === 'true') filter['capacity.available'] = { $gt: 0 };

    const parkingLocations = await ParkingLocation.find(filter)
      .populate('assignedVehicles.vehicle', 'make model licensePlate')
      .populate('geofence');

    res.json({
      success: true,
      parkingLocations
    });
  } catch (error) {
    console.error('Get parking locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parking locations',
      error: error.message
    });
  }
});

// Create parking location
router.post('/parking', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const parkingLocation = new ParkingLocation({
      ...req.body,
      createdBy: req.user._id
    });

    await parkingLocation.save();

    await logActivity(
      req.user._id,
      'parking_location_created',
      `Created parking location: ${parkingLocation.name}`,
      { parkingLocationId: parkingLocation._id }
    );

    res.status(201).json({
      success: true,
      message: 'Parking location created successfully',
      parkingLocation
    });
  } catch (error) {
    console.error('Create parking location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating parking location',
      error: error.message
    });
  }
});

// ========== Speed Monitoring ==========

// Calculate speed between two points
router.post('/speed/calculate', authenticateToken, async (req, res) => {
  try {
    const { point1, point2 } = req.body;

    if (!point1 || !point2) {
      return res.status(400).json({
        success: false,
        message: 'Two GPS points are required'
      });
    }

    const result = calculateSpeed(point1, point2);

    res.json({
      success: true,
      speed: result
    });
  } catch (error) {
    console.error('Calculate speed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating speed',
      error: error.message
    });
  }
});

// Check speed limit
router.post('/speed/check-limit', authenticateToken, async (req, res) => {
  try {
    const { currentSpeed, speedLimit } = req.body;

    if (currentSpeed === undefined || speedLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Current speed and speed limit are required'
      });
    }

    const result = checkSpeedLimit(currentSpeed, speedLimit);

    res.json({
      success: true,
      speedCheck: result
    });
  } catch (error) {
    console.error('Check speed limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking speed limit',
      error: error.message
    });
  }
});

// ========== Route Monitoring ==========

// Check route deviation
router.post('/route/check-deviation', authenticateToken, async (req, res) => {
  try {
    const { currentLocation, plannedRoute, threshold } = req.body;

    if (!currentLocation || !plannedRoute) {
      return res.status(400).json({
        success: false,
        message: 'Current location and planned route are required'
      });
    }

    const result = checkRouteDeviation(currentLocation, plannedRoute, threshold);

    res.json({
      success: true,
      deviation: result
    });
  } catch (error) {
    console.error('Check route deviation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking route deviation',
      error: error.message
    });
  }
});

// Get fuel-efficient route
router.post('/route/fuel-efficient', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const result = await getFuelEfficientRoute(origin, destination, waypoints);

    res.json(result);
  } catch (error) {
    console.error('Get fuel-efficient route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting fuel-efficient route',
      error: error.message
    });
  }
});

// ========== Analytics ==========

// Generate driver heatmap
router.get('/analytics/heatmap/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await generateDriverHeatmap(driverId, { startDate, endDate });

    res.json(result);
  } catch (error) {
    console.error('Generate driver heatmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating driver heatmap',
      error: error.message
    });
  }
});

// Predict traffic
router.post('/analytics/predict-traffic', authenticateToken, async (req, res) => {
  try {
    const { route, targetTime } = req.body;

    if (!route || !targetTime) {
      return res.status(400).json({
        success: false,
        message: 'Route and target time are required'
      });
    }

    const result = await predictTraffic(route, targetTime);

    res.json(result);
  } catch (error) {
    console.error('Predict traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting traffic',
      error: error.message
    });
  }
});

// Get area analytics
router.post('/analytics/area', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { bounds, startDate, endDate } = req.body;

    if (!bounds) {
      return res.status(400).json({
        success: false,
        message: 'Bounds are required (north, south, east, west)'
      });
    }

    const result = await getAreaAnalytics(bounds, { startDate, endDate });

    res.json(result);
  } catch (error) {
    console.error('Get area analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting area analytics',
      error: error.message
    });
  }
});

// Get route playback
router.get('/analytics/playback/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const result = await getRoutePlayback(tripId);

    res.json(result);
  } catch (error) {
    console.error('Get route playback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting route playback',
      error: error.message
    });
  }
});

// Improve ETA accuracy
router.post('/analytics/improve-eta', authenticateToken, async (req, res) => {
  try {
    const { route, estimatedETA } = req.body;

    if (!route || estimatedETA === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Route and estimated ETA are required'
      });
    }

    const result = await improveETAAccuracy(route, estimatedETA);

    res.json(result);
  } catch (error) {
    console.error('Improve ETA accuracy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error improving ETA accuracy',
      error: error.message
    });
  }
});

export default router;
