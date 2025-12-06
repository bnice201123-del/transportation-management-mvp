# 📋 Audit Trail System - Feature Documentation

> **Implementation Date:** December 6, 2025  
> **Status:** ✅ Complete  
> **Priority:** Critical - Security & Compliance

---

## 📖 Overview

The Audit Trail System provides comprehensive logging and monitoring of all critical actions within the Transportation Management System. This feature enables:

- **Security Monitoring** - Track all user activities for security analysis
- **Compliance** - Meet regulatory requirements for action tracking
- **Troubleshooting** - Investigate issues with detailed operation history
- **Accountability** - Create clear audit trails for all system changes
- **Analytics** - Analyze user behavior and system usage patterns

---

## 🎯 Key Features

### 1. **Comprehensive Logging**
- **40+ Action Types** covering all critical operations
- **10 Categories**: Authentication, User Management, Trip Management, Security, etc.
- **Change Tracking**: Before/after values for all modifications
- **Metadata Capture**: IP address, user agent, duration, status codes

### 2. **Smart Filtering & Search**
- **Text Search**: Full-text search across descriptions, usernames, targets, IPs
- **Multi-Filter**: Category, severity, success/failure, date ranges, actions
- **Pagination**: Efficient browsing with configurable page sizes
- **Sorting**: Flexible sorting options

### 3. **Statistics & Analytics**
- **Activity Aggregation**: By category, action, severity, success rate
- **Timeline Views**: Activity over time (hour/day/week/month grouping)
- **Top Users**: Most active users by log count
- **Export**: CSV export with 12 columns for external analysis

### 4. **Security Features**
- **Sensitive Data Redaction**: Automatic sanitization of passwords, tokens, secrets
- **Access Control**: Admin-only access to audit logs
- **Severity Levels**: Info, Warning, Error, Critical classification
- **Automatic Cleanup**: Configurable retention with TTL support

---

## 🏗️ Architecture

### Backend Components

#### 1. **AuditLog Model** (`backend/models/AuditLog.js`)

**Schema:**
```javascript
{
  userId: ObjectId,              // User who performed the action
  username: String,              // Username for quick display
  userRole: String,              // User role at time of action
  action: String (enum),         // One of 40+ predefined actions
  category: String (enum),       // One of 10 categories
  targetType: String,            // Type of resource affected
  targetId: String,              // ID of affected resource
  targetName: String,            // Display name of affected resource
  description: String,           // Human-readable description
  changes: {                     // Before/after values
    before: Mixed,
    after: Mixed
  },
  metadata: {                    // Request metadata
    ipAddress: String,
    userAgent: String,
    duration: Number,
    statusCode: Number
  },
  severity: String (enum),       // info|warning|error|critical
  success: Boolean,              // Operation success/failure
  error: {                       // Error details if failed
    message: String,
    stack: String,
    code: String
  },
  tags: [String],                // Custom tags
  expiresAt: Date                // Automatic deletion date
}
```

**Indexes:**
- Compound: `userId + createdAt`, `action + createdAt`, `category + createdAt`
- Single: `targetType + targetId`, `severity`, `success`
- Text: `description, username, targetName, metadata.ipAddress`

**Static Methods:**
- `log(data)` - Create audit entry
- `getLogs(filters, options)` - Query with pagination
- `getStatistics(filters)` - Aggregated analytics
- `getTimeline(filters)` - Activity timeline

#### 2. **Audit Middleware** (`backend/middleware/audit.js`)

**Functions:**
- `auditMiddleware(options)` - Express middleware for automatic logging
- `shouldLog(req)` - Smart filtering (excludes GETs, health checks, static assets)
- `determineAction(method, path, body)` - Maps requests to action types
- `determineCategory(path)` - Categorizes by endpoint
- `determineTarget(path, body, params, response)` - Identifies affected resources
- `generateDescription(action, user, targetName)` - Human-readable descriptions
- `determineSeverity(action, statusCode)` - Risk assessment
- `sanitizeData(data)` - Redacts sensitive fields
- `logAudit(data)` - Manual logging helper

**Automatic Logging:**
The middleware intercepts responses and automatically logs:
- HTTP method, path, status code
- Request body (sanitized)
- User information
- Duration
- Result data

**Manual Logging:**
For operations requiring custom logging:
```javascript
await logAudit({
  userId: req.user._id,
  username: req.user.username,
  userRole: req.user.role,
  action: 'user_created',
  category: 'user_management',
  description: 'Created new user: john_doe (driver)',
  targetType: 'User',
  targetId: user._id.toString(),
  targetName: 'John Doe',
  metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
  severity: 'info',
  success: true
});
```

#### 3. **Audit Routes** (`backend/routes/audit.js`)

**Endpoints (All Admin-Only):**

1. **GET /api/audit/logs** - Get filtered audit logs
   - Query params: `userId`, `action`, `category`, `severity`, `success`, `targetType`, `startDate`, `endDate`, `search`, `page`, `limit`, `sort`
   - Returns: Paginated logs with user details

2. **GET /api/audit/logs/:id** - Get single audit log detail
   - Returns: Full log entry with populated user

3. **GET /api/audit/statistics** - Get aggregated statistics
   - Query params: `startDate`, `endDate`
   - Returns: Counts by category, action, severity, success, top users

4. **GET /api/audit/timeline** - Get activity timeline
   - Query params: `groupBy` (hour|day|week|month), `startDate`, `endDate`
   - Returns: Time-series data

5. **GET /api/audit/user/:userId** - Get user-specific logs
   - Access: Admin or self
   - Returns: All logs for specified user

6. **GET /api/audit/actions** - List available actions/categories
   - Returns: Distinct actions and categories in system

7. **GET /api/audit/export** - Export logs to CSV
   - Query params: Same as GET /logs
   - Returns: CSV file with 12 columns

8. **DELETE /api/audit/logs/:id** - Delete single log (testing only)
   - Access: Admin only
   - Returns: Success confirmation

9. **POST /api/audit/cleanup** - Bulk delete old logs
   - Body: `olderThanDays` (minimum 30), `preserveSeverity` (optional)
   - Returns: Count of deleted logs

10. **GET /api/audit/recent** - Last 24 hours activity
    - Returns: Most recent 100 logs

### Frontend Components

#### **AuditLogViewer** (`frontend/src/components/admin/AuditLogViewer.jsx`)

**Features:**

**Two Main Tabs:**

1. **Activity Logs Tab**
   - Comprehensive filter panel:
     - Search box (text search)
     - Category dropdown
     - Severity dropdown
     - Success/Failed filter
     - Date range picker
   - Data table with columns:
     - Time (formatted timestamp)
     - User (name + role badge)
     - Action (code badge)
     - Category (badge)
     - Description (truncated)
     - Severity (colored badge)
     - Status (success/failed badge)
     - Actions (view details button)
   - Pagination controls
   - Export CSV button
   - Clear filters button

2. **Statistics Tab**
   - Summary cards:
     - Total logs
     - Successful/Failed counts with percentages
   - Activity by category (grid view with counts)
   - Top actions (ranked list with counts)

**Detail Modal:**
Opens when clicking "View Details" on any log entry
- Full timestamp
- User information (name, role)
- Action with category and severity badges
- Complete description
- Target information (type, name/ID)
- Metadata (IP, status code, duration)
- Error details (if failed)

**UI/UX Features:**
- Responsive design (mobile-friendly)
- Dark mode support
- Loading states with spinners
- Toast notifications for errors
- Empty state messaging
- Color-coded severity levels:
  - Info: Blue
  - Warning: Orange
  - Error: Red
  - Critical: Purple

---

## 📊 Action Types & Categories

### Action Types (40+)

**Authentication:**
- `login_success`, `login_failed`, `logout`, `password_changed`, `password_reset_requested`, `2fa_enabled`, `2fa_disabled`

**User Management:**
- `user_created`, `user_updated`, `user_deleted`, `user_deactivated`, `user_activated`, `role_changed`, `permissions_updated`

**Trip Management:**
- `trip_created`, `trip_updated`, `trip_deleted`, `trip_cancelled`, `trip_assigned`, `trip_started`, `trip_completed`, `trip_status_changed`

**Vehicle Management:**
- `vehicle_created`, `vehicle_updated`, `vehicle_deleted`, `vehicle_assigned`, `vehicle_maintenance`

**Rider Management:**
- `rider_created`, `rider_updated`, `rider_deleted`, `rider_balance_adjusted`

**Settings:**
- `settings_updated`, `system_config_changed`

**Security:**
- `security_alert`, `access_denied`, `suspicious_activity`

**Notification:**
- `notification_sent`, `notification_failed`

**Schedule:**
- `schedule_created`, `schedule_updated`, `time_off_requested`, `time_off_approved`

**System:**
- `system_started`, `system_error`, `backup_created`, `data_exported`

### Categories (10)

1. **authentication** - Login, logout, auth failures
2. **user_management** - User CRUD operations
3. **trip_management** - Trip operations and lifecycle
4. **vehicle_management** - Vehicle operations
5. **rider_management** - Rider operations
6. **settings** - Configuration changes
7. **security** - Security events and alerts
8. **notification** - Notification operations
9. **schedule** - Scheduling and time-off
10. **system** - System-level operations

---

## 🔒 Security Considerations

### Sensitive Data Redaction

The following fields are automatically sanitized before storage:
- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `secret` → `[REDACTED]`
- `twoFactorSecret` → `[REDACTED]`
- `apiKey` → `[REDACTED]`

### Access Control

- **Read Access**: Admin only (except user-specific logs where self-access is allowed)
- **Write Access**: System only (no manual log creation via API)
- **Delete Access**: Admin only (primarily for testing/maintenance)

### Data Retention

- Configurable TTL via `expiresAt` field
- Cleanup endpoint enforces 30-day minimum retention
- Critical and error logs can be preserved during cleanup

---

## 🚀 Usage Guide

### For Administrators

**Viewing Audit Logs:**
1. Navigate to Admin Settings
2. Click "Audit Logs" tab
3. Use filters to narrow down results:
   - Search for specific text
   - Filter by category (e.g., "Security", "User Management")
   - Filter by severity (e.g., "Critical", "Error")
   - Select date range
4. Click "View Details" on any entry for full information

**Exporting Logs:**
1. Apply desired filters
2. Click "Export CSV" button
3. File downloads with timestamp in filename

**Cleaning Up Old Logs:**
Use the cleanup endpoint to remove old logs while preserving critical ones.

### For Developers

**Adding Audit Logging to New Operations:**

1. **Import the helper:**
```javascript
import { logAudit } from '../middleware/audit.js';
```

2. **Call after operation:**
```javascript
await logAudit({
  userId: req.user._id,
  username: req.user.username,
  userRole: req.user.role,
  action: 'vehicle_updated',  // Choose from enum
  category: 'vehicle_management',  // Choose from enum
  description: `Updated vehicle ${vehicle.make} ${vehicle.model}`,
  targetType: 'Vehicle',
  targetId: vehicle._id.toString(),
  targetName: `${vehicle.make} ${vehicle.model}`,
  changes: {
    before: { status: oldStatus },
    after: { status: newStatus }
  },
  metadata: {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  },
  severity: 'info',  // info|warning|error|critical
  success: true
});
```

3. **For errors:**
```javascript
try {
  // operation
} catch (error) {
  await logAudit({
    userId: req.user._id,
    username: req.user.username,
    userRole: req.user.role,
    action: 'vehicle_updated',
    category: 'vehicle_management',
    description: `Failed to update vehicle`,
    targetType: 'Vehicle',
    targetId: vehicleId,
    metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
    severity: 'error',
    success: false,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    }
  });
  throw error;
}
```

---

## 🔧 Configuration

### Environment Variables

None required - uses existing MongoDB connection.

### Optional Middleware Integration

To enable automatic logging for all requests (creates many logs):

```javascript
// backend/server.js
import { auditMiddleware } from './middleware/audit.js';

// Add after authentication middleware
app.use(auditMiddleware());
```

**Note:** Currently we use manual logging in critical routes to reduce log volume.

---

## 📈 Performance Considerations

### Indexes

Multiple compound indexes ensure fast queries:
- Primary queries use `userId + createdAt`
- Category/action filters use respective compound indexes
- Text search uses dedicated text index
- Target lookups use `targetType + targetId`

### Pagination

All queries are paginated by default (limit: 50, configurable)

### Async Logging

All logging is non-blocking - failures don't interrupt main operations

### Cleanup Strategy

Use the cleanup endpoint regularly to maintain database size:
- Delete logs older than 90 days
- Keep critical and error logs
- Run monthly via cron job

---

## 🧪 Testing

### Manual Testing Checklist

1. **Login Operations:**
   - ✅ Successful login creates `login_success` log
   - ✅ Failed login creates `login_failed` log with IP
   - ✅ Logout creates `logout` log

2. **User Management:**
   - ✅ User creation logs with target info
   - ✅ User update logs with changed fields
   - ✅ User deactivation logs with warning severity

3. **Trip Management:**
   - ✅ Trip creation logs with rider info
   - ✅ Status changes log with before/after values
   - ✅ Trip cancellation logs with appropriate severity

4. **UI Testing:**
   - ✅ Filters work correctly
   - ✅ Search returns relevant results
   - ✅ Pagination navigates properly
   - ✅ Statistics calculate correctly
   - ✅ CSV export downloads successfully
   - ✅ Detail modal shows complete information

---

## 🎓 Best Practices

### When to Log

**Always Log:**
- Authentication events (login, logout, failures)
- User account changes (create, delete, role changes)
- Security events (access denied, suspicious activity)
- Critical data modifications (trips, vehicles, riders)
- System configuration changes
- Permission changes

**Consider Logging:**
- Important state changes
- Bulk operations
- Integration events
- Scheduled task executions

**Don't Log:**
- Read operations (GETs) for normal resources
- Health checks
- Static asset requests
- High-frequency updates (location tracking)

### Severity Guidelines

- **Info**: Normal operations (create, update, successful login)
- **Warning**: Potential issues (failed login, deactivation, cancellation)
- **Error**: Operation failures that are handled
- **Critical**: Security events, system errors, data corruption

### Description Guidelines

Write clear, actionable descriptions:
- ✅ "Created new driver: John Doe with license ABC123"
- ✅ "Changed trip T001 status from pending to in_progress"
- ❌ "Updated"
- ❌ "Action performed"

---

## 📋 Integration Points

### Current Integrations

1. **backend/routes/auth.js**
   - Login success/failure
   - User registration

2. **backend/routes/users.js**
   - User updates
   - User deactivation

3. **backend/routes/trips.js**
   - Trip creation
   - Trip status changes

### Future Integrations

- Vehicle operations
- Rider management
- Schedule operations
- Notification events
- System configuration changes
- Security events (2FA, password changes)

---

## 🐛 Troubleshooting

### Logs Not Appearing

1. Check MongoDB connection
2. Verify user has admin role
3. Check console for errors
4. Verify filters aren't too restrictive

### Performance Issues

1. Check index usage in MongoDB
2. Reduce page size (limit)
3. Add more specific filters
4. Run cleanup to reduce total log count

### Missing Logs

1. Verify operation calls `logAudit()`
2. Check if operation is in excluded list (GETs)
3. Verify async operation doesn't fail silently
4. Check MongoDB storage limits

---

## 📚 Related Documentation

- [User Model](./backend/models/User.js)
- [Trip Model](./backend/models/Trip.js)
- [Authentication System](./USERNAME_AUTH_IMPLEMENTATION.md)
- [Two-Factor Authentication](./TODO.md#two-factor-authentication)
- [Admin Settings](./frontend/src/components/admin/AdminSettings.jsx)

---

## ✅ Completion Checklist

- [x] AuditLog model created with comprehensive schema
- [x] Audit middleware with automatic logging
- [x] Audit API routes with 10 endpoints
- [x] AuditLogViewer UI component
- [x] Integration with auth routes
- [x] Integration with user routes
- [x] Integration with trip routes
- [x] Added to Admin Settings navigation
- [x] Documentation complete
- [x] TODO.md updated
- [ ] Integration with remaining routes (vehicle, rider, schedule)
- [ ] Automated cleanup cron job
- [ ] Performance monitoring
- [ ] User guide for administrators

---

**Status:** ✅ Core feature complete. Optional enhancements pending.

**Next Steps:**
1. Add audit logging to remaining routes (vehicles, riders, schedules)
2. Set up automated cleanup job
3. Monitor performance and adjust indexes if needed
4. Create administrator training documentation
