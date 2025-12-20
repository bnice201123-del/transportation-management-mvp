# Phase 6 Integration Testing Guide

**Purpose**: Verify retry logic, error boundaries, and alerts work correctly  
**Duration**: 30-60 minutes  
**Difficulty**: Intermediate

---

## Pre-Testing Checklist

- [ ] All Phase 6 files created (retryHandler.js, useRetry.js, RetryAlerts.jsx, ErrorBoundary enhanced)
- [ ] No compilation errors (`npm run build`)
- [ ] Backend API running and accessible
- [ ] Browser DevTools open (F12)
- [ ] Network throttling available (Chrome DevTools)

---

## Test Scenario 1: Exponential Backoff Timing

**Objective**: Verify delays follow exponential backoff pattern (1s, 2s, 4s)

**Test Case 1.1: Monitor Backoff Delays**
```javascript
// In browser console
// Stop your API server temporarily
// Try an API call through useRetry hook
// Monitor delays in console logs

// Expected delays (with ±10% jitter):
// Attempt 1: 0ms (immediate)
// Attempt 2: ~1000ms (1 sec)
// Attempt 3: ~2000ms (2 sec)
// Attempt 4: ~4000ms (4 sec)
```

**Steps**:
1. Open dispatcher dashboard
2. Attempt to create a trip
3. Immediately stop backend API
4. Watch console for retry delay messages
5. Verify delays are: 0ms → 1s → 2s → 4s (±10%)

**Expected Result**: ✅ Delays follow exponential pattern

---

## Test Scenario 2: Retry Alert Display

**Objective**: Verify RetryAlert component shows during retry countdown

**Test Case 2.1: Countdown Display**
```
Initial state: "Retrying in 3 seconds..."
After 1s: "Retrying in 2 seconds..."
After 2s: "Retrying in 1 seconds..."
After 3s: Auto-retry triggered
```

**Steps**:
1. Trigger a failing API call (simulated)
2. Watch RetryAlert component display
3. Verify countdown timer updates every second
4. Verify attempt counter shows "Attempt 2 of 3"
5. Verify progress bar updates

**Expected Result**: ✅ Countdown displays correctly

---

## Test Scenario 3: User Cancels Retry

**Objective**: Verify user can cancel active retry

**Steps**:
1. Trigger failing API call
2. Wait for RetryAlert to show
3. Click "Cancel" button before countdown finishes
4. Verify RetryAlert disappears
5. Verify ErrorRecoveryAlert shows instead
6. Verify manual "Retry" button is still available

**Expected Result**: ✅ Cancellation works, user can manually retry

---

## Test Scenario 4: Max Retries Exhausted

**Objective**: Verify system stops after max attempts

**Steps**:
1. Stop backend API completely
2. Trigger API call with useRetry (maxAttempts: 3)
3. Watch RetryAlert count attempts
4. After attempt 3 fails, verify:
   - RetryAlert disappears
   - ErrorRecoveryAlert shows "No more retries"
   - No auto-retry happens
   - Manual retry button disabled or shows message

**Expected Result**: ✅ Stops after 3 attempts, no infinite loops

---

## Test Scenario 5: Network Error Detection

**Objective**: Verify transient network errors trigger retry

**Network Errors to Test**:
- [ ] Network timeout (Chrome DevTools: Throttling → Offline)
- [ ] Connection refused (Stop API server)
- [ ] 503 Service Unavailable (Mock 503 response)
- [ ] 502 Bad Gateway (Mock 502 response)
- [ ] 429 Too Many Requests (Mock 429 response)

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Trigger API call
5. Verify RetryAlert appears immediately
6. Wait for auto-retry
7. Re-enable network (refresh DevTools)
8. Verify retry succeeds or shows recovery alert

**Expected Result**: ✅ Transient errors trigger automatic retry

---

## Test Scenario 6: Non-Retryable Errors

**Objective**: Verify 400 Bad Request does NOT trigger retry

**Steps**:
1. Submit invalid form data (e.g., trip with missing required fields)
2. Expect API to return 400 Bad Request
3. Verify:
   - RetryAlert does NOT appear
   - ErrorRecoveryAlert shows immediately
   - Error message displayed
   - No auto-retry attempted

**Expected Result**: ✅ 400 errors don't retry, show immediately

---

## Test Scenario 7: Error Boundary Catches Errors

**Objective**: Verify ErrorBoundary catches rendering errors

**Steps**:
1. Inject a JavaScript error in a dashboard component (temporarily)
2. Load the dashboard
3. Verify ErrorBoundary catches the error
4. Verify error message displays
5. Click "Try Again" button
6. Verify component attempts to re-render
7. Click "Reload Page" button
8. Verify page reloads

**Expected Result**: ✅ ErrorBoundary catches errors gracefully

---

## Test Scenario 8: Success Alert Display

**Objective**: Verify SuccessAlert shows and auto-dismisses

**Steps**:
1. Complete a successful API call (trip creation, assignment, etc)
2. Verify SuccessAlert appears
3. Verify message shows operation success
4. Wait 3 seconds
5. Verify alert auto-dismisses
6. Verify manually closing alert works

**Expected Result**: ✅ Success alert shows and dismisses correctly

---

## Test Scenario 9: Multiple Simultaneous Operations

**Objective**: Verify independent retry state for multiple operations

**Steps**:
1. Trigger 3 different API calls simultaneously
2. Make all 3 fail with transient errors
3. Verify each has independent:
   - RetryAlert with own countdown
   - Attempt counter
   - Cancel button
4. Cancel one, let others retry
5. Verify cancellation affects only one operation

**Expected Result**: ✅ Each operation has independent retry state

---

## Test Scenario 10: Accessibility Compliance

**Objective**: Verify WCAG AA compliance (44px buttons, etc)

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to Lighthouse
3. Run Accessibility audit
4. Verify no button size warnings
5. Verify all buttons are keyboard accessible (Tab key)
6. Verify all alerts have proper ARIA labels
7. Verify color contrast meets WCAG AA (4.5:1)
8. Test with keyboard only (no mouse)

**Expected Result**: ✅ WCAG AA compliant

---

## Test Scenario 11: Toast Notifications

**Objective**: Verify toast notifications show during retry

**Expected Notifications**:
- "Attempting operation..." (during retry)
- "Operation succeeded!" (on success)
- "Operation failed, retrying..." (on transient failure)
- "Max retries exceeded" (on max attempts failure)

**Steps**:
1. Trigger API call with retry
2. Verify toast notifications appear at top/bottom of screen
3. Verify notifications auto-dismiss
4. Verify notifications are dismissable manually
5. Verify notification content is clear and helpful

**Expected Result**: ✅ Toast notifications work correctly

---

## Test Scenario 12: Performance Under Stress

**Objective**: Verify retry logic doesn't cause memory leaks or hangs

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to Memory tab
3. Take memory snapshot
4. Trigger 10 API calls with retries
5. Let them all retry multiple times
6. Take another memory snapshot
7. Verify memory doesn't grow excessively
8. Verify UI remains responsive

**Expected Result**: ✅ No memory leaks, responsive UI

---

## Test Scenario 13: Different Error Messages

**Objective**: Verify error messages display correctly from API

**Test Cases**:
- [ ] API error with custom message: "Driver not found"
- [ ] API error with status code only: "503 Service Unavailable"
- [ ] Network error: "Failed to connect to server"
- [ ] Timeout error: "Request timeout"

**Steps**:
1. Mock API responses with different error formats
2. Verify ErrorRecoveryAlert displays correct message
3. Verify message is user-friendly
4. Verify technical details hidden in production

**Expected Result**: ✅ Error messages display correctly

---

## Test Scenario 14: Retry with Different Configurations

**Objective**: Verify hook options are respected

**Test Cases**:
```javascript
// Custom max attempts
{ maxAttempts: 5 }

// Custom delays
{ initialDelay: 500, maxDelay: 10000 }

// Disable notifications
{ showNotifications: false }

// Custom callbacks
{ onSuccess: (result) => {}, onFailure: (error) => {} }
```

**Steps**:
1. Create test component with custom retry config
2. Trigger API call
3. Verify config options are respected:
   - [ ] Attempts match configured maximum
   - [ ] Delays match configured values
   - [ ] Notifications shown/hidden per config
   - [ ] Callbacks are invoked

**Expected Result**: ✅ Configuration options work correctly

---

## Test Scenario 15: Edge Cases

**Objective**: Handle unusual situations gracefully

**Edge Cases**:
1. **Server error on retry**: Initial call fails, retry succeeds
   - Expected: Success alert, no error shown
2. **Intermittent success**: Alternating success/failure
   - Expected: Eventually succeeds after retries
3. **Very long delay**: Max delay (30s) reached
   - Expected: Waits full 30s before retry
4. **Rapid fire requests**: Multiple retries in quick succession
   - Expected: No race conditions, proper state management
5. **Component unmounts**: Component unmounts during retry
   - Expected: Cleanup happens, no console errors

**Steps**: Implement and test each edge case

**Expected Result**: ✅ All edge cases handled gracefully

---

## Performance Benchmarks

### Acceptable Performance
- Retry logic execution: <5ms
- Alert rendering: <10ms
- Exponential backoff calculation: <1ms
- Memory overhead per retry: <100KB

### To Measure
```javascript
// In browser console
console.time('retry-execution');
// ... trigger retry ...
console.timeEnd('retry-execution');
```

---

## Regression Testing

**Verify No Regressions from Phase 1-5**:
- [ ] Console errors still removed
- [ ] Input validation still working
- [ ] Button heights still 44px
- [ ] Backend validation still active
- [ ] Error handling utility still functional
- [ ] No new console errors introduced

---

## Success Criteria

**Phase 6 is READY for production when**:
- ✅ All 15 test scenarios pass
- ✅ No regressions from previous phases
- ✅ Performance is acceptable (<10ms overhead)
- ✅ Accessibility is WCAG AA compliant
- ✅ No console errors or warnings
- ✅ Mobile responsive (iOS and Android tested)
- ✅ Cross-browser compatible (Chrome, Firefox, Safari, Edge)

---

## Post-Testing

### If All Tests Pass ✅
- Update todo list: Phase 6 → COMPLETE
- Update progress: 81% → 85%
- Start Phase 7: Mobile Responsiveness

### If Issues Found ❌
- Log issue with test scenario number
- Identify root cause
- Fix in appropriate file:
  - Retry logic → retryHandler.js
  - Hooks → useRetry.js
  - Alerts → RetryAlerts.jsx
  - Error boundary → ErrorBoundary.jsx
- Re-test affected scenarios

---

## Testing Shortcuts

**Quick Test** (5 minutes):
1. Create trip → should succeed
2. Stop API → create trip → should retry and show alert
3. Wait for max retries → should show error

**Full Test** (30-60 minutes):
- Run through all 15 scenarios
- Test on multiple browsers
- Test on mobile
- Test accessibility

---

## Notes

- Save test results in a spreadsheet or document
- Take screenshots of each scenario for documentation
- Note any unexpected behaviors
- Compare with expected results in this guide
- Verify nothing breaks existing functionality

---

**Start Testing**: Ready when you are!  
**Estimated Time**: 30-60 minutes  
**Next Step**: Phase 7 Mobile Responsiveness (after Phase 6 passes all tests)
