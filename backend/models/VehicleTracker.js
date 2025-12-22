import mongoose from 'mongoose';

const vehicleTrackerSchema = new mongoose.Schema({
  // Vehicle Reference
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true,
    index: true
  },
  
  // Tracker Credentials
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // E.164 format or standard phone number
        return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  
  simCardNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Credentials (encrypted)
  credentials: {
    accountNumber: {
      type: String,
      trim: true
    },
    pin: {
      type: String,
      select: false // Don't return by default
    },
    encryptedPin: {
      type: String,
      select: false // For encrypted storage
    },
    lastCredentialUpdate: Date
  },
  
  // Status and Activity
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'archived'],
    default: 'active',
    index: true
  },
  
  activatedAt: {
    type: Date
  },
  
  deactivatedAt: {
    type: Date
  },
  
  suspendedAt: {
    type: Date
  },
  
  suspensionReason: {
    type: String,
    maxlength: 500
  },
  
  // Tracking Information
  lastTrackedAt: {
    type: Date,
    index: true
  },
  
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number, // meters
    timestamp: Date,
    address: String
  },
  
  batteryLevel: {
    type: Number,
    default: 100 // percent (0-100)
  },
  
  signalStrength: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'no_signal'],
    default: 'good'
  },
  
  // Setup Information
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  linkedAt: {
    type: Date
  },
  
  setupBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who set up this tracker
  },
  
  setupAt: {
    type: Date,
    default: Date.now
  },
  
  // Tracking Configuration
  trackingSettings: {
    frequency: {
      type: Number,
      default: 30, // seconds
      min: 10,
      max: 300
    },
    
    gpsEnabled: {
      type: Boolean,
      default: true
    },
    
    cellularEnabled: {
      type: Boolean,
      default: true
    },
    
    wifiEnabled: {
      type: Boolean,
      default: true
    },
    
    lowPowerMode: {
      type: Boolean,
      default: false
    },
    
    geofenceEnabled: {
      type: Boolean,
      default: false
    },
    
    geofenceRadius: {
      type: Number, // meters
      default: 500
    }
  },
  
  // Alert Settings
  alertSettings: {
    lowBatteryThreshold: {
      type: Number,
      default: 20, // percent
      min: 5,
      max: 50
    },
    
    lowBatteryAlert: {
      type: Boolean,
      default: true
    },
    
    noSignalAlert: {
      type: Boolean,
      default: true
    },
    
    noSignalDuration: {
      type: Number,
      default: 300 // seconds
    },
    
    geofenceAlert: {
      type: Boolean,
      default: false
    },
    
    speedAlert: {
      type: Boolean,
      default: false
    },
    
    speedLimit: {
      type: Number, // km/h
      default: 100
    },
    
    maintenanceAlert: {
      type: Boolean,
      default: false
    },
    
    maintenanceInterval: {
      type: Number, // kilometers
      default: 10000
    }
  },
  
  // Tracking Data (Last 24 hours in summary)
  trackingData: {
    totalDistance: {
      type: Number, // kilometers
      default: 0
    },
    
    totalDuration: {
      type: Number, // minutes
      default: 0
    },
    
    averageSpeed: {
      type: Number, // km/h
      default: 0
    },
    
    maxSpeed: {
      type: Number, // km/h
      default: 0
    },
    
    tripCount: {
      type: Number,
      default: 0
    },
    
    lastUpdated: Date,
    
    // Store reference to detailed tracking records
    trackingPointsCollection: {
      type: String, // MongoDB collection name for points
      default: function() {
        return `tracker_points_${this._id}`;
      }
    }
  },
  
  // Maintenance Information
  maintenance: {
    lastServiceDate: Date,
    nextServiceDue: Date,
    totalMileage: Number,
    oilChangeInterval: { type: Number, default: 10000 }, // km
    tireRotationInterval: { type: Number, default: 15000 }, // km
    notes: String
  },
  
  // Device Information
  deviceInfo: {
    type: String, // e.g., "iPhone 13", "Samsung Galaxy S21"
    trim: true
  },
  
  deviceImei: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    index: true
  },
  
  osVersion: {
    type: String,
    trim: true
  },
  
  appVersion: {
    type: String,
    trim: true
  },
  
  // SIM Card Details
  simCardDetails: {
    provider: {
      type: String,
      trim: true
    },
    iccid: {
      type: String,
      trim: true
    },
    plan: {
      type: String,
      trim: true
    }
  },
  
  // Activity Log
  activityLog: [{
    action: {
      type: String,
      enum: [
        'activated',
        'deactivated',
        'suspended',
        'resumed',
        'settings_updated',
        'firmware_updated',
        'low_battery',
        'no_signal',
        'geofence_breach',
        'speed_alert',
        'maintenance_due',
        'archived'
      ]
    },
    
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    performedAt: {
      type: Date,
      default: Date.now
    },
    
    details: mongoose.Schema.Types.Mixed,
    notes: String
  }],
  
  // Statistics
  statistics: {
    totalOperatingDays: {
      type: Number,
      default: 0
    },
    
    totalTrackedDistance: {
      type: Number, // kilometers
      default: 0
    },
    
    averageDailyDistance: {
      type: Number,
      default: 0
    },
    
    trackingUptime: {
      type: Number, // percent
      default: 100
    },
    
    lastCalculatedAt: Date
  },
  
  // Metadata
  tags: [String], // For custom categorization
  
  notes: {
    type: String,
    maxlength: 1000
  },
  
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: Date,
  
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  indexes: [
    { vehicleId: 1, status: 1 },
    { phoneNumber: 1, status: 1 },
    { status: 1, createdAt: -1 },
    { lastTrackedAt: -1 },
    { 'lastKnownLocation': '2dsphere' }, // For geospatial queries
    { archived: 1, status: 1 },
    { linkedUserId: 1, status: 1 }
  ]
});

// Instance Methods

/**
 * Activate the tracker
 */
vehicleTrackerSchema.methods.activate = async function() {
  this.status = 'active';
  this.activatedAt = new Date();
  this.deactivatedAt = null;
  
  this.activityLog.push({
    action: 'activated',
    performedAt: new Date()
  });
  
  return this.save();
};

/**
 * Deactivate the tracker
 */
vehicleTrackerSchema.methods.deactivate = async function(deactivatedBy = null) {
  this.status = 'inactive';
  this.deactivatedAt = new Date();
  
  this.activityLog.push({
    action: 'deactivated',
    performedBy: deactivatedBy,
    performedAt: new Date()
  });
  
  return this.save();
};

/**
 * Suspend the tracker
 */
vehicleTrackerSchema.methods.suspend = async function(reason = '', suspendedBy = null) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspensionReason = reason;
  
  this.activityLog.push({
    action: 'suspended',
    performedBy: suspendedBy,
    details: { reason },
    performedAt: new Date()
  });
  
  return this.save();
};

/**
 * Resume a suspended tracker
 */
vehicleTrackerSchema.methods.resume = async function(resumedBy = null) {
  this.status = 'active';
  this.suspendedAt = null;
  this.suspensionReason = null;
  
  this.activityLog.push({
    action: 'resumed',
    performedBy: resumedBy,
    performedAt: new Date()
  });
  
  return this.save();
};

/**
 * Archive the tracker
 */
vehicleTrackerSchema.methods.archive = async function(archivedBy = null) {
  this.status = 'archived';
  this.archived = true;
  this.archivedAt = new Date();
  this.archivedBy = archivedBy;
  
  this.activityLog.push({
    action: 'archived',
    performedBy: archivedBy,
    performedAt: new Date()
  });
  
  return this.save();
};

/**
 * Update location
 */
vehicleTrackerSchema.methods.updateLocation = async function(location) {
  this.lastTrackedAt = new Date();
  this.lastKnownLocation = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: new Date(),
    address: location.address
  };
  
  // Update battery level if provided
  if (location.batteryLevel !== undefined) {
    this.batteryLevel = location.batteryLevel;
  }
  
  return this.save();
};

/**
 * Update tracking statistics
 */
vehicleTrackerSchema.methods.updateStatistics = function(stats) {
  this.statistics.totalTrackedDistance += stats.distance || 0;
  this.statistics.lastCalculatedAt = new Date();
  
  if (stats.uptime !== undefined) {
    this.statistics.trackingUptime = stats.uptime;
  }
  
  return this.save();
};

/**
 * Get tracking health status
 */
vehicleTrackerSchema.methods.getHealthStatus = function() {
  const health = {
    status: this.status,
    battery: this.batteryLevel,
    signal: this.signalStrength,
    lastTracked: this.lastTrackedAt,
    isHealthy: true,
    alerts: []
  };
  
  if (this.batteryLevel < this.alertSettings.lowBatteryThreshold) {
    health.isHealthy = false;
    health.alerts.push(`Low battery: ${this.batteryLevel}%`);
  }
  
  if (this.signalStrength === 'no_signal') {
    health.isHealthy = false;
    health.alerts.push('No signal');
  }
  
  const minutesSinceTracked = this.lastTrackedAt 
    ? Math.floor((Date.now() - this.lastTrackedAt) / 60000) 
    : null;
  
  if (minutesSinceTracked && minutesSinceTracked > 30) {
    health.isHealthy = false;
    health.alerts.push(`No tracking for ${minutesSinceTracked} minutes`);
  }
  
  return health;
};

// Static Methods

/**
 * Get active trackers for a vehicle
 */
vehicleTrackerSchema.statics.getActiveTrackerForVehicle = async function(vehicleId) {
  return this.findOne({ vehicleId, status: 'active' });
};

/**
 * Get all trackers by status
 */
vehicleTrackerSchema.statics.getTrackersByStatus = async function(status, limit = 100) {
  return this.find({ status, archived: false })
    .limit(limit)
    .sort({ lastTrackedAt: -1 })
    .lean();
};

/**
 * Get unhealthy trackers
 */
vehicleTrackerSchema.statics.getUnhealthyTrackers = async function() {
  const result = await this.find({
    status: 'active',
    archived: false,
    $or: [
      { batteryLevel: { $lt: 20 } },
      { signalStrength: 'no_signal' },
      { lastTrackedAt: { $lt: new Date(Date.now() - 30 * 60000) } } // 30 minutes
    ]
  }).lean();
  
  return result;
};

/**
 * Get trackers by location (geospatial query)
 */
vehicleTrackerSchema.statics.getTrackersByLocation = async function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    'lastKnownLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    archived: false
  }).lean();
};

/**
 * Get tracker statistics
 */
vehicleTrackerSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { archived: false } },
    {
      $group: {
        _id: null,
        totalTrackers: { $sum: 1 },
        activeTrackers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactiveTrackers: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        },
        suspendedTrackers: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        },
        averageBattery: { $avg: '$batteryLevel' },
        totalDistance: { $sum: '$statistics.totalTrackedDistance' },
        recentlyTracked: {
          $sum: {
            $cond: [
              { $gt: ['$lastTrackedAt', new Date(Date.now() - 60 * 60000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalTrackers: 0,
    activeTrackers: 0,
    inactiveTrackers: 0,
    suspendedTrackers: 0,
    averageBattery: 0,
    totalDistance: 0,
    recentlyTracked: 0
  };
};

export default mongoose.model('VehicleTracker', vehicleTrackerSchema);
