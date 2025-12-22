# Driver Section Dual Login - Visual Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────┐              │
│  │  MAIN APP LOGIN  │          │  OTHER SECTIONS  │              │
│  │  (UNCHANGED ✅)  │          │  (Admin, Dispatch)│              │
│  ├──────────────────┤          └──────────────────┘              │
│  │ Email/Username   │                                             │
│  │ Password         │          All roles authenticate here        │
│  │                  │          Only one login system              │
│  └────────┬─────────┘                                             │
│           │ Authenticates                                         │
│           ↓                                                       │
│       USER LOGGED IN TO MAIN APP                                │
│                                                                   │
│       [Admin] [Dispatcher] [Scheduler] [Driver] [Rider]          │
│                                          ↑                        │
│                                          │ User clicks            │
│                                          │ Driver section         │
│                                          ↓                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           DRIVER SECTION (SEPARATE SYSTEM)                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  Driver Section Login Required (NEW SYSTEM ✨)             │ │
│  │                                                              │ │
│  │  ┌──────────────────────┐    ┌──────────────────────┐     │ │
│  │  │ OPTION 1:            │    │ OPTION 2:            │     │ │
│  │  │ Driver Number Login  │    │ Vehicle Phone Login  │     │ │
│  │  ├──────────────────────┤    ├──────────────────────┤     │ │
│  │  │ For: Driver ops      │    │ For: Vehicle tracking│     │ │
│  │  │ Use: DRV-001-2025    │    │ Use: +1-555-6001     │     │ │
│  │  │ Manual login         │    │ Auto-login in vehicle│     │ │
│  │  │ Driver dashboard     │    │ 24/7 continuous      │     │ │
│  │  │ Trip operations      │    │ Independent tracking │     │ │
│  │  └──────────────────────┘    └──────────────────────┘     │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Layers

```
LAYER 1: Main App Authentication
═════════════════════════════════════════════════════════════════
Method: Email/Username + Password
Endpoint: /api/auth/login (UNCHANGED)
Roles: All (admin, dispatcher, scheduler, driver, rider)
Token: JWT (stored in main app context)
Duration: Standard (based on config)
Status: ✅ UNCHANGED - No modifications

    ↓ User navigates to Driver section ↓

LAYER 2: Driver Section Authentication (NEW)
═════════════════════════════════════════════════════════════════
Method 1: Driver Number + Password
Endpoint: /api/drivers/section-login
Role: driver
Input: DRV-001-2025
Token: JWT (driver section context - separate from main app)

Method 2: Vehicle Phone + Password
Endpoint: /api/drivers/section-login
Role: vehicle_tracker
Input: +1-555-6001
Token: JWT (driver section context - separate from main app)
Auto-login: Yes (on device boot)

    ↓ Access driver operations ↓

LAYER 3: Driver Section Features
═════════════════════════════════════════════════════════════════
- Trip management
- Location tracking
- Schedule view
- Vehicle dashboard
```

## Data Model Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ USER MODEL (Updated)                                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Standard Fields (existing):                                     │
│  ├─ email                                                         │
│  ├─ username                                                      │
│  ├─ firstName, lastName                                           │
│  ├─ phone                                                         │
│  ├─ role (admin, driver, dispatcher, etc.)                       │
│                                                                    │
│  NEW Fields (for driver section):                                │
│  ├─ driverId (e.g., "DRV-001-2025") [NEW]                       │
│  ├─ loginType (standard, driver_number, vehicle_phone)  [NEW]   │
│  ├─ accountType (driver, vehicle_tracker, admin) [NEW]          │
│  └─ vehicleAssociation {                            [NEW]       │
│      ├─ vehicleId                                                │
│      ├─ vehiclePhone                                             │
│      ├─ trackingStatus (active, inactive, lost)                 │
│      └─ lastTrackedAt                                            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ VEHICLE TRACKER MODEL (NEW)                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ├─ vehicleId (reference to Vehicle)                             │
│  ├─ phoneNumber (SIM in vehicle, e.g., +1-555-6001)            │
│  ├─ simCardNumber                                                │
│  ├─ carrier (Verizon, AT&T, etc.)                               │
│  ├─ linkedUserId (reference to User - the tracking account)     │
│  ├─ trackingConfig {                                            │
│  │   ├─ enabled                                                  │
│  │   ├─ updateFrequency (seconds)                               │
│  │   ├─ batteryOptimized                                        │
│  │   └─ highAccuracy                                            │
│  ├─ currentSession {                                            │
│  │   ├─ token                                                    │
│  │   ├─ startedAt                                               │
│  │   └─ lastActivity                                            │
│  ├─ lastLocation { latitude, longitude, accuracy, timestamp }   │
│  └─ status (active, inactive, lost, disabled)                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Login Flow Comparison

### BEFORE (Current System)
```
Driver logs in with email
       ↓
Gets main app access
       ↓
Navigates to driver section
       ↓
Can view trips and operations
       ↓
Location tracking starts (if enabled)
       ↓
Location tracking STOPS when driver logs out ❌
```

### AFTER (New Dual System)
```
Driver logs in with email (MAIN APP)
       ↓
Gets main app access (unchanged)
       ↓
Navigates to driver section
       ↓
Driver Section Login appears (NEW)
       ├─ Option 1: Driver Number Login
       │   └─ Grants access to driver operations
       │   └─ Trip management
       │   └─ Schedule view
       │
       └─ Option 2: Vehicle Phone Login
           └─ Grants vehicle tracking access
           └─ Continuous 24/7 location updates ✅
           └─ Works even if no driver logged in ✅
           └─ Independent of driver logout ✅
```

## Endpoint Comparison

### Main App (UNCHANGED)
```
POST /api/auth/login
Input: {
  email: "john@company.com",
  password: "password123"
}
Output: {
  token: "jwt_token",
  user: { id, email, role, ... }
}
Usage: All users, all roles
```

### Driver Section (NEW)
```
POST /api/drivers/section-login
Input (Method 1):
{
  driverId: "DRV-001-2025",
  password: "password123",
  loginType: "driver_number"
}

Input (Method 2):
{
  phoneNumber: "+1-555-6001",
  password: "password123",
  loginType: "vehicle_phone"
}

Output: {
  token: "jwt_token_driver_section",
  user: { id, driverId, accountType, loginType, ... }
}

Usage: Driver section only, isolated authentication
```

## Token Management

```
                              Main App
                         JWT Token #1
                    (regular expiration)
                             │
                             ↓
        ┌──────────────────────────────────────┐
        │  User authenticates in main app      │
        │  Gets main token                     │
        │  Can access all authorized sections  │
        └──────────────────────────────────────┘
                             │
                             │ User clicks "Driver"
                             │
                             ↓
        ┌──────────────────────────────────────┐
        │ Driver Section Login Required        │
        │ (separate from main app token)       │
        └──────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
   Driver Number          Vehicle Phone
   JWT Token #2           JWT Token #3
   (Driver section)       (Driver section)
   Expires: 8 hours       Auto-refresh: 30 min
```

## Access Control

```
Main App Roles        Can Access
══════════════════════════════════════════════════════════════
admin              → Admin dashboard, settings, user management
dispatcher         → Trip dispatch, fleet view, assignments
scheduler          → Schedule management, trip creation
driver             → Driver section (requires Section Login)
rider              → Rider booking, trip status

Driver Section (after login)
════════════════════════════════════════════════════════════════
driver_number      → Trip ops, personal dashboard, schedules
vehicle_tracker    → GPS location updates, idle tracking only
```

## Security Boundary

```
┌─────────────────────────────────────────┐
│     MAIN APPLICATION BOUNDARY           │
│                                         │
│  ✓ User Authentication                 │
│  ✓ Role-Based Access Control           │
│  ✓ All Roles                           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ DRIVER SECTION BOUNDARY (NEW)   │   │
│  │                                 │   │
│  │ ✓ Separate Authentication       │   │
│  │ ✓ Separate Tokens               │   │
│  │ ✓ Drivers Only                  │   │
│  │ ✓ Two Auth Methods              │   │
│  │                                 │   │
│  │ ✓ Vehicle Tracker Isolated      │   │
│  │ ✓ Can't access other roles      │   │
│  │ ✓ Location updates only         │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘

NO CROSS-BOUNDARY ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Main app functions can't use driver section token
- Driver section can't access main app resources
- Vehicle tracker can only update location
- Complete isolation between systems
```

## Benefits Summary

```
┌─────────────────────────────────────────────────────────┐
│ DRIVER SECTION DUAL LOGIN SYSTEM BENEFITS               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✅ Independent Vehicle Tracking                         │
│    └─ Continues 24/7 even when driver logs out         │
│                                                          │
│ ✅ Simple Driver Interface                              │
│    └─ Driver number is easy to remember                │
│    └─ Two clear options (driver ops vs vehicle)        │
│                                                          │
│ ✅ No Impact on Main App                               │
│    └─ Email/username login unchanged                   │
│    └─ Other roles completely unaffected                │
│                                                          │
│ ✅ Better Fleet Visibility                             │
│    └─ Vehicles always tracked via phone account        │
│    └─ Dispatcher always knows vehicle location         │
│                                                          │
│ ✅ Scalable Architecture                               │
│    └─ Easy to add more vehicles (just create tracker)  │
│    └─ Independent accounts = simple management         │
│                                                          │
│ ✅ Compliance Ready                                    │
│    └─ Audit trail of driver logins                    │
│    └─ Vehicle tracking history preserved              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
