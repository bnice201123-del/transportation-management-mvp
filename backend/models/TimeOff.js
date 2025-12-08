import mongoose from 'mongoose';

const timeOffSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['vacation', 'sick', 'personal', 'bereavement', 'unpaid', 'holiday', 'parental', 'jury-duty', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'cancelled'],
    default: 'pending',
    index: true
  },
  reason: String,
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly']
    },
    interval: Number, // e.g., every 2 weeks
    daysOfWeek: [Number],
    endDate: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  deniedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deniedAt: Date,
  denialReason: String,
  conflicts: [{
    type: {
      type: String,
      enum: ['overlap', 'schedule-conflict', 'insufficient-balance', 'blackout-period']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  coverageNeeded: {
    type: Boolean,
    default: false
  },
  coverageSuggestions: [{
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number, // 0-100 based on availability, skills, etc.
    reason: String
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  notificationsSent: [{
    type: String,
    sentAt: Date,
    recipient: String
  }]
}, {
  timestamps: true
});

// Indexes
timeOffSchema.index({ driver: 1, startDate: 1, endDate: 1 });
timeOffSchema.index({ status: 1, startDate: 1 });

// Calculate total days before save
timeOffSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    this.totalDays = days;
  }
  next();
});

// Method to check for conflicts
timeOffSchema.methods.checkConflicts = async function() {
  const TimeOff = this.constructor;
  const conflicts = [];

  // Check for overlapping time-off requests
  const overlapping = await TimeOff.find({
    driver: this.driver,
    _id: { $ne: this._id },
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        startDate: { $lt: this.endDate },
        endDate: { $gt: this.startDate }
      }
    ]
  });

  if (overlapping.length > 0) {
    conflicts.push({
      type: 'overlap',
      description: `Overlaps with ${overlapping.length} other time-off request(s)`,
      severity: 'high'
    });
  }

  // Check for schedule conflicts
  const Schedule = mongoose.model('Schedule');
  const scheduleConflicts = await Schedule.find({
    driver: this.driver,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [
      {
        startTime: { $lt: this.endDate },
        endTime: { $gt: this.startDate }
      }
    ]
  });

  if (scheduleConflicts.length > 0) {
    conflicts.push({
      type: 'schedule-conflict',
      description: `Driver has ${scheduleConflicts.length} scheduled shift(s) during this period`,
      severity: 'high'
    });
  }

  // Check vacation balance
  const VacationBalance = mongoose.model('VacationBalance');
  const balance = await VacationBalance.findOne({ driver: this.driver });
  
  if (balance && this.type === 'vacation') {
    if (balance.available < this.totalDays) {
      conflicts.push({
        type: 'insufficient-balance',
        description: `Insufficient vacation balance. Available: ${balance.available} days, Requested: ${this.totalDays} days`,
        severity: 'high'
      });
    }
  }

  return conflicts;
};

// Method to suggest coverage
timeOffSchema.methods.suggestCoverage = async function() {
  const Schedule = mongoose.model('Schedule');
  const User = mongoose.model('User');

  // Get all drivers
  const drivers = await User.find({ roles: 'driver', _id: { $ne: this.driver } });
  const suggestions = [];

  for (const driver of drivers) {
    let score = 100;
    const reasons = [];

    // Check availability
    const conflicts = await Schedule.countDocuments({
      driver: driver._id,
      status: { $in: ['scheduled', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: this.endDate },
          endTime: { $gt: this.startDate }
        }
      ]
    });

    if (conflicts > 0) {
      score -= 30;
      reasons.push(`Has ${conflicts} conflicting shift(s)`);
    }

    // Check time-off
    const TimeOff = this.constructor;
    const timeOffConflicts = await TimeOff.countDocuments({
      driver: driver._id,
      status: 'approved',
      $or: [
        {
          startDate: { $lt: this.endDate },
          endDate: { $gt: this.startDate }
        }
      ]
    });

    if (timeOffConflicts > 0) {
      score -= 50;
      reasons.push('Has approved time-off');
    } else {
      reasons.push('Available during this period');
    }

    // Check recent overtime
    const recentOvertime = await Schedule.aggregate([
      {
        $match: {
          driver: driver._id,
          actualEndTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          overtimeHours: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalOvertime: { $sum: '$overtimeHours' }
        }
      }
    ]);

    if (recentOvertime.length > 0 && recentOvertime[0].totalOvertime > 10) {
      score -= 20;
      reasons.push('Has high recent overtime');
    }

    suggestions.push({
      driver: driver._id,
      score: Math.max(0, score),
      reason: reasons.join(', ')
    });
  }

  // Sort by score
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.slice(0, 5); // Top 5 suggestions
};

// Static method for bulk approval
timeOffSchema.statics.bulkApprove = async function(requestIds, approvedBy) {
  const result = await this.updateMany(
    {
      _id: { $in: requestIds },
      status: 'pending'
    },
    {
      $set: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }
    }
  );

  return result;
};

// Static method for bulk denial
timeOffSchema.statics.bulkDeny = async function(requestIds, deniedBy, reason) {
  const result = await this.updateMany(
    {
      _id: { $in: requestIds },
      status: 'pending'
    },
    {
      $set: {
        status: 'denied',
        deniedBy,
        deniedAt: new Date(),
        denialReason: reason
      }
    }
  );

  return result;
};

const TimeOff = mongoose.model('TimeOff', timeOffSchema);
export default TimeOff;
