import Trip from '../models/Trip.js';
import UnassignedTripAlert from '../models/UnassignedTripAlert.js';
import DriverProgressTracking from '../models/DriverProgressTracking.js';
import TripDepartureMonitoring from '../models/TripDepartureMonitoring.js';
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Hook to monitor trip lifecycle events
 * Automatically resolves alerts and sends notifications
 */

/**
 * Handle trip assignment (driver added to trip)
 */
export const handleTripAssigned = async (tripId, driverId, assignedBy = null) => {
  try {
    console.log(`[Trip Lifecycle] Trip ${tripId} assigned to driver ${driverId}`);
    
    // Resolve unassigned trip alert
    const alert = await UnassignedTripAlert.resolveForTrip(tripId, 'assigned', assignedBy);
    
    if (alert) {
      console.log(`[Trip Lifecycle] Resolved unassigned alert for trip ${tripId}`);
      
      // Send confirmation notification to dispatcher
      const trip = await Trip.findById(tripId).populate('driver', 'name phone');
      
      if (trip) {
        await createNotification({
          recipientRole: 'dispatcher',
          type: 'trip_assigned',
          title: 'Trip Assigned',
          message: `Trip #${trip.trip_number} assigned to ${trip.driver.name}`,
          priority: 'low',
          relatedData: {
            tripId: trip._id,
            driverId: trip.driver._id,
            driverName: trip.driver.name,
            pickupTime: trip.pickup_time,
            pickupLocation: trip.pickup_location.address
          }
        });
      }
    }
    
    return { success: true, alert };
  } catch (error) {
    console.error('[Trip Lifecycle] Error handling trip assignment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle trip completion
 */
export const handleTripCompleted = async (tripId, completedBy = null) => {
  try {
    console.log(`[Trip Lifecycle] Trip ${tripId} completed`);
    
    const trip = await Trip.findById(tripId)
      .populate('driver', 'name phone')
      .populate('rider', 'name phone');
    
    if (!trip) {
      console.error(`[Trip Lifecycle] Trip ${tripId} not found`);
      return { success: false, error: 'Trip not found' };
    }
    
    // Resolve any alerts
    await UnassignedTripAlert.resolveForTrip(tripId, 'trip_completed');
    
    // Complete driver progress tracking
    const tracking = await DriverProgressTracking.getActiveByTrip(tripId);
    if (tracking) {
      await tracking.complete();
      console.log(`[Trip Lifecycle] Completed driver tracking for trip ${tripId}`);
    }
    
    // Complete departure monitoring
    const departureMonitoring = await TripDepartureMonitoring.getActiveMonitoring({ tripId });
    if (departureMonitoring) {
      departureMonitoring.status = 'completed';
      await departureMonitoring.save();
      console.log(`[Trip Lifecycle] Completed departure monitoring for trip ${tripId}`);
    }
    
    // Calculate trip duration if we have start/end times
    let tripDuration = null;
    if (trip.actual_pickup_time && trip.actual_dropoff_time) {
      const duration = new Date(trip.actual_dropoff_time) - new Date(trip.actual_pickup_time);
      tripDuration = Math.round(duration / (60 * 1000)); // minutes
    }
    
    // Send completion notification to dispatcher
    await createNotification({
      recipientRole: 'dispatcher',
      type: 'trip_completed',
      title: 'Trip Completed',
      message: `Trip #${trip.trip_number} completed by ${trip.driver?.name || 'driver'}`,
      priority: 'low',
      relatedData: {
        tripId: trip._id,
        driverId: trip.driver?._id,
        driverName: trip.driver?.name,
        riderName: trip.rider?.name,
        tripDuration,
        pickupLocation: trip.pickup_location.address,
        dropoffLocation: trip.dropoff_location.address,
        completedAt: new Date()
      }
    });
    
    // If trip had issues (lateness or stopped alerts), notify about completion
    if (tracking && (tracking.latenessDetected || tracking.stoppedMovementDetected)) {
      await createNotification({
        recipientRole: 'dispatcher',
        type: 'trip_completed',
        title: 'Monitored Trip Completed',
        message: `Trip #${trip.trip_number} with alerts completed successfully`,
        priority: 'medium',
        relatedData: {
          tripId: trip._id,
          hadLatenessAlerts: tracking.latenessDetected,
          hadStoppedAlerts: tracking.stoppedMovementDetected,
          totalLatenessAlerts: tracking.latenessAlerts.length,
          totalStoppedAlerts: tracking.stoppedAlerts.length
        }
      });
    }
    
    console.log(`[Trip Lifecycle] Sent completion notifications for trip ${tripId}`);
    
    return { success: true, trip, tracking };
  } catch (error) {
    console.error('[Trip Lifecycle] Error handling trip completion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle trip cancellation
 */
export const handleTripCancelled = async (tripId, reason = null, cancelledBy = null) => {
  try {
    console.log(`[Trip Lifecycle] Trip ${tripId} cancelled. Reason: ${reason}`);
    
    const trip = await Trip.findById(tripId)
      .populate('driver', 'name phone')
      .populate('rider', 'name phone');
    
    if (!trip) {
      console.error(`[Trip Lifecycle] Trip ${tripId} not found`);
      return { success: false, error: 'Trip not found' };
    }
    
    // Cancel/resolve alerts
    const alert = await UnassignedTripAlert.getActiveForTrip(tripId);
    if (alert) {
      await alert.cancel();
      console.log(`[Trip Lifecycle] Cancelled unassigned alert for trip ${tripId}`);
    }
    
    // Cancel driver progress tracking
    const tracking = await DriverProgressTracking.getActiveByTrip(tripId);
    if (tracking) {
      await tracking.cancel();
      console.log(`[Trip Lifecycle] Cancelled driver tracking for trip ${tripId}`);
    }
    
    // Cancel departure monitoring
    const departureMonitoring = await TripDepartureMonitoring.getActiveMonitoring({ tripId });
    if (departureMonitoring) {
      departureMonitoring.status = 'cancelled';
      await departureMonitoring.save();
      console.log(`[Trip Lifecycle] Cancelled departure monitoring for trip ${tripId}`);
    }
    
    // Send cancellation notification to dispatcher
    await createNotification({
      recipientRole: 'dispatcher',
      type: 'trip_cancelled',
      title: 'Trip Cancelled',
      message: `Trip #${trip.trip_number} cancelled${reason ? ': ' + reason : ''}`,
      priority: 'medium',
      relatedData: {
        tripId: trip._id,
        tripNumber: trip.trip_number,
        reason,
        cancelledBy,
        driverId: trip.driver?._id,
        driverName: trip.driver?.name,
        riderName: trip.rider?.name,
        pickupTime: trip.pickup_time,
        pickupLocation: trip.pickup_location.address,
        cancelledAt: new Date()
      }
    });
    
    // Notify driver if assigned
    if (trip.driver) {
      await createNotification({
        recipientId: trip.driver._id,
        type: 'trip_cancelled',
        title: 'Trip Cancelled',
        message: `Trip #${trip.trip_number} has been cancelled${reason ? ': ' + reason : ''}`,
        priority: 'high',
        relatedData: {
          tripId: trip._id,
          reason,
          pickupTime: trip.pickup_time,
          pickupLocation: trip.pickup_location.address
        }
      });
    }
    
    // Notify rider
    if (trip.rider) {
      await createNotification({
        recipientId: trip.rider._id,
        type: 'trip_cancelled',
        title: 'Trip Cancelled',
        message: `Your trip scheduled for ${new Date(trip.pickup_time).toLocaleString()} has been cancelled`,
        priority: 'high',
        relatedData: {
          tripId: trip._id,
          reason,
          pickupTime: trip.pickup_time
        }
      });
    }
    
    console.log(`[Trip Lifecycle] Sent cancellation notifications for trip ${tripId}`);
    
    return { success: true, trip, alert, tracking };
  } catch (error) {
    console.error('[Trip Lifecycle] Error handling trip cancellation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle trip started (driver started navigation)
 */
export const handleTripStarted = async (tripId, driverId) => {
  try {
    console.log(`[Trip Lifecycle] Trip ${tripId} started by driver ${driverId}`);
    
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      console.error(`[Trip Lifecycle] Trip ${tripId} not found`);
      return { success: false, error: 'Trip not found' };
    }
    
    // Create or update driver progress tracking
    let tracking = await DriverProgressTracking.getActiveByTrip(tripId);
    
    if (!tracking) {
      tracking = await DriverProgressTracking.createForTrip(tripId, driverId);
    }
    
    // Check if started on time (within 5 minutes of departure time)
    const departureMonitoring = await TripDepartureMonitoring.getActiveMonitoring({ tripId });
    if (departureMonitoring && departureMonitoring.recommendedDepartureTime) {
      const now = new Date();
      const departureTime = new Date(departureMonitoring.recommendedDepartureTime);
      const minutesDiff = Math.abs((now - departureTime) / (60 * 1000));
      
      if (minutesDiff <= 5) {
        await tracking.markStartedOnTime();
        console.log(`[Trip Lifecycle] Driver started trip on time`);
      } else {
        console.log(`[Trip Lifecycle] Driver started trip ${minutesDiff.toFixed(1)} minutes off departure time`);
      }
    }
    
    return { success: true, trip, tracking };
  } catch (error) {
    console.error('[Trip Lifecycle] Error handling trip start:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle driver location update
 */
export const handleDriverLocationUpdate = async (tripId, driverId, latitude, longitude, speed = null, accuracy = null) => {
  try {
    let tracking = await DriverProgressTracking.getActiveByTrip(tripId);
    
    if (!tracking) {
      // Create tracking if driver has started trip
      const trip = await Trip.findById(tripId);
      if (trip && trip.status === 'in_progress') {
        tracking = await DriverProgressTracking.createForTrip(tripId, driverId);
      }
    }
    
    if (tracking) {
      await tracking.updateLocation(latitude, longitude, speed, accuracy);
      console.log(`[Trip Lifecycle] Updated location for driver on trip ${tripId}`);
    }
    
    return { success: true, tracking };
  } catch (error) {
    console.error('[Trip Lifecycle] Error handling driver location update:', error);
    return { success: false, error: error.message };
  }
};

export default {
  handleTripAssigned,
  handleTripCompleted,
  handleTripCancelled,
  handleTripStarted,
  handleDriverLocationUpdate
};
