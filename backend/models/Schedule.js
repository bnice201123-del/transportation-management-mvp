import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'split', 'on-call'],
    default: 'morning'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  location: {
    type: String,
    default: ''
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['lunch', 'rest', 'meal'],
      default: 'rest'
    },
    duration: Number, // minutes
    taken: {
      type: Boolean,
      default: false
    },
    actualStartTime: Date,
    actualEndTime: Date
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    endDate: Date,
    exceptions: [Date] // dates to skip
  },
  templateName: String,
  notes: String,
  actualStartTime: Date,
  actualEndTime: Date,
  totalHours: Number,
  overtimeHours: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModified: Date,
  conflicts: [{
    type: {
      type: String,
      enum: ['overlap', 'time-off', 'break-violation', 'overtime']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
scheduleSchema.index({ driver: 1, startTime: 1, endTime: 1 });
scheduleSchema.index({ status: 1, startTime: 1 });
scheduleSchema.index({ 'recurringPattern.daysOfWeek': 1 });

// Virtual for duration
scheduleSchema.virtual('duration').get(function() {
  return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
});

// Calculate total hours and overtime before save
scheduleSchema.pre('save', function(next) {
  if (this.actualStartTime && this.actualEndTime) {
    const hours = (this.actualEndTime - this.actualStartTime) / (1000 * 60 * 60);
    this.totalHours = Math.round(hours * 100) / 100;
    
    // Calculate overtime (over 8 hours)
    if (hours > 8) {
      this.overtimeHours = Math.round((hours - 8) * 100) / 100;
    }
  }
  next();
});

// Method to check for conflicts
scheduleSchema.methods.checkConflicts = async function() {
  const Schedule = this.constructor;
  const conflicts = [];

  // Check for overlapping shifts
  const overlapping = await Schedule.find({
    driver: this.driver,
    _id: { $ne: this._id },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [
      {
        startTime: { $lt: this.endTime },
        endTime: { $gt: this.startTime }
      }
    ]
  });

  if (overlapping.length > 0) {
    conflicts.push({
      type: 'overlap',
      description: `Overlaps with ${overlapping.length} other shift(s)`,
      severity: 'high'
    });
  }

  // Check for time-off conflicts
  const TimeOff = mongoose.model('TimeOff');
  const timeOffConflicts = await TimeOff.find({
    driver: this.driver,
    status: 'approved',
    $or: [
      {
        startDate: { $lt: this.endTime },
        endDate: { $gt: this.startTime }
      }
    ]
  });

  if (timeOffConflicts.length > 0) {
    conflicts.push({
      type: 'time-off',
      description: `Driver has approved time-off during this period`,
      severity: 'high'
    });
  }

  // Check for break violations (must have break if shift > 6 hours)
  const duration = (this.endTime - this.startTime) / (1000 * 60 * 60);
  if (duration > 6 && (!this.breaks || this.breaks.length === 0)) {
    conflicts.push({
      type: 'break-violation',
      description: 'Shifts longer than 6 hours require at least one break',
      severity: 'medium'
    });
  }

  return conflicts;
};

// Method to generate recurring shifts
scheduleSchema.methods.generateRecurringShifts = async function(endDate) {
  if (!this.isRecurring) return [];

  const Schedule = this.constructor;
  const shifts = [];
  const pattern = this.recurringPattern;
  let currentDate = new Date(this.startTime);
  const finalDate = endDate || pattern.endDate || new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  while (currentDate <= finalDate) {
    // Check if this date should be included
    const dayOfWeek = currentDate.getDay();
    if (pattern.daysOfWeek.includes(dayOfWeek)) {
      // Check if not in exceptions
      const isException = pattern.exceptions.some(ex => 
        new Date(ex).toDateString() === currentDate.toDateString()
      );

      if (!isException) {
        const shiftStart = new Date(currentDate);
        shiftStart.setHours(this.startTime.getHours(), this.startTime.getMinutes(), 0, 0);
        
        const shiftEnd = new Date(currentDate);
        shiftEnd.setHours(this.endTime.getHours(), this.endTime.getMinutes(), 0, 0);

        shifts.push({
          driver: this.driver,
          startTime: shiftStart,
          endTime: shiftEnd,
          shiftType: this.shiftType,
          location: this.location,
          vehicle: this.vehicle,
          breaks: this.breaks,
          templateName: this.templateName,
          notes: `Generated from recurring schedule`,
          createdBy: this.createdBy
        });
      }
    }

    // Move to next occurrence
    switch (pattern.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return shifts;
};

// Static method to get driver availability
scheduleSchema.statics.getDriverAvailability = async function(driverId, startDate, endDate) {
  const schedules = await this.find({
    driver: driverId,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    startTime: { $gte: startDate },
    endTime: { $lte: endDate }
  }).sort({ startTime: 1 });

  return schedules;
};

// Static method to find coverage gaps
scheduleSchema.statics.findCoverageGaps = async function(startDate, endDate, requiredDrivers = 1) {
  const schedules = await this.find({
    status: { $in: ['scheduled', 'confirmed'] },
    startTime: { $gte: startDate },
    endTime: { $lte: endDate }
  }).sort({ startTime: 1 });

  const gaps = [];
  const timeSlots = {};

  // Create hourly time slots
  let currentTime = new Date(startDate);
  while (currentTime < endDate) {
    const key = currentTime.toISOString();
    timeSlots[key] = 0;
    currentTime.setHours(currentTime.getHours() + 1);
  }

  // Count drivers for each time slot
  schedules.forEach(schedule => {
    let slotTime = new Date(schedule.startTime);
    while (slotTime < schedule.endTime) {
      const key = slotTime.toISOString();
      if (timeSlots[key] !== undefined) {
        timeSlots[key]++;
      }
      slotTime.setHours(slotTime.getHours() + 1);
    }
  });

  // Find gaps
  Object.keys(timeSlots).forEach(key => {
    if (timeSlots[key] < requiredDrivers) {
      gaps.push({
        time: new Date(key),
        currentDrivers: timeSlots[key],
        requiredDrivers,
        deficit: requiredDrivers - timeSlots[key]
      });
    }
  });

  return gaps;
};

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
