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
  emailHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted email
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
  phoneHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted phone
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
  licenseNumberHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted license number
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
  // Phone Verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: {
    type: Date
  },
  phoneVerificationMethod: {
    type: String,
    enum: ['sms', 'whatsapp', 'call'],
    default: 'sms'
  },
  // OAuth Providers (Google, Microsoft, Apple)
  oauthProviders: [{
    provider: {
      type: String,
      enum: ['google', 'microsoft', 'apple'],
      required: true
    },
    providerId: {
      type: String,
      required: true
    },
    accessToken: {
      type: String,
      select: false // Don't return tokens by default
    },
    refreshToken: {
      type: String,
      select: false
    },
    profile: {
      email: String,
      displayName: String,
      firstName: String,
      lastName: String,
      photo: String
    },
    linkedAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  // Calendar integrations
  integrations: {
    googleCalendar: {
      enabled: { type: Boolean, default: false },
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      expiryDate: { type: Number },
      lastSync: { type: Date }
    },
    outlookCalendar: {
      enabled: { type: Boolean, default: false },
      accessToken: { type: String, select: false },
      refreshToken: { type: String, select: false },
      expiryDate: { type: Number },
      lastSync: { type: Date }
    }
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
  }],
  // Encryption metadata
  encryptionMetadata: {
    isEncrypted: {
      type: Boolean,
      default: false
    },
    encryptedAt: Date,
    keyVersion: Number,
    encryptedFields: [String] // Track which fields are encrypted
  }
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

// Encryption helper methods
userSchema.methods.encryptSensitiveFields = async function() {
  const EncryptionKey = mongoose.model('EncryptionKey');
  const { encrypt, hashForSearch } = await import('../utils/encryption.js');
  
  try {
    const activeKey = await EncryptionKey.getActiveKey();
    
    // Fields to encrypt
    const fieldsToEncrypt = [];
    
    // Deterministic encryption for searchable fields
    if (this.email && !this.encryptionMetadata?.isEncrypted) {
      const originalEmail = this.email;
      this.email = encrypt(originalEmail, activeKey, true); // deterministic
      this.emailHash = hashForSearch(originalEmail);
      fieldsToEncrypt.push('email');
    }
    
    if (this.phone && !this.encryptionMetadata?.isEncrypted) {
      const originalPhone = this.phone;
      this.phone = encrypt(originalPhone, activeKey, true); // deterministic
      this.phoneHash = hashForSearch(originalPhone);
      fieldsToEncrypt.push('phone');
    }
    
    if (this.licenseNumber && !this.encryptionMetadata?.isEncrypted) {
      const originalLicense = this.licenseNumber;
      this.licenseNumber = encrypt(originalLicense, activeKey, true); // deterministic
      this.licenseNumberHash = hashForSearch(originalLicense);
      fieldsToEncrypt.push('licenseNumber');
    }
    
    // Random encryption for non-searchable sensitive fields
    if (this.twoFactorSecret && !this.encryptionMetadata?.isEncrypted) {
      this.twoFactorSecret = encrypt(this.twoFactorSecret, activeKey, false);
      fieldsToEncrypt.push('twoFactorSecret');
    }
    
    // Update encryption metadata
    if (fieldsToEncrypt.length > 0) {
      this.encryptionMetadata = {
        isEncrypted: true,
        encryptedAt: new Date(),
        keyVersion: activeKey.version,
        encryptedFields: fieldsToEncrypt
      };
      
      await EncryptionKey.trackUsage(activeKey.version, 'encrypt');
    }
    
    return this;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

userSchema.methods.decryptSensitiveFields = async function() {
  if (!this.encryptionMetadata?.isEncrypted) {
    return this;
  }
  
  const EncryptionKey = mongoose.model('EncryptionKey');
  const { decrypt } = await import('../utils/encryption.js');
  
  try {
    const getKeyByVersion = async (version) => {
      return await EncryptionKey.getKeyByVersion(version);
    };
    
    // Decrypt fields
    if (this.email && this.encryptionMetadata.encryptedFields.includes('email')) {
      this.email = await decrypt(this.email, getKeyByVersion);
      await EncryptionKey.trackUsage(this.encryptionMetadata.keyVersion, 'decrypt');
    }
    
    if (this.phone && this.encryptionMetadata.encryptedFields.includes('phone')) {
      this.phone = await decrypt(this.phone, getKeyByVersion);
    }
    
    if (this.licenseNumber && this.encryptionMetadata.encryptedFields.includes('licenseNumber')) {
      this.licenseNumber = await decrypt(this.licenseNumber, getKeyByVersion);
    }
    
    if (this.twoFactorSecret && this.encryptionMetadata.encryptedFields.includes('twoFactorSecret')) {
      this.twoFactorSecret = await decrypt(this.twoFactorSecret, getKeyByVersion);
    }
    
    return this;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// Static method to find by encrypted field
userSchema.statics.findByEncryptedEmail = async function(email) {
  const { hashForSearch } = await import('../utils/encryption.js');
  const emailHash = hashForSearch(email);
  
  const user = await this.findOne({ emailHash }).select('+emailHash');
  if (user && user.encryptionMetadata?.isEncrypted) {
    await user.decryptSensitiveFields();
  }
  
  return user;
};

userSchema.statics.findByEncryptedPhone = async function(phone) {
  const { hashForSearch } = await import('../utils/encryption.js');
  const phoneHash = hashForSearch(phone);
  
  const user = await this.findOne({ phoneHash }).select('+phoneHash');
  if (user && user.encryptionMetadata?.isEncrypted) {
    await user.decryptSensitiveFields();
  }
  
  return user;
};

export default mongoose.model('User', userSchema);