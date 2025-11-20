import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['scheduler', 'dispatcher', 'driver', 'admin', 'rider'],
    required: true
  },
  roles: {
    type: [String],
    enum: ['scheduler', 'dispatcher', 'driver', 'admin', 'rider'],
    default: function() {
      return [this.role]; // Initialize with primary role for backward compatibility
    }
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Driver-specific fields
  licenseNumber: {
    type: String,
    trim: true
  },
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    color: String
  },
  // Enhanced location tracking
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON format
      index: '2dsphere'
    },
    accuracy: Number,
    heading: Number,
    speed: Number,
    timestamp: Date,
    lastSeen: Date
  },
  isLocationTracking: {
    type: Boolean,
    default: false
  },
  lastLocationUpdate: {
    type: Date
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  fcmToken: {
    type: String // For push notifications
  },
  // Rider-specific fields
  riderId: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  preferredVehicleType: {
    type: String,
    trim: true
  },
  serviceBalance: {
    type: {
      type: String,
      enum: ['trips', 'dollars'],
      default: 'trips'
    },
    tripCount: {
      type: Number,
      default: 0
    },
    dollarAmount: {
      type: Number,
      default: 0
    },
    originalTripCount: {
      type: Number,
      default: 0
    },
    originalDollarAmount: {
      type: Number,
      default: 0
    }
  },
  contractDetails: {
    isActive: Boolean,
    startDate: Date,
    endDate: Date,
    createdAt: Date
  },
  pricingDetails: {
    pricePerRide: {
      type: Number,
      default: 15.00
    },
    pricePerMile: {
      type: Number,
      default: 0.50
    }
  },
  mileageBalance: {
    currentBalance: {
      type: Number,
      default: 0
    },
    originalBalance: {
      type: Number,
      default: 0
    },
    totalUsed: {
      type: Number,
      default: 0
    }
  },
  trips: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.roles && this.roles.includes(role);
};

// Method to add a role
userSchema.methods.addRole = function(role) {
  if (!this.roles) {
    this.roles = [this.role];
  }
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
};

// Ensure roles array is populated before saving
userSchema.pre('save', function(next) {
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role];
  }
  next();
});

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);