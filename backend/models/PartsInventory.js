import mongoose from 'mongoose';

const partsInventorySchema = new mongoose.Schema({
  // Part identification
  partNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  partName: {
    type: String,
    required: true,
    trim: true
  },
  alternatePartNumbers: [String],
  
  // Categorization
  category: {
    type: String,
    enum: [
      'engine',
      'transmission',
      'brakes',
      'suspension',
      'electrical',
      'hvac',
      'body',
      'interior',
      'tires',
      'filters',
      'fluids',
      'belts_hoses',
      'lighting',
      'exhaust',
      'fuel_system',
      'cooling_system',
      'other'
    ],
    required: true
  },
  subcategory: String,

  // Part details
  description: String,
  specifications: {
    type: Map,
    of: String
  },
  manufacturer: {
    name: String,
    partNumber: String,
    website: String
  },
  oem: {
    type: Boolean,
    default: false
  },

  // Compatibility
  compatibleVehicles: [{
    make: String,
    model: String,
    yearStart: Number,
    yearEnd: Number,
    vehicleType: String
  }],
  universalFit: {
    type: Boolean,
    default: false
  },

  // Inventory tracking
  stock: {
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 5
    },
    reorderQuantity: {
      type: Number,
      default: 10
    },
    maxStock: {
      type: Number,
      default: 50
    },
    unit: {
      type: String,
      enum: ['piece', 'set', 'pair', 'gallon', 'liter', 'quart', 'bottle', 'box', 'case'],
      default: 'piece'
    }
  },

  // Location
  location: {
    warehouse: String,
    section: String,
    shelf: String,
    bin: String,
    position: String
  },

  // Pricing
  pricing: {
    cost: {
      type: Number,
      required: true
    },
    retailPrice: Number,
    wholesalePrice: Number,
    markupPercentage: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    lastCostUpdate: Date
  },

  // Supplier information
  suppliers: [{
    name: {
      type: String,
      required: true
    },
    supplierPartNumber: String,
    contactPerson: String,
    phoneNumber: String,
    email: String,
    website: String,
    cost: Number,
    leadTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks']
      }
    },
    minimumOrder: Number,
    isPrimary: {
      type: Boolean,
      default: false
    },
    lastOrderDate: Date,
    apiIntegration: {
      enabled: Boolean,
      apiKey: {
        type: String,
        select: false
      },
      endpoint: String,
      supplierId: String
    }
  }],

  // Warranty
  warranty: {
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years', 'miles']
      }
    },
    type: {
      type: String,
      enum: ['manufacturer', 'supplier', 'extended', 'none'],
      default: 'manufacturer'
    },
    terms: String
  },

  // Stock movements
  movements: [{
    type: {
      type: String,
      enum: ['received', 'issued', 'returned', 'adjusted', 'transferred', 'damaged', 'lost', 'sold'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    reference: String, // PO number, work order number, etc.
    referenceType: {
      type: String,
      enum: ['purchase_order', 'work_order', 'maintenance_record', 'transfer', 'adjustment', 'sale']
    },
    referenceId: mongoose.Schema.Types.ObjectId,
    fromLocation: {
      warehouse: String,
      shelf: String,
      bin: String
    },
    toLocation: {
      warehouse: String,
      shelf: String,
      bin: String
    },
    cost: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    notes: String
  }],

  // Purchase orders
  purchaseOrders: [{
    poNumber: {
      type: String,
      required: true
    },
    supplier: String,
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDelivery: Date,
    actualDelivery: Date,
    quantity: Number,
    unitCost: Number,
    totalCost: Number,
    status: {
      type: String,
      enum: ['pending', 'ordered', 'shipped', 'received', 'cancelled'],
      default: 'pending'
    },
    receivedQuantity: Number,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Condition and quality
  condition: {
    type: String,
    enum: ['new', 'refurbished', 'used', 'damaged'],
    default: 'new'
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'discontinued', 'obsolete', 'backordered', 'inactive'],
    default: 'active'
  },
  isConsignment: {
    type: Boolean,
    default: false
  },
  isHazardous: {
    type: Boolean,
    default: false
  },
  hazardClass: String,

  // Expiration (for fluids, chemicals, etc.)
  perishable: {
    type: Boolean,
    default: false
  },
  expirationDate: Date,
  shelfLife: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  },

  // Physical attributes
  physical: {
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['oz', 'lb', 'g', 'kg'],
        default: 'lb'
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['in', 'cm', 'mm'],
        default: 'in'
      }
    },
    volume: {
      value: Number,
      unit: {
        type: String,
        enum: ['oz', 'qt', 'gal', 'ml', 'l'],
        default: 'qt'
      }
    }
  },

  // Usage statistics
  statistics: {
    totalIssued: {
      type: Number,
      default: 0
    },
    totalReturned: {
      type: Number,
      default: 0
    },
    averageMonthlyUsage: {
      type: Number,
      default: 0
    },
    lastIssued: Date,
    lastReceived: Date,
    turnoverRate: Number, // Times per year
    mostUsedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    }
  },

  // Images and documents
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    type: {
      type: String,
      enum: ['spec_sheet', 'msds', 'manual', 'warranty', 'certificate', 'other']
    },
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Barcodes and identifiers
  barcode: String,
  qrCode: String,
  rfidTag: String,

  // Notes
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
partsInventorySchema.index({ partNumber: 1 });
partsInventorySchema.index({ partName: 'text', description: 'text' });
partsInventorySchema.index({ category: 1, status: 1 });
partsInventorySchema.index({ 'stock.quantity': 1 });
partsInventorySchema.index({ status: 1 });

// Virtuals
partsInventorySchema.virtual('stockValue').get(function() {
  return this.stock.quantity * this.pricing.cost;
});

partsInventorySchema.virtual('needsReorder').get(function() {
  return this.stock.quantity <= this.stock.reorderPoint;
});

partsInventorySchema.virtual('isLowStock').get(function() {
  return this.stock.quantity > 0 && this.stock.quantity <= this.stock.reorderPoint;
});

partsInventorySchema.virtual('isOutOfStock').get(function() {
  return this.stock.quantity === 0;
});

partsInventorySchema.virtual('primarySupplier').get(function() {
  return this.suppliers.find(s => s.isPrimary) || this.suppliers[0];
});

// Methods
partsInventorySchema.methods.issueStock = async function(quantity, referenceData = {}) {
  if (quantity > this.stock.quantity) {
    throw new Error('Insufficient stock');
  }

  this.stock.quantity -= quantity;
  
  this.movements.push({
    type: 'issued',
    quantity: -quantity,
    ...referenceData
  });

  this.statistics.totalIssued += quantity;
  this.statistics.lastIssued = new Date();

  return this.save();
};

partsInventorySchema.methods.receiveStock = async function(quantity, referenceData = {}) {
  this.stock.quantity += quantity;
  
  this.movements.push({
    type: 'received',
    quantity: quantity,
    ...referenceData
  });

  this.statistics.lastReceived = new Date();

  return this.save();
};

partsInventorySchema.methods.adjustStock = async function(newQuantity, reason, user) {
  const difference = newQuantity - this.stock.quantity;
  
  this.movements.push({
    type: 'adjusted',
    quantity: difference,
    notes: reason,
    user: user
  });

  this.stock.quantity = newQuantity;

  return this.save();
};

partsInventorySchema.methods.checkCompatibility = function(vehicleMake, vehicleModel, vehicleYear) {
  if (this.universalFit) return true;

  return this.compatibleVehicles.some(v => 
    v.make === vehicleMake &&
    v.model === vehicleModel &&
    vehicleYear >= v.yearStart &&
    vehicleYear <= v.yearEnd
  );
};

partsInventorySchema.methods.isExpired = function() {
  if (!this.perishable || !this.expirationDate) return false;
  return new Date() > this.expirationDate;
};

// Pre-save middleware
partsInventorySchema.pre('save', function(next) {
  // Calculate markup percentage
  if (this.pricing.cost && this.pricing.retailPrice) {
    this.pricing.markupPercentage = 
      ((this.pricing.retailPrice - this.pricing.cost) / this.pricing.cost) * 100;
  }

  // Update status if out of stock for too long
  if (this.stock.quantity === 0 && this.status === 'active') {
    const daysSinceLastReceived = this.statistics.lastReceived 
      ? (Date.now() - this.statistics.lastReceived) / (1000 * 60 * 60 * 24)
      : 365;
    
    if (daysSinceLastReceived > 90) {
      this.status = 'inactive';
    }
  }

  next();
});

const PartsInventory = mongoose.model('PartsInventory', partsInventorySchema);

export default PartsInventory;
