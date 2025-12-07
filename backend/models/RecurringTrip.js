import mongoose from 'mongoose';
import { isUSFederalHoliday } from '../utils/holidays.js';

const recurringTripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Rider Information
  riderName: {
    type: String,
    required: true,
    trim: true
  },
  riderPhone: {
    type: String,
    trim: true
  },
  riderEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Location Information
  pickupLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    placeId: { type: String }
  },
  dropoffLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    placeId: { type: String }
  },
  
  // Frequency Configuration
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true,
    default: 'weekly'
  },
  
  // For weekly frequency
  daysOfWeek: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  
  // For monthly frequency
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  
  // For custom frequency
  customInterval: {
    type: Number,
    min: 1,
    default: 1
  },
  customUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'days'
  },
  
  // Schedule Configuration
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 30,
    min: 15,
    max: 480
  },
  
  // Limits and Controls
  maxOccurrences: {
    type: Number,
    min: 1
  },
  currentOccurrences: {
    type: Number,
    default: 0
  },
  
  // Assignment Information
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedVehicle: {
    type: String,
    trim: true
  },
  
  // Trip Details
  fare: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Status and Options
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Advanced Options
  skipHolidays: {
    type: Boolean,
    default: true
  },
  skipWeekends: {
    type: Boolean,
    default: false
  },
  autoAssign: {
    type: Boolean,
    default: true
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Generated Trips Tracking
  generatedTrips: [{
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    scheduledDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'skipped'],
      default: 'scheduled'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Last Generation Info
  lastGenerated: {
    type: Date
  },
  nextGeneration: {
    type: Date
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Analytics
  totalTripsGenerated: {
    type: Number,
    default: 0
  },
  totalTripsCompleted: {
    type: Number,
    default: 0
  },
  totalTripsCancelled: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
recurringTripSchema.index({ createdBy: 1, isActive: 1 });
recurringTripSchema.index({ startDate: 1, endDate: 1 });
recurringTripSchema.index({ frequency: 1, isActive: 1 });
recurringTripSchema.index({ nextGeneration: 1 });
recurringTripSchema.index({ 'pickupLocation.address': 'text', 'dropoffLocation.address': 'text', title: 'text', riderName: 'text' });

// Virtual for computed status
recurringTripSchema.virtual('computedStatus').get(function() {
  if (!this.isActive) return 'inactive';
  
  const now = new Date();
  const startDate = new Date(this.startDate);
  const endDate = this.endDate ? new Date(this.endDate) : null;
  
  if (now < startDate) return 'pending';
  if (endDate && now > endDate) return 'expired';
  if (this.maxOccurrences && this.currentOccurrences >= this.maxOccurrences) return 'completed';
  
  return 'active';
});

// Virtual for next occurrence calculation
recurringTripSchema.virtual('nextOccurrence').get(function() {
  if (!this.isActive) return null;
  
  const now = new Date();
  const startDate = new Date(this.startDate);
  const endDate = this.endDate ? new Date(this.endDate) : null;
  
  if (now < startDate) return startDate;
  if (endDate && now > endDate) return null;
  if (this.maxOccurrences && this.currentOccurrences >= this.maxOccurrences) return null;
  
  // Calculate next occurrence based on frequency
  let nextDate = new Date(startDate);
  
  switch (this.frequency) {
    case 'daily':
      // Find next day
      nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + 1);
      break;
      
    case 'weekly':
      // Find next occurrence based on days of week
      if (this.daysOfWeek && this.daysOfWeek.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = now.getDay();
        
        let nextDay = -1;
        let daysToAdd = 1;
        
        // Find next day in the week
        for (let i = 1; i <= 7; i++) {
          const checkDay = (currentDay + i) % 7;
          const dayName = dayNames[checkDay];
          
          if (this.daysOfWeek.includes(dayName)) {
            nextDay = checkDay;
            daysToAdd = i;
            break;
          }
        }
        
        if (nextDay !== -1) {
          nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
      }
      break;
      
    case 'monthly':
      // Find next month occurrence
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, this.dayOfMonth);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
      
    case 'custom':
      // Calculate based on custom interval
      const interval = this.customInterval || 1;
      const unit = this.customUnit || 'days';
      
      nextDate = new Date(now);
      
      switch (unit) {
        case 'days':
          nextDate.setDate(nextDate.getDate() + interval);
          break;
        case 'weeks':
          nextDate.setDate(nextDate.getDate() + (interval * 7));
          break;
        case 'months':
          nextDate.setMonth(nextDate.getMonth() + interval);
          break;
      }
      break;
  }
  
  // Apply time from startTime
  if (this.startTime) {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    nextDate.setHours(hours, minutes, 0, 0);
  }
  
  // Check if next date exceeds end date
  if (endDate && nextDate > endDate) {
    return null;
  }
  
  return nextDate;
});

// Method to generate trip occurrences
recurringTripSchema.methods.generateOccurrences = function(startDate, endDate, limit = 100) {
  const occurrences = [];
  const pattern = this;
  
  let currentDate = new Date(Math.max(new Date(pattern.startDate), startDate));
  const maxDate = endDate || (pattern.endDate ? new Date(pattern.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // 1 year from now if no end date
  
  let count = 0;
  
  while (currentDate <= maxDate && count < limit) {
    if (pattern.maxOccurrences && pattern.currentOccurrences + count >= pattern.maxOccurrences) {
      break;
    }
    
    let shouldInclude = true;
    
    // Check frequency
    switch (pattern.frequency) {
      case 'daily':
        // Include every day
        break;
        
      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[currentDate.getDay()];
          shouldInclude = pattern.daysOfWeek.includes(dayName);
        }
        break;
        
      case 'monthly':
        shouldInclude = currentDate.getDate() === pattern.dayOfMonth;
        break;
        
      case 'custom':
        // For custom, we need to calculate if this date matches the pattern
        const daysDiff = Math.floor((currentDate - new Date(pattern.startDate)) / (24 * 60 * 60 * 1000));
        
        switch (pattern.customUnit) {
          case 'days':
            shouldInclude = daysDiff % pattern.customInterval === 0;
            break;
          case 'weeks':
            shouldInclude = Math.floor(daysDiff / 7) % pattern.customInterval === 0;
            break;
          case 'months':
            const monthsDiff = (currentDate.getFullYear() - new Date(pattern.startDate).getFullYear()) * 12 + 
                             (currentDate.getMonth() - new Date(pattern.startDate).getMonth());
            shouldInclude = monthsDiff % pattern.customInterval === 0;
            break;
        }
        break;
    }
    
    // Apply skip options
    if (shouldInclude) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends if option is enabled
      if (pattern.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        shouldInclude = false;
      }
      
      // Skip holidays if option is enabled
      if (pattern.skipHolidays && isUSFederalHoliday(currentDate)) {
        shouldInclude = false;
      }
    }
    
    if (shouldInclude) {
      const occurrenceDateTime = new Date(currentDate);
      
      // Apply start time
      if (pattern.startTime) {
        const [hours, minutes] = pattern.startTime.split(':').map(Number);
        occurrenceDateTime.setHours(hours, minutes, 0, 0);
      }
      
      occurrences.push({
        date: new Date(occurrenceDateTime),
        scheduledDate: currentDate.toISOString().split('T')[0],
        scheduledTime: pattern.startTime,
        duration: pattern.duration
      });
      
      count++;
    }
    
    // Move to next day for evaluation
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return occurrences;
};

// Method to update generation tracking
recurringTripSchema.methods.updateGenerationTracking = function(generatedCount) {
  this.lastGenerated = new Date();
  this.totalTripsGenerated += generatedCount;
  this.currentOccurrences += generatedCount;
  
  // Calculate next generation date (usually next day for daily check)
  this.nextGeneration = new Date();
  this.nextGeneration.setDate(this.nextGeneration.getDate() + 1);
  
  return this.save();
};

// Static method to find patterns ready for generation
recurringTripSchema.statics.findReadyForGeneration = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null }
    ],
    $or: [
      { nextGeneration: { $lte: now } },
      { nextGeneration: null }
    ],
    $or: [
      { maxOccurrences: null },
      { $expr: { $lt: ['$currentOccurrences', '$maxOccurrences'] } }
    ]
  });
};

// Pre-save middleware to set computed fields
recurringTripSchema.pre('save', function(next) {
  // Set status based on dates and conditions
  const now = new Date();
  const startDate = new Date(this.startDate);
  const endDate = this.endDate ? new Date(this.endDate) : null;
  
  if (!this.isActive) {
    this.status = 'inactive';
  } else if (now < startDate) {
    this.status = 'active'; // Will be pending until start date
  } else if (endDate && now > endDate) {
    this.status = 'completed';
  } else if (this.maxOccurrences && this.currentOccurrences >= this.maxOccurrences) {
    this.status = 'completed';
  } else {
    this.status = 'active';
  }
  
  // Set next generation if not set
  if (!this.nextGeneration) {
    this.nextGeneration = new Date();
  }
  
  next();
});

const RecurringTrip = mongoose.model('RecurringTrip', recurringTripSchema);

export default RecurringTrip;