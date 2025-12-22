# Dual Login System - Quick Reference

## Phase 1 Backend (✅ COMPLETE)

### Key Files
- **Model:** `backend/models/VehicleTracker.js` (450 lines)
- **Service:** `backend/services/dualLoginService.js` (400 lines)  
- **Routes:** `backend/routes/dualLogin.js` (450 lines)
- **Enhancement:** `backend/models/User.js` (+50 lines)

### URL Base
```
http://localhost:3001/api/drivers
```

---

## Endpoints Cheat Sheet

### 🔐 Authentication
```bash
# Driver Login
POST /section-login
Body: { "driverId": "DRV-XXXX-YYYY", "pin": "1234" }
Response: { "token": "jwt_token", "driverId": "...", "userId": "..." }
```

### 👤 Driver Management
```bash
# Generate/Regenerate Driver ID
POST /:userId/generate-driver-id
Headers: Authorization: Bearer token
Permissions: drivers:manage
Body: { "expiryDays": 365, "regenerate": false }

# Enable Dual Login
POST /:userId/enable-dual-login
Headers: Authorization: Bearer token
Permissions: drivers:manage
Body: { "loginType": "driver_number" }

# Disable Dual Login
POST /:userId/disable-dual-login
Headers: Authorization: Bearer token
Permissions: drivers:manage

# Check Eligibility
GET /:userId/check-eligibility
Headers: Authorization: Bearer token

# Get Dashboard
GET /:userId/dashboard
Headers: Authorization: Bearer token
```

### 🚗 Vehicle Tracker
```bash
# Setup Tracker
POST /vehicles/:vehicleId/setup-tracking-account
Headers: Authorization: Bearer token
Permissions: vehicles:manage
Body: {
  "phoneNumber": "+1234567890",
  "trackingFrequency": 30,
  "gpsEnabled": true,
  "lowBatteryThreshold": 20
}

# Activate Tracker
POST /vehicles/:vehicleId/activate-tracker
Headers: Authorization: Bearer token
Body: { "deviceImei": "imei", "osVersion": "14.5" }

# Get Tracker Status
GET /vehicles/:vehicleId/tracker-status
Headers: Authorization: Bearer token
Response: { "status": "active", "battery": 85, "signal": "good" }

# Update Settings
PUT /vehicles/:vehicleId/update-tracking-settings
Headers: Authorization: Bearer token
Body: {
  "frequency": 30,
  "gpsEnabled": true,
  "alertSettings": { "lowBatteryThreshold": 20 }
}
```

### 📦 Bulk Operations
```bash
# Generate IDs for Multiple Users
POST /bulk-generate-driver-ids
Headers: Authorization: Bearer token (admin)
Permissions: admin:drivers
Body: {
  "userIds": ["user1", "user2", "user3"],
  "expiryDays": 365
}
Response: {
  "successful": [
    { "userId": "user1", "driverId": "DRV-...", "expiryDate": "..." }
  ],
  "failed": [
    { "userId": "user2", "error": "User not found" }
  ]
}
```

---

## Driver ID Format

**Format:** `DRV-XXXX-YYYY`
- Prefix: `DRV`
- Separator: `-`
- Random Part: 4 hex characters (A-F, 0-9)
- Separator: `-`
- Timestamp Part: 4 digits (0-9)

**Example:** `DRV-A1B2-1234`

**Validation Regex:** `^DRV-[A-F0-9]{4}-\d{4}$`

---

## Authentication Tokens

### Driver Token (section-login)
```json
{
  "userId": "user_id",
  "driverId": "DRV-XXXX-YYYY",
  "loginType": "driver_number",
  "section": "driver",
  "exp": "12h from issue"
}
```

### Tracker Token (vehicle authentication)
```json
{
  "trackerId": "tracker_id",
  "vehicleId": "vehicle_id",
  "phoneNumber": "+1234567890",
  "loginType": "vehicle_phone",
  "section": "tracker",
  "autonomous": true,
  "exp": "30d from issue"
}
```

---

## Permission Requirements

| Endpoint | Permission |
|----------|------------|
| `/section-login` | None (rate limited) |
| `/:userId/generate-driver-id` | `drivers:manage` |
| `/:userId/enable-dual-login` | `drivers:manage` |
| `/:userId/disable-dual-login` | `drivers:manage` |
| `/:userId/check-eligibility` | Token required |
| `/:userId/dashboard` | Token required |
| `/vehicles/:vehicleId/setup-tracking-account` | `vehicles:manage` |
| `/vehicles/:vehicleId/activate-tracker` | Token required |
| `/vehicles/:vehicleId/tracker-status` | Token required |
| `/vehicles/:vehicleId/update-tracking-settings` | Token required |
| `/bulk-generate-driver-ids` | `admin:drivers` |

---

## Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Authentication | 10 requests / 15 minutes |
| Driver Operations | 50 requests / 15 minutes |
| Tracker Setup | 50 requests / 15 minutes |

---

## Common Use Cases

### Scenario 1: Generate Driver ID for User
```javascript
// 1. Check eligibility
GET /drivers/:userId/check-eligibility

// 2. If eligible, generate ID
POST /drivers/:userId/generate-driver-id

// 3. Get driver section dashboard
GET /drivers/:userId/dashboard
```

### Scenario 2: Setup Vehicle Tracker
```javascript
// 1. Create tracker
POST /vehicles/:vehicleId/setup-tracking-account

// 2. Device confirms setup
POST /vehicles/:vehicleId/activate-tracker

// 3. Configure tracking
PUT /vehicles/:vehicleId/update-tracking-settings

// 4. Monitor health
GET /vehicles/:vehicleId/tracker-status
```

### Scenario 3: Bulk Enable Dual Login
```javascript
// 1. Bulk generate IDs
POST /drivers/bulk-generate-driver-ids

// 2. Enable for all users (in Phase 2 frontend)
// Programmatically call enable-dual-login for each
```

---

## Error Handling

### Common HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit hit
- `500 Internal Server Error` - Server error

### Sample Error Response
```json
{
  "success": false,
  "message": "Invalid driver ID format"
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Phone number already in use by another tracker"
}
```

---

## Database Queries

### Find Active Tracker
```javascript
const tracker = await VehicleTracker.getActiveTrackerForVehicle(vehicleId);
```

### Get Unhealthy Trackers
```javascript
const unhealthy = await VehicleTracker.getUnhealthyTrackers();
```

### Geospatial Query (within 5km)
```javascript
const nearby = await VehicleTracker.getTrackersByLocation(
  longitude, 
  latitude, 
  5000 // meters
);
```

### Get Statistics
```javascript
const stats = await VehicleTracker.getStatistics();
```

---

## Testing with Thunder Client/Postman

### Step 1: Generate Driver ID
```
POST http://localhost:3001/api/drivers/:userId/generate-driver-id
Authorization: Bearer <admin_token>
Content-Type: application/json

Response:
{
  "success": true,
  "data": {
    "driverId": "DRV-ABCD-1234",
    "expiryDate": "2025-12-21T..."
  }
}
```

### Step 2: Driver Login
```
POST http://localhost:3001/api/drivers/section-login
Content-Type: application/json

{
  "driverId": "DRV-ABCD-1234"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "driverId": "DRV-ABCD-1234",
    "userId": "user_id"
  }
}
```

### Step 3: Use Driver Token
```
GET http://localhost:3001/api/drivers/:userId/dashboard
Authorization: Bearer <driver_token>
```

---

## Security Checklist

✅ Rate limiting on auth endpoints
✅ JWT tokens with short expiry  
✅ Permission-based access control
✅ Phone number uniqueness enforced
✅ Credentials stored securely
✅ Activity logging enabled
✅ IMEI device verification
✅ Sensitive fields excluded from responses

---

## Next Steps (Phase 2)

When ready for frontend implementation:

1. Create `DriverLoginForm` component
2. Create `DualLoginContext` for state
3. Create `DriverDashboard` component
4. Create `TrackerConfigPanel` component
5. Integrate with existing `AuthContext`
6. Add to navigation/menu system

**Phase 2 Estimated Time:** 2-3 hours

---

## Troubleshooting

**"Invalid driver ID format"**
- Verify format: `DRV-XXXX-YYYY`
- Check that middle part is 4 hex characters (A-F, 0-9)
- Check that last part is 4 digits

**"Phone number already in use"**
- Phone must be unique across all active trackers
- Archive old tracker or use different phone

**"Rate limit exceeded"**
- Wait 15 minutes or use different client IP
- Auth endpoints allow 10 attempts per 15min

**"Token expired"**
- Driver tokens expire after 12 hours
- Tracker tokens expire after 30 days
- Call login endpoint again to get new token

---

## Useful MongoDB Queries

```javascript
// Find tracker by vehicle
db.vehicletrackers.findOne({ vehicleId: ObjectId("...") })

// Find tracker by phone
db.vehicletrackers.findOne({ phoneNumber: "+1234567890" })

// Find all active trackers
db.vehicletrackers.find({ status: "active" })

// Find inactive trackers
db.vehicletrackers.find({ status: "inactive" })

// Get tracker status
db.vehicletrackers.findOne(
  { vehicleId: ObjectId("...") },
  { status: 1, batteryLevel: 1, signalStrength: 1, lastTrackedAt: 1 }
)

// Find users with dual login enabled
db.users.find({ dualLoginEnabled: true })

// Get all driver IDs (admin)
db.users.find({ driverId: { $exists: true } }, { driverId: 1, name: 1 })
```

---

## File Structure
```
backend/
├── models/VehicleTracker.js (450 lines, all methods)
├── services/dualLoginService.js (400 lines, business logic)
├── routes/dualLogin.js (450 lines, 11 endpoints)
└── models/User.js (enhanced with 8 new fields)
```

---

**Last Updated:** December 21, 2024
**Phase Status:** ✅ Backend Complete, Ready for Frontend
**Next Phase:** Phase 2 - Frontend Implementation
