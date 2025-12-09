import axios from 'axios';

/**
 * Google Maps Traffic Integration Service
 * Provides real-time traffic data, ETA calculations, and route alternatives
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get real-time traffic information for a route
 */
export async function getTrafficInfo(origin, destination, waypoints = [], departureTime = 'now') {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const waypointStr = waypoints.length > 0 
      ? waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')
      : '';

    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      departure_time: departureTime === 'now' ? 'now' : Math.floor(new Date(departureTime).getTime() / 1000),
      traffic_model: 'best_guess',
      alternatives: true // Get alternative routes
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

    const routes = response.data.routes;
    const primaryRoute = routes[0];
    
    // Calculate traffic conditions
    let totalDistance = 0;
    let totalDuration = 0;
    let totalDurationInTraffic = 0;

    primaryRoute.legs.forEach(leg => {
      totalDistance += leg.distance.value / 1000; // km
      totalDuration += leg.duration.value / 60; // minutes
      totalDurationInTraffic += (leg.duration_in_traffic?.value || leg.duration.value) / 60;
    });

    const trafficDelay = totalDurationInTraffic - totalDuration;
    const trafficLevel = calculateTrafficLevel(trafficDelay, totalDuration);

    // Process alternative routes
    const alternatives = routes.slice(1).map(route => ({
      distance: route.legs.reduce((sum, leg) => sum + leg.distance.value / 1000, 0),
      duration: route.legs.reduce((sum, leg) => sum + leg.duration.value / 60, 0),
      durationInTraffic: route.legs.reduce((sum, leg) => 
        sum + (leg.duration_in_traffic?.value || leg.duration.value) / 60, 0),
      summary: route.summary,
      polyline: route.overview_polyline.points
    }));

    return {
      success: true,
      trafficData: {
        fetchedAt: new Date(),
        trafficLevel,
        trafficDelay: Math.round(trafficDelay),
        estimatedDuration: Math.round(totalDuration),
        estimatedDurationInTraffic: Math.round(totalDurationInTraffic),
        distance: Math.round(totalDistance * 100) / 100,
        primaryRoute: {
          summary: primaryRoute.summary,
          polyline: primaryRoute.overview_polyline.points,
          bounds: primaryRoute.bounds,
          legs: primaryRoute.legs.map(leg => ({
            distance: leg.distance.value / 1000,
            duration: leg.duration.value / 60,
            durationInTraffic: (leg.duration_in_traffic?.value || leg.duration.value) / 60,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            trafficSpeedEntry: leg.traffic_speed_entry || [],
            viaWaypoint: leg.via_waypoint || []
          }))
        },
        alternatives: alternatives.length > 0 ? alternatives : null,
        warnings: primaryRoute.warnings || [],
        copyrights: response.data.routes[0].copyrights
      }
    };
  } catch (error) {
    console.error('Traffic info error:', error);
    return {
      success: false,
      error: error.message,
      trafficData: null
    };
  }
}

/**
 * Calculate traffic level based on delay
 */
function calculateTrafficLevel(delayMinutes, normalDuration) {
  const delayPercent = (delayMinutes / normalDuration) * 100;
  
  if (delayPercent < 10) return 'light';
  if (delayPercent < 30) return 'moderate';
  if (delayPercent < 50) return 'heavy';
  return 'severe';
}

/**
 * Get traffic incidents along a route
 */
export async function getTrafficIncidents(origin, destination, radius = 5000) {
  // Note: Google Maps doesn't have a direct incidents API
  // This would require integration with Waze API or traffic.com
  // For now, we'll extract warnings from directions API
  
  try {
    const trafficInfo = await getTrafficInfo(origin, destination);
    
    if (!trafficInfo.success) {
      return {
        success: false,
        incidents: []
      };
    }

    const incidents = trafficInfo.trafficData.warnings.map((warning, idx) => ({
      id: `warning_${idx}`,
      type: 'warning',
      description: warning,
      severity: 'medium'
    }));

    return {
      success: true,
      incidents
    };
  } catch (error) {
    console.error('Traffic incidents error:', error);
    return {
      success: false,
      incidents: [],
      error: error.message
    };
  }
}

/**
 * Get ETA with traffic for multiple destinations
 */
export async function getBatchETAs(origins, destinations, departureTime = 'now') {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

    const params = {
      origins: originsStr,
      destinations: destinationsStr,
      key: GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      departure_time: departureTime === 'now' ? 'now' : Math.floor(new Date(departureTime).getTime() / 1000),
      traffic_model: 'best_guess'
    };

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${response.data.status}`);
    }

    const results = [];
    
    response.data.rows.forEach((row, originIdx) => {
      row.elements.forEach((element, destIdx) => {
        if (element.status === 'OK') {
          results.push({
            originIndex: originIdx,
            destinationIndex: destIdx,
            origin: origins[originIdx],
            destination: destinations[destIdx],
            distance: element.distance.value / 1000, // km
            duration: element.duration.value / 60, // minutes
            durationInTraffic: element.duration_in_traffic 
              ? element.duration_in_traffic.value / 60 
              : element.duration.value / 60,
            trafficDelay: element.duration_in_traffic 
              ? (element.duration_in_traffic.value - element.duration.value) / 60
              : 0
          });
        }
      });
    });

    return {
      success: true,
      results,
      fetchedAt: new Date()
    };
  } catch (error) {
    console.error('Batch ETAs error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Monitor traffic conditions and alert on changes
 */
export async function monitorTrafficConditions(tripId, origin, destination, waypoints = [], alertThreshold = 15) {
  try {
    const trafficInfo = await getTrafficInfo(origin, destination, waypoints);
    
    if (!trafficInfo.success) {
      return {
        shouldAlert: false,
        reason: 'Failed to fetch traffic data'
      };
    }

    const { trafficLevel, trafficDelay } = trafficInfo.trafficData;

    // Alert if traffic delay exceeds threshold
    if (trafficDelay > alertThreshold) {
      return {
        shouldAlert: true,
        reason: 'significant_delay',
        trafficLevel,
        delayMinutes: trafficDelay,
        message: `Traffic delay of ${trafficDelay} minutes detected on route`,
        recommendation: trafficInfo.trafficData.alternatives && trafficInfo.trafficData.alternatives.length > 0
          ? 'Consider alternative route'
          : 'Allow extra time for this trip'
      };
    }

    // Alert if traffic is severe
    if (trafficLevel === 'severe' || trafficLevel === 'heavy') {
      return {
        shouldAlert: true,
        reason: 'heavy_traffic',
        trafficLevel,
        delayMinutes: trafficDelay,
        message: `${trafficLevel} traffic detected on route`,
        recommendation: 'Consider rescheduling or using alternative route'
      };
    }

    return {
      shouldAlert: false,
      trafficLevel,
      delayMinutes: trafficDelay,
      message: 'Traffic conditions are acceptable'
    };
  } catch (error) {
    console.error('Traffic monitoring error:', error);
    return {
      shouldAlert: false,
      reason: 'monitoring_error',
      error: error.message
    };
  }
}

/**
 * Get optimal departure time based on traffic patterns
 */
export async function getOptimalDepartureTime(origin, destination, waypoints = [], targetArrivalTime) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  const targetTime = new Date(targetArrivalTime);
  const options = [];

  // Check traffic at different departure times (30 min intervals for 2 hours before target)
  for (let i = 120; i >= 0; i -= 30) {
    const departureTime = new Date(targetTime.getTime() - i * 60000);
    
    try {
      const trafficInfo = await getTrafficInfo(origin, destination, waypoints, departureTime.toISOString());
      
      if (trafficInfo.success) {
        const arrivalTime = new Date(departureTime.getTime() + trafficInfo.trafficData.estimatedDurationInTraffic * 60000);
        
        options.push({
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          duration: trafficInfo.trafficData.estimatedDurationInTraffic,
          trafficLevel: trafficInfo.trafficData.trafficLevel,
          trafficDelay: trafficInfo.trafficData.trafficDelay,
          onTime: Math.abs(arrivalTime - targetTime) < 5 * 60000 // Within 5 minutes
        });
      }
    } catch (error) {
      console.error(`Error checking departure time ${i} minutes before:`, error);
    }
  }

  // Find best option (earliest with acceptable traffic that arrives on time)
  const bestOption = options
    .filter(opt => opt.onTime)
    .sort((a, b) => {
      // Prioritize light traffic, then earliest departure
      if (a.trafficLevel !== b.trafficLevel) {
        const levels = { light: 0, moderate: 1, heavy: 2, severe: 3 };
        return levels[a.trafficLevel] - levels[b.trafficLevel];
      }
      return new Date(a.departureTime) - new Date(b.departureTime);
    })[0];

  return {
    success: true,
    recommendedDeparture: bestOption || options[options.length - 1],
    allOptions: options,
    targetArrival: targetArrivalTime
  };
}

/**
 * Calculate dynamic pricing based on traffic
 */
export function calculateTrafficSurge(trafficLevel, trafficDelay, baseMultiplier = 1.0) {
  let surgeMultiplier = baseMultiplier;

  // Increase price based on traffic level
  switch (trafficLevel) {
    case 'moderate':
      surgeMultiplier += 0.15;
      break;
    case 'heavy':
      surgeMultiplier += 0.30;
      break;
    case 'severe':
      surgeMultiplier += 0.50;
      break;
  }

  // Additional surge for extreme delays
  if (trafficDelay > 30) {
    surgeMultiplier += 0.20;
  } else if (trafficDelay > 45) {
    surgeMultiplier += 0.35;
  }

  return {
    surgeMultiplier: Math.round(surgeMultiplier * 100) / 100,
    reason: trafficLevel !== 'light' 
      ? `${trafficLevel} traffic with ${trafficDelay} min delay`
      : 'normal traffic conditions'
  };
}

export default {
  getTrafficInfo,
  getTrafficIncidents,
  getBatchETAs,
  monitorTrafficConditions,
  getOptimalDepartureTime,
  calculateTrafficSurge
};
