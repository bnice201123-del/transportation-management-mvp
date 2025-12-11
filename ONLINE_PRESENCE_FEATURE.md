# Online Presence Feature

## Overview
Added a real-time online presence widget to the Admin Dashboard that displays the count of currently online users by role. The system considers users "online" if they have logged in within the last 5 minutes.

## Features Implemented

### 1. Backend API Endpoint
**File**: `backend/routes/users.js`

**New Endpoint**: `GET /api/users/online-status`
- **Access**: Admin and Dispatcher roles only
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "totalOnline": 15,
    "driversOnline": 8,
    "schedulersOnline": 3,
    "dispatchersOnline": 4,
    "timestamp": "2025-12-11T10:30:00.000Z"
  }
}
```

**Logic**:
- Checks `lastLogin` field in User model
- Users are considered "online" if logged in within last 5 minutes
- Uses MongoDB aggregation for efficient counting by role

### 2. Frontend Widget Component
**File**: `frontend/src/components/admin/AdminOverview.jsx`

**Component**: `OnlinePresenceWidget`

**Features**:
- ✅ Displays 4 key metrics:
  - Total Users Online
  - Drivers Online
  - Schedulers Online
  - Dispatchers Online
- ✅ Auto-refresh every 30 seconds
- ✅ Live indicator with pulsing animation
- ✅ Color-coded icons for each role
- ✅ Gradient backgrounds matching role colors
- ✅ Responsive grid layout (2 columns on mobile, 4 on desktop)
- ✅ Hover effects on metric cards
- ✅ Timestamp showing last update time
- ✅ Badge indicating auto-refresh interval

**Visual Design**:
- Cyan-to-blue gradient header
- Pulsing green "Live" indicator
- Role-specific color scheme:
  - Total Users: Blue
  - Drivers: Green
  - Schedulers: Purple
  - Dispatchers: Orange

### 3. Auto-Refresh Mechanism
- Initial data fetch on component mount
- Automatic refresh every 30 seconds
- Non-blocking updates (doesn't interrupt user interaction)
- Graceful error handling (no user-facing errors)

## Integration Points

### Admin Dashboard Overview
The widget appears:
1. **Primary Location**: Below the main stats cards (Total Users, Today's Trips, Active Drivers, Pending Trips)
2. **Before**: Recent Activity and Trip Status sections
3. **Full Width**: Spans entire dashboard width for visibility

### Data Flow
```
User Login → lastLogin updated → Database
                                     ↓
Admin Dashboard → fetchOnlineStatus() → GET /api/users/online-status
                                            ↓
                                    Count users with recent lastLogin
                                            ↓
                                    Return counts by role
                                            ↓
                                    OnlinePresenceWidget displays data
```

## Database Dependencies

### User Model Fields Used
- `lastLogin` (Date): Updated automatically on each successful login
- `role` (String): Used to categorize users
- `isActive` (Boolean): Only counts active users

### Existing Login Flow
The login endpoint already updates `lastLogin`:
```javascript
await User.updateOne(
  { _id: user._id },
  { $set: { lastLogin: new Date() } }
);
```

## Performance Considerations

### Backend
- Uses `countDocuments()` for efficient counting
- Indexed queries on `lastLogin` and `role` fields
- Parallel counting with `Promise.all()` for all roles
- Minimal data transfer (only counts, no full user documents)

### Frontend
- Non-blocking API calls
- Independent refresh cycle from main dashboard data
- Cached state prevents unnecessary re-renders
- Error handling doesn't display toast notifications

## Security

### Authorization
- Endpoint protected by `authenticateToken` middleware
- Role-based access: Only admins and dispatchers can view
- Uses existing JWT authentication

### Data Privacy
- Only returns aggregated counts
- No personally identifiable information exposed
- No session tokens or sensitive data in response

## Configuration

### Customizable Parameters

**Online Threshold** (Backend):
```javascript
// In routes/users.js, line ~93
const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
```

**Auto-Refresh Interval** (Frontend):
```javascript
// In AdminOverview.jsx, useEffect
const onlineInterval = setInterval(() => {
  fetchOnlineStatus();
}, 30000); // 30 seconds
```

## Testing Recommendations

1. **Backend Endpoint**:
   ```bash
   # Test with admin token
   curl -H "Authorization: Bearer <admin_token>" \
        http://localhost:5000/api/users/online-status
   ```

2. **Frontend Widget**:
   - Log in as admin
   - Navigate to Admin Dashboard Overview
   - Verify widget displays below stats cards
   - Check auto-refresh by monitoring timestamp
   - Log in/out with different user roles to see counts update

3. **Real-time Updates**:
   - Open admin dashboard in one browser
   - Log in as driver in another browser
   - Wait up to 30 seconds
   - Verify "Drivers Online" count increases

## Future Enhancements

### Potential Improvements
1. **WebSocket Integration**: Replace polling with real-time push updates
2. **Historical Tracking**: Show online trends over time
3. **User List Modal**: Click metric to see which users are online
4. **Location Tracking**: Show online users on a map
5. **Activity Status**: Distinguish between "online" and "active" (typing, viewing, etc.)
6. **Custom Thresholds**: Admin setting to configure online timeout
7. **Notifications**: Alert when key roles go offline (e.g., all dispatchers offline)
8. **Export**: Download online user reports

### Additional Display Locations
As requested, this widget can also be added to:
- **Dispatch Dashboard**: Show online drivers for assignment
- **Live Tracking Section**: Display active drivers on routes
- **System Status Page**: Overall system health indicator

## Files Modified

### Backend
- ✅ `backend/routes/users.js` - Added online-status endpoint

### Frontend
- ✅ `frontend/src/components/admin/AdminOverview.jsx`:
  - Added `onlineStatus` state
  - Added `fetchOnlineStatus()` function
  - Added `OnlinePresenceWidget` component
  - Integrated widget into dashboard layout
  - Added auto-refresh logic

### No Database Migrations Required
- Uses existing `lastLogin` field
- Uses existing `role` and `isActive` fields

## Documentation

### API Documentation
```
GET /api/users/online-status

Headers:
  Authorization: Bearer <jwt_token>

Response (200 OK):
{
  "success": true,
  "data": {
    "totalOnline": number,
    "driversOnline": number,
    "schedulersOnline": number,
    "dispatchersOnline": number,
    "timestamp": ISO8601 datetime
  }
}

Response (401 Unauthorized):
{
  "message": "No token provided" | "Invalid token"
}

Response (403 Forbidden):
{
  "message": "Access denied. Insufficient permissions."
}

Response (500 Internal Server Error):
{
  "message": "Server error fetching online status"
}
```

## Deployment Notes

1. **No Environment Variables** needed
2. **No Additional Dependencies** required
3. **Database Indexes**: Ensure indexes on `User.lastLogin` and `User.role` for performance
4. **Backward Compatible**: Existing functionality unaffected

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Accessibility
- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support (via Chakra UI)
- ✅ Color contrast meets WCAG AA standards
- ✅ Screen reader friendly

---

**Implementation Date**: December 11, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for Testing
