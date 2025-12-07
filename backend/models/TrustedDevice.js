/**
 * TrustedDevice Model
 * Tracks and manages user's trusted devices
 */

import mongoose from 'mongoose';

const trustedDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Device Fingerprint
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  
  // Device Information
  deviceInfo: {
    browser: {
      name: String,
      version: String,
      major: String
    },
    os: {
      name: String,
      version: String
    },
    device: {
      type: String, // mobile, tablet, desktop, etc.
      vendor: String,
      model: String
    },
    platform: String,
    userAgent: String
  },
  
  // Device Name (user-friendly)
  deviceName: {
    type: String,
    default: function() {
      const device = this.deviceInfo?.device?.type || 'Device';
      const browser = this.deviceInfo?.browser?.name || '';
      const os = this.deviceInfo?.os?.name || '';
      return `${device} - ${browser} on ${os}`.trim();
    }
  },
  
  // Trust Level
  trustLevel: {
    type: String,
    enum: ['unknown', 'suspicious', 'recognized', 'trusted', 'verified'],
    default: 'recognized'
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms', 'authenticator', 'manual', 'biometric'],
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Location Information (last known)
  lastLocation: {
    ip: String,
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  
  // Usage Statistics
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  
  // Security Flags
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: Date,
  blockedReason: String,
  
  isSuspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReasons: [{
    reason: String,
    detectedAt: Date,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  
  // Remember Device
  rememberDevice: {
    type: Boolean,
    default: false
  },
  rememberUntil: {
    type: Date,
    default: null
  },
  
  // Device Changes
  fingerprintHistory: [{
    fingerprint: String,
    changedAt: Date,
    changes: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }]
  }],
  
  // Trust Score (0-100)
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  lastTrustScoreUpdate: Date,
  
  // Additional Metadata
  metadata: {
    screen: {
      width: Number,
      height: Number,
      colorDepth: Number
    },
    timezone: String,
    language: String,
    hardwareConcurrency: Number,
    deviceMemory: Number,
    touchSupport: Boolean
  },
  
  // Notes
  notes: String
}, {
  timestamps: true
});

// Indexes
trustedDeviceSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });
trustedDeviceSchema.index({ userId: 1, trustLevel: 1 });
trustedDeviceSchema.index({ userId: 1, isBlocked: 1 });
trustedDeviceSchema.index({ lastSeen: 1 });
trustedDeviceSchema.index({ trustScore: 1 });

// Instance Methods

/**
 * Update device's last seen time and increment login count
 */
trustedDeviceSchema.methods.recordSuccessfulLogin = async function(location = {}) {
  this.lastSeen = new Date();
  this.loginCount += 1;
  this.failedAttempts = 0; // Reset failed attempts on success
  
  if (location.ip) {
    this.lastLocation = {
      ...this.lastLocation,
      ...location
    };
  }
  
  // Improve trust level based on successful logins
  if (this.loginCount > 5 && this.trustLevel === 'recognized') {
    this.trustLevel = 'trusted';
  }
  
  return this.save();
};

/**
 * Record failed login attempt
 */
trustedDeviceSchema.methods.recordFailedAttempt = async function() {
  this.failedAttempts += 1;
  this.lastSeen = new Date();
  
  // Mark as suspicious if too many failures
  if (this.failedAttempts >= 3) {
    this.isSuspicious = true;
    this.suspiciousReasons.push({
      reason: `${this.failedAttempts} failed login attempts`,
      detectedAt: new Date(),
      severity: this.failedAttempts >= 5 ? 'high' : 'medium'
    });
  }
  
  // Auto-block after 10 failed attempts
  if (this.failedAttempts >= 10) {
    this.isBlocked = true;
    this.blockedAt = new Date();
    this.blockedReason = 'Too many failed login attempts';
  }
  
  return this.save();
};

/**
 * Verify the device
 */
trustedDeviceSchema.methods.verify = async function(method = 'manual') {
  this.isVerified = true;
  this.verificationMethod = method;
  this.verifiedAt = new Date();
  this.trustLevel = 'verified';
  this.trustScore = Math.min(this.trustScore + 20, 100);
  return this.save();
};

/**
 * Block the device
 */
trustedDeviceSchema.methods.block = async function(reason = 'Manual block') {
  this.isBlocked = true;
  this.blockedAt = new Date();
  this.blockedReason = reason;
  this.trustLevel = 'suspicious';
  this.trustScore = 0;
  return this.save();
};

/**
 * Unblock the device
 */
trustedDeviceSchema.methods.unblock = async function() {
  this.isBlocked = false;
  this.blockedAt = null;
  this.blockedReason = null;
  this.failedAttempts = 0;
  this.trustScore = 50; // Reset to neutral
  return this.save();
};

/**
 * Update device fingerprint and track changes
 */
trustedDeviceSchema.methods.updateFingerprint = async function(newFingerprint, changes = []) {
  // Store old fingerprint in history
  this.fingerprintHistory.push({
    fingerprint: this.fingerprint,
    changedAt: new Date(),
    changes
  });
  
  // Update to new fingerprint
  this.fingerprint = newFingerprint;
  this.lastSeen = new Date();
  
  // Mark as suspicious if significant changes
  if (changes.length > 3) {
    this.isSuspicious = true;
    this.suspiciousReasons.push({
      reason: `Significant device changes detected (${changes.length} changes)`,
      detectedAt: new Date(),
      severity: 'medium'
    });
    this.trustScore = Math.max(this.trustScore - 10, 0);
  }
  
  return this.save();
};

/**
 * Calculate and update trust score
 */
trustedDeviceSchema.methods.updateTrustScore = async function(deviceFingerprintUtils) {
  const score = deviceFingerprintUtils.calculateDeviceTrustScore(this, null);
  this.trustScore = score;
  this.lastTrustScoreUpdate = new Date();
  return this.save();
};

// Static Methods

/**
 * Find or create trusted device
 */
trustedDeviceSchema.statics.findOrCreateDevice = async function(userId, fingerprint, deviceInfo, metadata = {}) {
  let device = await this.findOne({ userId, fingerprint });
  
  if (!device) {
    device = new this({
      userId,
      fingerprint,
      deviceInfo,
      metadata,
      firstSeen: new Date(),
      lastSeen: new Date(),
      trustLevel: 'recognized',
      loginCount: 0
    });
    await device.save();
  }
  
  return device;
};

/**
 * Get user's trusted devices
 */
trustedDeviceSchema.statics.getUserDevices = async function(userId, options = {}) {
  const query = { userId };
  
  if (options.includeBlocked === false) {
    query.isBlocked = false;
  }
  
  if (options.trustLevel) {
    query.trustLevel = options.trustLevel;
  }
  
  return this.find(query)
    .sort({ lastSeen: -1 })
    .limit(options.limit || 50);
};

/**
 * Check if device is trusted
 */
trustedDeviceSchema.statics.isDeviceTrusted = async function(userId, fingerprint) {
  const device = await this.findOne({ userId, fingerprint });
  
  if (!device) return false;
  if (device.isBlocked) return false;
  if (device.trustLevel === 'suspicious') return false;
  
  // Check if remember period has expired
  if (device.rememberDevice && device.rememberUntil) {
    if (new Date() > device.rememberUntil) {
      device.rememberDevice = false;
      device.rememberUntil = null;
      await device.save();
      return false;
    }
  }
  
  return ['trusted', 'verified'].includes(device.trustLevel);
};

/**
 * Get statistics for user's devices
 */
trustedDeviceSchema.statics.getUserDeviceStats = async function(userId) {
  const devices = await this.find({ userId });
  
  return {
    total: devices.length,
    trusted: devices.filter(d => d.trustLevel === 'trusted' || d.trustLevel === 'verified').length,
    verified: devices.filter(d => d.isVerified).length,
    blocked: devices.filter(d => d.isBlocked).length,
    suspicious: devices.filter(d => d.isSuspicious).length,
    remembered: devices.filter(d => d.rememberDevice && d.rememberUntil > new Date()).length,
    averageTrustScore: devices.reduce((sum, d) => sum + d.trustScore, 0) / devices.length || 0
  };
};

/**
 * Clean up old devices (not seen in X days)
 */
trustedDeviceSchema.statics.cleanupOldDevices = async function(daysInactive = 90) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    lastSeen: { $lt: cutoffDate },
    trustLevel: { $in: ['unknown', 'recognized'] },
    isVerified: false
  });
  
  return result.deletedCount;
};

const TrustedDevice = mongoose.model('TrustedDevice', trustedDeviceSchema);

export default TrustedDevice;
