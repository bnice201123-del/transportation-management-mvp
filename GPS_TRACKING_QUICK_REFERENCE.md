# GPS Route Tracking - Quick Reference

## API Endpoints Quick Reference

### Start Tracking
```bash
POST /api/gps/:tripId/start
Authorization: Bearer <token>

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "altitude": 15.5
}
```

### Record Location
```bash
POST /api/gps/:tripId/location
Authorization: Bearer <token>

{
  "latitude": 40.7130,
  "longitude": -74.0062,
  "accuracy": 8,
  "speed": 12.5,
  "heading": 180,
  "batteryLevel": 85
}
```

### Batch Upload
```bash
POST /api/gps/:tripId/locations/batch
Authorization: Bearer <token>

{
  "locations": [
    { "latitude": 40.7131, "longitude": -74.0063, "timestamp": "2025-11-24T10:06:00Z" },
    { "latitude": 40.7133, "longitude": -74.0065, "timestamp": "2025-11-24T10:07:00Z" }
  ]
}
```

### Stop Tracking
```bash
POST /api/gps/:tripId/stop
Authorization: Bearer <token>

{
  "latitude": 40.7145,
  "longitude": -74.0080
}
```

### Get Route
```bash
GET /api/gps/:tripId/route?simplified=true
Authorization: Bearer <token>
```

### Get Analytics
```bash
GET /api/gps/:tripId/route/analytics
Authorization: Bearer <token>
```

### Export Route
```bash
GET /api/gps/:tripId/route/export?format=csv
Authorization: Bearer <token>
```

## Frontend Usage

### Display Route
```jsx
import RouteVisualization from './components/shared/RouteVisualization';

<RouteVisualization tripId="673abc123def456789" />
```

### Driver Integration
```javascript
// 1. Start tracking when trip begins
const watchId = await startGPSTracking(tripId);

// 2. Continuous updates happen automatically via watchPosition

// 3. Stop tracking when trip completes
await stopGPSTracking(tripId, watchId);
```

## Database Schema

```javascript
routeTracking: {
  isEnabled: Boolean,
  routePoints: [{ latitude, longitude, timestamp, accuracy, speed, heading }],
  routeSummary: { totalDistance, actualDuration, averageSpeed, maxSpeed },
  deviations: [{ timestamp, location, distanceFromPlanned }],
  geofenceEvents: [{ eventType, timestamp, location }]
}
```

## Response Examples

### Route Summary
```json
{
  "totalDistance": 5.67,
  "actualDuration": 30,
  "averageSpeed": 11.34,
  "maxSpeed": 25.8,
  "startTime": "2025-11-24T10:00:00Z",
  "endTime": "2025-11-24T10:30:00Z"
}
```

### Analytics Comparison
```json
{
  "summary": { "totalDistance": 5.67, "actualDuration": 30 },
  "comparison": {
    "estimatedDistance": 5.2,
    "actualDistance": 5.67,
    "distanceVariance": "9.04%"
  },
  "routeQuality": {
    "averageAccuracy": 8.5,
    "dataCompleteness": "92.00%"
  }
}
```

## Export Formats

### JSON
Complete data with all metadata

### CSV
```csv
Timestamp,Latitude,Longitude,Accuracy,Speed
2025-11-24T10:00:00Z,40.7128,-74.0060,10,0
2025-11-24T10:01:00Z,40.7130,-74.0062,8,12.5
```

### GPX
```xml
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <time>2025-11-24T10:00:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

## Common Patterns

### Offline Support
```javascript
// Queue failed location updates
const locationQueue = [];

try {
  await recordLocation(position);
} catch (error) {
  locationQueue.push(position);
}

// Later, when online
if (locationQueue.length > 0) {
  await batchUpload(tripId, locationQueue);
  locationQueue = [];
}
```

### Real-Time Updates
```javascript
// Update every 5 seconds while trip is active
const intervalId = setInterval(async () => {
  const position = await getCurrentPosition();
  await recordLocation(tripId, position);
}, 5000);

// Clear on trip completion
clearInterval(intervalId);
```

## Performance Tips

✅ Use simplified routes for visualization (max 100 points)
✅ Enable batch uploads for offline scenarios
✅ Filter points with < 5m movement for storage efficiency
✅ Export to CSV for large dataset analysis

## Authorization

- **Drivers**: Can track their assigned trips only
- **Dispatchers**: Can view all trip routes
- **Admins**: Full access to all routes and analytics
- **Riders**: Can request their own trip routes

## Error Handling

```javascript
try {
  await recordLocation(tripId, position);
} catch (error) {
  if (error.response?.status === 403) {
    console.error('Not authorized');
  } else if (error.response?.status === 404) {
    console.error('Trip not found');
  } else {
    // Queue for retry
    queueForRetry(position);
  }
}
```

## Testing Checklist

- [ ] Start tracking initializes route correctly
- [ ] Location updates are recorded accurately
- [ ] Batch upload works for multiple points
- [ ] Stop tracking finalizes route summary
- [ ] Distance calculations are accurate
- [ ] Speed calculations are correct
- [ ] Export formats are valid
- [ ] Authorization is enforced
- [ ] Map displays route correctly
- [ ] Analytics show correct comparisons

## Monitoring

Track these metrics:
- Average points per trip
- Storage size of route data
- API response times
- Failed location update rate
- Data quality scores

## Support

For issues or questions:
- Review GPS_TRACKING_SYSTEM.md for detailed documentation
- Check GPS_TRACKING_IMPLEMENTATION_SUMMARY.md for implementation details
- Verify GPS permissions and HTTPS requirements
- Check network connectivity for real-time updates
