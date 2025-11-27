import mongoose from 'mongoose';

const unassignedTripAlertSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  
  // Threshold time when first alert should be sent
  thresholdTime: {
    type: Date,
    required: true,
    index: true
  },
  
  // Drive time from garage to pickup (in minutes)
  driveTimeFromGarage: {
    type: Number,
    required: true
  },
  
  // Garage location at time of calculation
  garageLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Alert tracking
  firstAlertSent: {
    type: Boolean,
    default: false
  },
  
  firstAlertSentAt: {
    type: Date
  },
  
  followUpCount: {
    type: Number,
    default: 0
  },
  
  lastFollowUpAt: {
    type: Date
  },
  
  // Escalation tracking
  isEscalated: {
    type: Boolean,
    default: false
  },
  
  escalatedAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'alerting', 'resolved', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Resolution
  resolvedAt: {
    type: Date
  },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  resolutionReason: {
    type: String,
    enum: ['assigned', 'cancelled', 'manual_resolution', 'trip_completed']
  },
  
  // Notifications sent
  notificationsSent: [{
    type: {
      type: String,
      enum: ['initial', 'followup', 'escalation']
    },
    sentAt: Date,
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
unassignedTripAlertSchema.index({ status: 1, thresholdTime: 1 });
unassignedTripAlertSchema.index({ trip: 1, status: 1 });
unassignedTripAlertSchema.index({ firstAlertSent: 1, status: 1 });

// Virtual for time since threshold
unassignedTripAlertSchema.virtual('minutesSinceThreshold').get(function() {
  if (this.status !== 'alerting') return 0;
  const now = new Date();
  return Math.floor((now - this.thresholdTime) / (60 * 1000));
});

// Virtual for next follow-up due time
unassignedTripAlertSchema.virtual('nextFollowUpDue').get(function() {
  if (!this.lastFollowUpAt || this.status !== 'alerting') return null;
  
  const followUpInterval = 15 * 60 * 1000; // 15 minutes
  return new Date(this.lastFollowUpAt.getTime() + followUpInterval);
});

// Virtual for should send follow-up
unassignedTripAlertSchema.virtual('shouldSendFollowUp').get(function() {
  if (this.status !== 'alerting') return false;
  if (!this.firstAlertSent) return false;
  
  const now = new Date();
  const followUpInterval = 15 * 60 * 1000; // 15 minutes
  
  if (!this.lastFollowUpAt) {
    // Check if 15 minutes since first alert
    return (now - this.firstAlertSentAt) >= followUpInterval;
  }
  
  // Check if 15 minutes since last follow-up
  return (now - this.lastFollowUpAt) >= followUpInterval;
});

// Instance method: Mark first alert sent
unassignedTripAlertSchema.methods.markFirstAlertSent = async function(notificationId) {
  this.firstAlertSent = true;
  this.firstAlertSentAt = new Date();
  this.status = 'alerting';
  this.notificationsSent.push({
    type: 'initial',
    sentAt: new Date(),
    notificationId
  });
  return this.save();
};

// Instance method: Mark follow-up sent
unassignedTripAlertSchema.methods.markFollowUpSent = async function(notificationId) {
  this.followUpCount += 1;
  this.lastFollowUpAt = new Date();
  this.notificationsSent.push({
    type: 'followup',
    sentAt: new Date(),
    notificationId
  });
  return this.save();
};

// Instance method: Escalate alert
unassignedTripAlertSchema.methods.escalate = async function(notificationId) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.notificationsSent.push({
    type: 'escalation',
    sentAt: new Date(),
    notificationId
  });
  return this.save();
};

// Instance method: Resolve alert
unassignedTripAlertSchema.methods.resolve = async function(reason, resolvedBy = null) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolutionReason = reason;
  if (resolvedBy) {
    this.resolvedBy = resolvedBy;
  }
  return this.save();
};

// Instance method: Cancel alert
unassignedTripAlertSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.resolvedAt = new Date();
  this.resolutionReason = 'cancelled';
  return this.save();
};

// Static method: Create alert for trip
unassignedTripAlertSchema.statics.createForTrip = async function(
  tripId,
  pickupTime,
  driveTimeMinutes,
  garageLocation
) {
  const { calculateUnassignedAlertThreshold } = await import('../utils/tripMonitoringCalculations.js');
  const thresholdTime = calculateUnassignedAlertThreshold(pickupTime, driveTimeMinutes);
  
  // Check if alert already exists for this trip
  const existing = await this.findOne({ 
    trip: tripId, 
    status: { $in: ['pending', 'alerting'] } 
  });
  
  if (existing) {
    return existing;
  }
  
  return this.create({
    trip: tripId,
    thresholdTime,
    driveTimeFromGarage: driveTimeMinutes,
    garageLocation,
    status: 'pending'
  });
};

// Static method: Get alerts needing initial notification
unassignedTripAlertSchema.statics.getNeedingInitialAlert = async function() {
  const now = new Date();
  return this.find({
    status: 'pending',
    firstAlertSent: false,
    thresholdTime: { $lte: now }
  }).populate({
    path: 'trip',
    populate: [
      { path: 'rider', select: 'name phone email' },
      { path: 'driver', select: 'name phone email' }
    ]
  });
};

// Static method: Get alerts needing follow-up
unassignedTripAlertSchema.statics.getNeedingFollowUp = async function() {
  const now = new Date();
  const followUpInterval = 15 * 60 * 1000; // 15 minutes
  
  return this.find({
    status: 'alerting',
    firstAlertSent: true,
    $or: [
      // First follow-up: 15 min after initial alert
      {
        lastFollowUpAt: { $exists: false },
        firstAlertSentAt: { $lte: new Date(now.getTime() - followUpInterval) }
      },
      // Subsequent follow-ups: 15 min after last follow-up
      {
        lastFollowUpAt: { $lte: new Date(now.getTime() - followUpInterval) }
      }
    ]
  }).populate({
    path: 'trip',
    populate: [
      { path: 'rider', select: 'name phone email' },
      { path: 'driver', select: 'name phone email' }
    ]
  });
};

// Static method: Get active alerts for trip
unassignedTripAlertSchema.statics.getActiveForTrip = async function(tripId) {
  return this.findOne({
    trip: tripId,
    status: { $in: ['pending', 'alerting'] }
  });
};

// Static method: Resolve alerts for trip
unassignedTripAlertSchema.statics.resolveForTrip = async function(tripId, reason, resolvedBy = null) {
  const alert = await this.findOne({
    trip: tripId,
    status: { $in: ['pending', 'alerting'] }
  });
  
  if (alert) {
    await alert.resolve(reason, resolvedBy);
  }
  
  return alert;
};

// Static method: Get statistics
unassignedTripAlertSchema.statics.getStatistics = async function(startDate, endDate) {
  const match = {
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $in: ['$status', ['pending', 'alerting']] }, 1, 0] } },
        escalated: { $sum: { $cond: ['$isEscalated', 1, 0] } },
        averageFollowUps: { $avg: '$followUpCount' },
        totalNotificationsSent: { $sum: { $size: '$notificationsSent' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalAlerts: 0,
    resolved: 0,
    cancelled: 0,
    active: 0,
    escalated: 0,
    averageFollowUps: 0,
    totalNotificationsSent: 0
  };
};

// Cleanup old resolved alerts (older than 7 days)
unassignedTripAlertSchema.statics.cleanupOldAlerts = async function() {
  const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    status: { $in: ['resolved', 'cancelled'] },
    resolvedAt: { $lt: sevenDaysAgo }
  });
  
  return result.deletedCount;
};

const UnassignedTripAlert = mongoose.model('UnassignedTripAlert', unassignedTripAlertSchema);

export default UnassignedTripAlert;
