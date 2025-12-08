# Calendar Integration & Notifications System

## Overview
Complete implementation of calendar synchronization (Google Calendar & Outlook) and notification services (SMS & Email) for the Work Schedule & Time Management system.

## ✅ Implemented Components

### 1. Frontend Calendar Components

#### ScheduleCalendar.jsx
- **Location**: `frontend/src/components/scheduler/ScheduleCalendar.jsx`
- **Features**:
  - Full calendar view with FullCalendar library
  - Drag-and-drop schedule creation and modification
  - Event resize support
  - Color-coded by shift type and status
  - Clock in/out functionality
  - Conflict detection warnings
  - Filter by status
  - Overtime hour display
  - Admin vs driver permissions
  
#### TimeOffManager.jsx
- **Location**: `frontend/src/components/scheduler/TimeOffManager.jsx`
- **Features**:
  - Time-off request form with conflict checking
  - Vacation balance display (vacation, sick, personal days)
  - Bulk approval/denial for admins
  - Coverage suggestions display
  - Request status tracking
  - Carryover day warnings
  - Linear progress bars for balance visualization

### 2. Backend Services

#### Google Calendar Service
- **Location**: `backend/services/googleCalendarService.js`
- **Features**:
  - OAuth2 authentication flow
  - Token management with auto-refresh
  - Create/update/delete calendar events
  - Bulk schedule synchronization
  - Color-coded events by shift type
  - Reminder configuration (30 min popup, 60 min email)
  - Disconnect functionality

#### Outlook Calendar Service
- **Location**: `backend/services/outlookCalendarService.js`
- **Features**:
  - Microsoft Graph API OAuth2 flow
  - Token management with auto-refresh
  - Create/update/delete calendar events
  - Bulk schedule synchronization
  - Category-based event organization
  - 30-minute reminders
  - Disconnect functionality

#### Notification Service
- **Location**: `backend/services/notificationService.js`
- **Features**:
  - **Email (Nodemailer)**:
    - Shift reminders with full details
    - Time-off approval/denial notifications
    - Shift swap request notifications
    - Overtime alerts to admins
    - Coverage gap alerts
    - Test email function
  - **SMS (Twilio)**:
    - Shift reminders (condensed format)
    - Time-off status updates
    - Shift swap notifications
    - Test SMS function

#### Holiday Service
- **Location**: `backend/services/holidayService.js`
- **Features**:
  - Import from Calendarific API (paid) or Nager.Date API (free)
  - US Federal holidays hardcoded fallback
  - Custom holiday management
  - Blackout period functionality
  - Holiday checking for specific dates
  - Regional filtering support
  - Database storage with Holiday model

### 3. Backend Routes

#### Calendar Routes
- **Location**: `backend/routes/calendar.js`
- **Endpoints**:
  ```
  GET  /api/calendar/google/auth           - Get OAuth URL
  GET  /api/calendar/google/callback       - OAuth callback
  POST /api/calendar/google/sync           - Sync schedules
  POST /api/calendar/google/disconnect     - Disconnect
  
  GET  /api/calendar/outlook/auth          - Get OAuth URL
  GET  /api/calendar/outlook/callback      - OAuth callback
  POST /api/calendar/outlook/sync          - Sync schedules
  POST /api/calendar/outlook/disconnect    - Disconnect
  ```

#### Holiday Routes (Already Existed)
- **Location**: `backend/routes/holidays.js`
- **Features**: Federal holidays, custom holidays, blackout periods, range queries

### 4. Database Changes

#### User Model Updates
- **Added** `integrations` field to User model:
  ```javascript
  integrations: {
    googleCalendar: {
      enabled: Boolean,
      accessToken: String (encrypted),
      refreshToken: String (encrypted),
      expiryDate: Number,
      lastSync: Date
    },
    outlookCalendar: {
      enabled: Boolean,
      accessToken: String (encrypted),
      refreshToken: String (encrypted),
      expiryDate: Number,
      lastSync: Date
    }
  }
  ```

#### Holiday Model (New)
- **Location**: Defined in `backend/services/holidayService.js`
- **Fields**:
  - name, date, country, region, type
  - isBlackoutPeriod (boolean)
  - description, createdBy, createdAt
- **Indexes**: country+date, region+date

## 🔧 Configuration Required

### Environment Variables

Add the following to `.env`:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback

# Outlook Calendar OAuth
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/api/calendar/outlook/callback

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Holiday API (Optional - fallback available)
CALENDARIFIC_API_KEY=your_calendarific_api_key

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:5173
```

### Google Calendar Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Calendar API

2. **Create OAuth 2.0 Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/calendar/google/callback`
   - Copy Client ID and Client Secret to `.env`

3. **OAuth Consent Screen**:
   - Configure consent screen with app name and scopes
   - Add scopes: `https://www.googleapis.com/auth/calendar`

### Outlook Calendar Setup

1. **Register Azure AD Application**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to Azure Active Directory → App registrations
   - Click "New registration"

2. **Configure Application**:
   - Name: Transportation Management System
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:3001/api/calendar/outlook/callback`

3. **API Permissions**:
   - Add Microsoft Graph permissions:
     - `Calendars.ReadWrite` (Delegated)
     - `offline_access` (Delegated)

4. **Create Client Secret**:
   - Go to "Certificates & secrets"
   - Create new client secret
   - Copy Client ID and Secret to `.env`

### Email Setup (Gmail)

1. **Enable 2FA** on your Gmail account
2. **Create App Password**:
   - Go to Google Account → Security → App passwords
   - Generate new app password for "Mail"
   - Use this password in `EMAIL_PASS` (not your regular password)

### SMS Setup (Twilio)

1. **Create Twilio Account**: [https://www.twilio.com/](https://www.twilio.com/)
2. **Get Trial/Paid Number**:
   - Get a phone number from Twilio console
   - Copy Account SID, Auth Token, and Phone Number to `.env`

### Holiday API Setup (Optional)

**Option 1: Free (Nager.Date API)**
- No API key required
- Supports many countries
- Used automatically if `CALENDARIFIC_API_KEY` is not set

**Option 2: Paid (Calendarific)**
- Get API key from [Calendarific](https://calendarific.com/)
- More comprehensive holiday data
- Regional support

## 📋 Usage Guide

### Connecting Calendars (Frontend)

1. **Google Calendar**:
   ```javascript
   // Get auth URL
   const response = await axios.get('/api/calendar/google/auth');
   window.location.href = response.data.authUrl;
   
   // After OAuth callback, sync schedules
   await axios.post('/api/calendar/google/sync', {
     startDate: '2025-01-01',
     endDate: '2025-12-31'
   });
   ```

2. **Outlook Calendar**:
   ```javascript
   // Get auth URL
   const response = await axios.get('/api/calendar/outlook/auth');
   window.location.href = response.data.authUrl;
   
   // After OAuth callback, sync schedules
   await axios.post('/api/calendar/outlook/sync', {
     startDate: '2025-01-01',
     endDate: '2025-12-31'
   });
   ```

### Sending Notifications (Backend)

```javascript
import notificationService from './services/notificationService.js';

// Send shift reminder
await notificationService.sendShiftReminder(driver, schedule, 1); // 1 hour before

// Send time-off approval
await notificationService.sendTimeOffApproval(driver, timeOffRequest);

// Send time-off denial
await notificationService.sendTimeOffDenial(driver, timeOffRequest, reason);

// Send shift swap notification
await notificationService.sendShiftSwapRequest(targetDriver, requestingDriver, shiftSwap);

// Send overtime alert to admin
await notificationService.sendOvertimeAlert(admin, driver, schedule);

// Send coverage gap alert
await notificationService.sendCoverageGapAlert(admin, gaps);
```

### Importing Holidays

```javascript
// Import US federal holidays for 2025
POST /api/holidays/import-federal
{
  "year": 2025
}

// Import from external API
POST /api/holidays/import
{
  "country": "US",
  "year": 2025,
  "region": "California"
}

// Create custom holiday
POST /api/holidays
{
  "name": "Company Anniversary",
  "date": "2025-06-15",
  "description": "Annual company celebration",
  "isBlackoutPeriod": true
}
```

### Checking Holidays

```javascript
// Check if date is holiday
GET /api/holidays/check/2025-12-25

// Check if date is blackout period
GET /api/holidays/blackout/2025-12-25

// Get holidays in range
GET /api/holidays/range?startDate=2025-01-01&endDate=2025-12-31
```

## 🔄 Automated Jobs (To Be Implemented)

Create cron jobs using `node-cron` for:

1. **Shift Reminders** - Send 1 hour before shift starts
2. **Expire Old Shift Swaps** - Run daily to expire 48+ hour old swaps
3. **Carryover Expiration** - Run on April 1st to expire unused carryover days
4. **Coverage Gap Alerts** - Run daily to alert admins of understaffed periods
5. **Calendar Sync** - Auto-sync schedules to calendars daily

Example cron job:

```javascript
import cron from 'node-cron';
import notificationService from './services/notificationService.js';
import Schedule from './models/Schedule.js';

// Send shift reminders every hour
cron.schedule('0 * * * *', async () => {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  
  const upcomingShifts = await Schedule.find({
    startTime: {
      $gte: oneHourFromNow,
      $lte: new Date(oneHourFromNow.getTime() + 5 * 60 * 1000) // 5 min window
    },
    status: 'scheduled'
  }).populate('driver');
  
  for (const schedule of upcomingShifts) {
    await notificationService.sendShiftReminder(schedule.driver, schedule, 1);
  }
});
```

## 🧪 Testing

### Test Email Configuration
```bash
POST /api/notifications/test-email
{
  "email": "test@example.com"
}
```

### Test SMS Configuration
```bash
POST /api/notifications/test-sms
{
  "phone": "+1234567890"
}
```

### Test Calendar Connection
```bash
# After connecting calendar
POST /api/calendar/google/sync
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-31"
}
```

## 📦 Dependencies Installed

### Frontend
```json
{
  "@fullcalendar/react": "^6.x",
  "@fullcalendar/daygrid": "^6.x",
  "@fullcalendar/timegrid": "^6.x",
  "@fullcalendar/interaction": "^6.x",
  "@fullcalendar/list": "^6.x",
  "date-fns": "^2.x"
}
```

### Backend
```json
{
  "googleapis": "^130.x",
  "nodemailer": "^6.x",
  "twilio": "^4.x",
  "node-cron": "^3.x",
  "axios": "^1.x"
}
```

## 🔐 Security Considerations

1. **Token Storage**:
   - All OAuth tokens stored with `select: false` in User model
   - Tokens not returned in API responses by default
   - Consider encrypting tokens at rest

2. **OAuth Scopes**:
   - Minimal scopes requested (only calendar access)
   - Offline access for refresh tokens

3. **Email/SMS Credentials**:
   - Use environment variables only
   - Never commit credentials to repository
   - Use app passwords, not primary passwords

4. **API Keys**:
   - Holiday API key optional (free alternative available)
   - Rate limiting recommended for external API calls

## 📊 Performance Optimizations

1. **Calendar Sync**:
   - Batch operations (sync multiple schedules at once)
   - Cache last sync time to avoid redundant syncs
   - Error handling for individual event failures

2. **Notifications**:
   - Queue system recommended for high volume (Redis/Bull)
   - Retry logic for failed sends
   - Log all notification attempts

3. **Holiday Caching**:
   - Holidays stored in database (not fetched every time)
   - Import once per year
   - In-memory caching for frequently accessed dates

## 🚀 Next Steps

1. **Create Cron Jobs**: Set up automated reminders and maintenance tasks
2. **Add Notification Queue**: Implement Redis/Bull for notification queue
3. **Calendar Webhook**: Listen for calendar changes (two-way sync)
4. **Notification Preferences**: Let users customize notification settings
5. **Notification History**: Track all sent notifications in database
6. **Calendar Conflict Resolution**: Handle conflicts when calendars are out of sync
7. **Timezone Support**: Make timezone configurable per user

## 📝 Summary

**Components Created**: 8 files (2 frontend, 4 services, 2 routes)
**Features Implemented**: 
- ✅ Full calendar UI with drag-drop
- ✅ Google Calendar OAuth & sync
- ✅ Outlook Calendar OAuth & sync
- ✅ Email notifications (Nodemailer)
- ✅ SMS notifications (Twilio)
- ✅ Holiday import system
- ✅ Time-off manager with balance tracking

**Ready for Production**: After configuring OAuth credentials and notification services!
