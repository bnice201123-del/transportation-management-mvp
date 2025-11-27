import cron from 'node-cron';
import Trip from '../models/Trip.js';
import DriverProgressTracking from '../models/DriverProgressTracking.js';
import { createNotification } from '../utils/notificationHelper.js';
import {
  calculateDriverLateness,
  detectDriverStopped,
  checkGPSStale
} from '../utils/tripMonitoringCalculations.js';
import { TRIP_MONITORING, CRON_SCHEDULES } from '../config/systemConfig.js';

let isRunning = false;
let cronJobs = [];

/**
 * Check for driver lateness
 */
const checkDriverLateness = async () => {
  try {
    console.log('[Driver Progress Monitor] Checking for driver lateness...');
    
    const trackingRecords = await DriverProgressTracking.getNeedingLatenessCheck();
    
    console.log(`[Driver Progress Monitor] Checking ${trackingRecords.length} drivers for lateness`);
    
    for (const tracking of trackingRecords) {
      try {
        if (!tracking.shouldSendLatenessAlert()) {
          continue;
        }
        
        const trip = tracking.trip;
        
        if (!trip || !tracking.currentLocation) {
          continue;
        }
        
        // Calculate if driver will be late
        const latenessData = await calculateDriverLateness(
          {
            latitude: tracking.currentLocation.latitude,
            longitude: tracking.currentLocation.longitude
          },
          {
            latitude: trip.pickup_location.coordinates[1],
            longitude: trip.pickup_location.coordinates[0]
          },
          trip.pickup_time,
          TRIP_MONITORING.latenessTolerance || 0
        );
        
        if (latenessData.isLate) {
          // Format times
          const etaString = latenessData.estimatedArrival.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          const scheduledString = latenessData.scheduledTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          // Determine priority based on how late
          let priority = 'medium';
          if (latenessData.minutesLate > 15) {
            priority = 'urgent';
          } else if (latenessData.minutesLate > 5) {
            priority = 'high';
          }
          
          // Send notification to dispatch
          const notification = await createNotification({
            recipientRole: 'dispatcher',
            type: 'driver_late',
            title: 'Driver Running Late',
            message: `${tracking.driver.name} is ${latenessData.minutesLate} min late for Trip #${trip.trip_number}`,
            priority,
            relatedData: {
              tripId: trip._id,
              driverId: tracking.driver._id,
              driverName: tracking.driver.name,
              minutesLate: latenessData.minutesLate,
              estimatedArrival: latenessData.estimatedArrival,
              scheduledTime: latenessData.scheduledTime,
              distanceToPickup: Math.round(latenessData.distanceMeters),
              pickupLocation: trip.pickup_location.address
            }
          });
          
          // Also notify driver
          await createNotification({
            recipientId: tracking.driver._id,
            type: 'trip_update',
            title: 'Running Behind Schedule',
            message: `You're projected to be ${latenessData.minutesLate} min late for your pickup. ETA: ${etaString}`,
            priority: priority === 'urgent' ? 'high' : 'medium',
            relatedData: {
              tripId: trip._id,
              minutesLate: latenessData.minutesLate,
              estimatedArrival: latenessData.estimatedArrival,
              scheduledTime: latenessData.scheduledTime
            }
          });
          
          // Record lateness alert
          await tracking.recordLatenessAlert(
            latenessData.estimatedArrival,
            latenessData.minutesLate,
            latenessData.distanceMeters,
            notification._id
          );
          
          console.log(`[Driver Progress Monitor] Sent lateness alert for driver ${tracking.driver._id} on trip ${trip._id}`);
        }
      } catch (error) {
        console.error(`[Driver Progress Monitor] Error checking lateness for tracking ${tracking._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error checking driver lateness:', error);
  }
};

/**
 * Check for stopped drivers
 */
const checkStoppedDrivers = async () => {
  try {
    console.log('[Driver Progress Monitor] Checking for stopped drivers...');
    
    const trackingRecords = await DriverProgressTracking.getNeedingStoppedCheck();
    
    console.log(`[Driver Progress Monitor] Checking ${trackingRecords.length} drivers for stopped movement`);
    
    for (const tracking of trackingRecords) {
      try {
        if (!tracking.shouldSendStoppedAlert()) {
          continue;
        }
        
        const trip = tracking.trip;
        
        if (!trip || !tracking.currentLocation || tracking.locationHistory.length < 2) {
          continue;
        }
        
        // Get previous location (at least 5 minutes ago)
        const fiveMinutesAgo = new Date(Date.now() - (TRIP_MONITORING.driverStoppedThresholdMinutes * 60 * 1000));
        const previousLocations = tracking.locationHistory.filter(loc => 
          new Date(loc.timestamp) <= fiveMinutesAgo
        );
        
        if (previousLocations.length === 0) {
          continue;
        }
        
        const previousLocation = previousLocations[previousLocations.length - 1];
        
        // Check if driver has stopped
        const stoppedData = detectDriverStopped(
          tracking.currentLocation,
          previousLocation,
          TRIP_MONITORING.driverStoppedThresholdMinutes,
          50 // 50 meters minimum movement
        );
        
        if (stoppedData.isStopped) {
          // Format location
          const locationString = `${tracking.currentLocation.latitude.toFixed(6)}, ${tracking.currentLocation.longitude.toFixed(6)}`;
          
          // Send notification to dispatch
          const notification = await createNotification({
            recipientRole: 'dispatcher',
            type: 'driver_issue',
            title: 'Driver Stopped Moving',
            message: `${tracking.driver.name} hasn't moved in ${stoppedData.minutesSinceLastUpdate} min on Trip #${trip.trip_number}`,
            priority: 'high',
            relatedData: {
              tripId: trip._id,
              driverId: tracking.driver._id,
              driverName: tracking.driver.name,
              minutesStopped: stoppedData.minutesSinceLastUpdate,
              location: locationString,
              distanceMovedMeters: stoppedData.distanceMovedMeters,
              pickupLocation: trip.pickup_location.address
            }
          });
          
          // Also notify driver
          await createNotification({
            recipientId: tracking.driver._id,
            type: 'trip_update',
            title: 'Status Check',
            message: `We noticed you haven't moved in ${stoppedData.minutesSinceLastUpdate} minutes. Is everything okay?`,
            priority: 'medium',
            relatedData: {
              tripId: trip._id,
              minutesStopped: stoppedData.minutesSinceLastUpdate
            }
          });
          
          // Record stopped alert
          await tracking.recordStoppedAlert(
            stoppedData.minutesSinceLastUpdate,
            notification._id
          );
          
          console.log(`[Driver Progress Monitor] Sent stopped alert for driver ${tracking.driver._id} on trip ${trip._id}`);
        }
      } catch (error) {
        console.error(`[Driver Progress Monitor] Error checking stopped for tracking ${tracking._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error checking stopped drivers:', error);
  }
};

/**
 * Check for stale GPS data
 */
const checkStaleGPS = async () => {
  try {
    console.log('[Driver Progress Monitor] Checking for stale GPS...');
    
    const trackingRecords = await DriverProgressTracking.getWithStaleGPS();
    
    console.log(`[Driver Progress Monitor] Found ${trackingRecords.length} drivers with stale GPS`);
    
    for (const tracking of trackingRecords) {
      try {
        const trip = tracking.trip;
        
        if (!trip) {
          continue;
        }
        
        const gpsStatus = checkGPSStale(
          tracking.currentLocation?.timestamp || new Date(0),
          10 // 10 minutes threshold
        );
        
        if (gpsStatus.isStale) {
          // Send notification to dispatch
          await createNotification({
            recipientRole: 'dispatcher',
            type: 'driver_issue',
            title: 'GPS Signal Lost',
            message: `Lost GPS for ${tracking.driver.name} on Trip #${trip.trip_number} (${gpsStatus.minutesSinceUpdate} min ago)`,
            priority: 'high',
            relatedData: {
              tripId: trip._id,
              driverId: tracking.driver._id,
              driverName: tracking.driver.name,
              minutesSinceUpdate: gpsStatus.minutesSinceUpdate,
              lastUpdate: gpsStatus.lastUpdateTime
            }
          });
          
          // Notify driver
          await createNotification({
            recipientId: tracking.driver._id,
            type: 'system_alert',
            title: 'GPS Issue Detected',
            message: 'We\'re having trouble getting your location. Please check your GPS settings.',
            priority: 'medium',
            relatedData: {
              tripId: trip._id
            }
          });
          
          // Mark alert sent
          await tracking.markGPSStaleAlertSent();
          
          console.log(`[Driver Progress Monitor] Sent GPS stale alert for driver ${tracking.driver._id}`);
        }
      } catch (error) {
        console.error(`[Driver Progress Monitor] Error checking GPS for tracking ${tracking._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error checking stale GPS:', error);
  }
};

/**
 * Create tracking for in-progress trips
 */
const initializeActiveTrips = async () => {
  try {
    // Find trips that are in progress but don't have tracking
    const activeTrips = await Trip.find({
      status: 'in_progress',
      driver: { $ne: null }
    }).populate('driver', 'name phone email');
    
    for (const trip of activeTrips) {
      const existing = await DriverProgressTracking.getActiveByTrip(trip._id);
      
      if (!existing) {
        const tracking = await DriverProgressTracking.createForTrip(trip._id, trip.driver._id);
        console.log(`[Driver Progress Monitor] Created tracking for trip ${trip._id}`);
      }
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error initializing active trips:', error);
  }
};

/**
 * Complete tracking for completed trips
 */
const completeFinishedTrips = async () => {
  try {
    const activeTracking = await DriverProgressTracking.find({
      status: 'active'
    }).populate('trip');
    
    for (const tracking of activeTracking) {
      if (tracking.trip && ['completed', 'cancelled'].includes(tracking.trip.status)) {
        if (tracking.trip.status === 'completed') {
          await tracking.complete();
        } else {
          await tracking.cancel();
        }
        console.log(`[Driver Progress Monitor] Completed tracking for trip ${tracking.trip._id}`);
      }
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error completing finished trips:', error);
  }
};

/**
 * Cleanup old tracking records
 */
const cleanupOldTracking = async () => {
  try {
    const deletedCount = await DriverProgressTracking.cleanupOldTracking();
    if (deletedCount > 0) {
      console.log(`[Driver Progress Monitor] Cleaned up ${deletedCount} old tracking records`);
    }
  } catch (error) {
    console.error('[Driver Progress Monitor] Error cleaning up old tracking:', error);
  }
};

/**
 * Start the driver progress monitoring service
 */
export const start = () => {
  if (isRunning) {
    console.log('[Driver Progress Monitor] Service already running');
    return;
  }
  
  console.log('[Driver Progress Monitor] Starting service...');
  
  // Schedule job to check lateness (every minute)
  const latenessJob = cron.schedule(CRON_SCHEDULES.driverProgressCheck, async () => {
    await checkDriverLateness();
  });
  cronJobs.push(latenessJob);
  
  // Schedule job to check stopped drivers (every minute)
  const stoppedJob = cron.schedule(CRON_SCHEDULES.driverProgressCheck, async () => {
    await checkStoppedDrivers();
  });
  cronJobs.push(stoppedJob);
  
  // Schedule job to check stale GPS (every minute)
  const gpsJob = cron.schedule(CRON_SCHEDULES.driverProgressCheck, async () => {
    await checkStaleGPS();
  });
  cronJobs.push(gpsJob);
  
  // Schedule job to initialize active trips (every 5 minutes)
  const initJob = cron.schedule('*/5 * * * *', async () => {
    await initializeActiveTrips();
  });
  cronJobs.push(initJob);
  
  // Schedule job to complete finished trips (every minute)
  const completeJob = cron.schedule(CRON_SCHEDULES.driverProgressCheck, async () => {
    await completeFinishedTrips();
  });
  cronJobs.push(completeJob);
  
  // Schedule cleanup job (once per day at 3 AM)
  const cleanupJob = cron.schedule(CRON_SCHEDULES.cleanup, async () => {
    await cleanupOldTracking();
  });
  cronJobs.push(cleanupJob);
  
  isRunning = true;
  console.log('[Driver Progress Monitor] Service started successfully');
  
  // Run initial setup
  initializeActiveTrips();
};

/**
 * Stop the driver progress monitoring service
 */
export const stop = () => {
  if (!isRunning) {
    console.log('[Driver Progress Monitor] Service not running');
    return;
  }
  
  console.log('[Driver Progress Monitor] Stopping service...');
  
  // Stop all cron jobs
  cronJobs.forEach(job => job.stop());
  cronJobs = [];
  
  isRunning = false;
  console.log('[Driver Progress Monitor] Service stopped');
};

/**
 * Get service status
 */
export const getStatus = () => {
  return {
    isRunning,
    activeJobs: cronJobs.length
  };
};

export default {
  start,
  stop,
  getStatus
};
