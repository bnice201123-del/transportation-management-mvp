import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'trip_assigned',
      'trip_updated',
      'trip_cancelled',
      'trip_completed',
      'trip_started',
      'rider_assigned',
      'driver_assigned',
      'vehicle_assigned',
      'schedule_change',
      'system_alert',
      'message',
      'urgent'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  relatedData: {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    actionUrl: {
      type: String,
      trim: true
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    unreadOnly = false,
    type = null 
  } = options;

  const query = { userId };
  if (unreadOnly) query.read = false;
  if (type) query.type = type;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedData.tripId', 'tripId scheduledDate status')
    .populate('relatedData.riderId', 'name email')
    .populate('relatedData.driverId', 'name email')
    .populate('relatedData.vehicleId', 'vehicleNumber licensePlate')
    .lean();
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
};

// Static method to delete old read notifications
notificationSchema.statics.deleteOldReadNotifications = async function(userId, daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    userId,
    read: true,
    createdAt: { $lt: cutoffDate }
  });
};

export default mongoose.model('Notification', notificationSchema);
