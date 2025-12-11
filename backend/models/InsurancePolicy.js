import mongoose from 'mongoose';

const insurancePolicySchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  // Provider information
  provider: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    contactPerson: String,
    phoneNumber: String,
    email: String,
    website: String,
    apiKey: {
      type: String,
      select: false // Don't return in queries by default
    },
    apiEndpoint: String,
    lastSyncedAt: Date
  },

  // Policy details
  policyType: {
    type: String,
    enum: ['comprehensive', 'collision', 'liability', 'third_party', 'commercial', 'other'],
    required: true
  },
  coverageAmount: {
    type: Number,
    required: true
  },
  deductible: {
    type: Number,
    default: 0
  },
  premium: {
    amount: {
      type: Number,
      required: true
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi-annual', 'annual'],
      default: 'monthly'
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    autoRenew: {
      type: Boolean,
      default: true
    }
  },

  // Coverage details
  coverage: {
    bodilyInjury: {
      perPerson: Number,
      perAccident: Number
    },
    propertyDamage: Number,
    medicalPayments: Number,
    uninsuredMotorist: Boolean,
    comprehensiveCoverage: Boolean,
    collisionCoverage: Boolean,
    personalInjuryProtection: Boolean,
    rentalReimbursement: Boolean,
    roadsideAssistance: Boolean,
    gapInsurance: Boolean
  },

  // Policy dates
  effectiveDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  renewalDate: Date,

  // Driver information
  coveredDrivers: [{
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedDate: Date,
    driverRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],

  // Claims history
  claims: [{
    claimNumber: {
      type: String,
      required: true
    },
    dateOfIncident: {
      type: Date,
      required: true
    },
    dateFiled: {
      type: Date,
      default: Date.now
    },
    claimType: {
      type: String,
      enum: ['collision', 'comprehensive', 'liability', 'injury', 'theft', 'vandalism', 'other'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'denied', 'settled', 'closed'],
      default: 'pending'
    },
    description: String,
    location: {
      address: String,
      lat: Number,
      lng: Number
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    atFault: Boolean,
    estimatedAmount: Number,
    approvedAmount: Number,
    paidAmount: Number,
    deductiblePaid: Number,
    documents: [{
      type: String,
      description: String,
      uploadedAt: Date
    }],
    notes: String,
    settledDate: Date,
    closedDate: Date
  }],

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['policy_document', 'certificate', 'declaration_page', 'endorsement', 'claim_form', 'other'],
      required: true
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date
  }],

  // Status and notifications
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended', 'pending_renewal'],
    default: 'active'
  },
  notifications: {
    renewalReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBefore: {
        type: Number,
        default: 30
      },
      lastSent: Date
    },
    paymentReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBefore: {
        type: Number,
        default: 7
      },
      lastSent: Date
    },
    expirationAlert: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBefore: {
        type: Number,
        default: 14
      },
      lastSent: Date
    }
  },

  // API integration data
  apiData: {
    lastVerified: Date,
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'failed', 'not_verified'],
      default: 'not_verified'
    },
    externalId: String, // Provider's internal ID
    syncEnabled: {
      type: Boolean,
      default: false
    },
    lastSyncError: String
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
insurancePolicySchema.index({ vehicle: 1, status: 1 });
insurancePolicySchema.index({ expirationDate: 1 });
insurancePolicySchema.index({ 'provider.policyNumber': 1 });
insurancePolicySchema.index({ status: 1 });

// Virtual for days until expiration
insurancePolicySchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expirationDate) return null;
  const now = new Date();
  const diffTime = this.expirationDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total claims amount
insurancePolicySchema.virtual('totalClaimsAmount').get(function() {
  return this.claims.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0);
});

// Methods
insurancePolicySchema.methods.isExpiringSoon = function(days = 30) {
  const daysUntil = this.daysUntilExpiration;
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
};

insurancePolicySchema.methods.isExpired = function() {
  return this.expirationDate < new Date();
};

insurancePolicySchema.methods.needsPayment = function() {
  if (!this.premium.nextPaymentDate) return false;
  return this.premium.nextPaymentDate <= new Date();
};

insurancePolicySchema.methods.addClaim = function(claimData) {
  this.claims.push(claimData);
  return this.save();
};

insurancePolicySchema.methods.updateClaimStatus = function(claimNumber, status, updateData = {}) {
  const claim = this.claims.find(c => c.claimNumber === claimNumber);
  if (!claim) {
    throw new Error('Claim not found');
  }
  
  claim.status = status;
  Object.assign(claim, updateData);
  
  if (status === 'settled') {
    claim.settledDate = new Date();
  } else if (status === 'closed') {
    claim.closedDate = new Date();
  }
  
  return this.save();
};

// Pre-save middleware
insurancePolicySchema.pre('save', function(next) {
  // Auto-update status based on expiration
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Calculate renewal date (30 days before expiration)
  if (this.expirationDate && !this.renewalDate) {
    this.renewalDate = new Date(this.expirationDate);
    this.renewalDate.setDate(this.renewalDate.getDate() - 30);
  }
  
  next();
});

const InsurancePolicy = mongoose.model('InsurancePolicy', insurancePolicySchema);

export default InsurancePolicy;
