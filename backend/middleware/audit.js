import AuditLog from '../models/AuditLog.js';

/**
 * Middleware to automatically log API requests
 */
export const auditMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original res.json to capture response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Log after response is sent
      setImmediate(async () => {
        try {
          if (req.user && shouldLog(req)) {
            await createAuditLog(req, res, data, duration);
          }
        } catch (error) {
          console.error('Error in audit middleware:', error);
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Determine if request should be logged
 */
function shouldLog(req) {
  const { method, path } = req;
  
  // Don't log GET requests to reduce noise (except sensitive endpoints)
  const sensitiveGetPaths = ['/api/users', '/api/admin', '/api/settings', '/api/audit'];
  const isSensitiveGet = method === 'GET' && sensitiveGetPaths.some(p => path.startsWith(p));
  
  if (method === 'GET' && !isSensitiveGet) {
    return false;
  }
  
  // Don't log health checks and static assets
  const ignorePaths = ['/api/health', '/api/verify', '/static', '/assets'];
  if (ignorePaths.some(p => path.startsWith(p))) {
    return false;
  }
  
  return true;
}

/**
 * Create audit log entry
 */
async function createAuditLog(req, res, responseData, duration) {
  const { user, method, path, body, params, query } = req;
  
  const action = determineAction(method, path, body);
  const category = determineCategory(path);
  const { targetType, targetId, targetName } = determineTarget(path, body, params, responseData);
  
  const logData = {
    userId: user._id,
    username: user.username || user.email || `${user.firstName} ${user.lastName}`,
    userRole: user.role,
    action,
    category,
    targetType,
    targetId,
    targetName,
    description: generateDescription(action, user, targetName, body),
    metadata: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requestMethod: method,
      requestPath: path,
      duration,
      statusCode: res.statusCode
    },
    severity: determineSeverity(action, res.statusCode),
    success: res.statusCode < 400
  };
  
  // Add changes if it's an update operation
  if (method === 'PUT' || method === 'PATCH') {
    logData.changes = {
      after: sanitizeData(body)
    };
  }
  
  // Add error details if request failed
  if (res.statusCode >= 400 && responseData?.message) {
    logData.error = {
      message: responseData.message,
      code: responseData.code
    };
  }
  
  await AuditLog.log(logData);
}

/**
 * Determine action from request
 */
function determineAction(method, path, body) {
  // Authentication
  if (path.includes('/login')) return body.twoFactorToken ? 'login' : 'login_attempt';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/password')) return 'password_change';
  if (path.includes('/2fa/setup')) return '2fa_enabled';
  if (path.includes('/2fa/disable')) return '2fa_disabled';
  
  // Users
  if (path.includes('/users')) {
    if (method === 'POST') return 'user_created';
    if (method === 'PUT' || method === 'PATCH') return 'user_updated';
    if (method === 'DELETE') return 'user_deleted';
  }
  
  // Trips
  if (path.includes('/trips') && !path.includes('/recurring')) {
    if (method === 'POST') return 'trip_created';
    if (method === 'PUT' || method === 'PATCH') return 'trip_updated';
    if (method === 'DELETE') return 'trip_deleted';
    if (path.includes('/cancel')) return 'trip_cancelled';
    if (path.includes('/complete')) return 'trip_completed';
    if (path.includes('/assign')) return 'trip_assigned';
  }
  
  // Recurring Trips
  if (path.includes('/recurring-trips')) {
    if (method === 'POST') return 'recurring_trip_created';
    if (method === 'PUT' || method === 'PATCH') return 'recurring_trip_updated';
    if (method === 'DELETE') return 'recurring_trip_deleted';
  }
  
  // Vehicles
  if (path.includes('/vehicles')) {
    if (method === 'POST') return 'vehicle_created';
    if (method === 'PUT' || method === 'PATCH') return 'vehicle_updated';
    if (method === 'DELETE') return 'vehicle_deleted';
  }
  
  // Riders
  if (path.includes('/riders')) {
    if (method === 'POST') return 'rider_created';
    if (method === 'PUT' || method === 'PATCH') return 'rider_updated';
    if (method === 'DELETE') return 'rider_deleted';
  }
  
  // Settings
  if (path.includes('/settings') || path.includes('/config')) {
    return 'settings_updated';
  }
  
  // Holidays
  if (path.includes('/holidays')) {
    if (method === 'POST') return 'holiday_added';
    if (method === 'DELETE') return 'holiday_removed';
  }
  
  // Work Schedule
  if (path.includes('/work-schedule') || path.includes('/timeoff')) {
    if (method === 'POST') return path.includes('/approve') ? 'timeoff_approved' : 'schedule_created';
    if (method === 'PUT') return 'schedule_updated';
    if (method === 'DELETE') return 'schedule_deleted';
  }
  
  return 'other';
}

/**
 * Determine category from path
 */
function determineCategory(path) {
  if (path.includes('/login') || path.includes('/logout') || path.includes('/password') || path.includes('/2fa')) {
    return 'authentication';
  }
  if (path.includes('/users')) return 'user_management';
  if (path.includes('/trips')) return 'trip_management';
  if (path.includes('/vehicles')) return 'vehicle_management';
  if (path.includes('/riders')) return 'rider_management';
  if (path.includes('/settings') || path.includes('/config') || path.includes('/holidays')) {
    return 'settings';
  }
  if (path.includes('/notifications')) return 'notification';
  if (path.includes('/work-schedule') || path.includes('/timeoff')) return 'schedule';
  if (path.includes('/admin') || path.includes('/audit')) return 'system';
  
  return 'other';
}

/**
 * Determine target from request
 */
function determineTarget(path, body, params, responseData) {
  let targetType = null;
  let targetId = null;
  let targetName = null;
  
  // Extract ID from params or body
  const id = params.id || params.userId || params.tripId || params.vehicleId || params.riderId || body._id || responseData?._id || responseData?.user?._id;
  
  if (path.includes('/users')) {
    targetType = 'User';
    targetId = id;
    targetName = body.username || body.email || `${body.firstName} ${body.lastName}`;
  } else if (path.includes('/trips') && !path.includes('/recurring')) {
    targetType = 'Trip';
    targetId = id;
    targetName = body.title || `Trip ${id}`;
  } else if (path.includes('/recurring-trips')) {
    targetType = 'RecurringTrip';
    targetId = id;
    targetName = body.title;
  } else if (path.includes('/vehicles')) {
    targetType = 'Vehicle';
    targetId = id;
    targetName = body.licensePlate || body.vehicleNumber;
  } else if (path.includes('/riders')) {
    targetType = 'Rider';
    targetId = id;
    targetName = body.name || `${body.firstName} ${body.lastName}`;
  } else if (path.includes('/settings')) {
    targetType = 'Settings';
    targetName = 'System Settings';
  } else if (path.includes('/work-schedule')) {
    targetType = 'WorkSchedule';
    targetId = id;
  }
  
  return { targetType, targetId, targetName };
}

/**
 * Generate human-readable description
 */
function generateDescription(action, user, targetName, body) {
  const userName = user.username || user.email || `${user.firstName} ${user.lastName}`;
  
  const descriptions = {
    login: `${userName} logged in successfully`,
    login_attempt: `${userName} attempted to login`,
    logout: `${userName} logged out`,
    password_change: `${userName} changed their password`,
    '2fa_enabled': `${userName} enabled two-factor authentication`,
    '2fa_disabled': `${userName} disabled two-factor authentication`,
    user_created: `${userName} created user: ${targetName}`,
    user_updated: `${userName} updated user: ${targetName}`,
    user_deleted: `${userName} deleted user: ${targetName}`,
    trip_created: `${userName} created trip: ${targetName}`,
    trip_updated: `${userName} updated trip: ${targetName}`,
    trip_deleted: `${userName} deleted trip: ${targetName}`,
    trip_cancelled: `${userName} cancelled trip: ${targetName}`,
    trip_completed: `${userName} completed trip: ${targetName}`,
    trip_assigned: `${userName} assigned trip: ${targetName}`,
    recurring_trip_created: `${userName} created recurring trip: ${targetName}`,
    recurring_trip_updated: `${userName} updated recurring trip: ${targetName}`,
    recurring_trip_deleted: `${userName} deleted recurring trip: ${targetName}`,
    vehicle_created: `${userName} created vehicle: ${targetName}`,
    vehicle_updated: `${userName} updated vehicle: ${targetName}`,
    vehicle_deleted: `${userName} deleted vehicle: ${targetName}`,
    rider_created: `${userName} created rider: ${targetName}`,
    rider_updated: `${userName} updated rider: ${targetName}`,
    rider_deleted: `${userName} deleted rider: ${targetName}`,
    settings_updated: `${userName} updated system settings`,
    holiday_added: `${userName} added custom holiday: ${targetName || body.name}`,
    holiday_removed: `${userName} removed custom holiday: ${targetName}`,
    schedule_created: `${userName} created work schedule`,
    schedule_updated: `${userName} updated work schedule`,
    timeoff_approved: `${userName} approved time-off request`,
    other: `${userName} performed action: ${action}`
  };
  
  return descriptions[action] || `${userName} performed ${action}`;
}

/**
 * Determine severity based on action and status
 */
function determineSeverity(action, statusCode) {
  // Failed requests
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'warning';
  
  // Critical actions
  const criticalActions = ['user_deleted', 'trip_deleted', '2fa_disabled', 'settings_updated'];
  if (criticalActions.includes(action)) return 'warning';
  
  // Security actions
  const securityActions = ['login', 'login_attempt', 'password_change', '2fa_enabled'];
  if (securityActions.includes(action)) return 'info';
  
  return 'info';
}

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data) {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'twoFactorSecret', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Manual audit logging helper
 */
export const logAudit = async (data) => {
  try {
    return await AuditLog.log(data);
  } catch (error) {
    console.error('Error creating manual audit log:', error);
    return null;
  }
};

export default { auditMiddleware, logAudit };
