import mongoose from 'mongoose';

const workScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  clockIn: {
    type: Date
  },
  clockOut: {
    type: Date
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'worked', 'missed', 'time-off', 'holiday'],
    default: 'scheduled',
    index: true
  },
  tripsCompleted: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for querying by user and date range
workScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });
workScheduleSchema.index({ userId: 1, status: 1, date: -1 });

// Calculate hours worked before saving
workScheduleSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const diffMs = this.clockOut - this.clockIn;
    this.hoursWorked = diffMs / (1000 * 60 * 60); // Convert to hours
    this.status = 'worked';
  }
  next();
});

// Static method to get work summary for a user
workScheduleSchema.statics.getWorkSummary = async function(userId, startDate, endDate) {
  const records = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  const summary = {
    totalHours: 0,
    totalEarnings: 0,
    daysWorked: 0,
    daysMissed: 0,
    daysScheduled: 0,
    missedDays: [],
    records: []
  };

  records.forEach(record => {
    if (record.status === 'scheduled') summary.daysScheduled++;
    if (record.status === 'worked') {
      summary.totalHours += record.hoursWorked || 0;
      summary.totalEarnings += record.earnings || 0;
      summary.daysWorked++;
    }
    if (record.status === 'missed') {
      summary.daysMissed++;
      summary.missedDays.push({
        date: record.date,
        notes: record.notes
      });
    }
    
    summary.records.push({
      date: record.date,
      status: record.status,
      hoursWorked: record.hoursWorked,
      earnings: record.earnings,
      tripsCompleted: record.tripsCompleted,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      notes: record.notes
    });
  });

  return summary;
};

const WorkSchedule = mongoose.model('WorkSchedule', workScheduleSchema);

export default WorkSchedule;
