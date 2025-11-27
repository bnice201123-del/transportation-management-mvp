import Notification from '../models/Notification.js';

/**
 * Create a notification for a user
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.createNotification(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (without userId)
 * @returns {Promise<Array>} Array of created notifications
 */
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => 
        Notification.createNotification({
          ...notificationData,
          userId
        })
      )
    );
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Create trip assignment notification
 * @param {String} userId - User ID to notify
 * @param {Object} trip - Trip data
 * @param {String} assignmentType - 'driver' or 'rider'
 */
export const notifyTripAssignment = async (userId, trip, assignmentType = 'driver') => {
  const title = assignmentType === 'driver' 
    ? 'New Trip Assigned'
    : 'You\'ve been scheduled for a trip';
    
  const message = assignmentType === 'driver'
    ? `You have been assigned to trip #${trip.tripId || trip._id}. Pickup at ${trip.pickupLocation?.address || 'N/A'}.`
    : `A trip has been scheduled for you on ${new Date(trip.scheduledDate).toLocaleDateString()}.`;

  return await createNotification({
    userId,
    type: 'trip_assigned',
    title,
    message,
    relatedData: {
      tripId: trip._id,
      actionUrl: assignmentType === 'driver' ? '/driver' : '/riders'
    },
    priority: 'normal'
  });
};

/**
 * Create trip update notification
 * @param {String} userId - User ID to notify
 * @param {Object} trip - Trip data
 * @param {String} updateType - Type of update
 */
export const notifyTripUpdate = async (userId, trip, updateType = 'general') => {
  const titles = {
    schedule: 'Trip Schedule Updated',
    location: 'Trip Location Changed',
    general: 'Trip Details Updated',
    cancelled: 'Trip Cancelled'
  };

  const messages = {
    schedule: `The schedule for trip #${trip.tripId || trip._id} has been updated.`,
    location: `Pickup/dropoff location for trip #${trip.tripId || trip._id} has been changed.`,
    general: `Details for trip #${trip.tripId || trip._id} have been updated.`,
    cancelled: `Trip #${trip.tripId || trip._id} has been cancelled.`
  };

  return await createNotification({
    userId,
    type: updateType === 'cancelled' ? 'trip_cancelled' : 'trip_updated',
    title: titles[updateType] || titles.general,
    message: messages[updateType] || messages.general,
    relatedData: {
      tripId: trip._id,
      actionUrl: '/trips'
    },
    priority: updateType === 'cancelled' ? 'high' : 'normal'
  });
};

/**
 * Create trip completion notification
 * @param {String} userId - User ID to notify
 * @param {Object} trip - Trip data
 */
export const notifyTripCompleted = async (userId, trip) => {
  return await createNotification({
    userId,
    type: 'trip_completed',
    title: 'Trip Completed',
    message: `Trip #${trip.tripId || trip._id} has been successfully completed.`,
    relatedData: {
      tripId: trip._id,
      actionUrl: '/trips'
    },
    priority: 'low'
  });
};

/**
 * Create trip started notification
 * @param {String} userId - User ID to notify
 * @param {Object} trip - Trip data
 */
export const notifyTripStarted = async (userId, trip) => {
  return await createNotification({
    userId,
    type: 'trip_started',
    title: 'Trip Started',
    message: `Your driver has started trip #${trip.tripId || trip._id}. Expected pickup soon.`,
    relatedData: {
      tripId: trip._id,
      actionUrl: '/live-tracking'
    },
    priority: 'normal'
  });
};

/**
 * Create system alert notification
 * @param {Array} userIds - User IDs to notify (or single ID)
 * @param {String} title - Alert title
 * @param {String} message - Alert message
 * @param {String} priority - Priority level
 */
export const notifySystemAlert = async (userIds, title, message, priority = 'normal') => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  
  return await createBulkNotifications(ids, {
    type: 'system_alert',
    title,
    message,
    priority,
    relatedData: {}
  });
};

/**
 * Create urgent notification
 * @param {String} userId - User ID to notify
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} relatedData - Related data (optional)
 */
export const notifyUrgent = async (userId, title, message, relatedData = {}) => {
  return await createNotification({
    userId,
    type: 'urgent',
    title,
    message,
    relatedData,
    priority: 'urgent'
  });
};

/**
 * Notify all admins and dispatchers
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} type - Notification type
 */
export const notifyAdminsAndDispatchers = async (title, message, type = 'system_alert') => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Find all admin and dispatcher users
    const admins = await User.find({ 
      $or: [
        { role: { $in: ['admin', 'dispatcher'] } },
        { roles: { $in: ['admin', 'dispatcher'] } }
      ]
    }).select('_id');

    const userIds = admins.map(user => user._id);

    if (userIds.length === 0) {
      console.log('No admins or dispatchers found to notify');
      return [];
    }

    return await createBulkNotifications(userIds, {
      type,
      title,
      message,
      priority: 'high',
      relatedData: {}
    });
  } catch (error) {
    console.error('Error notifying admins and dispatchers:', error);
    throw error;
  }
};

export default {
  createNotification,
  createBulkNotifications,
  notifyTripAssignment,
  notifyTripUpdate,
  notifyTripCompleted,
  notifyTripStarted,
  notifySystemAlert,
  notifyUrgent,
  notifyAdminsAndDispatchers
};
