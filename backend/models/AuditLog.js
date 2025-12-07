import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // What action was performed
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      // Authentication
      'login', 'logout', 'login_failed', 'login_success', 'password_change', 'password_reset',
      '2fa_enabled', '2fa_disabled', '2fa_backup_used',
      
      // User Management
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
      'role_changed', 'role_added', 'role_removed',
      
      // Trip Management
      'trip_created', 'trip_updated', 'trip_deleted', 'trip_cancelled',
      'trip_completed', 'trip_assigned', 'trip_unassigned', 'trip_status_changed',
      
      // Recurring Trips
      'recurring_trip_created', 'recurring_trip_updated', 'recurring_trip_deleted',
      'recurring_trip_paused', 'recurring_trip_resumed',
      
      // Vehicle Management
      'vehicle_created', 'vehicle_updated', 'vehicle_deleted',
      'vehicle_assigned', 'vehicle_unassigned',
      
      // Rider Management
      'rider_created', 'rider_updated', 'rider_deleted',
      'rider_balance_updated', 'rider_contract_updated',
      
      // Settings & Configuration
      'settings_updated', 'system_config_updated', 'holiday_added', 'holiday_removed',
      
      // Notifications
      'notification_sent', 'notification_deleted', 'notification_settings_updated',
      
      // Work Schedule
      'schedule_created', 'schedule_updated', 'schedule_deleted',
      'timeoff_requested', 'timeoff_approved', 'timeoff_denied',
      
      // Security
      'security_alert', 'security_alerts_viewed', 'permission_denied', 'suspicious_activity',
      
      // System
      'data_export', 'data_import', 'backup_created', 'backup_restored',
      
      // Other
      'other'
    ]
  },
  
  // Action category for filtering
  category: {
    type: String,
    required: true,
    index: true,
    enum: [
      'authentication',
      'user_management',
      'trip_management',
      'vehicle_management',
      'rider_management',
      'settings',
      'security',
      'notification',
      'schedule',
      'system',
      'other'
    ]
  },
  
  // What was affected
  targetType: {
    type: String,
    enum: ['User', 'Trip', 'RecurringTrip', 'Vehicle', 'Rider', 'Notification', 'WorkSchedule', 'Settings', 'System', null]
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  targetName: {
    type: String
  },
  
  // Details about the action
  description: {
    type: String,
    required: true
  },
  
  // Before and after values for tracking changes
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Additional metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    requestMethod: String,
    requestPath: String,
    duration: Number, // milliseconds
    statusCode: Number
  },
  
  // Severity level
  severity: {
    type: String,
    enum: ['low', 'info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },
  
  // Success or failure
  success: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Error details if action failed
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // Tags for custom filtering
  tags: [{
    type: String,
    index: true
  }],
  
  // Retention
  expiresAt: {
    type: Date,
    index: true
  }
  
}, {
  timestamps: true
});

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ success: 1, createdAt: -1 });

// Text index for searching
auditLogSchema.index({
  description: 'text',
  username: 'text',
  targetName: 'text',
  'metadata.ipAddress': 'text'
});

// TTL index for automatic deletion (optional, set in days)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function(filters = {}, options = {}) {
  const {
    userId,
    action,
    category,
    severity,
    success,
    targetType,
    targetId,
    startDate,
    endDate,
    search
  } = filters;

  const {
    page = 1,
    limit = 50,
    sort = '-createdAt'
  } = options;

  const query = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (category) query.category = category;
  if (severity) query.severity = severity;
  if (success !== undefined) query.success = success;
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName username email')
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get action statistics
auditLogSchema.statics.getStatistics = async function(filters = {}) {
  const { startDate, endDate, userId } = filters;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

  const [
    byCategory,
    byAction,
    bySeverity,
    bySuccess,
    topUsers
  ] = await Promise.all([
    // Group by category
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // Group by action (top 10)
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Group by severity
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // Success vs failure
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$success', count: { $sum: 1 } } }
    ]),
    
    // Top users by activity
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$userId', username: { $first: '$username' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    byCategory,
    byAction,
    bySeverity,
    bySuccess,
    topUsers,
    totalLogs: byCategory.reduce((sum, item) => sum + item.count, 0)
  };
};

// Static method to get activity timeline
auditLogSchema.statics.getTimeline = async function(filters = {}) {
  const { startDate, endDate, userId, groupBy = 'day' } = filters;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);

  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%V';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  const timeline = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        count: { $sum: 1 },
        success: { $sum: { $cond: ['$success', 1, 0] } },
        failed: { $sum: { $cond: ['$success', 0, 1] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return timeline;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
