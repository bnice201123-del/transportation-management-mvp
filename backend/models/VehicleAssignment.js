import mongoose from 'mongoose';

const vehicleAssignmentSchema = new mongoose.Schema({
  // Assignment identification
  assignmentId: {
    type: String,
    unique: true,
    required: true
  },

  // Core assignment
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    index: true
  },

  // Assignment type
  assignmentType: {
    type: String,
    enum: ['permanent', 'temporary', 'trip_based', 'pool', 'standby'],
    required: true,
    default: 'trip_based'
  },

  // Date and time
  assignedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  estimatedDuration: Number, // minutes
  actualDuration: Number, // minutes

  // Assignment status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },

  // Optimization scores (how well this assignment matches requirements)
  matchScores: {
    overall: {
      type: Number,
      min: 0,
      max: 100
    },
    driverPreference: Number, // Driver's preference for this vehicle
    vehicleUtilization: Number, // How well this uses vehicle capacity
    proximityScore: Number, // How close vehicle is to pickup
    availabilityScore: Number, // Vehicle availability match
    maintenanceScore: Number, // Vehicle maintenance status
    fuelEfficiency: Number, // Route fuel efficiency with this vehicle
    equipmentMatch: Number, // Required vs available equipment
    costEfficiency: Number // Cost per mile/hour optimization
  },

  // Assignment rationale
  assignmentReason: {
    type: String,
    enum: [
      'optimal_match',
      'closest_available',
      'manual_override',
      'driver_request',
      'emergency',
      'cost_optimization',
      'utilization_balancing',
      'maintenance_rotation',
      'temporary_coverage'
    ]
  },
  assignmentNotes: String,

  // Requirements and constraints
  requirements: {
    wheelchairAccessible: Boolean,
    passengerCapacity: Number,
    cargoSpace: Boolean,
    specialEquipment: [String],
    fuelType: String,
    minYear: Number,
    features: [String]
  },

  // Location tracking
  locations: {
    assignmentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number], // [longitude, latitude]
      address: String
    },
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number],
      address: String
    },
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number],
      address: String
    }
  },

  // Utilization metrics
  utilization: {
    plannedMileage: Number,
    actualMileage: Number,
    plannedHours: Number,
    actualHours: Number,
    passengerCount: Number,
    capacityUtilization: Number, // Percentage
    idleTime: Number, // minutes
    productiveTime: Number // minutes
  },

  // Cost tracking
  costs: {
    estimatedFuelCost: Number,
    actualFuelCost: Number,
    maintenanceCost: Number,
    driverCost: Number,
    totalEstimatedCost: Number,
    totalActualCost: Number,
    costPerMile: Number,
    costPerHour: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Performance tracking
  performance: {
    onTimeStart: Boolean,
    onTimeEnd: Boolean,
    delayMinutes: Number,
    fuelEfficiencyMPG: Number,
    averageSpeed: Number,
    maxSpeed: Number,
    hardBraking: Number,
    rapidAcceleration: Number,
    idling: Number, // minutes
    driverRating: Number, // 1-5
    passengerRating: Number // 1-5
  },

  // Mileage tracking
  mileage: {
    startMileage: Number,
    endMileage: Number,
    totalMiles: Number,
    gpsVerified: {
      type: Boolean,
      default: false
    },
    gpsDistance: Number,
    odometerDistance: Number,
    discrepancy: Number, // Difference between GPS and odometer
    discrepancyPercentage: Number
  },

  // Fuel tracking
  fuel: {
    startFuelLevel: Number, // percentage
    endFuelLevel: Number, // percentage
    fuelConsumed: Number, // gallons
    fuelCost: Number,
    refueled: Boolean,
    refuelAmount: Number,
    refuelCost: Number,
    fuelEfficiency: Number // MPG
  },

  // Pre and post assignment checks
  checks: {
    preAssignment: {
      completed: Boolean,
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      checklist: [{
        item: String,
        status: {
          type: String,
          enum: ['pass', 'fail', 'warning', 'not_applicable']
        },
        notes: String,
        photo: String
      }],
      overallStatus: {
        type: String,
        enum: ['pass', 'fail', 'conditional']
      },
      notes: String
    },
    postAssignment: {
      completed: Boolean,
      completedAt: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      checklist: [{
        item: String,
        status: {
          type: String,
          enum: ['pass', 'fail', 'warning', 'not_applicable']
        },
        notes: String,
        photo: String
      }],
      overallStatus: {
        type: String,
        enum: ['pass', 'fail', 'conditional']
      },
      damageReported: Boolean,
      damageDescription: String,
      damagePhotos: [String],
      notes: String
    }
  },

  // Issues and incidents
  issues: [{
    type: {
      type: String,
      enum: ['mechanical', 'accident', 'delay', 'route_deviation', 'fuel', 'other']
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'critical']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolved: Boolean,
    resolvedAt: Date,
    resolution: String
  }],

  // Replacement assignments (if vehicle/driver changed mid-assignment)
  replacements: [{
    previousVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    previousDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    replacementVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    replacementDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    replacementDate: Date,
    reason: String,
    mileageAtReplacement: Number
  }],

  // Approval workflow
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionDate: Date,
    rejectionReason: String,
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },

  // Automated vs manual assignment
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationScore: Number, // Confidence score of automated assignment

  // Assignment history and changes
  changeHistory: [{
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeType: {
      type: String,
      enum: ['created', 'modified', 'driver_changed', 'vehicle_changed', 'cancelled', 'completed']
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String
  }],

  // Related assignments
  relatedAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleAssignment'
  }],

  // Metadata
  notes: String,
  tags: [String],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
vehicleAssignmentSchema.index({ vehicle: 1, status: 1 });
vehicleAssignmentSchema.index({ driver: 1, status: 1 });
vehicleAssignmentSchema.index({ trip: 1 });
vehicleAssignmentSchema.index({ startDate: 1, endDate: 1 });
vehicleAssignmentSchema.index({ assignmentType: 1, status: 1 });
vehicleAssignmentSchema.index({ 'matchScores.overall': -1 });

// Geospatial indexes
vehicleAssignmentSchema.index({ 'locations.assignmentLocation': '2dsphere' });
vehicleAssignmentSchema.index({ 'locations.startLocation': '2dsphere' });

// Pre-save middleware
vehicleAssignmentSchema.pre('save', function(next) {
  // Generate assignment ID
  if (!this.assignmentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.assignmentId = `ASGN-${timestamp}-${random}`;
  }

  // Calculate actual duration if both dates exist
  if (this.startDate && this.endDate && this.status === 'completed') {
    this.actualDuration = Math.round((this.endDate - this.startDate) / (1000 * 60));
  }

  // Calculate total miles from mileage
  if (this.mileage.startMileage && this.mileage.endMileage) {
    this.mileage.totalMiles = this.mileage.endMileage - this.mileage.startMileage;
    this.utilization.actualMileage = this.mileage.totalMiles;
  }

  // Calculate GPS vs odometer discrepancy
  if (this.mileage.gpsDistance && this.mileage.odometerDistance) {
    this.mileage.discrepancy = Math.abs(this.mileage.gpsDistance - this.mileage.odometerDistance);
    this.mileage.discrepancyPercentage = (this.mileage.discrepancy / this.mileage.odometerDistance) * 100;
    
    // GPS verified if discrepancy is under 5%
    this.mileage.gpsVerified = this.mileage.discrepancyPercentage <= 5;
  }

  // Calculate fuel efficiency
  if (this.mileage.totalMiles && this.fuel.fuelConsumed) {
    this.fuel.fuelEfficiency = this.mileage.totalMiles / this.fuel.fuelConsumed;
    this.performance.fuelEfficiencyMPG = this.fuel.fuelEfficiency;
  }

  // Calculate capacity utilization
  if (this.utilization.passengerCount && this.requirements.passengerCapacity) {
    this.utilization.capacityUtilization = (this.utilization.passengerCount / this.requirements.passengerCapacity) * 100;
  }

  // Calculate cost per mile/hour
  if (this.costs.totalActualCost) {
    if (this.utilization.actualMileage) {
      this.costs.costPerMile = this.costs.totalActualCost / this.utilization.actualMileage;
    }
    if (this.utilization.actualHours) {
      this.costs.costPerHour = this.costs.totalActualCost / this.utilization.actualHours;
    }
  }

  next();
});

// Methods
vehicleAssignmentSchema.methods.markCompleted = function(completionData) {
  this.status = 'completed';
  this.endDate = completionData.endDate || new Date();
  
  if (completionData.endMileage) {
    this.mileage.endMileage = completionData.endMileage;
  }
  if (completionData.endFuelLevel) {
    this.fuel.endFuelLevel = completionData.endFuelLevel;
  }
  if (completionData.actualCost) {
    this.costs.totalActualCost = completionData.actualCost;
  }

  this.performance.onTimeEnd = completionData.onTime !== false;

  return this.save();
};

vehicleAssignmentSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  
  this.changeHistory.push({
    changeType: 'cancelled',
    changedBy: cancelledBy,
    reason
  });

  return this.save();
};

vehicleAssignmentSchema.methods.reportIssue = function(issueData, reportedBy) {
  this.issues.push({
    ...issueData,
    reportedBy
  });

  return this.save();
};

vehicleAssignmentSchema.methods.replaceVehicle = function(newVehicle, reason, replacedBy, currentMileage) {
  this.replacements.push({
    previousVehicle: this.vehicle,
    replacementVehicle: newVehicle,
    replacementDate: new Date(),
    reason,
    mileageAtReplacement: currentMileage
  });

  this.vehicle = newVehicle;
  this.lastModifiedBy = replacedBy;

  this.changeHistory.push({
    changeType: 'vehicle_changed',
    changedBy: replacedBy,
    previousValue: this.vehicle,
    newValue: newVehicle,
    reason
  });

  return this.save();
};

vehicleAssignmentSchema.methods.calculateUtilization = function() {
  const metrics = {};

  if (this.actualDuration && this.utilization.productiveTime) {
    metrics.efficiencyRatio = (this.utilization.productiveTime / this.actualDuration) * 100;
  }

  if (this.utilization.actualMileage && this.utilization.plannedMileage) {
    metrics.mileageVariance = ((this.utilization.actualMileage - this.utilization.plannedMileage) / this.utilization.plannedMileage) * 100;
  }

  if (this.costs.totalActualCost && this.costs.totalEstimatedCost) {
    metrics.costVariance = ((this.costs.totalActualCost - this.costs.totalEstimatedCost) / this.costs.totalEstimatedCost) * 100;
  }

  return metrics;
};

const VehicleAssignment = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);

export default VehicleAssignment;
