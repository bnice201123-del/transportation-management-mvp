import mongoose from 'mongoose';

const tripDepartureMonitoringSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    unique: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Location Data
  driverCurrentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    lastUpdated: { type: Date }
  },
  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String }
  },
  
  // Time Calculations
  scheduledPickupTime: {
    type: Date,
    required: true,
    index: true
  },
  estimatedTravelTimeMinutes: {
    type: Number, // Travel time from driver's location to pickup in minutes
    default: 15
  },
  driverBufferMinutes: {
    type: Number,
    default: 5 // Extra buffer time for driver preparation
  },
  recommendedDepartureTime: {
    type: Date,
    required: true,
    index: true
  },
  
  // Navigation Status
  navigationStarted: {
    type: Boolean,
    default: false,
    index: true
  },
  navigationStartTime: {
    type: Date,
    default: null
  },
  driverMovingTowardPickup: {
    type: Boolean,
    default: false
  },
  
  // Notification Status
  notifications: {
    fiveMinuteReminder: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      suppressed: { type: Boolean, default: false }, // If driver already started
      suppressReason: { type: String }
    },
    departureTimeAlert: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date }
    },
    lateStartAlert: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      escalatedToDispatch: { type: Boolean, default: false }
    }
  },
  
  // Monitoring Status
  status: {
    type: String,
    enum: [
      'monitoring',      // Actively monitoring for departure
      'started',         // Driver has started navigation
      'arrived',         // Driver arrived at pickup
      'late',            // Driver is late to start
      'cancelled',       // Trip cancelled
      'completed',       // Monitoring completed successfully
      'skipped'          // Trip too soon, skipped monitoring
    ],
    default: 'monitoring',
    index: true
  },
  
  // Metadata
  monitoringStartedAt: {
    type: Date,
    default: Date.now
  },
  monitoringCompletedAt: {
    type: Date
  },
  
  // Edge Case Handling
  isLastMinuteTrip: {
    type: Boolean,
    default: false
  },
  skipReason: {
    type: String,
    enum: ['too_soon', 'already_started', 'trip_cancelled', 'driver_at_pickup', null],
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
tripDepartureMonitoringSchema.index({ status: 1, recommendedDepartureTime: 1 });
tripDepartureMonitoringSchema.index({ driverId: 1, status: 1 });
tripDepartureMonitoringSchema.index({ navigationStarted: 1, status: 1 });

// Calculate recommended departure time
tripDepartureMonitoringSchema.methods.calculateDepartureTime = function() {
  const pickupTime = new Date(this.scheduledPickupTime);
  const travelMinutes = this.estimatedTravelTimeMinutes || 15;
  const bufferMinutes = this.driverBufferMinutes || 5;
  
  const totalMinutes = travelMinutes + bufferMinutes;
  const departureTime = new Date(pickupTime.getTime() - (totalMinutes * 60 * 1000));
  
  this.recommendedDepartureTime = departureTime;
  return departureTime;
};

// Check if trip is last minute (within 10 minutes)
tripDepartureMonitoringSchema.methods.isLastMinute = function() {
  const now = new Date();
  const pickupTime = new Date(this.scheduledPickupTime);
  const minutesUntilPickup = (pickupTime - now) / (60 * 1000);
  
  return minutesUntilPickup <= 10;
};

// Check if it's time for 5-minute reminder
tripDepartureMonitoringSchema.methods.shouldSendFiveMinuteReminder = function() {
  const now = new Date();
  const departureTime = new Date(this.recommendedDepartureTime);
  const fiveMinutesBefore = new Date(departureTime.getTime() - (5 * 60 * 1000));
  
  // Check if current time is past 5 minutes before departure
  return now >= fiveMinutesBefore && 
         !this.notifications.fiveMinuteReminder.sent &&
         !this.notifications.fiveMinuteReminder.suppressed &&
         !this.navigationStarted;
};

// Check if departure time has passed
tripDepartureMonitoringSchema.methods.hasDepartureTimePassed = function() {
  const now = new Date();
  const departureTime = new Date(this.recommendedDepartureTime);
  
  return now >= departureTime;
};

// Check if driver is late (5+ minutes after departure time)
tripDepartureMonitoringSchema.methods.isDriverLate = function() {
  const now = new Date();
  const departureTime = new Date(this.recommendedDepartureTime);
  const fiveMinutesAfter = new Date(departureTime.getTime() + (5 * 60 * 1000));
  
  return now >= fiveMinutesAfter && 
         !this.navigationStarted &&
         this.status === 'monitoring';
};

// Mark navigation as started
tripDepartureMonitoringSchema.methods.startNavigation = async function() {
  this.navigationStarted = true;
  this.navigationStartTime = new Date();
  this.status = 'started';
  
  // Suppress 5-minute reminder if not sent yet
  if (!this.notifications.fiveMinuteReminder.sent) {
    this.notifications.fiveMinuteReminder.suppressed = true;
    this.notifications.fiveMinuteReminder.suppressReason = 'Driver already started navigation';
  }
  
  return await this.save();
};

// Update driver location
tripDepartureMonitoringSchema.methods.updateDriverLocation = async function(latitude, longitude) {
  this.driverCurrentLocation = {
    latitude,
    longitude,
    lastUpdated: new Date()
  };
  
  // Calculate if driver is moving toward pickup
  // This is a simplified check - could use more sophisticated logic
  if (this.navigationStarted) {
    this.driverMovingTowardPickup = true;
  }
  
  return await this.save();
};

// Complete monitoring
tripDepartureMonitoringSchema.methods.completeMonitoring = async function(status = 'completed') {
  this.status = status;
  this.monitoringCompletedAt = new Date();
  return await this.save();
};

// Static method to create monitoring for a trip
tripDepartureMonitoringSchema.statics.createMonitoring = async function(tripData) {
  try {
    // Check if monitoring already exists
    const existing = await this.findOne({ tripId: tripData.tripId });
    if (existing) {
      return existing;
    }
    
    const monitoring = new this({
      tripId: tripData.tripId,
      driverId: tripData.driverId,
      pickupLocation: tripData.pickupLocation,
      scheduledPickupTime: tripData.scheduledPickupTime,
      estimatedTravelTimeMinutes: tripData.estimatedTravelTimeMinutes || 15,
      driverBufferMinutes: tripData.driverBufferMinutes || 5,
      driverCurrentLocation: tripData.driverCurrentLocation
    });
    
    // Calculate departure time
    monitoring.calculateDepartureTime();
    
    // Check if last minute trip
    if (monitoring.isLastMinute()) {
      monitoring.isLastMinuteTrip = true;
      monitoring.skipReason = 'too_soon';
      monitoring.status = 'skipped';
    }
    
    await monitoring.save();
    return monitoring;
  } catch (error) {
    console.error('Error creating monitoring:', error);
    throw error;
  }
};

// Static method to get active monitoring records that need attention
tripDepartureMonitoringSchema.statics.getActiveMonitoring = async function() {
  return await this.find({
    status: { $in: ['monitoring', 'late'] },
    scheduledPickupTime: { $gte: new Date() }
  })
  .populate('tripId', 'tripId status pickupLocation')
  .populate('driverId', 'firstName lastName email phone')
  .sort({ recommendedDepartureTime: 1 });
};

// Static method to get monitoring records needing 5-minute reminder
tripDepartureMonitoringSchema.statics.getNeedingFiveMinuteReminder = async function() {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000));
  
  return await this.find({
    status: 'monitoring',
    navigationStarted: false,
    'notifications.fiveMinuteReminder.sent': false,
    'notifications.fiveMinuteReminder.suppressed': false,
    recommendedDepartureTime: { 
      $lte: fiveMinutesFromNow,
      $gte: now 
    }
  })
  .populate('tripId', 'tripId pickupLocation')
  .populate('driverId', 'firstName lastName email phone');
};

// Static method to get late drivers
tripDepartureMonitoringSchema.statics.getLateDrivers = async function() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
  
  return await this.find({
    status: { $in: ['monitoring', 'late'] },
    navigationStarted: false,
    recommendedDepartureTime: { $lte: fiveMinutesAgo },
    'notifications.lateStartAlert.escalatedToDispatch': false
  })
  .populate('tripId', 'tripId status pickupLocation dropoffLocation')
  .populate('driverId', 'firstName lastName email phone');
};

export default mongoose.model('TripDepartureMonitoring', tripDepartureMonitoringSchema);
