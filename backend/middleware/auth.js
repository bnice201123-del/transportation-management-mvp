import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Permission from '../models/Permission.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Support both single role (legacy) and multiple roles array
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];

    // Check if user has at least one of the required roles
    const hasAccess = roles.some(role => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. User roles: ${userRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Support both single role (legacy) and multiple roles array
  const userRoles = req.user.roles && req.user.roles.length > 0 
    ? req.user.roles 
    : [req.user.role];

  // Check if user has admin role
  const isAdmin = userRoles.includes('admin');

  if (!isAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

/**
 * Permission-based authorization middleware
 * Checks if user has permission for specific resource and action
 * @param {string} resource - The resource to check (e.g., 'trips', 'users')
 * @param {string} action - The action to check (e.g., 'create', 'read', 'update')
 * @param {object} contextProvider - Optional function that returns context for conditional permissions
 */
export const requirePermission = (resource, action, contextProvider = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // Get user's primary role
      const userRole = req.user.roles && req.user.roles.length > 0 
        ? req.user.roles[0] 
        : req.user.role;

      // Prepare context for conditional permissions
      const context = contextProvider ? contextProvider(req) : {
        userId: req.user._id.toString(),
        userRole,
        params: req.params,
        query: req.query,
        body: req.body
      };

      // Check permission
      const hasPermission = await Permission.hasPermission(
        userRole,
        resource,
        action,
        context
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to ${action} ${resource}.`,
          required: { resource, action },
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to check multiple permissions (user needs ANY of them)
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission objects
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const userRole = req.user.roles && req.user.roles.length > 0 
        ? req.user.roles[0] 
        : req.user.role;

      const context = {
        userId: req.user._id.toString(),
        userRole,
        params: req.params,
        query: req.query,
        body: req.body
      };

      // Check if user has ANY of the required permissions
      const permissionChecks = await Promise.all(
        permissions.map(({ resource, action }) =>
          Permission.hasPermission(userRole, resource, action, context)
        )
      );

      const hasAnyPermission = permissionChecks.some(check => check === true);

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          message: 'Access denied. You don\'t have any of the required permissions.',
          required: permissions,
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to check multiple permissions (user needs ALL of them)
 * @param {Array<{resource: string, action: string}>} permissions - Array of permission objects
 */
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const userRole = req.user.roles && req.user.roles.length > 0 
        ? req.user.roles[0] 
        : req.user.role;

      const context = {
        userId: req.user._id.toString(),
        userRole,
        params: req.params,
        query: req.query,
        body: req.body
      };

      // Check if user has ALL of the required permissions
      const permissionChecks = await Promise.all(
        permissions.map(({ resource, action }) =>
          Permission.hasPermission(userRole, resource, action, context)
        )
      );

      const hasAllPermissions = permissionChecks.every(check => check === true);

      if (!hasAllPermissions) {
        return res.status(403).json({ 
          message: 'Access denied. You need all of the required permissions.',
          required: permissions,
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};