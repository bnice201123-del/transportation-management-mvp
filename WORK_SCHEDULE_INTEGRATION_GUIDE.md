# Work Schedule Features - Integration Guide

**Version:** 2.0 (Phase 2 Complete)  
**Last Updated:** December 17, 2025  
**Status:** Ready for Integration

---

## Quick Start

### For Managers

Add the ManagerScheduleManagement component to your admin dashboard:

```jsx
import ManagerScheduleManagement from './components/ManagerScheduleManagement';

function AdminDashboard() {
  return (
    <Box>
      <ManagerScheduleManagement />
    </Box>
  );
}
```

**Requirements:**
- User must have `time_off:approve` permission
- User must have `shift_swap:approve` permission
- JWT token in localStorage

**What It Does:**
- Lists all pending shift swaps
- Lists all pending time-off requests
- Shows active schedules
- Provides approve/deny buttons
- Supports bulk operations

---

### For Drivers

Add the DriverScheduleView component to driver dashboard:

```jsx
import DriverScheduleView from './components/DriverScheduleView';

function DriverDashboard() {
  const driverId = useContext(UserContext).userId; // or from localStorage
  
  return (
    <Box>
      <DriverScheduleView driverId={driverId} />
    </Box>
  );
}
```

**Requirements:**
- Must pass `driverId` prop
- JWT token in localStorage

**What It Does:**
- Shows upcoming shifts
- Lists pending swap requests
- Lists time-off requests
- Shows vacation balance
- Allows requesting swaps
- Allows requesting time-off

---

## File Structure

```
frontend/src/components/
├── ConflictModal.jsx (Phase 1)
├── ShiftSwapModal.jsx (Phase 1)
├── TimeOffRequestModal.jsx (Phase 1)
├── ManagerScheduleManagement.jsx (Phase 2)
└── DriverScheduleView.jsx (Phase 2)

backend/services/
└── scheduleConflictService.js (Phase 1)

backend/routes/
└── scheduleAdvanced.js (Phase 1 + Phase 2)
```

---

## Component Props Reference

### ManagerScheduleManagement

No props required. Component handles all state internally.

```jsx
<ManagerScheduleManagement />
```

**Uses These Endpoints:**
- GET /api/swap-requests/driver/all?type=all
- GET /api/time-off/requests/pending
- GET /api/schedules?limit=50&status=scheduled
- PATCH /api/swap-request/:swapId/admin-response
- PATCH /api/time-off/:timeOffId/respond

---

### DriverScheduleView

**Required Props:**

| Prop | Type | Description |
|------|------|-------------|
| driverId | string | MongoDB ObjectId of the driver |

```jsx
<DriverScheduleView driverId="65def456..." />
```

**Optional Props:**
- None (all state managed internally)

**Uses These Endpoints:**
- GET /api/schedules/driver/:driverId/range
- GET /api/vacation-balance/:driverId
- GET /api/swap-requests/driver/:driverId
- GET /api/time-off/driver/:driverId/requests
- GET /api/users?role=driver&limit=50
- POST /api/swap-request
- PATCH /api/swap-request/:swapId/driver-response
- POST /api/time-off/request

---

## API Endpoints Complete List

### Schedule Management
```javascript
GET /api/schedules/driver/:driverId/range
  // Query: startDate, endDate, status
  // Returns: { count, schedules[] }

POST /api/schedules/check-conflicts
  // Body: { driverId, startTime, duration, shiftId }
  // Returns: { hasConflicts, conflicts[], suggestedAlternativeDrivers[] }

GET /api/schedules/driver/:driverId/available-slots
  // Query: date, duration
  // Returns: { date, availableSlots[] }
```

### Shift Swaps
```javascript
POST /api/swap-request
  // Body: { requestingDriverId, targetDriverId, originalShiftId, proposedShiftId, reason, swapType }
  // Returns: ShiftSwap object

PATCH /api/swap-request/:swapId/driver-response
  // Body: { status: "accepted|declined", notes }
  // Returns: Updated ShiftSwap

PATCH /api/swap-request/:swapId/admin-response
  // Body: { status: "approved|denied", notes }
  // Returns: Updated ShiftSwap (with shifts reassigned if approved)

GET /api/swap-requests/driver/:driverId
  // Query: status, type (sent|received|all)
  // Returns: ShiftSwap[]

GET /api/swap-requests/all
  // Query: status
  // Returns: ShiftSwap[]
  // Permission: shift_swap:view
```

### Time-Off
```javascript
POST /api/time-off/request
  // Body: { driverId, type, startDate, endDate, reason }
  // Returns: TimeOff object

PATCH /api/time-off/:timeOffId/respond
  // Body: { status: "approved|denied", notes }
  // Returns: Updated TimeOff (balance deducted if vacation)
  // Permission: time_off:approve

GET /api/vacation-balance/:driverId
  // Returns: { total, used, available, year, ... }

GET /api/time-off/driver/:driverId/requests
  // Returns: TimeOff[]

GET /api/time-off/requests/pending
  // Returns: TimeOff[]
  // Permission: time_off:view
```

### Notifications
```javascript
POST /api/schedules/send-shift-reminders
  // Body: { hoursBeforeShift, sendEmail, sendSMS }
  // Returns: { sentCount, results[] }
  // Permission: admin
```

---

## Common Use Cases

### Use Case 1: Manager Reviews Swap Requests

```jsx
import ManagerScheduleManagement from './components/ManagerScheduleManagement';

function ManagerWorkspace() {
  return (
    <VStack spacing={4}>
      <Heading>Manager Workspace</Heading>
      <ManagerScheduleManagement />
    </VStack>
  );
}
```

**Expected Flow:**
1. Component loads and fetches all pending swaps
2. Manager sees list of swap requests
3. Manager clicks "Approve" or "Deny"
4. Toast notification shows result
5. List automatically refreshes
6. Drivers receive notifications (future implementation)

---

### Use Case 2: Driver Requests Shift Swap

```jsx
import DriverScheduleView from './components/DriverScheduleView';
import { useContext } from 'react';
import UserContext from './context/UserContext';

function DriverDashboard() {
  const { user } = useContext(UserContext);
  
  return (
    <DriverScheduleView driverId={user._id} />
  );
}
```

**Expected Flow:**
1. Driver sees their upcoming shifts
2. Clicks "Request Swap" on a shift
3. Modal opens to select another driver
4. Shift swap modal opens with reason field
5. Driver submits request
6. Request enters pending-driver status
7. Other driver gets notification (future implementation)
8. Manager reviews and approves/denies

---

### Use Case 3: Driver Requests Time-Off

```jsx
// Within DriverScheduleView
// or standalone:

import TimeOffRequestModal from './components/TimeOffRequestModal';
import { useDisclosure } from '@chakra-ui/react';

function TimeOffPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [vacationBalance, setVacationBalance] = useState(null);
  
  useEffect(() => {
    fetchVacationBalance();
  }, []);
  
  return (
    <>
      <Button onClick={onOpen}>Request Time-Off</Button>
      <TimeOffRequestModal
        isOpen={isOpen}
        onClose={onClose}
        driverId={driverId}
        vacationBalance={vacationBalance}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

---

## Error Handling

All components include built-in error handling with toast notifications:

```javascript
try {
  const response = await fetch(endpoint, options);
  if (!response.ok) throw new Error('Request failed');
  // ... process response
} catch (err) {
  toast({
    title: 'Error',
    description: err.message,
    status: 'error',
    duration: 5000
  });
}
```

**Expected Error Codes:**
- `400` - Bad request (invalid data)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (resource doesn't exist)
- `409` - Conflict (scheduling conflict)
- `500` - Server error

---

## Permission Matrix

### Manager Permissions Required
- `time_off:approve` - Approve/deny time-off requests
- `shift_swap:approve` - Approve/deny shift swaps
- `shift_swap:view` - View all swap requests
- `time_off:view` - View all time-off requests

### Driver Permissions Required
- Own driver record access
- Can only see their own shifts
- Can only request swaps for their shifts

---

## State Management Pattern

Both components use React hooks for state management:

```jsx
// ManagerScheduleManagement
const [swapRequests, setSwapRequests] = useState([]);
const [timeOffRequests, setTimeOffRequests] = useState([]);
const [schedules, setSchedules] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [filterStatus, setFilterStatus] = useState('all');

// DriverScheduleView
const [upcomingShifts, setUpcomingShifts] = useState([]);
const [vacationBalance, setVacationBalance] = useState(null);
const [swapRequests, setSwapRequests] = useState([]);
const [timeOffRequests, setTimeOffRequests] = useState([]);
const [loading, setLoading] = useState(false);
```

No external state management (Redux, Zustand) required. Use context if sharing state between pages:

```jsx
// Option 1: Context API
const ScheduleContext = createContext();
export const ScheduleProvider = ({ children }) => {
  const [schedules, setSchedules] = useState([]);
  return (
    <ScheduleContext.Provider value={{ schedules, setSchedules }}>
      {children}
    </ScheduleContext.Provider>
  );
};

// Option 2: Props drilling (simpler for this feature)
```

---

## Styling & Customization

All components use Chakra UI for styling:

```jsx
// Override colors in theme
const customTheme = {
  components: {
    Badge: {
      baseStyle: {
        borderRadius: 'full'
      }
    }
  },
  colors: {
    brand: {
      50: '#f5f5ff',
      // ... more colors
    }
  }
};

// Use in ChakraProvider
<ChakraProvider theme={customTheme}>
  <App />
</ChakraProvider>
```

Components respect user's color mode (light/dark):

```jsx
const bgColor = useColorModeValue('white', 'gray.800');
const textColor = useColorModeValue('gray.800', 'white');
```

---

## Mobile Responsiveness

Both components are fully responsive:

```jsx
// SimpleGrid respects screen size
<SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>

// Table uses overflow on mobile
<TableContainer>
  <Table size="sm"> {/* smaller on mobile */}

// Modal automatically adjusts
<Modal isOpen={isOpen} size={{ base: 'full', md: '2xl' }}>
```

Test on:
- Mobile (375px)
- Tablet (768px)
- Desktop (1024px+)

---

## Performance Optimization

### Current Optimizations
- Conditional rendering (prevent unnecessary renders)
- useCallback for event handlers
- Efficient array operations (filter, map)
- Pagination at 50 items
- Debounced search (ready for implementation)

### Future Optimizations
- Virtual scrolling for large lists
- Memoization with React.memo
- Code splitting with React.lazy
- Service worker for offline
- Image lazy loading
- API call caching

---

## Testing Strategy

### Unit Tests
```javascript
// Test component renders
describe('ManagerScheduleManagement', () => {
  test('renders with three tabs', () => {
    // ...
  });
});

// Test API calls
describe('API calls', () => {
  test('fetches swap requests on mount', () => {
    // ...
  });
});
```

### Integration Tests
```javascript
// Test full flow
describe('Swap approval flow', () => {
  test('manager can approve swap', () => {
    // 1. Load component
    // 2. Click approve button
    // 3. Verify API call
    // 4. Verify UI update
  });
});
```

### E2E Tests
```javascript
// Test with real API
describe('Manager dashboard E2E', () => {
  test('complete swap request workflow', () => {
    // Driver requests swap
    // Manager sees request
    // Manager approves
    // Shifts are swapped
  });
});
```

---

## Deployment Checklist

- [ ] Components added to project
- [ ] All imports resolved
- [ ] No console errors
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Permissions configured
- [ ] Performance tested
- [ ] Mobile tested
- [ ] Accessibility reviewed
- [ ] Documentation reviewed

---

## Troubleshooting

### Component Not Showing

**Problem:** Component renders blank  
**Solution:** Check if component is imported correctly and parent has min-height

```jsx
// Fix
<Box minH="100vh">
  <ManagerScheduleManagement />
</Box>
```

### API Errors 401 Unauthorized

**Problem:** Getting 401 errors on API calls  
**Solution:** Check if token is in localStorage and valid

```javascript
// Check token
console.log(localStorage.getItem('token'));

// Refresh if needed
fetchAuthToken();
```

### Modals Not Opening

**Problem:** Modal buttons don't open modals  
**Solution:** Verify useDisclosure hook is passed correctly

```jsx
const { isOpen, onOpen, onClose } = useDisclosure();
// Pass to modal: isOpen={isOpen} onClose={onClose}
```

### Data Not Refreshing

**Problem:** Data stays stale after action  
**Solution:** Manual refresh button or polling

```jsx
// Manual
<Button onClick={fetchAllData}>Refresh</Button>

// Polling (setInterval)
useEffect(() => {
  const interval = setInterval(fetchAllData, 30000); // 30s
  return () => clearInterval(interval);
}, []);
```

---

## Support & Next Steps

### For Questions
1. Check documentation in WORK_SCHEDULE_*.md files
2. Review API specification (WORK_SCHEDULE_API_SPEC.md)
3. Check component prop interfaces
4. Review example implementations above

### For Enhancements
1. Phase 3: Calendar views
2. Phase 3: Schedule templates
3. Phase 3: Email/SMS integration
4. Future: Real-time updates (WebSocket)
5. Future: Mobile app version

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 7, 2025 | Phase 1: Backend services, API routes, modal components |
| 2.0 | Dec 17, 2025 | Phase 2: Manager dashboard, driver schedule view |
| 3.0 | TBD | Phase 3: Calendar views, templates, integrations |

---

**Status:** ✅ Ready for Integration  
**Last Review:** December 17, 2025  
**Next Steps:** Integrate into main app and test E2E

