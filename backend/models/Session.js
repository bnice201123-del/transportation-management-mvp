import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
    isMobile: Boolean,
    isDesktop: Boolean,
    isTablet: Boolean
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  loginMethod: {
    type: String,
    enum: ['password', 'two-factor', 'refresh-token', 'admin-impersonate'],
    default: 'password'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
    // Removed index: true to avoid duplicate - indexed in compound and TTL indexes below
  },
  revokedAt: {
    type: Date,
    index: true
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokeReason: {
    type: String,
    enum: ['user-logout', 'admin-revoke', 'security-breach', 'password-change', 'token-expired', 'suspicious-activity', 'forced-logout'],
    default: 'user-logout'
  },
  loginCount: {
    type: Number,
    default: 1
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  suspiciousReasons: [{
    type: String,
    enum: ['multiple-ips', 'impossible-travel', 'unusual-activity', 'failed-2fa', 'rate-limit-violation']
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, lastActivity: -1 });
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ isActive: 1, expiresAt: 1 });
sessionSchema.index({ isSuspicious: 1, isActive: 1 });

// TTL index: automatically delete expired sessions after 30 days
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for time until expiration
sessionSchema.virtual('timeUntilExpiry').get(function() {
  return this.expiresAt.getTime() - Date.now();
});

// Virtual for session status
sessionSchema.virtual('status').get(function() {
  if (this.revokedAt) return 'revoked';
  if (this.expiresAt < new Date()) return 'expired';
  if (!this.isActive) return 'inactive';
  return 'active';
});

/**
 * Create a new session
 */
sessionSchema.statics.createSession = async function(data) {
  const {
    userId,
    token,
    tokenHash,
    ipAddress,
    userAgent,
    deviceInfo,
    location,
    loginMethod = 'password',
    expiresIn = 24 * 60 * 60 * 1000 // 24 hours default
  } = data;

  const expiresAt = new Date(Date.now() + expiresIn);

  const session = await this.create({
    userId,
    token,
    tokenHash,
    ipAddress,
    userAgent,
    deviceInfo,
    location,
    loginMethod,
    expiresAt,
    lastActivity: new Date()
  });

  return session;
};

/**
 * Get active sessions for a user
 */
sessionSchema.statics.getActiveSessions = async function(userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .sort({ lastActivity: -1 })
  .populate('userId', 'firstName lastName email username role');
};

/**
 * Get all sessions for a user (including expired/revoked)
 */
sessionSchema.statics.getUserSessions = async function(userId, options = {}) {
  const { limit = 50, includeRevoked = false } = options;

  const query = { userId };
  if (!includeRevoked) {
    query.revokedAt = { $exists: false };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName email username role')
    .populate('revokedBy', 'firstName lastName username');
};

/**
 * Update session activity
 */
sessionSchema.statics.updateActivity = async function(tokenHash) {
  return this.findOneAndUpdate(
    { tokenHash, isActive: true },
    { 
      lastActivity: new Date(),
      $inc: { loginCount: 1 }
    },
    { new: true }
  );
};

/**
 * Revoke a session
 */
sessionSchema.statics.revokeSession = async function(sessionId, revokedBy = null, reason = 'user-logout') {
  return this.findByIdAndUpdate(
    sessionId,
    {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason
    },
    { new: true }
  );
};

/**
 * Revoke all sessions for a user except current
 */
sessionSchema.statics.revokeAllExceptCurrent = async function(userId, currentSessionId, revokedBy = null, reason = 'user-logout') {
  return this.updateMany(
    {
      userId,
      _id: { $ne: currentSessionId },
      isActive: true
    },
    {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason
    }
  );
};

/**
 * Revoke all sessions for a user
 */
sessionSchema.statics.revokeAllUserSessions = async function(userId, revokedBy = null, reason = 'forced-logout') {
  return this.updateMany(
    {
      userId,
      isActive: true
    },
    {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason
    }
  );
};

/**
 * Mark session as suspicious
 */
sessionSchema.statics.markSuspicious = async function(sessionId, reasons = []) {
  return this.findByIdAndUpdate(
    sessionId,
    {
      isSuspicious: true,
      $addToSet: { suspiciousReasons: { $each: reasons } }
    },
    { new: true }
  );
};

/**
 * Get session statistics
 */
sessionSchema.statics.getStatistics = async function(filters = {}) {
  const { startDate, endDate, userId } = filters;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [
          { $match: { isActive: true, expiresAt: { $gt: new Date() } } },
          { $count: 'count' }
        ],
        revoked: [
          { $match: { revokedAt: { $exists: true } } },
          { $count: 'count' }
        ],
        expired: [
          { $match: { expiresAt: { $lte: new Date() }, revokedAt: { $exists: false } } },
          { $count: 'count' }
        ],
        suspicious: [
          { $match: { isSuspicious: true } },
          { $count: 'count' }
        ],
        byLoginMethod: [
          { $group: { _id: '$loginMethod', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byDevice: [
          { $group: { _id: '$deviceInfo.device', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        topUsers: [
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { _id: 1, count: 1, username: '$user.username', name: { $concat: ['$user.firstName', ' ', '$user.lastName'] } } }
        ],
        timeline: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 30 }
        ]
      }
    }
  ]);

  return {
    total: stats[0]?.total[0]?.count || 0,
    active: stats[0]?.active[0]?.count || 0,
    revoked: stats[0]?.revoked[0]?.count || 0,
    expired: stats[0]?.expired[0]?.count || 0,
    suspicious: stats[0]?.suspicious[0]?.count || 0,
    byLoginMethod: stats[0]?.byLoginMethod || [],
    byDevice: stats[0]?.byDevice || [],
    topUsers: stats[0]?.topUsers || [],
    timeline: stats[0]?.timeline || []
  };
};

/**
 * Get suspicious sessions
 */
sessionSchema.statics.getSuspiciousSessions = async function(options = {}) {
  const { limit = 50, minReasons = 1 } = options;

  return this.find({
    isSuspicious: true,
    isActive: true,
    suspiciousReasons: { $exists: true, $not: { $size: 0 } }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'firstName lastName email username role');
};

/**
 * Cleanup expired sessions
 */
sessionSchema.statics.cleanup = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: cutoffDate } },
      { revokedAt: { $lt: cutoffDate } }
    ]
  });

  return result.deletedCount;
};

/**
 * Detect anomalies for a user
 */
sessionSchema.statics.detectAnomalies = async function(userId) {
  const sessions = await this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  const anomalies = [];

  // Check for multiple different IPs
  const uniqueIPs = new Set(sessions.map(s => s.ipAddress));
  if (uniqueIPs.size > 3) {
    anomalies.push({
      type: 'multiple-ips',
      description: `${uniqueIPs.size} different IP addresses detected`,
      sessions: sessions.filter(s => s.ipAddress).map(s => ({ id: s._id, ip: s.ipAddress }))
    });
  }

  // Check for impossible travel (sessions from different locations within short time)
  for (let i = 0; i < sessions.length - 1; i++) {
    const session1 = sessions[i];
    const session2 = sessions[i + 1];
    
    if (session1.location?.country && session2.location?.country && 
        session1.location.country !== session2.location.country) {
      const timeDiff = Math.abs(session1.createdAt - session2.createdAt) / (1000 * 60 * 60); // hours
      
      if (timeDiff < 2) { // Less than 2 hours between different countries
        anomalies.push({
          type: 'impossible-travel',
          description: `Session from ${session1.location.country} to ${session2.location.country} within ${timeDiff.toFixed(1)} hours`,
          sessions: [{ id: session1._id, location: session1.location }, { id: session2._id, location: session2.location }]
        });
      }
    }
  }

  // Check for unusual number of concurrent sessions
  if (sessions.length > 5) {
    anomalies.push({
      type: 'multiple-concurrent-sessions',
      description: `${sessions.length} concurrent active sessions`,
      count: sessions.length
    });
  }

  return anomalies;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
