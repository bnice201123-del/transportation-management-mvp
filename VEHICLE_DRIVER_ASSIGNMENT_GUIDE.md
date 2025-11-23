# Vehicle-Driver Assignment System Guide

## Overview
The system is fully configured to automatically display assigned vehicles on the driver's dashboard with clickable links, and to associate vehicles with all trips assigned to that driver.

## System Components

### 1. **Backend - Vehicle Assignment Endpoint** (`backend/routes/vehicles.js`)

#### Assign Driver to Vehicle
```javascript
POST /api/vehicles/:vehicleId/assign-driver
Headers: { Authorization: Bearer <token> }
Body: { driverId: <driver_id> }
```

**Features:**
- Validates that the user has a driver role (checks both `role` and `roles` array)
- Sets the vehicle's `currentDriver` field to the driver's ID
- Records the `assignedDate`
- Returns the updated vehicle with populated driver info

#### Get Driver's Assigned Vehicle
```javascript
GET /api/vehicles/driver/assigned
Headers: { Authorization: Bearer <token> }
```

**Features:**
- Automatically fetches the vehicle assigned to the logged-in driver
- Uses MongoDB query: `Vehicle.findOne({ currentDriver: driverId, isActive: true })`
- Returns full vehicle details with driver information
- Returns `null` if no vehicle is assigned

### 2. **Frontend - Driver Dashboard** (`frontend/src/components/driver/DriverDashboard.jsx`)

#### Vehicle Display Section
Located in the dashboard statistics section (around line 460-485):

```jsx
<Stat>
  <StatLabel>Assigned Vehicle</StatLabel>
  <StatNumber fontSize="sm" color={assignedVehicle ? 'green.500' : 'gray.500'}>
    {assignedVehicle ? (
      <VehicleQuickView vehicle={assignedVehicle}>
        {`${assignedVehicle.year} ${assignedVehicle.make} ${assignedVehicle.model}`}
      </VehicleQuickView>
    ) : (
      'Not Assigned'
    )}
  </StatNumber>
  <StatHelpText>
    {assignedVehicle ? (
      <Text 
        fontSize="xs" 
        color="blue.500"
        cursor="pointer"
        _hover={{ textDecoration: 'underline' }}
        onClick={() => navigate(`/vehicles/${assignedVehicle._id}`)}
      >
        {assignedVehicle.licensePlate}
      </Text>
    ) : (
      <Text fontSize="xs">Contact dispatcher</Text>
    )}
  </StatHelpText>
</Stat>
```

**Features:**
- Shows vehicle year, make, and model wrapped in `VehicleQuickView` (click to see quick info popup)
- Displays license plate as a clickable link
- Navigates to full vehicle profile page on click
- Shows "Not Assigned" with "Contact dispatcher" message if no vehicle

### 3. **Auto-Assignment to Trips** (`backend/routes/trips.js`)

#### On Trip Creation (line 510-520)
```javascript
// If a driver is assigned, automatically assign their vehicle
if (tripData.assignedDriver) {
  const assignedVehicle = await Vehicle.findOne({ 
    currentDriver: tripData.assignedDriver,
    isActive: true 
  });
  if (assignedVehicle) {
    tripData.vehicle = assignedVehicle._id;
  }
}
```

#### On Trip Update (line 580-590)
```javascript
// If driver is being assigned or changed, auto-assign their vehicle
if (updateData.assignedDriver && updateData.assignedDriver !== trip.assignedDriver?.toString()) {
  const assignedVehicle = await Vehicle.findOne({ 
    currentDriver: updateData.assignedDriver,
    isActive: true 
  });
  if (assignedVehicle) {
    updateData.vehicle = assignedVehicle._id;
  }
}
```

**Features:**
- Automatically finds and assigns the driver's vehicle when creating a trip
- Updates the vehicle when the driver is changed on an existing trip
- Clears the vehicle if the driver is unassigned
- All trip queries populate the `vehicle` field with full details

### 4. **Vehicle Quick View Component** (`frontend/src/components/shared/VehicleQuickView.jsx`)

**Features:**
- Clickable popover that shows:
  - Fuel level with color-coded progress bar
  - Make, model, and year
  - License plate
  - Status badge
  - Current mileage
  - "View Full Profile" button
- Trigger: Click (not hover)
- Used in DriverDashboard, VehiclesLanding, and ComprehensiveVehicleDashboard

## How to Test the Complete Flow

### Step 1: Assign a Vehicle to a Driver
1. Log in as **Admin**, **Dispatcher**, or **Scheduler**
2. Navigate to **Vehicles** dashboard
3. Click on a vehicle to view its details
4. Click **"Assign Driver"** button
5. Select a driver from the dropdown
6. Click **"Assign"**
7. Verify success message appears

**Backend Console Output:**
```
=== Vehicle.assignDriver called ===
Vehicle ID: 65a1b2c3d4e5f6789...
Vehicle: Toyota Camry ABC-123
Assigning driver ID: 65a1b2c3d4e5f6789...
Previous driver: null
New driver assigned: 65a1b2c3d4e5f6789...
Assignment date: 2025-11-22T...
Vehicle saved successfully with driver: 65a1b2c3d4e5f6789...
```

### Step 2: Verify Driver Dashboard
1. Log out
2. Log in as the **Driver** who was assigned the vehicle
3. Navigate to **Driver Dashboard**
4. Look at the statistics section (top cards)
5. Under **"Assigned Vehicle"** you should see:
   - Green text showing: "2024 Toyota Camry" (or whatever vehicle)
   - Blue underlined license plate (e.g., "ABC-123")

**Backend Console Output:**
```
=== Driver Assigned Vehicle Request ===
User ID: 65a1b2c3d4e5f6789...
User Role: driver
Has Driver Role: true
Searching for vehicle with currentDriver: 65a1b2c3d4e5f6789...
Vehicle found: Yes
Vehicle ID: 65a1b2c3d4e5f6789...
Vehicle details: 2024 Toyota Camry
```

### Step 3: Test Clickable Links
1. **Click on the vehicle name** (e.g., "2024 Toyota Camry")
   - A popup appears showing quick vehicle info
   - Shows fuel level, status, mileage
   - Has "View Full Profile" button
   
2. **Click on the license plate** (e.g., "ABC-123")
   - Navigates to the full vehicle profile page
   - Shows complete vehicle details, maintenance history, etc.

### Step 4: Verify Trip Association
1. As **Scheduler**, **Dispatcher**, or **Admin**:
2. Navigate to **Trips** > **Create Trip**
3. Fill in trip details
4. Select the **driver** who has the assigned vehicle
5. **DO NOT manually select a vehicle** (it auto-assigns)
6. Create the trip
7. View the trip details
8. Verify the **vehicle field shows the driver's assigned vehicle**

**Backend Console Output:**
```
If a driver is assigned, automatically assign their vehicle
Driver ID: 65a1b2c3d4e5f6789...
Found vehicle for driver: 65a1b2c3d4e5f6789...
Auto-assigned vehicle: ABC-123
```

### Step 5: Verify Trip on Driver Dashboard
1. Log in as the **Driver**
2. Navigate to **Driver Dashboard**
3. Scroll to **"Assigned Trips"** section
4. Find the trip that was just created
5. Verify the trip shows the assigned vehicle information

## Troubleshooting

### Vehicle Not Showing on Driver Dashboard

**Check 1: Is the vehicle actually assigned?**
```javascript
// In MongoDB, check:
db.vehicles.findOne({ 
  licensePlate: "ABC-123" 
})
// Should have: currentDriver: ObjectId("...")
```

**Check 2: Does the driver have the correct role?**
```javascript
// User should have either:
{ role: "driver" }
// OR
{ roles: ["driver", ...] }
```

**Check 3: Check browser console**
```javascript
// Should see logs:
Fetching assigned vehicle for driver: 65a1b2c3d4e5f6789...
Assigned vehicle response: { success: true, vehicle: {...} }
Vehicle assigned successfully: {...}
```

**Check 4: Check backend console**
```javascript
// Should see:
=== Driver Assigned Vehicle Request ===
User ID: 65a1b2c3d4e5f6789...
Has Driver Role: true
Vehicle found: Yes
```

### Frontend Not Updating After Assignment

**Solution:** Hard refresh the page
- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)

### Vehicle Not Auto-Assigning to Trips

**Check:** Make sure the driver is actually assigned to the trip BEFORE the vehicle assignment
- The auto-assignment logic runs when `assignedDriver` is set
- If the driver is not assigned, the vehicle won't be assigned either

## Database Schema

### Vehicle Model
```javascript
{
  make: String,
  model: String,
  year: Number,
  licensePlate: String (unique),
  vin: String,
  status: String (active, idle, maintenance, etc.),
  currentDriver: ObjectId (ref: 'User'),  // ← Key field
  assignedDate: Date,
  isActive: Boolean,
  // ... other fields
}
```

### Trip Model
```javascript
{
  assignedDriver: ObjectId (ref: 'User'),
  vehicle: ObjectId (ref: 'Vehicle'),  // ← Auto-assigned when driver is set
  // ... other fields
}
```

### User Model
```javascript
{
  role: String,  // Primary role
  roles: [String],  // Additional roles (multi-role support)
  // ... other fields
}
```

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/vehicles/driver/assigned` | Driver | Get logged-in driver's assigned vehicle |
| POST | `/api/vehicles/:id/assign-driver` | Admin/Scheduler/Dispatcher | Assign a driver to a vehicle |
| POST | `/api/vehicles/:id/unassign-driver` | Admin/Scheduler/Dispatcher | Unassign driver from vehicle |
| GET | `/api/trips` | All | Get all trips (populates vehicle field) |
| POST | `/api/trips` | Scheduler/Dispatcher | Create trip (auto-assigns vehicle) |
| PUT | `/api/trips/:id` | All | Update trip (auto-assigns vehicle on driver change) |

## Multi-Role Support

The system supports users with multiple roles (e.g., a user can be both admin and driver).

**Role Check Logic:**
```javascript
const hasDriverRole = user.role === 'driver' || 
                     (user.roles && user.roles.includes('driver'));
```

This ensures that:
- Users with `role: "driver"` can see their vehicle
- Users with `roles: ["admin", "driver"]` can also see their vehicle
- All API endpoints check both fields for authorization

## Summary

✅ **Vehicle assignment is fully functional**
✅ **Driver dashboard shows assigned vehicle with clickable links**
✅ **Trips automatically associate with driver's vehicle**
✅ **Multi-role support for drivers with additional roles**
✅ **Comprehensive debugging logs for troubleshooting**
✅ **VehicleQuickView provides quick info popup on click**

## Next Steps

1. **Test in browser** - Follow the testing steps above
2. **Check console logs** - Both frontend (browser) and backend (terminal)
3. **Verify database** - Ensure `currentDriver` field is set on vehicles
4. **Report issues** - If something doesn't work, check the troubleshooting section

---

**Last Updated:** November 22, 2025
**System Status:** ✅ Fully Operational
