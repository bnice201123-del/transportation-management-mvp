# Garage-Based Trip Monitoring System

## Overview
Comprehensive automated monitoring system that tracks trip assignments, driver progress, and issues based on garage location at **5701 Shingle Creek Pkwy, Minneapolis, MN 55430**.

## Features

### 1. Unassigned Trip Monitoring
- **Threshold Calculation**: `max(pickup_time - 1 hour, pickup_time - drive_time_from_garage)`
- **Initial Alert**: Sent when threshold time is reached
- **Follow-up Alerts**: Every 15 minutes until assigned or cancelled
- **Escalation**: After 2 follow-ups within 30 minutes of pickup
- **Auto-resolution**: When driver assigned or trip cancelled

### 2. Driver Progress Tracking
- **Lateness Detection**: GPS + ETA calculations vs scheduled pickup time
- **Stopped Movement**: Alert if driver hasn't moved 50+ meters in 5 minutes
- **GPS Stale Detection**: Alert if no GPS update for 10 minutes
- **On-time Tracking**: Only monitors drivers who started on time

### 3. Trip Lifecycle Notifications
- **Assignment**: Confirmation when driver assigned
- **Started**: Progress tracking initiated when driver starts trip
- **Completed**: Summary with metrics and any issues encountered
- **Cancelled**: Notifications to all parties with cleanup of alerts

---

## Architecture

### Backend Components

#### **Models**
1. **UnassignedTripAlert** (`backend/models/UnassignedTripAlert.js`)
   - Tracks unassigned trips and alert history
   - Fields: threshold time, drive time, follow-up count, escalation status
   - Methods: `markFirstAlertSent()`, `markFollowUpSent()`, `escalate()`, `resolve()`

2. **DriverProgressTracking** (`backend/models/DriverProgressTracking.js`)
   - Monitors driver GPS and movement during trips
   - Fields: location history, lateness alerts, stopped alerts, GPS status
   - Methods: `updateLocation()`, `recordLatenessAlert()`, `recordStoppedAlert()`

#### **Services**
1. **unassignedTripMonitoringService** (`backend/services/unassignedTripMonitoringService.js`)
   - Cron jobs run **every minute**
   - Jobs: check unassigned trips, send initial alerts, send follow-ups, resolve assigned trips
   - Cleanup: Deletes old resolved alerts after 7 days

2. **driverProgressMonitoringService** (`backend/services/driverProgressMonitoringService.js`)
   - Cron jobs run **every minute**
   - Jobs: check lateness, check stopped movement, check GPS staleness
   - Auto-initializes tracking for in-progress trips
   - Auto-completes tracking for finished trips

#### **Utilities**
1. **tripMonitoringCalculations** (`backend/utils/tripMonitoringCalculations.js`)
   - `calculateGarageToPickupETA()`: Travel time from garage using Google Maps API
   - `calculateUnassignedAlertThreshold()`: When to send first alert
   - `calculateDriverLateness()`: ETA vs scheduled time comparison
   - `detectDriverStopped()`: Movement detection using Haversine distance
   - `checkGPSStale()`: Time since last GPS update

2. **tripLifecycleHooks** (`backend/utils/tripLifecycleHooks.js`)
   - `handleTripAssigned()`: Resolves unassigned alerts
   - `handleTripStarted()`: Creates driver progress tracking
   - `handleTripCompleted()`: Completes all monitoring, sends summary
   - `handleTripCancelled()`: Cancels all alerts and tracking
   - `handleDriverLocationUpdate()`: Updates GPS in tracking

#### **Configuration**
**systemConfig.js** (`backend/config/systemConfig.js`)
```javascript
GARAGE_LOCATION: {
  address: "5701 Shingle Creek Pkwy, Minneapolis, MN 55430",
  coordinates: { latitude: 45.0663, longitude: -93.3322 }
}

TRIP_MONITORING: {
  minHoursBeforePickup: 1,              // Minimum alert threshold
  followUpIntervalMinutes: 15,          // Follow-up frequency
  driverStoppedThresholdMinutes: 5,     // Stopped detection threshold
  latenessTolerance: 0,                 // Minutes late before alert
  gpsStaleThresholdMinutes: 10          // GPS staleness threshold
}
```

#### **API Routes**
**tripMonitoring** (`backend/routes/tripMonitoring.js`)

**Unassigned Alerts:**
- `GET /api/trip-monitoring/unassigned-alerts` - List all alerts
- `GET /api/trip-monitoring/unassigned-alerts/:id` - Get specific alert
- `GET /api/trip-monitoring/unassigned-alerts/trip/:tripId` - Get alert for trip
- `POST /api/trip-monitoring/unassigned-alerts/:id/resolve` - Manually resolve
- `GET /api/trip-monitoring/unassigned-alerts-statistics` - Statistics

**Driver Progress:**
- `GET /api/trip-monitoring/driver-progress` - List all tracking
- `GET /api/trip-monitoring/driver-progress/trip/:tripId` - Get for trip
- `GET /api/trip-monitoring/driver-progress/driver/:driverId` - Get for driver
- `POST /api/trip-monitoring/driver-progress/:id/location` - Update GPS location
- `GET /api/trip-monitoring/driver-progress/alerts/lateness` - Late drivers
- `GET /api/trip-monitoring/driver-progress/alerts/stopped` - Stopped drivers
- `GET /api/trip-monitoring/driver-progress-statistics` - Statistics

**Dashboard:**
- `GET /api/trip-monitoring/dashboard` - Complete monitoring overview

---

## Integration Points

### Trip Route Integration
**backend/routes/trips.js** - Lifecycle hooks integrated at:

1. **Driver Assignment** (`POST /:id/assign`, `PUT /:id`)
   ```javascript
   await handleTripAssigned(trip._id, driverId, req.user.userId);
   ```

2. **Status Updates** (`PATCH /:id/status`)
   ```javascript
   // Started
   if (status === 'in_progress') {
     await handleTripStarted(trip._id, trip.assignedDriver);
   }
   
   // Completed
   if (status === 'completed') {
     await handleTripCompleted(trip._id, req.user.userId);
   }
   
   // Cancelled
   if (status === 'cancelled') {
     await handleTripCancelled(trip._id, reason, req.user.userId);
   }
   ```

3. **Location Updates** (`PATCH /:id/status`)
   ```javascript
   if (location && trip.assignedDriver) {
     await handleDriverLocationUpdate(trip._id, trip.assignedDriver, lat, lng, speed, accuracy);
   }
   ```

4. **Deletion** (`DELETE /:id`)
   ```javascript
   await handleTripCancelled(trip._id, trip.cancellationReason, req.user.userId);
   ```

### Server Startup
**backend/server.js**
```javascript
server.listen(PORT, () => {
  departureMonitoringService.start();
  unassignedTripMonitoringService.start();
  driverProgressMonitoringService.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
  departureMonitoringService.stop();
  unassignedTripMonitoringService.stop();
  driverProgressMonitoringService.stop();
});
```

---

## Notification Types

### Unassigned Trip Notifications
**Type**: `trip_unassigned`
**Recipients**: Dispatchers
**Priority**: Medium → High → Urgent (based on time until pickup)
**Data**:
```javascript
{
  tripId, pickupTime, pickupLocation, dropoffLocation,
  riderName, driveTimeFromGarage, minutesUntilPickup,
  alertType: 'initial' | 'followup',
  followUpCount
}
```

### Driver Lateness Notifications
**Type**: `driver_late`
**Recipients**: Dispatchers + Driver
**Priority**: Medium → High → Urgent (based on minutes late)
**Data**:
```javascript
{
  tripId, driverId, driverName, minutesLate,
  estimatedArrival, scheduledTime,
  distanceToPickup, pickupLocation
}
```

### Stopped Driver Notifications
**Type**: `driver_issue`
**Recipients**: Dispatchers + Driver
**Priority**: High
**Data**:
```javascript
{
  tripId, driverId, driverName, minutesStopped,
  location, distanceMovedMeters, pickupLocation
}
```

### GPS Stale Notifications
**Type**: `driver_issue` / `system_alert`
**Recipients**: Dispatchers + Driver
**Priority**: High
**Data**:
```javascript
{
  tripId, driverId, driverName,
  minutesSinceUpdate, lastUpdate
}
```

### Trip Lifecycle Notifications
**Types**: `trip_assigned`, `trip_completed`, `trip_cancelled`
**Recipients**: Dispatchers (+ Driver/Rider for cancelled)
**Priority**: Low → Medium
**Data**: Trip details, participants, metrics (for completed)

---

## Monitoring Logic

### Unassigned Trip Flow
1. **Detection**: Every minute, finds trips without drivers
2. **Alert Creation**: Calculates threshold using garage location + Google Maps
3. **Initial Alert**: Sent when `current_time >= threshold_time`
4. **Follow-ups**: Every 15 minutes if still unassigned
5. **Escalation**: To admins if >2 follow-ups within 30 min of pickup
6. **Resolution**: Auto-resolves when driver assigned or trip cancelled

### Driver Progress Flow
1. **Initiation**: Tracking created when trip status → `in_progress`
2. **GPS Updates**: Location stored every time driver sends update
3. **Lateness Check**: Every minute, calculates ETA vs scheduled time
   - Uses Google Maps API for accurate travel time
   - Only checks drivers who started on time
   - Min 5 minutes between alerts
4. **Stopped Check**: Every minute, compares location with 5 min ago
   - Checks if moved <50 meters in 5 minutes
   - Min 10 minutes between alerts
5. **GPS Stale Check**: Every minute, checks last update time
   - Alert if >10 minutes since last GPS data
6. **Completion**: Auto-completes when trip → `completed` or `cancelled`

### Calculation Examples

**Unassigned Alert Threshold:**
```
Pickup time: 3:00 PM
Drive time from garage: 25 minutes
Threshold: max(3:00 PM - 1 hour, 3:00 PM - 25 min)
         = max(2:00 PM, 2:35 PM)
         = 2:00 PM (alert sent at 2:00 PM)
```

**Driver Lateness:**
```
Scheduled pickup: 3:00 PM
Driver location: 5 miles away
Google Maps ETA: 15 minutes
Estimated arrival: 2:55 PM (current time 2:40 PM)
Result: On time (ETA < scheduled)

// Later...
Current time: 2:50 PM
Google Maps ETA: 15 minutes
Estimated arrival: 3:05 PM
Result: 5 minutes late → Send alert
```

**Stopped Detection:**
```
Location 5 min ago: (45.0663, -93.3322)
Current location:   (45.0664, -93.3323)
Distance moved: 12 meters
Threshold: 50 meters
Result: Stopped → Send alert
```

---

## Error Handling

### Google Maps API Fallback
If Google Maps API fails:
1. **Haversine Formula**: Calculates straight-line distance
2. **Speed Assumption**: 30 mph average speed
3. **Estimation Method**: Flagged as 'haversine' in response

### Missing Data Handling
- **No GPS Data**: Marks as GPS stale, sends alert
- **Trip Not Found**: Logs error, skips monitoring
- **Driver Not Assigned**: Skips progress monitoring

### Service Failure Recovery
- **Cron Job Failure**: Logs error, continues next cycle
- **Service Crash**: Auto-restarts on next server boot
- **Database Error**: Logs error, continues with other records

---

## Performance Considerations

### Optimization Strategies
1. **Database Indexes**: On tripId, driverId, status, timestamps
2. **Batch Processing**: Processes multiple trips/drivers per cron cycle
3. **Selective Querying**: Only active/relevant records
4. **Location History Limit**: Keeps last 100 GPS points per trip
5. **Auto Cleanup**: Deletes old resolved records after 7 days

### Cron Schedule
- **Every Minute**: Unassigned checks, driver progress checks
- **Daily at 2-3 AM**: Cleanup of old resolved records

### Expected Load
- **Trips/Day**: ~100-500
- **Active Monitoring**: ~10-50 concurrent trips
- **Cron Executions**: ~1,440 per day (every minute)
- **Database Operations**: ~5,000-10,000 per day

---

## Testing Checklist

### Unassigned Trip Monitoring
- [ ] Alert created for unassigned trip at threshold time
- [ ] Follow-up sent 15 minutes after initial alert
- [ ] Escalation triggered after 2 follow-ups near pickup time
- [ ] Alert resolves when driver assigned
- [ ] Alert cancels when trip cancelled
- [ ] No alerts for trips with drivers

### Driver Progress Monitoring
- [ ] Tracking created when trip starts
- [ ] GPS updates stored in location history
- [ ] Lateness alert sent when ETA > scheduled time
- [ ] Stopped alert sent when no movement for 5 minutes
- [ ] GPS stale alert sent when no update for 10 minutes
- [ ] Tracking completes when trip completes
- [ ] Only monitors drivers who started on time

### Lifecycle Notifications
- [ ] Assignment notification sent to dispatch
- [ ] Completion notification sent with metrics
- [ ] Cancellation notifications sent to all parties
- [ ] Driver/rider notifications sent appropriately

### API Endpoints
- [ ] Dashboard returns all active alerts and issues
- [ ] Statistics endpoints return accurate data
- [ ] Manual resolution works correctly
- [ ] Location update endpoint stores GPS data

---

## Troubleshooting

### Issue: Alerts Not Sending
**Check:**
1. Service running: `GET /api/trip-monitoring/dashboard`
2. Cron jobs active: Check console logs for "[Unassigned Trip Monitor]"
3. Threshold calculations: Verify Google Maps API key
4. Database records: Check UnassignedTripAlert collection

### Issue: GPS Not Updating
**Check:**
1. Driver sending location: Frontend GPS integration
2. Tracking record exists: `GET /api/trip-monitoring/driver-progress/trip/:tripId`
3. Location endpoint receiving data: Check request logs
4. Database saving: Check DriverProgressTracking collection

### Issue: Services Not Starting
**Check:**
1. Server startup logs for error messages
2. Import paths in server.js
3. MongoDB connection successful
4. Node-cron package installed

### Issue: Google Maps API Errors
**Check:**
1. API key valid and has Distance Matrix API enabled
2. Billing enabled on Google Cloud project
3. Fallback to Haversine working (check 'estimationMethod' in logs)
4. Rate limits not exceeded

---

## Future Enhancements

### Potential Additions
1. **Predictive Alerts**: ML-based prediction of driver delays
2. **Route Optimization**: Suggest better driver assignments based on location
3. **Real-time Dashboard**: Socket.io integration for live updates
4. **SMS Notifications**: Twilio integration for urgent alerts
5. **Historical Analysis**: Driver performance trends over time
6. **Multi-garage Support**: Handle multiple dispatch locations
7. **Weather Integration**: Factor weather into travel time calculations
8. **Traffic Data**: Real-time traffic conditions in ETA calculations

### Mobile App Integration
- **Driver App**: Real-time monitoring status visibility
- **Push Notifications**: Native mobile alerts
- **Offline Support**: Queue alerts when offline

---

## Configuration Reference

### Environment Variables Required
```env
GOOGLE_MAPS_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string
PORT=3001
NODE_ENV=production
```

### Adjustable Thresholds
Edit `backend/config/systemConfig.js`:
- `minHoursBeforePickup`: Minimum alert lead time
- `followUpIntervalMinutes`: Time between follow-ups
- `driverStoppedThresholdMinutes`: Stopped detection time
- `latenessTolerance`: Minutes late before alert
- `gpsStaleThresholdMinutes`: GPS staleness threshold

### Garage Location
To change garage location, update:
```javascript
GARAGE_LOCATION: {
  address: "Your Address",
  coordinates: { latitude: XX.XXXX, longitude: -XX.XXXX }
}
```

---

## Maintenance

### Daily Tasks
- Monitor service logs for errors
- Review escalated alerts
- Check Google Maps API usage

### Weekly Tasks
- Review alert statistics
- Analyze driver performance metrics
- Verify cleanup jobs running

### Monthly Tasks
- Review notification effectiveness
- Adjust thresholds if needed
- Update documentation with learnings

---

## Summary

**What It Does:**
- Automatically monitors unassigned trips and alerts dispatch
- Tracks driver GPS and detects lateness/stopped movement
- Sends lifecycle notifications for all trip events
- Provides comprehensive dashboard for dispatch oversight

**How It Works:**
- Cron jobs run every minute checking all conditions
- Uses Google Maps API for accurate travel time calculations
- Integrates with existing trip routes via lifecycle hooks
- Stores all data in MongoDB for historical analysis

**Why It's Useful:**
- **Proactive**: Catches issues before they become problems
- **Automated**: No manual checking required
- **Comprehensive**: Covers entire trip lifecycle
- **Scalable**: Handles hundreds of daily trips efficiently
