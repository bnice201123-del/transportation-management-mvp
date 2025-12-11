import mongoose from 'mongoose';

const driverPerformanceSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Time period for this performance record
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // Overall performance score (0-100)
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Trip statistics
  trips: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    },
    cancelledByDriver: {
      type: Number,
      default: 0
    },
    noShow: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },

  // Punctuality metrics
  punctuality: {
    onTimePickups: {
      type: Number,
      default: 0
    },
    latePickups: {
      type: Number,
      default: 0
    },
    earlyPickups: {
      type: Number,
      default: 0
    },
    onTimeDropoffs: {
      type: Number,
      default: 0
    },
    lateDropoffs: {
      type: Number,
      default: 0
    },
    averagePickupDelay: Number, // minutes
    averageDropoffDelay: Number,
    punctualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Customer satisfaction
  customerSatisfaction: {
    totalRatings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    fiveStarRatings: {
      type: Number,
      default: 0
    },
    fourStarRatings: {
      type: Number,
      default: 0
    },
    threeStarRatings: {
      type: Number,
      default: 0
    },
    twoStarRatings: {
      type: Number,
      default: 0
    },
    oneStarRatings: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    positiveReviews: {
      type: Number,
      default: 0
    },
    negativeReviews: {
      type: Number,
      default: 0
    },
    compliments: {
      type: Number,
      default: 0
    },
    complaints: {
      type: Number,
      default: 0
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Safety metrics
  safety: {
    incidents: {
      type: Number,
      default: 0
    },
    accidents: {
      type: Number,
      default: 0
    },
    atFaultAccidents: {
      type: Number,
      default: 0
    },
    violations: {
      type: Number,
      default: 0
    },
    speedingIncidents: {
      type: Number,
      default: 0
    },
    hardBraking: {
      type: Number,
      default: 0
    },
    rapidAcceleration: {
      type: Number,
      default: 0
    },
    harshCornering: {
      type: Number,
      default: 0
    },
    seatbeltViolations: {
      type: Number,
      default: 0
    },
    distractedDrivingIncidents: {
      type: Number,
      default: 0
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    daysWithoutIncident: {
      type: Number,
      default: 0
    }
  },

  // Efficiency metrics
  efficiency: {
    totalMiles: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    activeHours: {
      type: Number,
      default: 0
    },
    idleHours: {
      type: Number,
      default: 0
    },
    averageSpeed: Number,
    fuelEfficiency: Number, // MPG
    deadheadMiles: Number, // Miles without passengers
    deadheadPercentage: Number,
    tripsPerHour: Number,
    milesPerTrip: Number,
    efficiencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Reliability metrics
  reliability: {
    scheduledShifts: {
      type: Number,
      default: 0
    },
    completedShifts: {
      type: Number,
      default: 0
    },
    missedShifts: {
      type: Number,
      default: 0
    },
    lateToShift: {
      type: Number,
      default: 0
    },
    leftEarly: {
      type: Number,
      default: 0
    },
    callOuts: {
      type: Number,
      default: 0
    },
    noCallNoShow: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 0
    },
    reliabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Communication metrics
  communication: {
    responseTime: Number, // Average seconds to respond
    messagesResponded: {
      type: Number,
      default: 0
    },
    messagesIgnored: {
      type: Number,
      default: 0
    },
    dispatcherRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Vehicle care
  vehicleCare: {
    preInspectionCompleted: {
      type: Number,
      default: 0
    },
    preInspectionSkipped: {
      type: Number,
      default: 0
    },
    postInspectionCompleted: {
      type: Number,
      default: 0
    },
    postInspectionSkipped: {
      type: Number,
      default: 0
    },
    damageReported: {
      type: Number,
      default: 0
    },
    maintenanceIssuesReported: {
      type: Number,
      default: 0
    },
    vehicleCleanliness: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    vehicleCareScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Revenue and earnings
  revenue: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    tips: {
      type: Number,
      default: 0
    },
    bonuses: {
      type: Number,
      default: 0
    },
    penalties: {
      type: Number,
      default: 0
    },
    revenuePerHour: Number,
    revenuePerTrip: Number,
    revenuePerMile: Number
  },

  // Compliance
  compliance: {
    hoursWorked: Number,
    overtimeHours: Number,
    breakViolations: {
      type: Number,
      default: 0
    },
    maxHoursViolations: {
      type: Number,
      default: 0
    },
    documentationIssues: {
      type: Number,
      default: 0
    },
    policyViolations: {
      type: Number,
      default: 0
    },
    complianceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },

  // Rankings and comparisons
  rankings: {
    overallRank: Number,
    totalDrivers: Number,
    percentile: Number, // 0-100
    topPerformer: {
      type: Boolean,
      default: false
    },
    improvementNeeded: {
      type: Boolean,
      default: false
    }
  },

  // Goals and targets
  goals: [{
    metric: String,
    target: Number,
    current: Number,
    achieved: Boolean,
    progress: Number // percentage
  }],

  // Achievements and badges
  achievements: [{
    badgeId: String,
    badgeName: String,
    badgeIcon: String,
    description: String,
    earnedAt: Date,
    category: String
  }],

  // Performance trends
  trends: {
    overallTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    },
    punctualityTrend: String,
    safetyTrend: String,
    satisfactionTrend: String,
    efficiencyTrend: String
  },

  // Areas of excellence
  strengths: [String],

  // Areas needing improvement
  improvements: [String],

  // Manager notes
  managerNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,

  // Automated vs manual calculation
  isAutomated: {
    type: Boolean,
    default: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
driverPerformanceSchema.index({ driver: 1, period: 1, startDate: 1 });
driverPerformanceSchema.index({ driver: 1, overallScore: -1 });
driverPerformanceSchema.index({ period: 1, startDate: 1, endDate: 1 });

// Methods
driverPerformanceSchema.methods.calculateOverallScore = function() {
  const weights = {
    punctuality: 0.15,
    customerSatisfaction: 0.25,
    safety: 0.25,
    efficiency: 0.15,
    reliability: 0.10,
    communication: 0.05,
    vehicleCare: 0.05
  };

  this.overallScore = (
    this.punctuality.punctualityScore * weights.punctuality +
    this.customerSatisfaction.satisfactionScore * weights.customerSatisfaction +
    this.safety.safetyScore * weights.safety +
    this.efficiency.efficiencyScore * weights.efficiency +
    this.reliability.reliabilityScore * weights.reliability +
    this.communication.communicationScore * weights.communication +
    this.vehicleCare.vehicleCareScore * weights.vehicleCare
  );

  return this.overallScore;
};

driverPerformanceSchema.methods.calculateTrend = function(previousPerformance) {
  if (!previousPerformance) {
    this.trends.overallTrend = 'stable';
    return;
  }

  const scoreDiff = this.overallScore - previousPerformance.overallScore;
  
  if (scoreDiff >= 5) {
    this.trends.overallTrend = 'improving';
  } else if (scoreDiff <= -5) {
    this.trends.overallTrend = 'declining';
  } else {
    this.trends.overallTrend = 'stable';
  }

  // Calculate specific trends
  this.trends.punctualityTrend = this.getTrendDirection(
    this.punctuality.punctualityScore,
    previousPerformance.punctuality.punctualityScore
  );
  this.trends.safetyTrend = this.getTrendDirection(
    this.safety.safetyScore,
    previousPerformance.safety.safetyScore
  );
  this.trends.satisfactionTrend = this.getTrendDirection(
    this.customerSatisfaction.satisfactionScore,
    previousPerformance.customerSatisfaction.satisfactionScore
  );
  this.trends.efficiencyTrend = this.getTrendDirection(
    this.efficiency.efficiencyScore,
    previousPerformance.efficiency.efficiencyScore
  );
};

driverPerformanceSchema.methods.getTrendDirection = function(current, previous) {
  const diff = current - previous;
  if (diff >= 3) return 'improving';
  if (diff <= -3) return 'declining';
  return 'stable';
};

driverPerformanceSchema.methods.identifyStrengthsAndImprovements = function() {
  const scores = {
    'Punctuality': this.punctuality.punctualityScore,
    'Customer Satisfaction': this.customerSatisfaction.satisfactionScore,
    'Safety': this.safety.safetyScore,
    'Efficiency': this.efficiency.efficiencyScore,
    'Reliability': this.reliability.reliabilityScore,
    'Communication': this.communication.communicationScore,
    'Vehicle Care': this.vehicleCare.vehicleCareScore
  };

  // Strengths: scores >= 85
  this.strengths = Object.entries(scores)
    .filter(([_, score]) => score >= 85)
    .map(([area, _]) => area);

  // Improvements: scores < 70
  this.improvements = Object.entries(scores)
    .filter(([_, score]) => score < 70)
    .map(([area, _]) => area);
};

driverPerformanceSchema.methods.checkGoals = function() {
  this.goals.forEach(goal => {
    goal.progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    goal.achieved = goal.current >= goal.target;
  });
};

const DriverPerformance = mongoose.model('DriverPerformance', driverPerformanceSchema);

export default DriverPerformance;
