# Admin Settings Implementation

## Overview
Complete implementation of the Admin Settings page with backend API integration, allowing administrators to configure system-wide settings.

## Features Implemented

### Frontend (AdminSettings.jsx)
- ✅ Fixed data structure issue - settings now display actual values instead of "[object Object]"
- ✅ Backend API integration with fallbacks to localStorage and mock data
- ✅ Save settings to database with real-time API calls
- ✅ Load settings from database on page load
- ✅ Export/Import functionality with JSON files
- ✅ Auto-save feature (5 seconds after changes)
- ✅ Form validation and error handling
- ✅ Search and filtering across all settings
- ✅ Bulk actions (Save All, Discard All, Reset to Defaults)

### Backend API Routes (`/backend/routes/admin.js`)
```
GET    /api/admin/settings         - Fetch system settings
PUT    /api/admin/settings         - Update system settings
POST   /api/admin/settings/reset   - Reset to defaults
GET    /api/admin/settings/export  - Export as JSON download
POST   /api/admin/settings/import  - Import from JSON
```

### Database Model (`/backend/models/SystemSettings.js`)
- Singleton pattern - only one settings document in database
- Organized by categories: system, security, notifications, users, trips, vehicles, performance, features
- Tracks who updated settings and when
- Static methods for easy access: `getSettings()`, `updateSettings()`

## Settings Categories

### 1. System Settings
- Site Name, Company Name, Support Email
- Timezone, Date Format, Time Format, Language
- Maintenance Mode, Registration Toggle

### 2. Security Settings
- Session Timeout, Password Requirements
- Max Login Attempts, Lockout Duration
- Two-Factor Authentication, Password Expiry

### 3. Notification Settings
- Email, SMS, Push Notifications
- Trip Updates, System Alerts
- Weekly Reports, Admin Alerts, Maintenance Alerts

### 4. User Settings
- Max Users, Default Role
- Approval Requirements, Auto-Assign Vehicles
- Profile Edit Permissions

### 5. Trip Settings
- Advance Booking Limits, Booking Notice
- Auto-Assign Drivers, Cancellation Rules
- Recurring Trips Configuration

### 6. Vehicle Settings
- Inspection Requirements, Maintenance Reminders
- Mileage Tracking, Fuel Tracking
- Vehicle Age Limits

### 7. Performance Settings
- Cache Configuration, Log Levels
- Metrics, Data Retention, Backup Frequency

### 8. Feature Toggles
- GPS Tracking, Live Tracking
- Route Optimization, Analytics
- Reporting, Mobile App, API Access

## Data Flow

### Loading Settings (Priority Order)
1. **Backend API** - Try to fetch from MongoDB
2. **localStorage** - Fallback if API unavailable
3. **Mock Data** - Final fallback with defaults

### Saving Settings
1. **Backend API** - Save to MongoDB with user tracking
2. **localStorage** - Fallback if API fails (warns user)
3. **Toast Notifications** - Success/warning/error feedback

### Data Structure Flattening
The mock settings have metadata structure:
```javascript
{
  system: {
    siteName: {
      value: "Transportation Management System",
      type: "text",
      description: "Name of the application"
    }
  }
}
```

Flattened to state for form consumption:
```javascript
{
  system: {
    siteName: "Transportation Management System"
  }
}
```

## API Authentication
- All admin settings routes require:
  - `authenticateToken` middleware - Valid JWT token
  - `authorizeRoles('admin')` middleware - Admin role only
  
## Usage

### Access Settings
Navigate to: http://localhost:5174/admin/settings
(Must be logged in as admin user)

### Modify Settings
1. Change any setting value in the form
2. Settings auto-save after 5 seconds
3. Or click "Save All Changes" to save immediately
4. Click "Discard" to revert unsaved changes

### Export Settings
1. Click "Export Settings" button
2. Downloads JSON file: `system-settings-{timestamp}.json`
3. Includes settings, export date, and who exported

### Import Settings
1. Click "Import Settings" button
2. Select previously exported JSON file
3. Settings immediately applied and saved

### Reset to Defaults
1. Click "Reset to Defaults" button
2. Confirm action
3. All settings restored to system defaults

## Testing

### Test as Admin User
```bash
Username: admin
Password: admin123
```

### Verify Functionality
- ✅ Settings load without "[object Object]"
- ✅ Form fields show actual values
- ✅ Changes trigger "unsaved changes" indicator
- ✅ Save button updates database
- ✅ Discard button reverts changes
- ✅ Export downloads JSON file
- ✅ Import loads JSON file
- ✅ Search/filter works across all settings
- ✅ Auto-save triggers after 5 seconds

## Files Modified/Created

### Created
- `backend/models/SystemSettings.js` - Database schema
- `backend/routes/admin.js` - API endpoints
- `ADMIN_SETTINGS_IMPLEMENTATION.md` - This documentation

### Modified
- `frontend/src/components/admin/AdminSettings.jsx`:
  - Fixed data structure flattening
  - Added backend API integration
  - Enhanced save/load functionality
  
- `backend/server.js`:
  - Added admin routes import
  - Registered `/api/admin` endpoint

## Future Enhancements
- [ ] Settings change history/audit log
- [ ] Setting categories enable/disable
- [ ] Advanced validation rules per setting
- [ ] Settings templates for different environments
- [ ] Email notification when critical settings change
- [ ] Rollback to previous settings version
- [ ] Settings comparison view (before/after)

## Troubleshooting

### Settings show "[object Object]"
**Fixed** - Applied data structure flattening in fetchSettings() and discard functions

### API calls fail (404)
- Ensure backend server running on port 3001
- Check admin routes registered in server.js
- Verify authentication token is valid

### Not authorized errors
- Ensure logged in as admin user
- Check JWT token in Authorization header
- Verify authorizeRoles middleware allows 'admin'

### Changes don't persist
- Check MongoDB connection in console
- Verify SystemSettings model created
- Check browser Network tab for API responses
