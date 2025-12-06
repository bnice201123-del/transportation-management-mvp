import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  riderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  phoneHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted phone
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  emailHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted email
  },
  address: {
    type: String,
    trim: true
  },
  preferredVehicleType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  // Service Balance
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
  // Contract Management
  contractDetails: {
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    createdAt: Date
  },
  // Pricing & Mileage
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
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addressHash: {
    type: String,
    index: true,
    select: false // For searchable encrypted address
  },
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

// Index for searching
riderSchema.index({ firstName: 1, lastName: 1 });
riderSchema.index({ riderId: 1 });
riderSchema.index({ phone: 1 });

// Encryption helper methods
riderSchema.methods.encryptSensitiveFields = async function() {
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
    
    if (this.address && !this.encryptionMetadata?.isEncrypted) {
      const originalAddress = this.address;
      this.address = encrypt(originalAddress, activeKey, true); // deterministic
      this.addressHash = hashForSearch(originalAddress);
      fieldsToEncrypt.push('address');
    }
    
    // Random encryption for non-searchable sensitive fields
    if (this.dateOfBirth && !this.encryptionMetadata?.isEncrypted) {
      this.dateOfBirth = encrypt(this.dateOfBirth.toISOString(), activeKey, false);
      fieldsToEncrypt.push('dateOfBirth');
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

riderSchema.methods.decryptSensitiveFields = async function() {
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
    
    if (this.address && this.encryptionMetadata.encryptedFields.includes('address')) {
      this.address = await decrypt(this.address, getKeyByVersion);
    }
    
    if (this.dateOfBirth && this.encryptionMetadata.encryptedFields.includes('dateOfBirth')) {
      const decrypted = await decrypt(this.dateOfBirth, getKeyByVersion);
      this.dateOfBirth = new Date(decrypted);
    }
    
    return this;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// Static methods to find by encrypted fields
riderSchema.statics.findByEncryptedEmail = async function(email) {
  const { hashForSearch } = await import('../utils/encryption.js');
  const emailHash = hashForSearch(email);
  
  const rider = await this.findOne({ emailHash }).select('+emailHash');
  if (rider && rider.encryptionMetadata?.isEncrypted) {
    await rider.decryptSensitiveFields();
  }
  
  return rider;
};

riderSchema.statics.findByEncryptedPhone = async function(phone) {
  const { hashForSearch } = await import('../utils/encryption.js');
  const phoneHash = hashForSearch(phone);
  
  const rider = await this.findOne({ phoneHash }).select('+phoneHash');
  if (rider && rider.encryptionMetadata?.isEncrypted) {
    await rider.decryptSensitiveFields();
  }
  
  return rider;
};

const Rider = mongoose.model('Rider', riderSchema);

export default Rider;
