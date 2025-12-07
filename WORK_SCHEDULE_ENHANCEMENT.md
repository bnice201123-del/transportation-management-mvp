# Work Schedule Modal Enhancement - Implementation Guide

## Overview
This enhancement adds two new tabs to the existing Work Schedule Modal:
1. **Work Week Tab** - Displays a read-only weekly schedule (Sunday-Saturday) showing shift times and hours
2. **Admin Tab** - Allows administrators to create/edit employee schedules and manage time-off requests

## Changes Made

### 1. Backend Implementation

#### New Model: WeeklySchedule.js
**Location:** `backend/models/WeeklySchedule.js`

**Features:**
- Stores weekly schedules (Sunday-Saturday) for each employee
- Tracks shift times in HH:MM format (24-hour)
- Auto-calculates hours per day and total weekly hours
- Supports recurring schedules (repeats weekly)
- One schedule per user (unique constraint on userId)

**Schema Structure:**
```javascript
{
  userId: ObjectId (ref: User, unique),
  schedule: [
    {
      dayOfWeek: Number (0-6, 0=Sunday),
      isWorkDay: Boolean,
      shiftStart: String (HH:MM),
      shiftEnd: String (HH:MM),
      hoursScheduled: Number (auto-calculated)
    }
  ],
  weeklyHours: Number (auto-calculated total),
  isRecurring: Boolean,
  effectiveDate: Date,
  notes: String
}
```

**Key Methods:**
- `getScheduleWithTimeOff(userId, weekStart)` - Static method that returns weekly schedule integrated with approved time-off requests
- Pre-save hook automatically calculates hours for each day and total weekly hours
- Handles overnight shifts (e.g., 10 PM to 6 AM)

#### New Routes: weeklySchedule.js
**Location:** `backend/routes/weeklySchedule.js`

**Endpoints:**

1. **GET /api/weekly-schedule/:userId**
   - Get weekly schedule with time-off integration
   - Query params: `weekStart` (optional, defaults to current week's Sunday)
   - Returns: Array of 7 days with schedule details and time-off markers
   - Authorization: User can view own, admin/dispatcher/scheduler can view all
   - Integrates with TimeOffRequest model to show "time-off" status for approved requests

2. **POST /api/weekly-schedule/:userId**
   - Create or update weekly schedule (admin only)
   - Body: `schedule` (array), `isRecurring`, `effectiveDate`, `notes`
   - Creates default 7-day schedule if not provided
   - Authorization: Admin/dispatcher/scheduler only
   - Logs activity via audit system

3. **PATCH /api/weekly-schedule/:userId/days**
   - Update specific days in schedule (admin only)
   - Body: `dayUpdates` (array of { dayOfWeek, isWorkDay, shiftStart, shiftEnd })
   - Authorization: Admin/dispatcher/scheduler only

4. **DELETE /api/weekly-schedule/:userId**
   - Delete weekly schedule (admin only)
   - Authorization: Admin only

5. **GET /api/weekly-schedule/all/schedules**
   - Get all users' schedules (admin only)
   - Returns: Array of schedules with populated user data
   - Authorization: Admin/dispatcher/scheduler only

**Integration in server.js:**
```javascript
import weeklyScheduleRoutes from './routes/weeklySchedule.js';
app.use('/api/weekly-schedule', weeklyScheduleRoutes);
```

### 2. Frontend Implementation

#### Enhanced Component: WorkScheduleModal.jsx
**Location:** `frontend/src/components/shared/WorkScheduleModal.jsx`

**New State Variables:**
- `weeklySchedule` - Stores fetched weekly schedule data
- `scheduleData` - Stores editable schedule data for admin tab
- `editMode` - Controls admin schedule edit mode
- `pendingTimeOffRequests` - Stores pending requests for admin review
- `reviewingRequest` - Tracks which request is being reviewed
- `reviewNotes` - Admin notes for time-off approval/denial

**New Features:**
1. Uses `useAuth()` hook to get current user and check admin role
2. Fetches weekly schedule on modal open
3. Initializes default 7-day schedule for admin tab
4. Implements schedule editing with real-time hour calculation
5. Implements time-off request review workflow

**Tab Structure (4 tabs total):**
1. **Overview** (existing) - Statistics and daily records
2. **Work Week** (NEW) - Read-only weekly schedule
3. **Time Off** (existing) - Request and view time-off history
4. **Admin** (NEW - admin only) - Manage schedules and review requests

### 3. Work Week Tab Details

**Features:**
- Displays 7-day table (Sunday through Saturday)
- Shows current week by default
- Columns: Day name, Date, Shift Time, Hours, Status
- Footer row shows total weekly hours
- Integrates approved time-off (shows "Time Off" instead of shift times)
- Visual distinction for time-off days (blue background)
- Shows notes if admin added any
- Falls back to helpful message if no schedule exists

**Visual Status Badges:**
- **Scheduled** (green) - Regular work day
- **Time Off** (blue) - Approved time off
- **Off** (gray) - Non-work day

**Time-Off Integration:**
- Fetches approved time-off requests for the week
- Overlays time-off on scheduled work days
- Reduces total weekly hours when time-off is present
- Shows "Time Off" text in shift time column
- Adds blue background to time-off rows

**Example Display:**
```
┌─────────┬──────────┬─────────────┬───────┬──────────┐
│ Day     │ Date     │ Shift Time  │ Hours │ Status   │
├─────────┼──────────┼─────────────┼───────┼──────────┤
│ Sunday  │ Dec 8    │ Off         │ -     │ off      │
│ Monday  │ Dec 9    │ 06:00-14:00 │ 8.0   │ scheduled│
│ Tuesday │ Dec 10   │ Time Off    │ -     │ time-off │
│ Wed     │ Dec 11   │ 08:00-16:00 │ 8.0   │ scheduled│
│ Thu     │ Dec 12   │ 08:00-16:00 │ 8.0   │ scheduled│
│ Friday  │ Dec 13   │ 08:00-16:00 │ 8.0   │ scheduled│
│ Sat     │ Dec 14   │ Off         │ -     │ off      │
├─────────┴──────────┴─────────────┼───────┴──────────┤
│ Total Weekly Hours              │ 32.0             │
└─────────────────────────────────┴──────────────────┘
```

### 4. Admin Tab Details

**Two Main Sections:**

#### A. Manage Schedule Section
**Features:**
- View current schedule for the selected employee
- Edit/Create schedule with visual editor
- Toggle work days with checkboxes
- Set shift start/end times with time pickers
- Real-time hour calculation as times change
- Save button commits changes to database
- Cancel button reverts changes

**Edit Mode:**
- Click "Edit Schedule" button to enable editing
- Checkboxes become active (toggle work day on/off)
- Time pickers become active (set shift times)
- Hours auto-calculate when times change
- "Save" button commits changes via API
- "Cancel" button discards changes and exits edit mode

**Table Structure:**
```
┌──────────┬──────────┬─────────────┬───────────┬───────┐
│ Day      │ Work Day │ Shift Start │ Shift End │ Hours │
├──────────┼──────────┼─────────────┼───────────┼───────┤
│ Sunday   │ □        │ 09:00       │ 17:00     │ -     │
│ Monday   │ ☑        │ 06:00       │ 14:00     │ 8.0   │
│ Tuesday  │ ☑        │ 06:00       │ 14:00     │ 8.0   │
│ Wed      │ ☑        │ 08:00       │ 16:00     │ 8.0   │
│ Thu      │ ☑        │ 08:00       │ 16:00     │ 8.0   │
│ Friday   │ ☑        │ 08:00       │ 16:00     │ 8.0   │
│ Sat      │ □        │ 09:00       │ 17:00     │ -     │
├──────────┴──────────┴─────────────┴───────────┼───────┤
│ Total Weekly Hours                           │ 40.0  │
└──────────────────────────────────────────────┴───────┘
```

#### B. Time-Off Request Management Section
**Features:**
- Lists all pending time-off requests for the employee
- Shows request date range and reason
- Click "Review Request" to expand review form
- Add review notes (optional for approval, recommended for denial)
- Approve or Deny with single click
- Updates immediately refresh data
- Shows success/error toast notifications

**Review Workflow:**
1. Click "Review Request" on any pending request
2. Review form expands showing:
   - Date range
   - Requested date
   - Reason (if provided)
   - Text area for admin notes
3. Choose action:
   - **Approve** - Green button with check icon
   - **Deny** - Red button with X icon
   - **Cancel** - Close review form without action
4. On approval:
   - Request status changes to "approved"
   - Work schedule records updated for those dates (status: time-off)
   - Employee sees updated status in their Time Off tab
   - Work Week tab shows "Time Off" for those days
5. On denial:
   - Request status changes to "denied"
   - Review notes shown to employee
   - No schedule changes made

**Request Card Display:**
```
┌─────────────────────────────────────────────────┐
│ 📅 Dec 10 - Dec 12                   [Pending]  │
│ Requested Dec 7, 2025                           │
│                                                 │
│ Reason: Family vacation                         │
│                                                 │
│ [Review Request]                                │
└─────────────────────────────────────────────────┘

// When reviewing:
┌─────────────────────────────────────────────────┐
│ 📅 Dec 10 - Dec 12                   [Pending]  │
│ Requested Dec 7, 2025                           │
│                                                 │
│ Reason: Family vacation                         │
│                                                 │
│ Review Notes:                                   │
│ ┌─────────────────────────────────────────┐   │
│ │ [Text area for admin notes...]          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [✓ Approve]  [✗ Deny]  [Cancel]               │
└─────────────────────────────────────────────────┘
```

### 5. Integration Points

**Time-Off and Weekly Schedule Integration:**
- `WeeklySchedule.getScheduleWithTimeOff()` method handles integration
- Fetches approved time-off requests for the specified week
- Overlays time-off on scheduled days
- Sets `hasTimeOff: true` for affected days
- Zeroes out hours for time-off days
- Recalculates total weekly hours excluding time-off
- Returns unified schedule object with all data

**Approval Flow:**
1. Admin approves time-off request in Admin tab
2. Backend updates `TimeOffRequest` status to "approved"
3. Backend updates `WorkSchedule` records for date range (status: "time-off")
4. Frontend refreshes all data
5. Work Week tab immediately shows "Time Off" for those days
6. Total weekly hours automatically reduced
7. Overview tab shows time-off in daily records

### 6. Authorization & Security

**Role-Based Access:**
- **Employees:**
  - View Overview tab (own data only)
  - View Work Week tab (own schedule only)
  - View Time Off tab (own requests only)
  - Submit time-off requests
  - Cannot see Admin tab
  
- **Admins/Dispatchers/Schedulers:**
  - View all 4 tabs for any employee
  - Create/edit weekly schedules
  - Review and approve/deny time-off requests
  - Delete schedules (admins only)
  - View all employees' schedules

**Backend Authorization Checks:**
- All routes validate user role via `authenticateToken` middleware
- Read operations: User can access own data, admins can access all
- Write operations: Only admin/dispatcher/scheduler roles
- Delete operations: Admin only

### 7. Mobile Responsiveness

**Design Considerations:**
- Modal size: `full` on mobile, `3xl` on desktop
- Tables use `overflowX="auto"` for horizontal scrolling
- Compact table size (`sm`) for better mobile fit
- Touch-friendly buttons and inputs
- Stacked form layouts on mobile
- Responsive grid layouts (1 column mobile, 3 columns desktop)

### 8. User Experience Features

**Visual Feedback:**
- Loading spinners during data fetch
- Toast notifications for all actions
- Color-coded status badges
- Disabled inputs when not in edit mode
- Loading states on buttons during submission
- Success/error messages for all operations

**Smart Defaults:**
- Week starts on Sunday
- Default shift times: 9 AM - 5 PM
- All days initially set to "off"
- Recurring schedule enabled by default
- Current date as effective date

**Helpful Messages:**
- "No weekly schedule set yet" when schedule doesn't exist
- "Contact administrator" guidance for employees
- "No pending requests" when queue is empty
- Descriptive error messages

### 9. Data Flow

**Employee Viewing Schedule:**
```
User opens modal
  → Frontend fetches 3 data sources in parallel:
    1. Work schedule summary (Overview tab)
    2. Time-off requests (Time Off tab)
    3. Weekly schedule (Work Week tab)
  → Weekly schedule endpoint:
    - Gets WeeklySchedule for user
    - Gets approved TimeOffRequest for current week
    - Merges data (time-off overlays schedule)
    - Returns unified 7-day schedule
  → Frontend displays in Work Week tab
```

**Admin Creating Schedule:**
```
Admin opens Admin tab
  → Frontend initializes default 7-day schedule
  → Admin clicks "Edit Schedule"
  → Admin toggles work days and sets times
  → Hours auto-calculate on each change
  → Admin clicks "Save"
  → POST /api/weekly-schedule/:userId
    - Backend validates times
    - Creates WeeklySchedule document
    - Auto-calculates hours via pre-save hook
    - Returns saved schedule
  → Frontend shows success toast
  → Frontend refreshes all data
  → Work Week tab now shows schedule
```

**Admin Approving Time-Off:**
```
Admin clicks "Review Request"
  → Review form expands
  → Admin adds notes (optional)
  → Admin clicks "Approve"
  → PATCH /api/work-schedule/time-off/:requestId
    - Backend updates request status
    - Backend updates WorkSchedule records for date range
    - Backend logs activity
  → Frontend shows success toast
  → Frontend refreshes data
  → Work Week tab shows "Time Off" for those days
  → Employee sees "Approved" status in Time Off tab
```

### 10. API Response Examples

**GET /api/weekly-schedule/:userId**
```json
{
  "schedule": [
    {
      "date": "2025-12-08T00:00:00.000Z",
      "dayOfWeek": 0,
      "dayName": "Sunday",
      "isWorkDay": false,
      "shiftStart": null,
      "shiftEnd": null,
      "hoursScheduled": 0,
      "hasTimeOff": false,
      "status": "off"
    },
    {
      "date": "2025-12-09T00:00:00.000Z",
      "dayOfWeek": 1,
      "dayName": "Monday",
      "isWorkDay": true,
      "shiftStart": "06:00",
      "shiftEnd": "14:00",
      "hoursScheduled": 8.0,
      "hasTimeOff": false,
      "status": "scheduled"
    },
    {
      "date": "2025-12-10T00:00:00.000Z",
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "isWorkDay": false,
      "shiftStart": null,
      "shiftEnd": null,
      "hoursScheduled": 0,
      "hasTimeOff": true,
      "status": "time-off"
    }
    // ... 4 more days
  ],
  "totalWeeklyHours": 32.0,
  "baseWeeklyHours": 40.0,
  "userId": "64abc123def456",
  "isRecurring": true,
  "effectiveDate": "2025-12-01T00:00:00.000Z",
  "notes": null
}
```

**POST /api/weekly-schedule/:userId (Request)**
```json
{
  "schedule": [
    {
      "dayOfWeek": 0,
      "isWorkDay": false,
      "shiftStart": "09:00",
      "shiftEnd": "17:00"
    },
    {
      "dayOfWeek": 1,
      "isWorkDay": true,
      "shiftStart": "06:00",
      "shiftEnd": "14:00"
    }
    // ... 5 more days
  ],
  "isRecurring": true,
  "effectiveDate": "2025-12-01",
  "notes": "New driver schedule"
}
```

### 11. Testing Checklist

#### Backend Testing
- [ ] Create weekly schedule for new user
- [ ] Update existing weekly schedule
- [ ] Fetch schedule with time-off integration
- [ ] Delete weekly schedule
- [ ] Test authorization (employee trying to access admin endpoints)
- [ ] Test hour calculation (normal and overnight shifts)
- [ ] Test time-off overlay logic
- [ ] Test with overlapping time-off requests
- [ ] Test with no schedule (returns 404)

#### Frontend Testing
- [ ] Employee views Work Week tab (read-only)
- [ ] Admin views Admin tab (editable)
- [ ] Admin creates new schedule
- [ ] Admin edits existing schedule
- [ ] Hours calculate correctly on time change
- [ ] Toggle work day on/off
- [ ] Save schedule successfully
- [ ] Cancel edit mode (discards changes)
- [ ] View pending time-off requests
- [ ] Review and approve time-off
- [ ] Review and deny time-off
- [ ] Verify Work Week updates after approval
- [ ] Test mobile responsiveness
- [ ] Test with no schedule (shows helpful message)
- [ ] Test with no pending requests (shows empty state)

#### Integration Testing
- [ ] End-to-end: Create schedule → View in Work Week tab
- [ ] End-to-end: Request time off → Approve → See in Work Week
- [ ] End-to-end: Edit schedule → Save → Verify changes
- [ ] Verify total hours calculation with time-off
- [ ] Cross-role: Employee cannot access admin features
- [ ] Real-time: Approve time-off, employee sees immediately

### 12. Known Limitations & Future Enhancements

**Current Limitations:**
- One schedule per user (cannot have different schedules for different weeks)
- No schedule templates or bulk operations
- No schedule history or versioning
- Admin cannot view multiple employees' schedules simultaneously
- No schedule conflict detection

**Future Enhancement Ideas:**
1. **Schedule Templates:** Save common schedules (e.g., "Day Shift", "Night Shift")
2. **Bulk Operations:** Set schedule for multiple employees at once
3. **Schedule Variants:** Different schedules for different weeks (e.g., rotating shifts)
4. **Calendar View:** Visual calendar showing all employees' schedules
5. **Conflict Detection:** Warn if scheduling overlaps with existing assignments
6. **Notification System:** Notify employee when schedule changes
7. **Schedule History:** Track schedule changes over time
8. **CSV Export:** Export schedules for payroll systems
9. **Mobile App:** Native mobile interface for schedule viewing
10. **Shift Swapping:** Allow employees to swap shifts with approval

### 13. Files Modified/Created

**New Files:**
- `backend/models/WeeklySchedule.js` (217 lines)
- `backend/routes/weeklySchedule.js` (219 lines)

**Modified Files:**
- `backend/server.js` - Added weeklySchedule routes import and mount
- `frontend/src/components/shared/WorkScheduleModal.jsx` - Added 2 new tabs and admin functionality

**Total Lines Added:** ~650 lines
**Total Files Changed:** 4 files

### 14. Dependencies

**Backend:**
- mongoose (existing)
- express (existing)
- Existing auth middleware
- Existing audit logging system

**Frontend:**
- @chakra-ui/react (existing)
- @heroicons/react (existing)
- axios (existing)
- React hooks (existing)

**No new dependencies required.**

### 15. Deployment Notes

1. **Database Migration:** WeeklySchedule collection will be created automatically on first use
2. **Backward Compatibility:** Existing Work Schedule modal continues to work (Overview and Time Off tabs)
3. **Gradual Rollout:** Admins can create schedules for employees gradually
4. **No Breaking Changes:** Feature is additive, no existing functionality removed

### 16. Support & Troubleshooting

**Common Issues:**

**"No weekly schedule found" message**
- Normal for users without a schedule yet
- Admin needs to create schedule in Admin tab
- Not an error condition

**"Not authorized" errors**
- Check user role (must be admin/dispatcher/scheduler for admin features)
- Verify token is valid
- Check backend logs for authorization failures

**Hours not calculating**
- Ensure shift times are in HH:MM format
- Check for invalid time ranges (end before start)
- Overnight shifts are supported (e.g., 22:00 to 06:00)

**Time-off not showing in Work Week**
- Verify time-off request is "approved" status
- Check date range matches current week
- Refresh modal to fetch latest data

**Schedule not saving**
- Check for validation errors in console
- Ensure at least one day is marked as work day
- Verify shift times are valid
- Check network tab for API errors

---

**Implementation Date:** December 7, 2025  
**Version:** 2.0  
**Status:** ✅ Complete and Ready for Testing  
**API Endpoints:** 5 new endpoints  
**Components:** 2 new tabs, enhanced modal  
**Mobile-Ready:** ✅ Yes (responsive design)  
**Authorization:** ✅ Role-based access control
