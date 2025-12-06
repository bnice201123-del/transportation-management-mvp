/**
 * Permission Model
 * 
 * Manages granular role-based access control (RBAC) permissions.
 * Defines what actions each role can perform on specific resources.
 * 
 * Permission Structure:
 * - Resource: The entity being accessed (users, trips, vehicles, etc.)
 * - Action: The operation being performed (create, read, update, delete, etc.)
 * - Role: The user role (admin, dispatcher, driver, scheduler, rider)
 * - Conditions: Optional conditions for dynamic permission checking
 */

import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  // Resource being accessed
  resource: {
    type: String,
    required: true,
    enum: [
      'users',
      'trips',
      'riders',
      'vehicles',
      'locations',
      'analytics',
      'settings',
      'audit-logs',
      'notifications',
      'work-schedule',
      'recurring-trips',
      'gps-tracking',
      'holidays',
      'rate-limits',
      'sessions',
      'encryption',
      'permissions',
      'gdpr',
      'two-factor'
    ],
    index: true
  },
  
  // Action being performed
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'export',
      'import',
      'approve',
      'assign',
      'manage',
      'execute'
    ],
    index: true
  },
  
  // Role that has this permission
  role: {
    type: String,
    required: true,
    enum: ['admin', 'dispatcher', 'driver', 'scheduler', 'rider'],
    index: true
  },
  
  // Permission granted or denied
  granted: {
    type: Boolean,
    default: true,
    description: 'Whether permission is granted (true) or explicitly denied (false)'
  },
  
  // Optional conditions for dynamic permission checking
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    description: 'Conditions that must be met (e.g., {"owner": true} means user must own the resource)'
  },
  
  // Description of what this permission allows
  description: {
    type: String
  },
  
  // Whether this is a default system permission or custom
  isSystem: {
    type: Boolean,
    default: false,
    description: 'System permissions cannot be deleted, only modified'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for efficient permission lookups
permissionSchema.index({ role: 1, resource: 1, action: 1 }, { unique: true });

/**
 * Check if a role has permission for a specific action on a resource
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {Object} context - Optional context for condition checking
 * @returns {Promise<boolean>} True if permission granted
 */
permissionSchema.statics.hasPermission = async function(role, resource, action, context = {}) {
  const permission = await this.findOne({ role, resource, action });
  
  if (!permission) {
    return false;
  }
  
  if (!permission.granted) {
    return false;
  }
  
  // Check conditions if present
  if (permission.conditions && permission.conditions.size > 0) {
    return this.checkConditions(permission.conditions, context);
  }
  
  return true;
};

/**
 * Check if conditions are met
 * @param {Map} conditions - Permission conditions
 * @param {Object} context - Context object with values to check
 * @returns {boolean} True if all conditions met
 */
permissionSchema.statics.checkConditions = function(conditions, context) {
  for (const [key, value] of conditions) {
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
};

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {Promise<Array>} Array of permissions
 */
permissionSchema.statics.getRolePermissions = async function(role) {
  return await this.find({ role, granted: true })
    .select('resource action description conditions')
    .sort({ resource: 1, action: 1 });
};

/**
 * Get permission matrix (all roles and their permissions)
 * @returns {Promise<Object>} Matrix object with roles as keys
 */
permissionSchema.statics.getPermissionMatrix = async function() {
  const permissions = await this.find({ granted: true });
  
  const matrix = {};
  const roles = ['admin', 'dispatcher', 'driver', 'scheduler', 'rider'];
  
  // Initialize matrix structure
  roles.forEach(role => {
    matrix[role] = {};
  });
  
  // Populate matrix
  permissions.forEach(perm => {
    if (!matrix[perm.role][perm.resource]) {
      matrix[perm.role][perm.resource] = [];
    }
    matrix[perm.role][perm.resource].push(perm.action);
  });
  
  return matrix;
};

/**
 * Update or create permission
 * @param {string} role - Role name
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @param {boolean} granted - Whether permission is granted
 * @param {Object} options - Additional options (conditions, description, userId)
 * @returns {Promise<Permission>} Updated or created permission
 */
permissionSchema.statics.setPermission = async function(role, resource, action, granted, options = {}) {
  const permission = await this.findOneAndUpdate(
    { role, resource, action },
    {
      granted,
      conditions: options.conditions || new Map(),
      description: options.description,
      modifiedBy: options.userId,
      isSystem: options.isSystem || false
    },
    { upsert: true, new: true }
  );
  
  return permission;
};

/**
 * Initialize default permissions for all roles
 * @returns {Promise<number>} Number of permissions created
 */
permissionSchema.statics.initializeDefaultPermissions = async function() {
  const defaultPermissions = [
    // Admin - Full access to everything
    { role: 'admin', resource: 'users', action: 'manage', description: 'Full user management', isSystem: true },
    { role: 'admin', resource: 'trips', action: 'manage', description: 'Full trip management', isSystem: true },
    { role: 'admin', resource: 'riders', action: 'manage', description: 'Full rider management', isSystem: true },
    { role: 'admin', resource: 'vehicles', action: 'manage', description: 'Full vehicle management', isSystem: true },
    { role: 'admin', resource: 'locations', action: 'manage', description: 'Full location management', isSystem: true },
    { role: 'admin', resource: 'analytics', action: 'read', description: 'View all analytics', isSystem: true },
    { role: 'admin', resource: 'settings', action: 'manage', description: 'Manage system settings', isSystem: true },
    { role: 'admin', resource: 'audit-logs', action: 'read', description: 'View audit logs', isSystem: true },
    { role: 'admin', resource: 'notifications', action: 'manage', description: 'Manage notifications', isSystem: true },
    { role: 'admin', resource: 'work-schedule', action: 'manage', description: 'Manage work schedules', isSystem: true },
    { role: 'admin', resource: 'recurring-trips', action: 'manage', description: 'Manage recurring trips', isSystem: true },
    { role: 'admin', resource: 'gps-tracking', action: 'read', description: 'View GPS tracking', isSystem: true },
    { role: 'admin', resource: 'holidays', action: 'manage', description: 'Manage holidays', isSystem: true },
    { role: 'admin', resource: 'rate-limits', action: 'manage', description: 'Manage rate limits', isSystem: true },
    { role: 'admin', resource: 'sessions', action: 'manage', description: 'Manage user sessions', isSystem: true },
    { role: 'admin', resource: 'encryption', action: 'manage', description: 'Manage encryption', isSystem: true },
    { role: 'admin', resource: 'permissions', action: 'manage', description: 'Manage permissions', isSystem: true },
    { role: 'admin', resource: 'gdpr', action: 'manage', description: 'Manage GDPR requests', isSystem: true },
    
    // Dispatcher - Trip and rider management
    { role: 'dispatcher', resource: 'trips', action: 'create', description: 'Create trips', isSystem: true },
    { role: 'dispatcher', resource: 'trips', action: 'read', description: 'View trips', isSystem: true },
    { role: 'dispatcher', resource: 'trips', action: 'update', description: 'Update trips', isSystem: true },
    { role: 'dispatcher', resource: 'trips', action: 'delete', description: 'Delete trips', isSystem: true },
    { role: 'dispatcher', resource: 'trips', action: 'assign', description: 'Assign trips to drivers', isSystem: true },
    { role: 'dispatcher', resource: 'riders', action: 'read', description: 'View riders', isSystem: true },
    { role: 'dispatcher', resource: 'riders', action: 'update', description: 'Update rider info', isSystem: true },
    { role: 'dispatcher', resource: 'vehicles', action: 'read', description: 'View vehicles', isSystem: true },
    { role: 'dispatcher', resource: 'users', action: 'read', description: 'View users (drivers)', isSystem: true },
    { role: 'dispatcher', resource: 'gps-tracking', action: 'read', description: 'View GPS tracking', isSystem: true },
    { role: 'dispatcher', resource: 'notifications', action: 'create', description: 'Send notifications', isSystem: true },
    { role: 'dispatcher', resource: 'analytics', action: 'read', description: 'View analytics', isSystem: true },
    
    // Scheduler - Trip planning and recurring trips
    { role: 'scheduler', resource: 'trips', action: 'create', description: 'Create trips', isSystem: true },
    { role: 'scheduler', resource: 'trips', action: 'read', description: 'View trips', isSystem: true },
    { role: 'scheduler', resource: 'trips', action: 'update', description: 'Update trips', isSystem: true },
    { role: 'scheduler', resource: 'recurring-trips', action: 'create', description: 'Create recurring trips', isSystem: true },
    { role: 'scheduler', resource: 'recurring-trips', action: 'read', description: 'View recurring trips', isSystem: true },
    { role: 'scheduler', resource: 'recurring-trips', action: 'update', description: 'Update recurring trips', isSystem: true },
    { role: 'scheduler', resource: 'riders', action: 'read', description: 'View riders', isSystem: true },
    { role: 'scheduler', resource: 'vehicles', action: 'read', description: 'View vehicles', isSystem: true },
    { role: 'scheduler', resource: 'users', action: 'read', description: 'View users (drivers)', isSystem: true },
    { role: 'scheduler', resource: 'work-schedule', action: 'read', description: 'View work schedules', isSystem: true },
    { role: 'scheduler', resource: 'holidays', action: 'read', description: 'View holidays', isSystem: true },
    { role: 'scheduler', resource: 'analytics', action: 'read', description: 'View analytics', isSystem: true },
    
    // Driver - Own trips and updates
    { role: 'driver', resource: 'trips', action: 'read', description: 'View assigned trips', isSystem: true },
    { role: 'driver', resource: 'trips', action: 'update', description: 'Update trip status', isSystem: true },
    { role: 'driver', resource: 'riders', action: 'read', description: 'View assigned riders', isSystem: true },
    { role: 'driver', resource: 'gps-tracking', action: 'update', description: 'Update GPS location', isSystem: true },
    { role: 'driver', resource: 'work-schedule', action: 'read', description: 'View own schedule', isSystem: true },
    { role: 'driver', resource: 'work-schedule', action: 'create', description: 'Request time off', isSystem: true },
    { role: 'driver', resource: 'vehicles', action: 'read', description: 'View assigned vehicle', isSystem: true },
    { role: 'driver', resource: 'notifications', action: 'read', description: 'View own notifications', isSystem: true },
    
    // Rider - View own trips
    { role: 'rider', resource: 'trips', action: 'read', description: 'View own trips', isSystem: true },
    { role: 'rider', resource: 'notifications', action: 'read', description: 'View own notifications', isSystem: true },
    { role: 'rider', resource: 'gdpr', action: 'create', description: 'Request data export/deletion', isSystem: true }
  ];
  
  let count = 0;
  for (const perm of defaultPermissions) {
    await this.setPermission(
      perm.role,
      perm.resource,
      perm.action,
      true,
      {
        description: perm.description,
        isSystem: perm.isSystem
      }
    );
    count++;
  }
  
  return count;
};

/**
 * Get resources grouped by category
 * @returns {Object} Resources grouped by category
 */
permissionSchema.statics.getResourceCategories = function() {
  return {
    'Core Operations': ['trips', 'riders', 'users', 'vehicles', 'locations'],
    'Scheduling': ['recurring-trips', 'work-schedule', 'holidays'],
    'Monitoring': ['gps-tracking', 'analytics', 'notifications'],
    'Security': ['audit-logs', 'sessions', 'encryption', 'permissions', 'rate-limits', 'two-factor', 'gdpr'],
    'Configuration': ['settings']
  };
};

/**
 * Get available actions for a resource
 * @param {string} resource - Resource name
 * @returns {Array} Array of available actions
 */
permissionSchema.statics.getResourceActions = function(resource) {
  const actionMap = {
    'users': ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'trips': ['create', 'read', 'update', 'delete', 'list', 'assign', 'approve', 'export'],
    'riders': ['create', 'read', 'update', 'delete', 'list', 'export', 'manage'],
    'vehicles': ['create', 'read', 'update', 'delete', 'list', 'assign', 'manage'],
    'locations': ['create', 'read', 'update', 'delete', 'list', 'manage'],
    'analytics': ['read', 'export'],
    'settings': ['read', 'update', 'manage'],
    'audit-logs': ['read', 'export'],
    'notifications': ['create', 'read', 'delete', 'manage'],
    'work-schedule': ['create', 'read', 'update', 'delete', 'approve', 'manage'],
    'recurring-trips': ['create', 'read', 'update', 'delete', 'execute', 'manage'],
    'gps-tracking': ['read', 'update'],
    'holidays': ['create', 'read', 'update', 'delete', 'manage'],
    'rate-limits': ['read', 'manage'],
    'sessions': ['read', 'delete', 'manage'],
    'encryption': ['read', 'execute', 'manage'],
    'permissions': ['read', 'update', 'manage'],
    'gdpr': ['create', 'read', 'execute', 'manage'],
    'two-factor': ['read', 'update', 'manage']
  };
  
  return actionMap[resource] || ['create', 'read', 'update', 'delete'];
};

/**
 * Delete non-system permissions for a role
 * @param {string} role - Role name
 * @returns {Promise<number>} Number of permissions deleted
 */
permissionSchema.statics.deleteRolePermissions = async function(role, includeSystem = false) {
  const query = { role };
  if (!includeSystem) {
    query.isSystem = false;
  }
  
  const result = await this.deleteMany(query);
  return result.deletedCount;
};

/**
 * Clone permissions from one role to another
 * @param {string} sourceRole - Source role
 * @param {string} targetRole - Target role
 * @param {string} userId - User performing the action
 * @returns {Promise<number>} Number of permissions cloned
 */
permissionSchema.statics.cloneRolePermissions = async function(sourceRole, targetRole, userId) {
  const sourcePermissions = await this.find({ role: sourceRole });
  
  let count = 0;
  for (const perm of sourcePermissions) {
    await this.setPermission(
      targetRole,
      perm.resource,
      perm.action,
      perm.granted,
      {
        conditions: perm.conditions,
        description: perm.description,
        userId,
        isSystem: false // Cloned permissions are not system permissions
      }
    );
    count++;
  }
  
  return count;
};

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
