/**
 * Geo Security Rules Routes
 * Location-based access control management
 */

import express from 'express';
import GeoSecurityRule from '../models/GeoSecurityRule.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// All routes require admin access

/**
 * @route   GET /api/geo-security/rules
 * @desc    Get all geo-security rules
 * @access  Admin
 */
router.get('/rules', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { scope, ruleType, isActive } = req.query;

    const options = {};
    if (scope) options.scope = scope;
    if (ruleType) options.ruleType = ruleType;

    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rules = await GeoSecurityRule.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('targetUsers', 'name email role');

    res.json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('Error fetching geo-security rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geo-security rules',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/geo-security/rules/:ruleId
 * @desc    Get specific geo-security rule
 * @access  Admin
 */
router.get('/rules/:ruleId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const rule = await GeoSecurityRule.findById(req.params.ruleId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('targetUsers', 'name email role');

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Geo-security rule not found'
      });
    }

    res.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Error fetching geo-security rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geo-security rule',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/rules
 * @desc    Create new geo-security rule
 * @access  Admin
 */
router.post('/rules', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const rule = new GeoSecurityRule(ruleData);
    await rule.save();

    await logActivity(req.user.userId, 'geo_security', 'create_rule', 'security', {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType
    });

    res.status(201).json({
      success: true,
      message: 'Geo-security rule created successfully',
      rule
    });
  } catch (error) {
    console.error('Error creating geo-security rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create geo-security rule',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/geo-security/rules/:ruleId
 * @desc    Update geo-security rule
 * @access  Admin
 */
router.put('/rules/:ruleId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const rule = await GeoSecurityRule.findById(req.params.ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Geo-security rule not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
        rule[key] = req.body[key];
      }
    });

    rule.updatedBy = req.user.userId;
    await rule.save();

    await logActivity(req.user.userId, 'geo_security', 'update_rule', 'security', {
      ruleId: rule._id,
      ruleName: rule.name
    });

    res.json({
      success: true,
      message: 'Geo-security rule updated successfully',
      rule
    });
  } catch (error) {
    console.error('Error updating geo-security rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update geo-security rule',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/geo-security/rules/:ruleId
 * @desc    Delete geo-security rule
 * @access  Admin
 */
router.delete('/rules/:ruleId', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const rule = await GeoSecurityRule.findById(req.params.ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Geo-security rule not found'
      });
    }

    await GeoSecurityRule.findByIdAndDelete(req.params.ruleId);

    await logActivity(req.user.userId, 'geo_security', 'delete_rule', 'security', {
      ruleId: rule._id,
      ruleName: rule.name
    });

    res.json({
      success: true,
      message: 'Geo-security rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting geo-security rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete geo-security rule',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/rules/:ruleId/toggle
 * @desc    Toggle rule active status
 * @access  Admin
 */
router.post('/rules/:ruleId/toggle', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const rule = await GeoSecurityRule.findById(req.params.ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Geo-security rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    rule.updatedBy = req.user.userId;
    await rule.save();

    await logActivity(req.user.userId, 'geo_security', 'toggle_rule', 'security', {
      ruleId: rule._id,
      ruleName: rule.name,
      isActive: rule.isActive
    });

    res.json({
      success: true,
      message: `Geo-security rule ${rule.isActive ? 'activated' : 'deactivated'}`,
      rule
    });
  } catch (error) {
    console.error('Error toggling geo-security rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle geo-security rule',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/evaluate
 * @desc    Evaluate a location against all rules (for testing)
 * @access  Admin
 */
router.post('/evaluate', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId, userRole, location } = req.body;

    if (!userId || !userRole || !location) {
      return res.status(400).json({
        success: false,
        message: 'userId, userRole, and location are required'
      });
    }

    const evaluation = await GeoSecurityRule.evaluateLocation(userId, userRole, location);

    res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error('Error evaluating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate location',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/geo-security/statistics
 * @desc    Get geo-security rule statistics
 * @access  Admin
 */
router.get('/statistics', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const statistics = await GeoSecurityRule.getRuleStatistics();

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/test-location
 * @desc    Test if a location would be allowed (without recording)
 * @access  Admin
 */
router.post('/test-location', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { userId, userRole, location } = req.body;

    if (!location || !location.ip) {
      return res.status(400).json({
        success: false,
        message: 'Location with IP address is required'
      });
    }

    // Use dummy user if not provided
    const testUserId = userId || req.user.userId;
    const testUserRole = userRole || req.user.role;

    const evaluation = await GeoSecurityRule.evaluateLocation(testUserId, testUserRole, location);

    res.json({
      success: true,
      message: 'Location test completed',
      evaluation,
      testDetails: {
        userId: testUserId,
        userRole: testUserRole,
        location
      }
    });
  } catch (error) {
    console.error('Error testing location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test location',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/geo-security/triggered-rules
 * @desc    Get recently triggered rules
 * @access  Admin
 */
router.get('/triggered-rules', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const rules = await GeoSecurityRule.find({
      'stats.lastTriggered': { $exists: true }
    })
      .sort({ 'stats.lastTriggered': -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .select('name ruleType scope stats isActive');

    res.json({
      success: true,
      count: rules.length,
      rules
    });
  } catch (error) {
    console.error('Error fetching triggered rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch triggered rules',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/bulk-toggle
 * @desc    Bulk toggle rules active/inactive
 * @access  Admin
 */
router.post('/bulk-toggle', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { ruleIds, isActive } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ruleIds array is required'
      });
    }

    const result = await GeoSecurityRule.updateMany(
      { _id: { $in: ruleIds } },
      {
        $set: {
          isActive: isActive === true,
          updatedBy: req.user.userId
        }
      }
    );

    await logActivity(req.user.userId, 'geo_security', 'bulk_toggle', 'security', {
      ruleCount: ruleIds.length,
      isActive
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} rules ${isActive ? 'activated' : 'deactivated'}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk toggling rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk toggle rules',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/geo-security/rules/:ruleId/test
 * @desc    Test a specific rule against a location
 * @access  Admin
 */
router.post('/rules/:ruleId/test', authenticateToken, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const { location } = req.body;

    const rule = await GeoSecurityRule.findById(req.params.ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Geo-security rule not found'
      });
    }

    const matchesLocation = rule.matchesLocation(location);
    const matchesTime = rule.matchesTimeRestrictions();
    const appliesToUser = rule.appliesToUser(req.user.userId, req.user.role);

    res.json({
      success: true,
      test: {
        ruleName: rule.name,
        ruleType: rule.ruleType,
        matchesLocation,
        matchesTime,
        appliesToUser,
        wouldTrigger: matchesLocation && matchesTime && appliesToUser
      },
      rule: {
        id: rule._id,
        name: rule.name,
        type: rule.ruleType,
        isActive: rule.isActive
      }
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test rule',
      error: error.message
    });
  }
});

export default router;
