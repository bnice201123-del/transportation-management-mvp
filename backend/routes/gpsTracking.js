import express from 'express';
import Trip from '../models/Trip.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLocation, validators } from '../utils/validation.js';

const router = express.Router();

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Calculate speed between two points
function calculateSpeed(distance, timeDiff) {
  // distance in km, timeDiff in milliseconds
  if (timeDiff === 0) return 0;
  const hours = timeDiff / (1000 * 60 * 60);
  return distance / hours; // km/h
}

// Start GPS tracking for a trip
router.post('/:tripId/start', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, accuracy, altitude, timestamp } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify driver is assigned to this trip
    if (trip.assignedDriver?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to track this trip' });
    }

    // Initialize route tracking
    trip.routeTracking = {
      isEnabled: true,
      routePoints: [{
        latitude,
        longitude,
        timestamp: timestamp || new Date(),
        accuracy,
        altitude,
        speed: 0,
        heading: 0,
        isSignificant: true // Mark start point as significant
      }],
      routeSummary: {
        totalPoints: 1,
        totalDistance: 0,
        startTime: timestamp || new Date(),
        averageSpeed: 0,
        maxSpeed: 0,
        idleTime: 0,
        movingTime: 0
      },
      deviations: [],
      geofenceEvents: [{
        eventType: 'pickup_zone_entered',
        timestamp: timestamp || new Date(),
        location: { latitude, longitude }
      }]
    };

    // Update trip status if not already in progress
    if (trip.status !== 'in_progress') {
      trip.status = 'in_progress';
      trip.actualPickupTime = timestamp || new Date();
    }

    await trip.save();

    res.json({
      message: 'GPS tracking started',
      tripId: trip._id,
      routeTracking: trip.routeTracking
    });
  } catch (error) {
    console.error('Error starting GPS tracking:', error);
    res.status(500).json({ message: 'Failed to start GPS tracking', error: error.message });
  }
});

// Add GPS location point to trip route
router.post('/:tripId/location', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, accuracy, altitude, speed, heading, batteryLevel, timestamp } = req.body;

    // Validate location data
    const validation = validateLocation({ latitude, longitude, accuracy, altitude, speed });
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Location validation failed',
        errors: validation.errors
      });
    }

    // Additional coordinate range validation
    if (!validators.isValidCoordinates(latitude, longitude)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid coordinates',
        errors: {
          latitude: 'Latitude must be between -90 and 90',
          longitude: 'Longitude must be between -180 and 180'
        }
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify driver is assigned to this trip
    if (trip.assignedDriver?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    // Initialize routeTracking if it doesn't exist
    if (!trip.routeTracking) {
      trip.routeTracking = {
        isEnabled: true,
        routePoints: [],
        routeSummary: {
          totalPoints: 0,
          totalDistance: 0,
          startTime: new Date(),
          averageSpeed: 0,
          maxSpeed: 0
        },
        deviations: [],
        geofenceEvents: []
      };
    }

    const newPoint = {
      latitude,
      longitude,
      timestamp: timestamp || new Date(),
      accuracy,
      altitude,
      speed,
      heading,
      batteryLevel
    };

    // Calculate distance from last point if exists
    let distanceFromLast = 0;
    const routePoints = trip.routeTracking.routePoints || [];
    
    if (routePoints.length > 0) {
      const lastPoint = routePoints[routePoints.length - 1];
      distanceFromLast = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        latitude,
        longitude
      );

      // Only add point if significant movement (> 5 meters or significant time gap)
      const timeDiff = new Date(newPoint.timestamp) - new Date(lastPoint.timestamp);
      const shouldAdd = distanceFromLast > 0.005 || timeDiff > 30000; // 5m or 30s

      if (!shouldAdd && routePoints.length < 1000) {
        // Don't add point, but update location for real-time tracking
        trip.driverLocation = {
          lat: latitude,
          lng: longitude,
          lastUpdated: new Date()
        };
        await trip.save();
        return res.json({ message: 'Location updated (not stored)', skipped: true });
      }

      // Update route summary
      const currentDistance = trip.routeTracking.routeSummary.totalDistance || 0;
      trip.routeTracking.routeSummary.totalDistance = currentDistance + distanceFromLast;
      
      // Update max speed
      if (speed && speed > (trip.routeTracking.routeSummary.maxSpeed || 0)) {
        trip.routeTracking.routeSummary.maxSpeed = speed * 3.6; // Convert m/s to km/h
      }

      // Calculate average speed
      const totalTime = (new Date(newPoint.timestamp) - new Date(trip.routeTracking.routeSummary.startTime)) / 1000; // seconds
      if (totalTime > 0) {
        trip.routeTracking.routeSummary.averageSpeed = 
          (trip.routeTracking.routeSummary.totalDistance / totalTime) * 3600; // km/h
      }
    }

    // Add the new point
    trip.routeTracking.routePoints.push(newPoint);
    trip.routeTracking.routeSummary.totalPoints = (trip.routeTracking.routeSummary.totalPoints || 0) + 1;

    // Update driver location for real-time tracking
    trip.driverLocation = {
      lat: latitude,
      lng: longitude,
      lastUpdated: new Date()
    };

    // Mark for modification to ensure save
    trip.markModified('routeTracking');
    
    await trip.save();

    res.json({
      message: 'Location recorded',
      pointsRecorded: trip.routeTracking.routeSummary.totalPoints,
      totalDistance: trip.routeTracking.routeSummary.totalDistance,
      distanceAdded: distanceFromLast
    });
  } catch (error) {
    console.error('Error recording GPS location:', error);
    res.status(500).json({ message: 'Failed to record location', error: error.message });
  }
});

// Batch update - add multiple GPS points at once
router.post('/:tripId/locations/batch', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: 'Locations array is required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify authorization
    if (trip.assignedDriver?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    // Initialize if needed
    if (!trip.routeTracking) {
      trip.routeTracking = {
        isEnabled: true,
        routePoints: [],
        routeSummary: {
          totalPoints: 0,
          totalDistance: 0,
          startTime: new Date(),
          averageSpeed: 0,
          maxSpeed: 0
        },
        deviations: [],
        geofenceEvents: []
      };
    }

    let totalDistanceAdded = 0;
    let pointsAdded = 0;

    // Sort locations by timestamp
    const sortedLocations = locations.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (const loc of sortedLocations) {
      if (!loc.latitude || !loc.longitude) continue;

      const routePoints = trip.routeTracking.routePoints;
      let distanceFromLast = 0;

      if (routePoints.length > 0) {
        const lastPoint = routePoints[routePoints.length - 1];
        distanceFromLast = calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          loc.latitude,
          loc.longitude
        );
        totalDistanceAdded += distanceFromLast;
      }

      routePoints.push({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp || new Date(),
        accuracy: loc.accuracy,
        altitude: loc.altitude,
        speed: loc.speed,
        heading: loc.heading,
        batteryLevel: loc.batteryLevel
      });
      pointsAdded++;
    }

    // Update summary
    trip.routeTracking.routeSummary.totalPoints += pointsAdded;
    trip.routeTracking.routeSummary.totalDistance += totalDistanceAdded;

    // Update last location
    const lastLoc = sortedLocations[sortedLocations.length - 1];
    trip.driverLocation = {
      lat: lastLoc.latitude,
      lng: lastLoc.longitude,
      lastUpdated: new Date()
    };

    trip.markModified('routeTracking');
    await trip.save();

    res.json({
      message: 'Batch locations recorded',
      pointsAdded,
      totalPoints: trip.routeTracking.routeSummary.totalPoints,
      distanceAdded: totalDistanceAdded,
      totalDistance: trip.routeTracking.routeSummary.totalDistance
    });
  } catch (error) {
    console.error('Error recording batch locations:', error);
    res.status(500).json({ message: 'Failed to record batch locations', error: error.message });
  }
});

// Stop GPS tracking and finalize route
router.post('/:tripId/stop', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, timestamp } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify authorization
    if (trip.assignedDriver?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    if (!trip.routeTracking) {
      return res.status(400).json({ message: 'GPS tracking was not started for this trip' });
    }

    // Add final point
    if (latitude && longitude) {
      const finalPoint = {
        latitude,
        longitude,
        timestamp: timestamp || new Date(),
        isSignificant: true // Mark end point as significant
      };

      trip.routeTracking.routePoints.push(finalPoint);
      trip.routeTracking.routeSummary.totalPoints++;

      // Calculate final distance
      const routePoints = trip.routeTracking.routePoints;
      if (routePoints.length > 1) {
        const lastPoint = routePoints[routePoints.length - 2];
        const distanceFromLast = calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          latitude,
          longitude
        );
        trip.routeTracking.routeSummary.totalDistance += distanceFromLast;
      }
    }

    // Finalize route summary
    trip.routeTracking.routeSummary.endTime = timestamp || new Date();
    trip.routeTracking.isEnabled = false;

    // Calculate actual duration
    if (trip.routeTracking.routeSummary.startTime) {
      const duration = (new Date(trip.routeTracking.routeSummary.endTime) - 
                       new Date(trip.routeTracking.routeSummary.startTime)) / (1000 * 60);
      trip.routeTracking.routeSummary.actualDuration = duration;
    }

    // Add geofence event
    if (latitude && longitude) {
      trip.routeTracking.geofenceEvents.push({
        eventType: 'dropoff_zone_entered',
        timestamp: timestamp || new Date(),
        location: { latitude, longitude }
      });
    }

    // Update trip status
    if (trip.status === 'in_progress') {
      trip.status = 'completed';
      trip.actualDropoffTime = timestamp || new Date();
    }

    trip.markModified('routeTracking');
    await trip.save();

    res.json({
      message: 'GPS tracking stopped',
      routeSummary: trip.routeTracking.routeSummary
    });
  } catch (error) {
    console.error('Error stopping GPS tracking:', error);
    res.status(500).json({ message: 'Failed to stop GPS tracking', error: error.message });
  }
});

// Get route data for a trip
router.get('/:tripId/route', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { simplified } = req.query; // Optional: return simplified route

    const trip = await Trip.findById(tripId)
      .select('routeTracking pickupLocation dropoffLocation scheduledDate status riderName tripId');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization (drivers can see their trips, dispatchers/admins can see all)
    const canView = 
      req.user.role === 'admin' || 
      req.user.role === 'dispatcher' ||
      trip.assignedDriver?.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view this route' });
    }

    if (!trip.routeTracking || !trip.routeTracking.routePoints) {
      return res.status(404).json({ message: 'No route data available for this trip' });
    }

    let routeData = trip.routeTracking;

    // Simplify route if requested (return every Nth point)
    if (simplified && routeData.routePoints.length > 100) {
      const step = Math.ceil(routeData.routePoints.length / 100);
      routeData = {
        ...routeData.toObject(),
        routePoints: routeData.routePoints.filter((point, index) => 
          index % step === 0 || point.isSignificant
        )
      };
    }

    res.json({
      tripId: trip._id,
      tripNumber: trip.tripId,
      riderName: trip.riderName,
      scheduledDate: trip.scheduledDate,
      status: trip.status,
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
      routeTracking: routeData
    });
  } catch (error) {
    console.error('Error fetching route data:', error);
    res.status(500).json({ message: 'Failed to fetch route data', error: error.message });
  }
});

// Get route statistics and analytics
router.get('/:tripId/route/analytics', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .select('routeTracking pickupLocation dropoffLocation estimatedDistance estimatedDuration');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!trip.routeTracking) {
      return res.status(404).json({ message: 'No route data available' });
    }

    const summary = trip.routeTracking.routeSummary;
    const routePoints = trip.routeTracking.routePoints;

    // Calculate additional analytics
    const analytics = {
      summary: summary,
      comparison: {
        estimatedDistance: trip.estimatedDistance,
        actualDistance: summary.totalDistance,
        distanceVariance: trip.estimatedDistance 
          ? ((summary.totalDistance - trip.estimatedDistance) / trip.estimatedDistance * 100).toFixed(2) + '%'
          : 'N/A',
        estimatedDuration: trip.estimatedDuration,
        actualDuration: summary.actualDuration,
        durationVariance: trip.estimatedDuration
          ? ((summary.actualDuration - trip.estimatedDuration) / trip.estimatedDuration * 100).toFixed(2) + '%'
          : 'N/A'
      },
      routeQuality: {
        totalPoints: routePoints.length,
        significantPoints: routePoints.filter(p => p.isSignificant).length,
        averageAccuracy: routePoints.reduce((sum, p) => sum + (p.accuracy || 0), 0) / routePoints.length || 0,
        dataCompleteness: (routePoints.filter(p => p.speed && p.heading).length / routePoints.length * 100).toFixed(2) + '%'
      },
      deviations: {
        count: trip.routeTracking.deviations?.length || 0,
        totalDeviationTime: trip.routeTracking.deviations?.reduce((sum, d) => sum + (d.duration || 0), 0) || 0
      },
      geofenceEvents: trip.routeTracking.geofenceEvents || []
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching route analytics:', error);
    res.status(500).json({ message: 'Failed to fetch route analytics', error: error.message });
  }
});

// Export route data (for reporting)
router.get('/:tripId/route/export', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { format = 'json' } = req.query; // json, csv, gpx

    const trip = await Trip.findById(tripId)
      .select('routeTracking pickupLocation dropoffLocation scheduledDate riderName tripId assignedDriver')
      .populate('assignedDriver', 'firstName lastName');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!trip.routeTracking || !trip.routeTracking.routePoints) {
      return res.status(404).json({ message: 'No route data available' });
    }

    const routePoints = trip.routeTracking.routePoints;

    if (format === 'csv') {
      // CSV format
      let csv = 'Timestamp,Latitude,Longitude,Accuracy,Altitude,Speed,Heading,Battery\n';
      routePoints.forEach(point => {
        csv += `${point.timestamp},${point.latitude},${point.longitude},${point.accuracy || ''},${point.altitude || ''},${point.speed || ''},${point.heading || ''},${point.batteryLevel || ''}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=trip-${trip.tripId}-route.csv`);
      return res.send(csv);
    } else if (format === 'gpx') {
      // GPX format
      let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
      gpx += '<gpx version="1.1" creator="Transportation Management System">\n';
      gpx += `  <metadata>\n`;
      gpx += `    <name>Trip ${trip.tripId}</name>\n`;
      gpx += `    <desc>Route for ${trip.riderName} on ${trip.scheduledDate}</desc>\n`;
      gpx += `  </metadata>\n`;
      gpx += '  <trk>\n';
      gpx += `    <name>Trip ${trip.tripId}</name>\n`;
      gpx += '    <trkseg>\n';
      
      routePoints.forEach(point => {
        gpx += `      <trkpt lat="${point.latitude}" lon="${point.longitude}">\n`;
        if (point.altitude) gpx += `        <ele>${point.altitude}</ele>\n`;
        gpx += `        <time>${new Date(point.timestamp).toISOString()}</time>\n`;
        gpx += '      </trkpt>\n';
      });
      
      gpx += '    </trkseg>\n';
      gpx += '  </trk>\n';
      gpx += '</gpx>';
      
      res.setHeader('Content-Type', 'application/gpx+xml');
      res.setHeader('Content-Disposition', `attachment; filename=trip-${trip.tripId}-route.gpx`);
      return res.send(gpx);
    } else {
      // JSON format (default)
      res.json({
        tripId: trip._id,
        tripNumber: trip.tripId,
        riderName: trip.riderName,
        driver: trip.assignedDriver ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 'Unassigned',
        scheduledDate: trip.scheduledDate,
        pickupLocation: trip.pickupLocation,
        dropoffLocation: trip.dropoffLocation,
        routeTracking: trip.routeTracking
      });
    }
  } catch (error) {
    console.error('Error exporting route:', error);
    res.status(500).json({ message: 'Failed to export route', error: error.message });
  }
});

export default router;
