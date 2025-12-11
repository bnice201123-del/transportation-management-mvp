import mongoose from 'mongoose';

const fuelCardSchema = new mongoose.Schema({
  // Card information
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  cardNumberLast4: {
    type: String, // For display purposes
    required: true
  },
  cardProvider: {
    type: String,
    enum: ['shell', 'exxon', 'bp', 'chevron', 'speedway', 'wex', 'fleetcor', 'voyager', 'comdata', 'other'],
    required: true
  },
  cardType: {
    type: String,
    enum: ['fuel_only', 'fuel_and_maintenance', 'universal', 'fleet'],
    default: 'fuel_only'
  },

  // Assignment
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'lost', 'stolen', 'expired', 'cancelled'],
    default: 'active'
  },
  activationDate: Date,
  expirationDate: Date,

  // Limits and controls
  limits: {
    dailyTransactionLimit: {
      amount: Number,
      count: Number
    },
    weeklyLimit: Number,
    monthlyLimit: Number,
    perTransactionLimit: Number,
    gallonLimit: {
      perTransaction: Number,
      perDay: Number,
      perWeek: Number
    }
  },

  // Allowed purchases
  allowedPurchases: {
    fuel: {
      type: Boolean,
      default: true
    },
    oil: {
      type: Boolean,
      default: false
    },
    carWash: {
      type: Boolean,
      default: false
    },
    maintenance: {
      type: Boolean,
      default: false
    },
    convenience: {
      type: Boolean,
      default: false
    }
  },

  // Restrictions
  restrictions: {
    allowedStations: [String], // Brand or specific location restrictions
    blockedStations: [String],
    allowedFuelGrades: [{
      type: String,
      enum: ['regular', 'midgrade', 'premium', 'diesel', 'e85', 'ev_charging']
    }],
    geofenceRestrictions: [{
      geofence: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Geofence'
      },
      allowed: Boolean // true = only allowed in geofence, false = blocked in geofence
    }],
    timeRestrictions: [{
      dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM
      endTime: String
    }]
  },

  // API Integration
  apiIntegration: {
    enabled: {
      type: Boolean,
      default: false
    },
    apiKey: {
      type: String,
      select: false
    },
    apiEndpoint: String,
    accountNumber: String,
    externalCardId: String,
    lastSyncedAt: Date,
    syncFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'manual'],
      default: 'daily'
    },
    lastSyncError: String
  },

  // Transactions
  transactions: [{
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: Date,
      required: true
    },
    station: {
      name: String,
      address: String,
      location: {
        lat: Number,
        lng: Number
      },
      brand: String
    },
    fuelType: {
      type: String,
      enum: ['regular', 'midgrade', 'premium', 'diesel', 'e85', 'ev_charging', 'other']
    },
    quantity: {
      gallons: Number,
      liters: Number
    },
    pricePerUnit: Number,
    totalAmount: {
      type: Number,
      required: true
    },
    odometer: Number,
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    purchaseType: {
      type: String,
      enum: ['fuel', 'oil', 'car_wash', 'maintenance', 'convenience', 'other'],
      default: 'fuel'
    },
    receiptNumber: String,
    isAuthorized: {
      type: Boolean,
      default: true
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    notes: String,
    // Calculated fields
    mpg: Number, // Miles per gallon (calculated from odometer change)
    efficiency: Number // Cost per mile
  }],

  // Statistics
  statistics: {
    totalSpent: {
      type: Number,
      default: 0
    },
    currentMonthSpent: {
      type: Number,
      default: 0
    },
    currentWeekSpent: {
      type: Number,
      default: 0
    },
    todaySpent: {
      type: Number,
      default: 0
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalGallons: {
      type: Number,
      default: 0
    },
    averagePrice: {
      type: Number,
      default: 0
    },
    averageMPG: {
      type: Number,
      default: 0
    },
    lastTransactionDate: Date,
    lastTransactionAmount: Number
  },

  // Alerts and notifications
  alerts: [{
    type: {
      type: String,
      enum: ['suspicious_transaction', 'limit_exceeded', 'unusual_location', 'unusual_time', 'duplicate_transaction', 'high_price', 'low_mpg'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: Date,
    resolved: {
      type: Boolean,
      default: false
    },
    resolution: String
  }],

  // PIN/Security
  security: {
    pinRequired: {
      type: Boolean,
      default: true
    },
    pinHash: {
      type: String,
      select: false
    },
    odometerRequired: {
      type: Boolean,
      default: true
    },
    driverIdRequired: {
      type: Boolean,
      default: false
    },
    lastSecurityUpdate: Date
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
fuelCardSchema.index({ cardNumber: 1 });
fuelCardSchema.index({ vehicle: 1, status: 1 });
fuelCardSchema.index({ driver: 1, status: 1 });
fuelCardSchema.index({ status: 1 });
fuelCardSchema.index({ 'transactions.date': -1 });

// Virtual for card display (masked number)
fuelCardSchema.virtual('maskedCardNumber').get(function() {
  if (!this.cardNumber) return '';
  return `****-****-****-${this.cardNumberLast4}`;
});

// Methods
fuelCardSchema.methods.addTransaction = async function(transactionData) {
  // Check if transaction already exists
  const existingTx = this.transactions.find(
    tx => tx.transactionId === transactionData.transactionId
  );
  
  if (existingTx) {
    throw new Error('Transaction already exists');
  }

  // Check limits
  if (this.limits.perTransactionLimit && transactionData.totalAmount > this.limits.perTransactionLimit) {
    this.alerts.push({
      type: 'limit_exceeded',
      transaction: transactionData.transactionId,
      description: `Transaction amount ${transactionData.totalAmount} exceeds limit ${this.limits.perTransactionLimit}`,
      severity: 'high'
    });
  }

  // Add transaction
  this.transactions.push(transactionData);

  // Update statistics
  this.statistics.totalSpent += transactionData.totalAmount;
  this.statistics.totalTransactions += 1;
  if (transactionData.quantity?.gallons) {
    this.statistics.totalGallons += transactionData.quantity.gallons;
  }
  this.statistics.lastTransactionDate = transactionData.date;
  this.statistics.lastTransactionAmount = transactionData.totalAmount;

  // Recalculate averages
  if (this.statistics.totalTransactions > 0) {
    this.statistics.averagePrice = this.statistics.totalSpent / this.statistics.totalGallons || 0;
  }

  return this.save();
};

fuelCardSchema.methods.flagTransaction = function(transactionId, reason) {
  const transaction = this.transactions.id(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  transaction.isFlagged = true;
  transaction.flagReason = reason;
  
  return this.save();
};

fuelCardSchema.methods.checkDailyLimit = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTransactions = this.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0);
    return txDate.getTime() === today.getTime();
  });

  const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  this.statistics.todaySpent = todayTotal;

  if (this.limits.dailyTransactionLimit?.amount && todayTotal >= this.limits.dailyTransactionLimit.amount) {
    return {
      exceeded: true,
      currentSpent: todayTotal,
      limit: this.limits.dailyTransactionLimit.amount,
      remaining: 0
    };
  }

  return {
    exceeded: false,
    currentSpent: todayTotal,
    limit: this.limits.dailyTransactionLimit?.amount || null,
    remaining: this.limits.dailyTransactionLimit?.amount ? this.limits.dailyTransactionLimit.amount - todayTotal : null
  };
};

fuelCardSchema.methods.calculateMPG = function(currentOdometer, previousOdometer, gallons) {
  if (!currentOdometer || !previousOdometer || !gallons) return null;
  
  const miles = currentOdometer - previousOdometer;
  return miles / gallons;
};

fuelCardSchema.methods.isExpiringSoon = function(days = 30) {
  if (!this.expirationDate) return false;
  
  const now = new Date();
  const diffTime = this.expirationDate - now;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return daysUntil >= 0 && daysUntil <= days;
};

// Pre-save middleware
fuelCardSchema.pre('save', function(next) {
  // Auto-update status if expired
  if (this.expirationDate && this.expirationDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Set last4 from card number if not set
  if (this.cardNumber && !this.cardNumberLast4) {
    this.cardNumberLast4 = this.cardNumber.slice(-4);
  }
  
  next();
});

const FuelCard = mongoose.model('FuelCard', fuelCardSchema);

export default FuelCard;
