# Driver Management System - Comprehensive Documentation

## Overview

The Driver Management System provides a complete lifecycle management solution for drivers, from initial onboarding through ongoing performance tracking, ratings, and compliance management. This system includes mobile app tutorials, performance dashboards, rating/review systems, training modules, certification management, document verification, and emergency contact handling.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Models](#data-models)
3. [Service Layer](#service-layer)
4. [API Endpoints](#api-endpoints)
5. [Driver Onboarding Process](#driver-onboarding-process)
6. [Performance Tracking](#performance-tracking)
7. [Rating & Review System](#rating--review-system)
8. [Integration Guide](#integration-guide)
9. [Mobile App Integration](#mobile-app-integration)
10. [Admin Dashboard Usage](#admin-dashboard-usage)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Driver Management System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Onboarding  │  │ Performance  │  │   Ratings    │          │
│  │   Module     │  │   Tracking   │  │   Reviews    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│                    Service Layer                                 │
│                           │                                      │
│         ┌─────────────────┴──────────────────┐                  │
│         │                                     │                  │
│  ┌──────▼──────┐                    ┌────────▼────────┐         │
│  │  Database   │                    │  External APIs  │         │
│  │  (MongoDB)  │                    │  (Background    │         │
│  │             │                    │   Checks, etc.) │         │
│  └─────────────┘                    └─────────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Database**: MongoDB with Mongoose ODM
- **Backend**: Node.js/Express
- **Authentication**: JWT tokens with role-based access control
- **Real-time Updates**: Socket.io (for live dashboard updates)
- **File Storage**: S3/Local file system for documents
- **Background Jobs**: Cron jobs for scheduled tasks

---

## Data Models

### 1. DriverOnboarding Model

**Purpose**: Manages the complete driver onboarding process including tutorials, training, certifications, documents, and background checks.

**Location**: `backend/models/DriverOnboarding.js`

**Key Features**:
- Interactive mobile tutorial system
- Training module tracking with scoring
- Certification management with expiration tracking
- Document upload and verification workflow
- Background check integration
- Emergency contact management
- Driver handbook acknowledgment
- Preference settings (routes, areas)

**Schema Structure**:

```javascript
{
  onboardingId: String,              // Auto-generated: ONB-{timestamp}-{random}
  driver: ObjectId (ref: User),
  onboardingStatus: String,          // not_started, in_progress, completed, approved, rejected
  onboardingStartedAt: Date,
  onboardingCompletedAt: Date,
  
  // Progress tracking
  completionPercentage: Number,
  totalSteps: Number,
  completedSteps: Number,
  
  // Checklist
  checklist: [{
    itemId: String,
    itemName: String,
    category: String,                 // Tutorial, Documents, Training, etc.
    required: Boolean,
    completed: Boolean,
    completedAt: Date
  }],
  
  // Tutorial
  tutorial: {
    steps: [{
      stepNumber: Number,
      stepId: String,
      stepName: String,
      completed: Boolean,
      completedAt: Date,
      timeSpent: Number,               // seconds
      skipped: Boolean
    }],
    completed: Boolean,
    completedAt: Date,
    totalTimeSpent: Number,
    tutorialVersion: String
  },
  
  // Training modules
  training: {
    modules: [{
      moduleId: String,
      moduleName: String,
      category: String,                 // safety, customer_service, etc.
      status: String,                   // not_started, in_progress, completed, failed
      startedAt: Date,
      completedAt: Date,
      score: Number,
      passingScore: Number,
      attempts: Number,
      maxAttempts: Number,
      certificateIssued: Boolean,
      certificateId: String
    }],
    modulesTotal: Number,
    modulesCompleted: Number,
    lastActivityAt: Date
  },
  
  // Certifications
  certifications: [{
    certificationId: String,
    certificationType: String,         // drivers_license, cdl, medical, etc.
    certificationNumber: String,
    issuingAuthority: String,
    issueDate: Date,
    expirationDate: Date,
    status: String,                    // active, expired, suspended, revoked
    verifiedBy: ObjectId,
    verifiedAt: Date,
    documents: [String]                // URLs to cert documents
  }],
  
  // Documents
  documents: [{
    documentId: String,
    documentType: String,              // drivers_license, insurance, etc.
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: Date,
    status: String,                    // pending, verified, rejected
    verifiedBy: ObjectId,
    verifiedAt: Date,
    rejectionReason: String,
    expirationDate: Date
  }],
  
  // Background check
  backgroundCheck: {
    status: String,                    // not_started, in_progress, completed, failed
    provider: String,
    requestId: String,
    initiatedAt: Date,
    completedAt: Date,
    result: String,                    // clear, pending_review, flags_found
    reportUrl: String,
    notes: String
  },
  
  // Emergency contacts
  emergencyContacts: [{
    contactId: String,
    name: String,
    relationship: String,
    phoneNumber: String,
    alternatePhone: String,
    email: String,
    isPrimary: Boolean
  }],
  
  // Handbook acknowledgment
  handbookAcknowledgment: {
    acknowledged: Boolean,
    acknowledgedAt: Date,
    version: String,
    ipAddress: String,
    signature: String
  },
  
  // Preferences
  preferences: {
    preferredRoutes: [String],
    preferredAreas: [String],
    avoidAreas: [String],
    maxDistance: Number,
    workingHours: {
      start: String,
      end: String
    }
  },
  
  // Approval
  approval: {
    status: String,                    // pending, approved, rejected
    approvedBy: ObjectId,
    approvedAt: Date,
    rejectionReason: String,
    notes: String
  }
}
```

**Key Methods**:

```javascript
// Add certification
onboarding.addCertification(certificationData)

// Add document
onboarding.addDocument(documentData)

// Verify document
onboarding.verifyDocument(documentId, verifiedBy)

// Reject document
onboarding.rejectDocument(documentId, reason, rejectedBy)

// Initiate background check
onboarding.initiateBackgroundCheck(provider, requestId)

// Complete background check
onboarding.completeBackgroundCheck(result, reportUrl)

// Add emergency contact
onboarding.addEmergencyContact(contactData)

// Acknowledge handbook
onboarding.acknowledgeHandbook(version, ipAddress, signature)

// Approve onboarding
onboarding.approve(approvedBy, notes)

// Reject onboarding
onboarding.reject(rejectedBy, reason)
```

---

### 2. DriverPerformance Model

**Purpose**: Tracks comprehensive performance metrics, analytics, trends, goals, and achievements for drivers.

**Location**: `backend/models/DriverPerformance.js`

**Key Features**:
- Real-time performance metrics across 6 categories
- Daily, weekly, monthly trend analysis
- Goal setting and achievement tracking
- Fleet-wide ranking and comparison
- Automated performance alerts
- Gamification with badges and achievements

**Schema Structure**:

```javascript
{
  driver: ObjectId (ref: User),
  period: String,                      // all_time, monthly, weekly, daily
  
  // Trip performance
  trips: {
    total: Number,
    completed: Number,
    cancelled: Number,
    cancelledByDriver: Number,
    cancelledByPassenger: Number,
    noShow: Number,
    onTimePercentage: Number,
    averageDuration: Number,           // minutes
    longestTrip: Number,
    shortestTrip: Number
  },
  
  // Rating metrics
  ratings: {
    overall: Number,                   // 1-5
    totalRatings: Number,
    communication: Number,
    professionalism: Number,
    safety: Number,
    navigation: Number,
    vehicleCondition: Number,
    fiveStarCount: Number,
    fourStarCount: Number,
    threeStarCount: Number,
    twoStarCount: Number,
    oneStarCount: Number
  },
  
  // Safety metrics
  safety: {
    totalIncidents: Number,
    accidents: Number,
    trafficViolations: Number,
    customerComplaints: Number,
    speedingIncidents: Number,
    harshBrakingCount: Number,
    safeDrivingScore: Number,          // 0-100
    lastIncidentDate: Date,
    daysWithoutIncident: Number
  },
  
  // Efficiency metrics
  efficiency: {
    acceptanceRate: Number,            // %
    completionRate: Number,            // %
    averageTripTime: Number,
    averageWaitTime: Number,
    idleTimePercentage: Number,
    utilizationRate: Number,
    onTimePickupRate: Number,
    onTimeDropoffRate: Number
  },
  
  // Financial performance
  financial: {
    totalEarnings: Number,
    averageEarningsPerTrip: Number,
    averageEarningsPerHour: Number,
    tips: Number,
    bonuses: Number,
    penalties: Number,
    deductions: Number,
    netEarnings: Number
  },
  
  // Customer satisfaction
  customerSatisfaction: {
    positiveFeedbackPercentage: Number,
    complaintCount: Number,
    complimentCount: Number,
    repeatPassengerRate: Number,
    referralCount: Number
  },
  
  // Trend analysis
  trends: {
    daily: [{
      date: Date,
      trips: Number,
      earnings: Number,
      rating: Number,
      onTimeRate: Number
    }],
    weekly: [{
      weekStart: Date,
      trips: Number,
      earnings: Number,
      rating: Number,
      onTimeRate: Number
    }],
    monthly: [{
      monthStart: Date,
      trips: Number,
      earnings: Number,
      rating: Number,
      onTimeRate: Number
    }]
  },
  
  // Goals
  goals: [{
    metric: String,                    // trips, rating, earnings, etc.
    target: Number,
    deadline: Date,
    achieved: Boolean,
    achievedAt: Date,
    reward: String
  }],
  
  // Achievements
  achievements: [{
    type: String,                      // 100_trips, 5_star_month, etc.
    unlockedAt: Date,
    description: String,
    icon: String,
    displayOnProfile: Boolean
  }],
  
  // Fleet ranking
  ranking: {
    overallRank: Number,
    totalDrivers: Number,
    regionalRank: Number,
    regionalDrivers: Number,
    percentile: Number,
    category: String                   // platinum, gold, silver, bronze
  },
  
  // Performance alerts
  alerts: [{
    type: String,                      // low_rating, high_cancellation, etc.
    severity: String,                  // info, warning, critical
    message: String,
    createdAt: Date,
    acknowledged: Boolean,
    resolved: Boolean
  }],
  
  lastUpdated: Date
}
```

**Key Methods**:

```javascript
// Update metrics after trip
performance.updateMetrics(tripData)

// Calculate trends
performance.calculateTrends()

// Check goal progress
performance.checkGoalProgress()

// Add achievement
performance.addAchievement(achievementType)

// Generate insights
performance.generateInsights()

// Compare with fleet
performance.compareWithFleet()
```

---

### 3. DriverRating Model

**Purpose**: Manages driver ratings, reviews, moderation, and analytics with multi-dimensional rating system.

**Location**: `backend/models/DriverRating.js`

**Key Features**:
- Multi-dimensional ratings (6 categories)
- Text reviews with predefined tags
- Photo evidence support
- Driver response capability
- Community helpful voting
- Spam/fake detection
- Moderation workflow
- Real-time analytics aggregation

**Schema Structure**:

```javascript
{
  ratingId: String,                    // Auto-generated: RAT-{timestamp}-{random}
  
  // References
  driver: ObjectId (ref: User),
  trip: ObjectId (ref: Trip),
  passenger: ObjectId (ref: User),
  
  // Multi-dimensional ratings (1-5)
  ratings: {
    overall: Number,                   // Weighted average
    communication: Number,
    professionalism: Number,
    safety: Number,
    vehicleCondition: Number,
    navigation: Number,
    punctuality: Number
  },
  
  // Rating weights
  ratingWeights: {
    communication: 0.15,
    professionalism: 0.20,
    safety: 0.25,                      // Highest priority
    vehicleCondition: 0.15,
    navigation: 0.15,
    punctuality: 0.10
  },
  
  // Review content
  review: {
    text: String,
    maxLength: 500,
    tags: [String],                    // friendly, professional, etc.
    photos: [String]                   // Evidence photo URLs
  },
  
  // Driver response
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: ObjectId
  },
  
  // Verification
  verified: Boolean,
  verificationMethod: String,          // trip_completed, photo_proof, etc.
  isFake: Boolean,
  isSpam: Boolean,
  
  // Moderation
  status: String,                      // pending, approved, rejected, flagged
  moderationStatus: {
    reviewedBy: ObjectId,
    reviewedAt: Date,
    flagReason: String,                // inappropriate, spam, fake, etc.
    moderatorNotes: String
  },
  
  // Community engagement
  helpfulCount: Number,
  helpfulVotes: [{
    user: ObjectId,
    votedAt: Date
  }],
  
  // Analytics aggregation
  analytics: {
    countByStars: {
      5: Number,
      4: Number,
      3: Number,
      2: Number,
      1: Number
    },
    averageRatings: {
      overall: Number,
      communication: Number,
      professionalism: Number,
      safety: Number,
      vehicleCondition: Number,
      navigation: Number,
      punctuality: Number
    },
    totalReviews: Number,
    verifiedReviews: Number,
    responseRate: Number,
    recentRatings: {
      last7Days: Number,
      last30Days: Number,
      last90Days: Number
    }
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:

```javascript
// Calculate overall rating (weighted average)
rating.calculateOverallRating()

// Flag for moderation
rating.flagForReview(reason, userId)

// Driver responds
rating.respond(text, driverId)

// Mark as helpful
rating.markHelpful(userId)

// Update analytics
rating.updateAnalytics()

// Check display eligibility
rating.isEligibleForDisplay()
```

---

## Service Layer

### 1. DriverOnboardingService

**Location**: `backend/services/driverOnboardingService.js`

**Purpose**: Manages all driver onboarding operations including tutorial completion, training, certifications, documents, and approvals.

**Key Functions**:

#### Initialize Onboarding
```javascript
await driverOnboardingService.initializeOnboarding(driverId, onboardingData)
```
Creates default checklist and training modules for new driver.

#### Complete Tutorial Step
```javascript
await driverOnboardingService.completeTutorialStep(driverId, stepData)
```
Marks tutorial step as complete, tracks time spent.

#### Update Training Module
```javascript
await driverOnboardingService.updateTrainingModule(driverId, moduleId, updateData)
```
Updates training module status, score, and completion.

#### Add Certification
```javascript
await driverOnboardingService.addCertification(driverId, certData)
```
Adds driver certification with expiration tracking.

#### Upload Document
```javascript
await driverOnboardingService.uploadDocument(driverId, documentData, fileInfo)
```
Handles document upload and updates checklist.

#### Verify Document
```javascript
await driverOnboardingService.verifyDocument(driverId, documentId, verifiedBy, approved, rejectionReason)
```
Approves or rejects uploaded document.

#### Initiate Background Check
```javascript
await driverOnboardingService.initiateBackgroundCheck(driverId, provider, initiatedBy)
```
Starts background check with external provider.

#### Complete Background Check
```javascript
await driverOnboardingService.completeBackgroundCheck(driverId, result, reportUrl, completedBy)
```
Records background check results.

#### Approve Onboarding
```javascript
await driverOnboardingService.approveOnboarding(driverId, approvedBy, notes)
```
Approves driver onboarding (checks all required items completed).

#### Get Expiring Certifications
```javascript
await driverOnboardingService.getExpiringCertifications(daysAhead)
```
Returns list of certifications expiring within specified days.

---

### 2. DriverPerformanceService

**Location**: `backend/services/driverPerformanceService.js`

**Purpose**: Manages driver performance metrics, analytics, trends, and insights.

**Key Functions**:

#### Update After Trip
```javascript
await driverPerformanceService.updateAfterTrip(tripId)
```
Updates all performance metrics after trip completion.

#### Update After Rating
```javascript
await driverPerformanceService.updateAfterRating(ratingId)
```
Updates rating metrics and checks for performance alerts.

#### Update Daily Trend
```javascript
await driverPerformanceService.updateDailyTrend(driverId, trip)
```
Records daily performance data for trend analysis.

#### Check Performance Alerts
```javascript
await driverPerformanceService.checkPerformanceAlerts(driverId)
```
Evaluates performance and creates alerts for issues.

#### Add Achievement
```javascript
await driverPerformanceService.addAchievement(driverId, achievementType)
```
Unlocks achievement badge for driver.

#### Set Goal
```javascript
await driverPerformanceService.setGoal(driverId, goalData)
```
Creates performance goal with target and deadline.

#### Calculate Fleet Ranking
```javascript
await driverPerformanceService.calculateFleetRanking(driverId)
```
Determines driver's rank and percentile in fleet.

#### Get Dashboard Data
```javascript
await driverPerformanceService.getDashboardData(driverId)
```
Returns comprehensive dashboard data for driver.

#### Compare With Fleet
```javascript
await driverPerformanceService.compareWithFleet(driverId)
```
Compares driver metrics with fleet averages.

---

### 3. DriverRatingService

**Location**: `backend/services/driverRatingService.js`

**Purpose**: Manages driver ratings, reviews, moderation, and analytics.

**Key Functions**:

#### Create Rating
```javascript
await driverRatingService.createRating(ratingData, passengerId)
```
Creates new rating for completed trip.

#### Respond To Review
```javascript
await driverRatingService.respondToReview(ratingId, driverId, responseText)
```
Allows driver to respond to review.

#### Mark Helpful
```javascript
await driverRatingService.markHelpful(ratingId, userId)
```
Marks review as helpful (community voting).

#### Flag Review
```javascript
await driverRatingService.flagReview(ratingId, reason, userId)
```
Flags review for moderation.

#### Moderate Review
```javascript
await driverRatingService.moderateReview(ratingId, moderatorId, approved, moderatorNotes)
```
Approves or rejects flagged review.

#### Detect Spam
```javascript
await driverRatingService.detectSpam(ratingId)
```
Automatically detects spam/fake reviews.

#### Get Driver Rating Summary
```javascript
await driverRatingService.getDriverRatingSummary(driverId)
```
Returns comprehensive rating statistics for driver.

#### Get Reviews
```javascript
await driverRatingService.getReviews(driverId, filters)
```
Returns paginated reviews with filters.

#### Get Pending Reviews
```javascript
await driverRatingService.getPendingReviews(page, limit)
```
Returns reviews awaiting moderation.

#### Get Fleet Rating Analytics
```javascript
await driverRatingService.getFleetRatingAnalytics()
```
Returns fleet-wide rating statistics.

---

## API Endpoints

### Onboarding Endpoints

```
POST   /api/driver-management/onboarding/initialize
GET    /api/driver-management/onboarding/:driverId
PUT    /api/driver-management/onboarding/tutorial/complete-step
PUT    /api/driver-management/onboarding/training/:moduleId
POST   /api/driver-management/onboarding/certifications
POST   /api/driver-management/onboarding/documents/upload
PUT    /api/driver-management/onboarding/documents/:documentId/verify
POST   /api/driver-management/onboarding/background-check/initiate
PUT    /api/driver-management/onboarding/background-check/complete
POST   /api/driver-management/onboarding/emergency-contacts
PUT    /api/driver-management/onboarding/handbook/acknowledge
PUT    /api/driver-management/onboarding/preferences
PUT    /api/driver-management/onboarding/approve
GET    /api/driver-management/onboarding/certifications/expiring
GET    /api/driver-management/onboarding/statistics
```

### Performance Endpoints

```
GET    /api/driver-management/performance/:driverId
GET    /api/driver-management/performance/:driverId/dashboard
PUT    /api/driver-management/performance/alerts/:alertId/acknowledge
PUT    /api/driver-management/performance/alerts/:alertId/resolve
POST   /api/driver-management/performance/goals
GET    /api/driver-management/performance/:driverId/compare-fleet
PUT    /api/driver-management/performance/:driverId/ranking
```

### Rating Endpoints

```
POST   /api/driver-management/ratings
GET    /api/driver-management/ratings/:driverId
GET    /api/driver-management/ratings/:driverId/summary
PUT    /api/driver-management/ratings/:ratingId/respond
PUT    /api/driver-management/ratings/:ratingId/helpful
PUT    /api/driver-management/ratings/:ratingId/flag
PUT    /api/driver-management/ratings/:ratingId/moderate
GET    /api/driver-management/ratings/moderation/pending
POST   /api/driver-management/ratings/moderation/bulk-approve
GET    /api/driver-management/ratings/analytics/fleet
```

### Combined Endpoints

```
GET    /api/driver-management/profile/:driverId
GET    /api/driver-management/leaderboard
```

---

## Driver Onboarding Process

### Complete Onboarding Workflow

```
1. Initialize Onboarding (Admin/Manager)
   ↓
2. Driver Completes Mobile Tutorial
   ↓
3. Driver Uploads Required Documents
   - Driver's License
   - Insurance Certificate
   - Vehicle Registration
   ↓
4. Admin Verifies Documents
   ↓
5. Initiate Background Check
   ↓
6. Driver Completes Training Modules
   - Safety Fundamentals
   - Customer Service
   - Vehicle Operation
   - Compliance
   - Emergency Procedures
   ↓
7. Driver Adds Emergency Contacts
   ↓
8. Driver Acknowledges Handbook
   ↓
9. Driver Sets Preferences
   ↓
10. Background Check Completes
    ↓
11. Admin Reviews & Approves
    ↓
12. Driver Status: Active
```

### Tutorial System

The mobile app tutorial is interactive and includes:

1. **Welcome Video** (2-3 minutes)
   - Company introduction
   - Platform overview
   - Key features

2. **Navigation Training** (5 minutes)
   - How to use the driver app
   - Accepting/declining trips
   - Navigation features
   - GPS tracking

3. **Trip Management** (5 minutes)
   - Starting a trip
   - Updating trip status
   - Completing trips
   - Handling issues

4. **Customer Service** (3 minutes)
   - Professional behavior
   - Communication tips
   - Handling difficult passengers

5. **Safety & Compliance** (5 minutes)
   - Safety guidelines
   - Emergency procedures
   - Compliance requirements

6. **Earnings & Payments** (3 minutes)
   - How payments work
   - Viewing earnings
   - Bonuses and incentives

### Training Modules

Each module includes:
- Video lessons
- Interactive quizzes
- Passing score requirement (80-90%)
- Certificate upon completion
- Retake option if failed

### Document Requirements

Required documents:
- Driver's License (valid, not expired)
- Vehicle Insurance Certificate
- Vehicle Registration
- Medical Certificate (if required)
- Background Check Authorization

Optional documents:
- CDL (if applicable)
- Additional certifications
- Professional references

---

## Performance Tracking

### Performance Metrics Categories

#### 1. Trip Performance
- Total trips
- Completed vs cancelled
- On-time percentage
- Average trip duration

#### 2. Rating Performance
- Overall rating (1-5)
- Category ratings
- Star distribution
- Rating trends

#### 3. Safety Performance
- Incident count
- Accidents
- Traffic violations
- Safe driving score (0-100)
- Days without incident

#### 4. Efficiency Performance
- Acceptance rate
- Completion rate
- Idle time percentage
- On-time pickup/dropoff rates

#### 5. Financial Performance
- Total earnings
- Average per trip
- Tips and bonuses
- Net earnings

#### 6. Customer Satisfaction
- Positive feedback percentage
- Complaint count
- Compliment count
- Repeat passenger rate

### Performance Dashboard

The driver dashboard displays:

**Summary Cards**:
- Total trips completed
- Current rating
- Total earnings
- Safe driving score

**Recent Trends**:
- Last 7 days performance
- Last 30 days comparison
- Month-over-month growth

**Active Goals**:
- Goal progress bars
- Days remaining
- Potential rewards

**Recent Achievements**:
- Unlocked badges
- Milestone celebrations

**Active Alerts**:
- Performance warnings
- Action items
- Improvement suggestions

**Fleet Ranking**:
- Current rank
- Percentile
- Category (platinum/gold/silver/bronze)

### Automated Performance Alerts

Alerts are automatically created for:

1. **Low Rating** (< 3.5)
   - Severity: Warning (< 3.5), Critical (< 3.0)
   - Message: Review customer feedback

2. **High Cancellation Rate** (> 10%)
   - Severity: Warning (> 10%), Critical (> 20%)
   - Message: Reduce cancellations

3. **Safety Concerns** (< 70 safety score)
   - Severity: Warning (< 70), Critical (< 50)
   - Message: Review safety guidelines

4. **Low Efficiency** (< 80% completion)
   - Severity: Info (< 80%), Warning (< 70%)
   - Message: Improve completion rate

### Goals & Achievements

**Predefined Achievements**:
- 100 Trips Milestone
- 500 Trips Milestone
- 1,000 Trips Milestone
- 5-Star Month
- Safety Champion (6 months perfect record)
- Top Rated (top 10% in fleet)

**Custom Goals**:
Drivers and admins can set custom goals:
- Metric: trips, rating, earnings, safety score, etc.
- Target value
- Deadline
- Reward

---

## Rating & Review System

### Multi-Dimensional Rating

Passengers rate drivers on 6 dimensions:

1. **Safety** (25% weight) - Highest priority
   - Safe driving practices
   - Following traffic rules
   - Vehicle maintenance

2. **Professionalism** (20% weight)
   - Professional behavior
   - Appearance
   - Courtesy

3. **Communication** (15% weight)
   - Clear communication
   - Responsiveness
   - Friendliness

4. **Vehicle Condition** (15% weight)
   - Cleanliness
   - Comfort
   - Functionality

5. **Navigation** (15% weight)
   - Route efficiency
   - GPS usage
   - Local knowledge

6. **Punctuality** (10% weight)
   - On-time pickup
   - On-time dropoff
   - Timeliness

**Overall Rating**: Weighted average of all categories

### Review Features

**Text Review**:
- Max 500 characters
- Optional but encouraged

**Predefined Tags**:
- Positive: friendly, professional, safe_driver, clean_vehicle, on_time, helpful, courteous, excellent_service
- Negative: needs_improvement, unprofessional, late, rude

**Photo Evidence**:
- Passengers can attach photos
- Used for verification
- Reviewed during moderation

### Driver Response

Drivers can respond to reviews:
- One response per review
- Professional tone encouraged
- Visible to all users
- Cannot be edited after posting

### Community Helpful Voting

Users can vote reviews as helpful:
- One vote per user
- Helps surface quality reviews
- Influences review order

### Moderation Workflow

**Automatic Moderation**:
- High ratings (4-5 stars) + verified → Auto-approved
- Spam detection → Auto-flagged

**Manual Moderation**:
1. Review flagged (by user or system)
2. Moderator reviews content
3. Approve, reject, or request changes
4. Add moderator notes
5. Notify involved parties

**Spam Detection**:
- Short reviews with extreme ratings
- All caps text
- Repeated characters
- Spam keywords
- Excessive reviews in short period

### Rating Analytics

**Driver Summary**:
- Total ratings count
- Average overall rating
- Star distribution (1-5)
- Category averages
- Response rate
- Verified percentage

**Trend Analysis**:
- Last 7/30/90 days averages
- Direction (improving/declining/stable)
- Month-over-month comparison

**Fleet Analytics**:
- Fleet average rating
- Top performers
- Bottom performers
- Category benchmarks

---

## Integration Guide

### 1. Trip Completion Integration

When a trip is completed, update driver performance:

```javascript
// In trip completion handler
import driverPerformanceService from './services/driverPerformanceService.js';

// After trip status updated to 'completed'
await driverPerformanceService.updateAfterTrip(tripId);
```

### 2. Rating Submission Integration

When a passenger submits a rating:

```javascript
// In rating submission handler
import driverRatingService from './services/driverRatingService.js';

const result = await driverRatingService.createRating({
  trip: tripId,
  ratings: {
    communication: 5,
    professionalism: 5,
    safety: 5,
    vehicleCondition: 4,
    navigation: 5,
    punctuality: 5
  },
  review: {
    text: 'Great driver!',
    tags: ['friendly', 'professional', 'safe_driver']
  }
}, passengerId);

if (result.success) {
  // Rating created, performance automatically updated
  // Send notification to driver
}
```

### 3. Document Upload Integration

For document uploads with file handling:

```javascript
// Using multer or similar
import multer from 'multer';
import driverOnboardingService from './services/driverOnboardingService.js';

const upload = multer({ dest: 'uploads/' });

app.post('/upload-document', upload.single('document'), async (req, res) => {
  const fileInfo = {
    filename: req.file.originalname,
    path: req.file.path, // Or S3 URL
    size: req.file.size
  };
  
  await driverOnboardingService.uploadDocument(
    req.user._id,
    {
      documentType: req.body.documentType,
      expirationDate: req.body.expirationDate
    },
    fileInfo
  );
});
```

### 4. Background Check Webhook

For external background check provider webhooks:

```javascript
// Webhook endpoint
app.post('/webhooks/background-check', async (req, res) => {
  const { requestId, result, reportUrl } = req.body;
  
  // Find driver by requestId
  const onboarding = await DriverOnboarding.findOne({
    'backgroundCheck.requestId': requestId
  });
  
  if (onboarding) {
    await driverOnboardingService.completeBackgroundCheck(
      onboarding.driver,
      result,
      reportUrl,
      'system'
    );
  }
  
  res.json({ success: true });
});
```

### 5. Real-time Dashboard Updates

Using Socket.io for live updates:

```javascript
// When performance metrics update
io.to(`driver-${driverId}`).emit('performance-update', {
  rating: performance.ratings.overall,
  trips: performance.trips.completed,
  earnings: performance.financial.totalEarnings
});

// When new rating received
io.to(`driver-${driverId}`).emit('new-rating', {
  overall: rating.ratings.overall,
  review: rating.review?.text
});
```

---

## Mobile App Integration

### Tutorial Implementation

**Mobile App Flow**:

```javascript
// 1. Start tutorial
const response = await fetch('/api/driver-management/onboarding/tutorial/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Complete each step
await fetch('/api/driver-management/onboarding/tutorial/complete-step', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stepId: 'welcome-video',
    stepNumber: 1,
    timeSpent: 180 // seconds
  })
});

// 3. Check progress
const progress = await fetch('/api/driver-management/onboarding/:driverId');
console.log(`Tutorial ${progress.tutorial.completionPercentage}% complete`);
```

### Performance Dashboard

**Mobile Dashboard Components**:

```javascript
// Fetch dashboard data
const dashboard = await fetch('/api/driver-management/performance/:driverId/dashboard');

// Display components
<PerformanceCards summary={dashboard.summary} />
<TrendCharts trends={dashboard.trends} />
<GoalProgress goals={dashboard.activeGoals} />
<AchievementBadges achievements={dashboard.recentAchievements} />
<AlertsList alerts={dashboard.alerts} />
<FleetRanking ranking={dashboard.ranking} />
```

### Rating Display

**Show Driver Ratings**:

```javascript
// Get rating summary
const ratings = await fetch('/api/driver-management/ratings/:driverId/summary');

<RatingSummary 
  average={ratings.averageRating}
  total={ratings.totalRatings}
  distribution={ratings.distribution}
  categoryAverages={ratings.categoryAverages}
/>

// Get recent reviews
const reviews = await fetch('/api/driver-management/ratings/:driverId?page=1&limit=10');

<ReviewList reviews={reviews.data.reviews} />
```

### Document Upload from Mobile

```javascript
// Using React Native or similar
import DocumentPicker from 'react-native-document-picker';

const uploadDocument = async () => {
  const doc = await DocumentPicker.pick({
    type: [DocumentPicker.types.pdf, DocumentPicker.types.images]
  });
  
  const formData = new FormData();
  formData.append('document', {
    uri: doc.uri,
    type: doc.type,
    name: doc.name
  });
  formData.append('documentType', 'drivers_license');
  
  await fetch('/api/driver-management/onboarding/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
};
```

---

## Admin Dashboard Usage

### Onboarding Management

**View All Onboardings**:
```javascript
// Get statistics
const stats = await fetch('/api/driver-management/onboarding/statistics');

// Display overview
<OnboardingStats 
  total={stats.total}
  byStatus={stats.byStatus}
  averageCompletion={stats.averageCompletionPercentage}
  pendingApproval={stats.pendingApproval}
/>
```

**Approve/Reject Driver**:
```javascript
// Approve
await fetch('/api/driver-management/onboarding/approve', {
  method: 'PUT',
  body: JSON.stringify({
    driverId: '...',
    notes: 'All requirements met'
  })
});

// If incomplete
// Response: { success: false, incompleteItems: [...] }
```

### Performance Monitoring

**Fleet Overview**:
```javascript
// Get leaderboard
const leaders = await fetch('/api/driver-management/leaderboard?metric=rating&limit=10');

<Leaderboard drivers={leaders.data} />

// Compare drivers
const comparison = await fetch('/api/driver-management/performance/:driverId/compare-fleet');

<FleetComparison 
  driver={comparison.driver}
  fleetAverage={comparison.fleetAverage}
  differences={comparison.comparison}
/>
```

**Alert Management**:
```javascript
// View all drivers with active alerts
const performances = await DriverPerformance.find({
  'alerts.resolved': false
}).populate('driver');

// Resolve alert
await fetch('/api/driver-management/performance/alerts/:alertId/resolve', {
  method: 'PUT',
  body: JSON.stringify({ driverId })
});
```

### Rating Moderation

**Pending Reviews Queue**:
```javascript
// Get pending reviews
const pending = await fetch('/api/driver-management/ratings/moderation/pending?page=1');

<ModerationQueue reviews={pending.data.reviews} />

// Moderate individual review
await fetch('/api/driver-management/ratings/:ratingId/moderate', {
  method: 'PUT',
  body: JSON.stringify({
    approved: true,
    moderatorNotes: 'Verified legitimate review'
  })
});

// Bulk approve
await fetch('/api/driver-management/ratings/moderation/bulk-approve', {
  method: 'POST',
  body: JSON.stringify({
    ratingIds: ['...', '...', '...']
  })
});
```

**Fleet Rating Analytics**:
```javascript
const analytics = await fetch('/api/driver-management/ratings/analytics/fleet');

<FleetRatingAnalytics 
  average={analytics.averageRating}
  distribution={analytics.distribution}
  topDrivers={analytics.topDrivers}
  bottomDrivers={analytics.bottomDrivers}
  trends={analytics.trends}
/>
```

---

## Scheduled Tasks

### Daily Tasks

**Run via cron job**:

```javascript
// Update all driver rankings daily
import cron from 'node-cron';
import driverPerformanceService from './services/driverPerformanceService.js';

// Every day at midnight
cron.schedule('0 0 * * *', async () => {
  const performances = await DriverPerformance.find({ period: 'all_time' });
  
  for (const perf of performances) {
    await driverPerformanceService.calculateFleetRanking(perf.driver);
  }
});

// Auto-approve verified high ratings
cron.schedule('0 */6 * * *', async () => { // Every 6 hours
  await driverRatingService.autoApproveHighRatings();
});

// Check expiring certifications
cron.schedule('0 8 * * *', async () => { // Every day at 8am
  const expiring = await driverOnboardingService.getExpiringCertifications(30);
  
  // Send notifications to drivers
  expiring.forEach(item => {
    sendNotification(item.driver, {
      title: 'Certification Expiring Soon',
      message: `Your ${item.certification.certificationType} expires in ${item.daysUntilExpiration} days`
    });
  });
});
```

---

## Testing Guide

### Test Data Creation

```javascript
// Create test driver onboarding
const testOnboarding = await driverOnboardingService.initializeOnboarding(testDriverId, {
  onboardingStatus: 'in_progress'
});

// Complete some steps
await driverOnboardingService.completeTutorialStep(testDriverId, {
  stepId: 'welcome-video',
  stepNumber: 1,
  timeSpent: 180
});

// Add test certification
await driverOnboardingService.addCertification(testDriverId, {
  certificationType: 'drivers_license',
  certificationNumber: 'DL123456',
  issuingAuthority: 'DMV',
  issueDate: new Date('2020-01-01'),
  expirationDate: new Date('2025-01-01')
});

// Create test performance data
const testPerformance = await driverPerformanceService.initializePerformance(testDriverId);

// Simulate trips
for (let i = 0; i < 50; i++) {
  await driverPerformanceService.updateAfterTrip(testTripId);
}

// Create test ratings
for (let i = 0; i < 20; i++) {
  await driverRatingService.createRating({
    trip: testTripId,
    ratings: {
      overall: Math.random() * 2 + 3, // 3-5 stars
      communication: Math.random() * 2 + 3,
      professionalism: Math.random() * 2 + 3,
      safety: Math.random() * 2 + 3,
      vehicleCondition: Math.random() * 2 + 3,
      navigation: Math.random() * 2 + 3,
      punctuality: Math.random() * 2 + 3
    },
    review: {
      text: 'Great driver!',
      tags: ['friendly', 'professional']
    }
  }, testPassengerId);
}
```

---

## Security Considerations

### Authorization Rules

- **Drivers**: Can view/edit own data only
- **Passengers**: Can create ratings for their trips only
- **Dispatchers**: Can view all driver data (read-only)
- **Managers**: Can view/edit all data, approve onboardings
- **Admins**: Full access to all operations

### Data Privacy

- Passenger information anonymized in reviews
- Sensitive documents encrypted at rest
- Background check reports restricted to authorized personnel
- Personal data complies with GDPR/privacy regulations

### Rate Limiting

- Rating submissions limited to prevent abuse
- Helpful votes limited per user
- Document uploads size-limited

---

## Performance Optimization

### Database Indexes

```javascript
// DriverOnboarding
{ driver: 1, onboardingStatus: 1 }
{ 'certifications.expirationDate': 1 }
{ 'documents.status': 1 }

// DriverPerformance
{ driver: 1, period: 1 }
{ 'ratings.overall': -1 }
{ 'safety.safeDrivingScore': -1 }

// DriverRating
{ driver: 1, createdAt: -1 }
{ trip: 1 }
{ status: 1 }
{ 'ratings.overall': -1 }
```

### Caching Strategy

- Cache driver rating summaries (5 min TTL)
- Cache fleet analytics (15 min TTL)
- Cache leaderboards (10 min TTL)
- Invalidate on new rating/performance update

### Batch Operations

- Bulk approve reviews
- Batch ranking calculations
- Aggregated analytics queries

---

## Future Enhancements

### Planned Features

1. **AI-Powered Insights**
   - Personalized improvement recommendations
   - Predictive performance alerts
   - Automated coaching suggestions

2. **Advanced Analytics**
   - Seasonal performance trends
   - Route efficiency analysis
   - Passenger retention metrics

3. **Gamification Expansion**
   - Driver challenges
   - Team competitions
   - Seasonal leaderboards
   - Reward marketplace

4. **Training Enhancements**
   - VR training modules
   - Live coaching sessions
   - Peer mentoring program

5. **Integration Expansion**
   - Third-party learning platforms
   - Insurance provider APIs
   - Advanced background check services
   - Biometric verification

---

## Support & Troubleshooting

### Common Issues

**Issue**: Onboarding stuck at certain percentage
- **Solution**: Check incomplete required checklist items
- **API**: GET `/api/driver-management/onboarding/:driverId`

**Issue**: Performance metrics not updating
- **Solution**: Ensure trip completion triggers performance update
- **Check**: Trip status is 'completed'

**Issue**: Ratings not appearing
- **Solution**: Check moderation status (pending reviews not shown)
- **API**: GET `/api/driver-management/ratings/moderation/pending`

**Issue**: Certifications not expiring properly
- **Solution**: Run expiring certifications check manually
- **API**: GET `/api/driver-management/onboarding/certifications/expiring?days=30`

### Monitoring

Key metrics to monitor:
- Average onboarding completion time
- Document verification turnaround time
- Rating moderation queue size
- Performance alert resolution rate
- Background check completion time

---

## Changelog

### Version 1.0.0 (Current)

**Features**:
- Complete onboarding system
- Performance tracking with 6 metric categories
- Multi-dimensional rating system
- Training module management
- Certification tracking
- Document verification
- Background check integration
- Emergency contact management
- Goal setting and achievements
- Fleet ranking and comparison
- Automated performance alerts
- Review moderation workflow

---

## API Reference Summary

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
```javascript
{
  success: true,
  data: { ... },
  message: "Optional message"
}
```

### Error Format
```javascript
{
  success: false,
  message: "Error description"
}
```

### Pagination
```javascript
{
  success: true,
  data: {
    items: [...],
    pagination: {
      total: 100,
      page: 1,
      limit: 20,
      pages: 5
    }
  }
}
```

---

## Contact & Resources

**Documentation**: This file
**API Postman Collection**: Available on request
**Support Email**: support@example.com
**Developer Portal**: https://developer.example.com

---

*Last Updated: 2024*
*Version: 1.0.0*
