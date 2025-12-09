# Notification Settings UI - User Guide

## Overview

The **Notification Settings** component allows users to manage their notification preferences for the Transportation Management System. Users can customize how and when they receive notifications via email and SMS.

## Features

### 1. Contact Information Management
- **Email Address**: Update and verify email for receiving notifications
- **Phone Number**: Update and verify phone for SMS notifications
- **Verification Status**: See which contact methods are verified
- **Test Notifications**: Send test email/SMS to verify configuration

### 2. Notification Types

#### For Drivers, Dispatchers, and Schedulers:

**Shift Reminders**
- Get notified before shifts start
- Customize timing (15 min, 30 min, 1 hour, 2 hours, 4 hours)
- Choose email and/or SMS delivery

**Time-Off Approvals**
- Notifications when time-off requests are approved
- Email and SMS options

**Time-Off Denials**
- Notifications when time-off requests are denied
- Includes denial reason
- Email and SMS options

**Shift Swap Requests**
- Alerts for new shift swap opportunities
- Notifications when swap requests are responded to
- Email and SMS options

**Overtime Alerts**
- Notifications about overtime hours
- Email and SMS options

**Schedule Changes**
- Alerts when schedules are modified
- Includes change details
- Email and SMS options

**Calendar Sync Status**
- Notifications about calendar synchronization
- Errors or successful syncs
- Typically email-only

#### For Admins and Schedulers:

**Coverage Gap Alerts**
- Alerts about staffing shortages
- Shows dates and times needing coverage
- Email and SMS options

## Component Location

**File:** `frontend/src/components/shared/NotificationSettings.jsx`

## Usage

### Accessing the Settings

Users can access notification settings from:
1. **Settings Menu** - User profile dropdown → Settings
2. **Dashboard** - Settings tile or gear icon
3. **Direct Route** - Navigate to `/settings/notifications`

### Managing Preferences

#### Step 1: Update Contact Information

```jsx
// Enter email
Email: your.email@example.com

// Enter phone
Phone: +1 (555) 123-4567

// Test delivery
[Test Email] [Test SMS]
```

#### Step 2: Configure Notification Types

For each notification type:

1. **Enable/Disable** - Toggle the notification type on/off
2. **Choose Channels**:
   - ✅ Email - Receive via email
   - ✅ SMS - Receive via text message
3. **Set Timing** (for shift reminders):
   - Select how far in advance to receive reminders

#### Step 3: Save Preferences

Click **"Save Preferences"** to apply changes.

## API Endpoints

### Get Notification Preferences

```
GET /api/users/notification-preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "phone": "+15551234567",
  "emailVerified": true,
  "phoneVerified": false,
  "preferences": {
    "shiftReminders": {
      "enabled": true,
      "email": true,
      "sms": true,
      "timing": 60
    },
    "timeOffApprovals": {
      "enabled": true,
      "email": true,
      "sms": false
    }
    // ... other preferences
  }
}
```

### Update Notification Preferences

```
PUT /api/users/notification-preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "+15559876543",
  "preferences": {
    "shiftReminders": {
      "enabled": true,
      "email": true,
      "sms": true,
      "timing": 120
    },
    "timeOffApprovals": {
      "enabled": true,
      "email": true,
      "sms": false
    }
    // ... other preferences
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "preferences": { /* updated preferences */ }
}
```

### Test Notification

```
POST /api/users/test-notification
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "email"  // or "sms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Database Schema

### User Model Updates

```javascript
// Added to User schema
notificationPreferences: {
  shiftReminders: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: true),
    timing: Number (default: 60) // minutes
  },
  timeOffApprovals: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: false)
  },
  timeOffDenials: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: false)
  },
  shiftSwapRequests: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: true)
  },
  overtimeAlerts: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: false)
  },
  coverageGapAlerts: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: false)
  },
  scheduleChanges: {
    enabled: Boolean (default: true),
    email: Boolean (default: true),
    sms: Boolean (default: true)
  },
  calendarSync: {
    enabled: Boolean (default: true),
    email: Boolean (default: false),
    sms: Boolean (default: false)
  }
},
emailVerified: Boolean (default: false),
phoneVerified: Boolean (default: false)
```

## Integration with Notification Service

The notification service checks user preferences before sending notifications:

```javascript
// Example: notificationService.js
async function sendShiftReminder(driver, schedule, hoursBeforeShift) {
  // Check if user has shift reminders enabled
  const prefs = driver.notificationPreferences?.shiftReminders;
  
  if (!prefs?.enabled) {
    return { skipped: true, reason: 'Notifications disabled' };
  }
  
  // Check timing preference
  const minutesBefore = hoursBeforeShift * 60;
  if (prefs.timing && minutesBefore !== prefs.timing) {
    return { skipped: true, reason: 'Wrong timing' };
  }
  
  const results = {};
  
  // Send email if enabled
  if (prefs.email && driver.email) {
    results.email = await sendEmail({
      to: driver.email,
      subject: 'Shift Reminder',
      // ... email content
    });
  }
  
  // Send SMS if enabled
  if (prefs.sms && driver.phone) {
    results.sms = await sendSMS({
      to: driver.phone,
      body: 'Shift reminder message'
    });
  }
  
  return results;
}
```

## User Experience

### Visual Feedback

**Accordions**
- Collapsible sections for each notification type
- Color-coded icons (blue, green, purple, etc.)
- Badge showing enabled/disabled status

**Status Indicators**
- ✅ Verified badge for verified contact info
- ⚠️ Warning when contact info is missing
- Loading spinners during operations

**Interactive Elements**
- Toggle switches for enable/disable
- Dropdown for timing selection
- Test buttons for each channel

### Responsive Design

**Desktop (1200px+)**
- Two-column layout for settings
- Expanded accordions
- Full-width cards

**Tablet (768px - 1199px)**
- Single column layout
- Slightly smaller cards
- Compact accordions

**Mobile (< 768px)**
- Full mobile-optimized layout
- Stack all elements vertically
- Touch-friendly controls

## Testing

### Manual Testing

**Test Contact Information:**
1. Navigate to Notification Settings
2. Update email address
3. Click "Test Email"
4. Verify email received
5. Update phone number
6. Click "Test SMS"
7. Verify SMS received

**Test Preferences:**
1. Enable/disable notification types
2. Toggle email/SMS for each type
3. Change shift reminder timing
4. Click "Save Preferences"
5. Refresh page
6. Verify settings persisted

**Test Notifications:**
1. Create a schedule 1 hour in future
2. Wait for shift reminder cron job
3. Verify email/SMS received based on preferences

### Automated Testing

```javascript
// Example Jest test
describe('NotificationSettings', () => {
  it('should load user preferences', async () => {
    const { getByText } = render(<NotificationSettings />);
    await waitFor(() => {
      expect(getByText('Notification Settings')).toBeInTheDocument();
    });
  });
  
  it('should save preferences', async () => {
    const { getByText, getByRole } = render(<NotificationSettings />);
    
    // Toggle shift reminders
    const toggle = getByRole('switch', { name: /shift reminders/i });
    fireEvent.click(toggle);
    
    // Save
    const saveButton = getByText('Save Preferences');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Settings saved'
        })
      );
    });
  });
});
```

## Common Issues

### Issue: Test email not received

**Possible Causes:**
- Incorrect email address
- Email in spam folder
- SMTP not configured on backend

**Solutions:**
1. Verify email address spelling
2. Check spam/junk folder
3. Check backend SMTP configuration
4. Review backend logs for errors

### Issue: Test SMS not received

**Possible Causes:**
- Incorrect phone number format
- Twilio not configured
- Trial account restrictions

**Solutions:**
1. Use E.164 format: +15551234567
2. Configure Twilio credentials in backend
3. Verify phone number in Twilio console (trial accounts)
4. Check backend logs for errors

### Issue: Preferences not saving

**Possible Causes:**
- Network error
- Authentication token expired
- Backend database error

**Solutions:**
1. Check browser console for errors
2. Verify user is logged in
3. Try refreshing the page
4. Check backend logs

## Security Considerations

### Data Protection

**Contact Information:**
- Phone numbers are never displayed in full (masked)
- Email addresses are validated before saving
- Changes require authentication

**Notification Preferences:**
- Stored in user document (encrypted at rest)
- Only accessible to authenticated user
- Admin cannot modify other users' preferences

### Privacy

**Opt-Out:**
- Users can disable all notifications
- Users can disable specific channels (email or SMS)
- Preferences are respected by all notification services

**Data Retention:**
- Contact info retained as long as account exists
- Preferences retained until changed
- Test notifications are not logged

## Best Practices

### For Users

1. **Keep Contact Info Updated**: Ensure email and phone are current
2. **Test Notifications**: Use test buttons to verify delivery
3. **Customize Timing**: Set shift reminders to your preferred timing
4. **Review Periodically**: Check settings every few months

### For Developers

1. **Respect Preferences**: Always check user preferences before sending
2. **Handle Errors Gracefully**: Don't fail silently when notifications fail
3. **Log Activity**: Track notification deliveries for debugging
4. **Provide Feedback**: Show success/error messages to users
5. **Test Thoroughly**: Test with real email/SMS before production

## Future Enhancements

### Planned Features

1. **Email Verification Flow**
   - Send verification code to email
   - Confirm email ownership
   - Mark as verified

2. **Phone Verification Flow**
   - Send SMS verification code
   - Confirm phone ownership
   - Mark as verified

3. **Notification History**
   - View recent notifications sent
   - Filter by type and channel
   - Resend failed notifications

4. **Quiet Hours**
   - Set do-not-disturb periods
   - Disable SMS during specific hours
   - Weekend/holiday preferences

5. **Advanced Filtering**
   - Only notify for specific vehicles
   - Only notify for specific routes
   - Distance-based preferences

6. **Notification Templates**
   - Preview notification content
   - Customize notification text
   - Multi-language support

## Support

For issues or questions:
- Check `OAUTH_SETUP_GUIDE.md` for SMTP/Twilio setup
- Review backend logs in `logs/` directory
- Contact system administrator
- Submit issue on GitHub

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Component:** NotificationSettings.jsx  
**Routes:** /api/users/notification-preferences
