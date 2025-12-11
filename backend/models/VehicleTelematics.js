import mongoose from 'mongoose';

const vehicleTelematicsSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true,
    index: true
  },

  // Device information
  device: {
    deviceId: {
      type: String,
      required: true,
      unique: true
    },
    deviceType: {
      type: String,
      enum: ['obd2', 'gps_tracker', 'dashcam', 'eld', 'integrated', 'smartphone', 'other'],
      required: true
    },
    manufacturer: String,
    model: String,
    serialNumber: String,
    firmwareVersion: String,
    installDate: Date,
    lastCommunication: Date,
    batteryLevel: Number,
    signalStrength: Number,
    status: {
      type: String,
      enum: ['active', 'inactive', 'offline', 'error', 'maintenance'],
      default: 'active'
    }
  },

  // API Integration
  apiIntegration: {
    provider: {
      type: String,
      enum: ['geotab', 'verizon_connect', 'samsara', 'teletrac_navman', 'gps_insight', 'motive', 'fleet_complete', 'custom', 'other'],
      required: true
    },
    apiKey: {
      type: String,
      select: false
    },
    apiEndpoint: String,
    accountId: String,
    enabled: {
      type: Boolean,
      default: true
    },
    lastSynced: Date,
    syncFrequency: {
      type: String,
      enum: ['realtime', '1min', '5min', '15min', '30min', '1hour'],
      default: '5min'
    },
    syncError: String
  },

  // Real-time location data
  currentLocation: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    address: String,
    speed: Number, // km/h
    heading: Number, // degrees
    altitude: Number, // meters
    accuracy: Number, // meters
    timestamp: Date,
    isMoving: Boolean,
    isIdling: Boolean,
    ignitionStatus: {
      type: String,
      enum: ['on', 'off', 'unknown']
    }
  },

  // Location history (last 24 hours)
  locationHistory: [{
    coordinates: {
      lat: Number,
      lng: Number
    },
    speed: Number,
    heading: Number,
    timestamp: Date,
    address: String
  }],

  // Vehicle diagnostics
  diagnostics: {
    odometer: {
      value: Number,
      unit: {
        type: String,
        enum: ['miles', 'kilometers'],
        default: 'miles'
      },
      lastUpdated: Date
    },
    fuelLevel: {
      percentage: Number,
      liters: Number,
      lastUpdated: Date
    },
    engineHours: {
      value: Number,
      lastUpdated: Date
    },
    engineRPM: Number,
    engineTemperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'fahrenheit'
      }
    },
    batteryVoltage: Number,
    tirePressure: {
      frontLeft: Number,
      frontRight: Number,
      rearLeft: Number,
      rearRight: Number,
      unit: {
        type: String,
        enum: ['psi', 'bar', 'kpa'],
        default: 'psi'
      }
    },
    oilLife: Number, // percentage
    engineLoad: Number, // percentage
    throttlePosition: Number, // percentage
    coolantTemperature: Number
  },

  // Fault codes and alerts
  faultCodes: [{
    code: {
      type: String,
      required: true
    },
    description: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning'
    },
    detectedAt: {
      type: Date,
      default: Date.now
    },
    clearedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    mileageAtDetection: Number,
    actionTaken: String,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Driver behavior tracking
  driverBehavior: {
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    harshAcceleration: {
      count: {
        type: Number,
        default: 0
      },
      lastOccurrence: Date,
      threshold: {
        type: Number,
        default: 8 // mph/s
      }
    },
    harshBraking: {
      count: {
        type: Number,
        default: 0
      },
      lastOccurrence: Date,
      threshold: {
        type: Number,
        default: 8 // mph/s
      }
    },
    harshCornering: {
      count: {
        type: Number,
        default: 0
      },
      lastOccurrence: Date,
      threshold: {
        type: Number,
        default: 0.4 // g-force
      }
    },
    speeding: {
      count: {
        type: Number,
        default: 0
      },
      lastOccurrence: Date,
      maxSpeedRecorded: Number,
      averageOverage: Number
    },
    idling: {
      totalMinutes: {
        type: Number,
        default: 0
      },
      excessiveIdleCount: {
        type: Number,
        default: 0
      },
      threshold: {
        type: Number,
        default: 5 // minutes
      }
    },
    driverScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    lastScoreUpdate: Date
  },

  // Trip data
  trips: [{
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    startLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    endLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    distance: Number,
    duration: Number, // minutes
    averageSpeed: Number,
    maxSpeed: Number,
    fuelUsed: Number,
    idleTime: Number,
    driverScore: Number,
    events: [{
      type: {
        type: String,
        enum: ['harsh_accel', 'harsh_brake', 'harsh_corner', 'speeding', 'idle', 'geofence_enter', 'geofence_exit']
      },
      timestamp: Date,
      location: {
        lat: Number,
        lng: Number
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      value: Number
    }]
  }],

  // Fuel efficiency tracking
  fuelEfficiency: {
    averageMPG: Number,
    currentMPG: Number,
    totalFuelConsumed: Number, // gallons or liters
    fuelCostPerMile: Number,
    idleFuelWaste: Number,
    lastCalculated: Date,
    baseline: Number, // Expected MPG for comparison
    efficiencyRating: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      default: 'average'
    }
  },

  // Maintenance predictions
  maintenancePredictions: [{
    component: {
      type: String,
      enum: ['oil', 'brakes', 'tires', 'battery', 'air_filter', 'transmission', 'coolant', 'spark_plugs', 'other']
    },
    predictedDate: Date,
    predictedMileage: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    basedOn: {
      type: String,
      enum: ['mileage', 'time', 'usage_pattern', 'sensor_data', 'ml_model']
    },
    recommendation: String,
    estimatedCost: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    }
  }],

  // Geofencing
  geofenceEvents: [{
    geofence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geofence'
    },
    eventType: {
      type: String,
      enum: ['enter', 'exit', 'dwell']
    },
    timestamp: Date,
    location: {
      lat: Number,
      lng: Number
    },
    speed: Number,
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Hours of service (for commercial vehicles)
  hoursOfService: {
    drivingHoursToday: {
      type: Number,
      default: 0
    },
    drivingHoursThisWeek: {
      type: Number,
      default: 0
    },
    onDutyHoursToday: {
      type: Number,
      default: 0
    },
    cycleRemaining: Number,
    lastResetDate: Date,
    violations: [{
      type: String,
      timestamp: Date,
      description: String
    }]
  },

  // Environmental data
  environmental: {
    totalCO2Emissions: {
      type: Number,
      default: 0 // kg
    },
    co2PerMile: Number,
    fuelEfficiencyScore: Number,
    ecoScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Statistics and aggregations
  statistics: {
    totalDistance: {
      type: Number,
      default: 0
    },
    totalDrivingTime: {
      type: Number,
      default: 0 // hours
    },
    totalIdleTime: {
      type: Number,
      default: 0 // minutes
    },
    averageSpeed: Number,
    maxSpeedRecorded: Number,
    totalTrips: {
      type: Number,
      default: 0
    },
    lastTripDate: Date,
    utilizationRate: Number, // percentage of time vehicle is in use
    lastUpdated: Date
  },

  // Alerts configuration
  alertsConfig: {
    speedingThreshold: {
      type: Number,
      default: 10 // mph over limit
    },
    idleThreshold: {
      type: Number,
      default: 5 // minutes
    },
    lowFuelThreshold: {
      type: Number,
      default: 15 // percentage
    },
    maintenanceReminder: {
      type: Boolean,
      default: true
    },
    geofenceAlerts: {
      type: Boolean,
      default: true
    },
    harshDrivingAlerts: {
      type: Boolean,
      default: true
    },
    faultCodeAlerts: {
      type: Boolean,
      default: true
    }
  },

  // Data retention
  dataRetention: {
    locationHistoryDays: {
      type: Number,
      default: 90
    },
    tripDataDays: {
      type: Number,
      default: 365
    },
    diagnosticDataDays: {
      type: Number,
      default: 180
    }
  },

  // Metadata
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
vehicleTelematicsSchema.index({ vehicle: 1 });
vehicleTelematicsSchema.index({ 'device.deviceId': 1 });
vehicleTelematicsSchema.index({ 'currentLocation.coordinates': '2dsphere' });
vehicleTelematicsSchema.index({ 'device.status': 1 });
vehicleTelematicsSchema.index({ 'currentLocation.timestamp': -1 });

// Methods
vehicleTelematicsSchema.methods.addFaultCode = function(code, description, severity = 'warning') {
  this.faultCodes.push({
    code,
    description,
    severity,
    isActive: true,
    mileageAtDetection: this.diagnostics.odometer?.value
  });
  return this.save();
};

vehicleTelematicsSchema.methods.clearFaultCode = function(code) {
  const fault = this.faultCodes.find(f => f.code === code && f.isActive);
  if (fault) {
    fault.isActive = false;
    fault.clearedAt = new Date();
  }
  return this.save();
};

vehicleTelematicsSchema.methods.recordDrivingEvent = function(eventType, location, severity = 'medium', value = null) {
  const event = {
    type: eventType,
    timestamp: new Date(),
    location,
    severity,
    value
  };

  // Update behavior counters
  if (eventType === 'harsh_accel') {
    this.driverBehavior.harshAcceleration.count++;
    this.driverBehavior.harshAcceleration.lastOccurrence = new Date();
  } else if (eventType === 'harsh_brake') {
    this.driverBehavior.harshBraking.count++;
    this.driverBehavior.harshBraking.lastOccurrence = new Date();
  } else if (eventType === 'harsh_corner') {
    this.driverBehavior.harshCornering.count++;
    this.driverBehavior.harshCornering.lastOccurrence = new Date();
  } else if (eventType === 'speeding') {
    this.driverBehavior.speeding.count++;
    this.driverBehavior.speeding.lastOccurrence = new Date();
    if (value && value > this.driverBehavior.speeding.maxSpeedRecorded) {
      this.driverBehavior.speeding.maxSpeedRecorded = value;
    }
  }

  // Recalculate driver score
  this.calculateDriverScore();

  return this.save();
};

vehicleTelematicsSchema.methods.calculateDriverScore = function() {
  let score = 100;

  // Deduct points for harsh events
  score -= this.driverBehavior.harshAcceleration.count * 0.5;
  score -= this.driverBehavior.harshBraking.count * 0.5;
  score -= this.driverBehavior.harshCornering.count * 0.5;
  score -= this.driverBehavior.speeding.count * 2;
  score -= this.driverBehavior.idling.excessiveIdleCount * 0.3;

  this.driverBehavior.driverScore = Math.max(0, Math.min(100, score));
  this.driverBehavior.lastScoreUpdate = new Date();
  
  return this.driverBehavior.driverScore;
};

vehicleTelematicsSchema.methods.updateLocation = function(locationData) {
  this.currentLocation = {
    ...this.currentLocation,
    ...locationData,
    timestamp: new Date()
  };

  // Add to location history
  this.locationHistory.push({
    coordinates: {
      lat: locationData.coordinates.coordinates[1],
      lng: locationData.coordinates.coordinates[0]
    },
    speed: locationData.speed,
    heading: locationData.heading,
    timestamp: new Date(),
    address: locationData.address
  });

  // Keep only last 24 hours of location history
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  this.locationHistory = this.locationHistory.filter(loc => loc.timestamp > dayAgo);

  return this.save();
};

vehicleTelematicsSchema.methods.isDeviceOnline = function() {
  if (!this.device.lastCommunication) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.device.lastCommunication > fiveMinutesAgo;
};

// Pre-save middleware
vehicleTelematicsSchema.pre('save', function(next) {
  // Calculate fuel efficiency rating
  if (this.fuelEfficiency.averageMPG && this.fuelEfficiency.baseline) {
    const efficiency = (this.fuelEfficiency.averageMPG / this.fuelEfficiency.baseline) * 100;
    
    if (efficiency >= 105) {
      this.fuelEfficiency.efficiencyRating = 'excellent';
    } else if (efficiency >= 95) {
      this.fuelEfficiency.efficiencyRating = 'good';
    } else if (efficiency >= 85) {
      this.fuelEfficiency.efficiencyRating = 'average';
    } else {
      this.fuelEfficiency.efficiencyRating = 'poor';
    }
  }

  next();
});

const VehicleTelematics = mongoose.model('VehicleTelematics', vehicleTelematicsSchema);

export default VehicleTelematics;
