# Work Schedule Features - API Specification v1.0

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** Ready for Implementation  
**Base URL:** /api

---

## Table of Contents

1. [Authentication](#authentication)
2. [Schedules](#schedules)
3. [Shift Swaps](#shift-swaps)
4. [Time-Off](#time-off)
5. [Vacation Balance](#vacation-balance)
6. [Notifications](#notifications)
7. [Error Codes](#error-codes)
8. [Request/Response Examples](#requestresponse-examples)

---

## Authentication

All endpoints require JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

User roles:
- `driver` - Can manage own schedules, request swaps/time-off
- `manager` - Can approve/deny requests, assign schedules
- `admin` - Full access, can override conflicts

---

## Schedules

### Get Schedule Range

Get all schedules for a driver within a date range.

**Request:**
```
GET /api/schedules/driver/:driverId/range
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | ISO date | ✓ | Range start date (YYYY-MM-DD) |
| endDate | ISO date | ✓ | Range end date (YYYY-MM-DD) |
| status | string | | Filter by status (scheduled, in-progress, completed, cancelled) |

**Response (200):**
```json
{
  "count": 5,
  "schedules": [
    {
      "_id": "65abc123...",
      "driver": {
        "_id": "65def456...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "vehicle": {
        "_id": "65ghi789...",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
      "startTime": "2025-12-15T08:00:00Z",
      "endTime": "2025-12-15T17:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

**Errors:**
- `400` - Missing required query parameters
- `401` - Unauthorized (missing/invalid token)
- `404` - Driver not found

---

### Check Conflicts

Validate a shift for conflicts before creation.

**Request:**
```
POST /api/schedules/check-conflicts
```

**Body:**
```json
{
  "driverId": "65def456...",
  "startTime": "2025-12-15T08:00:00Z",
  "duration": 8,
  "shiftId": null
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| driverId | ObjectId | ✓ | Driver ID to check |
| startTime | ISO datetime | ✓ | Shift start time |
| duration | number | | Duration in hours (default: 8) |
| shiftId | ObjectId | | Shift ID if updating existing |

**Response (200):**
```json
{
  "hasConflicts": true,
  "conflicts": [
    {
      "type": "overlapping_shift",
      "severity": "critical",
      "description": "Overlaps with shift on 2025-12-15 from 12:00-17:00",
      "suggestedAction": "Choose different time or alternative driver"
    },
    {
      "type": "insufficient_break",
      "severity": "high",
      "description": "Only 6 hours break before previous shift (minimum 11)",
      "suggestedAction": "Estimated 5 hours additional break needed"
    }
  ],
  "suggestedAlternativeDrivers": [
    {
      "driverId": "65xyz999...",
      "firstName": "Jane",
      "lastName": "Smith",
      "conflictCount": 0,
      "availability": {
        "availableHours": 32
      }
    }
  ]
}
```

**Response (200) - No Conflicts:**
```json
{
  "hasConflicts": false,
  "conflicts": [],
  "suggestedAlternativeDrivers": []
}
```

**Errors:**
- `400` - Missing required fields (driverId, startTime)
- `401` - Unauthorized

---

### Get Available Time Slots

Find available time slots for a driver on a specific date.

**Request:**
```
GET /api/schedules/driver/:driverId/available-slots
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | ISO date | ✓ | Date to check (YYYY-MM-DD) |
| duration | number | | Slot duration in minutes (default: 480/8 hours) |

**Response (200):**
```json
{
  "date": "2025-12-15",
  "availableSlots": [
    {
      "startTime": "2025-12-15T06:00:00Z",
      "endTime": "2025-12-15T14:00:00Z",
      "duration": 8,
      "gapMinutes": 480
    },
    {
      "startTime": "2025-12-15T18:30:00Z",
      "endTime": "2025-12-16T02:30:00Z",
      "duration": 8,
      "gapMinutes": 480
    }
  ]
}
```

**Errors:**
- `400` - Missing date parameter
- `401` - Unauthorized

---

## Shift Swaps

### Create Swap Request

Request to swap shifts with another driver.

**Request:**
```
POST /api/swap-request
```

**Body:**
```json
{
  "requestingDriverId": "65def456...",
  "targetDriverId": "65xyz999...",
  "originalShiftId": "65abc123...",
  "proposedShiftId": "65ghi789...",
  "reason": "Need to attend family event",
  "swapType": "mutual"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| requestingDriverId | ObjectId | ✓ | Driver requesting swap |
| targetDriverId | ObjectId | ✓ | Driver being asked to swap |
| originalShiftId | ObjectId | ✓ | Requesting driver's shift |
| proposedShiftId | ObjectId | | Target driver's shift (mutual swaps) |
| reason | string | ✓ | Why swap is needed |
| swapType | string | | Type: one-way, mutual, cover (default: one-way) |

**Response (201):**
```json
{
  "_id": "65swp001...",
  "requestingDriver": "65def456...",
  "targetDriver": "65xyz999...",
  "originalShift": "65abc123...",
  "proposedShift": "65ghi789...",
  "swapType": "mutual",
  "reason": "Need to attend family event",
  "status": "pending-driver",
  "createdAt": "2025-12-07T10:30:00Z"
}
```

**Errors:**
- `400` - Missing required fields or invalid shift references
- `401` - Unauthorized

---

### Driver Response to Swap

Driver accepts or declines a swap request.

**Request:**
```
PATCH /api/swap-request/:swapId/driver-response
```

**Body:**
```json
{
  "status": "accepted",
  "notes": "Works for me!"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | ✓ | accepted or declined |
| notes | string | | Optional response notes |

**Response (200):**
```json
{
  "_id": "65swp001...",
  "status": "pending-admin",
  "driverResponse": {
    "status": "accepted",
    "timestamp": "2025-12-07T11:00:00Z",
    "notes": "Works for me!"
  }
}
```

**Errors:**
- `400` - Invalid status value
- `404` - Swap request not found
- `401` - Unauthorized

---

### Admin Response to Swap

Manager approves or denies a swap request and performs the shift assignment.

**Request:**
```
PATCH /api/swap-request/:swapId/admin-response
```

**Required Permission:** `shift_swap:approve`

**Body:**
```json
{
  "status": "approved",
  "notes": "Coverage confirmed"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | ✓ | approved or denied |
| notes | string | | Optional approval/denial notes |

**Response (200):**
```json
{
  "_id": "65swp001...",
  "status": "approved",
  "originalShift": {
    "_id": "65abc123...",
    "driver": "65xyz999..."
  },
  "proposedShift": {
    "_id": "65ghi789...",
    "driver": "65def456..."
  },
  "adminResponse": {
    "status": "approved",
    "respondedBy": "65mgr001...",
    "respondedAt": "2025-12-07T12:00:00Z",
    "notes": "Coverage confirmed"
  }
}
```

**Side Effects:**
- If approved, shifts are automatically swapped between drivers
- Both drivers notified of approval
- Audit log entry created

**Errors:**
- `400` - Conflicts detected with swapped shifts
- `403` - Insufficient permission
- `404` - Swap request not found

---

### Get Driver's Swap Requests

List all swap requests for a driver.

**Request:**
```
GET /api/swap-requests/driver/:driverId
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | | Filter by status (pending-driver, pending-admin, approved, denied, cancelled) |
| type | string | | Filter: sent, received, or all (default: all) |

**Response (200):**
```json
[
  {
    "_id": "65swp001...",
    "requestingDriver": {
      "_id": "65def456...",
      "firstName": "John",
      "lastName": "Doe"
    },
    "targetDriver": {
      "_id": "65xyz999...",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "originalShift": { /* shift details */ },
    "proposedShift": { /* shift details */ },
    "swapType": "mutual",
    "status": "pending-driver",
    "createdAt": "2025-12-07T10:30:00Z"
  }
]
```

**Errors:**
- `401` - Unauthorized

---

## Time-Off

### Request Time-Off

Submit a time-off request.

**Request:**
```
POST /api/time-off/request
```

**Body:**
```json
{
  "driverId": "65def456...",
  "type": "vacation",
  "startDate": "2025-12-20",
  "endDate": "2025-12-25",
  "reason": "Family vacation"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| driverId | ObjectId | ✓ | Driver requesting time-off |
| type | string | ✓ | vacation, sick, personal, unpaid, other |
| startDate | date | ✓ | Start date (YYYY-MM-DD) |
| endDate | date | ✓ | End date (YYYY-MM-DD) |
| reason | string | | Optional reason |

**Response (201):**
```json
{
  "_id": "65tof001...",
  "driver": "65def456...",
  "type": "vacation",
  "startDate": "2025-12-20",
  "endDate": "2025-12-25",
  "totalDays": 6,
  "reason": "Family vacation",
  "status": "pending",
  "conflicts": [
    {
      "type": "schedule_conflict",
      "description": "2 scheduled shift(s) during this period",
      "count": 2
    }
  ],
  "createdAt": "2025-12-07T10:30:00Z"
}
```

**Validation:**
- End date must be ≥ start date
- Vacation requests require sufficient balance
- Conflicts with existing shifts are reported

**Errors:**
- `400` - Invalid date range or insufficient vacation balance
- `401` - Unauthorized

---

### Approve/Deny Time-Off

Manager approves or denies a time-off request.

**Request:**
```
PATCH /api/time-off/:timeOffId/respond
```

**Required Permission:** `time_off:approve`

**Body:**
```json
{
  "status": "approved",
  "notes": "Approved. Coverage arranged."
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | ✓ | approved or denied |
| notes | string | | Optional notes |

**Response (200):**
```json
{
  "_id": "65tof001...",
  "status": "approved",
  "approvedBy": "65mgr001...",
  "approvedAt": "2025-12-07T11:00:00Z",
  "totalDays": 6
}
```

**Side Effects if Approved:**
- Vacation balance is automatically deducted
- Driver notified of approval
- Audit log entry created

**Errors:**
- `403` - Insufficient permission
- `404` - Time-off request not found
- `401` - Unauthorized

---

## Vacation Balance

### Get Vacation Balance

Get current vacation balance for a driver.

**Request:**
```
GET /api/vacation-balance/:driverId
```

**Response (200):**
```json
{
  "_id": "65vac001...",
  "driver": "65def456...",
  "year": 2025,
  "total": 20,
  "used": 5,
  "available": 15,
  "carryoverDays": 0,
  "lastResetDate": "2025-01-01T00:00:00Z",
  "approvedTimeOff": [
    {
      "timeOffId": "65tof001...",
      "days": 5,
      "startDate": "2025-12-20",
      "endDate": "2025-12-25"
    }
  ]
}
```

**Auto-Creation:**
- If balance doesn't exist, automatically creates with 20 days default
- Returns 200 with new balance

**Errors:**
- `401` - Unauthorized
- `404` - Driver not found

---

## Notifications

### Send Shift Reminders

Send email/SMS reminders for upcoming shifts.

**Request:**
```
POST /api/schedules/send-shift-reminders
```

**Required Permission:** Admin

**Body:**
```json
{
  "hoursBeforeShift": 24,
  "sendEmail": true,
  "sendSMS": false
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hoursBeforeShift | number | | Hours before shift to send (default: 24) |
| sendEmail | boolean | | Send email reminders (default: true) |
| sendSMS | boolean | | Send SMS reminders (default: false) |

**Response (200):**
```json
{
  "sentCount": 42,
  "results": [
    {
      "shiftId": "65abc123...",
      "driverId": "65def456...",
      "driverEmail": "john@example.com",
      "driverPhone": "+1234567890",
      "shiftTime": "2025-12-15T08:00:00Z",
      "sent": true
    }
  ]
}
```

**Errors:**
- `403` - Insufficient permission (admin required)
- `401` - Unauthorized

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for this action |
| 404 | Not Found | Requested resource not found |
| 409 | Conflict | Scheduling conflicts detected (use conflict response) |
| 422 | Unprocessable Entity | Request validation failed with detailed error |
| 500 | Internal Error | Server error occurred |

**Error Response Format:**
```json
{
  "error": "Error message description",
  "details": {
    "field": "Specific field with error",
    "reason": "Why it failed"
  }
}
```

---

## Request/Response Examples

### Full Workflow: Create Schedule with Conflict Check

**Step 1: Check for Conflicts**
```bash
curl -X POST http://localhost:5000/api/schedules/check-conflicts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "65def456...",
    "startTime": "2025-12-15T08:00:00Z",
    "duration": 8
  }'
```

**Step 2: If Conflicts, Show Modal to User**
```
Response includes:
- hasConflicts: true
- conflicts: [{type, severity, description}]
- suggestedAlternativeDrivers: [{firstName, lastName, conflictCount}]
```

**Step 3a: Use Alternative Driver**
```bash
# Create schedule with alternative driver instead
POST /api/schedules
body: {
  "driver": "65xyz999...",
  "startTime": "2025-12-15T08:00:00Z",
  "duration": 8
}
```

**Step 3b: Override Conflicts (Manager Only)**
```bash
# Manager can override conflicts
POST /api/schedules
body: {
  "driver": "65def456...",
  "startTime": "2025-12-15T08:00:00Z",
  "duration": 8,
  "override": true,
  "approvedBy": "65mgr001..."
}
```

---

### Full Workflow: Shift Swap

**Step 1: Driver Creates Swap Request**
```bash
curl -X POST http://localhost:5000/api/swap-request \
  -H "Authorization: Bearer <driver_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "requestingDriverId": "65def456...",
    "targetDriverId": "65xyz999...",
    "originalShiftId": "65abc123...",
    "proposedShiftId": "65ghi789...",
    "reason": "Need to attend family event",
    "swapType": "mutual"
  }'
```

**Step 2: Target Driver Responds**
```bash
curl -X PATCH http://localhost:5000/api/swap-request/65swp001.../driver-response \
  -H "Authorization: Bearer <other_driver_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "notes": "Works for me!"
  }'
```

**Step 3: Manager Approves**
```bash
curl -X PATCH http://localhost:5000/api/swap-request/65swp001.../admin-response \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Coverage confirmed"
  }'
```

**Result:** Both shifts are automatically swapped between drivers

---

### Full Workflow: Time-Off Request

**Step 1: Driver Requests Time-Off**
```bash
curl -X POST http://localhost:5000/api/time-off/request \
  -H "Authorization: Bearer <driver_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "65def456...",
    "type": "vacation",
    "startDate": "2025-12-20",
    "endDate": "2025-12-25",
    "reason": "Family vacation"
  }'
```

**Step 2: Manager Reviews Balance**
```bash
curl http://localhost:5000/api/vacation-balance/65def456... \
  -H "Authorization: Bearer <manager_token>"
# Response: {total: 20, used: 5, available: 15}
```

**Step 3: Manager Approves/Denies**
```bash
curl -X PATCH http://localhost:5000/api/time-off/65tof001.../respond \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "notes": "Approved. Coverage arranged."
  }'
```

**Result:** Vacation balance deducted (used: 11, available: 9)

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Admin endpoints: 50 requests per 15 minutes
- Schedule check: 1000 requests per 15 minutes (high frequency)

---

## Changelog

### Version 1.0 (December 7, 2025)
- Initial API specification
- 12 endpoints for schedule management
- Conflict detection framework
- Shift swap workflow
- Time-off management
- Vacation balance tracking

