# Dual Login System for Vehicle Tracking & Driver Operations

## Overview
Implement a dual authentication system **in the drivers section only** that enables:
1. **Vehicle Phone Login** - Phone-resident account for continuous vehicle tracking (no driver dependency)
2. **Driver Number Login** - Driver personal account for trip operations and driver-specific functions

This allows fleets to track vehicles independently of driver sessions, solving the issue where vehicles go offline when drivers log out.

**Scope**: Drivers section only - not part of main app login. Users login to main app normally, then have additional login options within driver interface.

---

## System Architecture

### Current State
```
┌─────────────────────────────────────────┐
│ User Account (email/username based)     │
├─────────────────────────────────────────┤
│ role: "driver"                          │
│ email: john.doe@company.com             │
│ phone: +1-555-0100                      │
│ vehicleInfo: { vehicle_id }             │
│ └─ Tracking ONLY when logged in         │
└─────────────────────────────────────────┘
```

### Proposed State
```
┌────────────────────────────────────────────────────────────────┐
│ Vehicle Phone Account (NEW)                                    │
├────────────────────────────────────────────────────────────────┤
│ vehicleId: "VEH001"                                            │
│ phoneNumber: "+1-555-6001" (SIM card in vehicle)              │
│ loginType: "vehicle_tracking"                                  │
│ role: "vehicle_tracker"                                        │
│ trackingEnabled: true (permanent)                              │
│ └─ ALWAYS tracks, independent of driver                        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Driver Personal Account (EXISTING, enhanced)                   │
├────────────────────────────────────────────────────────────────┤
│ driverId: "DRV001" (unique driver number, auto-generated)      │
│ email: john.doe@company.com                                    │
│ phone: +1-555-0100 (driver's personal phone)                   │
│ loginType: "driver_operations"                                 │
│ role: "driver"                                                 │
│ assignedVehicle: "VEH001" (from assignment)                    │
│ └─ Driver trips, schedules, personal dashboard                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Backend Models & Authentication

#### 1.1 Update User Model
**File**: `backend/models/User.js`

Add new fields for driver identification and login type:
```javascript
// In User schema:
driverId: {
  type: String,           // Auto-generated unique driver number (DRV-001-2025)
  index: true,
  sparse: true,
  unique: true,
  match: /^DRV-\d{3}-\d{4}$/  // Format: DRV-XXX-YYYY
},

loginType: {
  type: String,
  enum: ['standard', 'driver_number', 'vehicle_phone'],
  default: 'standard'
},

// For vehicle phone accounts
vehicleAssociation: {
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  vehiclePhone: String,      // "+1-555-6001"
  simCardNumber: String,     // SIM identifier
  assignedDate: Date,
  lastTrackedAt: Date,
  trackingStatus: {
    type: String,
    enum: ['active', 'inactive', 'lost', 'disabled'],
    default: 'active'
  }
},

accountType: {
  type: String,
  enum: ['driver', 'vehicle_tracker', 'admin', 'dispatcher', 'scheduler'],
  default: 'driver'
}
```

#### 1.2 Create Dual Login Service
**File**: `backend/services/dualLoginService.js`

```javascript
export const dualLoginService = {
  // Generate unique driver ID
  generateDriverId: async () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = await User.countDocuments({ role: 'driver' });
    return `DRV-${String(sequence + 1).padStart(3, '0')}-${year}`;
  },

  // Create vehicle tracking account
  createVehicleTrackerAccount: async (vehicleId, phoneNumber) => {
    // Implementation
  },

  // Authenticate with driver number
  authenticateByDriverNumber: async (driverId, password) => {
    // Implementation
  },

  // Authenticate vehicle phone
  authenticateVehiclePhone: async (phoneNumber, password) => {
    // Implementation
  },

  // Get active login type
  getActiveLoginType: async (userId) => {
    // Implementation
  }
};
```

#### 1.3 Create Vehicle Tracker Model
**File**: `backend/models/VehicleTracker.js` (NEW)

```javascript
const vehicleTrackerSchema = new Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true
  },

  // Phone account details
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\+?[\d\s\-\(\)]{10,}$/
  },

  simCardNumber: String,
  carrier: String, // Verizon, AT&T, etc.

  // Tracking configuration
  trackingConfig: {
    enabled: { type: Boolean, default: true },
    updateFrequency: { type: Number, default: 30 }, // seconds
    batteryOptimized: { type: Boolean, default: false },
    highAccuracy: { type: Boolean, default: true }
  },

  // Session tracking
  currentSession: {
    token: String,
    startedAt: Date,
    lastActivity: Date,
    ipAddress: String,
    deviceInfo: String
  },

  // Location tracking history
  lastLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },

  // Linked user account (vehicle phone login)
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'lost', 'disabled'],
    default: 'active'
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default mongoose.model('VehicleTracker', vehicleTrackerSchema);
```

---

### Phase 2: Authentication Routes Updates

#### 2.1 Create Driver Section Login Endpoint (NEW)
**File**: `backend/routes/drivers.js`

Create a **separate endpoint** for driver section authentication:
```javascript
// POST /api/drivers/section-login
// This endpoint is ONLY for the driver section, not main app auth

router.post('/section-login', async (req, res) => {
  const { driverId, phoneNumber, password, loginType } = req.body;

  // loginType: 'driver_number' or 'vehicle_phone'
  let user;
  
  if (loginType === 'driver_number' && driverId) {
    // Login with driver number
    user = await User.findOne({ driverId }).select('+password');
  } else if (loginType === 'vehicle_phone' && phoneNumber) {
    // Login with vehicle phone
    const tracker = await VehicleTracker.findOne({ phoneNumber }).populate('linkedUserId');
    user = tracker?.linkedUserId;
  }

  // Verify password
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create session token for driver section
  const token = jwt.sign(
    { 
      userId: user._id, 
      driverId: user.driverId,
      accountType: user.accountType,
      loginType
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user._id,
      driverId: user.driverId,
      firstName: user.firstName,
      accountType: user.accountType,
      loginType
    }
  });
});
```

#### 2.2 Update Main Login Route (UNCHANGED)
**File**: `backend/routes/auth.js`

The main `/login` endpoint remains **completely unchanged**:
- Still uses email/username
- Still supports all roles (admin, dispatcher, scheduler, etc.)
- Driver section login is separate and only for drivers

#### 2.3 Create Driver Number Generation Route
**File**: `backend/routes/drivers.js`

Add endpoint to generate driver IDs (admin only):
```javascript
// POST /api/drivers/:userId/generate-driver-id
router.post('/:userId/generate-driver-id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (user.driverId) {
      return res.status(400).json({ message: 'Driver already has a driver ID' });
    }

    const driverId = await dualLoginService.generateDriverId();
    user.driverId = driverId;
    await user.save();

    res.json({ 
      success: true,
      driverId,
      message: `Driver ID assigned: ${driverId}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating driver ID', error: error.message });
  }
});
```

#### 2.4 Create Vehicle Phone Account Setup Route
**File**: `backend/routes/vehicles.js` (NEW endpoint)

```javascript
// POST /api/vehicles/:vehicleId/setup-tracking-account
router.post('/:vehicleId/setup-tracking-account', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { phoneNumber, simCardNumber, carrier } = req.body;
    const { vehicleId } = req.params;

    // Create vehicle tracker account
    const vehicleTracker = await VehicleTracker.create({
      vehicleId,
      phoneNumber,
      simCardNumber,
      carrier,
      trackingConfig: { enabled: true, updateFrequency: 30 }
    });

    // Create associated user account with vehicle_tracker role
    const trackerUser = await User.create({
      username: `vehicle_${vehicleId}`,
      phone: phoneNumber,
      role: 'vehicle_tracker',
      accountType: 'vehicle_tracker',
      firstName: `Vehicle Tracker`,
      lastName: vehicleId,
      password: generateSecurePassword(), // Strong auto-generated password
      isActive: true
    });

    vehicleTracker.linkedUserId = trackerUser._id;
    await vehicleTracker.save();

    res.json({
      success: true,
      vehicleTracker,
      message: 'Vehicle tracking account created successfully',
      credentials: {
        phoneNumber,
        note: 'Password managed by system; vehicle auto-logs in on startup'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error setting up vehicle account', error: error.message });
  }
});
```

---

### Phase 3: Frontend Updates (Driver Section Only)

#### 3.1 Create Driver Section Login Component (NEW)
**File**: `frontend/src/components/driver/DriverSectionLogin.jsx`

This login is **inside the driver section**, not the main app auth:
```jsx
// NEW Component - appears in driver interface
// User first logs into main app normally, then accesses driver section
// Driver section has its own login for vehicle phone or driver number

const DriverSectionLogin = () => {
  const [loginMethod, setLoginMethod] = useState('driver_number'); 
  const [driverId, setDriverId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await axios.post('/api/drivers/section-login', {
      driverId: loginMethod === 'driver_number' ? driverId : undefined,
      phoneNumber: loginMethod === 'vehicle_phone' ? phoneNumber : undefined,
      password,
      loginType: loginMethod
    });

    // Store driver section token separately
    localStorage.setItem('driverSectionToken', response.data.token);
    // Redirect to driver operations/vehicle tracking dashboard
  };

  return (
    <Box>
      <Tabs value={loginMethod} onChange={setLoginMethod}>
        <TabList>
          <Tab>Driver Number</Tab>
          <Tab>Vehicle Phone</Tab>
        </TabList>

        <TabPanel>
          <Input
            placeholder="Driver ID (e.g., DRV-001-2025)"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          />
          <Input type="password" placeholder="Password" />
          <Button onClick={handleLogin}>Login</Button>
        </TabPanel>

        <TabPanel>
          <Input
            type="tel"
            placeholder="Vehicle Phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Input type="password" placeholder="Password" />
          <Button onClick={handleLogin}>Login</Button>
        </TabPanel>
      </Tabs>
    </Box>
  );
};
```

#### 3.2 Update Driver Dashboard
**File**: `frontend/src/components/driver/DriverLanding.jsx`

- Add "Driver Section Login" button on driver page
- Show current login type (driver number or vehicle phone)
- Allow switching between login methods
- Display driver ID if available

#### 3.3 Create Driver ID Management Component
**File**: `frontend/src/components/admin/DriverIdManagement.jsx` (NEW)

Admin tool to:
- View all driver IDs
- Generate IDs for drivers without one
- Bulk generate IDs from CSV
- Export driver IDs for reference cards

---

### Phase 4: Vehicle Tracking API Enhancements

#### 4.1 Update GPS Tracking Routes
**File**: `backend/routes/gpsTracking.js`

Modify to support vehicle phone tracking:
```javascript
// POST /api/gps/vehicle/:vehicleId/location
// Accept location from vehicle phone account (no trip required)

router.post('/vehicle/:vehicleId/location', authenticateToken, async (req, res) => {
  // Check if authenticated as vehicle_tracker role
  const tracker = await VehicleTracker.findOne({ vehicleId: req.params.vehicleId });
  
  if (tracker.linkedUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized for this vehicle' });
  }

  // Record location regardless of active trip
  // Update lastLocation in tracker
  // Update fleet tracking dashboard in real-time
  
  res.json({ success: true, message: 'Vehicle location recorded' });
});
```

#### 4.2 Create Vehicle Idle Location Endpoint
**File**: `backend/routes/locations.js` (NEW)

```javascript
// POST /api/locations/vehicle/idle
// Track vehicle location when idle (no active trip)
// Enables continuous fleet monitoring

router.post('/vehicle/idle', authenticateToken, async (req, res) => {
  if (req.user.accountType !== 'vehicle_tracker') {
    return res.status(403).json({ message: 'Only vehicle tracking accounts can use this endpoint' });
  }

  const { latitude, longitude, accuracy, heading, speed } = req.body;
  
  // Update VehicleTracker.lastLocation
  // Broadcast to dispatcher dashboard
  // Update fleet map in real-time
});
```

---

### Phase 5: Dashboard & Monitoring

#### 5.1 Fleet Monitoring Dashboard Updates
**File**: `frontend/src/components/maps/LiveTracking.jsx`

Enhanced to show:
- Vehicles with active trips (driver + GPS)
- Vehicles being tracked via vehicle phone (independent of driver)
- Status badge indicating tracking type
- Online/offline indicator

#### 5.2 Create Vehicle Tracking Status Component
**File**: `frontend/src/components/vehicle/VehicleTrackingStatus.jsx` (NEW)

```jsx
// Shows:
// - Current location (GPS)
// - Tracking method (vehicle phone or driver)
// - Last update time
// - Battery level (from vehicle)
// - Connection status
// - Current trip (if assigned)
```

---

## Database Schema Changes

### User Model Addition
```javascript
{
  driverId: String,                    // DRV-001-2025
  loginType: String,                   // standard | driver_number | vehicle_phone
  accountType: String,                 // driver | vehicle_tracker | admin
  vehicleAssociation: {
    vehicleId: ObjectId,
    vehiclePhone: String,
    simCardNumber: String,
    assignedDate: Date,
    trackingStatus: String             // active | inactive | lost
  }
}
```

### Vehicle Model Addition
```javascript
{
  trackingPhone: String,               // "+1-555-6001" (vehicle's phone)
  trackerAccount: ObjectId,            // Reference to VehicleTracker
  simulatedTracking: Boolean,          // true if using web-based tracking
  trackingEnabled: Boolean,            // master toggle
  trackingHistory: [{
    location: GeoJSON,
    source: String,                    // 'gps' | 'telematics' | 'vehicle_phone'
    timestamp: Date
  }]
}
```

---

## Migration Path

### Step 1: Deploy Backend (Current Sprint)
- [x] Add fields to User model
- [ ] Create VehicleTracker model
- [ ] Implement dual login service
- [ ] Create API endpoints

### Step 2: Deploy Frontend (Next Sprint)
- [ ] Update login component
- [ ] Create driver ID management UI
- [ ] Update driver dashboard
- [ ] Enhance fleet tracking dashboard

### Step 3: Hardware Integration (Future)
- [ ] Distribute SIM cards to vehicles
- [ ] Set up device management
- [ ] Configure auto-login on vehicle devices
- [ ] Implement fallback mechanisms

### Step 4: Data Migration
- [ ] Generate driver IDs for all existing drivers
- [ ] Create vehicle tracker accounts for fleet
- [ ] Link accounts and verify tracking
- [ ] Historical data consolidation

---

## Benefits

### For Fleet Operators
✅ **Continuous Vehicle Tracking** - Vehicles tracked 24/7 via vehicle phone login, independent of driver sessions
✅ **Independent Monitoring** - Monitor vehicle movement even when driver logs out of main app
✅ **Better Accountability** - Vehicle tracking layer separate from driver operations
✅ **Compliance Ready** - Easier to meet regulatory tracking requirements using vehicle phone method

### For Drivers
✅ **Separate System** - Vehicle tracking doesn't interfere with driver operations
✅ **Simpler Driver Number** - Driver number format is easy to remember for section login
✅ **Optional** - Driver number login only needed when accessing driver section
✅ **Privacy** - Vehicle tracking happens independently via phone account

### For Dispatchers
✅ **Real-time Fleet Visibility** - Always see where vehicles are via vehicle phone tracking
✅ **Better Planning** - Know vehicle location independent of driver status
✅ **Reduced Downtime** - Track idle vehicles and assets through vehicle phone
✅ **Emergency Response** - Locate vehicles instantly in emergencies via dedicated tracking account  

---

## Security Considerations

1. **Vehicle Account Isolation**
   - Vehicle tracker accounts locked to driver section only
   - Cannot access admin, scheduler, or dispatcher functions
   - Can only update their own vehicle location
   - Isolated from main app user management

2. **Driver Number Protection**
   - Unique per driver (DRV-XXX-YYYY format)
   - Auto-generated (not user-chosen)
   - Used only for driver section login
   - Cannot be changed by driver
   - Audit trail of all driver logins via driver number

3. **Phone-Based Authentication**
   - Multi-factor for vehicle phone setup (admin approval required)
   - SIM card tracking (can verify which device is using account)
   - IP-based geofencing (optional - alert if phone used from wrong location)
   - Auto-timeout for vehicle sessions (30 minutes idle)

4. **Separate Token Management**
   - Driver section uses separate JWT token from main app
   - Each login type generates its own session
   - Vehicle phone sessions auto-expire after idle time
   - Main app token and driver section token managed independently

---

## Testing Plan

### Unit Tests
- [ ] Driver ID generation uniqueness
- [ ] Login type detection
- [ ] VehicleTracker creation validation
- [ ] Permission checks for vehicle accounts

### Integration Tests
- [ ] Standard login still works
- [ ] Driver number login succeeds
- [ ] Vehicle phone login succeeds
- [ ] Mixed scenarios (same driver, different login types)

### E2E Tests
- [ ] Complete vehicle tracking flow
- [ ] Location updates from vehicle phone
- [ ] Fleet dashboard displays both tracking types
- [ ] Driver operations work independently

---

## Rollout Timeline

**Week 1-2**: Backend implementation (models, authentication endpoints, services)
**Week 3**: Frontend updates (driver section login component, admin management)
**Week 4**: QA and bug fixes for driver section
**Week 5**: Pilot rollout with vehicle phone accounts
**Week 6**: Full fleet rollout with monitoring and support

---

## User Experience Flow

### Current Flow (How it Works)
```
User logs into main app with email/username
    ↓
User is authenticated and sees main dashboard
    ↓
User navigates to "Driver" section
    ↓
[NEW] Driver Section Login appears
    ↓
User selects login method:
  - Driver Number (if they have one)
  - Vehicle Phone (vehicle tracking login)
    ↓
User authenticates with driver number OR vehicle phone
    ↓
User accesses driver-specific features:
  - Trip operations
  - Vehicle tracking dashboard
  - Location updates (via vehicle phone)
```

### For Vehicle Phone Login
```
Vehicle SIM boots up
    ↓
Auto-starts app with vehicle phone credentials
    ↓
Vehicle automatically authenticates via /api/drivers/section-login
    ↓
Location tracking begins immediately
    ↓
Runs 24/7, sends location updates every 30 seconds
    ↓
Independent of any driver login/logout
```  

---

## Future Enhancements

1. **Multi-Driver Assignment** - Track multiple drivers per vehicle with role switching
2. **Geofencing Alerts** - Vehicle exits assigned zone triggers notification
3. **Fuel Tracking** - Monitor fuel level from vehicle OBD integration
4. **Predictive Maintenance** - Track mileage and service history per tracking type
5. **Driver-Vehicle History** - Audit trail of all driver assignments and tracking changes
6. **Mobile App** - Native app for vehicle tracking with push notifications
7. **API Integration** - Third-party fleet management system integration

---

## Implementation Status
- **Status**: PLANNING
- **Started**: December 21, 2025
- **Estimated Completion**: 6 weeks
- **Priority**: HIGH
- **Effort**: VERY HIGH
- **Impact**: VERY HIGH - Solves continuous fleet tracking gap

