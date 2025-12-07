/**
 * Permission Management Routes
 * 
 * Admin endpoints for managing role-based access control (RBAC) permissions.
 * Handles permission CRUD, role management, and permission matrix operations.
 */

import express from 'express';
import Permission from '../models/Permission.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * GET /api/permissions/matrix
 * Get complete permission matrix for all roles
 */
router.get('/matrix', async (req, res) => {
  try {
    const matrix = await Permission.getPermissionMatrix();
    const categories = Permission.getResourceCategories();
    
    res.json({
      matrix,
      categories,
      roles: ['admin', 'dispatcher', 'driver', 'scheduler', 'rider']
    });
    
  } catch (error) {
    console.error('Error getting permission matrix:', error);
    res.status(500).json({
      error: 'Failed to get permission matrix',
      message: error.message
    });
  }
});

/**
 * GET /api/permissions/role/:role
 * Get all permissions for a specific role
 */
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'dispatcher', 'driver', 'scheduler', 'rider'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const permissions = await Permission.getRolePermissions(role);
    
    res.json({
      role,
      permissions,
      count: permissions.length
    });
    
  } catch (error) {
    console.error('Error getting role permissions:', error);
    res.status(500).json({
      error: 'Failed to get role permissions',
      message: error.message
    });
  }
});

/**
 * GET /api/permissions/check
 * Check if a role has a specific permission
 */
router.get('/check', async (req, res) => {
  try {
    const { role, resource, action } = req.query;
    
    if (!role || !resource || !action) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'role, resource, and action are required'
      });
    }
    
    const hasPermission = await Permission.hasPermission(role, resource, action);
    
    res.json({
      role,
      resource,
      action,
      granted: hasPermission
    });
    
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      error: 'Failed to check permission',
      message: error.message
    });
  }
});

/**
 * GET /api/permissions/resources
 * Get all available resources and their actions
 */
router.get('/resources', (req, res) => {
  try {
    const categories = Permission.getResourceCategories();
    const resources = {};
    
    // Get all unique resources from categories
    Object.values(categories).flat().forEach(resource => {
      resources[resource] = Permission.getResourceActions(resource);
    });
    
    res.json({
      categories,
      resources
    });
    
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({
      error: 'Failed to get resources',
      message: error.message
    });
  }
});

/**
 * POST /api/permissions
 * Create or update a permission
 */
router.post('/', async (req, res) => {
  try {
    const { role, resource, action, granted, conditions, description } = req.body;
    
    if (!role || !resource || !action) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'role, resource, and action are required'
      });
    }
    
    const permission = await Permission.setPermission(
      role,
      resource,
      action,
      granted !== false, // Default to true if not specified
      {
        conditions: conditions ? new Map(Object.entries(conditions)) : undefined,
        description,
        userId: req.user.userId
      }
    );
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.update',
      category: 'security',
      severity: 'high',
      details: {
        role,
        resource,
        action,
        granted: permission.granted,
        permissionId: permission._id
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Permission updated successfully',
      permission
    });
    
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({
      error: 'Failed to update permission',
      message: error.message
    });
  }
});

/**
 * POST /api/permissions/bulk
 * Bulk update permissions
 */
router.post('/bulk', async (req, res) => {
  try {
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        error: 'Invalid permissions array',
        message: 'permissions must be a non-empty array'
      });
    }
    
    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const perm of permissions) {
      try {
        await Permission.setPermission(
          perm.role,
          perm.resource,
          perm.action,
          perm.granted !== false,
          {
            conditions: perm.conditions ? new Map(Object.entries(perm.conditions)) : undefined,
            description: perm.description,
            userId: req.user.userId
          }
        );
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          permission: perm,
          error: error.message
        });
      }
    }
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.bulk_update',
      category: 'security',
      severity: 'high',
      details: {
        total: permissions.length,
        updated: results.updated,
        failed: results.failed
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: `Bulk update complete: ${results.updated} updated, ${results.failed} failed`,
      results
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      error: 'Failed to perform bulk update',
      message: error.message
    });
  }
});

/**
 * POST /api/permissions/initialize
 * Initialize default permissions for all roles
 */
router.post('/initialize', async (req, res) => {
  try {
    const count = await Permission.initializeDefaultPermissions();
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.initialize',
      category: 'security',
      severity: 'high',
      details: {
        permissionsCreated: count
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: `Default permissions initialized: ${count} permissions created`,
      count
    });
    
  } catch (error) {
    console.error('Error initializing permissions:', error);
    res.status(500).json({
      error: 'Failed to initialize permissions',
      message: error.message
    });
  }
});

/**
 * POST /api/permissions/clone
 * Clone permissions from one role to another
 */
router.post('/clone', async (req, res) => {
  try {
    const { sourceRole, targetRole } = req.body;
    
    if (!sourceRole || !targetRole) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sourceRole and targetRole are required'
      });
    }
    
    if (sourceRole === targetRole) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Source and target roles must be different'
      });
    }
    
    const count = await Permission.cloneRolePermissions(
      sourceRole,
      targetRole,
      req.user.userId
    );
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.clone',
      category: 'security',
      severity: 'medium',
      details: {
        sourceRole,
        targetRole,
        permissionsCloned: count
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: `Cloned ${count} permissions from ${sourceRole} to ${targetRole}`,
      count,
      sourceRole,
      targetRole
    });
    
  } catch (error) {
    console.error('Error cloning permissions:', error);
    res.status(500).json({
      error: 'Failed to clone permissions',
      message: error.message
    });
  }
});

/**
 * DELETE /api/permissions/:id
 * Delete a specific permission
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findById(id);
    
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    if (permission.isSystem) {
      return res.status(400).json({
        error: 'Cannot delete system permission',
        message: 'System permissions can only be modified, not deleted'
      });
    }
    
    await Permission.findByIdAndDelete(id);
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.delete',
      category: 'security',
      severity: 'medium',
      details: {
        permissionId: id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Permission deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      error: 'Failed to delete permission',
      message: error.message
    });
  }
});

/**
 * DELETE /api/permissions/role/:role
 * Delete all non-system permissions for a role
 */
router.delete('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { includeSystem } = req.query;
    
    if (!['admin', 'dispatcher', 'driver', 'scheduler', 'rider'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const count = await Permission.deleteRolePermissions(role, includeSystem === 'true');
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.role.delete',
      category: 'security',
      severity: 'high',
      details: {
        role,
        permissionsDeleted: count,
        includeSystem: includeSystem === 'true'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: `Deleted ${count} permissions for role: ${role}`,
      count
    });
    
  } catch (error) {
    console.error('Error deleting role permissions:', error);
    res.status(500).json({
      error: 'Failed to delete role permissions',
      message: error.message
    });
  }
});

/**
 * GET /api/permissions/stats
 * Get permission statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [total, granted, denied, system, custom] = await Promise.all([
      Permission.countDocuments(),
      Permission.countDocuments({ granted: true }),
      Permission.countDocuments({ granted: false }),
      Permission.countDocuments({ isSystem: true }),
      Permission.countDocuments({ isSystem: false })
    ]);
    
    const roleStats = {};
    const roles = ['admin', 'dispatcher', 'driver', 'scheduler', 'rider'];
    
    for (const role of roles) {
      roleStats[role] = await Permission.countDocuments({ role, granted: true });
    }
    
    res.json({
      total,
      granted,
      denied,
      system,
      custom,
      byRole: roleStats
    });
    
  } catch (error) {
    console.error('Error getting permission stats:', error);
    res.status(500).json({
      error: 'Failed to get permission statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/permissions/reset/:role
 * Reset role permissions to defaults
 */
router.post('/reset/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['admin', 'dispatcher', 'driver', 'scheduler', 'rider'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Delete all permissions for this role
    await Permission.deleteRolePermissions(role, true);
    
    // Reinitialize default permissions
    await Permission.initializeDefaultPermissions();
    
    const count = await Permission.countDocuments({ role });
    
    await logAudit({
      userId: req.user.userId,
      action: 'permission.role.reset',
      category: 'security',
      severity: 'high',
      details: {
        role,
        permissionsReset: count
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: `Reset ${count} permissions for role: ${role}`,
      count
    });
    
  } catch (error) {
    console.error('Error resetting role permissions:', error);
    res.status(500).json({
      error: 'Failed to reset role permissions',
      message: error.message
    });
  }
});

export default router;
