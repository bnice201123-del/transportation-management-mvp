# Phase 6: Advanced Error Handling - Quick Start Guide

**Purpose**: Fast-track guide to implement Phase 6 in your dashboard  
**Time to Read**: 5 minutes  
**Time to Implement**: 45-60 minutes per dashboard  

---

## 🚀 60-Second Overview

Phase 6 adds **automatic retry with exponential backoff** to your API calls:

```
API Fails → Auto Retry → Show Countdown → Succeed or Show Error
```

**What You Get**:
- ✅ Automatic retry on transient failures (connection issues, 502, 503, etc)
- ✅ User-visible countdown showing when retry will happen
- ✅ Cancel button to stop retry
- ✅ Manual retry option if needed
- ✅ Graceful error handling

---

## 📦 What's Included

```
✅ retryHandler.js      - Core retry logic with exponential backoff
✅ useRetry.js          - React hooks for your components
✅ RetryAlerts.jsx      - UI alerts for retry feedback
✅ ErrorBoundary.jsx    - Enhanced error catching component
```

---

## 🎯 3-Step Implementation

### Step 1: Import (30 seconds)
```javascript
import { useRetry } from '@/hooks/useRetry';
import { RetryAlert, ErrorRecoveryAlert, SuccessAlert } from '@/components/shared/RetryAlerts';
```

### Step 2: Initialize Hook (30 seconds)
```javascript
const { retry, isRetrying, retryCount, lastError, cancel } = useRetry({
  maxAttempts: 3,
  showNotifications: true,
});
```

### Step 3: Use It (1 minute)
```javascript
const handleAction = async (data) => {
  try {
    const result = await retry(
      () => api.post('/api/endpoint', data),
      'Operation Name'
    );
    // Success!
  } catch (error) {
    // Already handled by useRetry
  }
};
```

---

## 🔧 Complete Working Example

```jsx
import React, { useState } from 'react';
import { Button, Box } from '@chakra-ui/react';
import { useRetry } from '@/hooks/useRetry';
import { RetryAlert, ErrorRecoveryAlert } from '@/components/shared/RetryAlerts';

function CreateTripForm() {
  const [tripData, setTripData] = useState(null);
  const { retry, isRetrying, retryCount, lastError, cancel } = useRetry();

  const handleCreateTrip = async () => {
    try {
      const result = await retry(
        () => api.post('/api/trips', tripData),
        'Create Trip'
      );
      console.log('Trip created:', result);
    } catch (error) {
      // Error shown in ErrorRecoveryAlert
      console.error('Failed to create trip:', error);
    }
  };

  return (
    <Box>
      {/* Show countdown while retrying */}
      <RetryAlert
        isVisible={isRetrying}
        attempt={retryCount}
        maxAttempts={3}
        operationName="Create Trip"
        onCancel={cancel}
      />

      {/* Show error with retry option */}
      <ErrorRecoveryAlert
        isVisible={!!lastError && !isRetrying}
        error={lastError}
        attempt={retryCount}
        maxAttempts={3}
        onRetry={() => handleCreateTrip()}
        operationName="Create Trip"
      />

      {/* Your form */}
      <Button
        onClick={handleCreateTrip}
        isLoading={isRetrying}
        disabled={isRetrying}
      >
        Create Trip
      </Button>
    </Box>
  );
}

export default CreateTripForm;
```

---

## 📋 Integration Checklist (Per Dashboard)

```
Dashboard: ________________
Started: __________
Completed: __________

[ ] Import useRetry hook and alert components
[ ] Call useRetry in component
[ ] Find first API call (e.g., form submission)
[ ] Wrap API call with retry()
[ ] Add RetryAlert component
[ ] Add ErrorRecoveryAlert component
[ ] Test: Call should work normally
[ ] Test: Stop API, call should retry and show countdown
[ ] Test: Cancel button should work
[ ] Test: After max retries, show error
[ ] Move to next API call
[ ] Repeat for all API calls in dashboard
[ ] Add ErrorBoundary wrapper
[ ] Test entire dashboard
[ ] Commit changes
```

---

## ⚡ Common API Calls to Wrap

### Dispatcher Dashboard
```javascript
// Before
await api.post(`/api/trips/${tripId}/assign`, { driverId });

// After
await retry(
  () => api.post(`/api/trips/${tripId}/assign`, { driverId }),
  'Assign Driver'
);
```

### Scheduler Dashboard
```javascript
// Before
await api.post('/api/trips', tripData);

// After
await retry(
  () => api.post('/api/trips', tripData),
  'Create Trip'
);
```

### Driver Dashboard
```javascript
// Before
await api.post(`/api/gps/${tripId}/location`, locationData);

// After
await retry(
  () => api.post(`/api/gps/${tripId}/location`, locationData),
  'Update Location'
);
```

---

## 🎨 Alert Components

### RetryAlert
Shows during retry countdown:
```jsx
<RetryAlert
  isVisible={isRetrying}           // Show when retrying
  attempt={retryCount}             // Current attempt number
  maxAttempts={3}                  // Total attempts
  delayMs={2000}                   // Time until next retry
  onCancel={cancel}                // Cancel callback
  operationName="Create Trip"      // Friendly name
/>
```

### ErrorRecoveryAlert
Shows on error:
```jsx
<ErrorRecoveryAlert
  isVisible={!!lastError}          // Show when error exists
  error={lastError}                // Error object
  attempt={retryCount}             // Current attempt
  maxAttempts={3}                  // Total attempts
  onRetry={handleAction}           // Retry callback
  onDismiss={() => {}}             // Close callback
  operationName="Create Trip"      // Friendly name
/>
```

### SuccessAlert
Shows on success (optional):
```jsx
<SuccessAlert
  isVisible={!!successMessage}     // Show when success
  message="Trip created!"          // Success message
  onDismiss={() => {}}             // Close callback
  autoCloseDuration={3000}         // Auto-close after 3s
/>
```

---

## 🔄 Hook API Reference

```javascript
const {
  // Main function to retry operations
  executeWithRetry,    // (fn, operationName) => Promise
  
  // Alias for executeWithRetry
  retry,              // (fn, operationName) => Promise
  
  // Cancel active retry
  cancel,             // () => void
  
  // Current state
  isRetrying,         // boolean
  retryCount,         // number (1-indexed)
  lastError,          // Error object or null
} = useRetry({
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  showNotifications: true,
});
```

---

## 🧪 Testing Your Implementation

### Test 1: Normal Success
```
1. API running normally
2. Click button to make API call
3. Should succeed immediately
```

### Test 2: Transient Failure
```
1. Stop your API server
2. Click button to make API call
3. Should see "Retrying in 3 seconds..."
4. Start API server again
5. Should auto-retry and succeed
```

### Test 3: Cancel Retry
```
1. Stop API server
2. Click button
3. Wait for retry countdown
4. Click "Cancel" button
5. Should stop retrying
6. Click "Retry" to try again
```

### Test 4: Max Retries
```
1. Stop API server
2. Click button
3. Wait for all 3 retry attempts
4. Should show error message
5. No more auto-retries
```

---

## ⚙️ Configuration Reference

```javascript
const { retry } = useRetry({
  // How many times to retry (including initial attempt)
  maxAttempts: 3,

  // Wait time before first retry
  initialDelay: 1000,  // milliseconds

  // Maximum wait time between retries
  maxDelay: 30000,     // milliseconds

  // Multiply delay by this each retry
  // delay = min(initialDelay * (multiplier ^ (attempt-1)), maxDelay)
  multiplier: 2,

  // Show toast notifications
  showNotifications: true,

  // Called when retry succeeds
  onSuccess: (result) => {
    console.log('Operation succeeded:', result);
  },

  // Called when max retries exhausted
  onFailure: (error) => {
    console.log('Operation failed:', error);
  },
});
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Wrapping every call
```javascript
// Don't do this in every file
await retry(() => api.get('/api/data'), 'Get Data');
```

**✅ Do this instead**: Only wrap important API calls (form submissions, updates)

### ❌ Mistake 2: Not showing alerts
```javascript
// Don't do this - user won't see retry is happening
await retry(() => api.post('/api/endpoint', data), 'Operation');
```

**✅ Do this instead**: Always show RetryAlert and ErrorRecoveryAlert

### ❌ Mistake 3: Forgetting error boundary
```javascript
// Don't do this - component crashes aren't handled
<Dashboard />
```

**✅ Do this instead**: Wrap with ErrorBoundary
```jsx
<ErrorBoundary fallbackMessage="Dashboard failed to load">
  <Dashboard />
</ErrorBoundary>
```

### ❌ Mistake 4: Too many retry attempts
```javascript
// Don't do this - waits up to 30+ seconds
const { retry } = useRetry({ maxAttempts: 10 });
```

**✅ Do this instead**: Use reasonable defaults or 3-5 attempts

---

## 📊 What Gets Retried

### ✅ Retryable (Auto-Retry)
- 429 Too Many Requests
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout
- Network timeouts
- Connection refused
- DNS failures

### ❌ Non-Retryable (Show Error Immediately)
- 400 Bad Request (invalid input)
- 401 Unauthorized (authentication)
- 403 Forbidden (permission)
- 404 Not Found (resource missing)
- 409 Conflict (data conflict)
- 5xx other errors

---

## 🔗 Integration Timeline

**For Each Dashboard**: 45-60 minutes

```
00:00 - Read this guide (5 min)
05:00 - Add imports (2 min)
07:00 - Initialize hook (1 min)
08:00 - Wrap first API call (3 min)
11:00 - Add alert components (5 min)
16:00 - Test first API call (5 min)
21:00 - Wrap remaining API calls (10 min)
31:00 - Test all API calls (10 min)
41:00 - Add ErrorBoundary wrapper (5 min)
46:00 - Final testing (10 min)
56:00 - Done! ✅
```

---

## 📚 Where to Find More Info

- **Implementation Details**: `PHASE_6_IMPLEMENTATION_COMPLETE.md`
- **Testing Scenarios**: `PHASE_6_TESTING_GUIDE.md`
- **Integration Checklist**: `PHASE_6_INTEGRATION_CHECKLIST.md`
- **Code Examples**: Source files with comments
- **Troubleshooting**: Common issues section in integration guide

---

## 🎯 Success Criteria

Your implementation is successful when:

- ✅ Component loads without errors
- ✅ Normal API calls work as before
- ✅ Failed requests show retry countdown
- ✅ Countdown timer updates correctly
- ✅ Cancel button stops retry
- ✅ Manual retry button works
- ✅ Success messages appear
- ✅ No console errors
- ✅ UI is responsive during retry

---

## 🚀 Ready to Start?

1. Pick a dashboard to integrate first
2. Follow the 3-step implementation above
3. Use the checklist to track progress
4. Test with API running and stopped
5. Move to next dashboard
6. All done! 🎉

---

**Estimated Total Time**: 2.5-3.5 hours for all 3 dashboards  
**Difficulty**: Intermediate  
**Support**: Check docs or review code comments  

**Let's make your app resilient!** 💪
