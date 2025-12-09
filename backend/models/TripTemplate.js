import mongoose from 'mongoose';

const tripTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Template category
  category: {
    type: String,
    enum: ['medical', 'school', 'work', 'shopping', 'airport', 'custom'],
    default: 'custom'
  },
  
  // Route information
  pickupLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    notes: String
  },
  dropoffLocation: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    notes: String
  },
  
  // Multi-stop waypoints
  waypoints: [{
    sequence: {
      type: Number,
      required: true
    },
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      notes: String
    },
    stopType: {
      type: String,
      enum: ['pickup', 'dropoff', 'both', 'waypoint'],
      default: 'waypoint'
    },
    estimatedWaitTime: Number // minutes
  }],
  
  // Default settings
  defaultTripType: {
    type: String,
    enum: ['regular', 'medical', 'urgent', 'recurring'],
    default: 'regular'
  },
  estimatedDuration: Number, // minutes
  estimatedDistance: Number, // kilometers
  estimatedCost: Number,
  
  // Scheduling defaults
  preferredTimeSlots: [{
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      min: 0,
      max: 6
    },
    startTime: String, // HH:MM format
    endTime: String // HH:MM format
  }],
  
  // Special requirements
  specialInstructions: String,
  requiresWheelchair: {
    type: Boolean,
    default: false
  },
  requiresAssistance: {
    type: Boolean,
    default: false
  },
  maxPassengers: {
    type: Number,
    default: 1
  },
  
  // Template ownership and sharing
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'user', 'editor']
    }
  }],
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  
  // Template status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Tags for searching
  tags: [String],
  
  // Route optimization preferences
  routeOptimization: {
    enabled: {
      type: Boolean,
      default: true
    },
    algorithm: {
      type: String,
      enum: ['nearest_neighbor', 'google_maps', 'manual'],
      default: 'google_maps'
    }
  },
  
  // Recurring pattern (if template is for recurring trips)
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom']
    },
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    startDate: Date,
    endDate: Date,
    isIndefinite: {
      type: Boolean,
      default: false
    }
  },
  
  // Favorite/Bookmark
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Analytics
  analytics: {
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    totalTripsCreated: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
tripTemplateSchema.index({ createdBy: 1, isActive: 1 });
tripTemplateSchema.index({ category: 1, isActive: 1 });
tripTemplateSchema.index({ tags: 1 });
tripTemplateSchema.index({ isPublic: 1, isActive: 1 });
tripTemplateSchema.index({ 'pickupLocation.address': 'text', 'dropoffLocation.address': 'text', name: 'text', description: 'text' });

// Increment usage count before creating trip from template
tripTemplateSchema.methods.recordUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  this.analytics.totalTripsCreated += 1;
  await this.save();
};

// Add user to favorites
tripTemplateSchema.methods.addToFavorites = async function(userId) {
  if (!this.favoritedBy.includes(userId)) {
    this.favoritedBy.push(userId);
    await this.save();
  }
};

// Remove user from favorites
tripTemplateSchema.methods.removeFromFavorites = async function(userId) {
  this.favoritedBy = this.favoritedBy.filter(id => !id.equals(userId));
  await this.save();
};

export default mongoose.model('TripTemplate', tripTemplateSchema);
