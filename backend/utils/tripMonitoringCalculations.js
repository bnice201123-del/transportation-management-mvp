import { calculateTravelTime } from './departureCalculations.js';
import { GARAGE_LOCATION } from '../config/systemConfig.js';

/**
 * Calculate ETA from garage to pickup location
 * @param {Object} pickupLocation - Pickup coordinates {latitude, longitude}
 * @returns {Promise<Object>} Travel time and ETA information
 */
export const calculateGarageToPickupETA = async (pickupLocation) => {
  try {
    const travelData = await calculateTravelTime(
      GARAGE_LOCATION.coordinates,
      pickupLocation
    );

    const now = new Date();
    const etaTime = new Date(now.getTime() + (travelData.travelTimeMinutes * 60 * 1000));

    return {
      travelTimeMinutes: travelData.travelTimeMinutes,
      distanceMeters: travelData.distanceMeters,
      estimatedArrival: etaTime,
      garageLocation: GARAGE_LOCATION.address,
      estimationMethod: travelData.estimationMethod
    };
  } catch (error) {
    console.error('Error calculating garage to pickup ETA:', error);
    throw error;
  }
};

/**
 * Calculate threshold time for unassigned trip alerts
 * Formula: max(pickup_time - 1 hour, pickup_time - drive_time_from_garage)
 * @param {Date} pickupTime - Scheduled pickup time
 * @param {number} driveTimeMinutes - Drive time from garage in minutes
 * @returns {Date} Threshold time for alerts
 */
export const calculateUnassignedAlertThreshold = (pickupTime, driveTimeMinutes) => {
  const pickup = new Date(pickupTime);
  
  // Option 1: 1 hour before pickup
  const oneHourBefore = new Date(pickup.getTime() - (60 * 60 * 1000));
  
  // Option 2: Drive time before pickup
  const driveTimeBefore = new Date(pickup.getTime() - (driveTimeMinutes * 60 * 1000));
  
  // Return the earlier of the two (max time before pickup)
  return oneHourBefore > driveTimeBefore ? oneHourBefore : driveTimeBefore;
};

/**
 * Calculate if driver will be late based on current location and ETA
 * @param {Object} driverLocation - Current driver location {latitude, longitude}
 * @param {Object} pickupLocation - Pickup location {latitude, longitude}
 * @param {Date} scheduledPickupTime - Scheduled pickup time
 * @param {number} toleranceMinutes - Lateness tolerance in minutes (default: 0)
 * @returns {Promise<Object>} Lateness information
 */
export const calculateDriverLateness = async (
  driverLocation,
  pickupLocation,
  scheduledPickupTime,
  toleranceMinutes = 0
) => {
  try {
    const travelData = await calculateTravelTime(driverLocation, pickupLocation);
    
    const now = new Date();
    const eta = new Date(now.getTime() + (travelData.travelTimeMinutes * 60 * 1000));
    const scheduledTime = new Date(scheduledPickupTime);
    
    const minutesLate = Math.floor((eta - scheduledTime) / (60 * 1000));
    const isLate = minutesLate > toleranceMinutes;

    return {
      isLate,
      minutesLate: Math.max(0, minutesLate),
      estimatedArrival: eta,
      scheduledTime: scheduledTime,
      travelTimeMinutes: travelData.travelTimeMinutes,
      distanceMeters: travelData.distanceMeters,
      tolerance: toleranceMinutes
    };
  } catch (error) {
    console.error('Error calculating driver lateness:', error);
    throw error;
  }
};

/**
 * Check if driver has stopped moving
 * @param {Object} currentLocation - Current location with timestamp
 * @param {Object} previousLocation - Previous location with timestamp
 * @param {number} thresholdMinutes - Minutes without movement to consider "stopped"
 * @param {number} minimumMovementMeters - Minimum distance to consider movement
 * @returns {Object} Movement status
 */
export const detectDriverStopped = (
  currentLocation,
  previousLocation,
  thresholdMinutes = 5,
  minimumMovementMeters = 50
) => {
  if (!previousLocation || !currentLocation) {
    return {
      isStopped: false,
      reason: 'insufficient_data'
    };
  }

  // Calculate time difference
  const currentTime = new Date(currentLocation.timestamp);
  const previousTime = new Date(previousLocation.timestamp);
  const minutesDiff = (currentTime - previousTime) / (60 * 1000);

  // If not enough time has passed, can't determine if stopped
  if (minutesDiff < thresholdMinutes) {
    return {
      isStopped: false,
      reason: 'insufficient_time',
      minutesSinceLastUpdate: minutesDiff
    };
  }

  // Calculate distance moved
  const distance = calculateHaversineDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  const isStopped = distance < minimumMovementMeters;

  return {
    isStopped,
    distanceMovedMeters: Math.round(distance),
    minutesSinceLastUpdate: Math.round(minutesDiff),
    threshold: {
      minutes: thresholdMinutes,
      meters: minimumMovementMeters
    },
    reason: isStopped ? 'no_significant_movement' : 'moving'
  };
};

/**
 * Calculate Haversine distance between two points
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

  return R * c;
};

/**
 * Check if GPS location is stale
 * @param {Date} lastUpdateTime - Last GPS update timestamp
 * @param {number} staleThresholdMinutes - Minutes to consider stale
 * @returns {Object} Staleness information
 */
export const checkGPSStale = (lastUpdateTime, staleThresholdMinutes = 10) => {
  const now = new Date();
  const lastUpdate = new Date(lastUpdateTime);
  const minutesSinceUpdate = (now - lastUpdate) / (60 * 1000);

  return {
    isStale: minutesSinceUpdate > staleThresholdMinutes,
    minutesSinceUpdate: Math.round(minutesSinceUpdate),
    threshold: staleThresholdMinutes,
    lastUpdateTime: lastUpdate
  };
};

/**
 * Calculate time until pickup
 * @param {Date} pickupTime - Scheduled pickup time
 * @returns {Object} Time information
 */
export const getTimeUntilPickup = (pickupTime) => {
  const now = new Date();
  const pickup = new Date(pickupTime);
  const diffMs = pickup - now;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  return {
    minutes: Math.abs(diffMinutes),
    isPast: diffMinutes < 0,
    isImmediate: diffMinutes >= 0 && diffMinutes <= 15,
    isWithinHour: diffMinutes > 0 && diffMinutes <= 60,
    hours: Math.floor(Math.abs(diffMinutes) / 60),
    remainingMinutes: Math.abs(diffMinutes) % 60
  };
};

export default {
  calculateGarageToPickupETA,
  calculateUnassignedAlertThreshold,
  calculateDriverLateness,
  detectDriverStopped,
  checkGPSStale,
  getTimeUntilPickup
};
