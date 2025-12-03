# Work Schedule Modal Feature - Implementation Guide

## Overview
This feature implements a comprehensive Work Schedule Modal system that allows users to view their work history, track earnings, manage time-off requests, and monitor attendance. The system is mobile-friendly and designed to work seamlessly on iPhone, iPad, and desktop devices.

## Feature Components

### 1. Backend Implementation

#### Models Created

**TimeOffRequest.js** (`backend/models/TimeOffRequest.js`)
- Manages time-off requests with approval workflow
- Fields:
  - `userId`: Reference to User
  - `startDate`, `endDate`: Date range for time off
  - `reason`: Optional explanation
  - `status`: pending/approved/denied
  - `reviewedBy`: Admin/dispatcher who reviewed
  - `reviewedAt`: Review timestamp
  - `reviewNotes`: Admin feedback
- Features:
  - Automatic duration calculation
  - Overlap detection for approved requests
  - Indexed for efficient querying

**WorkSchedule.js** (`backend/models/WorkSchedule.js`)
- Tracks daily work records for each user
- Fields:
  - `userId`: Reference to User
  - `date`: Work date
  - `clockIn`, `clockOut`: Time stamps
  - `hoursWorked`: Auto-calculated from clock times
  - `status`: scheduled/worked/missed/time-off/holiday
  - `tripsCompleted`: Number of trips
  - `earnings`: Daily earnings
  - `notes`: Additional information
- Features:
  - Auto-calculates hours from clock-in/clock-out
  - Static method `getWorkSummary()` for period analysis
  - Unique compound index on userId + date

#### Routes Created

**workSchedule.js** (`backend/routes/workSchedule.js`)

**Endpoints:**

1. **GET /api/work-schedule/:userId/summary**
   - Get work schedule summary for a user
   - Query params: `startDate`, `endDate` (optional, defaults to current month)
   - Returns: Total hours, earnings, days worked/missed, daily records
   - Authorization: User can view own, admin/dispatcher/scheduler can view all

2. **GET /api/work-schedule/:userId/records**
   - Get detailed work schedule records
   - Query params: `startDate`, `endDate`, `status`
   - Returns: Array of work schedule records
   - Authorization: Same as summary

3. **POST /api/work-schedule/:userId/records**
   - Create or update work schedule record
   - Body: `date`, `clockIn`, `clockOut`, `status`, `tripsCompleted`, `earnings`, `notes`
   - Authorization: Admin/dispatcher/scheduler only

4. **GET /api/work-schedule/:userId/time-off**
   - Get time-off requests for a user
   - Query params: `status` (optional filter)
   - Returns: Array of time-off requests
   - Authorization: User can view own, admin/dispatcher/scheduler can view all

5. **POST /api/work-schedule/:userId/time-off**
   - Create new time-off request
   - Body: `startDate`, `endDate`, `reason`
   - Features: Validates dates, checks for overlaps
   - Authorization: User can only request for themselves

6. **PATCH /api/work-schedule/time-off/:requestId**
   - Approve or deny time-off request
   - Body: `status` (approved/denied), `reviewNotes`
   - Features: Updates work schedule records on approval
   - Authorization: Admin/dispatcher/scheduler only

7. **GET /api/work-schedule/time-off/pending**
   - Get all pending time-off requests
   - Returns: Array of pending requests with user details
   - Authorization: Admin/dispatcher/scheduler only

### 2. Frontend Implementation

#### Components Created

**WorkScheduleModal.jsx** (`frontend/src/components/shared/WorkScheduleModal.jsx`)

**Features:**
- **Overview Tab:**
  - Statistics cards showing:
    - Hours Worked (with days worked)
    - Days Missed (with scheduled days)
    - Earnings (current period total)
  - Missed Days Details section with dates and reasons
  - Daily Records table with last 10 entries
  
- **Time Off Tab:**
  - Request Time Off form:
    - Start date picker (min: today)
    - End date picker (min: start date)
    - Reason textarea (optional, 500 char limit)
    - Submit button
  - Time-Off Requests History:
    - Visual cards for each request
    - Status badges (pending/approved/denied)
    - Review notes display
    - Request date tracking

**UI/UX Features:**
- Fully responsive (mobile, tablet, desktop)
- Tab-based organization
- Loading states with spinners
- Error handling with toast notifications
- Success feedback
- Mobile-friendly date pickers
- Touch-friendly buttons (48px minimum)

**WorkScheduleButton.jsx** (`frontend/src/components/shared/WorkScheduleButton.jsx`)
- Reusable button component to trigger Work Schedule Modal
- Props: `userId`, `userName`, `variant`, `size`, `colorScheme`
- Includes calendar icon
- Opens modal on click

**TimeOffManagement.jsx** (`frontend/src/components/admin/TimeOffManagement.jsx`)

**Features:**
- Admin/dispatcher dashboard for reviewing time-off requests
- Table view showing:
  - Employee name and email
  - Role badges
  - Date range
  - Duration (calculated days)
  - Reason
  - Request date
  - Review action button
  
- Review Modal:
  - Employee details
  - Date range with duration badge
  - Reason display
  - Review notes textarea
  - Approve/Deny buttons
  - Validation (notes required for denial)
  
- Auto-refresh after actions
- Empty state for no pending requests
- Loading states

### 3. Integration Points

#### Updated Files

**server.js** (`backend/server.js`)
- Added `workScheduleRoutes` import
- Mounted at `/api/work-schedule`

**App.jsx** (`frontend/src/App.jsx`)
- Added `TimeOffManagement` component import
- Added route: `/admin/time-off`
- Protected route for admin/dispatcher/scheduler roles

**ComprehensiveDriverDashboard.jsx** (`frontend/src/components/driver/ComprehensiveDriverDashboard.jsx`)
- Added `WorkScheduleButton` import
- Added button to Profile tab next to "Edit Profile"
- Passes current user ID and name

## Usage Guide

### For Drivers/Staff

**Viewing Work Schedule:**
1. Navigate to your profile page
2. Click "Work Schedule" button
3. View Overview tab for:
   - Total hours worked this period
   - Days missed
   - Current earnings
   - Daily breakdown

**Requesting Time Off:**
1. Click "Work Schedule" button
2. Switch to "Time Off" tab
3. Select start and end dates
4. Optionally provide a reason
5. Click "Submit Request"
6. Request will appear in history as "pending"
7. You'll be notified when reviewed

### For Admins/Dispatchers/Schedulers

**Reviewing Time-Off Requests:**
1. Navigate to `/admin/time-off` or click Time-Off Management link
2. View all pending requests in table
3. Click "Review" on any request
4. Review employee details and dates
5. Add review notes (required for denial)
6. Click "Approve" or "Deny"
7. Employee will see status update in their modal

**Managing Work Schedules:**
- Use API endpoints to:
  - Create schedule records for staff
  - Update clock-in/clock-out times
  - Mark days as worked/missed
  - Record earnings and trips completed

## API Examples

### Request Time Off
```javascript
POST /api/work-schedule/64abc123def456/time-off
{
  "startDate": "2025-12-10",
  "endDate": "2025-12-12",
  "reason": "Family vacation"
}
```

### Get Work Summary
```javascript
GET /api/work-schedule/64abc123def456/summary?startDate=2025-12-01&endDate=2025-12-31

Response:
{
  "user": {
    "id": "64abc123def456",
    "name": "John Driver",
    "email": "john@example.com",
    "role": "driver"
  },
  "period": {
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalHours": 168.5,
    "totalEarnings": 2520.00,
    "daysWorked": 22,
    "daysMissed": 2,
    "daysScheduled": 24,
    "missedDays": [
      {
        "date": "2025-12-05T00:00:00.000Z",
        "notes": "No show"
      }
    ],
    "records": [...]
  }
}
```

### Approve Time-Off Request
```javascript
PATCH /api/work-schedule/time-off/64def789abc123
{
  "status": "approved",
  "reviewNotes": "Approved. Enjoy your time off!"
}
```

## Mobile Responsiveness

### iPhone/iPad Optimization
- Full-screen modal on mobile devices
- Touch-friendly buttons (48px minimum)
- Responsive date pickers
- Scrollable content within modal
- Stacked layout for statistics on small screens
- Larger text for readability
- Tabbed navigation for better organization

### Breakpoints
- Mobile: base (< 768px) - Full width, stacked layout
- Tablet: md (768px - 991px) - Partial width, some side-by-side
- Desktop: lg (> 992px) - Full features, optimal layout

## Security Considerations

### Authorization Rules
1. **View Schedule:** Users can view their own, admins/dispatchers/schedulers can view all
2. **Request Time Off:** Users can only request for themselves
3. **Review Requests:** Only admins/dispatchers/schedulers can approve/deny
4. **Create Records:** Only admins/dispatchers/schedulers can create/update work records

### Data Validation
- Date ranges validated (start before end)
- Overlap detection prevents double-booking time off
- Maximum field lengths enforced
- Status transitions validated
- Required fields enforced

## Database Indexes

### TimeOffRequest
- `userId` (index)
- `status` (index)
- `userId + startDate + endDate` (compound)
- `status + requestedAt` (compound, for sorting pending)

### WorkSchedule
- `userId + date` (unique compound)
- `userId + status + date` (compound, for filtering)

## Future Enhancements

### Potential Features
1. **Recurring Schedules:** Set weekly schedules for staff
2. **Shift Management:** Define and assign shifts
3. **Overtime Tracking:** Automatic overtime calculation
4. **PTO Balance:** Track available time-off hours
5. **Team Calendar:** Visual calendar showing all staff schedules
6. **Export Reports:** Download work schedule reports
7. **Mobile App:** Dedicated mobile app for clock-in/out
8. **Geofencing:** Verify location for clock-in
9. **Break Tracking:** Track breaks during shifts
10. **Notifications:** Email/SMS for time-off approvals
11. **Payroll Integration:** Export data for payroll systems
12. **Department Scheduling:** Manage schedules by department

### Performance Optimizations
- Pagination for large record sets
- Caching of frequently accessed summaries
- Aggregation pipeline for complex reports
- Background jobs for summary calculations

## Testing Checklist

### Backend Testing
- [ ] Create time-off request
- [ ] Approve time-off request
- [ ] Deny time-off request
- [ ] Check overlap detection
- [ ] Get work summary with date range
- [ ] Create work schedule record
- [ ] Update work schedule record
- [ ] Test authorization rules
- [ ] Test validation (invalid dates, etc.)
- [ ] Test with no data (empty states)

### Frontend Testing
- [ ] Open Work Schedule Modal
- [ ] View Overview tab with data
- [ ] View Time Off tab
- [ ] Submit time-off request
- [ ] View request in history
- [ ] Test on iPhone (Safari)
- [ ] Test on iPad (Safari)
- [ ] Test on Android phone
- [ ] Test on desktop browsers
- [ ] Test form validation
- [ ] Test error states
- [ ] Test loading states
- [ ] Navigate admin time-off page
- [ ] Review and approve request
- [ ] Review and deny request

### Integration Testing
- [ ] End-to-end: Request → Approve → Verify in schedule
- [ ] End-to-end: Request → Deny → Verify status
- [ ] Clock-in → Calculate hours → Verify earnings
- [ ] Multiple overlapping requests
- [ ] Cross-role authorization
- [ ] Real-time updates (if WebSocket added)

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing MongoDB connection and JWT authentication.

### Database Migration
No migration needed. Models will create collections on first use. Consider:
```javascript
// Optional: Seed script to backfill work schedules
// backend/scripts/seedWorkSchedules.js
```

### Dependencies
All dependencies already in project:
- mongoose (MongoDB)
- express (API)
- @chakra-ui/react (UI components)
- @heroicons/react (icons)
- axios (HTTP client)

## Support & Maintenance

### Common Issues

**"No data showing in modal"**
- Check if work schedule records exist for the user
- Verify date range (defaults to current month)
- Check browser console for API errors

**"Time-off request failed"**
- Verify dates are in future
- Check for overlapping approved requests
- Ensure user is authenticated

**"Can't approve time-off request"**
- Verify user has admin/dispatcher/scheduler role
- Check if request already reviewed
- Review notes required for denials

### Monitoring
- Track failed time-off requests
- Monitor average approval time
- Alert on high number of pending requests
- Track usage patterns

---

**Implementation Date:** December 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Ready for Testing  
**Routes:** 7 API endpoints, 2 frontend routes, 3 new components  
**Mobile-Ready:** ✅ Yes (iPhone, iPad, Android)
