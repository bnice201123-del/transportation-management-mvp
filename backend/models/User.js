import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false, // Temporarily optional for migration - should be true after migration
    unique: true,
    sparse: true, // Allow null values to be non-unique during migration
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: false, // Email is now optional
    unique: true,
    sparse: true, // Allow null values to be non-unique
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
  // Security Questions for Password Recovery
  securityQuestions: [{
    question: {
      type: String,
      required: false
    },
    answer: {
      type: String,
      required: false
    }
  }],
  // Password Reset Token (for admin-initiated resets)
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
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
  profileImage: {
    type: String, // Store base64 image data or URL
    default: null
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
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't return this field by default
  },
  twoFactorBackupCodes: [{
    code: {
      type: String,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    }
  }],
  twoFactorEnabledAt: {
    type: Date
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

// Hash security question answers before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityQuestions')) return next();
  
  try {
    if (this.securityQuestions && this.securityQuestions.length > 0) {
      for (let sq of this.securityQuestions) {
        if (sq.answer && !sq.answer.startsWith('$2a$')) { // Check if not already hashed
          const salt = await bcrypt.genSalt(12);
          sq.answer = await bcrypt.hash(sq.answer.toLowerCase().trim(), salt);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to verify security question answer
userSchema.methods.verifySecurityAnswer = async function(questionIndex, candidateAnswer) {
  if (!this.securityQuestions || !this.securityQuestions[questionIndex]) {
    return false;
  }
  const normalizedAnswer = candidateAnswer.toLowerCase().trim();
  return bcrypt.compare(normalizedAnswer, this.securityQuestions[questionIndex].answer);
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