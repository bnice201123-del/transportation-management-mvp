# Cron Jobs Documentation

## Overview

The **Cron Job Service** (`backend/services/cronJobService.js`) is an automated task scheduler that handles time-based operations in the Transportation Management System. It uses the `node-cron` library to execute scheduled tasks at specific intervals.

## Table of Contents

- [Scheduled Jobs](#scheduled-jobs)
- [Job Configuration](#job-configuration)
- [Service Management](#service-management)
- [Manual Testing](#manual-testing)
- [Troubleshooting](#troubleshooting)
- [Customization](#customization)

---

## Scheduled Jobs

### 1. Shift Reminders

**Schedule:** Every 5 minutes  
**Cron Expression:** `*/5 * * * *`  
**Purpose:** Send reminders to drivers 1 hour before their shift starts

**Features:**
- Finds shifts starting in approximately 1 hour (within a 5-minute window)
- Sends dual-channel notifications (Email + SMS)
- Marks reminders as sent to prevent duplicates
- Only sends to scheduled or confirmed shifts

**Database Updates:**
```javascript
// Adds to Schedule model:
{
  reminderSent: true,
  reminderSentAt: Date
}
```

**Example Output:**
```
🔔 Running shift reminder job...
📨 Found 3 shifts needing reminders
✅ Reminder sent to John Doe (Email: true, SMS: true)
✅ Reminder sent to Jane Smith (Email: true, SMS: false)
✅ Reminder sent to Mike Johnson (Email: false, SMS: true)
✅ Shift reminder job completed
```

---

### 2. Expire Shift Swaps

**Schedule:** Daily at 2:00 AM  
**Cron Expression:** `0 2 * * *`  
**Purpose:** Automatically expire shift swap requests older than 48 hours

**Features:**
- Finds swap requests in "pending-driver" or "pending-admin" status
- Checks if request is older than 48 hours
- Updates status to "expired"
- Uses static method `ShiftSwap.expireOldRequests()`

**Example Output:**
```
⏰ Running shift swap expiration job...
✅ Expired 5 old shift swap requests
```

---

### 3. Vacation Carryover Expiration

**Schedule:** Daily at 3:00 AM  
**Cron Expression:** `0 3 * * *`  
**Purpose:** Expire unused vacation carryover days on April 1st

**Features:**
- Only executes on April 1st (month=3, day=1)
- Expires carryover vacation days for all drivers
- Sends email notification to affected drivers
- Adds history entry with type "expired"

**Email Template:**
```
Subject: Vacation Carryover Expired

Hi [FirstName],

5 unused carryover vacation days have expired as of April 1st.

Your current vacation balance: 12 days

Please plan your time off early this year to avoid future expirations.
```

**Example Output:**
```
📅 Running vacation carryover expiration job (April 1st)...
✅ Expired carryover days for 23 drivers
```

---

### 4. Calendar Sync

**Schedule:** Daily at 4:00 AM  
**Cron Expression:** `0 4 * * *`  
**Purpose:** Synchronize driver schedules to connected Google/Outlook calendars

**Features:**
- Finds users with enabled calendar integrations
- Syncs next 30 days of schedules
- Handles Google Calendar and Outlook Calendar separately
- Creates or updates calendar events based on schedule changes
- Error handling per user (one failure doesn't stop others)

**Sync Results:**
```javascript
{
  created: 5,  // New events created
  updated: 3,  // Existing events updated
  failed: 0    // Failed operations
}
```

**Example Output:**
```
📅 Running calendar sync job...
🔄 Syncing calendars for 15 users
  ✓ Google Calendar sync for John: 3 created, 2 updated
  ✓ Outlook Calendar sync for Jane: 5 created, 1 updated
  ✗ Google Calendar sync failed for mike@example.com: Token expired
✅ Calendar sync job completed
```

---

### 5. Coverage Gap Alerts

**Schedule:** Daily at 8:00 AM  
**Cron Expression:** `0 8 * * *`  
**Purpose:** Alert admins about staffing shortages in the next 7 days

**Features:**
- Scans next 7 days for coverage gaps
- Uses `Schedule.findCoverageGaps()` static method
- Sends alert to all active admin users
- Includes gap details (date, time, required drivers)

**Alert Email Format:**
```html
<h2>Coverage Gaps Detected</h2>
<p>The following time periods have insufficient driver coverage:</p>
<ul>
  <li><strong>Date:</strong> March 15, 2024 | <strong>Time:</strong> 6:00 AM - 8:00 AM | <strong>Gap:</strong> 2 drivers needed</li>
  <li><strong>Date:</strong> March 18, 2024 | <strong>Time:</strong> 3:00 PM - 5:00 PM | <strong>Gap:</strong> 1 driver needed</li>
</ul>
<p>Please adjust schedules or recruit additional drivers.</p>
```

**Example Output:**
```
🚨 Running coverage gap alert job...
⚠️  Found 3 coverage gaps
  ✓ Coverage gap alert sent to admin@company.com
  ✓ Coverage gap alert sent to manager@company.com
✅ Coverage gap alert job completed
```

---

### 6. Weekly Overtime Report

**Schedule:** Every Monday at 9:00 AM  
**Cron Expression:** `0 9 * * 1`  
**Purpose:** Send weekly overtime summary to admins

**Features:**
- Analyzes previous 7 days of overtime hours
- Groups by driver with totals
- Sorts by highest overtime first
- Sends formatted HTML email with table
- Only runs if overtime was recorded

**Report Format:**
| Driver | Total Overtime Hours | Number of Shifts |
|--------|---------------------|------------------|
| John Doe | 12.5 | 5 |
| Jane Smith | 8.0 | 3 |
| Mike Johnson | 4.5 | 2 |

**Total Overtime Hours:** 25.0

**Example Output:**
```
📊 Running weekly overtime report job...
📈 3 drivers with overtime this week
  ✓ Overtime report sent to admin@company.com
  ✓ Overtime report sent to manager@company.com
✅ Overtime report job completed
```

---

## Job Configuration

### Cron Expression Format

```
┌────────────── second (optional, not used)
│ ┌──────────── minute (0 - 59)
│ │ ┌────────── hour (0 - 23)
│ │ │ ┌──────── day of month (1 - 31)
│ │ │ │ ┌────── month (1 - 12)
│ │ │ │ │ ┌──── day of week (0 - 7) (Sunday = 0 or 7)
│ │ │ │ │ │
* * * * * *
```

### Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every 5 minutes | `*/5 * * * *` | Runs at :00, :05, :10, etc. |
| Daily at 2 AM | `0 2 * * *` | Runs at 02:00 every day |
| Weekly on Monday at 9 AM | `0 9 * * 1` | Runs every Monday at 09:00 |
| Every hour | `0 * * * *` | Runs at the top of every hour |
| Twice daily (6 AM, 6 PM) | `0 6,18 * * *` | Runs at 06:00 and 18:00 |

---

## Service Management

### Initialization

The cron service is automatically initialized when the server starts:

**backend/server.js:**
```javascript
import cronJobService from './services/cronJobService.js';

server.listen(PORT, () => {
  // ... other startup code
  
  try {
    cronJobService.init();
    console.log('✓ Cron job service started');
  } catch (error) {
    console.error('Failed to start cron job service:', error);
  }
});
```

### Graceful Shutdown

Cron jobs are stopped during server shutdown:

```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cronJobService.stopAll();
  // ... other cleanup
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  cronJobService.stopAll();
  // ... other cleanup
});
```

### Service Methods

#### `init()`
Initializes and starts all cron jobs.

```javascript
cronJobService.init();
// Output:
// 🕐 Initializing cron jobs...
//   ✓ Shift Reminders: Every 5 minutes
//   ✓ Expire Shift Swaps: Daily at 2:00 AM
//   ✓ Expire Vacation Carryover: Daily at 3:00 AM (April 1st only)
//   ✓ Calendar Sync: Daily at 4:00 AM
//   ✓ Coverage Gap Alerts: Daily at 8:00 AM
//   ✓ Weekly Overtime Report: Mondays at 9:00 AM
// ✅ 6 cron jobs scheduled
```

#### `stopAll()`
Stops all running cron jobs.

```javascript
cronJobService.stopAll();
// Output:
// 🛑 Stopping all cron jobs...
//   ✓ Stopped: Shift Reminders
//   ✓ Stopped: Expire Shift Swaps
//   ✓ Stopped: Expire Vacation Carryover
//   ✓ Stopped: Calendar Sync
//   ✓ Stopped: Coverage Gap Alerts
//   ✓ Stopped: Weekly Overtime Report
```

#### `getStatus()`
Returns the status of all scheduled jobs.

```javascript
const status = cronJobService.getStatus();
console.log(status);
// Output:
// [
//   { name: 'Shift Reminders', schedule: '*/5 * * * *', running: true },
//   { name: 'Expire Shift Swaps', schedule: '0 2 * * *', running: true },
//   { name: 'Expire Vacation Carryover', schedule: '0 3 * * *', running: true },
//   { name: 'Calendar Sync', schedule: '0 4 * * *', running: true },
//   { name: 'Coverage Gap Alerts', schedule: '0 8 * * *', running: true },
//   { name: 'Weekly Overtime Report', schedule: '0 9 * * 1', running: true }
// ]
```

---

## Manual Testing

### Test Individual Jobs

You can manually trigger jobs for testing:

**1. Create a test script:**

```javascript
// backend/test-cron.js
import cronJobService from './services/cronJobService.js';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCronJobs() {
  await connectDB();
  
  console.log('Testing Cron Jobs...\n');
  
  // Manually call job methods
  await cronJobService.scheduleShiftReminders();
  
  console.log('\nTest completed');
  process.exit(0);
}

testCronJobs();
```

**2. Run the test:**

```bash
node backend/test-cron.js
```

### Test Schedule with Mock Data

Create test schedules that will trigger reminders:

```javascript
import Schedule from './models/Schedule.js';
import User from './models/User.js';

// Create a schedule 1 hour in the future
const driver = await User.findOne({ role: 'driver' });
const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

await Schedule.create({
  driver: driver._id,
  startTime: oneHourFromNow,
  endTime: new Date(oneHourFromNow.getTime() + 8 * 60 * 60 * 1000),
  status: 'scheduled',
  shiftType: 'morning',
  reminderSent: false
});

// Wait 5 minutes for cron job to trigger
```

---

## Troubleshooting

### Issue: Cron jobs not running

**Possible Causes:**
1. Server not properly initialized
2. Error during `cronJobService.init()`
3. Database connection issues

**Solutions:**
```bash
# Check server logs for initialization errors
npm run start

# Look for:
# ✅ 6 cron jobs scheduled

# If missing, check for error messages
```

---

### Issue: Notifications not being sent

**Possible Causes:**
1. Missing environment variables (EMAIL_*, TWILIO_*)
2. Invalid credentials
3. Driver missing email/phone number

**Solutions:**
```bash
# Test notification service directly
node backend/test-notification.js

# Check environment variables
echo $EMAIL_HOST
echo $TWILIO_ACCOUNT_SID

# Verify driver has contact info
db.users.find({ email: { $exists: true }, phone: { $exists: true } })
```

---

### Issue: Calendar sync failing

**Possible Causes:**
1. Expired OAuth tokens
2. Missing calendar integration
3. API rate limits

**Solutions:**
```javascript
// Check user integration status
const user = await User.findById(userId).select('+integrations');
console.log(user.integrations.googleCalendar);

// Re-authenticate calendar
// User must visit /settings and reconnect calendar
```

---

### Issue: April 1st job not running

**Possible Causes:**
1. Server not running on April 1st
2. Job runs at 3 AM (check timezone)

**Solutions:**
```javascript
// Manually trigger for testing
const VacationBalance = require('./models/VacationBalance');
const year = new Date().getFullYear();
await VacationBalance.expireCarryovers(year);
```

---

## Customization

### Add a New Cron Job

**1. Add method to cronJobService.js:**

```javascript
scheduleCustomJob() {
  const job = cron.schedule('0 10 * * *', async () => {
    try {
      console.log('🔧 Running custom job...');
      
      // Your custom logic here
      
      console.log('✅ Custom job completed');
    } catch (error) {
      console.error('❌ Error in custom job:', error);
    }
  });

  this.jobs.push({ name: 'Custom Job', schedule: '0 10 * * *', job });
  console.log('  ✓ Custom Job: Daily at 10:00 AM');
}
```

**2. Register in `init()` method:**

```javascript
init() {
  console.log('🕐 Initializing cron jobs...');

  this.scheduleShiftReminders();
  this.scheduleExpireShiftSwaps();
  this.scheduleVacationCarryoverExpiration();
  this.scheduleCalendarSync();
  this.scheduleCoverageGapAlerts();
  this.scheduleOvertimeReports();
  this.scheduleCustomJob(); // Add here

  console.log(`✅ ${this.jobs.length} cron jobs scheduled`);
}
```

---

### Modify Job Schedule

**Change shift reminder frequency from 5 minutes to 10 minutes:**

```javascript
// Before:
const job = cron.schedule('*/5 * * * *', async () => {

// After:
const job = cron.schedule('*/10 * * * *', async () => {
```

**Update console log:**
```javascript
console.log('  ✓ Shift Reminders: Every 10 minutes');
```

---

### Disable a Job Temporarily

**Option 1: Comment out in init():**

```javascript
init() {
  console.log('🕐 Initializing cron jobs...');

  this.scheduleShiftReminders();
  this.scheduleExpireShiftSwaps();
  // this.scheduleVacationCarryoverExpiration(); // Disabled
  this.scheduleCalendarSync();
  this.scheduleCoverageGapAlerts();
  this.scheduleOvertimeReports();

  console.log(`✅ ${this.jobs.length} cron jobs scheduled`);
}
```

**Option 2: Environment Variable:**

```javascript
init() {
  console.log('🕐 Initializing cron jobs...');

  this.scheduleShiftReminders();
  
  if (process.env.ENABLE_CALENDAR_SYNC !== 'false') {
    this.scheduleCalendarSync();
  }
  
  // ... other jobs
}
```

**In .env:**
```
ENABLE_CALENDAR_SYNC=false
```

---

## Best Practices

### 1. Timezone Considerations

Cron jobs run in the server's timezone. Ensure your server is set to the correct timezone:

```bash
# Check server timezone
date

# Set timezone (Linux)
sudo timedatectl set-timezone America/New_York

# In Node.js
process.env.TZ = 'America/New_York';
```

### 2. Error Handling

All jobs should have comprehensive error handling:

```javascript
const job = cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🔧 Running job...');
    
    // Your logic here
    
  } catch (error) {
    console.error('❌ Error in job:', error);
    
    // Optional: Send alert to admins
    await notificationService.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'Cron Job Failure',
      text: `Job failed: ${error.message}`
    });
  }
});
```

### 3. Logging

Consider using a proper logging library:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/cron-jobs.log' })
  ]
});

// In cron job:
logger.info('Shift reminder job started');
logger.error('Job failed', { error: error.message, stack: error.stack });
```

### 4. Rate Limiting

Be mindful of API rate limits when making external calls:

```javascript
// Batch calendar syncs with delays
for (let i = 0; i < users.length; i++) {
  await syncUserCalendar(users[i]);
  
  // Wait 100ms between users to avoid rate limits
  if (i < users.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### 5. Monitoring

Set up monitoring to track job execution:

```javascript
const job = cron.schedule('*/5 * * * *', async () => {
  const startTime = Date.now();
  
  try {
    // Job logic
    
    const duration = Date.now() - startTime;
    console.log(`✅ Job completed in ${duration}ms`);
    
    // Send metrics to monitoring service
    // await metrics.record('job.duration', duration);
  } catch (error) {
    console.error('❌ Job failed');
  }
});
```

---

## Environment Variables

Required for cron jobs to function properly:

```env
# Email Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Notifications
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret

# Outlook Calendar
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret

# Admin Alert Email
ADMIN_EMAIL=admin@company.com

# Timezone (optional)
TZ=America/New_York
```

---

## Appendix: Job Summary

| Job Name | Schedule | Purpose | Models Used | Notifications |
|----------|----------|---------|-------------|---------------|
| **Shift Reminders** | Every 5 min | Send shift reminders | Schedule, User | Email, SMS |
| **Expire Shift Swaps** | Daily 2 AM | Expire old swaps | ShiftSwap | None |
| **Vacation Expiration** | Daily 3 AM | Expire carryover days (April 1) | VacationBalance, User | Email |
| **Calendar Sync** | Daily 4 AM | Sync to Google/Outlook | Schedule, User | None |
| **Coverage Gap Alerts** | Daily 8 AM | Alert about staffing gaps | Schedule, User | Email |
| **Overtime Report** | Mon 9 AM | Weekly overtime summary | Schedule, User | Email |

---

## Support

For additional help:
- Check server logs: `logs/cron-jobs.log`
- Review notification service documentation: `CALENDAR_NOTIFICATIONS_INTEGRATION.md`
- Test individual services: `backend/services/notificationService.js`
- Database queries: Use MongoDB Compass or CLI to inspect collections

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Transportation Management System Team
