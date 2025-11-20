# Multi-Role Support Implementation

## Overview
This document describes the multi-role support feature that allows users to have multiple roles simultaneously. This is particularly useful for Admins, Dispatchers, and Schedulers who also need to act as Drivers.

## Key Features

### 1. Multiple Roles Per User
- Users can now have multiple roles assigned to them
- The `User` model supports both single role (backward compatible) and multiple roles via a `roles` array
- Primary roles (admin, dispatcher, scheduler) can also have the driver role added

### 2. Role Switching UI
- Users with multiple roles see a clickable role badge in the Navbar
- Clicking the badge opens a dropdown menu to switch between available roles
- The active role is stored in localStorage and persists across sessions
- Switching roles automatically navigates to the appropriate dashboard

### 3. Role-Based Navigation
- Logo click navigates to the dashboard appropriate for the active role:
  - Admin → `/admin/overview`
  - Dispatcher → `/dispatcher`
  - Scheduler → `/scheduler`
  - Driver → `/driver-dashboard`
  - Rider → `/dashboard`

## Implementation Details

### Backend Changes

#### User Model (`backend/models/User.js`)
```javascript
// Dual role field for backward compatibility
role: {
  type: String,
  required: true,
  enum: ['admin', 'dispatcher', 'scheduler', 'driver', 'rider'],
},

// New roles array for multi-role support
roles: {
  type: [String],
  enum: ['admin', 'dispatcher', 'scheduler', 'driver', 'rider'],
  default: function() { return [this.role]; }
},

// Helper methods
UserSchema.methods.hasRole = function(role) {
  return this.roles && this.roles.includes(role);
};

UserSchema.methods.addRole = function(role) {
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
};

// Pre-save hook ensures roles array is populated
UserSchema.pre('save', function(next) {
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role];
  }
  next();
});
```

#### Migration Script (`backend/scripts/addDriverRoleToAdmins.js`)
- Created to add driver role to existing admin/dispatcher/scheduler users
- Usage: `node backend/scripts/addDriverRoleToAdmins.js`
- Results: Successfully added driver role to 3 users (admin@test.com, dispatcher@test.com, scheduler@test.com)

### Frontend Changes

#### App.jsx - Protected Route Authorization
```javascript
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  
  // Multi-role check - backward compatible
  const userRoles = user?.roles || [user?.role];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));
  
  if (allowedRoles.length > 0 && !hasAccess) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

#### Navbar Component (`frontend/src/components/shared/Navbar.jsx`)
- Added state management for active role
- Added role switching logic with localStorage persistence
- Added role dropdown menu for multi-role users
- Updated logo click handlers to use active role for navigation
- Shows all available roles with checkmark on active role

Key features:
- `activeRole` state tracks the currently active role
- `handleRoleSwitch(role)` switches roles and navigates to appropriate dashboard
- `getAvailableRoles()` returns user's roles array or single role
- `hasMultipleRoles` determines if dropdown should be shown

## Usage Examples

### For Administrators
1. Admin logs in with credentials (admin@test.com)
2. Default role shown is "Admin" in the Navbar
3. Click on "Admin" badge to see dropdown with "Admin" and "Driver" options
4. Select "Driver" to switch to driver view
5. Automatically navigates to `/driver-dashboard`
6. Can now be assigned to vehicles and trips as a driver
7. Click "Driver" badge to switch back to "Admin" view

### For Schedulers/Dispatchers
1. Same process as admins
2. Can switch between their primary role and driver role
3. Useful for small organizations where staff wear multiple hats
4. Can test trip assignments from driver perspective

## Benefits

1. **Operational Flexibility**: Staff can handle multiple responsibilities
2. **Testing**: Admins can test driver features without separate accounts
3. **Small Organizations**: Reduces need for multiple accounts per person
4. **Vehicle Assignment**: Admins can be assigned as currentDriver on vehicles
5. **Trip Assignment**: Schedulers/Dispatchers can be assigned trips as drivers
6. **Backward Compatibility**: Existing single-role users continue to work

## Database Migration

The migration script was successfully run and updated:
- admin@test.com (admin) → now has [admin, driver] roles
- scheduler@test.com (scheduler) → now has [scheduler, driver] roles
- dispatcher@test.com (dispatcher) → now has [dispatcher, driver] roles

## Future Enhancements

Potential improvements:
1. Add UI to assign/remove roles in the Admin panel
2. Support any combination of roles (not just +driver)
3. Add role-based permissions matrix
4. Allow role switching without navigation
5. Add role history/audit log
6. Support custom roles beyond the 5 predefined ones

## Testing

To test the feature:
1. Login as admin@test.com (password: admin123)
2. Verify "Admin" badge appears in Navbar with dropdown arrow
3. Click badge and select "Driver"
4. Verify navigation to driver dashboard
5. Verify you can be assigned to a vehicle
6. Verify trips can be assigned to you as a driver
7. Switch back to "Admin" role and verify admin dashboard access

## Technical Notes

- The `role` field is maintained for backward compatibility
- The `roles` array is the source of truth for authorization
- ProtectedRoute checks if user has ANY of the allowed roles (OR logic)
- localStorage key 'activeRole' stores the current active role
- On app load, saved role is validated against user's available roles
- Invalid saved roles fall back to primary role (user.role)

## Commit Information

**Commit Hash**: 071987f  
**Commit Message**: "Add multi-role support: admins/dispatchers/schedulers can also act as drivers"  
**Files Changed**: 7 files, 259 insertions, 24 deletions  
**Key Files**:
- backend/models/User.js (roles array, helper methods)
- backend/scripts/addDriverRoleToAdmins.js (migration script)
- frontend/src/App.jsx (ProtectedRoute multi-role check)
- frontend/src/components/shared/Navbar.jsx (role switcher UI)
