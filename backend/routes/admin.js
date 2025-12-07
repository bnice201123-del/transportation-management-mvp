import express from 'express';
import SystemSettings from '../models/SystemSettings.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/settings
// @desc    Get system settings
// @access  Private (Admin only)
router.get('/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const systemSettings = await SystemSettings.getSettings();
    res.json({
      success: true,
      settings: systemSettings.settings,
      updatedAt: systemSettings.updatedAt,
      updatedBy: systemSettings.updatedBy
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private (Admin only)
router.put('/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required'
      });
    }

    const updatedSettings = await SystemSettings.updateSettings(
      settings,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings.settings,
      updatedAt: updatedSettings.updatedAt
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: error.message
    });
  }
});

// @route   POST /api/admin/settings/reset
// @desc    Reset settings to defaults
// @access  Private (Admin only)
router.post('/settings/reset', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Delete existing settings to trigger recreation with defaults
    await SystemSettings.deleteMany({});
    const defaultSettings = await SystemSettings.getSettings();
    defaultSettings.updatedBy = req.user._id;
    await defaultSettings.save();

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      settings: defaultSettings.settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error.message
    });
  }
});

// @route   GET /api/admin/settings/export
// @desc    Export settings as JSON
// @access  Private (Admin only)
router.get('/settings/export', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const systemSettings = await SystemSettings.getSettings();
    
    const exportData = {
      settings: systemSettings.settings,
      exportDate: new Date().toISOString(),
      exportedBy: req.user.username,
      version: '1.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=system-settings-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting settings',
      error: error.message
    });
  }
});

// @route   POST /api/admin/settings/import
// @desc    Import settings from JSON
// @access  Private (Admin only)
router.post('/settings/import', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Settings data is required for import'
      });
    }

    const updatedSettings = await SystemSettings.updateSettings(
      settings,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Settings imported successfully',
      settings: updatedSettings.settings
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing settings',
      error: error.message
    });
  }
});

export default router;
