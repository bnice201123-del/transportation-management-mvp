import axios from 'axios';

/**
 * Calculate estimated travel time between two points using Google Maps Distance Matrix API
 * @param {Object} origin - Origin coordinates {latitude, longitude}
 * @param {Object} destination - Destination coordinates {latitude, longitude}
 * @returns {Promise<Object>} Travel time in minutes and distance in meters
 */
export const calculateTravelTime = async (origin, destination) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using default travel time');
      return {
        travelTimeMinutes: 15,
        distanceMeters: 5000,
        estimationMethod: 'default'
      };
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: originStr,
        destinations: destStr,
        mode: 'driving',
        departure_time: 'now', // Use current traffic conditions
        key: apiKey
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${response.data.status}`);
    }

    const element = response.data.rows[0]?.elements[0];
    
    if (element?.status !== 'OK') {
      throw new Error(`Route not found: ${element?.status}`);
    }

    const durationSeconds = element.duration_in_traffic?.value || element.duration?.value;
    const distanceMeters = element.distance?.value;

    return {
      travelTimeMinutes: Math.ceil(durationSeconds / 60), // Round up to be safe
      distanceMeters: distanceMeters,
      estimationMethod: 'google_maps',
      rawDuration: durationSeconds,
      usedTraffic: !!element.duration_in_traffic
    };
  } catch (error) {
    console.error('Error calculating travel time:', error.message);
    
    // Fallback: estimate based on straight-line distance
    return estimateTravelTimeByDistance(origin, destination);
  }
};

/**
 * Fallback method: Estimate travel time based on straight-line distance
 * Assumes average speed of 30 mph (48 km/h) in urban areas
 */
const estimateTravelTimeByDistance = (origin, destination) => {
  try {
    const distance = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    // Assume 30 mph average speed, add 20% for city driving
    const speedMph = 30;
    const distanceMiles = distance / 1609.34; // meters to miles
    const straightLineTime = (distanceMiles / speedMph) * 60; // minutes
    const estimatedTime = Math.ceil(straightLineTime * 1.3); // Add 30% for turns, stops, etc.

    return {
      travelTimeMinutes: Math.max(estimatedTime, 5), // Minimum 5 minutes
      distanceMeters: Math.round(distance),
      estimationMethod: 'haversine'
    };
  } catch (error) {
    console.error('Error in fallback estimation:', error);
    return {
      travelTimeMinutes: 15,
      distanceMeters: 5000,
      estimationMethod: 'default'
    };
  }
};

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * @returns {number} Distance in meters
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Calculate recommended departure time
 * @param {Date} pickupTime - Scheduled pickup time
 * @param {number} travelTimeMinutes - Estimated travel time
 * @param {number} bufferMinutes - Driver buffer time (default: 5)
 * @returns {Date} Recommended departure time
 */
export const calculateDepartureTime = (pickupTime, travelTimeMinutes, bufferMinutes = 5) => {
  const totalMinutes = travelTimeMinutes + bufferMinutes;
  const departureTime = new Date(pickupTime.getTime() - (totalMinutes * 60 * 1000));
  return departureTime;
};

/**
 * Calculate time until departure
 * @param {Date} departureTime - Recommended departure time
 * @returns {Object} Time remaining in minutes and status
 */
export const getTimeUntilDeparture = (departureTime) => {
  const now = new Date();
  const diffMs = departureTime - now;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  return {
    minutes: diffMinutes,
    isPast: diffMinutes < 0,
    isImmediate: diffMinutes <= 0 && diffMinutes > -5,
    isLate: diffMinutes < -5,
    isSoon: diffMinutes > 0 && diffMinutes <= 10
  };
};

/**
 * Check if driver is moving toward pickup location
 * @param {Object} currentLocation - Current driver location
 * @param {Object} previousLocation - Previous driver location
 * @param {Object} pickupLocation - Pickup location
 * @returns {boolean} True if moving toward pickup
 */
export const isMovingTowardPickup = (currentLocation, previousLocation, pickupLocation) => {
  if (!previousLocation || !previousLocation.latitude || !previousLocation.longitude) {
    return false;
  }

  const previousDistance = calculateHaversineDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );

  const currentDistance = calculateHaversineDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude
  );

  // Driver is moving toward pickup if distance decreased by at least 50 meters
  return (previousDistance - currentDistance) > 50;
};

/**
 * Format time remaining for notifications
 * @param {number} minutes - Minutes remaining
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (minutes) => {
  if (minutes < 0) {
    return `${Math.abs(minutes)} minutes ago`;
  }
  if (minutes === 0) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
};

/**
 * Check if trip pickup is too soon (within threshold)
 * @param {Date} pickupTime - Scheduled pickup time
 * @param {number} thresholdMinutes - Threshold in minutes (default: 10)
 * @returns {boolean} True if pickup is too soon
 */
export const isTripTooSoon = (pickupTime, thresholdMinutes = 10) => {
  const now = new Date();
  const diffMs = pickupTime - now;
  const diffMinutes = diffMs / (60 * 1000);
  return diffMinutes <= thresholdMinutes;
};

export default {
  calculateTravelTime,
  calculateDepartureTime,
  getTimeUntilDeparture,
  isMovingTowardPickup,
  formatTimeRemaining,
  isTripTooSoon,
  calculateHaversineDistance
};
