import mongoose from 'mongoose';

const driverOnboardingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Onboarding status
  onboardingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused', 'failed'],
    default: 'not_started',
    index: true
  },
  onboardingStartedAt: Date,
  onboardingCompletedAt: Date,
  currentStep: {
    type: Number,
    default: 0
  },
  totalSteps: {
    type: Number,
    default: 10
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Tutorial progress
  tutorial: {
    completed: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    completedAt: Date,
    steps: [{
      stepNumber: Number,
      stepId: String,
      stepName: String,
      completed: Boolean,
      completedAt: Date,
      timeSpent: Number, // seconds
      skipped: Boolean
    }],
    totalTimeSpent: Number, // seconds
    tutorialVersion: String,
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web']
    }
  },

  // Training modules
  training: {
    modulesCompleted: {
      type: Number,
      default: 0
    },
    modulesTotal: Number,
    modules: [{
      moduleId: String,
      moduleName: String,
      category: {
        type: String,
        enum: ['safety', 'customer_service', 'vehicle_operation', 'compliance', 'technology', 'emergency', 'company_policies']
      },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'failed', 'expired'],
        default: 'not_started'
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      startedAt: Date,
      completedAt: Date,
      expiresAt: Date, // For modules requiring renewal
      score: Number, // Test score if applicable
      passingScore: Number,
      attempts: {
        type: Number,
        default: 0
      },
      maxAttempts: Number,
      timeSpent: Number, // minutes
      certificateIssued: Boolean,
      certificateId: String,
      certificateUrl: String
    }],
    overallProgress: {
      type: Number,
      default: 0
    },
    lastActivityAt: Date
  },

  // Certifications
  certifications: [{
    certificationType: {
      type: String,
      enum: [
        'cdl_class_a',
        'cdl_class_b',
        'cdl_class_c',
        'passenger_endorsement',
        'hazmat_endorsement',
        'first_aid',
        'cpr',
        'defensive_driving',
        'wheelchair_lift_operation',
        'dot_physical',
        'drug_test',
        'custom'
      ],
      required: true
    },
    customName: String, // For custom certifications
    certificationNumber: String,
    issuingAuthority: String,
    issueDate: Date,
    expirationDate: Date,
    renewalReminderDays: {
      type: Number,
      default: 30
    },
    status: {
      type: String,
      enum: ['valid', 'expiring_soon', 'expired', 'suspended', 'revoked', 'pending'],
      default: 'valid'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    documentUrl: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    notes: String
  }],

  // Document verification
  documents: [{
    documentType: {
      type: String,
      enum: [
        'drivers_license',
        'social_security_card',
        'birth_certificate',
        'passport',
        'work_authorization',
        'vehicle_registration',
        'insurance_certificate',
        'medical_certificate',
        'background_check',
        'drug_test_result',
        'mvr_report',
        'reference_letter',
        'bank_info',
        'tax_form',
        'other'
      ],
      required: true
    },
    customType: String,
    documentNumber: String,
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    expirationDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired', 'needs_update'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String,
    notes: String,
    isRequired: {
      type: Boolean,
      default: false
    }
  }],

  // Background check
  backgroundCheck: {
    status: {
      type: String,
      enum: ['not_started', 'initiated', 'pending', 'in_progress', 'completed', 'failed', 'expired'],
      default: 'not_started'
    },
    provider: String, // e.g., "Checkr", "Sterling", "GoodHire"
    requestId: String,
    initiatedAt: Date,
    completedAt: Date,
    expiresAt: Date,
    result: {
      type: String,
      enum: ['clear', 'consider', 'suspended', 'not_applicable'],
      default: 'not_applicable'
    },
    reportUrl: String,
    checks: [{
      checkType: {
        type: String,
        enum: ['criminal', 'mvr', 'employment', 'education', 'reference', 'credit', 'drug_screening']
      },
      status: String,
      result: String,
      completedAt: Date,
      notes: String
    }],
    flags: [{
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String,
      dateReported: Date,
      resolved: Boolean,
      resolution: String
    }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  },

  // Emergency contacts
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    alternatePhone: String,
    email: String,
    address: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    notes: String
  }],

  // Driver handbook acknowledgment
  handbook: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    handbookVersion: String,
    acknowledgedAt: Date,
    ipAddress: String,
    signature: String, // Base64 encoded signature
    sections: [{
      sectionId: String,
      sectionName: String,
      read: Boolean,
      readAt: Date,
      quiz: {
        taken: Boolean,
        score: Number,
        passedAt: Date
      }
    }]
  },

  // Preferred routes and areas
  preferences: {
    preferredRoutes: [{
      routeName: String,
      routeId: String,
      startLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number], // [longitude, latitude]
        address: String
      },
      endLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number],
        address: String
      },
      reason: String
    }],
    preferredAreas: [{
      areaName: String,
      areaType: {
        type: String,
        enum: ['city', 'neighborhood', 'zip_code', 'radius', 'polygon']
      },
      centerPoint: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number]
      },
      radius: Number, // miles for radius type
      polygon: {
        type: {
          type: String,
          enum: ['Polygon']
        },
        coordinates: [[[Number]]] // GeoJSON polygon
      },
      zipCodes: [String],
      priority: {
        type: Number,
        default: 1
      }
    }],
    avoidAreas: [{
      areaName: String,
      reason: String,
      polygon: {
        type: {
          type: String,
          enum: ['Polygon']
        },
        coordinates: [[[Number]]]
      }
    }],
    maxDistanceFromHome: Number, // miles
    willingToRelocate: {
      type: Boolean,
      default: false
    },
    relocatableAreas: [String]
  },

  // Onboarding checklist
  checklist: [{
    itemId: String,
    itemName: String,
    category: String,
    required: Boolean,
    completed: Boolean,
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    notes: String
  }],

  // Approval workflow
  approval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'on_hold', 'needs_revision'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String,
    onHoldReason: String,
    revisionNotes: String,
    approvalHistory: [{
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      performedAt: Date,
      notes: String
    }]
  },

  // Notifications
  notifications: [{
    type: String,
    message: String,
    sentAt: Date,
    read: Boolean,
    readAt: Date
  }],

  // Metadata
  notes: String,
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
driverOnboardingSchema.index({ driver: 1, onboardingStatus: 1 });
driverOnboardingSchema.index({ 'backgroundCheck.status': 1 });
driverOnboardingSchema.index({ 'approval.status': 1 });
driverOnboardingSchema.index({ 'certifications.expirationDate': 1 });

// Geospatial indexes
driverOnboardingSchema.index({ 'preferences.preferredAreas.centerPoint': '2dsphere' });

// Pre-save middleware
driverOnboardingSchema.pre('save', function(next) {
  // Calculate completion percentage
  const totalItems = this.checklist.length;
  if (totalItems > 0) {
    const completedItems = this.checklist.filter(item => item.completed).length;
    this.completionPercentage = Math.round((completedItems / totalItems) * 100);
  }

  // Update onboarding status
  if (this.completionPercentage === 100 && this.onboardingStatus !== 'completed') {
    this.onboardingStatus = 'completed';
    this.onboardingCompletedAt = new Date();
  }

  // Update certification statuses
  const now = new Date();
  this.certifications.forEach(cert => {
    if (cert.expirationDate) {
      const daysUntilExpiration = Math.ceil((cert.expirationDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration < 0) {
        cert.status = 'expired';
      } else if (daysUntilExpiration <= cert.renewalReminderDays) {
        cert.status = 'expiring_soon';
      } else if (cert.status !== 'suspended' && cert.status !== 'revoked') {
        cert.status = 'valid';
      }
    }
  });

  // Update document verification statuses
  this.documents.forEach(doc => {
    if (doc.expirationDate && doc.verificationStatus === 'verified') {
      const daysUntilExpiration = Math.ceil((doc.expirationDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiration < 0) {
        doc.verificationStatus = 'expired';
      }
    }
  });

  // Calculate training progress
  if (this.training.modules.length > 0) {
    this.training.modulesTotal = this.training.modules.length;
    this.training.modulesCompleted = this.training.modules.filter(m => m.status === 'completed').length;
    
    const totalProgress = this.training.modules.reduce((sum, m) => sum + m.progress, 0);
    this.training.overallProgress = Math.round(totalProgress / this.training.modules.length);
  }

  next();
});

// Methods
driverOnboardingSchema.methods.completeStep = function(stepNumber, stepData) {
  this.currentStep = Math.max(this.currentStep, stepNumber);
  
  if (stepData) {
    // Update tutorial steps
    if (this.tutorial.steps) {
      const stepIndex = this.tutorial.steps.findIndex(s => s.stepNumber === stepNumber);
      if (stepIndex !== -1) {
        this.tutorial.steps[stepIndex].completed = true;
        this.tutorial.steps[stepIndex].completedAt = new Date();
      }
    }
  }
  
  return this.save();
};

driverOnboardingSchema.methods.addCertification = function(certData) {
  this.certifications.push(certData);
  return this.save();
};

driverOnboardingSchema.methods.updateCertification = function(certId, updateData) {
  const cert = this.certifications.id(certId);
  if (cert) {
    Object.assign(cert, updateData);
    return this.save();
  }
  throw new Error('Certification not found');
};

driverOnboardingSchema.methods.addDocument = function(docData) {
  this.documents.push(docData);
  return this.save();
};

driverOnboardingSchema.methods.verifyDocument = function(docId, verifiedBy) {
  const doc = this.documents.id(docId);
  if (doc) {
    doc.verificationStatus = 'verified';
    doc.verifiedBy = verifiedBy;
    doc.verifiedAt = new Date();
    return this.save();
  }
  throw new Error('Document not found');
};

driverOnboardingSchema.methods.rejectDocument = function(docId, reason, rejectedBy) {
  const doc = this.documents.id(docId);
  if (doc) {
    doc.verificationStatus = 'rejected';
    doc.rejectionReason = reason;
    doc.verifiedBy = rejectedBy;
    doc.verifiedAt = new Date();
    return this.save();
  }
  throw new Error('Document not found');
};

driverOnboardingSchema.methods.initiateBackgroundCheck = function(provider, requestId) {
  this.backgroundCheck.status = 'initiated';
  this.backgroundCheck.provider = provider;
  this.backgroundCheck.requestId = requestId;
  this.backgroundCheck.initiatedAt = new Date();
  return this.save();
};

driverOnboardingSchema.methods.completeBackgroundCheck = function(result, reportUrl) {
  this.backgroundCheck.status = 'completed';
  this.backgroundCheck.result = result;
  this.backgroundCheck.reportUrl = reportUrl;
  this.backgroundCheck.completedAt = new Date();
  return this.save();
};

driverOnboardingSchema.methods.acknowledgeHandbook = function(version, ipAddress, signature) {
  this.handbook.acknowledged = true;
  this.handbook.handbookVersion = version;
  this.handbook.acknowledgedAt = new Date();
  this.handbook.ipAddress = ipAddress;
  this.handbook.signature = signature;
  return this.save();
};

driverOnboardingSchema.methods.addEmergencyContact = function(contactData) {
  // If setting as primary, unset other primary contacts
  if (contactData.isPrimary) {
    this.emergencyContacts.forEach(contact => {
      contact.isPrimary = false;
    });
  }
  this.emergencyContacts.push(contactData);
  return this.save();
};

driverOnboardingSchema.methods.approve = function(approvedBy, notes) {
  this.approval.status = 'approved';
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  
  this.approval.approvalHistory.push({
    action: 'approved',
    performedBy: approvedBy,
    performedAt: new Date(),
    notes
  });
  
  return this.save();
};

driverOnboardingSchema.methods.reject = function(rejectedBy, reason) {
  this.approval.status = 'rejected';
  this.approval.rejectedBy = rejectedBy;
  this.approval.rejectedAt = new Date();
  this.approval.rejectionReason = reason;
  
  this.approval.approvalHistory.push({
    action: 'rejected',
    performedBy: rejectedBy,
    performedAt: new Date(),
    notes: reason
  });
  
  return this.save();
};

const DriverOnboarding = mongoose.model('DriverOnboarding', driverOnboardingSchema);

export default DriverOnboarding;
