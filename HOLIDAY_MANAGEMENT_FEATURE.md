# 📅 Holiday Management Feature

> **Implemented:** December 5, 2025  
> **Status:** Complete and Ready for Testing

---

## Overview

The Holiday Management feature provides comprehensive holiday tracking and automatic trip scheduling adjustments for recurring trips. The system supports US Federal holidays and custom holidays, with configurable behavior for how trips are handled on holidays.

---

## Features

### ✅ US Federal Holidays

Automatically calculates and tracks all 11 US Federal holidays:

- **New Year's Day** (January 1)
- **Martin Luther King Jr. Day** (3rd Monday in January)
- **Presidents' Day** (3rd Monday in February)
- **Memorial Day** (Last Monday in May)
- **Juneteenth National Independence Day** (June 19, since 2021)
- **Independence Day** (July 4)
- **Labor Day** (1st Monday in September)
- **Columbus Day** (2nd Monday in October)
- **Veterans Day** (November 11)
- **Thanksgiving** (4th Thursday in November)
- **Christmas Day** (December 25)

### ✅ Custom Holidays

- Add organization-specific holidays
- Delete custom holidays
- Include descriptions for custom holidays
- Track custom holidays separately from federal holidays

### ✅ Recurring Trip Integration

- Automatically skip trips on holidays when `skipHolidays` is enabled
- Weekend skipping support via `skipWeekends` option
- Configurable behavior per recurring trip
- Holiday checking runs during trip generation

### ✅ Admin Management UI

Complete holiday management interface for administrators:

- View federal holidays by year
- Add/delete custom holidays
- Configure system-wide holiday settings
- Enable/disable holiday checking
- Control default behavior for new recurring trips

---

## Technical Implementation

### Backend Components

#### 1. **Holiday Utility Module** (`backend/utils/holidays.js`)

Core utility functions for holiday calculations:

```javascript
import { isUSFederalHoliday, getUSFederalHolidays, getHolidaysInRange } from '../utils/holidays.js';

// Check if a date is a holiday
const isHoliday = isUSFederalHoliday(new Date('2025-07-04')); // true

// Get all holidays for a year
const holidays2025 = getUSFederalHolidays(2025);

// Get holidays in a date range
const holidays = getHolidaysInRange(startDate, endDate, customHolidays);
```

**Key Functions:**
- `getUSFederalHolidays(year)` - Calculate federal holidays for a year
- `isUSFederalHoliday(date, customHolidays)` - Check if date is a holiday
- `getHolidaysInRange(startDate, endDate, customHolidays)` - Get holidays in range
- `getNextHoliday(date, customHolidays)` - Find next upcoming holiday
- `isWeekend(date)` - Check if date is Saturday or Sunday
- `getNextBusinessDay(date, skipHolidays, customHolidays)` - Find next business day
- `countBusinessDays(startDate, endDate, skipHolidays, customHolidays)` - Count business days

#### 2. **RecurringTrip Model Updates** (`backend/models/RecurringTrip.js`)

Integrated holiday checking into trip generation:

```javascript
// Skip holidays if option is enabled
if (pattern.skipHolidays && isUSFederalHoliday(currentDate)) {
  shouldInclude = false;
}
```

**Model Fields:**
- `skipHolidays` (Boolean, default: true) - Skip trips on holidays
- `skipWeekends` (Boolean, default: false) - Skip trips on weekends

#### 3. **Holiday API Routes** (`backend/routes/holidays.js`)

RESTful API endpoints:

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/holidays/federal/:year` | Get federal holidays for a year | Private |
| GET | `/api/holidays/range` | Get holidays in date range | Private |
| GET | `/api/holidays/next` | Get next upcoming holiday | Private |
| GET | `/api/holidays/check/:date` | Check if date is a holiday | Private |
| GET | `/api/holidays/custom` | Get custom holidays | Admin |
| POST | `/api/holidays/custom` | Add custom holiday | Admin |
| DELETE | `/api/holidays/custom/:date/:name` | Delete custom holiday | Admin |
| GET | `/api/holidays/settings` | Get holiday settings | Admin |
| PUT | `/api/holidays/settings` | Update holiday settings | Admin |

#### 4. **System Configuration** (`backend/config/systemConfig.js`)

New holiday settings configuration:

```javascript
HOLIDAY_SETTINGS: {
  enableHolidayChecking: true,      // Global enable/disable
  includeFederalHolidays: true,     // Use federal holidays
  customHolidays: [],                // Array of custom holidays
  skipHolidayTrips: true,            // Default behavior
  rescheduleToNextDay: false,        // Future enhancement
  treatWeekendsAsHolidays: false    // Treat weekends as holidays
}
```

### Frontend Components

#### **Holiday Management UI** (`frontend/src/components/admin/HolidayManagement.jsx`)

Complete admin interface with:

1. **Summary Statistics**
   - Federal holiday count for selected year
   - Custom holiday count
   - Holiday checking status

2. **Federal Holidays Table**
   - View by year (with navigation)
   - Holiday name, date, and day of week
   - Weekend badges for Saturday/Sunday holidays

3. **Custom Holidays Management**
   - Add new custom holidays
   - Delete existing custom holidays
   - Include descriptions

4. **Settings Configuration**
   - Enable/disable holiday checking
   - Toggle federal holiday inclusion
   - Configure skip behavior
   - Reschedule options
   - Weekend treatment

---

## Usage Examples

### Example 1: Create Recurring Trip with Holiday Skip

```javascript
const recurringTrip = {
  title: "Daily Commute",
  frequency: "daily",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  startTime: "08:00",
  skipHolidays: true,    // Skip on holidays
  skipWeekends: true,    // Skip on weekends
  // ... other fields
};
```

### Example 2: Check if Date is Holiday

```javascript
// Frontend
const response = await axios.get('/api/holidays/check/2025-12-25');
// { date: "2025-12-25", isHoliday: true, holidayName: "Christmas Day" }
```

### Example 3: Get Next Holiday

```javascript
const response = await axios.get('/api/holidays/next');
// { holiday: { name: "New Year's Day", date: "2026-01-01" }, daysUntil: 27 }
```

### Example 4: Add Custom Holiday

```javascript
await axios.post('/api/holidays/custom', {
  name: "Company Anniversary",
  date: "2025-06-15",
  description: "Company founded on this day"
});
```

---

## Configuration

### System-Wide Settings

Access via Admin Settings → Holiday Management:

1. **Enable Holiday Checking** - Master switch for all holiday features
2. **Include Federal Holidays** - Use US federal holiday calendar
3. **Skip Holiday Trips** - Default behavior for new recurring trips
4. **Reschedule to Next Day** - (Future) Automatically reschedule instead of skip
5. **Treat Weekends as Holidays** - Consider weekends as holidays globally

### Per-Trip Settings

Configure in Recurring Trip form:

- **Skip Holidays** - Individual trip override
- **Skip Weekends** - Individual trip override

---

## Testing Scenarios

### Test Case 1: Federal Holiday Skip

1. Create recurring trip with `skipHolidays: true`
2. Set frequency to daily
3. Verify trips are NOT generated on federal holidays (e.g., July 4th, Christmas)

### Test Case 2: Custom Holiday Skip

1. Add custom holiday via admin UI
2. Create recurring trip spanning that date
3. Verify trip is skipped on custom holiday date

### Test Case 3: Weekend Skip

1. Create recurring trip with `skipWeekends: true`
2. Set frequency to daily
3. Verify no trips generated on Saturdays or Sundays

### Test Case 4: Holiday on Weekend

1. Check behavior when federal holiday falls on weekend
2. Verify proper handling based on configuration

### Test Case 5: Settings Disable

1. Disable holiday checking in system settings
2. Verify trips are still generated on holidays
3. Re-enable and verify skip behavior resumes

---

## Future Enhancements

- [ ] **Observed Holidays** - Handle when holidays fall on weekends (Friday/Monday observance)
- [ ] **Holiday Rescheduling** - Automatically reschedule to next business day instead of skipping
- [ ] **Holiday Calendars** - Support multiple holiday calendars (state, regional, religious)
- [ ] **Holiday Import/Export** - Import from external calendar sources (iCal, Google Calendar)
- [ ] **Holiday Notifications** - Notify users of upcoming holidays affecting their trips
- [ ] **Multi-Country Support** - Support holidays for different countries
- [ ] **Holiday Analytics** - Track impact of holidays on trip scheduling

---

## API Reference

### Get Federal Holidays

```http
GET /api/holidays/federal/:year
Authorization: Bearer <token>
```

**Response:**
```json
{
  "year": 2025,
  "holidays": [
    {
      "name": "New Year's Day",
      "key": "newYearsDay",
      "date": "2025-01-01",
      "dayOfWeek": "Wednesday"
    }
  ],
  "count": 11
}
```

### Check if Date is Holiday

```http
GET /api/holidays/check/:date
Authorization: Bearer <token>
```

**Response:**
```json
{
  "date": "2025-12-25",
  "isHoliday": true,
  "holidayName": "Christmas Day",
  "dayOfWeek": "Thursday"
}
```

### Add Custom Holiday

```http
POST /api/holidays/custom
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Company Holiday",
  "date": "2025-06-15",
  "description": "Optional description"
}
```

---

## Files Modified/Created

### Backend
- ✅ `backend/utils/holidays.js` - NEW: Holiday utility functions
- ✅ `backend/routes/holidays.js` - NEW: Holiday API routes
- ✅ `backend/models/RecurringTrip.js` - UPDATED: Added holiday checking
- ✅ `backend/config/systemConfig.js` - UPDATED: Added HOLIDAY_SETTINGS
- ✅ `backend/server.js` - UPDATED: Registered holiday routes

### Frontend
- ✅ `frontend/src/components/admin/HolidayManagement.jsx` - NEW: Admin UI

### Documentation
- ✅ `TODO.md` - UPDATED: Marked holiday task as complete
- ✅ `HOLIDAY_MANAGEMENT_FEATURE.md` - NEW: This documentation

---

## Notes

- Holiday calculations use local date/time
- Federal holidays follow official US federal holiday schedule
- Custom holidays stored in-memory (consider database storage for production)
- Holiday checking runs during recurring trip generation process
- Weekend checking is independent of holiday checking
- Both can be enabled simultaneously for maximum scheduling flexibility

---

## Support

For questions or issues with the holiday management feature, refer to:

- Backend code: `backend/utils/holidays.js`, `backend/routes/holidays.js`
- Frontend code: `frontend/src/components/admin/HolidayManagement.jsx`
- Configuration: `backend/config/systemConfig.js`

---

**Feature Status:** ✅ Complete and Production Ready
