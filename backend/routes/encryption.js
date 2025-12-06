/**
 * Encryption Management Routes
 * 
 * Admin endpoints for managing encryption keys and data encryption.
 * Handles key rotation, re-encryption, and encryption status monitoring.
 * 
 * Security:
 * - All routes require admin authentication
 * - All operations are audit logged
 * - Rate limited to prevent abuse
 */

import express from 'express';
import EncryptionKey from '../models/EncryptionKey.js';
import User from '../models/User.js';
import Rider from '../models/Rider.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import {
  isEncryptionConfigured,
  generateMasterKey,
  validateMasterKey
} from '../utils/encryption.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * GET /api/encryption/status
 * Get encryption system status
 */
router.get('/status', async (req, res) => {
  try {
    const configured = isEncryptionConfigured();
    
    if (!configured) {
      return res.json({
        configured: false,
        message: 'Encryption not configured. Please set ENCRYPTION_MASTER_KEY environment variable.'
      });
    }
    
    const stats = await EncryptionKey.getStatistics();
    const activeKey = await EncryptionKey.findOne({ isActive: true, status: 'active' });
    const rotationDue = await EncryptionKey.getKeysRequiringRotation();
    
    // Count encrypted records
    const encryptedUsers = await User.countDocuments({ 'encryptionMetadata.isEncrypted': true });
    const totalUsers = await User.countDocuments();
    const encryptedRiders = await Rider.countDocuments({ 'encryptionMetadata.isEncrypted': true });
    const totalRiders = await Rider.countDocuments();
    
    res.json({
      configured: true,
      initialized: stats.total > 0,
      activeKey: activeKey ? {
        version: activeKey.version,
        createdAt: activeKey.createdAt,
        ageInDays: activeKey.ageInDays,
        nextRotationAt: activeKey.nextRotationAt,
        isRotationDue: activeKey.isRotationDue
      } : null,
      statistics: stats,
      rotationDue: rotationDue.length,
      dataEncryption: {
        users: {
          encrypted: encryptedUsers,
          total: totalUsers,
          percentage: totalUsers > 0 ? Math.round((encryptedUsers / totalUsers) * 100) : 0
        },
        riders: {
          encrypted: encryptedRiders,
          total: totalRiders,
          percentage: totalRiders > 0 ? Math.round((encryptedRiders / totalRiders) * 100) : 0
        }
      }
    });
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.status.view',
      category: 'security',
      details: { stats },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
  } catch (error) {
    console.error('Error getting encryption status:', error);
    res.status(500).json({ 
      error: 'Failed to get encryption status',
      message: error.message
    });
  }
});

/**
 * POST /api/encryption/initialize
 * Initialize encryption system with first key
 */
router.post('/initialize', async (req, res) => {
  try {
    if (!isEncryptionConfigured()) {
      return res.status(400).json({
        error: 'Encryption not configured',
        message: 'Please set ENCRYPTION_MASTER_KEY environment variable first.'
      });
    }
    
    const { rotationIntervalDays = 90, notes } = req.body;
    
    const key = await EncryptionKey.initialize({
      userId: req.user.userId,
      rotationIntervalDays,
      notes: notes || 'Initial encryption key'
    });
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.initialize',
      category: 'security',
      severity: 'high',
      details: {
        keyVersion: key.version,
        rotationIntervalDays
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Encryption initialized successfully',
      key: {
        version: key.version,
        createdAt: key.createdAt,
        nextRotationAt: key.nextRotationAt
      }
    });
    
  } catch (error) {
    console.error('Error initializing encryption:', error);
    res.status(500).json({ 
      error: 'Failed to initialize encryption',
      message: error.message
    });
  }
});

/**
 * POST /api/encryption/rotate-key
 * Rotate encryption key
 */
router.post('/rotate-key', async (req, res) => {
  try {
    const { rotationIntervalDays = 90, notes } = req.body;
    
    const { oldKey, newKey } = await EncryptionKey.rotateKey({
      userId: req.user.userId,
      rotationIntervalDays,
      notes: notes || `Key rotation by ${req.user.username || req.user.email}`
    });
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.key.rotate',
      category: 'security',
      severity: 'high',
      details: {
        oldKeyVersion: oldKey.version,
        newKeyVersion: newKey.version,
        rotationIntervalDays
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Key rotation initiated. Please run re-encryption to update existing data.',
      oldKey: {
        version: oldKey.version,
        retiredAt: oldKey.retiredAt
      },
      newKey: {
        version: newKey.version,
        createdAt: newKey.createdAt,
        nextRotationAt: newKey.nextRotationAt
      }
    });
    
  } catch (error) {
    console.error('Error rotating key:', error);
    res.status(500).json({ 
      error: 'Failed to rotate key',
      message: error.message
    });
  }
});

/**
 * POST /api/encryption/encrypt-data
 * Encrypt existing unencrypted data
 */
router.post('/encrypt-data', async (req, res) => {
  try {
    const { collection, limit = 100 } = req.body;
    
    if (!collection || !['users', 'riders', 'all'].includes(collection)) {
      return res.status(400).json({
        error: 'Invalid collection',
        message: 'Collection must be "users", "riders", or "all"'
      });
    }
    
    const results = {
      users: { total: 0, encrypted: 0, errors: 0 },
      riders: { total: 0, encrypted: 0, errors: 0 }
    };
    
    // Encrypt users
    if (collection === 'users' || collection === 'all') {
      const users = await User.find({ 
        'encryptionMetadata.isEncrypted': { $ne: true }
      }).limit(limit);
      
      results.users.total = users.length;
      
      for (const user of users) {
        try {
          if (user.email || user.phone || user.licenseNumber || user.twoFactorSecret) {
            await user.encryptSensitiveFields();
            await user.save();
            results.users.encrypted++;
          }
        } catch (error) {
          console.error(`Error encrypting user ${user._id}:`, error);
          results.users.errors++;
        }
      }
    }
    
    // Encrypt riders
    if (collection === 'riders' || collection === 'all') {
      const riders = await Rider.find({ 
        'encryptionMetadata.isEncrypted': { $ne: true }
      }).limit(limit);
      
      results.riders.total = riders.length;
      
      for (const rider of riders) {
        try {
          if (rider.email || rider.phone || rider.address || rider.dateOfBirth) {
            await rider.encryptSensitiveFields();
            await rider.save();
            results.riders.encrypted++;
          }
        } catch (error) {
          console.error(`Error encrypting rider ${rider._id}:`, error);
          results.riders.errors++;
        }
      }
    }
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.data.encrypt',
      category: 'security',
      severity: 'medium',
      details: {
        collection,
        results
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Data encryption completed',
      results
    });
    
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({ 
      error: 'Failed to encrypt data',
      message: error.message
    });
  }
});

/**
 * POST /api/encryption/reencrypt-data
 * Re-encrypt data with new key after rotation
 */
router.post('/reencrypt-data', async (req, res) => {
  try {
    const { collection, oldKeyVersion, limit = 100 } = req.body;
    
    if (!collection || !['users', 'riders', 'all'].includes(collection)) {
      return res.status(400).json({
        error: 'Invalid collection',
        message: 'Collection must be "users", "riders", or "all"'
      });
    }
    
    if (!oldKeyVersion) {
      return res.status(400).json({
        error: 'Old key version required',
        message: 'Please specify the old key version to re-encrypt from'
      });
    }
    
    const results = {
      users: { total: 0, reencrypted: 0, errors: 0 },
      riders: { total: 0, reencrypted: 0, errors: 0 }
    };
    
    const activeKey = await EncryptionKey.getActiveKey();
    
    // Re-encrypt users
    if (collection === 'users' || collection === 'all') {
      const users = await User.find({ 
        'encryptionMetadata.keyVersion': oldKeyVersion
      }).limit(limit);
      
      results.users.total = users.length;
      
      for (const user of users) {
        try {
          // Decrypt with old key
          await user.decryptSensitiveFields();
          
          // Remove encryption metadata to trigger re-encryption
          user.encryptionMetadata = {
            isEncrypted: false
          };
          
          // Encrypt with new key
          await user.encryptSensitiveFields();
          await user.save();
          
          results.users.reencrypted++;
          await EncryptionKey.trackUsage(oldKeyVersion, 'reencrypt');
        } catch (error) {
          console.error(`Error re-encrypting user ${user._id}:`, error);
          results.users.errors++;
        }
      }
    }
    
    // Re-encrypt riders
    if (collection === 'riders' || collection === 'all') {
      const riders = await Rider.find({ 
        'encryptionMetadata.keyVersion': oldKeyVersion
      }).limit(limit);
      
      results.riders.total = riders.length;
      
      for (const rider of riders) {
        try {
          // Decrypt with old key
          await rider.decryptSensitiveFields();
          
          // Remove encryption metadata to trigger re-encryption
          rider.encryptionMetadata = {
            isEncrypted: false
          };
          
          // Encrypt with new key
          await rider.encryptSensitiveFields();
          await rider.save();
          
          results.riders.reencrypted++;
        } catch (error) {
          console.error(`Error re-encrypting rider ${rider._id}:`, error);
          results.riders.errors++;
        }
      }
    }
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.data.reencrypt',
      category: 'security',
      severity: 'high',
      details: {
        collection,
        oldKeyVersion,
        newKeyVersion: activeKey.version,
        results
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Data re-encryption completed',
      results,
      newKeyVersion: activeKey.version
    });
    
  } catch (error) {
    console.error('Error re-encrypting data:', error);
    res.status(500).json({ 
      error: 'Failed to re-encrypt data',
      message: error.message
    });
  }
});

/**
 * GET /api/encryption/keys
 * Get all encryption keys
 */
router.get('/keys', async (req, res) => {
  try {
    const keys = await EncryptionKey.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email firstName lastName')
      .populate('retiredBy', 'username email firstName lastName');
    
    res.json({
      keys: keys.map(key => ({
        version: key.version,
        status: key.status,
        isActive: key.isActive,
        createdAt: key.createdAt,
        activatedAt: key.activatedAt,
        retiredAt: key.retiredAt,
        nextRotationAt: key.nextRotationAt,
        ageInDays: key.ageInDays,
        isRotationDue: key.isRotationDue,
        usageStats: key.usageStats,
        reencryptionProgress: key.reencryptionProgress,
        createdBy: key.createdBy,
        retiredBy: key.retiredBy,
        notes: key.notes
      }))
    });
    
  } catch (error) {
    console.error('Error getting keys:', error);
    res.status(500).json({ 
      error: 'Failed to get keys',
      message: error.message
    });
  }
});

/**
 * POST /api/encryption/validate-master-key
 * Validate master key strength (doesn't expose actual key)
 */
router.post('/validate-master-key', (req, res) => {
  try {
    const { masterKey } = req.body;
    
    if (!masterKey) {
      return res.status(400).json({
        error: 'Master key required',
        message: 'Please provide a master key to validate'
      });
    }
    
    const validation = validateMasterKey(masterKey);
    
    res.json({
      validation,
      message: validation.valid 
        ? 'Master key is valid and can be used for encryption'
        : 'Master key does not meet security requirements'
    });
    
  } catch (error) {
    console.error('Error validating master key:', error);
    res.status(500).json({ 
      error: 'Failed to validate master key',
      message: error.message
    });
  }
});

/**
 * GET /api/encryption/generate-master-key
 * Generate a new random master key
 */
router.get('/generate-master-key', async (req, res) => {
  try {
    const masterKey = generateMasterKey();
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.masterkey.generate',
      category: 'security',
      severity: 'high',
      details: {
        message: 'Master key generated (not stored in audit log)'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      masterKey,
      message: 'Store this master key securely in your environment variables as ENCRYPTION_MASTER_KEY',
      warning: 'This key will not be shown again. Make sure to save it before closing this window.'
    });
    
  } catch (error) {
    console.error('Error generating master key:', error);
    res.status(500).json({ 
      error: 'Failed to generate master key',
      message: error.message
    });
  }
});

/**
 * DELETE /api/encryption/keys/:version
 * Deprecate an old encryption key
 */
router.delete('/keys/:version', async (req, res) => {
  try {
    const { version } = req.params;
    
    const key = await EncryptionKey.findOne({ version: parseInt(version) });
    
    if (!key) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    if (key.isActive) {
      return res.status(400).json({ 
        error: 'Cannot deprecate active key',
        message: 'Please rotate to a new key first'
      });
    }
    
    if (key.status === 'deprecated') {
      return res.status(400).json({ 
        error: 'Key already deprecated'
      });
    }
    
    // Check if any data still uses this key
    const usersCount = await User.countDocuments({ 'encryptionMetadata.keyVersion': version });
    const ridersCount = await Rider.countDocuments({ 'encryptionMetadata.keyVersion': version });
    
    if (usersCount > 0 || ridersCount > 0) {
      return res.status(400).json({ 
        error: 'Key still in use',
        message: `${usersCount} users and ${ridersCount} riders still encrypted with this key. Please re-encrypt first.`,
        details: { usersCount, ridersCount }
      });
    }
    
    key.status = 'deprecated';
    key.deprecatedAt = new Date();
    await key.save();
    
    await logAudit({
      userId: req.user.userId,
      action: 'encryption.key.deprecate',
      category: 'security',
      severity: 'medium',
      details: {
        keyVersion: version
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Key deprecated successfully',
      key: {
        version: key.version,
        status: key.status,
        deprecatedAt: key.deprecatedAt
      }
    });
    
  } catch (error) {
    console.error('Error deprecating key:', error);
    res.status(500).json({ 
      error: 'Failed to deprecate key',
      message: error.message
    });
  }
});

export default router;
