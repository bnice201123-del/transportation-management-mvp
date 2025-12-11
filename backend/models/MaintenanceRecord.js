import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  // Vehicle association
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  // Record identification
  recordNumber: {
    type: String,
    unique: true,
    required: true
  },
  workOrderNumber: String,

  // Maintenance type
  maintenanceType: {
    type: String,
    enum: [
      'scheduled_service',
      'preventive_maintenance',
      'repair',
      'inspection',
      'recall',
      'warranty_work',
      'emergency_repair',
      'body_work',
      'tire_service',
      'brake_service',
      'oil_change',
      'diagnostics',
      'other'
    ],
    required: true
  },

  // Service details
  serviceCategory: {
    type: String,
    enum: ['engine', 'transmission', 'brakes', 'tires', 'electrical', 'hvac', 'body', 'interior', 'suspension', 'exhaust', 'fuel_system', 'cooling_system', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['routine', 'minor', 'moderate', 'major', 'critical'],
    default: 'routine'
  },

  // Status and dates
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'deferred'],
    default: 'scheduled'
  },
  scheduledDate: Date,
  startDate: Date,
  completedDate: Date,
  estimatedCompletionDate: Date,

  // Mileage tracking
  mileageAtService: {
    type: Number,
    required: true
  },
  nextServiceMileage: Number,
  mileageInterval: Number, // For recurring services

  // Service provider
  serviceProvider: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['in_house', 'dealership', 'independent_shop', 'mobile_mechanic', 'warranty_center', 'other'],
      default: 'independent_shop'
    },
    address: String,
    phoneNumber: String,
    email: String,
    technicianName: String,
    certifications: [String],
    apiIntegration: {
      enabled: Boolean,
      providerId: String,
      lastSynced: Date
    }
  },

  // Parts used
  partsUsed: [{
    partNumber: String,
    partName: {
      type: String,
      required: true
    },
    partType: {
      type: String,
      enum: ['OEM', 'aftermarket', 'rebuilt', 'used']
    },
    manufacturer: String,
    quantity: {
      type: Number,
      default: 1
    },
    unitCost: Number,
    totalCost: Number,
    warranty: {
      duration: Number, // months
      expirationDate: Date,
      warrantyNumber: String
    },
    supplier: String,
    partCondition: {
      type: String,
      enum: ['new', 'refurbished', 'used']
    },
    serialNumber: String,
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PartsInventory'
    }
  }],

  // Labor details
  labor: {
    hours: Number,
    rate: Number,
    totalCost: Number,
    technicians: [{
      name: String,
      hours: Number,
      rate: Number
    }]
  },

  // Cost breakdown
  costs: {
    parts: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shopSupplies: {
      type: Number,
      default: 0
    },
    diagnosticFee: {
      type: Number,
      default: 0
    },
    environmental: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },

  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'check', 'company_account', 'warranty', 'insurance'],
      default: 'company_account'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue', 'disputed', 'refunded'],
      default: 'pending'
    },
    invoiceNumber: String,
    invoiceDate: Date,
    dueDate: Date,
    paidDate: Date,
    paidAmount: Number,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Inspection checklist (for inspections)
  inspection: {
    checklist: [{
      item: String,
      status: {
        type: String,
        enum: ['pass', 'fail', 'warning', 'not_applicable']
      },
      notes: String
    }],
    overallStatus: {
      type: String,
      enum: ['pass', 'fail', 'conditional']
    },
    certificateNumber: String,
    expirationDate: Date
  },

  // Follow-up and recommendations
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    dueDate: Date,
    description: String,
    estimatedCost: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    }
  },

  recommendations: [{
    item: String,
    description: String,
    estimatedCost: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    dueBy: Date
  }],

  // Vehicle condition
  vehicleCondition: {
    before: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    after: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  },

  // Documents and attachments
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'estimate', 'warranty', 'inspection_report', 'photo', 'diagnostic_report', 'other']
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Warranty information
  warranty: {
    covered: {
      type: Boolean,
      default: false
    },
    claimNumber: String,
    coverageAmount: Number,
    deductible: Number,
    approvalDate: Date,
    expirationDate: Date
  },

  // Recurring maintenance schedule
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSchedule: {
    frequency: {
      type: String,
      enum: ['mileage', 'time', 'both']
    },
    mileageInterval: Number, // e.g., every 5000 miles
    timeInterval: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months', 'years']
      }
    },
    lastPerformed: Date,
    nextDue: Date
  },

  // Driver/Reporter information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Quality assurance
  qualityCheck: {
    performed: {
      type: Boolean,
      default: false
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedDate: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  },

  // Integration with external systems
  externalSystem: {
    systemName: String,
    externalId: String,
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'not_synced'],
      default: 'not_synced'
    },
    lastSynced: Date,
    syncError: String
  },

  // Notes and internal comments
  notes: String,
  internalNotes: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
maintenanceRecordSchema.index({ vehicle: 1, status: 1 });
maintenanceRecordSchema.index({ recordNumber: 1 });
maintenanceRecordSchema.index({ scheduledDate: 1 });
maintenanceRecordSchema.index({ maintenanceType: 1 });
maintenanceRecordSchema.index({ 'serviceProvider.name': 1 });

// Pre-save middleware to generate record number
maintenanceRecordSchema.pre('save', async function(next) {
  if (!this.recordNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.recordNumber = `MNT-${timestamp}-${random}`;
  }
  
  // Calculate total cost
  if (this.costs && !this.isModified('costs.total')) {
    this.costs.total = 
      (this.costs.parts || 0) +
      (this.costs.labor || 0) +
      (this.costs.tax || 0) +
      (this.costs.shopSupplies || 0) +
      (this.costs.diagnosticFee || 0) +
      (this.costs.environmental || 0) +
      (this.costs.other || 0) -
      (this.costs.discount || 0);
  }
  
  // Update status based on dates
  if (this.completedDate && this.status !== 'completed') {
    this.status = 'completed';
  }
  
  next();
});

// Virtual for total parts cost
maintenanceRecordSchema.virtual('totalPartsCost').get(function() {
  return this.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
});

// Virtual for days overdue
maintenanceRecordSchema.virtual('daysOverdue').get(function() {
  if (!this.estimatedCompletionDate || this.status === 'completed') return 0;
  
  const now = new Date();
  if (now > this.estimatedCompletionDate) {
    const diffTime = now - this.estimatedCompletionDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Methods
maintenanceRecordSchema.methods.complete = function(completionData = {}) {
  this.status = 'completed';
  this.completedDate = new Date();
  Object.assign(this, completionData);
  return this.save();
};

maintenanceRecordSchema.methods.addPart = function(partData) {
  this.partsUsed.push(partData);
  if (partData.totalCost) {
    this.costs.parts = (this.costs.parts || 0) + partData.totalCost;
  }
  return this.save();
};

maintenanceRecordSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || !this.estimatedCompletionDate) return false;
  return new Date() > this.estimatedCompletionDate;
};

const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);

export default MaintenanceRecord;
