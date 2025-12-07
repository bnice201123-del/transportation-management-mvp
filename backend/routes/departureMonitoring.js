import express from 'express';
import TripDepartureMonitoring from '../models/TripDepartureMonitoring.js';
import Trip from '../models/Trip.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateTravelTime, calculateDepartureTime, getTimeUntilDeparture, isTripTooSoon } from '../utils/departureCalculations.js';
import { createNotification } from '../utils/notificationHelper.js';

const router = express.Router();

/**
 * Initialize monitoring for a trip
 * POST /api/departure-monitoring/initialize
 */
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const { tripId, driverId, driverLocation } = req.body;

    // Get trip details
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if monitoring already exists
    let monitoring = await TripDepartureMonitoring.findOne({ tripId });
    if (monitoring) {
      return res.json({
        message: 'Monitoring already exists',
        monitoring
      });
    }

    // Calculate travel time if driver location provided
    let estimatedTravelTime = 15; // default
    if (driverLocation && trip.pickupLocation) {
      const travelData = await calculateTravelTime(
        { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
        { latitude: trip.pickupLocation.coordinates[1], longitude: trip.pickupLocation.coordinates[0] }
      );
      estimatedTravelTime = travelData.travelTimeMinutes;
    }

    // Create monitoring
    monitoring = await TripDepartureMonitoring.createMonitoring({
      tripId: trip._id,
      driverId: driverId || trip.driver,
      pickupLocation: {
        latitude: trip.pickupLocation.coordinates[1],
        longitude: trip.pickupLocation.coordinates[0],
        address: trip.pickupLocation.address
      },
      scheduledPickupTime: trip.scheduledDate,
      estimatedTravelTimeMinutes: estimatedTravelTime,
      driverCurrentLocation: driverLocation
    });

    res.status(201).json({
      message: 'Departure monitoring initialized',
      monitoring,
      departureTime: monitoring.recommendedDepartureTime,
      isLastMinute: monitoring.isLastMinuteTrip
    });
  } catch (error) {
    console.error('Error initializing monitoring:', error);
    res.status(500).json({ message: 'Error initializing monitoring' });
  }
});

/**
 * Start navigation for a trip
 * POST /api/departure-monitoring/:monitoringId/start-navigation
 */
router.post('/:monitoringId/start-navigation', authenticateToken, async (req, res) => {
  try {
    const { monitoringId } = req.params;
    const { driverLocation } = req.body;

    const monitoring = await TripDepartureMonitoring.findById(monitoringId)
      .populate('tripId', 'tripId')
      .populate('driverId', 'firstName lastName');

    if (!monitoring) {
      return res.status(404).json({ message: 'Monitoring record not found' });
    }

    // Check authorization
    if (monitoring.driverId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (monitoring.navigationStarted) {
      return res.json({
        message: 'Navigation already started',
        monitoring
      });
    }

    // Update driver location if provided
    if (driverLocation) {
      await monitoring.updateDriverLocation(driverLocation.latitude, driverLocation.longitude);
    }

    // Mark navigation as started
    await monitoring.startNavigation();

    res.json({
      message: 'Navigation started successfully',
      monitoring,
      startedAt: monitoring.navigationStartTime
    });
  } catch (error) {
    console.error('Error starting navigation:', error);
    res.status(500).json({ message: 'Error starting navigation' });
  }
});

/**
 * Update driver location
 * PATCH /api/departure-monitoring/:monitoringId/location
 */
router.patch('/:monitoringId/location', authenticateToken, async (req, res) => {
  try {
    const { monitoringId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }

    const monitoring = await TripDepartureMonitoring.findById(monitoringId);

    if (!monitoring) {
      return res.status(404).json({ message: 'Monitoring record not found' });
    }

    // Check authorization
    if (monitoring.driverId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await monitoring.updateDriverLocation(latitude, longitude);

    res.json({
      message: 'Location updated',
      monitoring
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
});

/**
 * Get monitoring status for a trip
 * GET /api/departure-monitoring/trip/:tripId
 */
router.get('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const monitoring = await TripDepartureMonitoring.findOne({ tripId })
      .populate('tripId', 'tripId status pickupLocation scheduledDate')
      .populate('driverId', 'firstName lastName email phone');

    if (!monitoring) {
      return res.status(404).json({ message: 'Monitoring not found for this trip' });
    }

    // Calculate time until departure
    const timeInfo = getTimeUntilDeparture(monitoring.recommendedDepartureTime);

    res.json({
      monitoring,
      timeUntilDeparture: timeInfo,
      shouldLeave: timeInfo.isPast || timeInfo.isImmediate,
      isLate: monitoring.isDriverLate()
    });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ message: 'Error getting monitoring status' });
  }
});

/**
 * Get all active monitoring for a driver
 * GET /api/departure-monitoring/driver/:driverId
 */
router.get('/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Check authorization
    const userRoles = req.user.roles || [req.user.role];
    const isAuthorized = req.user.userId === driverId || 
                         userRoles.some(role => ['admin', 'dispatcher'].includes(role));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const monitoringRecords = await TripDepartureMonitoring.find({
      driverId,
      status: { $in: ['monitoring', 'late'] }
    })
    .populate('tripId', 'tripId status pickupLocation dropoffLocation scheduledDate')
    .sort({ recommendedDepartureTime: 1 });

    // Add time calculations
    const enrichedRecords = monitoringRecords.map(record => ({
      ...record.toObject(),
      timeUntilDeparture: getTimeUntilDeparture(record.recommendedDepartureTime),
      isLate: record.isDriverLate()
    }));

    res.json({
      monitoringRecords: enrichedRecords,
      count: enrichedRecords.length
    });
  } catch (error) {
    console.error('Error getting driver monitoring:', error);
    res.status(500).json({ message: 'Error getting driver monitoring' });
  }
});

/**
 * Get all late drivers (for dispatch dashboard)
 * GET /api/departure-monitoring/late-drivers
 */
router.get('/late-drivers', authenticateToken, async (req, res) => {
  try {
    // Check authorization
    const userRoles = req.user.roles || [req.user.role];
    const hasPermission = userRoles.some(role => ['admin', 'dispatcher', 'scheduler'].includes(role));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lateDrivers = await TripDepartureMonitoring.getLateDrivers();

    // Enrich with time calculations
    const enrichedRecords = lateDrivers.map(record => {
      const timeInfo = getTimeUntilDeparture(record.recommendedDepartureTime);
      return {
        ...record.toObject(),
        minutesLate: Math.abs(timeInfo.minutes),
        timeInfo
      };
    });

    res.json({
      lateDrivers: enrichedRecords,
      count: enrichedRecords.length
    });
  } catch (error) {
    console.error('Error getting late drivers:', error);
    res.status(500).json({ message: 'Error getting late drivers' });
  }
});

/**
 * Cancel monitoring (when trip is cancelled or reassigned)
 * DELETE /api/departure-monitoring/:monitoringId
 */
router.delete('/:monitoringId', authenticateToken, async (req, res) => {
  try {
    const { monitoringId } = req.params;

    // Check authorization
    const userRoles = req.user.roles || [req.user.role];
    const hasPermission = userRoles.some(role => ['admin', 'dispatcher', 'scheduler'].includes(role));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const monitoring = await TripDepartureMonitoring.findById(monitoringId);

    if (!monitoring) {
      return res.status(404).json({ message: 'Monitoring record not found' });
    }

    await monitoring.completeMonitoring('cancelled');

    res.json({
      message: 'Monitoring cancelled',
      monitoring
    });
  } catch (error) {
    console.error('Error cancelling monitoring:', error);
    res.status(500).json({ message: 'Error cancelling monitoring' });
  }
});

/**
 * Complete monitoring (when driver arrives at pickup)
 * POST /api/departure-monitoring/:monitoringId/complete
 */
router.post('/:monitoringId/complete', authenticateToken, async (req, res) => {
  try {
    const { monitoringId } = req.params;

    const monitoring = await TripDepartureMonitoring.findById(monitoringId);

    if (!monitoring) {
      return res.status(404).json({ message: 'Monitoring record not found' });
    }

    // Check authorization
    if (monitoring.driverId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await monitoring.completeMonitoring('completed');

    res.json({
      message: 'Monitoring completed',
      monitoring
    });
  } catch (error) {
    console.error('Error completing monitoring:', error);
    res.status(500).json({ message: 'Error completing monitoring' });
  }
});

export default router;
