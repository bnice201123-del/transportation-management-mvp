import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  geofenceId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Geofence type
  type: {
    type: String,
    enum: ['circular', 'polygon'],
    required: true
  },
  
  // For circular geofences
  center: {
    lat: Number,
    lng: Number
  },
  radius: {
    type: Number, // in meters
    min: 0
  },
  
  // For polygon geofences
  polygon: [{
    lat: {
      type: Number,
      required: function() { return this.type === 'polygon'; }
    },
    lng: {
      type: Number,
      required: function() { return this.type === 'polygon'; }
    }
  }],
  
  // Geofence purpose/category
  category: {
    type: String,
    enum: ['pickup_zone', 'dropoff_zone', 'restricted_area', 'service_area', 'parking', 'depot', 'custom'],
    default: 'custom'
  },
  
  // Trigger events
  triggerEvents: [{
    type: String,
    enum: ['enter', 'exit', 'dwell']
  }],
  
  // Dwell time threshold (for dwell events)
  dwellTimeMinutes: {
    type: Number,
    default: 5
  },
  
  // Active schedule
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    startTime: String, // HH:MM
    endTime: String, // HH:MM
    timezone: String
  },
  
  // Notification settings
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    notifyRoles: [{
      type: String,
      enum: ['admin', 'dispatcher', 'driver', 'scheduler']
    }],
    notifyUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Speed limits within geofence
  speedLimit: {
    enabled: {
      type: Boolean,
      default: false
    },
    limit: Number, // km/h
    alertThreshold: Number // km/h over limit to trigger alert
  },
  
  // Associated locations/facilities
  associatedWith: {
    type: {
      type: String,
      enum: ['trip', 'vehicle', 'location', 'user', 'facility']
    },
    id: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  metadata: {
    area: Number, // square meters
    color: {
      type: String,
      default: '#4285F4'
    },
    zIndex: {
      type: Number,
      default: 0
    },
    tags: [String]
  },
  
  // Activity tracking
  statistics: {
    totalEnterEvents: {
      type: Number,
      default: 0
    },
    totalExitEvents: {
      type: Number,
      default: 0
    },
    totalDwellEvents: {
      type: Number,
      default: 0
    },
    lastTriggered: Date,
    averageDwellTime: Number // minutes
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }
}, {
  timestamps: true
});

// Indexes
geofenceSchema.index({ geofenceId: 1 });
geofenceSchema.index({ category: 1, isActive: 1 });
geofenceSchema.index({ createdBy: 1 });
geofenceSchema.index({ 'center.lat': 1, 'center.lng': 1 });

// Generate unique geofence ID before validation
geofenceSchema.pre('validate', function(next) {
  if (!this.geofenceId) {
    this.geofenceId = `GEO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Methods
geofenceSchema.methods.recordEvent = async function(eventType) {
  if (eventType === 'enter') {
    this.statistics.totalEnterEvents += 1;
  } else if (eventType === 'exit') {
    this.statistics.totalExitEvents += 1;
  } else if (eventType === 'dwell') {
    this.statistics.totalDwellEvents += 1;
  }
  
  this.statistics.lastTriggered = new Date();
  await this.save();
};

geofenceSchema.methods.isActiveNow = function() {
  if (!this.schedule.enabled) {
    return this.isActive;
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (!this.schedule.daysOfWeek.includes(dayOfWeek)) {
    return false;
  }

  if (currentTime < this.schedule.startTime || currentTime > this.schedule.endTime) {
    return false;
  }

  return this.isActive;
};

export default mongoose.model('Geofence', geofenceSchema);
