/**
 * Security Alert Model
 * 
 * Tracks security events, threats, and anomalies across the system.
 * Aggregates data from rate limits, sessions, audit logs, failed logins, etc.
 */

import mongoose from 'mongoose';

const securityAlertSchema = new mongoose.Schema({
  // Alert identification
  alertId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Alert type and severity
  type: {
    type: String,
    required: true,
    enum: [
      'rate_limit_exceeded',
      'multiple_failed_logins',
      'suspicious_login',
      'unauthorized_access',
      'permission_violation',
      'session_anomaly',
      'encryption_error',
      'data_breach_attempt',
      'brute_force_attack',
      'sql_injection_attempt',
      'xss_attempt',
      'unusual_activity',
      'account_takeover',
      'privilege_escalation',
      'data_exfiltration',
      'malware_detected',
      'ddos_attack',
      'configuration_change',
      'system_health',
      'custom'
    ],
    index: true
  },
  
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium',
    index: true
  },
  
  // Alert status
  status: {
    type: String,
    required: true,
    enum: ['active', 'acknowledged', 'investigating', 'resolved', 'false_positive', 'ignored'],
    default: 'active',
    index: true
  },
  
  // Event details
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Source information
  source: {
    component: {
      type: String,
      required: true,
      enum: [
        'authentication',
        'authorization',
        'rate_limiter',
        'session_manager',
        'encryption',
        'audit_log',
        'api_gateway',
        'database',
        'file_system',
        'network',
        'application',
        'system'
      ]
    },
    endpoint: String,
    method: String,
    service: String
  },
  
  // User/actor information
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    username: String,
    email: String,
    role: String,
    ipAddress: {
      type: String,
      index: true
    },
    userAgent: String,
    sessionId: String
  },
  
  // Target information
  target: {
    type: String,
    resource: String,
    resourceId: String,
    action: String
  },
  
  // Event metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  
  // Metrics and counts
  metrics: {
    count: {
      type: Number,
      default: 1
    },
    attemptCount: Number,
    failureCount: Number,
    successCount: Number,
    duration: Number,
    dataVolume: Number
  },
  
  // Detection information
  detection: {
    method: {
      type: String,
      enum: ['rule_based', 'threshold', 'pattern_matching', 'ml_model', 'manual', 'automated'],
      default: 'automated'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    ruleId: String,
    ruleName: String
  },
  
  // Response and mitigation
  response: {
    actions: [{
      type: String,
      timestamp: Date,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      details: String
    }],
    mitigationSteps: [String],
    blockedIps: [String],
    suspendedAccounts: [String]
  },
  
  // Related alerts and events
  related: {
    alerts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityAlert'
    }],
    auditLogs: [String],
    sessionIds: [String],
    eventIds: [String]
  },
  
  // Risk assessment
  risk: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: [String],
    impact: {
      type: String,
      enum: ['none', 'minimal', 'moderate', 'significant', 'severe', 'catastrophic']
    },
    likelihood: {
      type: String,
      enum: ['rare', 'unlikely', 'possible', 'likely', 'almost_certain']
    }
  },
  
  // Notification tracking
  notifications: {
    email: {
      sent: Boolean,
      sentAt: Date,
      recipients: [String],
      messageId: String
    },
    webhook: {
      sent: Boolean,
      sentAt: Date,
      url: String,
      responseCode: Number
    },
    sms: {
      sent: Boolean,
      sentAt: Date,
      recipients: [String]
    },
    inApp: {
      sent: Boolean,
      sentAt: Date,
      recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  },
  
  // Investigation details
  investigation: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: Date,
    completedAt: Date,
    findings: String,
    rootCause: String,
    recommendations: [String]
  },
  
  // Timestamps
  firstOccurrence: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastOccurrence: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Auto-resolution
  autoResolve: {
    enabled: {
      type: Boolean,
      default: false
    },
    afterMinutes: Number,
    resolvedAutomatically: Boolean
  },
  
  // Alert suppression
  suppressed: {
    type: Boolean,
    default: false
  },
  
  suppressedUntil: Date,
  
  // Tags for categorization
  tags: [{
    type: String
    // Removed index: true to avoid duplicate - indexed separately below
  }],
  
  // Notes and comments
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
securityAlertSchema.index({ createdAt: -1 });
securityAlertSchema.index({ type: 1, severity: 1, status: 1 });
securityAlertSchema.index({ 'actor.ipAddress': 1, createdAt: -1 });
securityAlertSchema.index({ 'actor.userId': 1, createdAt: -1 });
securityAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });
securityAlertSchema.index({ tags: 1 });

// Virtual for alert age
securityAlertSchema.virtual('age').get(function() {
  return Date.now() - this.firstOccurrence;
});

// Virtual for time to acknowledge
securityAlertSchema.virtual('timeToAcknowledge').get(function() {
  if (!this.acknowledgedAt) return null;
  return this.acknowledgedAt - this.firstOccurrence;
});

// Virtual for time to resolve
securityAlertSchema.virtual('timeToResolve').get(function() {
  if (!this.resolvedAt) return null;
  return this.resolvedAt - this.firstOccurrence;
});

// Static Methods

/**
 * Create a new security alert
 */
securityAlertSchema.statics.createAlert = async function(alertData) {
  const alertId = `SA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const alert = new this({
    alertId,
    ...alertData,
    firstOccurrence: new Date(),
    lastOccurrence: new Date()
  });
  
  await alert.save();
  
  // Trigger notifications if needed
  if (alertData.severity === 'critical' || alertData.severity === 'high') {
    await alert.sendNotifications();
  }
  
  return alert;
};

/**
 * Get active alerts with filters
 */
securityAlertSchema.statics.getActiveAlerts = async function(filters = {}) {
  const query = { status: { $in: ['active', 'acknowledged', 'investigating'] } };
  
  if (filters.severity) {
    query.severity = Array.isArray(filters.severity) 
      ? { $in: filters.severity } 
      : filters.severity;
  }
  
  if (filters.type) {
    query.type = Array.isArray(filters.type) 
      ? { $in: filters.type } 
      : filters.type;
  }
  
  if (filters.userId) {
    query['actor.userId'] = filters.userId;
  }
  
  if (filters.ipAddress) {
    query['actor.ipAddress'] = filters.ipAddress;
  }
  
  if (filters.startDate) {
    query.firstOccurrence = { $gte: new Date(filters.startDate) };
  }
  
  if (filters.endDate) {
    query.lastOccurrence = { ...query.lastOccurrence, $lte: new Date(filters.endDate) };
  }
  
  return this.find(query)
    .sort({ severity: 1, createdAt: -1 }) // critical first
    .populate('actor.userId', 'username email role')
    .populate('acknowledgedBy', 'username email')
    .populate('resolvedBy', 'username email');
};

/**
 * Get alert statistics
 */
securityAlertSchema.statics.getStatistics = async function(timeRange = '24h') {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '1h':
      startDate = new Date(now - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }
  
  const [
    totalAlerts,
    activeAlerts,
    criticalAlerts,
    resolvedAlerts,
    bySeverity,
    byType,
    byStatus,
    topIPs,
    topUsers,
    recentAlerts
  ] = await Promise.all([
    this.countDocuments({ createdAt: { $gte: startDate } }),
    this.countDocuments({ 
      status: { $in: ['active', 'acknowledged', 'investigating'] },
      createdAt: { $gte: startDate }
    }),
    this.countDocuments({ 
      severity: 'critical',
      status: { $in: ['active', 'acknowledged', 'investigating'] },
      createdAt: { $gte: startDate }
    }),
    this.countDocuments({ 
      status: 'resolved',
      createdAt: { $gte: startDate }
    }),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate }, 'actor.ipAddress': { $exists: true } } },
      { $group: { _id: '$actor.ipAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate }, 'actor.userId': { $exists: true } } },
      { $group: { _id: '$actor.userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('alertId type severity status title createdAt')
  ]);
  
  // Calculate average resolution time
  const resolvedWithTime = await this.find({
    status: 'resolved',
    resolvedAt: { $exists: true },
    createdAt: { $gte: startDate }
  }).select('firstOccurrence resolvedAt');
  
  let avgResolutionTime = 0;
  if (resolvedWithTime.length > 0) {
    const totalTime = resolvedWithTime.reduce((sum, alert) => {
      return sum + (alert.resolvedAt - alert.firstOccurrence);
    }, 0);
    avgResolutionTime = totalTime / resolvedWithTime.length;
  }
  
  return {
    timeRange,
    period: {
      start: startDate,
      end: now
    },
    summary: {
      total: totalAlerts,
      active: activeAlerts,
      critical: criticalAlerts,
      resolved: resolvedAlerts,
      resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts * 100).toFixed(2) : 0,
      avgResolutionTime: Math.round(avgResolutionTime / 1000 / 60) // minutes
    },
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byType: byType.map(item => ({ type: item._id, count: item.count })),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    topIPs: topIPs.map(item => ({ ip: item._id, count: item.count })),
    topUsers: topUsers.map(item => ({ userId: item._id, count: item.count })),
    recentAlerts
  };
};

/**
 * Detect anomalies and create alerts
 */
securityAlertSchema.statics.detectAnomalies = async function() {
  const alerts = [];
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  
  // Check for rate limit violations
  const rateLimitViolations = await mongoose.model('AuditLog').countDocuments({
    action: 'rate_limit_exceeded',
    timestamp: { $gte: oneHourAgo }
  });
  
  if (rateLimitViolations > 50) {
    alerts.push(await this.createAlert({
      type: 'rate_limit_exceeded',
      severity: 'high',
      title: 'High Rate Limit Violations Detected',
      description: `${rateLimitViolations} rate limit violations in the last hour`,
      source: { component: 'rate_limiter' },
      metrics: { count: rateLimitViolations },
      detection: { method: 'threshold', confidence: 100 }
    }));
  }
  
  // Check for multiple failed logins
  const failedLogins = await mongoose.model('AuditLog').aggregate([
    {
      $match: {
        action: 'login_failed',
        timestamp: { $gte: oneHourAgo }
      }
    },
    {
      $group: {
        _id: '$metadata.ipAddress',
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gte: 5 } }
    }
  ]);
  
  for (const login of failedLogins) {
    alerts.push(await this.createAlert({
      type: 'brute_force_attack',
      severity: 'critical',
      title: 'Potential Brute Force Attack',
      description: `${login.count} failed login attempts from IP ${login._id}`,
      source: { component: 'authentication' },
      actor: { ipAddress: login._id },
      metrics: { failureCount: login.count },
      detection: { method: 'threshold', confidence: 95 }
    }));
  }
  
  return alerts;
};

/**
 * Correlate related alerts
 */
securityAlertSchema.statics.correlateAlerts = async function(alertId) {
  const alert = await this.findOne({ alertId });
  if (!alert) return [];
  
  const query = {
    _id: { $ne: alert._id },
    status: { $in: ['active', 'acknowledged', 'investigating'] },
    $or: [
      { 'actor.ipAddress': alert.actor?.ipAddress },
      { 'actor.userId': alert.actor?.userId },
      { type: alert.type }
    ],
    firstOccurrence: {
      $gte: new Date(alert.firstOccurrence - 60 * 60 * 1000), // 1 hour before
      $lte: new Date(alert.firstOccurrence.getTime() + 60 * 60 * 1000) // 1 hour after
    }
  };
  
  return this.find(query).limit(10);
};

// Instance Methods

/**
 * Acknowledge alert
 */
securityAlertSchema.methods.acknowledge = async function(userId) {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = userId;
  await this.save();
  return this;
};

/**
 * Start investigation
 */
securityAlertSchema.methods.startInvestigation = async function(userId) {
  this.status = 'investigating';
  this.investigation.assignedTo = userId;
  this.investigation.startedAt = new Date();
  await this.save();
  return this;
};

/**
 * Resolve alert
 */
securityAlertSchema.methods.resolve = async function(userId, findings = '', recommendations = []) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  
  if (findings) {
    this.investigation.findings = findings;
  }
  
  if (recommendations.length > 0) {
    this.investigation.recommendations = recommendations;
  }
  
  this.investigation.completedAt = new Date();
  await this.save();
  return this;
};

/**
 * Mark as false positive
 */
securityAlertSchema.methods.markFalsePositive = async function(userId, reason) {
  this.status = 'false_positive';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  this.notes.push({
    text: `False positive: ${reason}`,
    addedBy: userId,
    addedAt: new Date()
  });
  await this.save();
  return this;
};

/**
 * Add note to alert
 */
securityAlertSchema.methods.addNote = async function(userId, text) {
  this.notes.push({
    text,
    addedBy: userId,
    addedAt: new Date()
  });
  await this.save();
  return this;
};

/**
 * Send notifications
 */
securityAlertSchema.methods.sendNotifications = async function() {
  // This would integrate with email/SMS/webhook services
  // For now, we'll just mark as sent
  this.notifications.inApp.sent = true;
  this.notifications.inApp.sentAt = new Date();
  await this.save();
  return this;
};

/**
 * Suppress alert
 */
securityAlertSchema.methods.suppress = async function(durationMinutes) {
  this.suppressed = true;
  this.suppressedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  await this.save();
  return this;
};

/**
 * Update occurrence count
 */
securityAlertSchema.methods.incrementOccurrence = async function() {
  this.metrics.count += 1;
  this.lastOccurrence = new Date();
  await this.save();
  return this;
};

const SecurityAlert = mongoose.model('SecurityAlert', securityAlertSchema);

export default SecurityAlert;
