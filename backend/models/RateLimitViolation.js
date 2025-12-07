import mongoose from 'mongoose';

const rateLimitViolationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true
  },
  limiterType: {
    type: String,
    required: true,
    enum: ['auth', 'api', 'read', 'expensive', 'gdpr', 'upload', 'passwordReset', 'twoFactor', 'admin', 'global', 'custom'],
    index: true
  },
  userAgent: String,
  headers: mongoose.Schema.Types.Mixed,
  
  // Rate limit info
  limit: Number,
  windowMs: Number,
  current: Number,
  
  // User context
  username: String,
  userRole: String,
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  
  // Severity assessment
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Pattern detection
  isRepeated: {
    type: Boolean,
    default: false
  },
  previousViolations: {
    type: Number,
    default: 0
  },
  
  // Response
  blocked: {
    type: Boolean,
    default: true
  },
  responseMessage: String,
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  violatedAt: {
    type: Date,
    default: Date.now
    // Removed index: true to avoid duplicate - indexed in compound indexes below
  }
}, {
  timestamps: true
});

// Compound indexes
rateLimitViolationSchema.index({ ipAddress: 1, violatedAt: -1 });
rateLimitViolationSchema.index({ userId: 1, violatedAt: -1 });
rateLimitViolationSchema.index({ limiterType: 1, violatedAt: -1 });
rateLimitViolationSchema.index({ violatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL

/**
 * Log a rate limit violation
 */
rateLimitViolationSchema.statics.logViolation = async function(data) {
  try {
    // Check for recent violations from same IP
    const recentViolations = await this.countDocuments({
      ipAddress: data.ipAddress,
      violatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    // Determine severity based on factors
    let severity = 'medium';
    if (recentViolations >= 10) {
      severity = 'critical';
    } else if (recentViolations >= 5) {
      severity = 'high';
    } else if (recentViolations >= 2) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    const violation = new this({
      ...data,
      isRepeated: recentViolations > 0,
      previousViolations: recentViolations,
      severity
    });

    await violation.save();
    return violation;
  } catch (error) {
    console.error('Error logging rate limit violation:', error);
    return null;
  }
};

/**
 * Get violations by IP
 */
rateLimitViolationSchema.statics.getByIP = async function(ipAddress, options = {}) {
  const limit = options.limit || 50;
  const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days default

  return this.find({
    ipAddress,
    violatedAt: { $gte: startDate }
  })
  .sort({ violatedAt: -1 })
  .limit(limit);
};

/**
 * Get violations by user
 */
rateLimitViolationSchema.statics.getByUser = async function(userId, options = {}) {
  const limit = options.limit || 50;
  const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return this.find({
    userId,
    violatedAt: { $gte: startDate }
  })
  .sort({ violatedAt: -1 })
  .limit(limit);
};

/**
 * Get statistics
 */
rateLimitViolationSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};

  if (filters.startDate || filters.endDate) {
    matchStage.violatedAt = {};
    if (filters.startDate) matchStage.violatedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.violatedAt.$lte = new Date(filters.endDate);
  }

  if (filters.limiterType) {
    matchStage.limiterType = filters.limiterType;
  }

  if (filters.severity) {
    matchStage.severity = filters.severity;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        total: [
          { $count: 'count' }
        ],
        byLimiter: [
          { $group: { _id: '$limiterType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        bySeverity: [
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byEndpoint: [
          { $group: { _id: '$endpoint', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        topIPs: [
          { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        timeline: [
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$violatedAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  return {
    total: stats[0].total[0]?.count || 0,
    byLimiter: stats[0].byLimiter,
    bySeverity: stats[0].bySeverity,
    byEndpoint: stats[0].byEndpoint,
    topIPs: stats[0].topIPs,
    timeline: stats[0].timeline
  };
};

/**
 * Check if IP should be blocked
 */
rateLimitViolationSchema.statics.shouldBlockIP = async function(ipAddress) {
  const recentViolations = await this.countDocuments({
    ipAddress,
    severity: { $in: ['high', 'critical'] },
    violatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  });

  // Block if more than 20 high/critical violations in the last hour
  return recentViolations >= 20;
};

/**
 * Get suspicious IPs
 */
rateLimitViolationSchema.statics.getSuspiciousIPs = async function(options = {}) {
  const minViolations = options.minViolations || 10;
  const timeWindow = options.timeWindow || 60 * 60 * 1000; // 1 hour default

  const suspiciousIPs = await this.aggregate([
    {
      $match: {
        violatedAt: { $gte: new Date(Date.now() - timeWindow) }
      }
    },
    {
      $group: {
        _id: '$ipAddress',
        count: { $sum: 1 },
        severities: { $push: '$severity' },
        endpoints: { $push: '$endpoint' },
        lastViolation: { $max: '$violatedAt' }
      }
    },
    {
      $match: {
        count: { $gte: minViolations }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return suspiciousIPs;
};

/**
 * Clean up old violations
 */
rateLimitViolationSchema.statics.cleanup = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    violatedAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

const RateLimitViolation = mongoose.model('RateLimitViolation', rateLimitViolationSchema);

export default RateLimitViolation;
