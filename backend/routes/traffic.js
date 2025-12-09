import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { 
  getTrafficInfo, 
  getTrafficIncidents,
  getBatchETAs,
  monitorTrafficConditions,
  getOptimalDepartureTime,
  calculateTrafficSurge
} from '../services/trafficService.js';
import { logActivity } from '../utils/logger.js';
import Trip from '../models/Trip.js';

const router = express.Router();

// Get real-time traffic info for a route
router.post('/info', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, waypoints = [], departureTime = 'now' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const trafficInfo = await getTrafficInfo(origin, destination, waypoints, departureTime);

    res.json(trafficInfo);
  } catch (error) {
    console.error('Traffic info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching traffic information',
      error: error.message
    });
  }
});

// Get traffic incidents along a route
router.post('/incidents', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, radius = 5000 } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const incidents = await getTrafficIncidents(origin, destination, radius);

    res.json(incidents);
  } catch (error) {
    console.error('Traffic incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching traffic incidents',
      error: error.message
    });
  }
});

// Get batch ETAs for multiple destinations
router.post('/batch-eta', authenticateToken, async (req, res) => {
  try {
    const { origins, destinations, departureTime = 'now' } = req.body;

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return res.status(400).json({
        success: false,
        message: 'Origins and destinations arrays are required'
      });
    }

    const batchETAs = await getBatchETAs(origins, destinations, departureTime);

    res.json(batchETAs);
  } catch (error) {
    console.error('Batch ETA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batch ETAs',
      error: error.message
    });
  }
});

// Monitor traffic conditions for a trip
router.post('/monitor/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { alertThreshold = 15 } = req.body;

    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const waypoints = trip.waypoints || [];
    const monitorResult = await monitorTrafficConditions(
      tripId,
      trip.pickupLocation,
      trip.dropoffLocation,
      waypoints,
      alertThreshold
    );

    // If alert needed, log it
    if (monitorResult.shouldAlert) {
      await logActivity(
        req.user._id,
        'traffic_alert',
        `Traffic alert for trip ${trip.tripId}: ${monitorResult.message}`,
        {
          tripId: trip.tripId,
          trafficLevel: monitorResult.trafficLevel,
          delayMinutes: monitorResult.delayMinutes
        },
        trip._id
      );
    }

    res.json({
      success: true,
      tripId: trip.tripId,
      monitoring: monitorResult
    });
  } catch (error) {
    console.error('Traffic monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Error monitoring traffic',
      error: error.message
    });
  }
});

// Get optimal departure time
router.post('/optimal-departure', authenticateToken, async (req, res) => {
  try {
    const { origin, destination, waypoints = [], targetArrivalTime } = req.body;

    if (!origin || !destination || !targetArrivalTime) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and targetArrivalTime are required'
      });
    }

    const optimalTime = await getOptimalDepartureTime(
      origin, 
      destination, 
      waypoints, 
      targetArrivalTime
    );

    res.json(optimalTime);
  } catch (error) {
    console.error('Optimal departure time error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating optimal departure time',
      error: error.message
    });
  }
});

// Calculate traffic surge pricing
router.post('/surge-pricing', authenticateToken, async (req, res) => {
  try {
    const { trafficLevel, trafficDelay, baseMultiplier = 1.0 } = req.body;

    if (!trafficLevel || trafficDelay === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Traffic level and delay are required'
      });
    }

    const surge = calculateTrafficSurge(trafficLevel, trafficDelay, baseMultiplier);

    res.json({
      success: true,
      surge
    });
  } catch (error) {
    console.error('Surge pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating surge pricing',
      error: error.message
    });
  }
});

// Get traffic data for active trips (admin/dispatcher)
router.get('/active-trips', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const activeTrips = await Trip.find({
      status: { $in: ['assigned', 'in_progress'] },
      scheduledDate: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)  // Next 24 hours
      }
    }).populate('assignedDriver', 'firstName lastName');

    const trafficData = await Promise.all(
      activeTrips.slice(0, 20).map(async (trip) => { // Limit to 20 to avoid API quota issues
        try {
          const waypoints = trip.waypoints || [];
          const trafficInfo = await getTrafficInfo(
            trip.pickupLocation,
            trip.dropoffLocation,
            waypoints
          );

          return {
            tripId: trip.tripId,
            _id: trip._id,
            driver: trip.assignedDriver,
            status: trip.status,
            pickupAddress: trip.pickupLocation.address,
            dropoffAddress: trip.dropoffLocation.address,
            scheduledTime: trip.scheduledTime,
            traffic: trafficInfo.success ? trafficInfo.trafficData : null
          };
        } catch (error) {
          console.error(`Error fetching traffic for trip ${trip.tripId}:`, error);
          return {
            tripId: trip.tripId,
            _id: trip._id,
            error: 'Failed to fetch traffic data'
          };
        }
      })
    );

    res.json({
      success: true,
      trips: trafficData,
      total: activeTrips.length,
      fetched: trafficData.length
    });
  } catch (error) {
    console.error('Active trips traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching traffic data for active trips',
      error: error.message
    });
  }
});

// Update trip with current traffic data
router.patch('/update-trip/:tripId', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const waypoints = trip.waypoints || [];
    const trafficInfo = await getTrafficInfo(
      trip.pickupLocation,
      trip.dropoffLocation,
      waypoints
    );

    if (trafficInfo.success) {
      // Update trip with traffic data
      if (!trip.routeOptimization) {
        trip.routeOptimization = {};
      }

      trip.routeOptimization.trafficConsidered = true;
      trip.routeOptimization.trafficData = {
        fetchedAt: trafficInfo.trafficData.fetchedAt,
        conditions: trafficInfo.trafficData.trafficLevel,
        delayMinutes: trafficInfo.trafficData.trafficDelay,
        estimatedDurationInTraffic: trafficInfo.trafficData.estimatedDurationInTraffic
      };

      // Update estimated duration if traffic affects it significantly
      if (trafficInfo.trafficData.estimatedDurationInTraffic > trip.estimatedDuration) {
        trip.estimatedDuration = Math.round(trafficInfo.trafficData.estimatedDurationInTraffic);
      }

      await trip.save();

      await logActivity(
        req.user._id,
        'trip_traffic_updated',
        `Updated traffic data for trip ${trip.tripId}`,
        {
          tripId: trip.tripId,
          trafficLevel: trafficInfo.trafficData.trafficLevel,
          delayMinutes: trafficInfo.trafficData.trafficDelay
        },
        trip._id
      );

      res.json({
        success: true,
        message: 'Trip updated with traffic data',
        trip,
        trafficData: trafficInfo.trafficData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch traffic data',
        error: trafficInfo.error
      });
    }
  } catch (error) {
    console.error('Update trip traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip with traffic data',
      error: error.message
    });
  }
});

export default router;
