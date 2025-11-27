# Notifications System Documentation

## Overview
A comprehensive notifications system that allows users to receive real-time updates about trips, assignments, system alerts, and other important events. The notifications page is accessible via the bell icon in the navbar but is not visible in the main navigation/sidebar.

## Features

### 1. **Notification Types**
- `trip_assigned` - When a trip is assigned to a driver or rider
- `trip_updated` - When trip details are modified
- `trip_cancelled` - When a trip is cancelled
- `trip_completed` - When a trip is successfully completed
- `trip_started` - When a driver starts a trip
- `rider_assigned` - When a rider is assigned to a trip
- `driver_assigned` - When a driver is assigned to a trip
- `vehicle_assigned` - When a vehicle is assigned
- `schedule_change` - When schedules are modified
- `system_alert` - General system notifications
- `message` - Direct messages
- `urgent` - High-priority urgent notifications

### 2. **Priority Levels**
- `low` - Informational notifications
- `normal` - Standard notifications
- `high` - Important notifications
- `urgent` - Critical, immediate action required

### 3. **Notification States**
- **Unread**: New notifications that haven't been viewed
- **Read**: Notifications that have been viewed
- Auto-deletion: Read notifications older than 30 days are automatically deleted

## Backend Architecture

### Database Model (`backend/models/Notification.js`)
```javascript
{
  userId: ObjectId,           // User to notify
  type: String,               // Notification type (enum)
  title: String,              // Notification title
  message: String,            // Notification message
  read: Boolean,              // Read status
  relatedData: {              // Optional related data
    tripId: ObjectId,
    riderId: ObjectId,
    driverId: ObjectId,
    vehicleId: ObjectId,
    actionUrl: String         // URL to navigate to
  },
  priority: String,           // Priority level
  expiresAt: Date,            // Optional expiration
  timestamps: true            // createdAt, updatedAt
}
```

### API Routes (`backend/routes/notifications.js`)

#### Get All Notifications
```http
GET /api/notifications
Query Parameters:
  - limit: Number (default: 50)
  - skip: Number (default: 0)
  - unreadOnly: Boolean (default: false)
  - type: String (filter by type)

Response:
{
  notifications: [...],
  unreadCount: Number,
  total: Number
}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count

Response:
{
  count: Number
}
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read

Response:
{
  message: "Notification marked as read",
  notification: {...}
}
```

#### Mark All as Read
```http
PATCH /api/notifications/mark-all-read

Response:
{
  message: "All notifications marked as read",
  modifiedCount: Number
}
```

#### Delete Notification
```http
DELETE /api/notifications/:id

Response:
{
  message: "Notification deleted successfully"
}
```

#### Delete Old Read Notifications
```http
DELETE /api/notifications/read/cleanup?daysOld=7

Response:
{
  message: "Deleted old read notifications",
  deletedCount: Number
}
```

#### Create Notification (Admin/Dispatcher only)
```http
POST /api/notifications
Body:
{
  userId: String,
  type: String,
  title: String,
  message: String,
  relatedData: Object,
  priority: String
}

Response:
{
  message: "Notification created successfully",
  notification: {...}
}
```

## Frontend Architecture

### NotificationsPage Component (`frontend/src/components/shared/NotificationsPage.jsx`)

**Features:**
- Tabbed interface (All / Unread / Read)
- Filter by notification type
- Real-time unread count
- Clickable notifications (navigate to relevant pages)
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Visual indicators for priority and type
- Relative timestamps (e.g., "2h ago")
- Mobile responsive design

**Navigation:**
- Accessible only via bell icon click
- Not visible in sidebar or main navigation
- Route: `/notifications`

### Navbar Integration (`frontend/src/components/shared/Navbar.jsx`)

**Bell Icon Features:**
- Shows unread notification count as a badge
- Desktop and mobile responsive
- Polls for new notifications every 30 seconds
- Click navigates to `/notifications` page
- Visual badge indicator (red) when unread notifications exist

**Implementation:**
```jsx
// Unread notification badge
{unreadNotifications > 0 && (
  <Badge
    position="absolute"
    top="-1"
    right="-1"
    colorScheme="red"
    borderRadius="full"
  >
    {unreadNotifications > 99 ? '99+' : unreadNotifications}
  </Badge>
)}
```

## Helper Utilities

### Notification Helper (`backend/utils/notificationHelper.js`)

Provides convenient functions for creating notifications:

```javascript
// Trip assignment
await notifyTripAssignment(userId, trip, 'driver');

// Trip updates
await notifyTripUpdate(userId, trip, 'schedule');

// Trip completion
await notifyTripCompleted(userId, trip);

// Trip started
await notifyTripStarted(userId, trip);

// System alerts
await notifySystemAlert([userId1, userId2], title, message, 'high');

// Urgent notifications
await notifyUrgent(userId, title, message, relatedData);

// Notify all admins
await notifyAdminsAndDispatchers(title, message, 'system_alert');
```

## Usage Examples

### Creating a Notification When Assigning a Trip

```javascript
import { notifyTripAssignment } from '../utils/notificationHelper.js';

// In your trip assignment route
router.patch('/trips/:id/assign-driver', async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  const { driverId } = req.body;
  
  // Update trip
  trip.driver = driverId;
  await trip.save();
  
  // Create notification for driver
  await notifyTripAssignment(driverId, trip, 'driver');
  
  res.json({ message: 'Driver assigned successfully' });
});
```

### Handling Notification Click in Frontend

```javascript
const handleNotificationClick = async (notification) => {
  // Mark as read
  if (!notification.read) {
    await markAsRead(notification._id);
  }

  // Navigate based on type
  if (notification.relatedData?.actionUrl) {
    navigate(notification.relatedData.actionUrl);
  } else if (notification.relatedData?.tripId) {
    // Navigate to appropriate dashboard
    navigate('/trips');
  }
};
```

## Testing

### Create Sample Notifications

Run the sample notification script:
```bash
cd backend
node createSampleNotifications.js
```

This will create various types of notifications for existing users to test the system.

### Manual Testing Checklist

1. **Bell Icon**
   - [ ] Bell icon visible in navbar (desktop and mobile)
   - [ ] Unread count badge displays correctly
   - [ ] Click navigates to `/notifications`
   - [ ] Badge updates when notifications are marked as read

2. **Notifications Page**
   - [ ] All notifications display correctly
   - [ ] Tabs work (All / Unread / Read)
   - [ ] Type filter works
   - [ ] Mark as read functionality works
   - [ ] Mark all as read works
   - [ ] Delete notification works
   - [ ] Clicking notification navigates correctly
   - [ ] Visual indicators (colors, icons) display correctly
   - [ ] Timestamps format correctly

3. **Permissions**
   - [ ] All authenticated users can access notifications
   - [ ] Users only see their own notifications
   - [ ] Admin/Dispatcher can create notifications

4. **Mobile Responsiveness**
   - [ ] Bell icon visible on mobile
   - [ ] Notifications page responsive
   - [ ] All actions work on mobile devices

## Security Considerations

1. **Authorization**: Users can only view their own notifications
2. **Creation**: Only admins, dispatchers, and schedulers can manually create notifications
3. **Auto-cleanup**: Old read notifications are automatically deleted after 30 days
4. **Rate limiting**: Consider implementing rate limiting on notification endpoints

## Future Enhancements

- [ ] Real-time notifications using Socket.io
- [ ] Push notifications for mobile apps
- [ ] Email notifications for urgent alerts
- [ ] Notification preferences (enable/disable by type)
- [ ] Notification sound alerts
- [ ] Batch operations (delete all read, archive)
- [ ] Search and filter improvements
- [ ] Notification templates
- [ ] Analytics dashboard for notification metrics

## Troubleshooting

### Notifications Not Appearing
1. Check backend logs for API errors
2. Verify user authentication token
3. Check MongoDB connection
4. Verify notification model indexes

### Unread Count Not Updating
1. Check polling interval (default: 30 seconds)
2. Verify API endpoint response
3. Check browser console for errors

### Bell Icon Not Visible
1. Verify Navbar component imports
2. Check responsive display settings
3. Verify authentication state

## API Integration Examples

### Frontend: Fetching Notifications
```javascript
const fetchNotifications = async () => {
  try {
    const response = await axios.get('/api/notifications', {
      params: {
        unreadOnly: true,
        limit: 20
      }
    });
    setNotifications(response.data.notifications);
    setUnreadCount(response.data.unreadCount);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};
```

### Backend: Creating Notification
```javascript
import { notifySystemAlert } from '../utils/notificationHelper.js';

// Send alert to multiple users
await notifySystemAlert(
  [userId1, userId2, userId3],
  'System Maintenance',
  'System will be down for maintenance tonight',
  'high'
);
```

## Database Indexes

The Notification model uses the following indexes for optimal query performance:

1. `{ userId: 1, read: 1, createdAt: -1 }` - Compound index for user queries
2. `{ createdAt: 1 }` - TTL index for auto-deletion after 30 days

## Support

For issues or questions about the notifications system:
1. Check this documentation first
2. Review backend logs
3. Check browser console for frontend errors
4. Verify API responses using tools like Postman
