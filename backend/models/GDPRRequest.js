import mongoose from 'mongoose';

const gdprRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestType: {
    type: String,
    enum: ['data_export', 'data_deletion', 'data_portability', 'consent_withdrawal'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    // Data exports expire after 30 days
    default: function() {
      if (this.requestType === 'data_export') {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      return null;
    }
  },
  
  // Request details
  requestDetails: {
    reason: String,
    scope: {
      type: [String],
      default: ['all']
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf'],
      default: 'json'
    },
    includeRelated: {
      type: Boolean,
      default: true
    }
  },

  // Processing information
  processingInfo: {
    startedAt: Date,
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentStep: String,
    estimatedCompletion: Date
  },

  // Export specific
  exportData: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloadedAt: Date,
    dataCollections: [String], // List of data types included
    recordCounts: mongoose.Schema.Types.Mixed // Count of records per collection
  },

  // Deletion specific
  deletionData: {
    deletedCollections: [String],
    retainedCollections: [String], // Legal/compliance reasons
    anonymizedCollections: [String],
    recordCounts: mongoose.Schema.Types.Mixed,
    backupCreated: {
      type: Boolean,
      default: false
    },
    backupLocation: String
  },

  // Result information
  result: {
    success: {
      type: Boolean,
      default: false
    },
    message: String,
    errors: [String],
    warnings: [String]
  },

  // Verification
  verificationToken: {
    type: String,
    select: false
  },
  verificationRequired: {
    type: Boolean,
    default: true
  },
  verifiedAt: Date,
  verifiedBy: {
    method: {
      type: String,
      enum: ['email', 'sms', 'authenticator', 'admin']
    },
    ipAddress: String,
    userAgent: String
  },

  // Admin notes and actions
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Audit trail
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],

  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    requestSource: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin'],
      default: 'web'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
gdprRequestSchema.index({ userId: 1, requestType: 1 });
gdprRequestSchema.index({ status: 1, requestedAt: -1 });
gdprRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
gdprRequestSchema.index({ 'requestedAt': 1 });

// Static methods

/**
 * Create a new GDPR request
 */
gdprRequestSchema.statics.createRequest = async function(data) {
  const request = new this({
    userId: data.userId,
    requestType: data.requestType,
    requestDetails: data.requestDetails || {},
    metadata: data.metadata || {},
    verificationToken: data.verificationToken
  });

  // Add to status history
  request.statusHistory.push({
    status: 'pending',
    changedAt: new Date(),
    reason: 'Request created'
  });

  await request.save();
  return request;
};

/**
 * Get user's GDPR request history
 */
gdprRequestSchema.statics.getUserRequests = async function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query.requestType = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }

  const requests = await this.find(query)
    .sort({ requestedAt: -1 })
    .limit(options.limit || 50);

  return requests;
};

/**
 * Update request status
 */
gdprRequestSchema.methods.updateStatus = async function(newStatus, changedBy, reason) {
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    reason
  });

  if (newStatus === 'processing') {
    this.processedAt = new Date();
  } else if (newStatus === 'completed') {
    this.completedAt = new Date();
    this.result.success = true;
  } else if (newStatus === 'failed') {
    this.completedAt = new Date();
    this.result.success = false;
  }

  await this.save();
  return this;
};

/**
 * Mark request as verified
 */
gdprRequestSchema.methods.markVerified = async function(method, metadata = {}) {
  this.verifiedAt = new Date();
  this.verifiedBy = {
    method,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  };
  await this.save();
  return this;
};

/**
 * Increment download count
 */
gdprRequestSchema.methods.recordDownload = async function() {
  this.exportData.downloadCount += 1;
  this.exportData.lastDownloadedAt = new Date();
  await this.save();
  return this;
};

/**
 * Add admin note
 */
gdprRequestSchema.methods.addNote = async function(note, addedBy) {
  this.adminNotes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  await this.save();
  return this;
};

/**
 * Get pending requests (for admin dashboard)
 */
gdprRequestSchema.statics.getPendingRequests = async function(options = {}) {
  const query = { status: 'pending' };
  
  if (options.type) {
    query.requestType = options.type;
  }

  const requests = await this.find(query)
    .populate('userId', 'firstName lastName email username')
    .sort({ priority: -1, requestedAt: 1 })
    .limit(options.limit || 100);

  return requests;
};

/**
 * Get statistics
 */
gdprRequestSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate || filters.endDate) {
    matchStage.requestedAt = {};
    if (filters.startDate) matchStage.requestedAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.requestedAt.$lte = new Date(filters.endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        byType: [
          { $group: { _id: '$requestType', count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        total: [
          { $count: 'count' }
        ],
        avgProcessingTime: [
          {
            $match: { completedAt: { $exists: true }, processedAt: { $exists: true } }
          },
          {
            $project: {
              duration: { $subtract: ['$completedAt', '$processedAt'] }
            }
          },
          {
            $group: {
              _id: null,
              avgDuration: { $avg: '$duration' }
            }
          }
        ]
      }
    }
  ]);

  return {
    byType: stats[0].byType,
    byStatus: stats[0].byStatus,
    total: stats[0].total[0]?.count || 0,
    avgProcessingTime: stats[0].avgProcessingTime[0]?.avgDuration || 0
  };
};

/**
 * Clean up expired exports
 */
gdprRequestSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    requestType: 'data_export',
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

const GDPRRequest = mongoose.model('GDPRRequest', gdprRequestSchema);

export default GDPRRequest;
