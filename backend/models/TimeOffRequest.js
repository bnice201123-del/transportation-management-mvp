import mongoose from 'mongoose';

const timeOffRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for querying by user and date range
timeOffRequestSchema.index({ userId: 1, startDate: 1, endDate: 1 });
timeOffRequestSchema.index({ status: 1, requestedAt: -1 });

// Virtual for duration in days
timeOffRequestSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

// Method to check if date range overlaps with existing approved requests
timeOffRequestSchema.statics.hasOverlap = async function(userId, startDate, endDate, excludeId = null) {
  const query = {
    userId,
    status: 'approved',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const count = await this.countDocuments(query);
  return count > 0;
};

const TimeOffRequest = mongoose.model('TimeOffRequest', timeOffRequestSchema);

export default TimeOffRequest;
