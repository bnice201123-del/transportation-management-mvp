# Vehicle Management System - Comprehensive Guide

## Overview
The Vehicle Management System provides comprehensive automation for vehicle maintenance scheduling, document management, intelligent assignment optimization, and advanced analytics for fleet performance, downtime, and cost tracking.

---

## 🔧 Features Implemented

### 1. **Automated Maintenance Scheduling**
- **Dual-trigger scheduling**: Based on mileage, time, or both
- **Smart due date calculation**: Estimates next service based on average vehicle usage
- **Recurrence engine**: Supports preventive, inspection, repair, recall, and custom schedules
- **Tolerance windows**: Prevents premature or late service triggers
- **Priority levels**: Low, medium, high, urgent, critical
- **Performance tracking**: On-time vs late completions, cost trends

### 2. **Multi-Channel Notification System**
- **Notification types**:
  - `days_before`: Alert X days before due date
  - `miles_before`: Alert X miles before due mileage
  - `at_due`: Alert when maintenance is due
  - `overdue`: Alert when maintenance is overdue
- **Delivery channels**: Email, SMS, push notifications, in-app
- **Recipient flexibility**: By user, role, email, or phone number
- **Duplicate prevention**: Tracks sent notifications to prevent spam

### 3. **Vehicle Document Management**
- **Document types**: Registration, title, insurance policies, certificates, maintenance records, warranties, receipts, photos, manuals
- **Expiration tracking**: Auto-detects expired documents and calculates days until expiration
- **Version control**: Maintains history of previous versions with change notes
- **Access control**: Visibility levels (public, internal, restricted, confidential)
- **Role-based permissions**: Control access by role or specific users
- **Compliance tracking**: Regulatory requirements (DOT, EPA, OSHA, state, local)
- **Audit trail**: Complete history of views, downloads, and modifications

### 4. **Intelligent Vehicle Assignment Optimization**
- **Multi-criteria scoring system**:
  - Driver preference matching (20%)
  - Vehicle utilization balancing (15%)
  - Proximity to pickup location (10-25%)
  - Maintenance status (10%)
  - Fuel efficiency (10%)
  - Equipment requirements match (15%)
  - Cost efficiency (10-20%)
- **Automated vehicle selection**: Finds optimal vehicle for trip requirements
- **Conflict detection**: Checks for overlapping assignments and scheduled maintenance
- **Assignment types**: Permanent, temporary, trip-based, pool, standby
- **Pre/post assignment checks**: Inspection checklists with photo upload
- **GPS-verified mileage tracking**: Detects odometer discrepancies
- **Issue reporting**: Track mechanical issues, delays, route deviations

### 5. **Vehicle Downtime Analytics**
- **Downtime tracking by reason**:
  - Maintenance (scheduled)
  - Repair (unscheduled)
  - Inspection
  - Accident
  - Unavailable
  - Other
- **Metrics**:
  - Total downtime hours by vehicle
  - Downtime cost (direct costs + opportunity cost)
  - Downtime trend over time
  - Mean time between failures (MTBF)
  - Average downtime per incident

### 6. **Fuel Consumption Tracking & Analytics**
- **Data sources**:
  - Manual fuel logs from drivers
  - Assignment fuel tracking
  - Vehicle telematics integration
- **Metrics**:
  - Total fuel consumed (gallons)
  - Total fuel cost
  - Average MPG by vehicle
  - Cost per mile
  - Cost per gallon trends
  - Fuel efficiency comparison across fleet

### 7. **Comprehensive Performance Metrics**
- **Utilization metrics**:
  - Utilization rate (active hours / total hours)
  - Active vs idle time
  - Average miles per day
  - Revenue per hour and per mile
- **Reliability metrics**:
  - On-time performance percentage
  - Breakdown rate
  - Mean time between failures
  - Incident rate
  - Reliability score (0-100)
- **Cost efficiency**:
  - Total operating cost
  - Cost per mile breakdown (fuel + maintenance)
  - Cost trends over time
- **Safety metrics**:
  - Accident count and rate (per 100k miles)
  - Hard braking events
  - Rapid acceleration events
  - Safety score (0-100)
- **Maintenance health**:
  - Preventive maintenance ratio
  - On-time maintenance rate
  - Overdue maintenance count
  - Maintenance health score (0-100)

### 8. **Fleet-Wide Comparison & Benchmarking**
- **Compare all vehicles** across 5 key dimensions:
  - Utilization score
  - Reliability score
  - Safety score
  - Maintenance score
  - Cost efficiency
- **Overall vehicle score**: Weighted average of all metrics
- **Fleet averages**: Identify underperforming and top-performing vehicles
- **Ranking**: Vehicles sorted by overall performance

### 9. **Maintenance History Tracking**
- **Complete audit trail** of all maintenance events
- **Link schedules to actual work**: MaintenanceSchedule → MaintenanceRecord
- **Cost tracking**: Estimated vs actual costs
- **Performance analytics**: Schedule adherence and cost trends
- **Service provider tracking**: Preferred shops, dealerships, in-house

### 10. **Vehicle Inspection Checklist System**
- **Pre-assignment inspections**: Required before vehicle can be assigned
- **Post-assignment inspections**: Damage reporting with photo evidence
- **Checklist items**: Pass, fail, warning, or not applicable status
- **Overall status**: Pass, fail, or conditional
- **Digital signatures**: Inspector verification
- **Photo documentation**: Attach inspection photos

### 11. **Depreciation Tracking**
- **Depreciation methods**:
  - Straight-line
  - Declining balance
  - Sum-of-years digits
  - Units of production
- **Automatic calculation**: Based on purchase price, useful life, salvage value
- **Current value tracking**: Updated on each calculation
- **Integration with assignment costs**: Factor depreciation into cost per mile

---

## 📊 Database Models

### **MaintenanceSchedule.js** (450 lines)
Comprehensive automation for recurring maintenance.

**Key Fields:**
```javascript
{
  scheduleId: "SCH-timestamp-random",
  scheduleName: "Oil Change - Every 5000 miles",
  scheduleType: "preventive" | "inspection" | "repair" | "recall" | "custom",
  priority: "low" | "medium" | "high" | "urgent" | "critical",
  vehicle: ObjectId,
  
  recurrence: {
    basedOn: "mileage" | "time" | "both" | "condition",
    mileageInterval: 5000,
    mileageTolerance: 500,
    timeInterval: { value: 3, unit: "months" },
    timeTolerance: { value: 7, unit: "days" }
  },
  
  nextDue: {
    date: Date,
    mileage: Number,
    estimatedDate: Date,
    daysUntilDue: Number,
    milesUntilDue: Number,
    isOverdue: Boolean,
    overdueBy: { days: Number, miles: Number }
  },
  
  notifications: {
    enabled: Boolean,
    recipients: [{ user | role | email | phone }],
    reminderSchedule: [{
      type: "days_before" | "miles_before" | "at_due" | "overdue",
      value: Number,
      channels: ["email", "sms", "push", "in_app"],
      sent: Boolean,
      sentAt: Date
    }]
  },
  
  serviceDetails: {
    category: "engine" | "transmission" | "brakes" | "tires" | ...,
    estimatedDuration: Number, // minutes
    estimatedCost: { min: Number, max: Number, currency: "USD" },
    partsRequired: [{ name, quantity, cost }],
    laborHours: Number,
    specialTools: [String],
    instructions: String
  },
  
  performance: {
    totalCompletions: Number,
    onTimeCompletions: Number,
    lateCompletions: Number,
    averageCost: Number,
    averageDelay: Number,
    costTrend: "increasing" | "stable" | "decreasing"
  },
  
  compliance: {
    isRegulatory: Boolean,
    regulatoryType: "DOT" | "EPA" | "OSHA" | "state" | "local",
    regulationReference: String,
    certificateRequired: Boolean,
    certificateExpiration: Date
  }
}
```

**Methods:**
- `calculateNextDue(currentMileage, averageDailyMiles)` - Smart recalculation
- `markCompleted(recordId, date, mileage, cost)` - Update history and metrics
- `shouldNotify(type)` - Check if notification should be sent
- `markNotificationSent(type)` - Record sent notification

---

### **VehicleDocument.js** (500 lines)
Centralized document management with version control.

**Key Fields:**
```javascript
{
  documentId: "DOC-timestamp-random",
  vehicle: ObjectId,
  documentType: "registration" | "title" | "insurance_policy" | ...,
  category: "legal" | "financial" | "maintenance" | "compliance" | ...,
  
  file: {
    fileName: String,
    originalName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String,
    fileHash: String,
    storageLocation: "local" | "s3" | "azure" | "google_cloud",
    storagePath: String,
    isEncrypted: Boolean
  },
  
  dates: {
    issueDate: Date,
    effectiveDate: Date,
    expirationDate: Date,
    renewalDate: Date,
    uploadedAt: Date,
    lastViewedAt: Date,
    lastDownloadedAt: Date
  },
  
  expiration: {
    hasExpiration: Boolean,
    isExpired: Boolean,
    expiresIn: Number, // days
    requiresRenewal: Boolean,
    renewalInProgress: Boolean,
    renewalReminderSent: Boolean,
    renewalReminderDays: 30
  },
  
  access: {
    visibility: "public" | "internal" | "restricted" | "confidential",
    allowedRoles: [String],
    allowedUsers: [ObjectId],
    requiresApproval: Boolean,
    approvedBy: ObjectId,
    approvedAt: Date
  },
  
  version: {
    versionNumber: Number,
    isLatest: Boolean,
    previousVersions: [{
      versionNumber, fileName, fileUrl, uploadedAt, changeNotes
    }],
    changeHistory: [{ date, changedBy, changeType, description }]
  },
  
  auditLog: [{
    action: "uploaded" | "viewed" | "downloaded" | "shared" | ...,
    performedBy: ObjectId,
    performedAt: Date,
    ipAddress: String,
    userAgent: String
  }]
}
```

**Methods:**
- `isExpiringSoon(days)` - Check if document expires within X days
- `createNewVersion(fileData, changeNotes, userId)` - Create new version
- `recordAccess(action, userId, details)` - Log access event
- `archive(reason, userId)` - Archive document
- `hasAccess(userRole, userId)` - Check if user can access document

---

### **VehicleAssignment.js** (650 lines)
Intelligent vehicle assignment with optimization.

**Key Fields:**
```javascript
{
  assignmentId: "ASGN-timestamp-random",
  vehicle: ObjectId,
  driver: ObjectId,
  trip: ObjectId,
  assignmentType: "permanent" | "temporary" | "trip_based" | "pool" | "standby",
  
  matchScores: {
    overall: Number, // 0-100
    driverPreference: Number,
    vehicleUtilization: Number,
    proximityScore: Number,
    availabilityScore: Number,
    maintenanceScore: Number,
    fuelEfficiency: Number,
    equipmentMatch: Number,
    costEfficiency: Number
  },
  
  assignmentReason: "optimal_match" | "closest_available" | "manual_override" | ...,
  isAutomated: Boolean,
  automationScore: Number,
  
  mileage: {
    startMileage: Number,
    endMileage: Number,
    totalMiles: Number,
    gpsVerified: Boolean,
    gpsDistance: Number,
    odometerDistance: Number,
    discrepancy: Number,
    discrepancyPercentage: Number
  },
  
  fuel: {
    startFuelLevel: Number, // percentage
    endFuelLevel: Number,
    fuelConsumed: Number, // gallons
    fuelCost: Number,
    fuelEfficiency: Number // MPG
  },
  
  performance: {
    onTimeStart: Boolean,
    onTimeEnd: Boolean,
    delayMinutes: Number,
    fuelEfficiencyMPG: Number,
    averageSpeed: Number,
    hardBraking: Number,
    rapidAcceleration: Number,
    idling: Number, // minutes
    driverRating: Number,
    passengerRating: Number
  },
  
  checks: {
    preAssignment: {
      completed: Boolean,
      checklist: [{ item, status, notes, photo }],
      overallStatus: "pass" | "fail" | "conditional"
    },
    postAssignment: {
      completed: Boolean,
      checklist: [{ item, status, notes, photo }],
      damageReported: Boolean,
      damagePhotos: [String]
    }
  },
  
  issues: [{
    type: "mechanical" | "accident" | "delay" | "route_deviation" | ...,
    severity: "minor" | "moderate" | "major" | "critical",
    description: String,
    reportedBy: ObjectId,
    resolved: Boolean,
    resolution: String
  }]
}
```

**Methods:**
- `markCompleted(completionData)` - Mark assignment complete
- `cancel(reason, userId)` - Cancel assignment
- `reportIssue(issueData, userId)` - Report problem
- `replaceVehicle(newVehicle, reason, userId, mileage)` - Replace mid-assignment
- `calculateUtilization()` - Calculate efficiency metrics

---

## 🔌 Services

### **MaintenanceScheduleService.js** (750 lines)

**Key Methods:**
- `createSchedule(scheduleData, createdBy)` - Create new schedule
- `createBulkSchedules(vehicleIds, template, createdBy)` - Bulk creation for fleet
- `getDueSchedules(vehicleId, options)` - Get upcoming/overdue schedules
- `getOverdueSchedules()` - Fleet-wide overdue list
- `completeSchedule(scheduleId, completionData, completedBy)` - Mark completed
- `rescheduleMaintenance(scheduleId, newDate, newMileage, reason, userId)` - Reschedule
- `getSchedulesNeedingNotification(type)` - Find schedules requiring alerts
- `markNotificationSent(scheduleId, type)` - Record sent notification
- `getPerformanceAnalytics(vehicleId, dateRange)` - Schedule performance stats
- `calculateAverageDailyMileage(vehicleId, days)` - Usage estimation
- `updateAllVehicleSchedules(vehicleId)` - Recalculate all schedules for vehicle
- `getMaintenanceCalendar(startDate, endDate, vehicleIds)` - Calendar view

---

### **VehicleAssignmentService.js** (600 lines)

**Key Methods:**
- `findOptimalVehicle(requirements, options)` - Multi-criteria optimization
- `getAvailableVehicles(startDate, endDate, requirements, excludeVehicles)` - Filter available
- `calculateVehicleScore(vehicle, requirements, preferredDriver, options)` - Score calculation
- `createAssignment(assignmentData, assignedBy)` - Create assignment
- `autoAssignVehicle(tripId, assignedBy, options)` - Auto-assign to trip
- `checkVehicleAvailability(vehicleId, startDate, endDate)` - Availability check
- `getUtilizationAnalytics(vehicleIds, startDate, endDate)` - Utilization stats
- `calculateDistance(coords1, coords2)` - Haversine distance calculation
- `getAverageMPG(vehicleType, fuelType)` - Fuel efficiency lookup
- `estimateCostPerMile(vehicle)` - Cost estimation

---

### **VehicleAnalyticsService.js** (700 lines)

**Key Methods:**
- `getDowntimeAnalytics(vehicleId, startDate, endDate)` - Comprehensive downtime analysis
- `calculateVehicleDowntime(vehicleId, startDate, endDate)` - Individual vehicle downtime
- `calculateDowntimeTrend(startDate, endDate, vehicleId)` - Trend over time
- `getFuelAnalytics(vehicleId, startDate, endDate)` - Fuel consumption analysis
- `calculateVehicleFuelConsumption(vehicleId, startDate, endDate)` - Individual fuel stats
- `getPerformanceMetrics(vehicleId, startDate, endDate)` - All performance metrics
- `calculateUtilizationMetrics(vehicleId, startDate, endDate)` - Utilization analysis
- `calculateReliabilityMetrics(vehicleId, startDate, endDate)` - Reliability scoring
- `calculateCostEfficiency(vehicleId, startDate, endDate)` - Cost analysis
- `calculateSafetyMetrics(vehicleId, startDate, endDate)` - Safety scoring
- `calculateMaintenanceMetrics(vehicleId, startDate, endDate)` - Maintenance health
- `getFleetComparison(startDate, endDate)` - Fleet-wide benchmarking

---

## 🛣️ API Endpoints

### **Maintenance Scheduling**

#### Create Schedule
```
POST /api/vehicle-management/maintenance-schedules
Body: {
  vehicle: "vehicleId",
  scheduleName: "Oil Change - Every 5000 miles",
  scheduleType: "preventive",
  priority: "medium",
  recurrence: {
    basedOn: "mileage",
    mileageInterval: 5000,
    mileageTolerance: 500
  },
  serviceDetails: {
    category: "engine",
    estimatedDuration: 60,
    estimatedCost: { min: 40, max: 60, currency: "USD" }
  },
  notifications: {
    enabled: true,
    recipients: [{ role: "mechanic" }],
    reminderSchedule: [
      { type: "miles_before", value: 500, channels: ["email", "in_app"] },
      { type: "overdue", value: 0, channels: ["email", "sms"] }
    ]
  }
}
```

#### Bulk Create Schedules
```
POST /api/vehicle-management/maintenance-schedules/bulk
Body: {
  vehicleIds: ["id1", "id2", "id3"],
  scheduleTemplate: { ...scheduleData }
}
```

#### Get All Schedules
```
GET /api/vehicle-management/maintenance-schedules
Query: ?vehicle=id&status=scheduled&isOverdue=true&priority=urgent
```

#### Get Due Schedules for Vehicle
```
GET /api/vehicle-management/:vehicleId/schedules/due
Query: ?includeUpcoming=true&upcomingDays=30&upcomingMiles=1000
```

#### Get Overdue Schedules
```
GET /api/vehicle-management/maintenance-schedules/status/overdue
```

#### Complete Schedule
```
PUT /api/vehicle-management/maintenance-schedules/:id/complete
Body: {
  maintenanceRecordId: "recordId",
  completedDate: "2024-01-15",
  completedMileage: 45500,
  actualCost: 55
}
```

#### Reschedule Maintenance
```
PUT /api/vehicle-management/maintenance-schedules/:id/reschedule
Body: {
  newDate: "2024-02-01",
  newMileage: 46000,
  reason: "Vehicle in use, rescheduled"
}
```

#### Get Maintenance Calendar
```
GET /api/vehicle-management/maintenance-schedules/calendar
Query: ?startDate=2024-01-01&endDate=2024-01-31&vehicleIds=id1,id2
```

#### Get Performance Analytics
```
GET /api/vehicle-management/maintenance-schedules/analytics/performance
Query: ?vehicleId=id&startDate=2024-01-01&endDate=2024-12-31
```

---

### **Vehicle Documents**

#### Upload Document
```
POST /api/vehicle-management/:vehicleId/documents
Content-Type: multipart/form-data
Body: {
  file: [binary],
  documentData: JSON.stringify({
    documentType: "registration",
    category: "legal",
    title: "Vehicle Registration 2024",
    dates: {
      issueDate: "2024-01-01",
      expirationDate: "2025-01-01"
    },
    expiration: {
      requiresRenewal: true,
      renewalReminderDays: 30
    }
  })
}
```

#### Get Vehicle Documents
```
GET /api/vehicle-management/:vehicleId/documents
```

#### Get Expiring Documents
```
GET /api/vehicle-management/documents/expiring
Query: ?days=30
```

---

### **Vehicle Assignments**

#### Create Assignment
```
POST /api/vehicle-management/assignments
Body: {
  vehicle: "vehicleId",
  driver: "driverId",
  trip: "tripId",
  assignmentType: "trip_based",
  startDate: "2024-01-15T08:00:00Z",
  endDate: "2024-01-15T10:00:00Z",
  requirements: {
    wheelchairAccessible: true,
    passengerCapacity: 4
  }
}
```

#### Auto-Assign Vehicle to Trip
```
POST /api/vehicle-management/assignments/auto-assign
Body: {
  tripId: "tripId",
  options: {
    prioritizeProximity: true,
    prioritizeCost: false
  }
}
Response: {
  assignment: { ...assignmentData },
  vehicle: { ...vehicleData },
  matchScore: 87.5,
  alternatives: [
    { vehicle: {...}, scores: {...}, overallScore: 82.3 },
    { vehicle: {...}, scores: {...}, overallScore: 79.8 }
  ]
}
```

#### Find Optimal Vehicle
```
POST /api/vehicle-management/assignments/find-optimal
Body: {
  requirements: {
    startDate: "2024-01-15T08:00:00Z",
    endDate: "2024-01-15T10:00:00Z",
    pickupLocation: {
      coordinates: [-73.935242, 40.730610]
    },
    passengerCapacity: 4,
    wheelchairAccessible: true,
    estimatedDistance: 25
  },
  options: {
    preferredDriver: "driverId",
    prioritizeProximity: true
  }
}
Response: {
  success: true,
  optimalVehicle: {
    vehicle: { ...vehicleData },
    scores: {
      overall: 87.5,
      driverPreference: 100,
      vehicleUtilization: 75,
      proximityScore: 90,
      maintenanceScore: 85,
      fuelEfficiency: 80,
      equipmentMatch: 100,
      costEfficiency: 85
    },
    overallScore: 87.5
  },
  alternatives: [...]
}
```

#### Get Assignments
```
GET /api/vehicle-management/assignments
Query: ?vehicle=id&driver=id&status=active&startDate=2024-01-01&endDate=2024-01-31
```

#### Complete Assignment
```
PUT /api/vehicle-management/assignments/:id/complete
Body: {
  endDate: "2024-01-15T10:00:00Z",
  endMileage: 45530,
  endFuelLevel: 65,
  actualCost: 35,
  onTime: true
}
```

#### Check Vehicle Availability
```
GET /api/vehicle-management/:vehicleId/availability
Query: ?startDate=2024-01-15T08:00:00Z&endDate=2024-01-15T10:00:00Z
Response: {
  available: true | false,
  reason: "Vehicle has conflicting assignment",
  assignment: { ...conflictingAssignmentData }
}
```

---

### **Vehicle Analytics**

#### Get Downtime Analytics
```
GET /api/vehicle-management/analytics/downtime
Query: ?vehicleId=id&startDate=2024-01-01&endDate=2024-01-31
Response: {
  totalVehicles: 10,
  totalDowntimeHours: 245,
  totalDowntimeCost: 12500,
  averageDowntimePerVehicle: 24.5,
  downtimeByReason: {
    maintenance: { hours: 120, incidents: 15, cost: 6000 },
    repair: { hours: 80, incidents: 8, cost: 5000 },
    accident: { hours: 45, incidents: 2, cost: 1500 }
  },
  downtimeByVehicle: {
    "vehicleId": {
      vehicle: { ...vehicleData },
      totalHours: 30,
      estimatedCost: 1500,
      byReason: { ... },
      periods: [...]
    }
  },
  downtimeTrend: [
    { date: "2024-01-01", totalHours: 8, totalCost: 400, byReason: {...} }
  ]
}
```

#### Get Fuel Analytics
```
GET /api/vehicle-management/analytics/fuel
Query: ?vehicleId=id&startDate=2024-01-01&endDate=2024-01-31
Response: {
  totalVehicles: 10,
  totalFuelConsumed: 1500, // gallons
  totalFuelCost: 5250,
  averageMPG: 22.5,
  totalMilesDriven: 33750,
  averageCostPerMile: 0.155,
  byVehicle: {
    "vehicleId": {
      vehicle: { ...vehicleData },
      totalFuel: 150,
      totalCost: 525,
      totalMiles: 3375,
      averageMPG: 22.5,
      averageCostPerGallon: 3.50
    }
  }
}
```

#### Get Performance Metrics
```
GET /api/vehicle-management/analytics/performance/:vehicleId
Query: ?startDate=2024-01-01&endDate=2024-01-31
Response: {
  vehicle: { ...vehicleData },
  utilization: {
    utilizationRate: 65.5, // percentage
    activeHours: 472,
    idleHours: 248,
    totalMiles: 3375,
    averageMilesPerDay: 108.9,
    totalAssignments: 45,
    revenuePerHour: 85,
    revenuePerMile: 2.5
  },
  reliability: {
    onTimePercentage: 92.5,
    breakdownRate: 2,
    meanTimeBetweenFailures: 15.5, // days
    incidentRate: 1,
    reliabilityScore: 85
  },
  costEfficiency: {
    totalCost: 1250,
    fuelCost: 525,
    maintenanceCost: 725,
    costPerMile: 0.37,
    fuelCostPerMile: 0.155,
    maintenanceCostPerMile: 0.215,
    totalMiles: 3375
  },
  safety: {
    accidentCount: 0,
    accidentRate: 0,
    hardBrakingEvents: 12,
    rapidAccelerationEvents: 8,
    safetyScore: 76
  },
  maintenance: {
    totalMaintenanceEvents: 5,
    preventiveMaintenanceCount: 4,
    repairCount: 1,
    preventiveMaintenanceRatio: 80,
    totalMaintenanceCost: 725,
    averageMaintenanceCost: 145,
    onTimeMaintenanceRate: 100,
    overdueMaintenanceCount: 0,
    maintenanceHealthScore: 95
  }
}
```

#### Get Fleet Comparison
```
GET /api/vehicle-management/analytics/fleet-comparison
Query: ?startDate=2024-01-01&endDate=2024-01-31
Response: {
  totalVehicles: 10,
  vehicles: [
    {
      vehicle: { id, make, model, licensePlate },
      utilizationScore: 65.5,
      reliabilityScore: 85,
      safetyScore: 76,
      maintenanceScore: 95,
      costEfficiency: 0.37,
      overallScore: 80.375
    },
    ...
  ],
  fleetAverages: {
    utilizationScore: 62.3,
    reliabilityScore: 78.5,
    safetyScore: 81.2,
    maintenanceScore: 88.7,
    costPerMile: 0.42,
    overallScore: 77.675
  }
}
```

#### Get Utilization Analytics
```
GET /api/vehicle-management/analytics/utilization
Query: ?vehicleIds=id1,id2&startDate=2024-01-01&endDate=2024-01-31
Response: {
  totalAssignments: 450,
  totalMiles: 33750,
  totalHours: 4720,
  totalCost: 12500,
  averageCostPerMile: 0.37,
  averageCostPerHour: 2.65,
  averageUtilization: 64.5,
  byVehicle: {
    "vehicleId": {
      vehicle: { ...vehicleData },
      assignments: 45,
      totalMiles: 3375,
      totalHours: 472,
      totalCost: 1250,
      averageUtilization: 65.5
    }
  },
  utilizationDistribution: {
    underutilized: 3, // <40%
    optimal: 5, // 40-70%
    overutilized: 2 // >70%
  }
}
```

---

## 🔔 Notification System Implementation

### Scheduled Job Example (using node-cron or similar)

```javascript
import cron from 'node-cron';
import MaintenanceScheduleService from './services/maintenanceScheduleService.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking for maintenance notifications...');
  
  const schedulesNeedingNotification = await MaintenanceScheduleService.getSchedulesNeedingNotification();
  
  for (const { schedule, reminderType, channels } of schedulesNeedingNotification) {
    // Send notifications via each channel
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          await sendEmailNotification(schedule, reminderType);
          break;
        case 'sms':
          await sendSMSNotification(schedule, reminderType);
          break;
        case 'push':
          await sendPushNotification(schedule, reminderType);
          break;
        case 'in_app':
          await createInAppNotification(schedule, reminderType);
          break;
      }
    }
    
    // Mark notification as sent
    await MaintenanceScheduleService.markNotificationSent(schedule._id, reminderType);
  }
});

async function sendEmailNotification(schedule, type) {
  const transporter = nodemailer.createTransport({...});
  
  const subject = type === 'overdue' 
    ? `🚨 OVERDUE: ${schedule.scheduleName}` 
    : `🔔 Upcoming: ${schedule.scheduleName}`;
  
  const body = `
    Vehicle: ${schedule.vehicle.make} ${schedule.vehicle.model} (${schedule.vehicle.licensePlate})
    Maintenance: ${schedule.scheduleName}
    Next Due: ${schedule.nextDue.date.toLocaleDateString()}
    Next Due Mileage: ${schedule.nextDue.mileage}
    ${schedule.nextDue.isOverdue ? `Overdue by ${schedule.nextDue.overdueBy.days} days and ${schedule.nextDue.overdueBy.miles} miles` : ''}
    
    Estimated Cost: $${schedule.serviceDetails.estimatedCost.min} - $${schedule.serviceDetails.estimatedCost.max}
    Estimated Duration: ${schedule.serviceDetails.estimatedDuration} minutes
  `;
  
  for (const recipient of schedule.notifications.recipients) {
    if (recipient.email) {
      await transporter.sendMail({
        to: recipient.email,
        subject,
        text: body
      });
    }
  }
}
```

---

## 💡 Usage Examples

### Example 1: Create Oil Change Schedule for Entire Fleet

```javascript
// Get all active vehicles
const vehicles = await Vehicle.find({ status: { $in: ['active', 'idle'] } });
const vehicleIds = vehicles.map(v => v._id);

// Create bulk schedules
await MaintenanceScheduleService.createBulkSchedules(
  vehicleIds,
  {
    scheduleName: "Oil Change - Every 5000 miles",
    scheduleType: "preventive",
    priority: "medium",
    recurrence: {
      basedOn: "mileage",
      mileageInterval: 5000,
      mileageTolerance: 500
    },
    serviceDetails: {
      category: "engine",
      estimatedDuration: 60,
      estimatedCost: { min: 40, max: 60, currency: "USD" },
      partsRequired: [
        { name: "Engine Oil (5W-30)", quantity: 5, estimatedCost: 25 },
        { name: "Oil Filter", quantity: 1, estimatedCost: 10 }
      ],
      laborHours: 1
    },
    notifications: {
      enabled: true,
      recipients: [
        { role: "mechanic" },
        { role: "dispatcher" }
      ],
      reminderSchedule: [
        { type: "miles_before", value: 500, channels: ["email", "in_app"] },
        { type: "at_due", value: 0, channels: ["email"] },
        { type: "overdue", value: 0, channels: ["email", "sms"] }
      ]
    },
    compliance: {
      isRegulatory: false
    }
  },
  req.user._id
);
```

### Example 2: Auto-Assign Vehicle to Trip

```javascript
// Trip created, need to assign vehicle
const trip = await Trip.findById(tripId);

// Let system find optimal vehicle
const result = await VehicleAssignmentService.autoAssignVehicle(
  tripId,
  req.user._id,
  {
    prioritizeProximity: true, // Important for quick pickup
    prioritizeCost: false
  }
);

console.log(`Assigned ${result.vehicle.make} ${result.vehicle.model}`);
console.log(`Match Score: ${result.matchScore}/100`);
console.log('Score Breakdown:', result.assignment.matchScores);

// Update trip
trip.assignedVehicle = result.vehicle._id;
await trip.save();
```

### Example 3: Monthly Fleet Performance Report

```javascript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

// Get fleet comparison
const comparison = await VehicleAnalyticsService.getFleetComparison(startDate, endDate);

// Top 5 performers
const topPerformers = comparison.vehicles.slice(0, 5);

// Bottom 5 performers
const bottomPerformers = comparison.vehicles.slice(-5);

// Generate report
console.log('=== MONTHLY FLEET PERFORMANCE REPORT ===\n');

console.log('FLEET AVERAGES:');
console.log(`  Utilization: ${comparison.fleetAverages.utilizationScore.toFixed(1)}%`);
console.log(`  Reliability: ${comparison.fleetAverages.reliabilityScore.toFixed(1)}/100`);
console.log(`  Safety: ${comparison.fleetAverages.safetyScore.toFixed(1)}/100`);
console.log(`  Maintenance: ${comparison.fleetAverages.maintenanceScore.toFixed(1)}/100`);
console.log(`  Cost/Mile: $${comparison.fleetAverages.costPerMile.toFixed(2)}\n`);

console.log('TOP PERFORMERS:');
topPerformers.forEach((v, i) => {
  console.log(`${i+1}. ${v.vehicle.make} ${v.vehicle.model} (${v.vehicle.licensePlate})`);
  console.log(`   Overall Score: ${v.overallScore.toFixed(1)}/100`);
});

console.log('\nNEEDS ATTENTION:');
bottomPerformers.forEach((v, i) => {
  console.log(`${i+1}. ${v.vehicle.make} ${v.vehicle.model} (${v.vehicle.licensePlate})`);
  console.log(`   Overall Score: ${v.overallScore.toFixed(1)}/100`);
  console.log(`   Issues: Utilization ${v.utilizationScore.toFixed(1)}%, Safety ${v.safetyScore.toFixed(1)}`);
});
```

---

## 🎯 Best Practices

### 1. **Maintenance Scheduling**
- Create schedules for **both** mileage and time-based triggers
- Set tolerance windows to account for scheduling flexibility
- Use regulatory flags for DOT/EPA required maintenance
- Enable notifications with multiple channels for critical schedules
- Regularly review performance metrics to optimize schedules

### 2. **Document Management**
- Upload documents as soon as received
- Set expiration dates and enable renewal reminders
- Use appropriate visibility levels to protect sensitive documents
- Maintain version history for important documents
- Tag documents for easy searching

### 3. **Vehicle Assignment**
- Use auto-assignment for routine trips
- Manually review assignments for high-priority or special requirement trips
- Monitor vehicle utilization to balance fleet usage
- Complete pre/post assignment checks to maintain vehicle condition
- Track GPS-verified mileage to detect odometer issues

### 4. **Analytics & Reporting**
- Review downtime analytics monthly to identify problem vehicles
- Monitor fuel efficiency trends to detect mechanical issues
- Use fleet comparison to benchmark vehicle performance
- Track preventive vs reactive maintenance ratio (aim for 80%+ preventive)
- Set up alerts for vehicles falling below performance thresholds

### 5. **Cost Optimization**
- Prioritize preventive maintenance to reduce costly repairs
- Monitor cost per mile trends across fleet
- Use assignment optimization to minimize deadhead miles
- Track fuel efficiency and address vehicles with declining MPG
- Calculate total cost of ownership including depreciation

---

## 📈 Metrics & KPIs

### Fleet Health Indicators
- **Overall Fleet Score**: Weighted average of all vehicles (Target: >75)
- **Utilization Rate**: Active hours / Total hours (Target: 60-75%)
- **Preventive Maintenance Ratio**: Preventive / Total Maintenance (Target: >80%)
- **On-Time Maintenance Rate**: Completed on time / Total (Target: >90%)
- **Mean Time Between Failures**: Days between breakdowns (Target: >30 days)

### Cost Metrics
- **Cost Per Mile**: Total operating cost / Miles (Industry avg: $0.30-0.50)
- **Fuel Cost Per Mile**: Fuel cost / Miles (Target: <$0.20)
- **Maintenance Cost Per Mile**: Maintenance cost / Miles (Target: <$0.15)
- **Downtime Cost**: Lost revenue from vehicle unavailability
- **Cost Trend**: Increasing, stable, or decreasing over time

### Operational Metrics
- **Average Downtime Per Vehicle**: Hours unavailable / Vehicle (Target: <20 hrs/month)
- **Assignment Completion Rate**: Completed / Total assignments (Target: >95%)
- **Document Compliance Rate**: Current documents / Required documents (Target: 100%)
- **GPS Mileage Accuracy**: Discrepancy % (Target: <5%)

---

## 🔒 Security Considerations

1. **Document Access Control**: Sensitive documents (insurance policies, registration) restricted to admin/dispatcher
2. **Audit Logging**: All document access logged with IP and user agent
3. **File Encryption**: Option to encrypt stored documents
4. **Role-Based Permissions**: Assignment creation limited to admin/dispatcher
5. **Data Privacy**: Performance metrics anonymized when shared externally

---

## 🚀 Future Enhancements

### Planned Features
- **Predictive Maintenance**: ML-based failure prediction
- **Telematics Integration**: Real-time vehicle data from OBD-II
- **Mobile App**: Driver-facing maintenance and inspection app
- **Automated Parts Ordering**: Integrate with parts inventory for auto-ordering
- **Warranty Tracking**: Alert when repairs should be warranty claims
- **Vendor Portal**: Allow service providers to update maintenance status
- **Fleet Benchmarking**: Compare against industry standards
- **Cost Forecasting**: Predict future maintenance costs
- **Route Optimization**: Integrate with assignment for route planning
- **Carbon Footprint**: Track and report vehicle emissions

---

## 📝 ActivityLog Actions

All major vehicle management actions are logged:
- `maintenance_schedule_created`
- `bulk_maintenance_schedules_created`
- `maintenance_schedule_completed`
- `maintenance_schedule_rescheduled`
- `maintenance_schedule_deactivated`
- `vehicle_document_uploaded`
- `vehicle_document_archived`
- `vehicle_assignment_created`
- `vehicle_assignment_completed`
- `vehicle_assignment_cancelled`
- `vehicle_replaced`

---

## 📞 Support & Documentation

For questions or issues:
1. Check this comprehensive guide
2. Review API endpoint documentation above
3. Examine example usage scenarios
4. Review service method implementations
5. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Authors**: Transportation MVP Development Team
