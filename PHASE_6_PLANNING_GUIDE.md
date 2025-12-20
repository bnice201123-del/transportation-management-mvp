# Phase 6: Advanced Error Handling - Planning Guide

**Status**: Ready to Start  
**Estimated Time**: 3-4 hours  
**Priority**: HIGH  
**Blocking**: Yes - Production ready feature

---

## Overview

Phase 6 focuses on implementing robust error recovery mechanisms that improve application resilience and user experience during network failures or service disruptions.

---

## What Needs to Be Built

### 1. Retry Logic with Exponential Backoff

#### Current State
- Basic error handling exists in `errorHandler.js`
- Network errors detected but not retried
- Users see error message but can't auto-retry

#### Requirements
```javascript
// Retry Configuration
Attempts: 3 maximum retries
Initial delay: 1 second
Max delay: 30 seconds
Backoff multiplier: 2 (exponential)

Timeline:
  Attempt 1: Immediate
  Attempt 2: After 1 second (1s * 2^0)
  Attempt 3: After 2 seconds (1s * 2^1)
  Attempt 4: After 4 seconds (1s * 2^2)
  Attempt 5: After 8 seconds (1s * 2^3) - FAILS

// Retryable errors
429 - Too Many Requests
502 - Bad Gateway
503 - Service Unavailable
504 - Gateway Timeout
Network errors (connection refused, timeout)
```

#### Implementation Location
- File: `frontend/src/utils/retryHandler.js` (NEW)
- Integration: DispatcherDashboard.jsx, SchedulerDashboard.jsx, ComprehensiveDriverDashboard.jsx

---

### 2. Retry Buttons in UI

#### Current State
- Errors show but user must manually click "try again"
- Trip creation fails silently in some cases
- GPS location updates may fail without retry

#### Requirements
```jsx
// Manual Retry Button (for user-triggered actions)
<Button 
  onClick={() => retryOperation(operationId)}
  colorScheme="orange"
  size="sm"
  minH="44px"
>
  ↻ Retry
</Button>

// Auto-Retry Banner (for network errors)
<Alert status="warning">
  <AlertIcon />
  <Box>
    <AlertTitle>Connection Error</AlertTitle>
    <AlertDescription>
      Retrying in 2 seconds... (Attempt 2 of 3)
    </AlertDescription>
  </Box>
  <Button size="sm" ml="auto" onClick={skipRetry}>
    Cancel Retry
  </Button>
</Alert>
```

#### Implementation Location
- DispatcherDashboard.jsx: Trip assignment, trip status updates
- SchedulerDashboard.jsx: Trip creation, schedule updates
- ComprehensiveDriverDashboard.jsx: Location updates, trip actions

---

### 3. Error Boundary Components

#### Current State
- No error boundaries in place
- Errors can crash entire component
- Users see blank screens

#### Requirements
```jsx
// Error Boundary Component
<ErrorBoundary fallback={<ErrorFallback />}>
  <DispatcherDashboard />
</ErrorBoundary>

// Features
- Catch rendering errors
- Display user-friendly message
- Offer recovery options
- Log error to console (development only)
```

#### Implementation Location
- File: `frontend/src/components/shared/ErrorBoundary.jsx` (NEW)
- Usage: Wrap main dashboard components

---

### 4. Loading States (Skeleton Screens)

#### Current State
- Loading spinners used but crude
- Data flashing as it updates
- No smooth transitions

#### Requirements
```jsx
// Skeleton for trip list
<Skeleton height="40px" mb={2} />
<Skeleton height="40px" mb={2} />
<Skeleton height="40px" mb={2} />

// Skeleton for form
<Skeleton height="40px" mb={4} />
<Skeleton height="40px" mb={4} />
<Skeleton height="40px" mb={4} />
```

#### Implementation Location
- DispatcherDashboard.jsx: Trip list loading
- SchedulerDashboard.jsx: Schedule loading
- ComprehensiveDriverDashboard.jsx: Driver info loading

---

## Implementation Checklist

### Step 1: Create Retry Handler Utility (30 minutes)

**File**: `frontend/src/utils/retryHandler.js`

```javascript
// Exports:
✓ retryWithExponentialBackoff(fn, options)
✓ createRetryablePromise(promise, options)
✓ RetryConfig (class)
✓ isRetryableError(error)
✓ calculateDelay(attempt, minDelay, maxDelay)
```

**Responsibilities**:
- Execute function with retry logic
- Calculate exponential backoff delays
- Track retry attempts
- Provide callback hooks for UI updates
- Handle cancellation

---

### Step 2: Update API Service (30 minutes)

**File**: `frontend/src/services/apiService.js` (or similar)

```javascript
// Add retry logic to API calls
- Wrap fetch/axios with retryWithExponentialBackoff
- Detect retryable errors
- Provide feedback to UI (attempt count, delay remaining)
- Allow user to cancel retries
```

---

### Step 3: Create Error Boundary (30 minutes)

**File**: `frontend/src/components/shared/ErrorBoundary.jsx`

```jsx
// Component that catches rendering errors
// Displays fallback UI
// Offers reset/retry options
// Logs errors to console

Class component (required for error boundaries):
- componentDidCatch(error, errorInfo)
- getDerivedStateFromError(error)
```

---

### Step 4: Add Skeleton Loading (30 minutes)

**Files**:
- DispatcherDashboard.jsx
- SchedulerDashboard.jsx
- ComprehensiveDriverDashboard.jsx

```jsx
// Use Chakra UI's <Skeleton /> component
// Show while loading={true}
// Hide when data received
```

---

### Step 5: Update Dashboards with Retry UI (60 minutes)

**DispatcherDashboard.jsx**:
- Add retry button to trip actions
- Add retry banner for failed operations
- Show retry progress

**SchedulerDashboard.jsx**:
- Add retry button to schedule updates
- Show retry progress in trip creation
- Handle failed trip creation

**ComprehensiveDriverDashboard.jsx**:
- Add retry button to trip actions
- Retry location updates on failure
- Show connection status

---

### Step 6: Testing & Validation (30 minutes)

```javascript
// Test scenarios:
✓ Test retry with successful second attempt
✓ Test retry with all attempts failing
✓ Test exponential backoff timing
✓ Test user cancellation of retries
✓ Test error boundary catching errors
✓ Test skeleton screens during loading
✓ Test retryable vs non-retryable errors
```

---

## Code Examples

### Retry Handler Usage

```javascript
import { retryWithExponentialBackoff } from '@/utils/retryHandler';

// Example: Retry trip creation
const createTripWithRetry = async (tripData) => {
  return retryWithExponentialBackoff(
    () => api.post('/api/trips', tripData),
    {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      onAttempt: (attempt, delay) => {
        console.log(`Attempt ${attempt}, waiting ${delay}ms`);
        // Update UI with progress
      },
      onSuccess: (result) => {
        console.log('Trip created successfully');
      },
      onFailure: (error) => {
        console.error('Trip creation failed after 3 attempts');
      }
    }
  );
};
```

### Error Boundary Usage

```jsx
import ErrorBoundary from '@/components/shared/ErrorBoundary';

<ErrorBoundary>
  <DispatcherDashboard />
</ErrorBoundary>
```

### Skeleton Loading Usage

```jsx
import { Skeleton } from '@chakra-ui/react';

{isLoading ? (
  <>
    <Skeleton height="40px" mb={2} />
    <Skeleton height="40px" mb={2} />
    <Skeleton height="40px" mb={2} />
  </>
) : (
  <TripList trips={trips} />
)}
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| frontend/src/utils/retryHandler.js | Retry logic | 150-200 |
| frontend/src/components/shared/ErrorBoundary.jsx | Error handling | 80-100 |

---

## Files to Update

| File | Changes | Lines |
|------|---------|-------|
| frontend/src/services/apiService.js | Add retry wrapper | 30-50 |
| frontend/src/components/dispatcher/DispatcherDashboard.jsx | Add retry UI | 50-70 |
| frontend/src/components/scheduler/SchedulerDashboard.jsx | Add retry UI | 40-60 |
| frontend/src/components/driver/ComprehensiveDriverDashboard.jsx | Add retry UI | 40-60 |

---

## Success Criteria

- ✅ Retry logic executes correctly with exponential backoff
- ✅ Failed requests retry automatically
- ✅ Users see retry progress (attempt count, delay)
- ✅ Users can cancel retries
- ✅ Error boundaries catch and display errors gracefully
- ✅ Skeleton screens show during loading
- ✅ All 3 dashboards have retry UI
- ✅ No visual regressions
- ✅ Accessibility maintained (44px buttons, WCAG AA)

---

## Time Estimates

| Task | Time |
|------|------|
| Retry handler utility | 30 min |
| API service integration | 30 min |
| Error boundary | 30 min |
| Skeleton loading | 30 min |
| Dashboard UI updates | 60 min |
| Testing & validation | 30 min |
| **Total** | **3.5 hours** |

---

## Blocking Factors

- None (all dependencies complete)
- Can start immediately after Phase 5

---

## Success Checklist

### Code Review
- [ ] Retry handler uses correct exponential backoff formula
- [ ] Error detection matches list of retryable errors
- [ ] API calls wrapped with retry logic
- [ ] Error boundaries in place on all main components
- [ ] No console errors or warnings
- [ ] Code follows project standards

### Testing
- [ ] Manual retry successful (simulate network failure)
- [ ] Auto-retry works (attempt counter shows)
- [ ] User can cancel retry
- [ ] All retries fail after max attempts
- [ ] Error boundary catches errors gracefully
- [ ] Skeleton screens show/hide correctly
- [ ] Mobile layout intact

### Accessibility
- [ ] Retry buttons are 44px minimum
- [ ] Error messages clear and readable
- [ ] Keyboard accessible retry buttons
- [ ] Screen reader friendly messages
- [ ] No color-only status indication

---

## Next: Phase 7

After Phase 6 completes:
- Mobile responsiveness final pass (4-6 hours)
- Trip tables → card view on small screens
- Modal responsive sizing
- Final accessibility audit

---

**Preparation Status**: ✅ READY TO START

Proceed to Phase 6 implementation when ready.
