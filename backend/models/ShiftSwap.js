import mongoose from 'mongoose';

const shiftSwapSchema = new mongoose.Schema({
  requestingDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  originalShift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  proposedShift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  swapType: {
    type: String,
    enum: ['one-way', 'mutual', 'open-offer'],
    default: 'one-way'
  },
  status: {
    type: String,
    enum: ['pending-driver', 'pending-admin', 'approved', 'denied', 'cancelled', 'expired'],
    default: 'pending-driver',
    index: true
  },
  reason: String,
  driverResponse: {
    status: {
      type: String,
      enum: ['accepted', 'declined']
    },
    timestamp: Date,
    notes: String
  },
  adminResponse: {
    status: {
      type: String,
      enum: ['approved', 'denied']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    notes: String
  },
  expiresAt: {
    type: Date,
    index: true
  },
  notificationsSent: [{
    type: String,
    sentAt: Date,
    recipient: String
  }],
  conflicts: [{
    type: String,
    description: String,
    severity: String
  }]
}, {
  timestamps: true
});

// Indexes
shiftSwapSchema.index({ requestingDriver: 1, status: 1 });
shiftSwapSchema.index({ targetDriver: 1, status: 1 });
shiftSwapSchema.index({ status: 1, expiresAt: 1 });

// Set expiration before save
shiftSwapSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Expire after 48 hours
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
  next();
});

// Method to check conflicts
shiftSwapSchema.methods.checkConflicts = async function() {
  const conflicts = [];
  const Schedule = mongoose.model('Schedule');

  // Check requesting driver's availability for proposed shift
  if (this.proposedShift) {
    const proposedSchedule = await Schedule.findById(this.proposedShift);
    
    if (proposedSchedule) {
      const driverConflicts = await Schedule.find({
        driver: this.requestingDriver,
        _id: { $ne: this.proposedShift },
        status: { $in: ['scheduled', 'confirmed'] },
        $or: [
          {
            startTime: { $lt: proposedSchedule.endTime },
            endTime: { $gt: proposedSchedule.startTime }
          }
        ]
      });

      if (driverConflicts.length > 0) {
        conflicts.push({
          type: 'schedule-conflict',
          description: 'Requesting driver has conflicting shifts',
          severity: 'high'
        });
      }
    }
  }

  // Check target driver's availability for original shift
  if (this.targetDriver) {
    const originalSchedule = await Schedule.findById(this.originalShift);
    
    if (originalSchedule) {
      const targetConflicts = await Schedule.find({
        driver: this.targetDriver,
        _id: { $ne: this.originalShift },
        status: { $in: ['scheduled', 'confirmed'] },
        $or: [
          {
            startTime: { $lt: originalSchedule.endTime },
            endTime: { $gt: originalSchedule.startTime }
          }
        ]
      });

      if (targetConflicts.length > 0) {
        conflicts.push({
          type: 'schedule-conflict',
          description: 'Target driver has conflicting shifts',
          severity: 'high'
        });
      }
    }
  }

  // Check time-off conflicts
  const TimeOff = mongoose.model('TimeOff');
  const originalSchedule = await Schedule.findById(this.originalShift);

  if (originalSchedule && this.targetDriver) {
    const timeOffConflicts = await TimeOff.find({
      driver: this.targetDriver,
      status: 'approved',
      $or: [
        {
          startDate: { $lt: originalSchedule.endTime },
          endDate: { $gt: originalSchedule.startTime }
        }
      ]
    });

    if (timeOffConflicts.length > 0) {
      conflicts.push({
        type: 'time-off-conflict',
        description: 'Target driver has approved time-off',
        severity: 'high'
      });
    }
  }

  return conflicts;
};

// Method to process swap
shiftSwapSchema.methods.processSwap = async function() {
  if (this.status !== 'approved') {
    throw new Error('Swap must be approved before processing');
  }

  const Schedule = mongoose.model('Schedule');
  
  const originalSchedule = await Schedule.findById(this.originalShift);
  const proposedSchedule = this.proposedShift ? await Schedule.findById(this.proposedShift) : null;

  if (!originalSchedule) {
    throw new Error('Original shift not found');
  }

  // Update original shift
  originalSchedule.driver = this.targetDriver;
  originalSchedule.notes = `Swapped with ${this.requestingDriver} on ${new Date().toLocaleDateString()}`;
  await originalSchedule.save();

  // Update proposed shift if mutual swap
  if (proposedSchedule) {
    proposedSchedule.driver = this.requestingDriver;
    proposedSchedule.notes = `Swapped with ${this.targetDriver} on ${new Date().toLocaleDateString()}`;
    await proposedSchedule.save();
  }

  return {
    originalShift: originalSchedule,
    proposedShift: proposedSchedule
  };
};

// Static method to find open swap offers
shiftSwapSchema.statics.findOpenOffers = async function() {
  const now = new Date();
  return this.find({
    swapType: 'open-offer',
    status: 'pending-driver',
    expiresAt: { $gt: now }
  }).populate('requestingDriver originalShift');
};

// Static method to expire old requests
shiftSwapSchema.statics.expireOldRequests = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: { $in: ['pending-driver', 'pending-admin'] },
      expiresAt: { $lte: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result;
};

const ShiftSwap = mongoose.model('ShiftSwap', shiftSwapSchema);
export default ShiftSwap;
