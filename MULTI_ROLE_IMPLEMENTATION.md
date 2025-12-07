# Multi-Role Capability Implementation

## Overview
This implementation enables users with Admin, Dispatcher, or Scheduler roles to also function as Drivers, allowing them to be assigned to trips, start runs, and complete trips while retaining all permissions of their primary role(s).

## Changes Made

### Backend Changes

#### 1. **User Model** (`backend/models/User.js`)
Already has multi-role support:
- `role`: Primary role (backward compatible)
- `roles`: Array of all roles the user has
- `hasRole(role)`: Method to check if user has a specific role
- `addRole(role)`: Method to add a role to a user
- Pre-save hook ensures `roles` array is always populated

#### 2. **Authentication Middleware** (`backend/middleware/auth.js`)
**Updated `authorizeRoles` function:**
```javascript
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
```

#### 3. **Trips Route** (`backend/routes/trips.js`)
**Updated trip filtering logic:**
- Users with ONLY driver role see only their assigned trips
- Users with driver + admin/dispatcher/scheduler see all trips
- This allows multi-role users to access both driver dashboard AND administrative views

```javascript
const userRoles = req.user.roles && req.user.roles.length > 0 
  ? req.user.roles 
  : [req.user.role];

const isDriverOnly = userRoles.includes('driver') && 
                    !userRoles.includes('admin') && 
                    !userRoles.includes('dispatcher') && 
                    !userRoles.includes('scheduler');

if (isDriverOnly) {
  filter.assignedDriver = req.user._id;
}
```

#### 4. **Users Route** (`backend/routes/users.js`)

**New Endpoint - Update User Roles (Admin Only):**
```
PATCH /api/users/:id/roles
Body: { "roles": ["admin", "driver"] }
```

**Updated Endpoints:**
- `PATCH /api/users/:id/location` - Now checks if user has 'driver' in roles array
- `PATCH /api/users/:id/availability` - Now checks if user has 'driver' in roles array

**Driver Listing:**
- `GET /api/users/drivers` - Already queries `roles: 'driver'` (works with array)
- `GET /api/users/drivers/available` - Already queries `roles: 'driver'` (works with array)

#### 5. **Migration Script** (`backend/scripts/addDriverRoleToStaff.js`)
Created script to add 'driver' role to existing admin, dispatcher, and scheduler users:

```bash
cd backend
node scripts/addDriverRoleToStaff.js
```

### Frontend Changes

#### 1. **ProtectedRoute Component** (`frontend/src/App.jsx`)
Already supports multi-role checking:
```javascript
const userRoles = user?.roles || [user?.role];
const hasAccess = allowedRoles.some(role => userRoles.includes(role));
```

#### 2. **Driver Routes** (`frontend/src/App.jsx`)
Already configured to allow multi-role access:
```javascript
<ProtectedRoute allowedRoles={['driver', 'scheduler', 'dispatcher', 'admin']}>
```

#### 3. **New Component - Manage User Roles** (`frontend/src/components/admin/ManageUserRoles.jsx`)
- Admin interface to assign multiple roles to users
- Visual role badges showing all assigned roles
- Checkbox interface for easy role management
- Validation to ensure at least one role is selected
- Success/error notifications

**Route:** `/admin/manage-roles`

## How It Works

### For Admins/Dispatchers/Schedulers with Driver Role

1. **Assignment to Trips:**
   - Appears in driver selection dropdowns (via `/api/users/drivers`)
   - Can be assigned to trips like any driver
   - Trip assignments show in Driver Dashboard

2. **Driver Dashboard Access:**
   - Can access `/driver` route
   - Can access `/driver/tracking` route
   - Can access `/driver/report` route
   - Sees trips assigned to them

3. **Administrative Access Retained:**
   - Can still access all admin/dispatcher/scheduler routes
   - Can view ALL trips (not just assigned ones)
   - Retains full administrative permissions

4. **Location Tracking:**
   - Can update location when acting as driver
   - Location appears on live tracking map

5. **Trip Operations:**
   - Can start trips
   - Can update trip status
   - Can complete trips
   - Can report issues

## Usage Instructions

### Option 1: Use Migration Script (Recommended)
Add driver role to all existing admin, dispatcher, and scheduler users:

```bash
cd backend
node scripts/addDriverRoleToStaff.js
```

### Option 2: Use Admin UI
1. Login as admin
2. Navigate to Admin → Manage User Roles (`/admin/manage-roles`)
3. Click "Edit Roles" for any user
4. Check the "Driver" checkbox
5. Click "Update Roles"

### Option 3: Use API Directly
```bash
# Add driver role to a user
curl -X PATCH http://localhost:3001/api/users/:userId/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles": ["admin", "driver"]}'
```

## Benefits

1. **Flexibility:** Staff can fill in as drivers when needed
2. **No Separate Accounts:** One account with multiple capabilities
3. **Seamless Switching:** Access driver and admin views without logging out
4. **Permission Retention:** Never lose administrative access
5. **Simplified Management:** Fewer user accounts to manage

## Testing Checklist

- [ ] Admin user can be assigned to trips
- [ ] Admin user appears in driver selection dropdown
- [ ] Admin user can access driver dashboard
- [ ] Admin user can start/complete trips
- [ ] Admin user can still access admin routes
- [ ] Dispatcher with driver role can assign trips to themselves
- [ ] Scheduler with driver role can schedule and execute trips
- [ ] Driver-only users still see only their trips
- [ ] Multi-role users see all trips in administrative views
- [ ] Location tracking works for multi-role users
- [ ] Role management UI allows adding/removing roles

## Database Schema

### User Model - Roles Fields
```javascript
{
  role: {
    type: String,
    enum: ['scheduler', 'dispatcher', 'driver', 'admin', 'rider'],
    required: true
  },
  roles: {
    type: [String],
    enum: ['scheduler', 'dispatcher', 'driver', 'admin', 'rider'],
    default: function() {
      return [this.role];
    }
  }
}
```

## API Endpoints

### Get All Drivers
```
GET /api/users/drivers
Authorization: Bearer TOKEN
Returns: Users with 'driver' in roles array
```

### Update User Roles
```
PATCH /api/users/:id/roles
Authorization: Bearer TOKEN (Admin only)
Body: { "roles": ["admin", "driver", "dispatcher"] }
```

### Update Driver Availability
```
PATCH /api/users/:id/availability
Authorization: Bearer TOKEN
Body: { "isAvailable": true }
Requires: User has 'driver' in roles array
```

### Update Driver Location
```
PATCH /api/users/:id/location
Authorization: Bearer TOKEN
Body: { "lat": 45.0663, "lng": -93.3322 }
Requires: User has 'driver' in roles array
```

## Security Considerations

1. **Authorization:** Multi-role users must have appropriate permission for each action
2. **Validation:** Roles are validated against allowed values
3. **Backward Compatibility:** System still works with single-role users
4. **Admin Only:** Only admins can modify user roles
5. **Self-Service:** Users can only update their own driver-specific data (location, availability)

## Backward Compatibility

The system maintains full backward compatibility:
- Existing users with single role continue to work
- `role` field still represents primary role
- `roles` array automatically populated if missing
- All existing API calls continue to function
- Frontend checks both `roles` array and `role` field

## Future Enhancements

1. Role-based UI customization (different dashboard layouts per role)
2. Role switching interface (quick toggle between role views)
3. Activity logging per role
4. Role-specific analytics
5. Time-based role assignments (temporary driver role)
6. Granular permissions within roles

## Support

For issues or questions:
1. Check user's `roles` array in database
2. Verify `roles` array in JWT token payload
3. Check browser console for authorization errors
4. Review server logs for role validation errors
5. Ensure migration script was run for existing users
