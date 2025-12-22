# Driver Section Dual Login - Implementation Checklist

## Phase 1: Backend Models & Data (Week 1)

### 1.1 Update User Model ✅ READY
**File**: `backend/models/User.js`
**Lines**: Add new fields to User schema

- [ ] Add `driverId` field
  - Type: String
  - Index: true
  - Unique: true
  - Sparse: true
  - Pattern: /^DRV-\d{3}-\d{4}$/
  
- [ ] Add `loginType` field
  - Type: String
  - Enum: ['standard', 'driver_number', 'vehicle_phone']
  - Default: 'standard'
  
- [ ] Add `accountType` field
  - Type: String
  - Enum: ['driver', 'vehicle_tracker', 'admin', 'dispatcher', 'scheduler']
  - Default: 'driver'
  
- [ ] Add `vehicleAssociation` object
  - vehicleId (ObjectId ref to Vehicle)
  - vehiclePhone (String)
  - simCardNumber (String)
  - assignedDate (Date)
  - trackingStatus (enum)
  - lastTrackedAt (Date)

**Estimated Time**: 30 minutes
**Status**: Not Started

---

### 1.2 Create VehicleTracker Model ✅ READY
**File**: `backend/models/VehicleTracker.js` (NEW FILE)
**Template**: See DUAL_LOGIN_VEHICLE_TRACKING.md Phase 1.3

**Schema Fields**:
- [ ] vehicleId (required, unique)
- [ ] phoneNumber (required, unique)
- [ ] simCardNumber
- [ ] carrier
- [ ] trackingConfig (enabled, updateFrequency, batteryOptimized, highAccuracy)
- [ ] currentSession (token, startedAt, lastActivity, ipAddress, deviceInfo)
- [ ] lastLocation (latitude, longitude, accuracy, timestamp)
- [ ] linkedUserId (ref to User)
- [ ] status (enum: active, inactive, lost, disabled)
- [ ] createdAt, updatedAt

**Estimated Time**: 45 minutes
**Status**: Not Started

---

### 1.3 Create Dual Login Service ✅ READY
**File**: `backend/services/dualLoginService.js` (NEW FILE)

**Functions to implement**:
- [ ] `generateDriverId()` - Create unique DRV-XXX-YYYY format
- [ ] `createVehicleTrackerAccount(vehicleId, phoneNumber)` - Setup vehicle phone account
- [ ] `authenticateByDriverNumber(driverId, password)` - Validate driver number login
- [ ] `authenticateVehiclePhone(phoneNumber, password)` - Validate vehicle phone login
- [ ] `getActiveLoginType(userId)` - Determine user's login method

**Estimated Time**: 1 hour
**Status**: Not Started

---

## Phase 2: Backend API Endpoints (Week 1-2)

### 2.1 Create Driver Section Login Endpoint ✅ READY
**File**: `backend/routes/drivers.js` (NEW route in existing file or create new)
**Endpoint**: `POST /api/drivers/section-login`

**Implementation**:
- [ ] Validate loginType parameter (driver_number or vehicle_phone)
- [ ] If driver_number:
  - Find user by driverId
  - Verify password
  - Create JWT token with driver context
- [ ] If vehicle_phone:
  - Find VehicleTracker by phoneNumber
  - Get linked user
  - Verify password
  - Create JWT token with vehicle_tracker context
- [ ] Return separate token (not main app token)
- [ ] Add rate limiting
- [ ] Log authentication attempt to audit trail

**Request Body**:
```json
{
  "driverId": "DRV-001-2025",
  "phoneNumber": "+1-555-6001",
  "password": "password123",
  "loginType": "driver_number" | "vehicle_phone"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_for_driver_section",
  "user": {
    "id": "user_id",
    "driverId": "DRV-001-2025",
    "firstName": "John",
    "accountType": "driver|vehicle_tracker",
    "loginType": "driver_number|vehicle_phone"
  }
}
```

**Estimated Time**: 1 hour
**Status**: Not Started

---

### 2.2 Create Driver ID Generation Endpoint ✅ READY
**File**: `backend/routes/drivers.js`
**Endpoint**: `POST /api/drivers/:userId/generate-driver-id`

**Implementation**:
- [ ] Require admin authorization
- [ ] Validate user exists and has driver role
- [ ] Check if user already has driverId
- [ ] Generate unique driverId using service
- [ ] Save to database
- [ ] Return generated ID
- [ ] Log action to audit trail

**Request**: `{ }`
**Response**: `{ success: true, driverId: "DRV-001-2025", message: "..." }`

**Estimated Time**: 30 minutes
**Status**: Not Started

---

### 2.3 Create Vehicle Phone Account Setup Endpoint ✅ READY
**File**: `backend/routes/vehicles.js`
**Endpoint**: `POST /api/vehicles/:vehicleId/setup-tracking-account`

**Implementation**:
- [ ] Require admin authorization
- [ ] Validate vehicle exists
- [ ] Validate phone number format
- [ ] Create VehicleTracker record
- [ ] Create associated User account with vehicle_tracker role
- [ ] Generate secure auto password
- [ ] Link user to tracker
- [ ] Return account details (phone, link, credentials note)
- [ ] Log action to audit trail

**Request Body**:
```json
{
  "phoneNumber": "+1-555-6001",
  "simCardNumber": "SIM123456",
  "carrier": "Verizon"
}
```

**Response**:
```json
{
  "success": true,
  "vehicleTracker": { ... },
  "message": "Vehicle tracking account created successfully"
}
```

**Estimated Time**: 1 hour
**Status**: Not Started

---

### 2.4 Bulk Driver ID Generation Endpoint
**File**: `backend/routes/drivers.js`
**Endpoint**: `POST /api/drivers/bulk/generate-driver-ids`

**Implementation**:
- [ ] Require admin authorization
- [ ] Accept array of user IDs or auto-generate for all drivers without IDs
- [ ] Generate IDs for each
- [ ] Return list of generated IDs
- [ ] Export option (CSV download)

**Estimated Time**: 1.5 hours
**Status**: Not Started

---

## Phase 3: Frontend Components (Week 2-3)

### 3.1 Create Driver Section Login Component ✅ READY
**File**: `frontend/src/components/driver/DriverSectionLogin.jsx` (NEW FILE)

**Component Features**:
- [ ] Display tabs for two login methods
- [ ] Tab 1: Driver Number Login
  - Input field for driver ID (placeholder: "DRV-001-2025")
  - Password input
  - Login button
  - Error message display
  - Loading state
- [ ] Tab 2: Vehicle Phone Login
  - Input field for phone number
  - Password input
  - Login button
  - Error message display
  - Loading state
- [ ] Store separate driver section token
- [ ] Auto-redirect on success
- [ ] "Forgot Password" link
- [ ] "Don't have driver ID?" link → Admin management

**Estimated Time**: 2 hours
**Status**: Not Started

---

### 3.2 Update Driver Landing/Dashboard ✅ READY
**File**: `frontend/src/components/driver/DriverLanding.jsx`

**Changes**:
- [ ] Add "Driver Section Login" button/option
- [ ] Detect if user in driver section (via token)
- [ ] Display current login type badge
- [ ] Show driver ID if available
- [ ] Add "Switch Login Method" option
- [ ] Display tracking status (vehicle phone vs manual)
- [ ] Show "Logout from Driver Section" button

**Estimated Time**: 1 hour
**Status**: Not Started

---

### 3.3 Create Driver ID Management Component ✅ READY
**File**: `frontend/src/components/admin/DriverIdManagement.jsx` (NEW FILE)

**Features**:
- [ ] Table of all drivers
- [ ] Show driver ID or "Not Assigned" status
- [ ] "Generate ID" button for individual drivers
- [ ] "Bulk Generate IDs" button
- [ ] Search/filter drivers
- [ ] Export to CSV
- [ ] Copy driver ID to clipboard
- [ ] View/print driver ID cards (formatted for reference)
- [ ] Show creation date

**Estimated Time**: 3 hours
**Status**: Not Started

---

### 3.4 Create Vehicle Tracker Setup Component ✅ READY
**File**: `frontend/src/components/admin/VehicleTrackerSetup.jsx` (NEW FILE)

**Features**:
- [ ] Select vehicle from dropdown
- [ ] Input phone number with validation
- [ ] Input SIM card number
- [ ] Select carrier (dropdown)
- [ ] Show auto-generated password (masked)
- [ ] Copy credentials button
- [ ] Print setup instructions
- [ ] Confirmation dialog before creation
- [ ] Success message with next steps

**Estimated Time**: 2 hours
**Status**: Not Started

---

### 3.5 Create Vehicle Tracking Status Component ✅ READY
**File**: `frontend/src/components/vehicle/VehicleTrackingStatus.jsx` (NEW FILE)

**Display**:
- [ ] Current location (lat/lon)
- [ ] Last update time
- [ ] Tracking method badge (vehicle phone / driver)
- [ ] Status indicator (active/inactive/lost)
- [ ] Battery level (if available)
- [ ] Connection status
- [ ] Current trip (if assigned)
- [ ] Manual location update option

**Estimated Time**: 2 hours
**Status**: Not Started

---

## Phase 4: Integration & Testing (Week 3-4)

### 4.1 Integrate Endpoints with Frontend ✅ READY
**Files**: All components that call `/api/drivers/section-login`

- [ ] Create axios instance for driver section API calls
- [ ] Add separate token management for driver section
- [ ] Create context/hook for driver section auth state
- [ ] Implement token refresh for driver section
- [ ] Handle token expiration gracefully
- [ ] Add logout for driver section (separate from main app)

**Estimated Time**: 2 hours
**Status**: Not Started

---

### 4.2 Update Authentication Context ✅ READY
**File**: `frontend/src/contexts/AuthContext.jsx`

- [ ] Add driver section auth state
- [ ] Track loginType (driver_number, vehicle_phone, none)
- [ ] Add driverId to user context
- [ ] Implement separate login/logout for driver section
- [ ] Handle concurrent sessions (main + driver section)

**Estimated Time**: 1.5 hours
**Status**: Not Started

---

### 4.3 Update Navigation/Routing
**File**: `frontend/src/router/` or routing config

- [ ] Require driver section login to access driver routes
- [ ] Add middleware to check driver section token
- [ ] Redirect to driver section login if needed
- [ ] Allow main app access without driver section login
- [ ] Protect driver-only routes

**Estimated Time**: 1 hour
**Status**: Not Started

---

## Phase 5: Testing (Week 4)

### 5.1 Unit Tests
- [ ] Test generateDriverId() function
- [ ] Test VehicleTracker model validation
- [ ] Test password hashing for vehicle accounts
- [ ] Test driverId uniqueness constraint
- [ ] Test authentication logic

**Estimated Time**: 2 hours
**Status**: Not Started

---

### 5.2 Integration Tests
- [ ] Test driver number login flow
- [ ] Test vehicle phone login flow
- [ ] Test main app login still works (unchanged)
- [ ] Test token separation (main vs driver section)
- [ ] Test logout behavior
- [ ] Test bulk ID generation

**Estimated Time**: 3 hours
**Status**: Not Started

---

### 5.3 E2E Tests
- [ ] Complete user journey: main app → driver section → login
- [ ] Driver number login → trip operations
- [ ] Vehicle phone login → location tracking
- [ ] Location updates from vehicle phone
- [ ] Fleet dashboard displays tracking info
- [ ] Admin creates/manages driver IDs
- [ ] Admin sets up vehicle phone accounts

**Estimated Time**: 4 hours
**Status**: Not Started

---

## Phase 6: Deployment (Week 5-6)

### 6.1 Database Migrations
- [ ] Backup production database
- [ ] Add new fields to User schema
- [ ] Create VehicleTracker collection/table
- [ ] Create indexes for driverId, phoneNumber
- [ ] Verify data integrity
- [ ] Test rollback procedure

**Estimated Time**: 1 hour
**Status**: Not Started

---

### 6.2 Pilot Rollout
- [ ] Select pilot test vehicle (1-2 vehicles)
- [ ] Create test driver account with driver ID
- [ ] Create vehicle phone tracking account
- [ ] Install app on vehicle device with SIM
- [ ] Test auto-login on device
- [ ] Monitor location tracking for 24-48 hours
- [ ] Gather feedback
- [ ] Iterate on issues

**Estimated Time**: 2 days
**Status**: Not Started

---

### 6.3 Full Rollout
- [ ] Generate driver IDs for all existing drivers
- [ ] Create vehicle tracker accounts for fleet
- [ ] Distribute driver ID cards to drivers
- [ ] Distribute setup instructions to vehicle devices
- [ ] Train dispatch team on new features
- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Document lessons learned

**Estimated Time**: 1 week
**Status**: Not Started

---

## Timeline Summary

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Backend Models | Week 1 | ⬜ |
| 2 | API Endpoints | Week 1-2 | ⬜ |
| 3 | Frontend Components | Week 2-3 | ⬜ |
| 4 | Integration | Week 3-4 | ⬜ |
| 5 | Testing | Week 4 | ⬜ |
| 6 | Deployment | Week 5-6 | ⬜ |

**Total Estimated Effort**: 35-40 hours development + 20 hours testing/deployment
**Total Timeline**: 6 weeks

---

## Success Criteria

- [ ] ✅ Main app login works exactly as before (unchanged)
- [ ] ✅ Driver section login accessible only to drivers
- [ ] ✅ Driver number login grants access to driver operations
- [ ] ✅ Vehicle phone login enables 24/7 vehicle tracking
- [ ] ✅ Vehicle tracking works independently of driver login
- [ ] ✅ Fleet dashboard shows vehicle locations in real-time
- [ ] ✅ Admin can generate driver IDs
- [ ] ✅ Admin can create vehicle tracking accounts
- [ ] ✅ Vehicle device auto-logs in on startup
- [ ] ✅ No security vulnerabilities
- [ ] ✅ Location updates accurate and timely
- [ ] ✅ User experience smooth and intuitive

---

## Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Main app login breaks | CRITICAL | Only isolated changes, extensive testing |
| Driver IDs not unique | HIGH | Use DB unique constraint + validation |
| Vehicle tracking stops | HIGH | Auto-retry, fallback to web geolocation |
| Token management complexity | MEDIUM | Clear separation, well-documented |
| Device phone loses SIM | MEDIUM | Alert dispatcher, manual tracking fallback |
| Battery drain on device | MEDIUM | Configurable update frequency |

---

## Next Steps

1. **Immediately**: Review and approve this plan
2. **This Week**: Start Phase 1 (models) and Phase 2 (endpoints)
3. **Next Week**: Implement Phase 3 (components) and Phase 4 (integration)
4. **Week 4**: Complete Phase 5 (testing)
5. **Week 5-6**: Phase 6 (pilot & rollout)

