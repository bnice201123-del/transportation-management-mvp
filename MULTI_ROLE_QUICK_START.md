# Multi-Role Quick Start Guide

## Enabling Multi-Role Support for Existing Users

### Step 1: Run the Migration Script

This will add the 'driver' role to all existing Admin, Dispatcher, and Scheduler users:

```bash
# Navigate to backend directory
cd c:\Users\bk216\Desktop\Drive\transportation-mvp\backend

# Run the migration script
node scripts/addDriverRoleToStaff.js
```

**Expected Output:**
```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found X staff users to update

✅ Added driver role to: John Doe (john@example.com) - Roles: [admin, driver]
✅ Added driver role to: Jane Smith (jane@example.com) - Roles: [dispatcher, driver]
...

📈 Migration Summary:
   Total staff users: X
   Updated with driver role: X
   Already had driver role: 0

✅ Migration completed successfully!

🔌 MongoDB connection closed
```

### Step 2: Verify Changes

1. **Login to the application** as an admin user

2. **Navigate to Manage User Roles:**
   - Click on Admin menu
   - Select "Manage User Roles" (or navigate to `/admin/manage-roles`)

3. **Verify roles are displayed:**
   - Check that admin, dispatcher, and scheduler users now show multiple role badges
   - Primary role + Driver role should be visible

### Step 3: Test Driver Functionality

1. **As an Admin/Dispatcher/Scheduler user:**

   a. **Check Driver Dashboard Access:**
   - Navigate to `/driver` 
   - Should see the driver dashboard without errors

   b. **Verify Visibility in Driver Lists:**
   - Go to Dispatcher or Scheduler dashboard
   - Create or edit a trip
   - Open the "Assign Driver" dropdown
   - Your user should appear in the list of available drivers

   c. **Assign Yourself to a Trip:**
   - Select your name as the driver
   - Save the trip
   - Navigate to `/driver` dashboard
   - The assigned trip should appear in your driver view

   d. **Test Trip Execution:**
   - Open the assigned trip
   - Click "Start Trip" button
   - Update location (if applicable)
   - Click "Complete Trip" button

2. **Verify Administrative Access Still Works:**
   - Navigate to admin routes (`/admin/*`)
   - Navigate to dispatcher routes (`/dispatcher`)
   - Navigate to scheduler routes (`/scheduler/*`)
   - All should still be accessible

## Manual Role Assignment (Alternative Method)

If you prefer to add roles manually through the UI:

1. **Login as Admin**

2. **Go to Manage User Roles:**
   - Navigate to `/admin/manage-roles`

3. **Click "Edit Roles" on a user**

4. **Select the roles you want to assign:**
   - Check "Admin" (if applicable)
   - Check "Driver" 
   - Check any other roles needed

5. **Click "Update Roles"**

6. **Verify:**
   - User card should now show multiple role badges
   - User should appear in driver dropdowns

## Testing Scenarios

### Scenario 1: Admin as Driver
```
✅ Admin can access admin dashboard
✅ Admin can access driver dashboard
✅ Admin can be assigned to trips
✅ Admin can start and complete trips
✅ Admin can view all trips (not just assigned ones)
```

### Scenario 2: Dispatcher as Driver
```
✅ Dispatcher can access dispatcher dashboard
✅ Dispatcher can assign trips to themselves
✅ Dispatcher can execute assigned trips
✅ Dispatcher can view all trips for assignment
✅ Dispatcher can track all drivers including themselves
```

### Scenario 3: Scheduler as Driver
```
✅ Scheduler can access scheduler dashboard
✅ Scheduler can schedule trips and assign to themselves
✅ Scheduler can execute trips as driver
✅ Scheduler can view calendar of all trips
✅ Scheduler can manage recurring trips
```

## Troubleshooting

### Issue: User doesn't appear in driver dropdown

**Solution:**
```bash
# Check user's roles in MongoDB
db.users.findOne({ email: "user@example.com" }, { roles: 1, role: 1 })

# Should return:
{ 
  _id: ObjectId("..."),
  role: "admin",
  roles: ["admin", "driver"]
}

# If roles is empty or missing driver:
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { roles: ["admin", "driver"] } }
)
```

### Issue: "Access Denied" when accessing driver routes

**Solution:**
1. Check user's roles array includes 'driver'
2. Verify frontend ProtectedRoute allows driver role
3. Check browser console for authorization errors
4. Log out and log back in to refresh token

### Issue: User sees only their trips (not all trips)

**Expected Behavior:**
- In **Driver Dashboard** (`/driver`): Should see only assigned trips
- In **Admin/Dispatcher Dashboard**: Should see ALL trips

This is working as designed. Multi-role users have context-aware filtering.

### Issue: Changes don't take effect

**Solution:**
```bash
# Restart backend server
cd backend
# Press Ctrl+C to stop
npm run dev

# Clear frontend cache
# Press Ctrl+Shift+R in browser to hard refresh
```

## API Testing with Postman/curl

### Check User Roles
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update User Roles
```bash
curl -X PATCH http://localhost:3001/api/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["admin", "driver"]
  }'
```

### Verify Driver List
```bash
curl -X GET http://localhost:3001/api/users/drivers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

After successful implementation:

1. ✅ **Update documentation** for your team
2. ✅ **Train staff** on using multi-role access
3. ✅ **Monitor** for any permission issues
4. ✅ **Gather feedback** on usability
5. ✅ **Consider** role-based UI customization

## Support Contacts

- Backend Issues: Check `backend/logs/` and MongoDB logs
- Frontend Issues: Check browser console (F12)
- Database Issues: Verify MongoDB connection and user documents
- Permission Issues: Check `backend/middleware/auth.js` logs

## Rollback Plan

If you need to remove driver roles from staff:

```javascript
// Run in MongoDB shell or create a script
db.users.updateMany(
  { role: { $in: ['admin', 'dispatcher', 'scheduler'] } },
  { $pull: { roles: 'driver' } }
)
```

## Success Metrics

✅ Staff can be assigned to trips  
✅ Staff can execute trips as drivers  
✅ Staff retain all administrative permissions  
✅ No authorization errors in logs  
✅ User experience is seamless  
✅ System performance unchanged  
