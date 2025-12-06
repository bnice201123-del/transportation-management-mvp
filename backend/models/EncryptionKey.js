/**
 * EncryptionKey Model
 * 
 * Manages encryption keys for field-level data encryption.
 * Supports key rotation, versioning, and lifecycle management.
 * 
 * Key Rotation Strategy:
 * 1. Generate new key and mark as active
 * 2. Previous active keys remain valid for decryption
 * 3. Re-encrypt data in background using new key
 * 4. Retire old keys after re-encryption complete
 * 
 * Security Features:
 * - Keys stored as salts (master key in environment)
 * - Version-based key identification
 * - Automatic rotation scheduling
 * - Key usage tracking
 * - Retirement workflow with grace period
 */

import mongoose from 'mongoose';

const encryptionKeySchema = new mongoose.Schema({
  // Key identification
  version: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    description: 'Unique version identifier (timestamp)'
  },
  
  // Key material
  salt: {
    type: String,
    required: true,
    description: 'Salt used for PBKDF2 key derivation from master key'
  },
  
  // Key status
  isActive: {
    type: Boolean,
    default: false,
    index: true,
    description: 'Whether this key is used for new encryptions'
  },
  
  status: {
    type: String,
    enum: ['active', 'retired', 'scheduled', 'deprecated'],
    default: 'scheduled',
    index: true,
    description: 'Key lifecycle status'
  },
  
  // Lifecycle timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    description: 'Key creation timestamp'
  },
  
  activatedAt: {
    type: Date,
    description: 'When key became active for encryption'
  },
  
  retiredAt: {
    type: Date,
    description: 'When key was retired from active use'
  },
  
  deprecatedAt: {
    type: Date,
    description: 'When key was fully deprecated (no longer used for decryption)'
  },
  
  // Rotation scheduling
  nextRotationAt: {
    type: Date,
    description: 'Scheduled date for next key rotation'
  },
  
  rotationIntervalDays: {
    type: Number,
    default: 90,
    description: 'Days between automatic rotations (0 = manual only)'
  },
  
  // Usage tracking
  usageStats: {
    encryptionCount: {
      type: Number,
      default: 0,
      description: 'Number of values encrypted with this key'
    },
    decryptionCount: {
      type: Number,
      default: 0,
      description: 'Number of values decrypted with this key'
    },
    reencryptionCount: {
      type: Number,
      default: 0,
      description: 'Number of values re-encrypted from this key'
    },
    lastUsed: {
      type: Date,
      description: 'Last time key was used for any operation'
    }
  },
  
  // Metadata
  purpose: {
    type: String,
    enum: ['general', 'pii', 'financial', 'medical', 'backup'],
    default: 'general',
    description: 'Intended use case for key categorization'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Admin who created the key'
  },
  
  retiredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Admin who retired the key'
  },
  
  notes: {
    type: String,
    description: 'Administrative notes about key'
  },
  
  // Re-encryption progress
  reencryptionProgress: {
    started: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    completedAt: Date,
    totalRecords: {
      type: Number,
      default: 0
    },
    processedRecords: {
      type: Number,
      default: 0
    },
    failedRecords: {
      type: Number,
      default: 0
    },
    collections: [{
      name: String,
      processed: Number,
      total: Number,
      completed: Boolean
    }]
  }
}, {
  timestamps: true
});

// Indexes
encryptionKeySchema.index({ status: 1, isActive: 1 });
encryptionKeySchema.index({ nextRotationAt: 1 }, { sparse: true });
encryptionKeySchema.index({ createdAt: -1 });

// Virtual: Age in days
encryptionKeySchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual: Is rotation due
encryptionKeySchema.virtual('isRotationDue').get(function() {
  if (!this.nextRotationAt) return false;
  return this.nextRotationAt <= new Date();
});

// Virtual: Re-encryption progress percentage
encryptionKeySchema.virtual('reencryptionPercentage').get(function() {
  if (!this.reencryptionProgress || !this.reencryptionProgress.totalRecords) {
    return 0;
  }
  return Math.round(
    (this.reencryptionProgress.processedRecords / this.reencryptionProgress.totalRecords) * 100
  );
});

/**
 * Get the current active encryption key
 * @returns {Promise<EncryptionKey>} Active key document
 */
encryptionKeySchema.statics.getActiveKey = async function() {
  const activeKey = await this.findOne({ isActive: true, status: 'active' })
    .sort({ createdAt: -1 });
  
  if (!activeKey) {
    throw new Error('No active encryption key found. Please initialize encryption.');
  }
  
  return activeKey;
};

/**
 * Get key by version for decryption
 * @param {number} version - Key version
 * @returns {Promise<EncryptionKey>} Key document
 */
encryptionKeySchema.statics.getKeyByVersion = async function(version) {
  const key = await this.findOne({ version });
  
  if (!key) {
    throw new Error(`Encryption key version ${version} not found`);
  }
  
  if (key.status === 'deprecated') {
    throw new Error(`Encryption key version ${version} is deprecated and cannot be used`);
  }
  
  return key;
};

/**
 * Create and activate a new encryption key
 * @param {Object} options - Key creation options
 * @returns {Promise<EncryptionKey>} New active key
 */
encryptionKeySchema.statics.createAndActivate = async function(options = {}) {
  const { generateEncryptionKey } = await import('../utils/encryption.js');
  
  // Deactivate current active key
  await this.updateMany(
    { isActive: true },
    { 
      isActive: false,
      status: 'retired',
      retiredAt: new Date(),
      retiredBy: options.userId
    }
  );
  
  // Generate new key data
  const keyData = generateEncryptionKey();
  
  // Calculate next rotation date
  const rotationIntervalDays = options.rotationIntervalDays || 90;
  const nextRotationAt = new Date();
  nextRotationAt.setDate(nextRotationAt.getDate() + rotationIntervalDays);
  
  // Create new key
  const newKey = await this.create({
    version: keyData.version,
    salt: keyData.salt,
    isActive: true,
    status: 'active',
    activatedAt: new Date(),
    purpose: options.purpose || 'general',
    rotationIntervalDays,
    nextRotationAt: rotationIntervalDays > 0 ? nextRotationAt : null,
    createdBy: options.userId,
    notes: options.notes
  });
  
  return newKey;
};

/**
 * Rotate encryption key (create new and schedule re-encryption)
 * @param {Object} options - Rotation options
 * @returns {Promise<Object>} Old and new keys
 */
encryptionKeySchema.statics.rotateKey = async function(options = {}) {
  const oldKey = await this.getActiveKey();
  const newKey = await this.createAndActivate(options);
  
  // Mark old key for re-encryption
  oldKey.reencryptionProgress = {
    started: false,
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    collections: []
  };
  await oldKey.save();
  
  return { oldKey, newKey };
};

/**
 * Get encryption statistics
 * @returns {Promise<Object>} Statistics object
 */
encryptionKeySchema.statics.getStatistics = async function() {
  const keys = await this.find().sort({ createdAt: -1 });
  
  const active = keys.filter(k => k.isActive && k.status === 'active');
  const retired = keys.filter(k => k.status === 'retired');
  const deprecated = keys.filter(k => k.status === 'deprecated');
  
  const totalEncryptions = keys.reduce((sum, k) => sum + (k.usageStats?.encryptionCount || 0), 0);
  const totalDecryptions = keys.reduce((sum, k) => sum + (k.usageStats?.decryptionCount || 0), 0);
  
  // Find keys due for rotation
  const rotationDue = keys.filter(k => k.isActive && k.nextRotationAt && k.nextRotationAt <= new Date());
  
  // Find keys with pending re-encryption
  const pendingReencryption = keys.filter(k => 
    k.reencryptionProgress?.started && !k.reencryptionProgress?.completedAt
  );
  
  return {
    total: keys.length,
    active: active.length,
    retired: retired.length,
    deprecated: deprecated.length,
    totalEncryptions,
    totalDecryptions,
    rotationDue: rotationDue.length,
    pendingReencryption: pendingReencryption.length,
    oldestKey: keys.length > 0 ? keys[keys.length - 1].createdAt : null,
    newestKey: keys.length > 0 ? keys[0].createdAt : null,
    averageKeyAge: keys.length > 0 
      ? Math.floor(keys.reduce((sum, k) => sum + k.ageInDays, 0) / keys.length)
      : 0
  };
};

/**
 * Initialize encryption system with first key
 * @param {Object} options - Initialization options
 * @returns {Promise<EncryptionKey>} First encryption key
 */
encryptionKeySchema.statics.initialize = async function(options = {}) {
  const existingKeys = await this.countDocuments();
  
  if (existingKeys > 0) {
    throw new Error('Encryption already initialized. Use rotateKey() to create new keys.');
  }
  
  return await this.createAndActivate(options);
};

/**
 * Track key usage
 * @param {number} version - Key version
 * @param {string} operation - Operation type ('encrypt', 'decrypt', 'reencrypt')
 */
encryptionKeySchema.statics.trackUsage = async function(version, operation) {
  const updateField = operation === 'encrypt' ? 'usageStats.encryptionCount' :
                     operation === 'decrypt' ? 'usageStats.decryptionCount' :
                     'usageStats.reencryptionCount';
  
  await this.updateOne(
    { version },
    { 
      $inc: { [updateField]: 1 },
      $set: { 'usageStats.lastUsed': new Date() }
    }
  );
};

/**
 * Update re-encryption progress
 * @param {number} version - Key version being re-encrypted from
 * @param {Object} progress - Progress update
 */
encryptionKeySchema.statics.updateReencryptionProgress = async function(version, progress) {
  const key = await this.findOne({ version });
  
  if (!key) return;
  
  if (progress.start) {
    key.reencryptionProgress.started = true;
    key.reencryptionProgress.startedAt = new Date();
    key.reencryptionProgress.totalRecords = progress.totalRecords || 0;
    key.reencryptionProgress.collections = progress.collections || [];
  }
  
  if (progress.processed !== undefined) {
    key.reencryptionProgress.processedRecords = progress.processed;
  }
  
  if (progress.failed !== undefined) {
    key.reencryptionProgress.failedRecords += progress.failed;
  }
  
  if (progress.complete) {
    key.reencryptionProgress.completedAt = new Date();
    key.status = 'deprecated';
    key.deprecatedAt = new Date();
  }
  
  await key.save();
};

/**
 * Get keys requiring rotation
 * @returns {Promise<Array<EncryptionKey>>} Keys due for rotation
 */
encryptionKeySchema.statics.getKeysRequiringRotation = async function() {
  return await this.find({
    isActive: true,
    status: 'active',
    nextRotationAt: { $lte: new Date() }
  });
};

/**
 * Deprecate old keys after re-encryption
 * @param {number} olderThanDays - Deprecate keys older than this many days
 * @returns {Promise<number>} Number of keys deprecated
 */
encryptionKeySchema.statics.deprecateOldKeys = async function(olderThanDays = 180) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await this.updateMany(
    {
      status: 'retired',
      retiredAt: { $lte: cutoffDate },
      'reencryptionProgress.completedAt': { $exists: true }
    },
    {
      status: 'deprecated',
      deprecatedAt: new Date()
    }
  );
  
  return result.modifiedCount;
};

const EncryptionKey = mongoose.model('EncryptionKey', encryptionKeySchema);

export default EncryptionKey;
