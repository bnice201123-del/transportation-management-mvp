import axios from 'axios';

/**
 * Route Optimization Utilities
 * Provides algorithms for optimizing multi-stop trips
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Nearest Neighbor Algorithm - Simple greedy approach
 * Always go to the nearest unvisited waypoint
 */
export function optimizeNearestNeighbor(origin, destination, waypoints) {
  if (!waypoints || waypoints.length === 0) {
    return {
      optimizedSequence: [],
      totalDistance: calculateDistance(origin, destination),
      algorithm: 'nearest_neighbor'
    };
  }

  const unvisited = waypoints.map((wp, idx) => ({ ...wp, originalIndex: idx }));
  const route = [];
  let currentLocation = origin;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    // Find nearest unvisited waypoint
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(currentLocation, unvisited[0].location);

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(currentLocation, unvisited[i].location);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push(nearest.originalIndex);
    totalDistance += nearestDistance;
    currentLocation = nearest.location;
  }

  // Add final leg to destination
  totalDistance += calculateDistance(currentLocation, destination);

  return {
    optimizedSequence: route,
    totalDistance,
    algorithm: 'nearest_neighbor'
  };
}

/**
 * Optimize route using Google Maps Directions API with waypoint optimization
 */
export async function optimizeWithGoogleMaps(origin, destination, waypoints, googleMapsApiKey) {
  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key is required for route optimization');
  }

  if (!waypoints || waypoints.length === 0) {
    // No waypoints, just calculate direct route
    const directRoute = await getGoogleMapsRoute(origin, destination, [], googleMapsApiKey);
    return {
      optimizedSequence: [],
      totalDistance: directRoute.distance,
      totalDuration: directRoute.duration,
      algorithm: 'google_maps',
      routeDetails: directRoute
    };
  }

  // Google Maps can optimize up to 25 waypoints
  if (waypoints.length > 25) {
    console.warn('Google Maps supports max 25 waypoints. Using first 25.');
    waypoints = waypoints.slice(0, 25);
  }

  try {
    const waypointLocations = waypoints.map(wp => 
      `${wp.location.lat},${wp.location.lng}`
    );

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        waypoints: `optimize:true|${waypointLocations.join('|')}`,
        key: googleMapsApiKey,
        mode: 'driving',
        departure_time: 'now', // For traffic data
        traffic_model: 'best_guess'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const optimizedOrder = route.waypoint_order;
    
    let totalDistance = 0;
    let totalDuration = 0;

    route.legs.forEach(leg => {
      totalDistance += leg.distance.value / 1000; // Convert to km
      totalDuration += leg.duration.value / 60; // Convert to minutes
    });

    // Extract traffic info if available
    const trafficData = {
      fetchedAt: new Date(),
      conditions: totalDuration > (totalDistance / 50 * 60) ? 'heavy' : 
                  totalDuration > (totalDistance / 60 * 60) ? 'moderate' : 'light',
      incidents: []
    };

    return {
      optimizedSequence: optimizedOrder,
      totalDistance,
      totalDuration,
      algorithm: 'google_maps',
      trafficConsidered: true,
      trafficData,
      routeDetails: {
        polyline: route.overview_polyline.points,
        bounds: route.bounds,
        legs: route.legs.map(leg => ({
          distance: leg.distance.value / 1000,
          duration: leg.duration.value / 60,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          steps: leg.steps.length
        }))
      }
    };
  } catch (error) {
    console.error('Google Maps optimization error:', error);
    // Fallback to nearest neighbor
    console.log('Falling back to nearest neighbor algorithm');
    return optimizeNearestNeighbor(origin, destination, waypoints);
  }
}

/**
 * Get route details from Google Maps without optimization
 */
async function getGoogleMapsRoute(origin, destination, waypoints, apiKey) {
  const waypointStr = waypoints.length > 0 
    ? waypoints.map(wp => `${wp.location.lat},${wp.location.lng}`).join('|')
    : '';

  const params = {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    key: apiKey,
    mode: 'driving',
    departure_time: 'now'
  };

  if (waypointStr) {
    params.waypoints = waypointStr;
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    params
  });

  if (response.data.status !== 'OK') {
    throw new Error(`Google Maps API error: ${response.data.status}`);
  }

  const route = response.data.routes[0];
  let totalDistance = 0;
  let totalDuration = 0;

  route.legs.forEach(leg => {
    totalDistance += leg.distance.value / 1000;
    totalDuration += leg.duration.value / 60;
  });

  return {
    distance: totalDistance,
    duration: totalDuration,
    polyline: route.overview_polyline.points
  };
}

/**
 * Calculate time savings from optimization
 */
export function calculateOptimizationSavings(originalSequence, optimizedSequence, waypoints, origin, destination) {
  // Calculate original route distance
  let originalDistance = calculateDistance(origin, waypoints[originalSequence[0]].location);
  for (let i = 0; i < originalSequence.length - 1; i++) {
    originalDistance += calculateDistance(
      waypoints[originalSequence[i]].location,
      waypoints[originalSequence[i + 1]].location
    );
  }
  originalDistance += calculateDistance(
    waypoints[originalSequence[originalSequence.length - 1]].location,
    destination
  );

  // Calculate optimized route distance
  let optimizedDistance = calculateDistance(origin, waypoints[optimizedSequence[0]].location);
  for (let i = 0; i < optimizedSequence.length - 1; i++) {
    optimizedDistance += calculateDistance(
      waypoints[optimizedSequence[i]].location,
      waypoints[optimizedSequence[i + 1]].location
    );
  }
  optimizedDistance += calculateDistance(
    waypoints[optimizedSequence[optimizedSequence.length - 1]].location,
    destination
  );

  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = (distanceSaved / 50) * 60; // Assuming 50 km/h average speed
  const costSaved = distanceSaved * 0.5; // Assuming $0.50 per km

  return {
    distanceSaved,
    timeSaved,
    costSaved,
    improvementPercent: (distanceSaved / originalDistance) * 100
  };
}

/**
 * Main optimization function - tries Google Maps first, falls back to nearest neighbor
 */
export async function optimizeRoute(origin, destination, waypoints, options = {}) {
  const {
    algorithm = 'google_maps',
    googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
  } = options;

  const originalSequence = waypoints.map((_, idx) => idx);

  try {
    let result;

    if (algorithm === 'google_maps' && googleMapsApiKey) {
      result = await optimizeWithGoogleMaps(origin, destination, waypoints, googleMapsApiKey);
    } else if (algorithm === 'nearest_neighbor') {
      result = optimizeNearestNeighbor(origin, destination, waypoints);
    } else {
      // Default to nearest neighbor if no API key
      result = optimizeNearestNeighbor(origin, destination, waypoints);
    }

    // Calculate savings if sequence changed
    let savings = null;
    if (JSON.stringify(originalSequence) !== JSON.stringify(result.optimizedSequence)) {
      savings = calculateOptimizationSavings(
        originalSequence,
        result.optimizedSequence,
        waypoints,
        origin,
        destination
      );
    }

    return {
      ...result,
      originalSequence,
      savings,
      optimizedAt: new Date()
    };
  } catch (error) {
    console.error('Route optimization error:', error);
    throw error;
  }
}

/**
 * Estimate trip cost based on distance and time
 */
export function estimateTripCost(distance, duration, options = {}) {
  const {
    baseFare = 5.00,
    perKmRate = 1.50,
    perMinuteRate = 0.50,
    surgePricing = 1.0,
    minimumFare = 10.00
  } = options;

  const distanceCost = distance * perKmRate;
  const timeCost = duration * perMinuteRate;
  const subtotal = baseFare + distanceCost + timeCost;
  const total = Math.max(subtotal * surgePricing, minimumFare);

  return {
    baseFare,
    distanceCost,
    timeCost,
    surgePricing,
    subtotal,
    total: parseFloat(total.toFixed(2)),
    breakdown: {
      baseRate: baseFare,
      distance: `${distance.toFixed(2)} km × $${perKmRate}/km = $${distanceCost.toFixed(2)}`,
      time: `${duration.toFixed(0)} min × $${perMinuteRate}/min = $${timeCost.toFixed(2)}`,
      surge: surgePricing > 1 ? `${surgePricing}x surge pricing applied` : 'No surge pricing'
    }
  };
}

export default {
  optimizeRoute,
  optimizeNearestNeighbor,
  optimizeWithGoogleMaps,
  calculateDistance,
  calculateOptimizationSavings,
  estimateTripCost
};
