import mongoose from 'mongoose';

const maintenanceScheduleSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  // Schedule identification
  scheduleId: {
    type: String,
    unique: true,
    required: true
  },
  scheduleName: {
    type: String,
    required: true
  },
  
  // Schedule type
  scheduleType: {
    type: String,
    enum: ['preventive', 'inspection', 'repair', 'recall', 'custom'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },

  // Recurrence settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: {
      basedOn: {
        type: String,
        enum: ['mileage', 'time', 'both', 'condition'],
        default: 'time'
      },
      // Mileage-based recurrence
      mileageInterval: Number, // e.g., every 5000 miles
      mileageTolerance: {
        type: Number,
        default: 500 // +/- tolerance before alert
      },
      // Time-based recurrence
      timeInterval: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months', 'years']
        }
      },
      timeTolerance: {
        value: {
          type: Number,
          default: 7 // days
        },
        unit: {
          type: String,
          enum: ['days', 'weeks']
        }
      }
    },
    default: {}
  },

  // Next scheduled maintenance
  nextDue: {
    type: {
      date: Date,
      mileage: Number,
      estimatedDate: Date, // Calculated based on average usage
      daysUntilDue: Number,
      milesUntilDue: Number,
      isOverdue: {
        type: Boolean,
        default: false
      },
      overdueBy: {
        days: Number,
        miles: Number
      }
    },
    default: {}
  },

  // Last maintenance
  lastCompleted: {
    type: {
      date: Date,
      mileage: Number,
      maintenanceRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaintenanceRecord'
      }
    },
    default: {}
  },

  // Service details
  serviceDetails: {
    type: {
      category: {
        type: String,
        enum: ['engine', 'transmission', 'brakes', 'tires', 'electrical', 'hvac', 'body', 'interior', 'suspension', 'exhaust', 'fuel_system', 'cooling_system', 'fluids', 'filters', 'safety', 'other'],
        required: true
      },
      description: String,
      estimatedDuration: Number, // minutes
      estimatedCost: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      partsRequired: [{
        partName: String,
        partNumber: String,
        quantity: Number,
        estimatedCost: Number
      }],
      laborHours: Number,
      specialTools: [String],
      specialInstructions: String
    },
    default: {}
  },

  // Service provider preferences
  preferredProvider: {
    type: {
      name: String,
      type: {
        type: String,
        enum: ['in_house', 'dealership', 'independent_shop', 'mobile_mechanic', 'warranty_center']
      },
      address: String,
      phoneNumber: String,
      email: String,
      notes: String
    },
    default: {}
  },

  // Notifications
  notifications: {
    type: {
      enabled: {
        type: Boolean,
        default: true
      },
      recipients: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['admin', 'dispatcher', 'driver', 'mechanic']
        },
        email: String,
        phone: String
      }],
      reminderSchedule: [{
        type: {
          type: String,
          enum: ['days_before', 'miles_before', 'at_due', 'overdue'],
          required: true
        },
        value: Number, // Days or miles before due
        sent: {
          type: Boolean,
          default: false
        },
        sentAt: Date,
        channels: [{
          type: String,
          enum: ['email', 'sms', 'push', 'in_app']
        }]
      }],
      lastNotificationSent: Date
    },
    default: {
      enabled: true,
      recipients: [],
      reminderSchedule: []
    }
  },

  // History of scheduled instances
  history: [{
    scheduledDate: Date,
    scheduledMileage: Number,
    completedDate: Date,
    completedMileage: Number,
    maintenanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRecord'
    },
    status: {
      type: String,
      enum: ['completed', 'skipped', 'deferred', 'cancelled']
    },
    actualCost: Number,
    notes: String
  }],

  // Compliance and regulations
  compliance: {
    type: {
      isRegulatory: {
        type: Boolean,
        default: false
      },
      regulationType: {
        type: String,
        enum: ['dot', 'epa', 'osha', 'state', 'local', 'manufacturer', 'other']
      },
      regulationReference: String,
      certificateRequired: {
        type: Boolean,
        default: false
      },
      certificateExpiration: Date
    },
    default: {
      isRegulatory: false,
      certificateRequired: false
    }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled', 'suspended'],
    default: 'active'
  },
  statusReason: String,

  // Auto-scheduling
  autoSchedule: {
    type: {
      enabled: {
        type: Boolean,
        default: false
      },
      preferredDayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      preferredTimeSlot: {
        start: String, // HH:MM
        end: String
      },
      avoidDates: [Date], // Holidays or blackout dates
      bufferDays: {
        type: Number,
        default: 3 // Days of flexibility for scheduling
      }
    },
    default: {
      enabled: false,
      bufferDays: 3
    }
  },

  // Dependencies
  dependencies: {
    type: {
      prerequisiteMaintenance: [{
        scheduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MaintenanceSchedule'
        },
        description: String
      }],
      blockingMaintenance: [{
        scheduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MaintenanceSchedule'
        },
        description: String
      }]
    },
    default: {
      prerequisiteMaintenance: [],
      blockingMaintenance: []
    }
  },

  // Performance tracking
  performance: {
    type: {
      totalCompletions: {
        type: Number,
        default: 0
      },
      onTimeCompletions: {
        type: Number,
        default: 0
      },
      lateCompletions: {
        type: Number,
        default: 0
      },
      averageCost: Number,
      averageDelay: Number, // days
      lastCost: Number,
      costTrend: {
        type: String,
        enum: ['increasing', 'stable', 'decreasing']
      }
    },
    default: {
      totalCompletions: 0,
      onTimeCompletions: 0,
      lateCompletions: 0
    }
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
maintenanceScheduleSchema.index({ vehicle: 1, status: 1 });
maintenanceScheduleSchema.index({ 'nextDue.date': 1 });
maintenanceScheduleSchema.index({ 'nextDue.mileage': 1 });
maintenanceScheduleSchema.index({ 'nextDue.isOverdue': 1 });
maintenanceScheduleSchema.index({ status: 1 });

// Pre-save middleware to generate schedule ID
maintenanceScheduleSchema.pre('save', async function(next) {
  if (!this.scheduleId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.scheduleId = `SCH-${timestamp}-${random}`;
  }
  next();
});

// Methods
maintenanceScheduleSchema.methods.calculateNextDue = async function(currentMileage, averageDailyMiles = 50) {
  if (!this.isRecurring || !this.lastCompleted) return;

  const now = new Date();

  // Calculate based on mileage
  if (this.recurrence.basedOn === 'mileage' || this.recurrence.basedOn === 'both') {
    if (this.recurrence.mileageInterval && this.lastCompleted.mileage) {
      this.nextDue.mileage = this.lastCompleted.mileage + this.recurrence.mileageInterval;
      this.nextDue.milesUntilDue = this.nextDue.mileage - currentMileage;
      
      // Estimate date based on average daily miles
      if (averageDailyMiles > 0) {
        const daysUntilMileage = this.nextDue.milesUntilDue / averageDailyMiles;
        this.nextDue.estimatedDate = new Date(now.getTime() + daysUntilMileage * 24 * 60 * 60 * 1000);
      }
    }
  }

  // Calculate based on time
  if (this.recurrence.basedOn === 'time' || this.recurrence.basedOn === 'both') {
    if (this.recurrence.timeInterval && this.lastCompleted.date) {
      const interval = this.recurrence.timeInterval;
      const lastDate = new Date(this.lastCompleted.date);
      
      switch (interval.unit) {
        case 'days':
          this.nextDue.date = new Date(lastDate.getTime() + interval.value * 24 * 60 * 60 * 1000);
          break;
        case 'weeks':
          this.nextDue.date = new Date(lastDate.getTime() + interval.value * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          this.nextDue.date = new Date(lastDate);
          this.nextDue.date.setMonth(lastDate.getMonth() + interval.value);
          break;
        case 'years':
          this.nextDue.date = new Date(lastDate);
          this.nextDue.date.setFullYear(lastDate.getFullYear() + interval.value);
          break;
      }
      
      this.nextDue.daysUntilDue = Math.ceil((this.nextDue.date - now) / (24 * 60 * 60 * 1000));
    }
  }

  // Check if overdue
  this.nextDue.isOverdue = false;
  this.nextDue.overdueBy = { days: 0, miles: 0 };

  if (this.nextDue.date && now > this.nextDue.date) {
    this.nextDue.isOverdue = true;
    this.nextDue.overdueBy.days = Math.ceil((now - this.nextDue.date) / (24 * 60 * 60 * 1000));
  }

  if (this.nextDue.mileage && currentMileage > this.nextDue.mileage) {
    this.nextDue.isOverdue = true;
    this.nextDue.overdueBy.miles = currentMileage - this.nextDue.mileage;
  }

  return this.save();
};

maintenanceScheduleSchema.methods.markCompleted = async function(maintenanceRecordId, completedDate, completedMileage, actualCost) {
  // Add to history
  this.history.push({
    scheduledDate: this.nextDue.date,
    scheduledMileage: this.nextDue.mileage,
    completedDate,
    completedMileage,
    maintenanceRecordId,
    status: 'completed',
    actualCost,
    notes: `Completed ${this.nextDue.isOverdue ? 'overdue' : 'on time'}`
  });

  // Update last completed
  this.lastCompleted = {
    date: completedDate,
    mileage: completedMileage,
    maintenanceRecordId
  };

  // Update performance metrics
  this.performance.totalCompletions += 1;
  if (!this.nextDue.isOverdue) {
    this.performance.onTimeCompletions += 1;
  } else {
    this.performance.lateCompletions += 1;
  }

  if (actualCost) {
    this.performance.lastCost = actualCost;
    if (this.performance.averageCost) {
      this.performance.averageCost = (this.performance.averageCost * (this.performance.totalCompletions - 1) + actualCost) / this.performance.totalCompletions;
    } else {
      this.performance.averageCost = actualCost;
    }
  }

  // Reset notifications
  if (this.notifications.reminderSchedule) {
    this.notifications.reminderSchedule.forEach(reminder => {
      reminder.sent = false;
      reminder.sentAt = null;
    });
  }

  return this.save();
};

maintenanceScheduleSchema.methods.shouldNotify = function(type) {
  if (!this.notifications.enabled) return false;

  const reminder = this.notifications.reminderSchedule.find(r => r.type === type);
  return reminder && !reminder.sent;
};

maintenanceScheduleSchema.methods.markNotificationSent = function(type) {
  const reminder = this.notifications.reminderSchedule.find(r => r.type === type);
  if (reminder) {
    reminder.sent = true;
    reminder.sentAt = new Date();
    this.notifications.lastNotificationSent = new Date();
  }
  return this.save();
};

const MaintenanceSchedule = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);

export default MaintenanceSchedule;
