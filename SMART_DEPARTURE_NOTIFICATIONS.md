# Smart Driver Departure Notifications - Feature Documentation

## Overview

An intelligent system that helps drivers leave on time and alerts dispatch when drivers are late to start trips. The system calculates optimal departure times, sends timely reminders, tracks navigation status, and escalates issues to dispatch when necessary.

## Core Features

### 1. **Automated Departure Time Calculation**
- Calculates recommended departure time based on:
  - Scheduled pickup time
  - Estimated travel time (via Google Maps API)
  - Configurable driver buffer (default: 5 minutes)
- Formula: `departure_time = pickup_time - travel_time - buffer`

### 2. **Proactive Driver Notifications**
- **5-Minute Warning**: Sent 5 minutes before recommended departure time
- **Departure Alert**: Sent at exact departure time ("Leave NOW!")
- **Late Alert**: Sent to driver if they haven't started after 5 minutes
- Smart suppression: Reminders skip if driver already started navigation

### 3. **Navigation Tracking**
- Tracks when driver starts navigation
- Updates driver's GPS location
- Monitors movement toward pickup location
- Automatically completes monitoring upon arrival

### 4. **Dispatch Escalation**
- Automatically notifies dispatch if driver is 5+ minutes late
- Provides trip details, driver info, and lateness duration
- Creates urgent notifications in dispatch dashboard
- Includes actionable information for follow-up

### 5. **Edge Case Handling**
- **Last-Minute Trips**: Skips 5-min reminder if pickup is within 10 minutes
- **Early Starters**: Suppresses reminders if driver already started
- **Cancelled Trips**: Automatically cancels monitoring
- **Reassignments**: Updates monitoring with new driver info

## Architecture

### Backend Components

#### 1. **Database Model** (`models/TripDepartureMonitoring.js`)
Tracks monitoring state for each trip:
```javascript
{
  tripId: ObjectId,
  driverId: ObjectId,
  pickupLocation: { latitude, longitude, address },
  scheduledPickupTime: Date,
  estimatedTravelTimeMinutes: Number,
  recommendedDepartureTime: Date,
  navigationStarted: Boolean,
  notifications: {
    fiveMinuteReminder: { sent, sentAt, suppressed },
    departureTimeAlert: { sent, sentAt },
    lateStartAlert: { sent, sentAt, escalatedToDispatch }
  },
  status: 'monitoring' | 'started' | 'late' | 'cancelled' | 'completed'
}
```

#### 2. **Calculation Utilities** (`utils/departureCalculations.js`)
- `calculateTravelTime()` - Google Maps Distance Matrix API integration
- `calculateDepartureTime()` - Departure time calculation
- `getTimeUntilDeparture()` - Real-time countdown
- `isMovingTowardPickup()` - GPS-based movement detection
- `isTripTooSoon()` - Last-minute trip detection

#### 3. **Monitoring Service** (`services/departureMonitoringService.js`)
Background cron jobs that run every minute:
- **checkFiveMinuteReminders()** - Send 5-min warnings
- **checkDepartureTimeAlerts()** - Send "leave now" alerts
- **checkLateDrivers()** - Escalate to dispatch
- **cleanupOldRecords()** - Daily cleanup (runs at 2 AM)

#### 4. **API Routes** (`routes/departureMonitoring.js`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/initialize` | POST | Create monitoring for a trip |
| `/:id/start-navigation` | POST | Driver starts navigation |
| `/:id/location` | PATCH | Update driver location |
| `/trip/:tripId` | GET | Get monitoring status |
| `/driver/:driverId` | GET | Get all driver's active monitoring |
| `/late-drivers` | GET | Get all late drivers (dispatch) |
| `/:id/complete` | POST | Complete monitoring |
| `/:id` | DELETE | Cancel monitoring |

### Frontend Components

#### 1. **DepartureNotifications.jsx**
Driver-facing notification cards showing:
- Trip information and pickup time
- Time until departure (with progress bar)
- Visual status indicators (colors, icons)
- "Start Navigation" button
- Real-time countdown updates (every 30 seconds)

**Status Colors:**
- 🔴 Red: Late to start (5+ minutes past departure)
- 🟠 Orange: Should leave now (at departure time)
- 🟡 Yellow: Leave soon (within 5 minutes)
- 🔵 Blue: Monitoring (more than 5 minutes away)

## Workflow

### Initialization
```
1. Trip assigned to driver
2. System calculates travel time (Google Maps)
3. Monitoring record created
4. Departure time calculated and stored
```

### Monitoring Phase
```
Every minute, the system checks:

5 minutes before departure:
  ├─ Is driver monitoring?
  ├─ Has reminder been sent?
  ├─ Has driver started?
  └─ Send "Start in 5 minutes" notification

At departure time:
  ├─ Is driver monitoring?
  ├─ Has driver started?
  └─ Send "Leave NOW" urgent notification

5 minutes after departure:
  ├─ Is driver still not started?
  ├─ Mark status as 'late'
  ├─ Send urgent alert to driver
  └─ Escalate to dispatch dashboard
```

### Driver Actions
```
Driver receives notification
  ├─ Opens driver app
  ├─ Views departure alert card
  ├─ Clicks "Start Navigation"
  ├─ System marks navigation as started
  ├─ Suppresses future reminders
  └─ Tracking continues until arrival
```

### Dispatch Escalation
```
Driver late > 5 minutes
  ├─ Create urgent notification for all dispatchers
  ├─ Include: Driver name, trip ID, minutes late, pickup time
  ├─ Display in dispatch dashboard
  ├─ Allow dispatch to follow up
  └─ Send additional reminder to driver
```

## Configuration

### Environment Variables
```env
GOOGLE_MAPS_API_KEY=your_api_key_here  # For travel time calculations
```

### Default Settings
```javascript
driverBufferMinutes: 5      // Extra prep time for driver
lastMinuteThreshold: 10     // Minutes to consider "too soon"
reminderAdvance: 5          // Minutes before departure for reminder
escalationDelay: 5          // Minutes late before dispatch alert
pollingInterval: 60000      // Check every 1 minute (cron)
cleanupDays: 7              // Delete records older than 7 days
```

## Usage Examples

### Initialize Monitoring for a Trip
```javascript
// When assigning a driver to a trip
const response = await axios.post('/api/departure-monitoring/initialize', {
  tripId: '64abc...',
  driverId: '64def...',
  driverLocation: {
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

### Driver Starts Navigation
```javascript
// When driver clicks "Start Navigation"
const response = await axios.post(
  `/api/departure-monitoring/${monitoringId}/start-navigation`,
  {
    driverLocation: {
      latitude: currentLat,
      longitude: currentLng
    }
  }
);
```

### Get Late Drivers (Dispatch Dashboard)
```javascript
// Fetch all late drivers
const response = await axios.get('/api/departure-monitoring/late-drivers');

// Response includes:
{
  lateDrivers: [
    {
      driverId: {...},
      tripId: {...},
      minutesLate: 8,
      scheduledPickupTime: '2025-11-27T14:00:00Z',
      status: 'late'
    }
  ]
}
```

## Integration Points

### 1. Trip Assignment
When a trip is assigned to a driver:
```javascript
import TripDepartureMonitoring from './models/TripDepartureMonitoring.js';

// After assigning driver
await TripDepartureMonitoring.createMonitoring({
  tripId: trip._id,
  driverId: assignedDriverId,
  pickupLocation: trip.pickupLocation,
  scheduledPickupTime: trip.scheduledDate
});
```

### 2. Trip Cancellation
When a trip is cancelled:
```javascript
const monitoring = await TripDepartureMonitoring.findOne({ tripId });
if (monitoring) {
  await monitoring.completeMonitoring('cancelled');
}
```

### 3. Driver Dashboard
Add the component to show departure alerts:
```jsx
import DriverDepartureNotifications from './components/driver/DepartureNotifications';

<DriverDepartureNotifications driverId={user.userId} />
```

### 4. Dispatch Dashboard
Query late drivers and display alerts:
```javascript
const { data } = await axios.get('/api/departure-monitoring/late-drivers');
// Display in dashboard with highlighting
```

## Notification Examples

### 5-Minute Reminder (Driver)
```
🚗 Time to Prepare for Departure

Trip #T1234: You should start navigating to the pickup 
location in 5 minutes to arrive on time at 123 Main St.
```

### Departure Time Alert (Driver)
```
🚨 Start Navigation Now!

Trip #T1234: It's time to start navigating NOW! 
Pickup scheduled for 2:00 PM.
```

### Late Driver Escalation (Dispatch)
```
⚠️ Driver Late to Start Trip

Driver John Smith has not started navigating for Trip #T1234. 
They are 8 minutes late. Pickup scheduled: 2:00 PM. 
Please follow up immediately.
```

## Testing

### Create Test Monitoring Record
```javascript
import TripDepartureMonitoring from './models/TripDepartureMonitoring.js';

const monitoring = await TripDepartureMonitoring.createMonitoring({
  tripId: testTripId,
  driverId: testDriverId,
  pickupLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Test St, New York, NY'
  },
  scheduledPickupTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
  estimatedTravelTimeMinutes: 15
});
```

### Test Scenarios

1. **Normal Flow**
   - Create monitoring 30 minutes before pickup
   - Wait for 5-minute reminder
   - Start navigation before departure time
   - Verify monitoring completes successfully

2. **Late Driver**
   - Create monitoring
   - Don't start navigation
   - Wait 5 minutes past departure time
   - Verify dispatch escalation

3. **Early Starter**
   - Create monitoring
   - Start navigation immediately
   - Verify 5-minute reminder is suppressed

4. **Last-Minute Trip**
   - Create monitoring with pickup in 8 minutes
   - Verify status is 'skipped'
   - Verify no reminders sent

5. **Trip Cancellation**
   - Create monitoring
   - Cancel trip
   - Verify monitoring status updates
   - Verify no future notifications sent

## Troubleshooting

### Notifications Not Sending
1. Check that monitoring service is running: `departureMonitoringService.getStatus()`
2. Verify cron jobs are active
3. Check notification helper integration
4. Review server logs for errors

### Travel Time Calculation Fails
1. Verify Google Maps API key is configured
2. Check API quotas and billing
3. Falls back to Haversine distance estimation

### Driver Location Not Updating
1. Verify browser geolocation permissions
2. Check HTTPS (required for geolocation)
3. Test with manual location input

### Dispatch Alerts Not Appearing
1. Verify user has admin/dispatcher role
2. Check notification creation in database
3. Review dispatch dashboard query

## Performance Considerations

1. **Cron Job Frequency**: Runs every minute, lightweight queries
2. **Database Indexes**: Optimized for status and time-based queries
3. **Polling**: Frontend polls every 30 seconds (configurable)
4. **Cleanup**: Old records auto-deleted after 7 days
5. **API Rate Limits**: Google Maps calls only on monitoring initialization

## Security

1. **Authorization**: Drivers can only access their own monitoring
2. **Role-Based**: Dispatch views require admin/dispatcher role
3. **Data Privacy**: Location data stored only during active monitoring
4. **API Protection**: All endpoints require authentication

## Future Enhancements

- [ ] Real-time Socket.io notifications instead of polling
- [ ] SMS/Push notifications for critical alerts
- [ ] Traffic-aware dynamic departure time adjustments
- [ ] Historical analytics on driver departure patterns
- [ ] Predictive ML for travel time estimation
- [ ] Integration with vehicle telematics
- [ ] Multi-stop route optimization
- [ ] Automated driver availability checks

## Support

For issues or questions:
1. Check this documentation
2. Review server logs: `backend/logs/`
3. Test API endpoints with Postman
4. Verify monitoring service status
5. Check database records in MongoDB

---

**Status**: ✅ Fully Implemented and Ready for Production
**Last Updated**: November 27, 2025
