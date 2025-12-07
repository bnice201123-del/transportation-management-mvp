import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: true,
    min: 0,
    max: 6
  },
  isWorkDay: {
    type: Boolean,
    default: false
  },
  shiftStart: {
    type: String, // Format: "HH:MM" (24-hour format, e.g., "06:00")
    validate: {
      validator: function(v) {
        return !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Shift start must be in HH:MM format (24-hour)'
    }
  },
  shiftEnd: {
    type: String, // Format: "HH:MM" (24-hour format, e.g., "14:00")
    validate: {
      validator: function(v) {
        return !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Shift end must be in HH:MM format (24-hour)'
    }
  },
  hoursScheduled: {
    type: Number,
    default: 0
  }
}, { _id: false });

const weeklyScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One schedule per user
    index: true
  },
  schedule: {
    type: [dayScheduleSchema],
    default: () => {
      // Initialize with 7 days (Sun-Sat), all off by default
      return [0, 1, 2, 3, 4, 5, 6].map(day => ({
        dayOfWeek: day,
        isWorkDay: false,
        shiftStart: null,
        shiftEnd: null,
        hoursScheduled: 0
      }));
    }
  },
  weeklyHours: {
    type: Number,
    default: 0
  },
  isRecurring: {
    type: Boolean,
    default: true // Most schedules repeat weekly
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Calculate hours for a day based on shift times
dayScheduleSchema.methods.calculateHours = function() {
  if (!this.isWorkDay || !this.shiftStart || !this.shiftEnd) {
    this.hoursScheduled = 0;
    return 0;
  }

  const [startHour, startMin] = this.shiftStart.split(':').map(Number);
  const [endHour, endMin] = this.shiftEnd.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts (end time is before start time)
  let totalMinutes = endMinutes - startMinutes;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours
  }
  
  this.hoursScheduled = totalMinutes / 60;
  return this.hoursScheduled;
};

// Pre-save hook to calculate hours for each day and total weekly hours
weeklyScheduleSchema.pre('save', function(next) {
  let totalHours = 0;
  
  this.schedule.forEach(day => {
    if (day.isWorkDay && day.shiftStart && day.shiftEnd) {
      const [startHour, startMin] = day.shiftStart.split(':').map(Number);
      const [endHour, endMin] = day.shiftEnd.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      let totalMinutes = endMinutes - startMinutes;
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
      }
      
      day.hoursScheduled = totalMinutes / 60;
      totalHours += day.hoursScheduled;
    } else {
      day.hoursScheduled = 0;
    }
  });
  
  this.weeklyHours = totalHours;
  next();
});

// Static method to get schedule with time-off integration
weeklyScheduleSchema.statics.getScheduleWithTimeOff = async function(userId, weekStart) {
  const TimeOffRequest = mongoose.model('TimeOffRequest');
  
  // Get the user's weekly schedule
  const schedule = await this.findOne({ userId });
  
  if (!schedule) {
    return null;
  }
  
  // Calculate week end date (7 days from start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // Get approved time-off requests for this week
  const timeOffRequests = await TimeOffRequest.find({
    userId,
    status: 'approved',
    $or: [
      // Time off starts within this week
      { startDate: { $gte: weekStart, $lte: weekEnd } },
      // Time off ends within this week
      { endDate: { $gte: weekStart, $lte: weekEnd } },
      // Time off spans the entire week
      { startDate: { $lte: weekStart }, endDate: { $gte: weekEnd } }
    ]
  });
  
  // Build the week's schedule with time-off markers
  const weekSchedule = [];
  let totalWorkingHours = 0;
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    
    const dayOfWeek = currentDate.getDay();
    const daySchedule = schedule.schedule.find(d => d.dayOfWeek === dayOfWeek);
    
    // Check if this date has approved time off
    const hasTimeOff = timeOffRequests.some(request => {
      const reqStart = new Date(request.startDate);
      const reqEnd = new Date(request.endDate);
      reqStart.setHours(0, 0, 0, 0);
      reqEnd.setHours(23, 59, 59, 999);
      
      return currentDate >= reqStart && currentDate <= reqEnd;
    });
    
    weekSchedule.push({
      date: currentDate,
      dayOfWeek: dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      isWorkDay: daySchedule?.isWorkDay && !hasTimeOff,
      shiftStart: hasTimeOff ? null : daySchedule?.shiftStart,
      shiftEnd: hasTimeOff ? null : daySchedule?.shiftEnd,
      hoursScheduled: hasTimeOff ? 0 : (daySchedule?.hoursScheduled || 0),
      hasTimeOff: hasTimeOff,
      status: hasTimeOff ? 'time-off' : (daySchedule?.isWorkDay ? 'scheduled' : 'off')
    });
    
    if (!hasTimeOff && daySchedule?.isWorkDay) {
      totalWorkingHours += daySchedule.hoursScheduled || 0;
    }
  }
  
  return {
    schedule: weekSchedule,
    totalWeeklyHours: totalWorkingHours,
    baseWeeklyHours: schedule.weeklyHours,
    userId: schedule.userId,
    isRecurring: schedule.isRecurring,
    effectiveDate: schedule.effectiveDate,
    notes: schedule.notes
  };
};

// Helper method to get day name
weeklyScheduleSchema.methods.getDayName = function(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

const WeeklySchedule = mongoose.model('WeeklySchedule', weeklyScheduleSchema);

export default WeeklySchedule;
