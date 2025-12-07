import mongoose from 'mongoose';

const driverProgressTrackingSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Trip started on time flag
  startedOnTime: {
    type: Boolean,
    default: false
  },
  
  tripStartedAt: {
    type: Date
  },
  
  // GPS location history
  locationHistory: [{
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    speed: Number, // meters per second
    accuracy: Number // meters
  }],
  
  // Current location (most recent)
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    speed: Number,
    accuracy: Number
  },
  
  // Lateness tracking
  latenessDetected: {
    type: Boolean,
    default: false
  },
  
  firstLatenessDetectedAt: {
    type: Date
  },
  
  latenessAlerts: [{
    detectedAt: Date,
    estimatedArrival: Date,
    minutesLate: Number,
    distanceToPickup: Number,
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  }],
  
  // Stopped movement tracking
  stoppedMovementDetected: {
    type: Boolean,
    default: false
  },
  
  firstStoppedDetectedAt: {
    type: Date
  },
  
  stoppedAlerts: [{
    detectedAt: Date,
    locationWhenStopped: {
      latitude: Number,
      longitude: Number
    },
    minutesStopped: Number,
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  }],
  
  // Last alert timestamps (to prevent alert spam)
  lastLatenessAlertAt: {
    type: Date
  },
  
  lastStoppedAlertAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'resolved'],
    default: 'active',
    index: true
  },
  
  completedAt: {
    type: Date
  },
  
  // GPS stale detection
  gpsStaleAlertSent: {
    type: Boolean,
    default: false
  },
  
  gpsStaleAlertAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
driverProgressTrackingSchema.index({ status: 1, tripStartedAt: 1 });
driverProgressTrackingSchema.index({ driver: 1, status: 1 });
driverProgressTrackingSchema.index({ trip: 1, status: 1 });
driverProgressTrackingSchema.index({ 'currentLocation.timestamp': 1 });

// Virtual for time since last GPS update
driverProgressTrackingSchema.virtual('minutesSinceLastGPS').get(function() {
  if (!this.currentLocation || !this.currentLocation.timestamp) return null;
  const now = new Date();
  return Math.floor((now - this.currentLocation.timestamp) / (60 * 1000));
});

// Virtual for is GPS stale
driverProgressTrackingSchema.virtual('isGPSStale').get(function() {
  const minutesSince = this.minutesSinceLastGPS;
  if (minutesSince === null) return true;
  return minutesSince > 10; // 10 minutes threshold
});

// Instance method: Update location
driverProgressTrackingSchema.methods.updateLocation = async function(latitude, longitude, speed = null, accuracy = null) {
  const locationEntry = {
    latitude,
    longitude,
    timestamp: new Date(),
    speed,
    accuracy
  };
  
  // Add to history
  this.locationHistory.push(locationEntry);
  
  // Update current location
  this.currentLocation = locationEntry;
  
  // Keep only last 100 location entries to prevent unbounded growth
  if (this.locationHistory.length > 100) {
    this.locationHistory = this.locationHistory.slice(-100);
  }
  
  // Reset GPS stale alert if location is updated
  if (this.gpsStaleAlertSent) {
    this.gpsStaleAlertSent = false;
    this.gpsStaleAlertAt = null;
  }
  
  return this.save();
};

// Instance method: Record lateness alert
driverProgressTrackingSchema.methods.recordLatenessAlert = async function(
  estimatedArrival,
  minutesLate,
  distanceToPickup,
  notificationId
) {
  if (!this.latenessDetected) {
    this.latenessDetected = true;
    this.firstLatenessDetectedAt = new Date();
  }
  
  this.latenessAlerts.push({
    detectedAt: new Date(),
    estimatedArrival,
    minutesLate,
    distanceToPickup,
    notificationId
  });
  
  this.lastLatenessAlertAt = new Date();
  
  return this.save();
};

// Instance method: Record stopped movement alert
driverProgressTrackingSchema.methods.recordStoppedAlert = async function(
  minutesStopped,
  notificationId
) {
  if (!this.stoppedMovementDetected) {
    this.stoppedMovementDetected = true;
    this.firstStoppedDetectedAt = new Date();
  }
  
  this.stoppedAlerts.push({
    detectedAt: new Date(),
    locationWhenStopped: {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude
    },
    minutesStopped,
    notificationId
  });
  
  this.lastStoppedAlertAt = new Date();
  
  return this.save();
};

// Instance method: Mark GPS stale alert sent
driverProgressTrackingSchema.methods.markGPSStaleAlertSent = async function() {
  this.gpsStaleAlertSent = true;
  this.gpsStaleAlertAt = new Date();
  return this.save();
};

// Instance method: Mark trip started on time
driverProgressTrackingSchema.methods.markStartedOnTime = async function() {
  this.startedOnTime = true;
  this.tripStartedAt = new Date();
  return this.save();
};

// Instance method: Complete tracking
driverProgressTrackingSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Instance method: Cancel tracking
driverProgressTrackingSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.completedAt = new Date();
  return this.save();
};

// Instance method: Should send lateness alert
driverProgressTrackingSchema.methods.shouldSendLatenessAlert = function() {
  if (this.status !== 'active') return false;
  if (!this.startedOnTime) return false; // Only monitor if started on time
  
  // Don't spam - wait 5 minutes between alerts
  if (this.lastLatenessAlertAt) {
    const minutesSinceLastAlert = (new Date() - this.lastLatenessAlertAt) / (60 * 1000);
    if (minutesSinceLastAlert < 5) return false;
  }
  
  return true;
};

// Instance method: Should send stopped alert
driverProgressTrackingSchema.methods.shouldSendStoppedAlert = function() {
  if (this.status !== 'active') return false;
  if (!this.startedOnTime) return false; // Only monitor if started on time
  
  // Don't spam - wait 10 minutes between alerts
  if (this.lastStoppedAlertAt) {
    const minutesSinceLastAlert = (new Date() - this.lastStoppedAlertAt) / (60 * 1000);
    if (minutesSinceLastAlert < 10) return false;
  }
  
  return true;
};

// Static method: Create tracking for trip
driverProgressTrackingSchema.statics.createForTrip = async function(tripId, driverId) {
  // Check if tracking already exists
  const existing = await this.findOne({
    trip: tripId,
    status: 'active'
  });
  
  if (existing) {
    return existing;
  }
  
  return this.create({
    trip: tripId,
    driver: driverId,
    status: 'active'
  });
};

// Static method: Get active tracking by trip
driverProgressTrackingSchema.statics.getActiveByTrip = async function(tripId) {
  return this.findOne({
    trip: tripId,
    status: 'active'
  }).populate('driver', 'name phone email');
};

// Static method: Get active tracking by driver
driverProgressTrackingSchema.statics.getActiveByDriver = async function(driverId) {
  return this.find({
    driver: driverId,
    status: 'active'
  }).populate('trip');
};

// Static method: Get drivers needing lateness check
driverProgressTrackingSchema.statics.getNeedingLatenessCheck = async function() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
  
  return this.find({
    status: 'active',
    startedOnTime: true,
    'currentLocation.timestamp': { $gte: fiveMinutesAgo }, // GPS is recent
    $or: [
      { lastLatenessAlertAt: { $exists: false } },
      { lastLatenessAlertAt: { $lt: fiveMinutesAgo } }
    ]
  }).populate('trip').populate('driver', 'name phone email');
};

// Static method: Get drivers needing stopped check
driverProgressTrackingSchema.statics.getNeedingStoppedCheck = async function() {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - (10 * 60 * 1000));
  
  return this.find({
    status: 'active',
    startedOnTime: true,
    'currentLocation.timestamp': { $exists: true },
    $or: [
      { lastStoppedAlertAt: { $exists: false } },
      { lastStoppedAlertAt: { $lt: tenMinutesAgo } }
    ]
  }).populate('trip').populate('driver', 'name phone email');
};

// Static method: Get drivers with stale GPS
driverProgressTrackingSchema.statics.getWithStaleGPS = async function() {
  const tenMinutesAgo = new Date(Date.now() - (10 * 60 * 1000));
  
  return this.find({
    status: 'active',
    startedOnTime: true,
    gpsStaleAlertSent: false,
    $or: [
      { 'currentLocation.timestamp': { $lt: tenMinutesAgo } },
      { 'currentLocation.timestamp': { $exists: false } }
    ]
  }).populate('trip').populate('driver', 'name phone email');
};

// Static method: Get statistics
driverProgressTrackingSchema.statics.getStatistics = async function(startDate, endDate) {
  const match = {
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTracked: { $sum: 1 },
        startedOnTime: { $sum: { $cond: ['$startedOnTime', 1, 0] } },
        latenessDetected: { $sum: { $cond: ['$latenessDetected', 1, 0] } },
        stoppedDetected: { $sum: { $cond: ['$stoppedMovementDetected', 1, 0] } },
        totalLatenessAlerts: { $sum: { $size: '$latenessAlerts' } },
        totalStoppedAlerts: { $sum: { $size: '$stoppedAlerts' } },
        averageLocationUpdates: { $avg: { $size: '$locationHistory' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalTracked: 0,
    startedOnTime: 0,
    latenessDetected: 0,
    stoppedDetected: 0,
    totalLatenessAlerts: 0,
    totalStoppedAlerts: 0,
    averageLocationUpdates: 0
  };
};

// Cleanup old completed/cancelled tracking (older than 7 days)
driverProgressTrackingSchema.statics.cleanupOldTracking = async function() {
  const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    status: { $in: ['completed', 'cancelled', 'resolved'] },
    completedAt: { $lt: sevenDaysAgo }
  });
  
  return result.deletedCount;
};

const DriverProgressTracking = mongoose.model('DriverProgressTracking', driverProgressTrackingSchema);

export default DriverProgressTracking;
