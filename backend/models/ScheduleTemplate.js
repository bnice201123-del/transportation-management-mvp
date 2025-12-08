import mongoose from 'mongoose';

const scheduleTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  category: {
    type: String,
    enum: ['shift', 'weekly', 'monthly', 'seasonal', 'custom'],
    default: 'custom'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pattern: {
    // Weekly pattern
    monday: {
      enabled: Boolean,
      shifts: [{
        startTime: String, // "08:00"
        endTime: String,   // "16:00"
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    tuesday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    wednesday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    thursday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    friday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    saturday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    },
    sunday: {
      enabled: Boolean,
      shifts: [{
        startTime: String,
        endTime: String,
        shiftType: String,
        breaks: [{
          startTime: String,
          duration: Number
        }]
      }]
    }
  },
  defaultLocation: String,
  defaultVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  applicableRoles: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date
}, {
  timestamps: true
});

// Method to apply template to driver
scheduleTemplateSchema.methods.applyToDriver = async function(driverId, startDate, endDate) {
  const Schedule = mongoose.model('Schedule');
  const schedules = [];
  
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);
  
  while (currentDate <= finalDate) {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
    const dayPattern = this.pattern[dayName];
    
    if (dayPattern && dayPattern.enabled && dayPattern.shifts) {
      for (const shift of dayPattern.shifts) {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        const shiftStart = new Date(currentDate);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        
        const shiftEnd = new Date(currentDate);
        shiftEnd.setHours(endHour, endMinute, 0, 0);
        
        // Handle shifts that cross midnight
        if (shiftEnd < shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }
        
        const schedule = {
          driver: driverId,
          startTime: shiftStart,
          endTime: shiftEnd,
          shiftType: shift.shiftType || 'morning',
          location: this.defaultLocation,
          vehicle: this.defaultVehicle,
          breaks: shift.breaks ? shift.breaks.map(b => ({
            startTime: b.startTime,
            duration: b.duration,
            type: 'rest'
          })) : [],
          templateName: this.name,
          createdBy: this.createdBy
        };
        
        schedules.push(schedule);
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Create all schedules
  const created = await Schedule.insertMany(schedules);
  
  // Update usage stats
  this.usageCount++;
  this.lastUsed = new Date();
  await this.save();
  
  return created;
};

// Static method for predefined templates
scheduleTemplateSchema.statics.getPredefinedTemplates = function() {
  return [
    {
      name: 'Standard 40-Hour Week',
      description: 'Monday-Friday, 8am-5pm with 1-hour lunch',
      category: 'weekly',
      pattern: {
        monday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        tuesday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        wednesday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        thursday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        friday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        saturday: { enabled: false, shifts: [] },
        sunday: { enabled: false, shifts: [] }
      }
    },
    {
      name: '3-Shift Rotation',
      description: 'Rotating morning, afternoon, and night shifts',
      category: 'shift',
      pattern: {
        monday: {
          enabled: true,
          shifts: [{
            startTime: '06:00',
            endTime: '14:00',
            shiftType: 'morning',
            breaks: [{ startTime: '10:00', duration: 30 }]
          }]
        },
        tuesday: {
          enabled: true,
          shifts: [{
            startTime: '14:00',
            endTime: '22:00',
            shiftType: 'afternoon',
            breaks: [{ startTime: '18:00', duration: 30 }]
          }]
        },
        wednesday: {
          enabled: true,
          shifts: [{
            startTime: '22:00',
            endTime: '06:00',
            shiftType: 'night',
            breaks: [{ startTime: '02:00', duration: 30 }]
          }]
        },
        thursday: {
          enabled: true,
          shifts: [{
            startTime: '06:00',
            endTime: '14:00',
            shiftType: 'morning',
            breaks: [{ startTime: '10:00', duration: 30 }]
          }]
        },
        friday: {
          enabled: true,
          shifts: [{
            startTime: '14:00',
            endTime: '22:00',
            shiftType: 'afternoon',
            breaks: [{ startTime: '18:00', duration: 30 }]
          }]
        },
        saturday: { enabled: false, shifts: [] },
        sunday: { enabled: false, shifts: [] }
      }
    },
    {
      name: 'Weekend Warrior',
      description: 'Saturday and Sunday shifts only',
      category: 'weekly',
      pattern: {
        monday: { enabled: false, shifts: [] },
        tuesday: { enabled: false, shifts: [] },
        wednesday: { enabled: false, shifts: [] },
        thursday: { enabled: false, shifts: [] },
        friday: { enabled: false, shifts: [] },
        saturday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '18:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        },
        sunday: {
          enabled: true,
          shifts: [{
            startTime: '08:00',
            endTime: '18:00',
            shiftType: 'morning',
            breaks: [{ startTime: '12:00', duration: 60 }]
          }]
        }
      }
    }
  ];
};

const ScheduleTemplate = mongoose.model('ScheduleTemplate', scheduleTemplateSchema);
export default ScheduleTemplate;
