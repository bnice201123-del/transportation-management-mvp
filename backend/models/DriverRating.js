import mongoose from 'mongoose';

const driverRatingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Overall rating (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Category ratings
  categoryRatings: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    },
    driving: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    vehicleCleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    routeEfficiency: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Review text
  review: {
    comment: String,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    language: String,
    translatedComment: String
  },

  // Compliments
  compliments: [{
    type: String,
    enum: [
      'excellent_driver',
      'great_conversation',
      'clean_vehicle',
      'on_time',
      'smooth_ride',
      'professional',
      'helpful',
      'friendly',
      'went_above_beyond',
      'safe_driver'
    ]
  }],

  // Concerns/Issues
  concerns: [{
    type: String,
    enum: [
      'late_pickup',
      'unsafe_driving',
      'rude_behavior',
      'dirty_vehicle',
      'wrong_route',
      'unprofessional',
      'poor_communication',
      'vehicle_issues',
      'uncomfortable_ride',
      'other'
    ]
  }],
  concernDetails: String,

  // Tips
  tip: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Rating context
  context: {
    tripDistance: Number,
    tripDuration: Number,
    timeOfDay: String,
    weather: String,
    passengerCount: Number,
    wasOnTime: Boolean,
    hadIssues: Boolean
  },

  // Response from driver
  driverResponse: {
    comment: String,
    respondedAt: Date,
    acknowledged: Boolean
  },

  // Verification
  verified: {
    type: Boolean,
    default: true
  },
  verificationMethod: String,

  // Moderation
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationAction: {
    type: String,
    enum: ['approved', 'hidden', 'removed', 'edited']
  },

  // Public visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Helpful votes (for public reviews)
  helpfulVotes: {
    type: Number,
    default: 0
  },
  notHelpfulVotes: {
    type: Number,
    default: 0
  },

  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  deviceInfo: String,
  ipAddress: String
}, {
  timestamps: true
});

// Indexes
driverRatingSchema.index({ driver: 1, submittedAt: -1 });
driverRatingSchema.index({ trip: 1 });
driverRatingSchema.index({ overallRating: 1 });
driverRatingSchema.index({ 'review.sentiment': 1 });
driverRatingSchema.index({ flagged: 1 });

// Pre-save middleware
driverRatingSchema.pre('save', function(next) {
  // Determine sentiment based on rating and review
  if (this.review.comment) {
    if (this.overallRating >= 4) {
      this.review.sentiment = 'positive';
    } else if (this.overallRating <= 2) {
      this.review.sentiment = 'negative';
    } else {
      this.review.sentiment = 'neutral';
    }
  }

  // Auto-flag suspicious reviews
  if (this.review.comment) {
    const suspiciousPatterns = /spam|fake|test|ignore/i;
    if (suspiciousPatterns.test(this.review.comment)) {
      this.flagged = true;
      this.flagReason = 'Suspicious content detected';
    }
  }

  next();
});

// Virtual for average category rating
driverRatingSchema.virtual('averageCategoryRating').get(function() {
  const ratings = Object.values(this.categoryRatings).filter(r => r !== undefined && r !== null);
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
});

// Methods
driverRatingSchema.methods.respond = function(responseComment, respondedBy) {
  this.driverResponse = {
    comment: responseComment,
    respondedAt: new Date(),
    acknowledged: true
  };
  return this.save();
};

driverRatingSchema.methods.flag = function(reason, moderator) {
  this.flagged = true;
  this.flagReason = reason;
  this.moderatedBy = moderator;
  this.moderatedAt = new Date();
  return this.save();
};

driverRatingSchema.methods.approve = function(moderator) {
  this.flagged = false;
  this.moderationAction = 'approved';
  this.moderatedBy = moderator;
  this.moderatedAt = new Date();
  return this.save();
};

driverRatingSchema.methods.hide = function(moderator, reason) {
  this.isPublic = false;
  this.moderationAction = 'hidden';
  this.moderatedBy = moderator;
  this.moderatedAt = new Date();
  this.flagReason = reason;
  return this.save();
};

const DriverRating = mongoose.model('DriverRating', driverRatingSchema);

export default DriverRating;
