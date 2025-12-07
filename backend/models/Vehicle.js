import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  // Basic vehicle information
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  vin: {
    type: String,
    trim: true,
    maxlength: 17
  },
  color: {
    type: String,
    trim: true
  },

  // Vehicle specifications
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'van', 'truck', 'bus', 'other'],
    default: 'sedan'
  },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'other'],
    default: 'gasoline'
  },
  isWheelchairAccessible: {
    type: Boolean,
    default: false
  },

  // Status and assignment
  status: {
    type: String,
    enum: ['active', 'idle', 'maintenance', 'out-of-service', 'retired'],
    default: 'active'
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },

  // Location tracking
  trackingPhone: {
    type: String,
    required: false,
    trim: true
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Maintenance and service
  mileage: {
    type: Number,
    default: 0,
    min: 0
  },
  lastServiceDate: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  nextServiceMileage: {
    type: Number
  },

  // Fuel tracking
  fuelLevel: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  fuelCapacity: {
    type: Number,
    min: 0
  },

  // Maintenance history
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['service', 'repair', 'inspection', 'other']
    },
    description: String,
    mileage: Number,
    cost: Number,
    performedBy: String,
    notes: String
  }],

  // Inspection checklist
  inspectionHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['pre-trip', 'post-trip', 'scheduled', 'random'],
      default: 'pre-trip'
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mileage: Number,
    checklistItems: [{
      category: String,
      item: String,
      status: {
        type: String,
        enum: ['pass', 'fail', 'warning', 'not-applicable'],
        default: 'pass'
      },
      notes: String
    }],
    overallStatus: {
      type: String,
      enum: ['passed', 'failed', 'needs-attention'],
      default: 'passed'
    },
    photos: [String],
    signature: String,
    notes: String
  }],

  // Expense tracking
  expenses: [{
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['fuel', 'maintenance', 'insurance', 'registration', 'tolls', 'parking', 'cleaning', 'other'],
      required: true
    },
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    vendor: String,
    receipt: String,
    mileage: Number,
    paymentMethod: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Fuel consumption tracking
  fuelLogs: [{
    date: {
      type: Date,
      default: Date.now
    },
    mileage: {
      type: Number,
      required: true
    },
    gallons: {
      type: Number,
      required: true
    },
    costPerGallon: Number,
    totalCost: Number,
    fuelType: String,
    location: String,
    fullTank: {
      type: Boolean,
      default: true
    },
    mpg: Number,
    receipt: String,
    notes: String
  }],

  // Tire maintenance
  tireHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['rotation', 'replacement', 'repair', 'inspection'],
      required: true
    },
    mileage: Number,
    position: {
      type: String,
      enum: ['front-left', 'front-right', 'rear-left', 'rear-right', 'all', 'spare']
    },
    treadDepth: Number,
    pressure: Number,
    brand: String,
    cost: Number,
    vendor: String,
    notes: String
  }],
  nextTireRotation: {
    date: Date,
    mileage: Number
  },

  // Insurance information
  insurance: {
    provider: String,
    policyNumber: String,
    startDate: Date,
    expirationDate: Date,
    premium: Number,
    coverage: {
      liability: Number,
      collision: Number,
      comprehensive: Number
    },
    documents: [String],
    claims: [{
      date: Date,
      claimNumber: String,
      type: String,
      status: String,
      amount: Number,
      description: String,
      documents: [String]
    }],
    notes: String
  },

  // Registration information
  registration: {
    registrationNumber: String,
    state: String,
    issueDate: Date,
    expirationDate: Date,
    renewalCost: Number,
    documents: [String],
    notes: String
  },

  // Depreciation tracking
  depreciation: {
    purchasePrice: Number,
    purchaseDate: Date,
    method: {
      type: String,
      enum: ['straight-line', 'declining-balance', 'sum-of-years', 'units-of-production'],
      default: 'straight-line'
    },
    usefulLife: {
      type: Number,
      default: 5
    },
    salvageValue: Number,
    currentValue: Number,
    lastCalculated: Date
  },

  // Incident/Accident reporting
  incidents: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['accident', 'damage', 'theft', 'vandalism', 'breakdown', 'other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'total-loss'],
      default: 'minor'
    },
    location: {
      address: String,
      lat: Number,
      lng: Number
    },
    driverInvolved: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    policeReportNumber: String,
    witnesses: [{
      name: String,
      phone: String,
      statement: String
    }],
    photos: [String],
    estimatedCost: Number,
    actualCost: Number,
    insuranceClaim: {
      claimNumber: String,
      status: String,
      amount: Number
    },
    resolved: {
      type: Boolean,
      default: false
    },
    notes: String
  }],

  // Fleet utilization metrics
  utilization: {
    totalMilesDriven: {
      type: Number,
      default: 0
    },
    totalHoursActive: {
      type: Number,
      default: 0
    },
    totalTrips: {
      type: Number,
      default: 0
    },
    averageTripsPerDay: Number,
    utilizationRate: Number,
    lastCalculated: Date
  },

  // Trip history (references to Trip model)
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],

  // Features and equipment
  features: [{
    type: String,
    trim: true
  }],

  // Notes and additional information
  notes: {
    type: String,
    trim: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes for better query performance
// Note: licensePlate already has unique:true which creates an index, no need for explicit index
vehicleSchema.index({ vin: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ currentDriver: 1 });
vehicleSchema.index({ make: 1, model: 1 });

// Virtual for full vehicle name
vehicleSchema.virtual('fullName').get(function() {
  return `${this.year} ${this.make} ${this.model}`;
});

// Virtual for service status
vehicleSchema.virtual('serviceStatus').get(function() {
  if (!this.nextServiceDate) return 'unknown';
  const now = new Date();
  const daysUntilService = Math.ceil((this.nextServiceDate - now) / (1000 * 60 * 60 * 24));
  if (daysUntilService < 0) return 'overdue';
  if (daysUntilService <= 7) return 'due-soon';
  return 'ok';
});

// Pre-save middleware to update the updatedAt field
vehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find available vehicles
vehicleSchema.statics.findAvailable = function() {
  return this.find({
    status: { $in: ['active', 'idle'] },
    isActive: true
  });
};

// Instance method to assign driver
vehicleSchema.methods.assignDriver = function(driverId) {
  console.log('=== Vehicle.assignDriver called ===');
  console.log('Vehicle ID:', this._id);
  console.log('Vehicle:', this.make, this.model, this.licensePlate);
  console.log('Assigning driver ID:', driverId);
  console.log('Previous driver:', this.currentDriver);
  
  this.currentDriver = driverId;
  this.assignedDate = new Date();
  
  console.log('New driver assigned:', this.currentDriver);
  console.log('Assignment date:', this.assignedDate);
  
  return this.save().then(saved => {
    console.log('Vehicle saved successfully with driver:', saved.currentDriver);
    return saved;
  }).catch(err => {
    console.error('Error saving vehicle:', err);
    throw err;
  });
};

// Instance method to unassign driver
vehicleSchema.methods.unassignDriver = function() {
  this.currentDriver = null;
  this.assignedDate = null;
  return this.save();
};

// Instance method to update location
vehicleSchema.methods.updateLocation = function(lat, lng, address) {
  this.currentLocation = {
    lat,
    lng,
    address,
    lastUpdated: new Date()
  };
  return this.save();
};

// Calculate depreciation value
vehicleSchema.methods.calculateDepreciation = function() {
  if (!this.depreciation.purchasePrice || !this.depreciation.purchaseDate) {
    return this.depreciation.purchasePrice || 0;
  }

  const purchasePrice = this.depreciation.purchasePrice;
  const salvageValue = this.depreciation.salvageValue || 0;
  const usefulLife = this.depreciation.usefulLife || 5;
  const yearsOwned = (new Date() - new Date(this.depreciation.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);

  let currentValue = purchasePrice;

  switch (this.depreciation.method) {
    case 'straight-line':
      const annualDepreciation = (purchasePrice - salvageValue) / usefulLife;
      currentValue = Math.max(purchasePrice - (annualDepreciation * yearsOwned), salvageValue);
      break;

    case 'declining-balance':
      const depreciationRate = 2 / usefulLife;
      currentValue = purchasePrice * Math.pow(1 - depreciationRate, yearsOwned);
      currentValue = Math.max(currentValue, salvageValue);
      break;

    case 'sum-of-years':
      const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
      const currentYear = Math.min(Math.floor(yearsOwned) + 1, usefulLife);
      const remainingYears = usefulLife - currentYear + 1;
      const depreciationFactor = remainingYears / sumOfYears;
      currentValue = salvageValue + ((purchasePrice - salvageValue) * depreciationFactor);
      break;

    case 'units-of-production':
      // Simplified: use mileage as units
      const estimatedTotalMiles = 200000; // Can be made configurable
      const depreciationPerMile = (purchasePrice - salvageValue) / estimatedTotalMiles;
      currentValue = Math.max(purchasePrice - (this.mileage * depreciationPerMile), salvageValue);
      break;

    default:
      currentValue = purchasePrice;
  }

  this.depreciation.currentValue = Math.round(currentValue * 100) / 100;
  this.depreciation.lastCalculated = new Date();
  return currentValue;
};

// Calculate average MPG from fuel logs
vehicleSchema.methods.calculateAverageMPG = function() {
  if (!this.fuelLogs || this.fuelLogs.length < 2) {
    return null;
  }

  const fullTankLogs = this.fuelLogs.filter(log => log.fullTank).sort((a, b) => a.mileage - b.mileage);
  
  if (fullTankLogs.length < 2) {
    return null;
  }

  let totalMPG = 0;
  let count = 0;

  for (let i = 1; i < fullTankLogs.length; i++) {
    const milesDriven = fullTankLogs[i].mileage - fullTankLogs[i - 1].mileage;
    const gallonsUsed = fullTankLogs[i].gallons;
    
    if (milesDriven > 0 && gallonsUsed > 0) {
      const mpg = milesDriven / gallonsUsed;
      totalMPG += mpg;
      count++;
    }
  }

  return count > 0 ? Math.round((totalMPG / count) * 100) / 100 : null;
};

// Check for upcoming maintenance/expiration alerts
vehicleSchema.methods.getAlerts = function() {
  const alerts = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Insurance expiration
  if (this.insurance.expirationDate) {
    const expirationDate = new Date(this.insurance.expirationDate);
    if (expirationDate < now) {
      alerts.push({ type: 'insurance', severity: 'critical', message: 'Insurance has expired' });
    } else if (expirationDate < thirtyDaysFromNow) {
      alerts.push({ type: 'insurance', severity: 'warning', message: 'Insurance expires soon' });
    }
  }

  // Registration expiration
  if (this.registration.expirationDate) {
    const expirationDate = new Date(this.registration.expirationDate);
    if (expirationDate < now) {
      alerts.push({ type: 'registration', severity: 'critical', message: 'Registration has expired' });
    } else if (expirationDate < thirtyDaysFromNow) {
      alerts.push({ type: 'registration', severity: 'warning', message: 'Registration expires soon' });
    }
  }

  // Next service due
  if (this.nextServiceDate) {
    const serviceDate = new Date(this.nextServiceDate);
    if (serviceDate < now) {
      alerts.push({ type: 'maintenance', severity: 'critical', message: 'Maintenance is overdue' });
    } else if (serviceDate < thirtyDaysFromNow) {
      alerts.push({ type: 'maintenance', severity: 'warning', message: 'Maintenance due soon' });
    }
  }

  // Tire rotation
  if (this.nextTireRotation && this.nextTireRotation.mileage) {
    const mileageUntilRotation = this.nextTireRotation.mileage - this.mileage;
    if (mileageUntilRotation <= 0) {
      alerts.push({ type: 'tire', severity: 'warning', message: 'Tire rotation is due' });
    } else if (mileageUntilRotation <= 500) {
      alerts.push({ type: 'tire', severity: 'info', message: `Tire rotation due in ${mileageUntilRotation} miles` });
    }
  }

  // Unresolved incidents
  const unresolvedIncidents = this.incidents.filter(inc => !inc.resolved);
  if (unresolvedIncidents.length > 0) {
    alerts.push({ type: 'incident', severity: 'warning', message: `${unresolvedIncidents.length} unresolved incident(s)` });
  }

  return alerts;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;