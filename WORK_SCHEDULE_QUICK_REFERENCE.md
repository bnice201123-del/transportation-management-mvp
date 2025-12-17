# Work Schedule Features - Quick Reference Guide

## For Developers

### Using Conflict Detection Service

```javascript
import ScheduleConflictService from '../services/scheduleConflictService.js';

// Check all conflicts for a shift
const conflicts = await ScheduleConflictService.checkAllConflicts(
  driverId,
  {
    startTime: new Date('2025-12-15T08:00:00Z'),
    duration: 8
  }
);

if (conflicts.hasConflicts) {
  console.log('Conflicts found:', conflicts.conflicts);
  
  // Get alternative drivers
  const alternatives = await ScheduleConflictService.findAlternativeDrivers(
    driverId,
    shift,
    5 // max results
  );
}
```

### API Endpoint Examples

#### Check Conflicts Before Creating Schedule
```javascript
// Frontend
const response = await fetch('/api/schedules/check-conflicts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: '65abc123...',
    startTime: '2025-12-15T08:00:00Z',
    duration: 8,
    shiftId: '65def456...' // optional, for updates
  })
});

const report = await response.json();
// Response: {
//   hasConflicts: true,
//   conflicts: [{type, description, severity, ...}],
//   suggestedAlternativeDrivers: [{...}]
// }
```

#### Create Shift Swap Request
```javascript
const response = await fetch('/api/swap-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestingDriverId: 'driver1',
    targetDriverId: 'driver2',
    originalShiftId: 'shift1',
    proposedShiftId: 'shift2', // optional
    reason: 'Need to attend family event',
    swapType: 'mutual' // one-way, mutual, or cover
  })
});
```

#### Request Time Off
```javascript
const response = await fetch('/api/time-off/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: 'driver1',
    type: 'vacation', // vacation, sick, personal, unpaid, other
    startDate: '2025-12-20',
    endDate: '2025-12-25',
    reason: 'Family vacation'
  })
});

// Response includes:
// {
//   _id: '...',
//   status: 'pending',
//   totalDays: 6,
//   conflicts: [] // any scheduled shifts during this period
// }
```

#### Check Vacation Balance
```javascript
const response = await fetch('/api/vacation-balance/driver1', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const balance = await response.json();
// Response: {
//   _id: '...',
//   total: 20,
//   used: 5,
//   available: 15,
//   year: 2025
// }
```

---

## For Frontend Developers

### Integrating ConflictModal

```jsx
import { useDisclosure } from '@chakra-ui/react';
import ConflictModal from './ConflictModal';
import { useState } from 'react';

function ScheduleCreationForm() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [conflicts, setConflicts] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  const handleCreateSchedule = async (scheduleData) => {
    // Check for conflicts first
    const response = await fetch('/api/schedules/check-conflicts', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
    
    const report = await response.json();
    
    if (report.hasConflicts) {
      setConflicts(report.conflicts);
      setAlternatives(report.suggestedAlternativeDrivers);
      onOpen();
    } else {
      // Create schedule directly
      createSchedule(scheduleData);
    }
  };

  const handleSelectAlternative = (driver) => {
    // Create schedule with alternative driver
    createSchedule({...scheduleData, driver: driver.driverId});
  };

  return (
    <>
      {/* Your form */}
      
      <ConflictModal
        isOpen={isOpen}
        onClose={onClose}
        conflicts={conflicts}
        suggestedAlternatives={alternatives}
        onSelectAlternative={handleSelectAlternative}
        onOverride={() => createSchedule(scheduleData)}
      />
    </>
  );
}
```

### Integrating ShiftSwapModal

```jsx
import ShiftSwapModal from './ShiftSwapModal';

function DriverDashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedShift, setSelectedShift] = useState(null);

  const handleRequestSwap = async (shift, targetDriver) => {
    setSelectedShift(shift);
    onOpen();
  };

  const handleSubmitSwap = async (swapData) => {
    const response = await fetch('/api/swap-request', {
      method: 'POST',
      body: JSON.stringify({
        requestingDriverId: currentDriver._id,
        targetDriverId: selectedShift.targetDriver._id,
        originalShiftId: selectedShift._id,
        ...swapData
      })
    });

    if (response.ok) {
      // Show success message
      onClose();
    }
  };

  return (
    <>
      <ShiftSwapModal
        isOpen={isOpen}
        onClose={onClose}
        requestingDriver={currentDriver}
        targetDriver={selectedShift?.targetDriver}
        originalShift={selectedShift}
        onSubmit={handleSubmitSwap}
      />
    </>
  );
}
```

### Integrating TimeOffRequestModal

```jsx
import TimeOffRequestModal from './TimeOffRequestModal';

function DriverSchedulePage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [vacationBalance, setVacationBalance] = useState(null);

  useEffect(() => {
    // Fetch vacation balance
    fetch(`/api/vacation-balance/${currentDriver._id}`)
      .then(r => r.json())
      .then(setVacationBalance);
  }, []);

  const handleSubmitTimeOff = async (timeOffData) => {
    const response = await fetch('/api/time-off/request', {
      method: 'POST',
      body: JSON.stringify({
        driverId: currentDriver._id,
        ...timeOffData
      })
    });

    if (response.ok) {
      // Show success message
      onClose();
      // Refresh vacation balance
      fetchVacationBalance();
    }
  };

  return (
    <>
      <TimeOffRequestModal
        isOpen={isOpen}
        onClose={onClose}
        driverId={currentDriver._id}
        vacationBalance={vacationBalance}
        onSubmit={handleSubmitTimeOff}
      />
    </>
  );
}
```

---

## For Managers/Admins

### Approving Shift Swap Requests

**Via API:**
```javascript
// Manager approves shift swap
const response = await fetch('/api/swap-request/swapId123/admin-response', {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'approved', // or 'denied'
    notes: 'Approved - coverage confirmed'
  })
});

// Both drivers' shifts are swapped automatically if approved
```

### Approving Time-Off Requests

**Via API:**
```javascript
const response = await fetch('/api/time-off/timeOffId123/respond', {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'approved', // or 'denied'
    notes: 'Approved. Coverage arranged.'
  })
});

// Vacation balance is automatically deducted if vacation type
```

### Sending Shift Reminders

**Via API:**
```javascript
const response = await fetch('/api/schedules/send-shift-reminders', {
  method: 'POST',
  body: JSON.stringify({
    hoursBeforeShift: 24,
    sendEmail: true,
    sendSMS: true
  })
});

// Returns: { sentCount: 42, results: [{...}] }
```

---

## Common Scenarios

### Scenario 1: Driver Can't Work a Shift
1. Driver opens "Request Swap" for their shift
2. Selects target driver (or "cover request" to open to all)
3. Enters reason in ShiftSwapModal
4. Manager receives notification
5. If target driver accepts, manager approves
6. Shifts are automatically swapped

### Scenario 2: Driver Needs Vacation
1. Driver opens "Request Time Off"
2. Selects dates in TimeOffRequestModal
3. System checks conflicts with scheduled shifts
4. Shows if conflicts exist and vacation balance
5. Manager reviews and approves/denies
6. Balance automatically updated if approved

### Scenario 3: Manager Creating Schedule
1. Manager enters shift details
2. System checks conflicts automatically
3. If conflicts, shows ConflictModal with alternatives
4. Manager can:
   - Select alternative driver (no conflicts)
   - Override and create anyway (manager approval)
5. Shift created with audit trail

### Scenario 4: Checking Driver Availability
1. Manager calls GET /api/schedules/driver/:id/available-slots
2. System returns free time slots for the day
3. Can then create schedules without conflicts
4. Improves scheduling efficiency

---

## Error Codes & Status Codes

### Shift Swap Statuses
- `pending-driver` - Waiting for target driver response
- `pending-admin` - Driver accepted, waiting for manager approval
- `approved` - Swap completed
- `denied` - Manager denied
- `cancelled` - Driver cancelled

### Time-Off Statuses
- `pending` - Waiting for manager approval
- `approved` - Approved and deducted from balance
- `denied` - Manager denied with reason

### Conflict Severities
- `critical` - Schedule cannot be created (e.g., same exact time)
- `high` - Significant issue (e.g., < 8 hour break)
- `medium` - Moderate concern (e.g., high weekly hours)
- `low` - Minor issue (informational)

---

## Testing Checklist

- [ ] Conflict detection catches overlapping shifts
- [ ] Break time enforcement (11 hour minimum)
- [ ] Weekly hour limit enforcement (60 hours)
- [ ] Vacation balance prevents over-allocation
- [ ] Shift swap approval updates both shifts
- [ ] Alternative drivers suggested correctly
- [ ] Audit logging records all actions
- [ ] Permission checks work (admin/manager only)
- [ ] Time-off conflicts detected
- [ ] Modal validations work correctly

---

## Common Issues & Solutions

**Issue:** Conflicts not detected  
**Solution:** Ensure schedules are in database, check date/time formats match

**Issue:** Alternative drivers not showing  
**Solution:** Check other drivers exist and have no conflicts

**Issue:** Balance not updating after approval  
**Solution:** Check VacationBalance model has pre-save hook

**Issue:** Shift swap stuck in pending-driver  
**Solution:** Check target driver is responding, may need timeout logic

**Issue:** Too many reminders sent  
**Solution:** Add idempotency key to prevent duplicate sends

