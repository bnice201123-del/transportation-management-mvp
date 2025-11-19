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
    required: true,
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
vehicleSchema.index({ licensePlate: 1 });
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
  this.currentDriver = driverId;
  this.assignedDate = new Date();
  return this.save();
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

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;