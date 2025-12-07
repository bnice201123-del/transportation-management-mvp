# Trip Status Reversion Feature

## Overview
Complete implementation of trip status reversion capability allowing authorized users to un-complete or un-cancel trips that were marked incorrectly.

## Implementation Date
December 2024

## Feature Description
Users with appropriate permissions (dispatcher, scheduler, admin) can now revert trip status changes when trips are marked as COMPLETED or CANCELLED by mistake. The system intelligently determines the appropriate prior status based on the trip's state and history.

## Backend Implementation

### 1. Database Schema Changes

#### Trip Model (`backend/models/Trip.js`)
Added `statusHistory` array field to track all status changes:
```javascript
statusHistory: [{
  status: String (enum: pending, assigned, in_progress, completed, cancelled),
  changedBy: ObjectId (ref User),
  changedAt: Date (default: Date.now),
  reason: String,
  metadata: Mixed
}]
```

### 2. Activity Logging Enhancement

#### ActivityLog Model (`backend/models/ActivityLog.js`)
Added new action type:
- `trip_status_reverted` - Logs when a trip status is reverted

### 3. API Endpoints

#### Enhanced: PATCH `/api/trips/:id/status`
**Changes:**
- Now tracks all status changes in `statusHistory` array
- Captures full context: old status, user, timestamp, reason, and metadata
- Maintains backward compatibility with existing functionality

**Status History Entry Format:**
```javascript
{
  status: oldStatus,
  changedBy: userId,
  changedAt: new Date(),
  reason: cancellationReason || statusChangeReason,
  metadata: {
    fromEndpoint: 'status_update',
    location: locationData,
    tripMetrics: metricsData
  }
}
```

#### New: POST `/api/trips/:id/revert-status`
**Authorization:** dispatcher, scheduler, admin only

**Request Body:**
```javascript
{
  reason: string (optional)
}
```

**Validation:**
- Only trips with status 'completed' or 'cancelled' can be reverted
- Returns 400 error for invalid status

**Business Logic:**

**Un-Complete Logic (completed → ?)**
1. If `actualPickupTime` exists → revert to `in_progress`
   - Clears `actualDropoffTime`
2. Else if `assignedDriver` exists → revert to `assigned`
3. Else → revert to `pending`

**Un-Cancel Logic (cancelled → ?)**
1. Search `statusHistory` for most recent non-cancelled status
2. If found → revert to that status
3. Else if `assignedDriver` exists → revert to `assigned`
4. Else → revert to `pending`
5. Clears: `cancellationReason`, `cancelledBy`, `cancelledAt`, `tripMetrics.cancellationReason`

**Response:**
```javascript
{
  success: true,
  trip: updatedTripObject,
  reversion: {
    oldStatus: 'completed',
    newStatus: 'in_progress',
    revertedBy: userObject,
    revertedAt: timestamp,
    reason: 'User-provided reason'
  }
}
```

**Status History Entry:**
```javascript
{
  status: oldStatus,
  changedBy: userId,
  changedAt: new Date(),
  reason: reason,
  metadata: {
    action: 'revert',
    fromStatus: oldStatus,
    toStatus: newStatus,
    revertedFields: [fields that were cleared]
  }
}
```

**Activity Log Entry:**
```javascript
{
  userId: req.user._id,
  tripId: trip._id,
  action: 'trip_status_reverted',
  description: `Trip status reverted from ${oldStatus} to ${newStatus}`,
  metadata: { oldStatus, newStatus, reason }
}
```

## Frontend Implementation

### 1. UI Components

#### TripManagement Component (`frontend/src/components/scheduler/TripManagement.jsx`)

**New State:**
```javascript
const [revertReason, setRevertReason] = useState('');
const [isReverting, setIsReverting] = useState(false);
const { isOpen: isRevertOpen, onOpen: onRevertOpen, onClose: onRevertClose } = useDisclosure();
```

**New Imports:**
- Added `ArrowUturnLeftIcon` from Heroicons

**New Handlers:**
- `handleRevertTrip(trip)` - Opens revert confirmation dialog
- `confirmRevertStatus()` - Executes revert API call with error handling

**UI Changes:**

1. **Revert Button in Actions Column**
   - Icon: Purple arrow-uturn-left icon
   - Visibility: Only shown for trips with status 'completed' or 'cancelled'
   - Color Scheme: Purple
   - Tooltip: "Revert Completion" or "Revert Cancellation"
   - Position: Between Edit and Delete buttons

2. **Revert Confirmation Modal**
   - **Header:** Purple icon with "Revert Trip Status" title
   - **Body:**
     * Confirmation message with rider name
     * Current status badge with color coding
     * Trip details (pickup → dropoff, date/time)
     * Info alert explaining what status trip will revert to
     * Optional textarea for reason input
   - **Footer:**
     * Cancel button
     * Purple "Revert Status" button with loading state

### 2. User Experience Flow

1. User identifies completed/cancelled trip that needs correction
2. Clicks purple revert button (🔄) in actions column
3. Modal opens showing:
   - Trip details for verification
   - Current status
   - Explanation of what will happen
   - Optional reason field
4. User confirms reversion
5. API call executes with loading state
6. Success toast shows old → new status transition
7. Trip list refreshes automatically
8. Modal closes

### 3. Error Handling

**Client-Side:**
- Loading states during API call
- Disabled buttons during processing
- Toast notifications for success/error

**Error Messages:**
- Network errors: "Failed to revert trip status. Please try again."
- Authorization errors: Shown from backend response
- Validation errors: Shown from backend response

## Security & Authorization

**Access Control:**
- Only dispatcher, scheduler, and admin roles can revert status
- Enforced at backend route level with `authorizeRoles` middleware
- Frontend conditionally shows button (defense in depth)

**Audit Trail:**
- Every reversion is logged to ActivityLog
- Full statusHistory maintained in Trip document
- Tracks who reverted, when, and why
- Captures before/after states

## Data Integrity

**Completed Trip Reversion:**
- Clears `actualDropoffTime` (completion timestamp)
- Preserves `actualPickupTime` if trip was in progress
- Maintains driver assignment
- Keeps all other trip data intact

**Cancelled Trip Reversion:**
- Clears `cancellationReason`
- Clears `cancelledBy` reference
- Clears `cancelledAt` timestamp
- Clears `tripMetrics.cancellationReason`
- Restores to appropriate prior status

## Testing Scenarios

### Test Case 1: Un-Complete In-Progress Trip
**Setup:**
- Trip with status 'completed'
- Has `actualPickupTime` (was in progress)
- Has `actualDropoffTime`

**Expected:**
- Status changes to 'in_progress'
- `actualDropoffTime` cleared
- `actualPickupTime` preserved
- Toast shows "completed → in_progress"

### Test Case 2: Un-Complete Assigned Trip
**Setup:**
- Trip with status 'completed'
- No `actualPickupTime` (was never started)
- Has assigned driver

**Expected:**
- Status changes to 'assigned'
- `actualDropoffTime` cleared
- Driver assignment preserved
- Toast shows "completed → assigned"

### Test Case 3: Un-Cancel Trip with History
**Setup:**
- Trip with status 'cancelled'
- Has statusHistory showing was 'in_progress' before cancellation

**Expected:**
- Status changes to 'in_progress'
- Cancellation data cleared
- Toast shows "cancelled → in_progress"

### Test Case 4: Authorization Check
**Setup:**
- User with role 'driver' attempts revert

**Expected:**
- 403 Forbidden error
- Error toast displayed
- No status change

### Test Case 5: Invalid Status Revert
**Setup:**
- User attempts to revert trip with status 'pending'

**Expected:**
- 400 Bad Request error
- Error message: "Only completed or cancelled trips can be reverted"
- No status change

## Future Enhancements

### Potential Additions:
1. **Bulk Reversion:** Revert multiple trips at once
2. **Reversion History View:** Dedicated UI to view all reversions
3. **Smart Suggestions:** Show trips likely marked incorrectly
4. **Automated Reversion:** Time-based auto-revert for obvious mistakes
5. **Reversion Reports:** Analytics on reversion frequency by user/reason
6. **Approval Workflow:** Require supervisor approval for reversions
7. **Extended History:** Show full status timeline in trip view modal

### Analytics Opportunities:
- Track reversion frequency by user
- Identify patterns in incorrect status changes
- Generate reports on reversion reasons
- Alert on unusual reversion activity

## Documentation Updates

### User Guide Additions Needed:
- How to revert trip status
- When to use revert vs. delete
- Understanding status transitions
- Audit trail explanation

### Admin Documentation Needed:
- Reversion permission management
- Monitoring reversion activity
- Best practices for status management
- Troubleshooting reversion issues

## Files Modified

### Backend:
1. `backend/models/Trip.js` - Added statusHistory field
2. `backend/models/ActivityLog.js` - Added trip_status_reverted action
3. `backend/routes/trips.js` - Enhanced status endpoint, added revert endpoint

### Frontend:
1. `frontend/src/components/scheduler/TripManagement.jsx` - Added revert UI and logic

## Migration Notes

### Existing Trips:
- Existing trips without `statusHistory` field will initialize empty array
- No data migration needed - field is optional
- First status change will begin populating history

### Backwards Compatibility:
- All existing endpoints remain unchanged
- New endpoint is additive
- No breaking changes to existing functionality

## Status
✅ **COMPLETE** - Backend and frontend implementation finished
- Database schema updated
- API endpoints implemented and tested
- UI components added with full UX flow
- Error handling implemented
- Authorization enforced
- Audit logging active

## Next Steps
1. **User Testing:** Gather feedback from dispatchers/schedulers
2. **Documentation:** Update user guide with reversion instructions
3. **Analytics:** Add dashboard metrics for reversion activity
4. **Monitoring:** Track reversion frequency and patterns
5. **Training:** Educate users on when/how to use revert feature
