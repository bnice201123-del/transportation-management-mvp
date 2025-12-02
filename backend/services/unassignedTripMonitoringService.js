import cron from 'node-cron';
import Trip from '../models/Trip.js';
import UnassignedTripAlert from '../models/UnassignedTripAlert.js';
import { createNotification } from '../utils/notificationHelper.js';
import { calculateGarageToPickupETA } from '../utils/tripMonitoringCalculations.js';
import { GARAGE_LOCATION, TRIP_MONITORING, CRON_SCHEDULES } from '../config/systemConfig.js';

let isRunning = false;
let cronJobs = [];

/**
 * Check for trips that need unassigned alerts
 */
const checkUnassignedTrips = async () => {
  try {
    console.log('[Unassigned Trip Monitor] Checking for unassigned trips...');
    
    // Find unassigned trips scheduled for today or future
    const now = new Date();
    const unassignedTrips = await Trip.find({
      driver: null,
      pickup_time: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('rider', 'name phone email');
    
    console.log(`[Unassigned Trip Monitor] Found ${unassignedTrips.length} unassigned trips`);
    
    for (const trip of unassignedTrips) {
      try {
        // Check if alert already exists
        const existingAlert = await UnassignedTripAlert.getActiveForTrip(trip._id);
        
        if (!existingAlert) {
          // Calculate drive time from garage to pickup
          const etaData = await calculateGarageToPickupETA({
            latitude: trip.pickup_location.coordinates[1],
            longitude: trip.pickup_location.coordinates[0]
          });
          
          // Create new alert
          await UnassignedTripAlert.createForTrip(
            trip._id,
            trip.pickup_time,
            etaData.travelTimeMinutes,
            {
              address: GARAGE_LOCATION.address,
              coordinates: GARAGE_LOCATION.coordinates
            }
          );
          
          console.log(`[Unassigned Trip Monitor] Created alert for trip ${trip._id}`);
        }
      } catch (error) {
        console.error(`[Unassigned Trip Monitor] Error processing trip ${trip._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Unassigned Trip Monitor] Error checking unassigned trips:', error);
  }
};

/**
 * Send initial alerts for trips that reached threshold time
 */
const sendInitialAlerts = async () => {
  try {
    console.log('[Unassigned Trip Monitor] Checking for initial alerts...');
    
    const alertsNeedingNotification = await UnassignedTripAlert.getNeedingInitialAlert();
    
    console.log(`[Unassigned Trip Monitor] Found ${alertsNeedingNotification.length} alerts needing initial notification`);
    
    for (const alert of alertsNeedingNotification) {
      try {
        const trip = alert.trip;
        
        if (!trip) {
          console.error(`[Unassigned Trip Monitor] Trip not found for alert ${alert._id}`);
          continue;
        }
        
        // Format pickup time
        const pickupTime = new Date(trip.pickup_time);
        const timeString = pickupTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        const dateString = pickupTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        
        // Calculate minutes until pickup
        const minutesUntilPickup = Math.floor((pickupTime - new Date()) / (60 * 1000));
        const hoursUntilPickup = Math.floor(minutesUntilPickup / 60);
        const remainingMinutes = minutesUntilPickup % 60;
        
        let timeUntilText = '';
        if (hoursUntilPickup > 0) {
          timeUntilText = `${hoursUntilPickup}h ${remainingMinutes}m`;
        } else {
          timeUntilText = `${minutesUntilPickup}m`;
        }
        
        // Create notification for dispatch
        const notification = await createNotification({
          recipientRole: 'dispatcher',
          type: 'trip_unassigned',
          title: 'Unassigned Trip Alert',
          message: `Trip #${trip.trip_number} needs a driver (Pickup in ${timeUntilText})`,
          priority: minutesUntilPickup < 60 ? 'high' : 'medium',
          relatedData: {
            tripId: trip._id,
            pickupTime: trip.pickup_time,
            pickupLocation: trip.pickup_location.address,
            dropoffLocation: trip.dropoff_location.address,
            riderName: trip.rider?.name || 'Unknown',
            driveTimeFromGarage: alert.driveTimeFromGarage,
            minutesUntilPickup,
            alertType: 'initial'
          }
        });
        
        // Mark alert as sent
        await alert.markFirstAlertSent(notification._id);
        
        console.log(`[Unassigned Trip Monitor] Sent initial alert for trip ${trip._id}`);
      } catch (error) {
        console.error(`[Unassigned Trip Monitor] Error sending initial alert for ${alert._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Unassigned Trip Monitor] Error sending initial alerts:', error);
  }
};

/**
 * Send follow-up alerts for trips still unassigned
 */
const sendFollowUpAlerts = async () => {
  try {
    console.log('[Unassigned Trip Monitor] Checking for follow-up alerts...');
    
    const alertsNeedingFollowUp = await UnassignedTripAlert.getNeedingFollowUp();
    
    console.log(`[Unassigned Trip Monitor] Found ${alertsNeedingFollowUp.length} alerts needing follow-up`);
    
    for (const alert of alertsNeedingFollowUp) {
      try {
        const trip = alert.trip;
        
        if (!trip) {
          console.error(`[Unassigned Trip Monitor] Trip not found for alert ${alert._id}`);
          continue;
        }
        
        // Check if trip is still unassigned
        if (trip.driver) {
          // Trip was assigned, resolve alert
          await alert.resolve('assigned');
          console.log(`[Unassigned Trip Monitor] Trip ${trip._id} was assigned, resolving alert`);
          continue;
        }
        
        // Format pickup time
        const pickupTime = new Date(trip.pickup_time);
        const timeString = pickupTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Calculate minutes until pickup
        const minutesUntilPickup = Math.floor((pickupTime - new Date()) / (60 * 1000));
        
        // Determine priority based on urgency
        let priority = 'medium';
        if (minutesUntilPickup < 30) {
          priority = 'urgent';
        } else if (minutesUntilPickup < 60) {
          priority = 'high';
        }
        
        // Create follow-up notification
        const notification = await createNotification({
          recipientRole: 'dispatcher',
          type: 'trip_unassigned',
          title: `Follow-up: Unassigned Trip (${alert.followUpCount + 1})`,
          message: `Trip #${trip.trip_number} STILL needs a driver (Pickup in ${minutesUntilPickup}m)`,
          priority,
          relatedData: {
            tripId: trip._id,
            pickupTime: trip.pickup_time,
            pickupLocation: trip.pickup_location.address,
            dropoffLocation: trip.dropoff_location.address,
            riderName: trip.rider?.name || 'Unknown',
            followUpCount: alert.followUpCount + 1,
            minutesUntilPickup,
            alertType: 'followup'
          }
        });
        
        // Mark follow-up sent
        await alert.markFollowUpSent(notification._id);
        
        // Escalate if very urgent and multiple follow-ups
        if (minutesUntilPickup < 30 && alert.followUpCount >= 2 && !alert.isEscalated) {
          const escalationNotification = await createNotification({
            recipientRole: 'admin',
            type: 'system_alert',
            title: 'URGENT: Trip Still Unassigned',
            message: `Trip #${trip.trip_number} needs immediate attention (Pickup in ${minutesUntilPickup}m, ${alert.followUpCount + 1} alerts sent)`,
            priority: 'urgent',
            relatedData: {
              tripId: trip._id,
              pickupTime: trip.pickup_time,
              followUpCount: alert.followUpCount + 1,
              alertType: 'escalation'
            }
          });
          
          await alert.escalate(escalationNotification._id);
          console.log(`[Unassigned Trip Monitor] Escalated alert for trip ${trip._id}`);
        }
        
        console.log(`[Unassigned Trip Monitor] Sent follow-up ${alert.followUpCount + 1} for trip ${trip._id}`);
      } catch (error) {
        console.error(`[Unassigned Trip Monitor] Error sending follow-up for ${alert._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Unassigned Trip Monitor] Error sending follow-up alerts:', error);
  }
};

/**
 * Resolve alerts for assigned trips
 */
const resolveAssignedTrips = async () => {
  try {
    // Find active alerts where trip is now assigned
    const activeAlerts = await UnassignedTripAlert.find({
      status: { $in: ['pending', 'alerting'] }
    }).populate('trip');
    
    for (const alert of activeAlerts) {
      if (alert.trip && alert.trip.driver) {
        await alert.resolve('assigned');
        console.log(`[Unassigned Trip Monitor] Resolved alert for assigned trip ${alert.trip._id}`);
      }
    }
  } catch (error) {
    console.error('[Unassigned Trip Monitor] Error resolving assigned trips:', error);
  }
};

/**
 * Cleanup old resolved alerts
 */
const cleanupOldAlerts = async () => {
  try {
    const deletedCount = await UnassignedTripAlert.cleanupOldAlerts();
    if (deletedCount > 0) {
      console.log(`[Unassigned Trip Monitor] Cleaned up ${deletedCount} old alerts`);
    }
  } catch (error) {
    console.error('[Unassigned Trip Monitor] Error cleaning up old alerts:', error);
  }
};

/**
 * Start the unassigned trip monitoring service
 */
export const start = () => {
  if (isRunning) {
    console.log('[Unassigned Trip Monitor] Service already running');
    return;
  }
  
  console.log('[Unassigned Trip Monitor] Starting service...');
  
  // Schedule job to check unassigned trips (every minute)
  const checkUnassignedJob = cron.schedule(CRON_SCHEDULES.checkUnassignedTrips, async () => {
    await checkUnassignedTrips();
  });
  cronJobs.push(checkUnassignedJob);
  
  // Schedule job to send initial alerts (every minute)
  const initialAlertsJob = cron.schedule(CRON_SCHEDULES.checkUnassignedTrips, async () => {
    await sendInitialAlerts();
  });
  cronJobs.push(initialAlertsJob);
  
  // Schedule job to send follow-up alerts (every minute)
  const followUpAlertsJob = cron.schedule(CRON_SCHEDULES.checkUnassignedTrips, async () => {
    await sendFollowUpAlerts();
  });
  cronJobs.push(followUpAlertsJob);
  
  // Schedule job to resolve assigned trips (every minute)
  const resolveAssignedJob = cron.schedule(CRON_SCHEDULES.checkUnassignedTrips, async () => {
    await resolveAssignedTrips();
  });
  cronJobs.push(resolveAssignedJob);
  
  // Schedule cleanup job (once per day at 2 AM)
  const cleanupJob = cron.schedule(CRON_SCHEDULES.cleanupOldRecords, async () => {
    await cleanupOldAlerts();
  });
  cronJobs.push(cleanupJob);
  
  isRunning = true;
  console.log('[Unassigned Trip Monitor] Service started successfully');
  
  // Run initial check
  checkUnassignedTrips();
  sendInitialAlerts();
  sendFollowUpAlerts();
};

/**
 * Stop the unassigned trip monitoring service
 */
export const stop = () => {
  if (!isRunning) {
    console.log('[Unassigned Trip Monitor] Service not running');
    return;
  }
  
  console.log('[Unassigned Trip Monitor] Stopping service...');
  
  // Stop all cron jobs
  cronJobs.forEach(job => job.stop());
  cronJobs = [];
  
  isRunning = false;
  console.log('[Unassigned Trip Monitor] Service stopped');
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
