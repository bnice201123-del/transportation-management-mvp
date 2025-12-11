import Trip from '../models/Trip.js';
import User from '../models/User.js';

/**
 * Advanced Analytics Service
 * Provides traffic prediction, heatmaps, and area-based insights
 */

/**
 * Generate driver heatmap data
 */
export async function generateDriverHeatmap(driverId, dateRange = {}) {
  try {
    const { startDate, endDate } = dateRange;
    const filter = {
      assignedDriver: driverId,
      status: 'completed'
    };

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const trips = await Trip.find(filter).select('routeTracking pickupLocation dropoffLocation');

    const heatmapPoints = [];
    
    trips.forEach(trip => {
      // Add pickup and dropoff locations
      heatmapPoints.push({
        lat: trip.pickupLocation.lat,
        lng: trip.pickupLocation.lng,
        weight: 1
      });
      
      heatmapPoints.push({
        lat: trip.dropoffLocation.lat,
        lng: trip.dropoffLocation.lng,
        weight: 1
      });

      // Add route tracking points if available
      if (trip.routeTracking && trip.routeTracking.routePoints) {
        trip.routeTracking.routePoints.forEach(point => {
          heatmapPoints.push({
            lat: point.latitude,
            lng: point.longitude,
            weight: 0.5
          });
        });
      }
    });

    // Aggregate nearby points
    const aggregatedPoints = aggregateHeatmapPoints(heatmapPoints);

    return {
      success: true,
      driverId,
      dateRange,
      totalTrips: trips.length,
      heatmapPoints: aggregatedPoints,
      bounds: calculateBounds(aggregatedPoints)
    };
  } catch (error) {
    console.error('Generate driver heatmap error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Aggregate heatmap points within proximity
 */
function aggregateHeatmapPoints(points, precision = 4) {
  const grid = {};
  
  points.forEach(point => {
    const key = `${point.lat.toFixed(precision)},${point.lng.toFixed(precision)}`;
    
    if (!grid[key]) {
      grid[key] = {
        lat: parseFloat(point.lat.toFixed(precision)),
        lng: parseFloat(point.lng.toFixed(precision)),
        weight: 0
      };
    }
    
    grid[key].weight += point.weight;
  });

  return Object.values(grid);
}

/**
 * Calculate bounds for heatmap
 */
function calculateBounds(points) {
  if (points.length === 0) return null;

  let north = -90, south = 90, east = -180, west = 180;

  points.forEach(point => {
    if (point.lat > north) north = point.lat;
    if (point.lat < south) south = point.lat;
    if (point.lng > east) east = point.lng;
    if (point.lng < west) west = point.lng;
  });

  return { north, south, east, west };
}

/**
 * Predict traffic based on historical data
 */
export async function predictTraffic(route, targetTime) {
  try {
    const { origin, destination, waypoints = [] } = route;
    const targetDate = new Date(targetTime);
    const dayOfWeek = targetDate.getDay();
    const hour = targetDate.getHours();

    // Find similar historical trips
    const historicalTrips = await Trip.find({
      'pickupLocation.lat': { $gte: origin.lat - 0.1, $lte: origin.lat + 0.1 },
      'pickupLocation.lng': { $gte: origin.lng - 0.1, $lte: origin.lng + 0.1 },
      'dropoffLocation.lat': { $gte: destination.lat - 0.1, $lte: destination.lat + 0.1 },
      'dropoffLocation.lng': { $gte: destination.lng - 0.1, $lte: destination.lng + 0.1 },
      status: 'completed',
      'routeOptimization.trafficData': { $exists: true }
    }).limit(100);

    // Filter by similar time of day and day of week
    const relevantTrips = historicalTrips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      const tripDay = tripDate.getDay();
      const tripHour = parseInt(trip.scheduledTime.split(':')[0]);

      return tripDay === dayOfWeek && Math.abs(tripHour - hour) <= 1;
    });

    if (relevantTrips.length === 0) {
      return {
        success: true,
        prediction: 'insufficient_data',
        confidence: 0,
        message: 'Not enough historical data for accurate prediction'
      };
    }

    // Analyze traffic patterns
    const trafficLevels = {
      light: 0,
      moderate: 0,
      heavy: 0,
      severe: 0
    };

    let totalDelay = 0;
    let totalDuration = 0;

    relevantTrips.forEach(trip => {
      const trafficLevel = trip.routeOptimization.trafficData?.conditions || 'light';
      trafficLevels[trafficLevel]++;
      
      if (trip.routeOptimization.trafficData) {
        totalDelay += trip.routeOptimization.trafficData.delayMinutes || 0;
      }
      
      totalDuration += trip.estimatedDuration || 0;
    });

    // Find most common traffic level
    const predictedLevel = Object.keys(trafficLevels).reduce((a, b) => 
      trafficLevels[a] > trafficLevels[b] ? a : b
    );

    const avgDelay = totalDelay / relevantTrips.length;
    const avgDuration = totalDuration / relevantTrips.length;
    const confidence = Math.min((relevantTrips.length / 20) * 100, 100);

    return {
      success: true,
      prediction: {
        trafficLevel: predictedLevel,
        estimatedDelay: parseFloat(avgDelay.toFixed(1)),
        estimatedDuration: parseFloat(avgDuration.toFixed(1)),
        confidence: parseFloat(confidence.toFixed(1)),
        sampleSize: relevantTrips.length,
        timeOfDay: `${hour}:00`,
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        distribution: trafficLevels
      }
    };
  } catch (error) {
    console.error('Predict traffic error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get area-based analytics
 */
export async function getAreaAnalytics(bounds, dateRange = {}) {
  try {
    const { north, south, east, west } = bounds;
    const { startDate, endDate } = dateRange;

    const filter = {
      $or: [
        {
          'pickupLocation.lat': { $gte: south, $lte: north },
          'pickupLocation.lng': { $gte: west, $lte: east }
        },
        {
          'dropoffLocation.lat': { $gte: south, $lte: north },
          'dropoffLocation.lng': { $gte: west, $lte: east }
        }
      ],
      status: 'completed'
    };

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const trips = await Trip.find(filter)
      .populate('assignedDriver', 'firstName lastName')
      .select('pickupLocation dropoffLocation scheduledDate scheduledTime estimatedDistance tripMetrics rating');

    // Calculate analytics
    const analytics = {
      totalTrips: trips.length,
      pickupCount: 0,
      dropoffCount: 0,
      averageDistance: 0,
      averageRating: 0,
      totalDistance: 0,
      peakHours: {},
      busyDays: {},
      popularLocations: [],
      drivers: new Set()
    };

    trips.forEach(trip => {
      // Count pickups and dropoffs in area
      if (isPointInBounds(trip.pickupLocation, bounds)) {
        analytics.pickupCount++;
      }
      if (isPointInBounds(trip.dropoffLocation, bounds)) {
        analytics.dropoffCount++;
      }

      // Distance
      analytics.totalDistance += trip.estimatedDistance || 0;

      // Rating
      if (trip.rating) {
        analytics.averageRating += trip.rating;
      }

      // Peak hours
      const hour = parseInt(trip.scheduledTime.split(':')[0]);
      analytics.peakHours[hour] = (analytics.peakHours[hour] || 0) + 1;

      // Busy days
      const day = new Date(trip.scheduledDate).getDay();
      analytics.busyDays[day] = (analytics.busyDays[day] || 0) + 1;

      // Drivers
      if (trip.assignedDriver) {
        analytics.drivers.add(trip.assignedDriver._id.toString());
      }
    });

    analytics.averageDistance = parseFloat((analytics.totalDistance / trips.length || 0).toFixed(2));
    analytics.averageRating = parseFloat((analytics.averageRating / trips.filter(t => t.rating).length || 0).toFixed(2));
    analytics.uniqueDrivers = analytics.drivers.size;
    delete analytics.drivers;

    // Find peak hour
    const peakHour = Object.keys(analytics.peakHours).reduce((a, b) => 
      analytics.peakHours[a] > analytics.peakHours[b] ? a : b, 0
    );

    analytics.peakHour = `${peakHour}:00`;
    analytics.peakHourTrips = analytics.peakHours[peakHour];

    // Find busiest day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDay = Object.keys(analytics.busyDays).reduce((a, b) => 
      analytics.busyDays[a] > analytics.busyDays[b] ? a : b, 0
    );

    analytics.busiestDay = dayNames[busiestDay];
    analytics.busiestDayTrips = analytics.busyDays[busiestDay];

    return {
      success: true,
      bounds,
      dateRange,
      analytics
    };
  } catch (error) {
    console.error('Get area analytics error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if point is within bounds
 */
function isPointInBounds(point, bounds) {
  return point.lat >= bounds.south && point.lat <= bounds.north &&
         point.lng >= bounds.west && point.lng <= bounds.east;
}

/**
 * Get route playback data
 */
export async function getRoutePlayback(tripId) {
  try {
    const trip = await Trip.findById(tripId)
      .populate('assignedDriver', 'firstName lastName')
      .populate('rider', 'firstName lastName');

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found'
      };
    }

    if (!trip.routeTracking || !trip.routeTracking.routePoints || trip.routeTracking.routePoints.length === 0) {
      return {
        success: false,
        error: 'No route tracking data available for this trip'
      };
    }

    const routePoints = trip.routeTracking.routePoints.map((point, index) => ({
      index,
      lat: point.latitude,
      lng: point.longitude,
      timestamp: point.timestamp,
      speed: point.speed || 0,
      heading: point.heading || 0,
      accuracy: point.accuracy || 0
    }));

    // Calculate playback statistics
    const stats = {
      totalPoints: routePoints.length,
      startTime: routePoints[0]?.timestamp,
      endTime: routePoints[routePoints.length - 1]?.timestamp,
      duration: routePoints.length > 0 
        ? (new Date(routePoints[routePoints.length - 1].timestamp) - new Date(routePoints[0].timestamp)) / 1000
        : 0,
      totalDistance: trip.routeTracking.routeSummary?.totalDistance || 0,
      averageSpeed: trip.routeTracking.routeSummary?.averageSpeed || 0,
      maxSpeed: trip.routeTracking.routeSummary?.maxSpeed || 0
    };

    return {
      success: true,
      trip: {
        id: trip._id,
        tripId: trip.tripId,
        driver: trip.assignedDriver,
        rider: trip.rider,
        pickup: trip.pickupLocation,
        dropoff: trip.dropoffLocation,
        status: trip.status
      },
      routePoints,
      stats,
      deviations: trip.routeTracking.deviations || [],
      geofenceEvents: trip.routeTracking.geofenceEvents || []
    };
  } catch (error) {
    console.error('Get route playback error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Improve ETA accuracy using ML-based corrections
 */
export async function improveETAAccuracy(route, estimatedETA) {
  try {
    const { origin, destination } = route;

    // Get historical trips for this route
    const historicalTrips = await Trip.find({
      'pickupLocation.lat': { $gte: origin.lat - 0.05, $lte: origin.lat + 0.05 },
      'pickupLocation.lng': { $gte: origin.lng - 0.05, $lte: origin.lng + 0.05 },
      'dropoffLocation.lat': { $gte: destination.lat - 0.05, $lte: destination.lat + 0.05 },
      'dropoffLocation.lng': { $gte: destination.lng - 0.05, $lte: destination.lng + 0.05 },
      status: 'completed',
      actualPickupTime: { $exists: true },
      actualDropoffTime: { $exists: true }
    }).limit(50);

    if (historicalTrips.length < 5) {
      return {
        success: true,
        adjustedETA: estimatedETA,
        confidence: 'low',
        adjustment: 0,
        message: 'Insufficient historical data for ETA adjustment'
      };
    }

    // Calculate actual vs estimated times
    let totalError = 0;
    let validTrips = 0;

    historicalTrips.forEach(trip => {
      if (trip.estimatedDuration && trip.actualPickupTime && trip.actualDropoffTime) {
        const actualDuration = (new Date(trip.actualDropoffTime) - new Date(trip.actualPickupTime)) / 60000; // minutes
        const error = actualDuration - trip.estimatedDuration;
        totalError += error;
        validTrips++;
      }
    });

    if (validTrips === 0) {
      return {
        success: true,
        adjustedETA: estimatedETA,
        confidence: 'low',
        adjustment: 0
      };
    }

    // Calculate average error (bias)
    const averageError = totalError / validTrips;
    
    // Apply correction
    const adjustedETA = estimatedETA + averageError;
    const confidence = Math.min((validTrips / 20) * 100, 100);

    return {
      success: true,
      originalETA: parseFloat(estimatedETA.toFixed(1)),
      adjustedETA: parseFloat(adjustedETA.toFixed(1)),
      adjustment: parseFloat(averageError.toFixed(1)),
      confidence: parseFloat(confidence.toFixed(1)),
      sampleSize: validTrips,
      recommendation: averageError > 5 
        ? 'Historical data shows trips take longer than estimated'
        : averageError < -5 
        ? 'Historical data shows trips complete faster than estimated'
        : 'ETA estimates are generally accurate'
    };
  } catch (error) {
    console.error('Improve ETA accuracy error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  generateDriverHeatmap,
  predictTraffic,
  getAreaAnalytics,
  getRoutePlayback,
  improveETAAccuracy
};
