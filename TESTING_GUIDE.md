# Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing all Phase 2 features including calendar integration, notifications, cron jobs, and the notification settings UI.

---

## Prerequisites

### 1. Backend Setup

**Start the backend server:**
```bash
cd backend
npm run dev
```

**Verify services started:**
```
✓ Departure monitoring service started
✓ Unassigned trip monitoring service started
✓ Driver progress monitoring service started
✓ Security alerting service started
🕐 Initializing cron jobs...
✅ 6 cron jobs scheduled
✓ Cron job service started
MongoDB Connected
```

### 2. Frontend Setup

**Start the frontend:**
```bash
cd frontend
npm run dev
```

**Access the app:**
- Open browser: `http://localhost:5173`

### 3. Test User Credentials

Use existing test users or create new ones via admin registration:

**Admin User:**
- Email: `admin@example.com`
- Password: (your admin password)

**Driver User:**
- Email: `driver@example.com`
- Password: (your driver password)

---

## Test 1: Notification Settings UI

### Access the Component

**Option A: Via Route (if configured)**
```
Navigate to: http://localhost:5173/settings/notifications
```

**Option B: Via Code**

Add route to `frontend/src/App.jsx`:
```jsx
import NotificationSettings from './components/shared/NotificationSettings';

// In your routes
<Route path="/settings/notifications" element={<NotificationSettings />} />
```

### Test Steps

#### 1. Contact Information

**Test Email Field:**
```
1. Enter email: "test@example.com"
2. Click "Test Email"
3. Check backend logs for email attempt:
   ✓ Look for: "Test email sent to test@example.com"
4. Check your email inbox (if SMTP configured)
```

**Test SMS Field:**
```
1. Enter phone: "+15551234567"
2. Click "Test SMS"
3. Check backend logs for SMS attempt:
   ✓ Look for: "Test SMS sent to +15551234567"
   ⚠️  If Twilio not configured: "SMS functionality will be simulated"
4. Check your phone (if Twilio configured)
```

**Expected Results:**
- ✅ Email field accepts valid email
- ✅ Phone field accepts E.164 format (+1XXXXXXXXXX)
- ✅ Test buttons trigger API calls
- ✅ Toast notification shows success/error
- ✅ Backend logs show test notification attempts

#### 2. Notification Preferences

**Test Toggle Switches:**
```
1. Expand "Shift Reminders" accordion
2. Toggle "Enable Shift Reminders" - should turn off all sub-options
3. Toggle back on
4. Toggle "Email Notifications" - should enable/disable independently
5. Toggle "SMS Notifications" - should enable/disable independently
```

**Test Timing Selection:**
```
1. In "Shift Reminders" section
2. Change "Remind me before shift" dropdown
3. Select: 15 minutes, 30 minutes, 1 hour, 2 hours, 4 hours
4. Each selection should update state
```

**Test All Notification Types:**
- [ ] Shift Reminders
- [ ] Time-Off Approvals
- [ ] Time-Off Denials
- [ ] Shift Swap Requests
- [ ] Overtime Alerts
- [ ] Coverage Gap Alerts (Admin only)
- [ ] Schedule Changes
- [ ] Calendar Sync Status

#### 3. Save and Persist

**Test Save Functionality:**
```
1. Make several changes to preferences
2. Click "Save Preferences"
3. Check toast notification: "Settings saved"
4. Refresh the page (F5)
5. Verify all changes persisted
```

**API Request:**
```bash
# Check Network tab in browser DevTools
PUT /api/users/notification-preferences
Status: 200 OK
Response: { "success": true, "message": "Notification preferences updated successfully" }
```

**Expected Results:**
- ✅ Save button triggers PUT request
- ✅ Success toast appears
- ✅ Preferences persist after page refresh
- ✅ Backend logs show update activity

---

## Test 2: Calendar Integration

### Prerequisites

Follow `OAUTH_SETUP_GUIDE.md` to configure:
- Google Calendar OAuth credentials
- Outlook Calendar OAuth credentials

### Test Google Calendar OAuth

#### 1. Start OAuth Flow

**Via Browser:**
```
GET http://localhost:3001/api/calendar/google/auth
```

**What Happens:**
1. Backend generates OAuth URL
2. Redirects to Google consent screen
3. User authorizes calendar access
4. Google redirects back to callback URL

**Expected Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

#### 2. Complete OAuth Flow

**After Authorization:**
```
1. User clicks "Allow" on Google consent screen
2. Redirected to: http://localhost:3001/api/calendar/google/callback?code=...
3. Backend exchanges code for tokens
4. Stores tokens in User model
5. Redirects to: http://localhost:5173/settings?calendar=google&status=success
```

**Verify in Database:**
```javascript
// MongoDB Compass or CLI
db.users.findOne({ email: "your-email@example.com" }, {
  "integrations.googleCalendar": 1
})

// Should show:
{
  integrations: {
    googleCalendar: {
      enabled: true,
      accessToken: "ya29.xxx...",
      refreshToken: "1//xxx...",
      expiryDate: 1234567890,
      lastSync: ISODate("2024-...")
    }
  }
}
```

#### 3. Test Calendar Sync

**Manual Sync:**
```bash
# Create a test schedule first (via scheduler dashboard)
# Then trigger sync:
POST http://localhost:3001/api/calendar/google/sync
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "startDate": "2024-12-08",
  "endDate": "2024-12-15"
}
```

**Expected Response:**
```json
{
  "success": true,
  "created": 5,
  "updated": 2,
  "failed": 0
}
```

**Verify in Google Calendar:**
1. Open Google Calendar in browser
2. Check for events matching your schedules
3. Events should have:
   - Title: "Shift: [ShiftType]"
   - Time: Matching schedule start/end
   - Description: Vehicle info, location

### Test Outlook Calendar OAuth

**Same process as Google:**
```
1. GET /api/calendar/outlook/auth
2. Authorize on Microsoft consent screen
3. Callback receives tokens
4. POST /api/calendar/outlook/sync
5. Verify events in Outlook Calendar
```

---

## Test 3: Notification Service

### Test Email Notifications

#### 1. Configure SMTP (if not already done)

**Update backend/.env:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### 2. Test Direct Email

**Create test script:**
```javascript
// backend/test-email.js
import notificationService from './services/notificationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  const result = await notificationService.sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email from Transportation System',
    html: '<h1>Test Email</h1><p>This is a test.</p>',
    text: 'Test Email\n\nThis is a test.'
  });
  
  console.log('Result:', result);
}

testEmail();
```

**Run test:**
```bash
node backend/test-email.js
```

**Expected Output:**
```
Result: { success: true }
```

#### 3. Test Notification Types

**Test via API:**
```bash
# Shift Reminder
POST http://localhost:3001/api/users/test-notification
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "channel": "email"
}
```

**Check Email Inbox:**
- Subject: "Test Notification - Transportation System"
- Body: Shows your name and test message

### Test SMS Notifications

#### 1. Configure Twilio

**Update backend/.env:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567
```

#### 2. Test Direct SMS

**Create test script:**
```javascript
// backend/test-sms.js
import notificationService from './services/notificationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSMS() {
  const result = await notificationService.sendSMS({
    to: '+15559876543', // Your phone number
    body: 'Test SMS from Transportation System'
  });
  
  console.log('Result:', result);
}

testSMS();
```

**Run test:**
```bash
node backend/test-sms.js
```

**Expected Output:**
```
Result: { success: true }
```

**Check Phone:**
- SMS from your Twilio number
- Message: "Test SMS from Transportation System"

---

## Test 4: Cron Jobs

### Monitor Cron Job Execution

**Check Backend Logs:**
```bash
# In terminal running backend server
# Watch for cron job execution messages
```

### Test Individual Jobs

#### 1. Shift Reminders (Every 5 minutes)

**Setup:**
```
1. Login as driver
2. Navigate to scheduler
3. Create a schedule starting 1 hour from now
4. Set status: "scheduled"
5. Save schedule
```

**Wait for Cron:**
```
After 5 minutes, check logs:
🔔 Running shift reminder job...
📨 Found 1 shifts needing reminders
✅ Reminder sent to John Doe (Email: true, SMS: true)
✅ Shift reminder job completed
```

**Verify:**
- [ ] Check email inbox for shift reminder
- [ ] Check phone for SMS reminder
- [ ] Schedule should have `reminderSent: true` in database

#### 2. Expire Shift Swaps (Daily at 2 AM)

**Manual Test:**
```javascript
// backend/test-cron-manual.js
import ShiftSwap from './models/ShiftSwap.js';
import connectDB from './config/database.js';

async function testExpireSwaps() {
  await connectDB();
  
  // Create old swap request
  await ShiftSwap.create({
    requestingDriver: 'DRIVER_ID',
    targetDriver: 'OTHER_DRIVER_ID',
    originalShift: 'SCHEDULE_ID',
    status: 'pending-driver',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  });
  
  // Run expiration
  const result = await ShiftSwap.expireOldRequests();
  console.log('Expired:', result.modifiedCount);
}

testExpireSwaps();
```

#### 3. Vacation Carryover Expiration (April 1st)

**Manual Test:**
```javascript
// Set date to April 1st for testing
// Or wait until April 1st to verify
// Check logs on April 1st at 3 AM
```

#### 4. Calendar Sync (Daily at 4 AM)

**Manual Trigger:**
```bash
# Make API call directly
POST http://localhost:3001/api/calendar/google/sync
Authorization: Bearer YOUR_JWT_TOKEN
```

**Or wait until 4 AM and check logs:**
```
📅 Running calendar sync job...
🔄 Syncing calendars for 15 users
  ✓ Google Calendar sync for John: 3 created, 2 updated
  ✓ Outlook Calendar sync for Jane: 5 created, 1 updated
✅ Calendar sync job completed
```

#### 5. Coverage Gap Alerts (Daily at 8 AM)

**Setup:**
```
1. Create schedules for the next week
2. Leave some time slots unassigned
3. Wait until 8 AM or manually trigger
```

**Expected:**
```
🚨 Running coverage gap alert job...
⚠️  Found 3 coverage gaps
  ✓ Coverage gap alert sent to admin@company.com
✅ Coverage gap alert job completed
```

#### 6. Weekly Overtime Report (Mondays at 9 AM)

**Setup:**
```
1. Create schedules with overtime hours
2. Complete schedules with actualEndTime > endTime
3. Wait until Monday 9 AM
```

**Expected Email:**
```
Subject: Weekly Overtime Report - Dec 8, 2024
Body: Table showing drivers and overtime hours
```

---

## Test 5: End-to-End Workflows

### Workflow 1: Driver Shift with Notifications

**Steps:**
```
1. Admin creates schedule for driver (1 hour from now)
2. Driver receives shift reminder (via cron job after 5 min)
3. Driver checks email/SMS
4. Driver clocks in via dashboard
5. Driver completes shift
6. If overtime: Admin receives overtime alert
7. Schedule syncs to Google/Outlook calendar
```

**Verification:**
- [ ] Shift reminder email received
- [ ] Shift reminder SMS received
- [ ] Calendar event created in Google Calendar
- [ ] Calendar event created in Outlook Calendar
- [ ] Overtime alert sent (if applicable)

### Workflow 2: Time-Off Request

**Steps:**
```
1. Driver submits time-off request
2. Admin reviews and approves
3. Driver receives approval notification (email/SMS)
4. Vacation balance updated
5. Schedule conflicts checked
```

**Verification:**
- [ ] Approval email received
- [ ] Approval SMS received (if enabled)
- [ ] Vacation balance decreased
- [ ] Calendar updated

### Workflow 3: Shift Swap

**Steps:**
```
1. Driver A offers shift for swap
2. Driver B receives notification
3. Driver B accepts swap
4. Admin approves swap
5. Both drivers receive confirmation
6. Calendars updated for both drivers
```

**Verification:**
- [ ] Swap request notification sent
- [ ] Approval notifications sent
- [ ] Schedules updated in database
- [ ] Both calendars updated

---

## Test 6: Sidebar Navigation

### Access Work Schedule Menu

**Test Desktop:**
```
1. Login as any role
2. Look for sidebar on left
3. Find "Work Schedule" section with clock icon
4. Click to expand
5. Should show 4 sub-items
```

**Test Mobile:**
```
1. Login on mobile device or resize browser
2. Click hamburger menu
3. Find "Work Schedule" in drawer
4. Click to expand
5. Should show sub-items
```

**Verify Menu Items:**
- [ ] Schedule Calendar → `/schedule/calendar`
- [ ] Time Off Requests → `/schedule/time-off`
- [ ] Shift Swaps → `/schedule/shift-swaps`
- [ ] Templates → `/schedule/templates` (Scheduler/Admin only)

**Role-Based Display:**
```
Driver: Shows 3 items (no Templates)
Scheduler: Shows all 4 items
Admin: Shows all 4 items
Dispatcher: Shows 3 items (no Templates)
```

---

## Test 7: User Preferences Integration

### Test Notification Filtering

**Setup:**
```
1. Login as driver
2. Go to Notification Settings
3. Disable SMS for "Shift Reminders"
4. Keep Email enabled
5. Save preferences
```

**Create Test Scenario:**
```
1. Create schedule 1 hour from now
2. Wait for shift reminder cron (5 min)
3. Check notifications
```

**Expected Result:**
- ✅ Email received
- ❌ SMS NOT received (disabled in preferences)

**Check Backend Logs:**
```
✅ Reminder sent to John Doe (Email: true, SMS: false)
```

---

## Troubleshooting

### Issue: Backend won't start

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
netstat -ano | Select-String ":3001"

# Kill process (Windows)
taskkill /F /PID <PID>

# Or use different port
# In backend/.env:
PORT=3002
```

### Issue: OAuth redirect not working

**Error:** Redirect URI mismatch

**Solution:**
```
1. Check GOOGLE_REDIRECT_URI in .env matches Google Console
2. Should be: http://localhost:3001/api/calendar/google/callback
3. Update in Google Console if different
4. Same for Outlook
```

### Issue: Email not sending

**Check:**
```
1. SMTP credentials correct in .env
2. Gmail: Use app password, not regular password
3. Check backend logs for errors
4. Try test email script
```

### Issue: SMS not sending

**Check:**
```
1. Twilio credentials correct
2. Phone number in E.164 format (+1XXXXXXXXXX)
3. Trial account: Phone must be verified in Twilio
4. Check Twilio logs in console
```

### Issue: Cron jobs not running

**Check:**
```
1. Backend logs show: "✅ 6 cron jobs scheduled"
2. Server timezone correct (TZ environment variable)
3. MongoDB connection working
4. No errors in backend logs
```

### Issue: Calendar sync failing

**Check:**
```
1. OAuth tokens not expired
2. User has calendar integration enabled
3. Google/Outlook API limits not exceeded
4. Check calendar service logs
```

---

## Testing Checklist

### Phase 1: Setup
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Test users created

### Phase 2: UI Components
- [ ] Notification Settings page accessible
- [ ] Contact info fields editable
- [ ] Test email button works
- [ ] Test SMS button works
- [ ] All 8 notification types visible
- [ ] Toggle switches functional
- [ ] Save button persists changes

### Phase 3: OAuth Integration
- [ ] Google Calendar OAuth flow completes
- [ ] Outlook Calendar OAuth flow completes
- [ ] Tokens stored in database
- [ ] Manual sync creates events
- [ ] Events visible in calendars

### Phase 4: Notifications
- [ ] Email configuration working
- [ ] SMS configuration working (or simulated)
- [ ] Test notifications send successfully
- [ ] User preferences respected

### Phase 5: Cron Jobs
- [ ] All 6 jobs initialized on startup
- [ ] Shift reminders execute every 5 minutes
- [ ] Logs show job execution
- [ ] Notifications sent based on schedules

### Phase 6: Navigation
- [ ] Work Schedule menu visible in sidebar
- [ ] 4 sub-items present
- [ ] Role-based filtering works
- [ ] Routes navigate correctly

### Phase 7: Integration
- [ ] End-to-end shift workflow
- [ ] End-to-end time-off workflow
- [ ] End-to-end shift swap workflow
- [ ] Preferences affect notifications
- [ ] Calendar syncs automatically

---

## Performance Testing

### Load Testing

**Test Concurrent Users:**
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 http://localhost:3001/api/users/notification-preferences
```

**Monitor:**
- Response times
- Memory usage
- CPU usage
- Database connections

### Cron Job Performance

**Monitor:**
```
1. Check execution time in logs
2. Monitor database query performance
3. Check notification delivery times
4. Verify no job overlaps
```

---

## Security Testing

### Test Authentication

**Unauthorized Access:**
```bash
# Should fail with 401
curl http://localhost:3001/api/users/notification-preferences

# Should succeed with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/users/notification-preferences
```

### Test Authorization

**Role-Based Access:**
```
1. Login as driver
2. Try to access admin-only coverage gap alerts
3. Should not be visible in UI
4. API should reject if called directly
```

### Test Data Validation

**Invalid Input:**
```bash
# Test invalid email
PUT /api/users/notification-preferences
{ "email": "invalid-email" }
# Should return 400 error

# Test invalid phone
PUT /api/users/notification-preferences
{ "phone": "123" }
# Should return 400 error
```

---

## Documentation

**Reference Documents:**
- `OAUTH_SETUP_GUIDE.md` - OAuth configuration
- `CRON_JOBS_DOCUMENTATION.md` - Cron job details
- `NOTIFICATION_SETTINGS_UI.md` - UI component guide
- `CALENDAR_NOTIFICATIONS_INTEGRATION.md` - Integration details

---

## Next Steps After Testing

1. **Fix Bugs**: Address any issues found during testing
2. **Optimize Performance**: Improve slow operations
3. **Add More Tests**: Unit tests, integration tests
4. **User Acceptance Testing**: Get feedback from real users
5. **Production Deployment**: Deploy to staging/production

---

**Happy Testing!** 🚀

If you encounter issues, check the backend logs first, then review the relevant documentation.
