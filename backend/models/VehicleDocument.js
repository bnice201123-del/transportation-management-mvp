import mongoose from 'mongoose';

const vehicleDocumentSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  // Document identification
  documentId: {
    type: String,
    unique: true,
    required: true
  },
  documentNumber: String, // e.g., registration number, policy number

  // Document type and category
  documentType: {
    type: String,
    enum: [
      'registration',
      'title',
      'insurance_policy',
      'insurance_certificate',
      'inspection_certificate',
      'emissions_certificate',
      'safety_certificate',
      'maintenance_record',
      'warranty',
      'service_contract',
      'lease_agreement',
      'purchase_agreement',
      'receipt',
      'invoice',
      'accident_report',
      'police_report',
      'estimate',
      'photo',
      'manual',
      'specification',
      'recall_notice',
      'compliance_certificate',
      'permit',
      'other'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['legal', 'financial', 'maintenance', 'compliance', 'operational', 'incident', 'reference', 'other'],
    required: true
  },

  // Document details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // File information
  file: {
    fileName: {
      type: String,
      required: true
    },
    originalName: String,
    fileUrl: String,
    fileSize: Number, // bytes
    mimeType: String,
    fileHash: String, // For integrity verification
    storageLocation: {
      type: String,
      enum: ['local', 's3', 'azure', 'google_cloud', 'other'],
      default: 'local'
    },
    storagePath: String,
    thumbnailUrl: String,
    isEncrypted: {
      type: Boolean,
      default: false
    }
  },

  // Date information
  dates: {
    issueDate: Date,
    effectiveDate: Date,
    expirationDate: Date,
    renewalDate: Date,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    lastViewedAt: Date,
    lastDownloadedAt: Date
  },

  // Issuing authority
  issuedBy: {
    name: String,
    organization: String,
    contactPerson: String,
    phoneNumber: String,
    email: String,
    address: String
  },

  // Expiration and renewal
  expiration: {
    hasExpiration: {
      type: Boolean,
      default: false
    },
    isExpired: {
      type: Boolean,
      default: false
    },
    expiresIn: Number, // days
    requiresRenewal: {
      type: Boolean,
      default: false
    },
    renewalInProgress: {
      type: Boolean,
      default: false
    },
    renewalReminderSent: {
      type: Boolean,
      default: false
    },
    renewalReminderDays: {
      type: Number,
      default: 30
    }
  },

  // Compliance and requirements
  compliance: {
    isRequired: {
      type: Boolean,
      default: false
    },
    regulatoryBody: String,
    regulationReference: String,
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non_compliant', 'pending', 'not_applicable'],
      default: 'not_applicable'
    },
    lastVerified: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Access control
  access: {
    visibility: {
      type: String,
      enum: ['public', 'internal', 'restricted', 'confidential'],
      default: 'internal'
    },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'dispatcher', 'driver', 'mechanic', 'accountant', 'viewer']
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    requiresApproval: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },

  // Version control
  version: {
    versionNumber: {
      type: Number,
      default: 1
    },
    isLatest: {
      type: Boolean,
      default: true
    },
    previousVersions: [{
      versionNumber: Number,
      documentId: String,
      fileName: String,
      fileUrl: String,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changeNotes: String
    }],
    changeHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changeType: {
        type: String,
        enum: ['created', 'updated', 'replaced', 'archived', 'deleted']
      },
      description: String
    }]
  },

  // Related documents
  relatedDocuments: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleDocument'
    },
    relationship: {
      type: String,
      enum: ['supersedes', 'superseded_by', 'related', 'supporting', 'referenced']
    },
    description: String
  }],

  // Financial information (if applicable)
  financial: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled', 'not_applicable'],
      default: 'not_applicable'
    },
    paidDate: Date,
    invoiceNumber: String
  },

  // Tags and metadata
  tags: [String],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'replaced', 'expired', 'deleted', 'pending_review'],
    default: 'active'
  },
  statusReason: String,

  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['expiring_soon', 'expired', 'renewal_required', 'compliance_due', 'uploaded']
    },
    sentAt: Date,
    recipients: [String]
  }],

  // Audit trail
  auditLog: [{
    action: {
      type: String,
      enum: ['uploaded', 'viewed', 'downloaded', 'shared', 'updated', 'deleted', 'restored']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    details: String
  }],

  // Notes
  notes: String,
  internalNotes: String,

  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
vehicleDocumentSchema.index({ vehicle: 1, status: 1 });
vehicleDocumentSchema.index({ documentType: 1 });
vehicleDocumentSchema.index({ category: 1 });
vehicleDocumentSchema.index({ 'dates.expirationDate': 1 });
vehicleDocumentSchema.index({ 'expiration.isExpired': 1 });
vehicleDocumentSchema.index({ status: 1 });
vehicleDocumentSchema.index({ tags: 1 });

// Pre-save middleware
vehicleDocumentSchema.pre('save', function(next) {
  // Generate document ID if not exists
  if (!this.documentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.documentId = `DOC-${timestamp}-${random}`;
  }

  // Update expiration status
  if (this.dates.expirationDate) {
    const now = new Date();
    const expirationDate = new Date(this.dates.expirationDate);
    
    this.expiration.hasExpiration = true;
    this.expiration.isExpired = now > expirationDate;
    this.expiration.expiresIn = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

    // Auto-update status if expired
    if (this.expiration.isExpired && this.status === 'active') {
      this.status = 'expired';
    }
  }

  // Set renewal date if not set (30 days before expiration)
  if (this.dates.expirationDate && !this.dates.renewalDate) {
    this.dates.renewalDate = new Date(this.dates.expirationDate);
    this.dates.renewalDate.setDate(this.dates.renewalDate.getDate() - 30);
  }

  next();
});

// Methods
vehicleDocumentSchema.methods.isExpiringSoon = function(days = 30) {
  if (!this.expiration.hasExpiration) return false;
  
  const now = new Date();
  const expirationDate = new Date(this.dates.expirationDate);
  const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiration >= 0 && daysUntilExpiration <= days;
};

vehicleDocumentSchema.methods.createNewVersion = async function(newFileData, changeNotes, userId) {
  // Save current version to history
  this.version.previousVersions.push({
    versionNumber: this.version.versionNumber,
    documentId: this.documentId,
    fileName: this.file.fileName,
    fileUrl: this.file.fileUrl,
    uploadedAt: this.dates.uploadedAt,
    uploadedBy: this.uploadedBy,
    changeNotes: changeNotes
  });

  // Update to new version
  this.version.versionNumber += 1;
  this.file = { ...this.file, ...newFileData };
  this.dates.uploadedAt = new Date();
  this.uploadedBy = userId;
  this.lastModifiedBy = userId;

  // Add to change history
  this.version.changeHistory.push({
    changedBy: userId,
    changeType: 'updated',
    description: changeNotes
  });

  return this.save();
};

vehicleDocumentSchema.methods.recordAccess = function(action, userId, details = {}) {
  this.auditLog.push({
    action,
    performedBy: userId,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    details: details.notes
  });

  if (action === 'viewed') {
    this.dates.lastViewedAt = new Date();
  } else if (action === 'downloaded') {
    this.dates.lastDownloadedAt = new Date();
  }

  return this.save();
};

vehicleDocumentSchema.methods.archive = function(reason, userId) {
  this.status = 'archived';
  this.statusReason = reason;
  this.lastModifiedBy = userId;
  
  this.version.changeHistory.push({
    changedBy: userId,
    changeType: 'archived',
    description: reason
  });

  return this.save();
};

vehicleDocumentSchema.methods.hasAccess = function(userRole, userId) {
  // Check visibility level
  if (this.access.visibility === 'public') return true;
  
  // Check allowed roles
  if (this.access.allowedRoles.includes(userRole)) return true;
  
  // Check allowed users
  if (this.access.allowedUsers.some(id => id.toString() === userId.toString())) {
    return true;
  }
  
  return false;
};

const VehicleDocument = mongoose.model('VehicleDocument', vehicleDocumentSchema);

export default VehicleDocument;
