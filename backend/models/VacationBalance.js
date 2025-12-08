import mongoose from 'mongoose';

const vacationBalanceSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  year: {
    type: Number,
    required: true
  },
  totalAllocation: {
    type: Number,
    required: true,
    default: 15 // days per year
  },
  used: {
    type: Number,
    default: 0
  },
  pending: {
    type: Number,
    default: 0
  },
  available: {
    type: Number,
    default: 15
  },
  carryoverFromPreviousYear: {
    type: Number,
    default: 0
  },
  maxCarryover: {
    type: Number,
    default: 5
  },
  history: [{
    date: Date,
    type: {
      type: String,
      enum: ['used', 'added', 'adjusted', 'expired']
    },
    amount: Number,
    reason: String,
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOff'
    }
  }],
  sickDaysAllocation: {
    type: Number,
    default: 10
  },
  sickDaysUsed: {
    type: Number,
    default: 0
  },
  sickDaysAvailable: {
    type: Number,
    default: 10
  },
  personalDaysAllocation: {
    type: Number,
    default: 3
  },
  personalDaysUsed: {
    type: Number,
    default: 0
  },
  personalDaysAvailable: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true
});

// Calculate available before save
vacationBalanceSchema.pre('save', function(next) {
  this.available = this.totalAllocation + this.carryoverFromPreviousYear - this.used - this.pending;
  this.sickDaysAvailable = this.sickDaysAllocation - this.sickDaysUsed;
  this.personalDaysAvailable = this.personalDaysAllocation - this.personalDaysUsed;
  next();
});

// Method to use vacation days
vacationBalanceSchema.methods.useVacationDays = function(days, requestId) {
  if (this.available < days) {
    throw new Error('Insufficient vacation balance');
  }
  
  this.used += days;
  this.history.push({
    date: new Date(),
    type: 'used',
    amount: days,
    reason: 'Vacation time-off approved',
    relatedRequest: requestId
  });
  
  return this.save();
};

// Method to use sick days
vacationBalanceSchema.methods.useSickDays = function(days, requestId) {
  if (this.sickDaysAvailable < days) {
    throw new Error('Insufficient sick days balance');
  }
  
  this.sickDaysUsed += days;
  this.history.push({
    date: new Date(),
    type: 'used',
    amount: days,
    reason: 'Sick time-off approved',
    relatedRequest: requestId
  });
  
  return this.save();
};

// Method to add pending time off
vacationBalanceSchema.methods.addPending = function(days) {
  this.pending += days;
  return this.save();
};

// Method to remove pending time off
vacationBalanceSchema.methods.removePending = function(days) {
  this.pending = Math.max(0, this.pending - days);
  return this.save();
};

// Method to adjust balance
vacationBalanceSchema.methods.adjustBalance = function(amount, reason) {
  this.totalAllocation += amount;
  this.history.push({
    date: new Date(),
    type: 'adjusted',
    amount,
    reason
  });
  return this.save();
};

// Static method to initialize balances for new year
vacationBalanceSchema.statics.initializeNewYear = async function(year) {
  const User = mongoose.model('User');
  const drivers = await User.find({ roles: 'driver' });
  
  const results = [];
  for (const driver of drivers) {
    // Get previous year balance
    const prevBalance = await this.findOne({ driver: driver._id, year: year - 1 });
    
    let carryover = 0;
    if (prevBalance) {
      const remaining = prevBalance.available;
      carryover = Math.min(remaining, prevBalance.maxCarryover);
    }
    
    const newBalance = await this.create({
      driver: driver._id,
      year,
      totalAllocation: 15,
      carryoverFromPreviousYear: carryover
    });
    
    results.push(newBalance);
  }
  
  return results;
};

// Static method to expire old carryovers
vacationBalanceSchema.statics.expireCarryovers = async function(year) {
  const balances = await this.find({ 
    year,
    carryoverFromPreviousYear: { $gt: 0 }
  });
  
  const expireDate = new Date(year, 3, 1); // April 1st
  const now = new Date();
  
  if (now >= expireDate) {
    const results = [];
    for (const balance of balances) {
      const expired = balance.carryoverFromPreviousYear;
      balance.carryoverFromPreviousYear = 0;
      balance.history.push({
        date: now,
        type: 'expired',
        amount: -expired,
        reason: 'Carryover days expired (not used by April 1st)'
      });
      await balance.save();
      results.push(balance);
    }
    return results;
  }
  
  return [];
};

const VacationBalance = mongoose.model('VacationBalance', vacationBalanceSchema);
export default VacationBalance;
