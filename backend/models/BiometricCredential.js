/**
 * Biometric Credential Model
 * Stores WebAuthn credentials for biometric authentication
 */

import mongoose from 'mongoose';

const biometricCredentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // WebAuthn Credential ID (base64url encoded)
  credentialId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Public Key (base64url encoded)
  publicKey: {
    type: String,
    required: true
  },
  
  // Counter (for replay attack prevention)
  counter: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Credential Type
  credentialType: {
    type: String,
    enum: ['public-key'],
    default: 'public-key'
  },
  
  // Authenticator Details
  authenticator: {
    // Authenticator GUID
    aaguid: String,
    
    // Authenticator type
    type: {
      type: String,
      enum: ['platform', 'cross-platform'],
      default: 'platform'
    },
    
    // Transports
    transports: [{
      type: String,
      enum: ['usb', 'nfc', 'ble', 'internal', 'hybrid']
    }],
    
    // Flags
    flags: {
      userPresent: Boolean,
      userVerified: Boolean,
      backupEligible: Boolean,
      backupState: Boolean
    }
  },
  
  // Device Information
  deviceInfo: {
    name: String,
    type: String, // platform, security-key, etc.
    browser: String,
    os: String,
    userAgent: String
  },
  
  // Friendly Name (user-provided)
  friendlyName: {
    type: String,
    default: function() {
      return `${this.authenticator?.type || 'Biometric'} - ${this.deviceInfo?.os || 'Device'}`;
    }
  },
  
  // Usage Statistics
  firstUsed: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: String,
  
  // Registration Details
  registeredAt: {
    type: Date,
    default: Date.now
  },
  registrationIP: String,
  registrationLocation: {
    country: String,
    region: String,
    city: String
  },
  
  // Associated Device (if linked to trusted device)
  trustedDeviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrustedDevice'
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
biometricCredentialSchema.index({ userId: 1, isActive: 1 });
biometricCredentialSchema.index({ userId: 1, isRevoked: 1 });
biometricCredentialSchema.index({ credentialId: 1 });

// Instance Methods

/**
 * Record successful use of credential
 */
biometricCredentialSchema.methods.recordUse = async function(newCounter) {
  this.lastUsed = new Date();
  this.usageCount += 1;
  if (newCounter !== undefined) {
    this.counter = newCounter;
  }
  return this.save();
};

/**
 * Revoke the credential
 */
biometricCredentialSchema.methods.revoke = async function(reason = 'Manual revocation') {
  this.isActive = false;
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

/**
 * Reactivate the credential
 */
biometricCredentialSchema.methods.reactivate = async function() {
  this.isActive = true;
  this.isRevoked = false;
  this.revokedAt = null;
  this.revokedReason = null;
  return this.save();
};

/**
 * Update friendly name
 */
biometricCredentialSchema.methods.updateName = async function(newName) {
  this.friendlyName = newName;
  return this.save();
};

// Static Methods

/**
 * Find user's active credentials
 */
biometricCredentialSchema.statics.getUserCredentials = async function(userId, includeInactive = false) {
  const query = { userId };
  if (!includeInactive) {
    query.isActive = true;
    query.isRevoked = false;
  }
  
  return this.find(query)
    .sort({ lastUsed: -1 });
};

/**
 * Find credential by credential ID
 */
biometricCredentialSchema.statics.findByCredentialId = async function(credentialId) {
  return this.findOne({ credentialId, isActive: true, isRevoked: false });
};

/**
 * Get user's biometric statistics
 */
biometricCredentialSchema.statics.getUserStats = async function(userId) {
  const credentials = await this.find({ userId });
  
  return {
    total: credentials.length,
    active: credentials.filter(c => c.isActive && !c.isRevoked).length,
    revoked: credentials.filter(c => c.isRevoked).length,
    platform: credentials.filter(c => c.authenticator?.type === 'platform').length,
    crossPlatform: credentials.filter(c => c.authenticator?.type === 'cross-platform').length,
    totalUsage: credentials.reduce((sum, c) => sum + c.usageCount, 0)
  };
};

/**
 * Get global biometric statistics
 */
biometricCredentialSchema.statics.getGlobalStats = async function() {
  const [total, active, users, byType] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true, isRevoked: false }),
    this.distinct('userId'),
    this.aggregate([
      {
        $group: {
          _id: '$authenticator.type',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    total,
    active,
    uniqueUsers: users.length,
    byType: byType.map(t => ({ type: t._id || 'unknown', count: t.count }))
  };
};

/**
 * Clean up old revoked credentials
 */
biometricCredentialSchema.statics.cleanupRevoked = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    isRevoked: true,
    revokedAt: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

const BiometricCredential = mongoose.model('BiometricCredential', biometricCredentialSchema);

export default BiometricCredential;
