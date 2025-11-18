import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  riderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  preferredVehicleType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  // Service Balance
  serviceBalance: {
    type: {
      type: String,
      enum: ['trips', 'dollars'],
      default: 'trips'
    },
    tripCount: {
      type: Number,
      default: 0
    },
    dollarAmount: {
      type: Number,
      default: 0
    },
    originalTripCount: {
      type: Number,
      default: 0
    },
    originalDollarAmount: {
      type: Number,
      default: 0
    }
  },
  // Contract Management
  contractDetails: {
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    createdAt: Date
  },
  // Pricing & Mileage
  pricingDetails: {
    pricePerRide: {
      type: Number,
      default: 15.00
    },
    pricePerMile: {
      type: Number,
      default: 0.50
    }
  },
  mileageBalance: {
    currentBalance: {
      type: Number,
      default: 0
    },
    originalBalance: {
      type: Number,
      default: 0
    },
    totalUsed: {
      type: Number,
      default: 0
    }
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching
riderSchema.index({ firstName: 1, lastName: 1 });
riderSchema.index({ riderId: 1 });
riderSchema.index({ phone: 1 });

const Rider = mongoose.model('Rider', riderSchema);

export default Rider;
