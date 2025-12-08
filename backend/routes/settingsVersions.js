import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// In-memory storage for versions (in production, use MongoDB)
let versions = [];
const MAX_VERSIONS = 10;

// Get all versions
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, fetch from database
    // const versions = await SettingsVersion.find({ userId: req.user._id })
    //   .sort({ timestamp: -1 })
    //   .limit(MAX_VERSIONS);
    
    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ message: 'Error fetching version history' });
  }
});

// Save a new version
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, timestamp, settings, user, description } = req.body;
    
    const newVersion = {
      id: id || Date.now(),
      timestamp: timestamp || new Date().toISOString(),
      settings,
      user: user || req.user?.username || 'admin',
      description: description || 'Auto-saved version'
    };

    // Add to beginning of array
    versions.unshift(newVersion);
    
    // Keep only last MAX_VERSIONS versions
    if (versions.length > MAX_VERSIONS) {
      versions = versions.slice(0, MAX_VERSIONS);
    }

    // In production, save to database
    // const savedVersion = await SettingsVersion.create(newVersion);
    
    res.json({ message: 'Version saved successfully', version: newVersion });
  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({ message: 'Error saving version' });
  }
});

// Get a specific version
router.get('/:versionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { versionId } = req.params;
    
    // In production, fetch from database
    // const version = await SettingsVersion.findOne({ 
    //   _id: versionId, 
    //   userId: req.user._id 
    // });
    
    const version = versions.find(v => v.id === parseInt(versionId));
    
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({ message: 'Error fetching version' });
  }
});

// Delete a version
router.delete('/:versionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { versionId } = req.params;
    
    // In production, delete from database
    // await SettingsVersion.deleteOne({ 
    //   _id: versionId, 
    //   userId: req.user._id 
    // });
    
    const index = versions.findIndex(v => v.id === parseInt(versionId));
    if (index === -1) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    versions.splice(index, 1);
    
    res.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('Error deleting version:', error);
    res.status(500).json({ message: 'Error deleting version' });
  }
});

// Log a rollback action
router.post('/rollback', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { versionId, timestamp, user } = req.body;
    
    console.log(`Rollback performed by ${user} at ${timestamp} to version ${versionId}`);
    
    // In production, log to audit trail
    // await AuditLog.create({
    //   userId: req.user._id,
    //   action: 'settings_rollback',
    //   versionId,
    //   timestamp
    // });
    
    res.json({ message: 'Rollback logged successfully' });
  } catch (error) {
    console.error('Error logging rollback:', error);
    res.status(500).json({ message: 'Error logging rollback' });
  }
});

// Compare two versions
router.post('/compare', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { version1Id, version2Id } = req.body;
    
    // In production, fetch from database
    const version1 = versions.find(v => v.id === parseInt(version1Id));
    const version2 = versions.find(v => v.id === parseInt(version2Id));
    
    if (!version1 || !version2) {
      return res.status(404).json({ message: 'One or both versions not found' });
    }
    
    // Calculate differences
    const differences = [];
    const settings1 = version1.settings;
    const settings2 = version2.settings;
    
    // Compare each category
    const allCategories = new Set([
      ...Object.keys(settings1 || {}),
      ...Object.keys(settings2 || {})
    ]);
    
    allCategories.forEach(category => {
      const cat1 = settings1?.[category] || {};
      const cat2 = settings2?.[category] || {};
      
      const allKeys = new Set([
        ...Object.keys(cat1),
        ...Object.keys(cat2)
      ]);
      
      allKeys.forEach(key => {
        const val1 = cat1[key];
        const val2 = cat2[key];
        
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push({
            category,
            key,
            value1: val1,
            value2: val2,
            type: val1 === undefined ? 'added' : val2 === undefined ? 'removed' : 'modified'
          });
        }
      });
    });
    
    res.json({
      version1: {
        id: version1.id,
        timestamp: version1.timestamp,
        user: version1.user
      },
      version2: {
        id: version2.id,
        timestamp: version2.timestamp,
        user: version2.user
      },
      differences,
      totalChanges: differences.length
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ message: 'Error comparing versions' });
  }
});

// Cleanup old versions (keep only MAX_VERSIONS)
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, delete old versions from database
    // await SettingsVersion.deleteMany({
    //   userId: req.user._id,
    //   _id: { $nin: recentVersionIds }
    // });
    
    if (versions.length > MAX_VERSIONS) {
      const removed = versions.length - MAX_VERSIONS;
      versions = versions.slice(0, MAX_VERSIONS);
      res.json({ 
        message: `Cleaned up ${removed} old versions`,
        remaining: versions.length
      });
    } else {
      res.json({ 
        message: 'No cleanup needed',
        remaining: versions.length
      });
    }
  } catch (error) {
    console.error('Error cleaning up versions:', error);
    res.status(500).json({ message: 'Error cleaning up versions' });
  }
});

export default router;
