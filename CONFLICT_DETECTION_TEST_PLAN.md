# Conflict Detection Modal - Testing Plan

## Overview
The conflict detection modal has been fully integrated into TripEditModal and is ready for comprehensive testing. This document outlines the testing strategy, test cases, and validation steps.

## Integration Status
✅ **Complete**
- ConflictDetectionModal component created
- useConflictDetection hook created
- TripEditModal integrated with conflict detection
- Backend endpoint `/api/schedules/check-conflicts` confirmed working
- All compilation errors fixed

## Component Integration Details

### Files Involved
1. **TripEditModal.jsx** - Main component that triggers conflict checking
   - Imports: useConflictDetection hook + ConflictDetectionModal component
   - Uses: checkConflicts() when saving trip
   - Line: 265 - calls checkConflicts with trip data

2. **ConflictDetectionModal.jsx** - Modal for displaying and handling conflicts
   - Props: isOpen, onClose, tripData, driverId, vehicleId, onConflictsDetected, onProceed
   - Features: Conflict list, alternative driver suggestions, override checkbox
   - Error Handling: Graceful handling if API endpoint fails

3. **useConflictDetection.js** - State management hook
   - State: isOpen, conflicts, tripDataForCheck, driverIdForCheck, vehicleIdForCheck, overrideChecked
   - Methods: checkConflicts(), onConflictsDetected(), onProceedWithConflicts(), onProceedWithoutConflicts()
   - API Call: POST /api/schedules/check-conflicts

4. **Backend Endpoint** - /api/schedules/check-conflicts
   - Response Format: `{ conflicts: [...], hasConflicts: boolean }`
   - Expects: tempSchedule with all required fields
   - Returns: Array of conflict objects (structure to be verified)

## Test Cases

### Test Case 1: Modal Opens When Conflicts Detected
**Objective**: Verify modal displays when API returns conflicts
**Steps**:
1. Open TripEditModal
2. Enter trip data (driver, vehicle, start/end time that conflicts with existing trip)
3. Click Save
4. **Expected**: ConflictDetectionModal should open with conflicts listed

**Validation**:
- [ ] Modal is visible
- [ ] Modal title displays "Scheduling Conflicts Detected"
- [ ] Conflict list populated with detected conflicts
- [ ] Alternative drivers suggested in list

---

### Test Case 2: Modal Closes Without Conflicts
**Objective**: Verify normal save when no conflicts exist
**Steps**:
1. Open TripEditModal
2. Enter trip data (driver, vehicle, time NOT conflicting)
3. Click Save
4. **Expected**: Modal should not open, trip should save normally

**Validation**:
- [ ] Modal does not appear
- [ ] Trip saves successfully
- [ ] User redirected or modal closes

---

### Test Case 3: Conflict Information Displayed Correctly
**Objective**: Verify all conflict details are shown
**Steps**:
1. Trigger conflict scenario (Test Case 1)
2. Examine modal content
3. **Expected**: Each conflict should show:
   - Driver name
   - Existing trip details
   - Conflicting time period
   - Alternative driver options

**Validation**:
- [ ] Conflict driver name visible
- [ ] Time conflict clearly shown (e.g., "Overlaps with 10:00-12:00")
- [ ] Vehicle assignment shown
- [ ] Route/location info displayed

---

### Test Case 4: Override Checkbox Works
**Objective**: Verify user can override conflicts
**Steps**:
1. Trigger conflict scenario (Test Case 1)
2. Check the "Override" checkbox
3. Click "Proceed With Conflicts"
4. **Expected**: Modal closes, trip saves despite conflicts

**Validation**:
- [ ] Checkbox toggles correctly
- [ ] "Proceed With Conflicts" button becomes enabled when checked
- [ ] Trip saves with override flag
- [ ] Audit log records override (if implemented)

---

### Test Case 5: Alternative Driver Selection
**Objective**: Verify user can select alternative driver
**Steps**:
1. Trigger conflict scenario (Test Case 1)
2. Click on alternative driver suggestion
3. Click "Use This Driver"
4. **Expected**: Modal closes, trip assigned to alternative driver

**Validation**:
- [ ] Alternative drivers properly listed
- [ ] Selection triggers driver change
- [ ] Trip reassigns to selected driver
- [ ] No conflicts with new driver

---

### Test Case 6: Close Modal Without Saving
**Objective**: Verify user can cancel the operation
**Steps**:
1. Trigger conflict scenario (Test Case 1)
2. Click "Cancel" or X button
3. **Expected**: Modal closes, trip not saved

**Validation**:
- [ ] Modal closes
- [ ] TripEditModal remains open with data preserved
- [ ] No changes saved to database

---

### Test Case 7: API Error Handling
**Objective**: Verify graceful handling if backend fails
**Steps**:
1. Disable backend or mock API error
2. Open TripEditModal and try to save
3. **Expected**: Error handling without breaking UI

**Validation**:
- [ ] Error message displayed (console or UI)
- [ ] Modal doesn't hang or freeze
- [ ] User can retry or cancel
- [ ] No data corruption

---

### Test Case 8: Multiple Conflicts
**Objective**: Verify handling of multiple simultaneous conflicts
**Steps**:
1. Create trip data that conflicts with multiple existing trips
2. Click Save
3. **Expected**: All conflicts listed in modal

**Validation**:
- [ ] All conflicts visible in list
- [ ] List scrollable if many conflicts
- [ ] No conflicts truncated or hidden
- [ ] Performance acceptable with large conflict list

---

### Test Case 9: Partial Time Overlap
**Objective**: Verify conflict detection for partial overlaps
**Steps**:
1. Create trip: 10:00-12:00
2. Existing trip: 11:00-13:00 (same driver/vehicle)
3. Click Save
4. **Expected**: Conflict detected for partial overlap

**Validation**:
- [ ] Partial overlaps correctly identified
- [ ] Time period clearly shows overlap duration

---

### Test Case 10: Same Start/End Time
**Objective**: Verify conflict detection for same time slot
**Steps**:
1. Create trip: 10:00-12:00
2. Existing trip: 10:00-12:00 (same driver/vehicle)
3. Click Save
4. **Expected**: Conflict detected

**Validation**:
- [ ] Exact time overlaps correctly identified

---

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Backend server running
- [ ] Frontend development server running
- [ ] Test database with sample trips and drivers loaded
- [ ] Authentication/login working
- [ ] Network requests visible in browser DevTools

### UI Testing
- [ ] Modal styling consistent with app theme
- [ ] Modal responsive on mobile (if applicable)
- [ ] Text readable and properly formatted
- [ ] Buttons properly positioned and clickable
- [ ] Scrolling works for long conflict lists
- [ ] Icons/badges display correctly (conflict indicators)

### Data Testing
- [ ] Conflict times accurately reflect database
- [ ] Driver names match actual drivers
- [ ] Vehicle names match actual vehicles
- [ ] Alternative suggestions are actually available
- [ ] No stale data displayed (test with cache clear)

### Performance Testing
- [ ] Modal opens within <1 second
- [ ] Large conflict lists load smoothly
- [ ] No UI freezing during conflict check
- [ ] No memory leaks (check DevTools Memory)
- [ ] Network requests reasonable size

### Accessibility Testing
- [ ] Modal keyboard navigable (Tab through elements)
- [ ] Close button accessible (Escape key)
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Screen reader compatible (if required)

---

## API Testing

### Verify Endpoint Response Format
**Endpoint**: `POST /api/schedules/check-conflicts`

**Request Format**:
```json
{
  "driverId": "driver123",
  "vehicleId": "vehicle456",
  "startTime": "2025-12-21T10:00:00Z",
  "endTime": "2025-12-21T12:00:00Z",
  "date": "2025-12-21"
}
```

**Expected Response (No Conflicts)**:
```json
{
  "conflicts": [],
  "hasConflicts": false
}
```

**Expected Response (With Conflicts)**:
```json
{
  "conflicts": [
    {
      "id": "trip123",
      "driverId": "driver123",
      "driverName": "John Doe",
      "vehicleId": "vehicle456",
      "vehicleName": "Van A",
      "startTime": "2025-12-21T11:00:00Z",
      "endTime": "2025-12-21T13:00:00Z",
      "route": "Downtown - Airport",
      "overlapStart": "2025-12-21T11:00:00Z",
      "overlapEnd": "2025-12-21T12:00:00Z",
      "overlapMinutes": 60
    }
  ],
  "hasConflicts": true
}
```

**Test Steps**:
- [ ] Test with valid conflict scenario
- [ ] Test with no conflicts
- [ ] Test with multiple conflicts
- [ ] Verify response times < 500ms
- [ ] Verify authentication required
- [ ] Verify error handling (500, 400, etc.)

---

## Test Data Setup

### Scenario 1: Simple Conflict
```
Existing Trip:
- Driver: John Doe (ID: driver_1)
- Vehicle: Van A (ID: vehicle_1)
- Time: 10:00-12:00
- Date: 2025-12-21

Test Trip (conflicting):
- Driver: John Doe
- Vehicle: Van A
- Time: 11:00-13:00
- Date: 2025-12-21

Expected Result: Conflict detected (1-hour overlap)
```

### Scenario 2: No Conflict - Different Drivers
```
Existing Trip:
- Driver: John Doe
- Vehicle: Van A
- Time: 10:00-12:00

Test Trip:
- Driver: Jane Smith
- Vehicle: Van A (different driver is OK)
- Time: 11:00-13:00

Expected Result: No conflict
```

### Scenario 3: No Conflict - Different Vehicles
```
Existing Trip:
- Driver: John Doe
- Vehicle: Van A
- Time: 10:00-12:00

Test Trip:
- Driver: John Doe
- Vehicle: Van B (different vehicle is OK)
- Time: 11:00-13:00

Expected Result: No conflict
```

### Scenario 4: No Conflict - Different Times
```
Existing Trip:
- Driver: John Doe
- Vehicle: Van A
- Time: 10:00-12:00

Test Trip:
- Driver: John Doe
- Vehicle: Van A
- Time: 14:00-16:00 (different day or after existing)

Expected Result: No conflict
```

---

## Browser DevTools Inspection

### Console Checks
- [ ] No JavaScript errors
- [ ] No warning messages
- [ ] API request/response logged correctly
- [ ] Hook state changes logged (if debugging enabled)

### Network Tab
- [ ] POST /api/schedules/check-conflicts request visible
- [ ] Response includes conflicts array
- [ ] Response time < 500ms
- [ ] No failed requests (4xx, 5xx)
- [ ] Request includes authentication header

### React DevTools (if available)
- [ ] ConflictDetectionModal component renders correctly
- [ ] useConflictDetection hook state updates properly
- [ ] TripEditModal props passed correctly
- [ ] No unnecessary re-renders

---

## Bug Report Template

If issues are found, use this template:

```
**Title**: [Brief description]
**Component**: ConflictDetectionModal / useConflictDetection / TripEditModal
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Result**: 
...

**Actual Result**: 
...

**Screenshots**: 
[if applicable]

**Browser/Environment**:
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 
- React version: 

**Notes**: 
...
```

---

## Sign-Off Checklist

- [ ] All 10 test cases passed
- [ ] Manual testing checklist completed (20+ items)
- [ ] API endpoint verified working
- [ ] No console errors
- [ ] No performance issues
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] Ready for integration testing with other features

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Mark conflict detection as "completed" in TODO
   - Move to manager dashboard implementation

2. **If Issues Found**:
   - Document bugs using template above
   - Create GitHub issues (if using GitHub)
   - Assign fixes to development team
   - Re-test after fixes

3. **Optional Enhancements** (Post-MVP):
   - Add conflict prevention suggestions during trip creation
   - Implement automatic re-scheduling for conflicts
   - Add audit trail for override decisions
   - Create conflict analytics dashboard

---

## Testing Timeline

**Estimated Duration**: 2-3 hours
- Setup & verification: 15 min
- Manual testing (all cases): 90 min
- API testing: 30 min
- Browser DevTools inspection: 15 min
- Documentation of results: 15 min

**Recommended Tester**: QA or Senior Developer
**Date Scheduled**: [To be filled in]
**Tester Name**: [To be filled in]
**Completion Date**: [To be filled in]

---

## Related Documentation

- [Conflict Detection Modal Component](./ConflictDetectionModal.jsx)
- [useConflictDetection Hook](./frontend/src/hooks/useConflictDetection.js)
- [TripEditModal Integration](./frontend/src/components/scheduler/TripEditModal.jsx)
- [Schedules API Routes](./backend/routes/schedules.js)

