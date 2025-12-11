import mongoose from 'mongoose';

const driverPreferenceSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Availability preferences
  availability: {
    preferredShifts: [{
      dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      startTime: {
        type: String, // Format: "HH:MM"
        required: true
      },
      endTime: {
        type: String, // Format: "HH:MM"
        required: true
      },
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3 // 1 = lowest, 5 = highest preference
      }
    }],
    maxHoursPerDay: {
      type: Number,
      default: 10
    },
    maxHoursPerWeek: {
      type: Number,
      default: 40
    },
    minBreakBetweenTrips: {
      type: Number, // minutes
      default: 15
    },
    preferredStartLocation: {
      address: String,
      lat: Number,
      lng: Number,
      radius: {
        type: Number, // meters
        default: 5000
      }
    }
  },

  // Geographic preferences
  geographic: {
    preferredAreas: [{
      name: String,
      bounds: {
        northeast: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        },
        southwest: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        }
      },
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      },
      geofenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Geofence'
      }
    }],
    avoidAreas: [{
      name: String,
      bounds: {
        northeast: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        },
        southwest: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        }
      },
      reason: String,
      geofenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Geofence'
      }
    }],
    maxDistanceFromHome: {
      type: Number, // kilometers
      default: null // null means no restriction
    },
    preferLocalTrips: {
      type: Boolean,
      default: false
    },
    willingToTravelLongDistance: {
      type: Boolean,
      default: true
    }
  },

  // Trip type preferences
  tripPreferences: {
    preferredTripTypes: [{
      type: String,
      enum: ['scheduled', 'on-demand', 'recurring', 'group', 'long-distance', 'medical', 'airport', 'school'],
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    }],
    avoidTripTypes: [{
      type: String,
      enum: ['scheduled', 'on-demand', 'recurring', 'group', 'long-distance', 'medical', 'airport', 'school'],
      reason: String
    }],
    maxPassengers: {
      type: Number,
      default: 4
    },
    acceptWheelchair: {
      type: Boolean,
      default: false
    },
    acceptPets: {
      type: Boolean,
      default: false
    },
    acceptChildSeats: {
      type: Boolean,
      default: false
    },
    acceptLuggage: {
      type: Boolean,
      default: true
    },
    acceptGroupTrips: {
      type: Boolean,
      default: true
    },
    acceptMultiStop: {
      type: Boolean,
      default: true
    },
    maxStopsPerTrip: {
      type: Number,
      default: 5
    }
  },

  // Rider preferences
  riderPreferences: {
    preferredRiders: [{
      rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
      }
    }],
    avoidRiders: [{
      rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        required: true
      },
      blockedAt: {
        type: Date,
        default: Date.now
      }
    }],
    preferRidersWithHighRating: {
      type: Boolean,
      default: false
    },
    minRiderRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    preferRegularRiders: {
      type: Boolean,
      default: false // Prefer riders they've driven before
    }
  },

  // Language preferences
  languages: {
    primary: {
      type: String,
      default: 'en'
    },
    additional: [{
      type: String
    }],
    preferMatchingLanguage: {
      type: Boolean,
      default: false
    }
  },

  // Vehicle and route preferences
  vehiclePreferences: {
    preferHighwayDriving: {
      type: Boolean,
      default: true
    },
    preferCityDriving: {
      type: Boolean,
      default: true
    },
    avoidTolls: {
      type: Boolean,
      default: false
    },
    avoidHighways: {
      type: Boolean,
      default: false
    },
    preferEcoRoutes: {
      type: Boolean,
      default: false
    },
    preferFastestRoute: {
      type: Boolean,
      default: true
    }
  },

  // Compensation preferences
  compensation: {
    minimumTripFare: {
      type: Number,
      default: 0
    },
    preferredPaymentMethods: [{
      type: String,
      enum: ['cash', 'card', 'digital_wallet', 'corporate', 'voucher'],
      default: ['card', 'digital_wallet', 'cash']
    }],
    acceptCashTips: {
      type: Boolean,
      default: true
    },
    targetHourlyRate: {
      type: Number,
      default: null
    },
    targetDailyEarnings: {
      type: Number,
      default: null
    }
  },

  // Skill level and certifications
  skills: {
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    certifications: [{
      type: {
        type: String,
        enum: ['medical_transport', 'wheelchair_accessible', 'child_safety', 'defensive_driving', 'first_aid', 'cpr', 'hazmat', 'commercial_license']
      },
      number: String,
      issuedDate: Date,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    }],
    specialTraining: [{
      name: String,
      completedDate: Date,
      provider: String
    }],
    yearsOfExperience: {
      type: Number,
      default: 0
    }
  },

  // Performance preferences
  performance: {
    prioritizeRating: {
      type: Boolean,
      default: true // Prefer trips that help maintain/improve rating
    },
    prioritizeEfficiency: {
      type: Boolean,
      default: true // Prefer trips close to current location
    },
    acceptBackToBackTrips: {
      type: Boolean,
      default: true
    },
    preferPeakHours: {
      type: Boolean,
      default: false
    },
    preferOffPeakHours: {
      type: Boolean,
      default: false
    }
  },

  // Matching algorithm weights (for customizing how matches are scored)
  matchingWeights: {
    distance: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.25 // How important is proximity to current location
    },
    availability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.20 // How important is availability match
    },
    preferences: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.20 // How important are trip type preferences
    },
    rating: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.15 // How important is driver rating
    },
    efficiency: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.20 // How important is route efficiency
    }
  },

  // Auto-accept settings
  autoAccept: {
    enabled: {
      type: Boolean,
      default: false
    },
    conditions: {
      maxDistanceToPickup: {
        type: Number, // kilometers
        default: 5
      },
      minTripFare: {
        type: Number,
        default: 0
      },
      onlyPreferredAreas: {
        type: Boolean,
        default: false
      },
      onlyPreferredTripTypes: {
        type: Boolean,
        default: false
      },
      onlyDuringPreferredShifts: {
        type: Boolean,
        default: false
      },
      minRiderRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      }
    }
  },

  // Statistics (for learning and improving matches)
  statistics: {
    totalTripsAccepted: {
      type: Number,
      default: 0
    },
    totalTripsRejected: {
      type: Number,
      default: 0
    },
    acceptanceRate: {
      type: Number,
      default: 100
    },
    averageResponseTime: {
      type: Number, // seconds
      default: 0
    },
    preferredAreasTrips: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Notification preferences
  notifications: {
    newTripMatch: {
      type: Boolean,
      default: true
    },
    highPriorityMatch: {
      type: Boolean,
      default: true
    },
    preferredAreaTrip: {
      type: Boolean,
      default: true
    },
    preferredRiderTrip: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    vibrationEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
driverPreferenceSchema.index({ driver: 1 });
driverPreferenceSchema.index({ 'availability.preferredShifts.dayOfWeek': 1 });
driverPreferenceSchema.index({ 'geographic.preferredAreas.geofenceId': 1 });
driverPreferenceSchema.index({ 'skills.certifications.type': 1 });
driverPreferenceSchema.index({ isActive: 1 });

// Virtual for acceptance rate calculation
driverPreferenceSchema.virtual('calculatedAcceptanceRate').get(function() {
  const total = this.statistics.totalTripsAccepted + this.statistics.totalTripsRejected;
  if (total === 0) return 100;
  return (this.statistics.totalTripsAccepted / total) * 100;
});

// Methods
driverPreferenceSchema.methods.recordTripResponse = function(accepted, responseTime) {
  if (accepted) {
    this.statistics.totalTripsAccepted += 1;
  } else {
    this.statistics.totalTripsRejected += 1;
  }
  
  const total = this.statistics.totalTripsAccepted + this.statistics.totalTripsRejected;
  this.statistics.acceptanceRate = (this.statistics.totalTripsAccepted / total) * 100;
  
  // Update average response time
  if (this.statistics.averageResponseTime === 0) {
    this.statistics.averageResponseTime = responseTime;
  } else {
    this.statistics.averageResponseTime = 
      (this.statistics.averageResponseTime * (total - 1) + responseTime) / total;
  }
  
  this.statistics.lastUpdated = new Date();
  return this.save();
};

driverPreferenceSchema.methods.isAvailableAt = function(dateTime) {
  if (!this.isActive) return false;
  
  const date = new Date(dateTime);
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  return this.availability.preferredShifts.some(shift => {
    return shift.dayOfWeek === dayOfWeek && 
           timeStr >= shift.startTime && 
           timeStr <= shift.endTime;
  });
};

driverPreferenceSchema.methods.isInPreferredArea = function(location) {
  if (!this.geographic.preferredAreas || this.geographic.preferredAreas.length === 0) {
    return { inArea: true, priority: 3 }; // No preferences means all areas OK
  }
  
  for (const area of this.geographic.preferredAreas) {
    const inBounds = 
      location.lat >= area.bounds.southwest.lat &&
      location.lat <= area.bounds.northeast.lat &&
      location.lng >= area.bounds.southwest.lng &&
      location.lng <= area.bounds.northeast.lng;
    
    if (inBounds) {
      return { inArea: true, priority: area.priority, areaName: area.name };
    }
  }
  
  return { inArea: false, priority: 0 };
};

driverPreferenceSchema.methods.isInAvoidArea = function(location) {
  if (!this.geographic.avoidAreas || this.geographic.avoidAreas.length === 0) {
    return { inArea: false };
  }
  
  for (const area of this.geographic.avoidAreas) {
    const inBounds = 
      location.lat >= area.bounds.southwest.lat &&
      location.lat <= area.bounds.northeast.lat &&
      location.lng >= area.bounds.southwest.lng &&
      location.lng <= area.bounds.northeast.lng;
    
    if (inBounds) {
      return { inArea: true, areaName: area.name, reason: area.reason };
    }
  }
  
  return { inArea: false };
};

driverPreferenceSchema.methods.shouldAutoAccept = function(trip, distanceToPickup, fare) {
  if (!this.autoAccept.enabled) return false;
  
  const conditions = this.autoAccept.conditions;
  
  // Check distance
  if (distanceToPickup > conditions.maxDistanceToPickup) return false;
  
  // Check fare
  if (fare < conditions.minTripFare) return false;
  
  // Check if in preferred area (if required)
  if (conditions.onlyPreferredAreas) {
    const areaCheck = this.isInPreferredArea(trip.pickupLocation);
    if (!areaCheck.inArea) return false;
  }
  
  // Check rider rating (if available)
  if (trip.rider && trip.rider.rating < conditions.minRiderRating) return false;
  
  return true;
};

// Pre-save middleware
driverPreferenceSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

const DriverPreference = mongoose.model('DriverPreference', driverPreferenceSchema);

export default DriverPreference;
