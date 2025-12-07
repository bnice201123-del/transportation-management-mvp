/**
 * LoginAttempt Model
 * Tracks all login attempts for security monitoring and analytics
 */

import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null // null for failed attempts where user doesn't exist
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  
  // Attempt Status
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  failureReason: {
    type: String,
    enum: [
      'invalid_credentials',
      'account_locked',
      'account_disabled',
      '2fa_required',
      '2fa_failed',
      'biometric_failed',
      'device_not_trusted',
      'geo_restriction',
      'rate_limited',
      'suspicious_activity',
      'other'
    ],
    default: null
  },
  
  // Device Information
  deviceFingerprint: {
    type: String,
    index: true
  },
  deviceInfo: {
    browser: {
      name: String,
      version: String
    },
    os: {
      name: String,
      version: String
    },
    device: {
      type: String, // mobile, tablet, desktop
      vendor: String,
      model: String
    },
    userAgent: String
  },
  
  // Location Information
  location: {
    ip: {
      type: String,
      required: true,
      index: true
    },
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    isp: String
  },
  
  // Authentication Method
  authMethod: {
    type: String,
    enum: ['password', '2fa', 'sms_code', 'oauth', 'biometric', 'trusted_device'],
    default: 'password'
  },
  
  // Security Flags
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  suspiciousReasons: [{
    reason: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  
  // Risk Assessment
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  riskFactors: [{
    factor: String,
    score: Number,
    description: String
  }],
  
  // Session Information
  sessionId: String,
  tokenIssued: {
    type: Boolean,
    default: false
  },
  
  // Request Information
  requestHeaders: {
    userAgent: String,
    acceptLanguage: String,
    referer: String
  },
  
  // Timing
  attemptDuration: {
    type: Number, // milliseconds
    default: null
  },
  
  // Pattern Detection
  isPartOfPattern: {
    type: Boolean,
    default: false
  },
  patternType: {
    type: String,
    enum: ['brute_force', 'credential_stuffing', 'account_takeover', 'distributed_attack'],
    default: null
  },
  
  // Admin Actions
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
loginAttemptSchema.index({ email: 1, createdAt: -1 });
loginAttemptSchema.index({ userId: 1, createdAt: -1 });
loginAttemptSchema.index({ 'location.ip': 1, createdAt: -1 });
loginAttemptSchema.index({ deviceFingerprint: 1, createdAt: -1 });
loginAttemptSchema.index({ success: 1, isSuspicious: 1 });
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Instance Methods

/**
 * Mark attempt as suspicious
 */
loginAttemptSchema.methods.markSuspicious = async function(reasons = []) {
  this.isSuspicious = true;
  this.suspiciousReasons = reasons.map(r => ({
    reason: r.reason,
    severity: r.severity || 'medium'
  }));
  return this.save();
};

/**
 * Mark attempt as reviewed
 */
loginAttemptSchema.methods.markReviewed = async function(reviewerId, notes = '') {
  this.reviewed = true;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

/**
 * Calculate and update risk score
 */
loginAttemptSchema.methods.calculateRiskScore = function() {
  let score = 0;
  const factors = [];

  // Failed attempt
  if (!this.success) {
    score += 20;
    factors.push({
      factor: 'failed_attempt',
      score: 20,
      description: 'Login attempt failed'
    });
  }

  // Suspicious flags
  if (this.isSuspicious) {
    score += 30;
    factors.push({
      factor: 'marked_suspicious',
      score: 30,
      description: 'Attempt flagged as suspicious'
    });
  }

  // Device not recognized
  if (!this.deviceFingerprint) {
    score += 10;
    factors.push({
      factor: 'unknown_device',
      score: 10,
      description: 'Device fingerprint not recognized'
    });
  }

  // High risk failure reasons
  const highRiskReasons = ['suspicious_activity', 'geo_restriction', 'device_not_trusted'];
  if (highRiskReasons.includes(this.failureReason)) {
    score += 25;
    factors.push({
      factor: 'high_risk_failure',
      score: 25,
      description: `Failure reason: ${this.failureReason}`
    });
  }

  // Part of attack pattern
  if (this.isPartOfPattern) {
    score += 30;
    factors.push({
      factor: 'attack_pattern',
      score: 30,
      description: `Part of ${this.patternType} pattern`
    });
  }

  this.riskScore = Math.min(score, 100);
  this.riskFactors = factors;
  
  return this.riskScore;
};

// Static Methods

/**
 * Record a login attempt
 */
loginAttemptSchema.statics.recordAttempt = async function(data) {
  const attempt = new this({
    userId: data.userId,
    email: data.email,
    success: data.success,
    failureReason: data.failureReason,
    deviceFingerprint: data.deviceFingerprint,
    deviceInfo: data.deviceInfo,
    location: data.location,
    authMethod: data.authMethod || 'password',
    sessionId: data.sessionId,
    tokenIssued: data.tokenIssued || false,
    requestHeaders: data.requestHeaders,
    attemptDuration: data.attemptDuration,
    metadata: data.metadata
  });

  // Calculate risk score
  attempt.calculateRiskScore();

  await attempt.save();
  return attempt;
};

/**
 * Get recent attempts for a user
 */
loginAttemptSchema.statics.getUserAttempts = async function(userId, options = {}) {
  const limit = options.limit || 50;
  const query = { userId };
  
  if (options.success !== undefined) {
    query.success = options.success;
  }
  
  if (options.suspicious) {
    query.isSuspicious = true;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get recent attempts by email
 */
loginAttemptSchema.statics.getAttemptsByEmail = async function(email, options = {}) {
  const limit = options.limit || 50;
  const timeWindow = options.timeWindow || 24 * 60 * 60 * 1000; // 24 hours default
  
  const query = {
    email: email.toLowerCase(),
    createdAt: { $gte: new Date(Date.now() - timeWindow) }
  };
  
  if (options.success !== undefined) {
    query.success = options.success;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get recent attempts by IP
 */
loginAttemptSchema.statics.getAttemptsByIP = async function(ip, options = {}) {
  const limit = options.limit || 50;
  const timeWindow = options.timeWindow || 24 * 60 * 60 * 1000; // 24 hours default
  
  const query = {
    'location.ip': ip,
    createdAt: { $gte: new Date(Date.now() - timeWindow) }
  };

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Detect brute force pattern
 */
loginAttemptSchema.statics.detectBruteForce = async function(email, timeWindow = 15 * 60 * 1000) {
  const attempts = await this.find({
    email: email.toLowerCase(),
    success: false,
    createdAt: { $gte: new Date(Date.now() - timeWindow) }
  });

  const threshold = 5; // 5 failed attempts in time window
  
  return {
    isBruteForce: attempts.length >= threshold,
    attemptCount: attempts.length,
    timeWindow: timeWindow / 1000 / 60, // convert to minutes
    threshold
  };
};

/**
 * Detect credential stuffing (multiple accounts from same IP/device)
 */
loginAttemptSchema.statics.detectCredentialStuffing = async function(ip, deviceFingerprint, timeWindow = 60 * 60 * 1000) {
  const query = {
    $or: [
      { 'location.ip': ip },
      { deviceFingerprint }
    ],
    success: false,
    createdAt: { $gte: new Date(Date.now() - timeWindow) }
  };

  const attempts = await this.find(query);
  const uniqueEmails = new Set(attempts.map(a => a.email));

  const threshold = 10; // 10 different accounts attempted
  
  return {
    isCredentialStuffing: uniqueEmails.size >= threshold,
    uniqueAccounts: uniqueEmails.size,
    totalAttempts: attempts.length,
    threshold
  };
};

/**
 * Get login attempt statistics
 */
loginAttemptSchema.statics.getStatistics = async function(options = {}) {
  const timeWindow = options.timeWindow || 24 * 60 * 60 * 1000; // 24 hours
  const startDate = new Date(Date.now() - timeWindow);

  const [total, successful, failed, suspicious, patterns] = await Promise.all([
    this.countDocuments({ createdAt: { $gte: startDate } }),
    this.countDocuments({ createdAt: { $gte: startDate }, success: true }),
    this.countDocuments({ createdAt: { $gte: startDate }, success: false }),
    this.countDocuments({ createdAt: { $gte: startDate }, isSuspicious: true }),
    this.countDocuments({ createdAt: { $gte: startDate }, isPartOfPattern: true })
  ]);

  // Get top failure reasons
  const failureReasons = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        success: false,
        failureReason: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$failureReason',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get top IPs with failed attempts
  const topFailedIPs = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        success: false
      }
    },
    {
      $group: {
        _id: '$location.ip',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  return {
    total,
    successful,
    failed,
    suspicious,
    patterns,
    successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
    failureReasons: failureReasons.map(r => ({ reason: r._id, count: r.count })),
    topFailedIPs: topFailedIPs.map(ip => ({ ip: ip._id, attempts: ip.count }))
  };
};

/**
 * Get hourly attempt trends
 */
loginAttemptSchema.statics.getHourlyTrends = async function(hours = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const trends = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$createdAt' },
          success: '$success'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.hour': 1 }
    }
  ]);

  return trends;
};

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

export default LoginAttempt;
