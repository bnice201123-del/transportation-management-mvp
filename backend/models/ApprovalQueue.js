import mongoose from 'mongoose';

const approvalQueueSchema = new mongoose.Schema({
  // Reference to trip that needs approval
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  
  // Approval reason/type
  approvalType: {
    type: String,
    enum: ['conflict_override', 'schedule_exception', 'high_cost', 'policy_exception', 'manual_request'],
    required: true
  },
  
  // Conflict details (if applicable)
  conflictDetails: {
    detectedConflicts: [{
      conflictId: mongoose.Schema.Types.ObjectId,
      tripId: mongoose.Schema.Types.ObjectId,
      driverId: mongoose.Schema.Types.ObjectId,
      driverName: String,
      vehicleId: mongoose.Schema.Types.ObjectId,
      vehicleName: String,
      startTime: Date,
      endTime: Date,
      overlapStart: Date,
      overlapEnd: Date,
      overlapMinutes: Number,
      route: String
    }],
    overrideChecked: Boolean // User checked "I understand" override checkbox
  },
  
  // Requester information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Request reason/justification
  justification: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Approval status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending',
    index: true
  },
  
  // Approval/Rejection details
  approvalAction: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    approvalNotes: String,
    
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    
    withdrawnBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    withdrawnAt: Date,
    withdrawalReason: String
  },
  
  // Action taken (created when approved)
  actionTaken: {
    tripModified: Boolean,
    modificationDetails: String, // e.g., "Driver changed from John to Jane"
    appliedAt: Date,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // SLA tracking
  responseDeadline: Date, // e.g., 1 hour from request
  escalated: Boolean,
  escalatedAt: Date,
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Audit trail
  auditLog: [{
    action: String, // 'created', 'status_changed', 'commented', etc.
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    details: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  indexes: [
    { status: 1, requestedAt: -1 },
    { approvalType: 1, status: 1 },
    { 'approvalAction.approvedBy': 1 },
    { requestedBy: 1, status: 1 },
    { priority: 1, status: 1 },
    { createdAt: -1 }
  ]
});

// Virtual for response time
approvalQueueSchema.virtual('responseTime').get(function() {
  if (this.status === 'pending') {
    return Math.round((Date.now() - this.requestedAt) / 1000 / 60); // minutes
  } else if (this.approvalAction?.approvedAt || this.approvalAction?.rejectedAt) {
    const actionTime = this.approvalAction.approvedAt || this.approvalAction.rejectedAt;
    return Math.round((actionTime - this.requestedAt) / 1000 / 60); // minutes
  }
  return null;
});

// Virtual for is overdue
approvalQueueSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending' || !this.responseDeadline) {
    return false;
  }
  return Date.now() > this.responseDeadline;
});

// Static method to create approval request
approvalQueueSchema.statics.createApprovalRequest = async function(
  tripId,
  approvalType,
  requestedBy,
  justification,
  conflictDetails = null,
  priority = 'medium'
) {
  const approval = new this({
    tripId,
    approvalType,
    requestedBy,
    justification,
    priority,
    responseDeadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour SLA
    status: 'pending'
  });

  if (conflictDetails) {
    approval.conflictDetails = conflictDetails;
  }

  approval.auditLog.push({
    action: 'created',
    changedBy: requestedBy,
    details: `Approval request created for ${approvalType}`
  });

  return approval.save();
};

// Instance method to approve
approvalQueueSchema.methods.approve = async function(approvedBy, approvalNotes = '') {
  if (this.status !== 'pending') {
    throw new Error(`Cannot approve - status is ${this.status}`);
  }

  this.status = 'approved';
  this.approvalAction.approvedBy = approvedBy;
  this.approvalAction.approvedAt = new Date();
  this.approvalAction.approvalNotes = approvalNotes;

  this.auditLog.push({
    action: 'approved',
    changedBy: approvedBy,
    details: approvalNotes || 'Approved by manager'
  });

  return this.save();
};

// Instance method to reject
approvalQueueSchema.methods.reject = async function(rejectedBy, rejectionReason) {
  if (this.status !== 'pending') {
    throw new Error(`Cannot reject - status is ${this.status}`);
  }

  if (!rejectionReason) {
    throw new Error('Rejection reason is required');
  }

  this.status = 'rejected';
  this.approvalAction.rejectedBy = rejectedBy;
  this.approvalAction.rejectedAt = new Date();
  this.approvalAction.rejectionReason = rejectionReason;

  this.auditLog.push({
    action: 'rejected',
    changedBy: rejectedBy,
    details: `Rejected: ${rejectionReason}`
  });

  return this.save();
};

// Instance method to withdraw
approvalQueueSchema.methods.withdraw = async function(withdrawnBy, withdrawalReason = '') {
  if (this.status !== 'pending') {
    throw new Error(`Cannot withdraw - status is ${this.status}`);
  }

  this.status = 'withdrawn';
  this.approvalAction.withdrawnBy = withdrawnBy;
  this.approvalAction.withdrawnAt = new Date();
  this.approvalAction.withdrawalReason = withdrawalReason;

  this.auditLog.push({
    action: 'withdrawn',
    changedBy: withdrawnBy,
    details: withdrawalReason || 'Request withdrawn'
  });

  return this.save();
};

// Instance method to escalate
approvalQueueSchema.methods.escalate = async function(escalatedBy, escalatedTo) {
  if (this.status !== 'pending') {
    throw new Error(`Cannot escalate - status is ${this.status}`);
  }

  this.escalated = true;
  this.escalatedAt = new Date();
  this.escalatedTo = escalatedTo;
  this.responseDeadline = new Date(Date.now() + 30 * 60 * 1000); // New 30 min deadline

  this.auditLog.push({
    action: 'escalated',
    changedBy: escalatedBy,
    details: `Escalated to manager`
  });

  return this.save();
};

// Instance method to mark action as taken
approvalQueueSchema.methods.markActionTaken = async function(modificationDetails, appliedBy) {
  this.actionTaken.tripModified = true;
  this.actionTaken.modificationDetails = modificationDetails;
  this.actionTaken.appliedAt = new Date();
  this.actionTaken.appliedBy = appliedBy;

  this.auditLog.push({
    action: 'action_taken',
    changedBy: appliedBy,
    details: modificationDetails
  });

  return this.save();
};

// Static method to get pending approvals with filters
approvalQueueSchema.statics.getPendingApprovals = async function(filters = {}) {
  const query = { status: 'pending' };

  if (filters.approvalType) {
    query.approvalType = filters.approvalType;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.requestedBy) {
    query.requestedBy = filters.requestedBy;
  }

  if (filters.escalated !== undefined) {
    query.escalated = filters.escalated;
  }

  if (filters.overdueOnly) {
    query.responseDeadline = { $lt: new Date() };
  }

  const sort = filters.sortBy === 'priority' ? { priority: -1, requestedAt: -1 } : { requestedAt: -1 };

  return this.find(query)
    .populate('requestedBy', 'firstName lastName email')
    .populate('tripId', 'tripId riderName scheduledTime assignedDriver vehicle')
    .populate('tripId.assignedDriver', 'firstName lastName')
    .populate('tripId.vehicle', 'registrationNumber')
    .sort(sort)
    .lean();
};

// Static method to get approval statistics
approvalQueueSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        },
        totalApproved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
          }
        },
        totalRejected: {
          $sum: {
            $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
          }
        },
        totalWithdrawn: {
          $sum: {
            $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0]
          }
        },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'pending'] },
                  { $lt: ['$responseDeadline', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        escalated: {
          $sum: {
            $cond: [{ $eq: ['$escalated', true] }, 1, 0]
          }
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$approvalAction.approvedAt', null] },
              {
                $divide: [
                  { $subtract: ['$approvalAction.approvedAt', '$requestedAt'] },
                  1000 * 60 // milliseconds to minutes
                ]
              },
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalWithdrawn: 0,
    overdue: 0,
    escalated: 0,
    avgResponseTime: 0
  };
};

// Index for performance
approvalQueueSchema.index({ status: 1, createdAt: -1 });
approvalQueueSchema.index({ status: 1, escalated: 1 });
approvalQueueSchema.index({ responseDeadline: 1, status: 1 });

export default mongoose.model('ApprovalQueue', approvalQueueSchema);
