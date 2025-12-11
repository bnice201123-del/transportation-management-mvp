import mongoose from 'mongoose';

const parkingLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  
  // Parking facility details
  facilityType: {
    type: String,
    enum: ['depot', 'public_lot', 'street_parking', 'private_garage', 'designated_spot', 'other'],
    default: 'other'
  },
  
  // Capacity
  capacity: {
    total: {
      type: Number,
      required: true
    },
    available: Number,
    reserved: {
      type: Number,
      default: 0
    }
  },
  
  // Parking spots for specific vehicles
  assignedVehicles: [{
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    spotNumber: String,
    assignedAt: Date
  }],
  
  // Operating hours
  operatingHours: {
    alwaysOpen: {
      type: Boolean,
      default: false
    },
    schedule: [{
      dayOfWeek: {
        type: Number, // 0-6
        required: true
      },
      openTime: String, // HH:MM
      closeTime: String // HH:MM
    }]
  },
  
  // Features
  features: [{
    type: String,
    enum: [
      'covered',
      'security_cameras',
      'lighting',
      'ev_charging',
      'wheelchair_accessible',
      'restrooms',
      'attended',
      'gated',
      'reserved_spaces'
    ]
  }],
  
  // Pricing
  pricing: {
    free: {
      type: Boolean,
      default: true
    },
    hourlyRate: Number,
    dailyRate: Number,
    monthlyRate: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Geofence for automatic detection
  geofence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence'
  },
  
  // Access control
  accessControl: {
    requiresPermit: {
      type: Boolean,
      default: false
    },
    authorizedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    authorizedVehicles: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }]
  },
  
  // Contact information
  contact: {
    phone: String,
    email: String,
    emergencyContact: String
  },
  
  // Notes and special instructions
  notes: String,
  specialInstructions: String,
  
  // Statistics
  statistics: {
    totalParkingEvents: {
      type: Number,
      default: 0
    },
    averageDuration: Number, // minutes
    lastUsed: Date,
    mostFrequentVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metadata: {
    photos: [String], // URLs
    tags: [String],
    externalId: String
  },
  
  // Ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }
}, {
  timestamps: true
});

// Indexes
parkingLocationSchema.index({ 'location.lat': 1, 'location.lng': 1 });
parkingLocationSchema.index({ facilityType: 1, isActive: 1 });
parkingLocationSchema.index({ createdBy: 1 });

// Virtual for occupancy rate
parkingLocationSchema.virtual('occupancyRate').get(function() {
  if (!this.capacity || !this.capacity.total) return 0;
  const occupied = this.capacity.total - (this.capacity.available || 0);
  return (occupied / this.capacity.total) * 100;
});

// Methods
parkingLocationSchema.methods.isAvailable = function() {
  if (!this.isActive || this.maintenanceMode) {
    return false;
  }

  if (this.capacity.available <= 0) {
    return false;
  }

  // Check operating hours
  if (!this.operatingHours.alwaysOpen) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todaySchedule = this.operatingHours.schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!todaySchedule) {
      return false;
    }

    if (currentTime < todaySchedule.openTime || currentTime > todaySchedule.closeTime) {
      return false;
    }
  }

  return true;
};

parkingLocationSchema.methods.recordParking = async function(vehicleId, duration) {
  this.statistics.totalParkingEvents += 1;
  this.statistics.lastUsed = new Date();
  
  // Update average duration
  if (this.statistics.averageDuration) {
    this.statistics.averageDuration = 
      (this.statistics.averageDuration * (this.statistics.totalParkingEvents - 1) + duration) / 
      this.statistics.totalParkingEvents;
  } else {
    this.statistics.averageDuration = duration;
  }

  if (this.capacity.available > 0) {
    this.capacity.available -= 1;
  }

  await this.save();
};

parkingLocationSchema.methods.releaseParking = async function() {
  if (this.capacity.available < this.capacity.total) {
    this.capacity.available += 1;
    await this.save();
  }
};

export default mongoose.model('ParkingLocation', parkingLocationSchema);
