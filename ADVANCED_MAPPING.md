# Advanced Mapping & Analytics Features

## Overview
This document describes the comprehensive mapping and analytics system implemented in the transportation MVP. The system includes offline maps, geofencing, traffic prediction, driver analytics, parking management, and route optimization features.

## Table of Contents
1. [Offline Maps](#offline-maps)
2. [Custom Map Styles](#custom-map-styles)
3. [Geofencing](#geofencing)
4. [Traffic Prediction](#traffic-prediction)
5. [Route Playback](#route-playback)
6. [Driver Heatmaps](#driver-heatmaps)
7. [Area Analytics](#area-analytics)
8. [Parking Location Tracking](#parking-location-tracking)
9. [Speed Monitoring](#speed-monitoring)
10. [Route Deviation Alerts](#route-deviation-alerts)
11. [Fuel-Efficient Routing](#fuel-efficient-routing)
12. [ETA Accuracy Improvements](#eta-accuracy-improvements)

---

## Offline Maps

Download and cache map tiles for offline use, enabling the app to function without internet connectivity.

### Download Map Tiles
```
POST /api/maps/offline/download
```

**Request Body:**
```json
{
  "bounds": {
    "southwest": { "lat": 40.7, "lng": -74.0 },
    "northeast": { "lat": 40.8, "lng": -73.9 }
  },
  "zoomLevels": [10, 11, 12]
}
```

**Response:**
```json
{
  "success": true,
  "tilesDownloaded": 245,
  "totalSize": "15.3 MB",
  "downloadPath": "/offline-maps",
  "zoomLevels": [10, 11, 12]
}
```

**Features:**
- Uses OpenStreetMap tiles (open source, free)
- Caches tiles locally to avoid re-downloading
- Supports multiple zoom levels
- Tile structure: `/zoom/x/y.png`

---

## Custom Map Styles

Get custom map style configurations for different visual themes.

### Get Map Style
```
GET /api/maps/styles/:theme
```

**Available Themes:**
- `standard` - Default map style
- `dark` - Dark theme for night mode
- `light` - Light/minimal theme
- `transit` - Emphasizes public transit
- `satellite` - Satellite imagery view

**Response:**
```json
{
  "success": true,
  "style": {
    "name": "Dark Theme",
    "description": "Dark color scheme for night driving",
    "colors": {
      "background": "#1a1a1a",
      "roads": "#2d2d2d",
      "water": "#0d1117",
      "parks": "#1a3a1a",
      "buildings": "#252525",
      "text": "#ffffff"
    },
    "features": {
      "showTraffic": true,
      "showTransit": false,
      "showPOI": true
    }
  }
}
```

---

## Geofencing

Create and manage geographic boundaries with automated triggers for entry, exit, and dwell events.

### Create Geofence
```
POST /api/maps/geofences
```

**Request Body (Circular):**
```json
{
  "name": "Downtown Pickup Zone",
  "category": "pickup_zone",
  "type": "circular",
  "center": { "lat": 40.7589, "lng": -73.9851 },
  "radius": 500,
  "triggerEvents": ["enter", "exit"],
  "notifications": {
    "onEnter": true,
    "onExit": false,
    "recipients": ["admin@example.com"]
  },
  "speedLimit": 25,
  "schedule": {
    "enabled": true,
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "07:00",
    "endTime": "19:00"
  }
}
```

**Request Body (Polygon):**
```json
{
  "name": "Restricted Area",
  "category": "restricted_area",
  "type": "polygon",
  "polygon": [
    { "lat": 40.7589, "lng": -73.9851 },
    { "lat": 40.7590, "lng": -73.9840 },
    { "lat": 40.7580, "lng": -73.9845 },
    { "lat": 40.7585, "lng": -73.9855 }
  ],
  "triggerEvents": ["enter", "dwell"],
  "dwellTimeThreshold": 300
}
```

**Categories:**
- `pickup_zone` - Designated pickup areas
- `dropoff_zone` - Designated dropoff areas
- `restricted_area` - No-entry zones
- `service_area` - Coverage area boundaries
- `parking` - Parking facility boundaries
- `depot` - Vehicle depot/garage areas
- `custom` - Other custom zones

### List Geofences
```
GET /api/maps/geofences?category=pickup_zone&active=true
```

### Get Single Geofence
```
GET /api/maps/geofences/:id
```

### Update Geofence
```
PUT /api/maps/geofences/:id
```

### Delete Geofence
```
DELETE /api/maps/geofences/:id
```

### Check Point in Geofence
```
POST /api/maps/geofences/:id/check-point
```

**Request Body:**
```json
{
  "point": { "lat": 40.7589, "lng": -73.9851 }
}
```

**Response:**
```json
{
  "success": true,
  "inside": true,
  "geofence": {
    "id": "GEO-1234567890-abc",
    "name": "Downtown Pickup Zone",
    "category": "pickup_zone"
  }
}
```

**Geofence Statistics:**
- Total enter events
- Total exit events
- Total dwell events
- Average dwell time
- Last triggered timestamp

---

## Traffic Prediction

Predict traffic conditions using machine learning analysis of historical trip data.

### Predict Traffic
```
POST /api/maps/analytics/predict-traffic
```

**Request Body:**
```json
{
  "route": {
    "origin": { "lat": 40.7589, "lng": -73.9851 },
    "destination": { "lat": 40.7489, "lng": -73.9751 }
  },
  "targetTime": "2024-01-15T08:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "trafficLevel": "moderate",
    "distribution": {
      "light": 15,
      "moderate": 45,
      "heavy": 25,
      "severe": 15
    },
    "confidence": 85,
    "sampleSize": 32,
    "averageDuration": 28.5,
    "predictedDuration": 32
  }
}
```

**Traffic Levels:**
- `light` - Free flowing traffic
- `moderate` - Some congestion
- `heavy` - Significant delays
- `severe` - Stop-and-go traffic

**Confidence Scoring:**
- Based on sample size of historical trips
- 20+ samples = 100% confidence
- 10-19 samples = 75% confidence
- 5-9 samples = 50% confidence
- <5 samples = Insufficient data

---

## Route Playback

Retrieve GPS tracking data for visualizing historical trip routes.

### Get Route Playback
```
GET /api/maps/analytics/playback/:tripId
```

**Response:**
```json
{
  "success": true,
  "tripId": "TRIP-123",
  "playback": [
    {
      "timestamp": "2024-01-15T08:15:00.000Z",
      "location": { "lat": 40.7589, "lng": -73.9851 },
      "speed": 45,
      "heading": 270,
      "accuracy": 10
    },
    {
      "timestamp": "2024-01-15T08:15:30.000Z",
      "location": { "lat": 40.7590, "lng": -73.9840 },
      "speed": 48,
      "heading": 272,
      "accuracy": 8
    }
  ],
  "duration": 1800,
  "totalDistance": 15.2
}
```

**Playback Data:**
- Timestamp for each GPS point
- Location coordinates
- Speed at each point
- Heading/direction
- GPS accuracy
- Total duration and distance

---

## Driver Heatmaps

Generate heatmap visualizations showing where drivers spend most of their time.

### Generate Driver Heatmap
```
GET /api/maps/analytics/heatmap/driver/:driverId?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "driverId": "DRV-123",
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "heatmapPoints": [
    {
      "lat": 40.7589,
      "lng": -73.9851,
      "intensity": 25
    },
    {
      "lat": 40.7590,
      "lng": -73.9840,
      "intensity": 18
    }
  ],
  "bounds": {
    "southwest": { "lat": 40.7, "lng": -74.0 },
    "northeast": { "lat": 40.8, "lng": -73.9 }
  },
  "totalPoints": 1247,
  "aggregatedPoints": 84
}
```

**Heatmap Features:**
- Point aggregation (clusters nearby points)
- Intensity values based on frequency
- Automatic bounds calculation
- Optimized for visualization

---

## Area Analytics

Get comprehensive analytics for a specific geographic area.

### Get Area Analytics
```
POST /api/maps/analytics/area
```

**Request Body:**
```json
{
  "bounds": {
    "southwest": { "lat": 40.7, "lng": -74.0 },
    "northeast": { "lat": 40.8, "lng": -73.9 }
  },
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalTrips": 432,
    "totalDistance": 5280.5,
    "totalDuration": 12450,
    "averageRating": 4.6,
    "totalRevenue": 8640.00,
    "peakHours": [
      { "hour": 8, "trips": 45 },
      { "hour": 17, "trips": 52 }
    ],
    "topDrivers": [
      { "driverId": "DRV-123", "trips": 58, "rating": 4.8 },
      { "driverId": "DRV-456", "trips": 52, "rating": 4.7 }
    ],
    "topVehicles": [
      { "vehicleId": "VEH-789", "trips": 67 }
    ],
    "bounds": {
      "southwest": { "lat": 40.7, "lng": -74.0 },
      "northeast": { "lat": 40.8, "lng": -73.9 }
    }
  }
}
```

**Analytics Metrics:**
- Trip volume and patterns
- Total distance/duration
- Revenue statistics
- Peak hour identification
- Top performing drivers/vehicles
- Average ratings

---

## Parking Location Tracking

Manage parking facilities with capacity tracking, operating hours, and access control.

### Create Parking Location
```
POST /api/maps/parking
```

**Request Body:**
```json
{
  "name": "Main Depot Parking",
  "location": { "lat": 40.7589, "lng": -73.9851 },
  "facilityType": "depot",
  "capacity": {
    "total": 50,
    "reserved": 10
  },
  "operatingHours": {
    "monday": { "open": "06:00", "close": "22:00" },
    "tuesday": { "open": "06:00", "close": "22:00" },
    "wednesday": { "open": "06:00", "close": "22:00" },
    "thursday": { "open": "06:00", "close": "22:00" },
    "friday": { "open": "06:00", "close": "22:00" },
    "saturday": { "open": "08:00", "close": "20:00" },
    "sunday": { "open": "08:00", "close": "20:00" }
  },
  "features": ["covered", "security_cameras", "ev_charging"],
  "pricing": {
    "hourlyRate": 5.00,
    "dailyRate": 30.00,
    "monthlyRate": 600.00
  },
  "accessControl": {
    "requiresPermit": true,
    "authorizedVehicles": ["VEH-123", "VEH-456"]
  }
}
```

**Facility Types:**
- `depot` - Company vehicle depot
- `public_lot` - Public parking lot
- `street_parking` - Street parking zone
- `private_garage` - Private parking garage

**Features:**
- `covered` - Covered parking
- `security_cameras` - Video surveillance
- `lighting` - Well-lit area
- `ev_charging` - EV charging stations
- `wheelchair_accessible` - Accessible parking

### List Parking Locations
```
GET /api/maps/parking?available=true
```

**Response:**
```json
{
  "success": true,
  "parkingLocations": [
    {
      "id": "PARK-123",
      "name": "Main Depot Parking",
      "location": { "lat": 40.7589, "lng": -73.9851 },
      "facilityType": "depot",
      "capacity": {
        "total": 50,
        "available": 32,
        "reserved": 10,
        "occupied": 18
      },
      "occupancyRate": 36,
      "features": ["covered", "security_cameras"],
      "status": "available"
    }
  ]
}
```

---

## Speed Monitoring

Calculate vehicle speed and check for speed limit violations.

### Calculate Speed
```
POST /api/maps/speed/calculate
```

**Request Body:**
```json
{
  "point1": {
    "lat": 40.7589,
    "lng": -73.9851,
    "timestamp": "2024-01-15T08:15:00.000Z"
  },
  "point2": {
    "lat": 40.7590,
    "lng": -73.9840,
    "timestamp": "2024-01-15T08:15:30.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "speed": {
    "kmh": 45.2,
    "mph": 28.1,
    "mps": 12.6
  },
  "distance": 378,
  "duration": 30
}
```

### Check Speed Limit
```
POST /api/maps/speed/check-limit
```

**Request Body:**
```json
{
  "currentSpeed": 85,
  "speedLimit": 65
}
```

**Response:**
```json
{
  "success": true,
  "violation": true,
  "severity": "major",
  "details": {
    "currentSpeed": 85,
    "speedLimit": 65,
    "over": 20,
    "percentage": 130.8
  },
  "alert": "Major speed violation: 20 km/h over the limit"
}
```

**Severity Levels:**
- `minor` - 1-10 km/h over limit
- `moderate` - 11-20 km/h over limit
- `major` - 21-30 km/h over limit
- `severe` - 30+ km/h over limit

---

## Route Deviation Alerts

Detect when a vehicle deviates from its planned route.

### Check Route Deviation
```
POST /api/maps/route/check-deviation
```

**Request Body:**
```json
{
  "currentLocation": { "lat": 40.7589, "lng": -73.9851 },
  "plannedRoute": [
    { "lat": 40.7580, "lng": -73.9850 },
    { "lat": 40.7585, "lng": -73.9845 },
    { "lat": 40.7590, "lng": -73.9840 }
  ],
  "threshold": 500
}
```

**Response:**
```json
{
  "success": true,
  "deviation": {
    "detected": false,
    "distance": 245,
    "threshold": 500,
    "nearestPoint": { "lat": 40.7585, "lng": -73.9845 },
    "alert": null
  }
}
```

**Features:**
- Configurable threshold (default: 500m)
- Finds nearest point on planned route
- Alerts when deviation exceeds threshold
- Useful for monitoring driver compliance

---

## Fuel-Efficient Routing

Get route recommendations optimized for fuel efficiency.

### Get Fuel-Efficient Route
```
POST /api/maps/route/fuel-efficient
```

**Request Body:**
```json
{
  "origin": { "lat": 40.7589, "lng": -73.9851 },
  "destination": { "lat": 40.7489, "lng": -73.9751 },
  "waypoints": [
    { "lat": 40.7550, "lng": -73.9800 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "routes": [
    {
      "summary": "Via Highway Route",
      "distance": 15200,
      "duration": 1200,
      "fuelScore": 92,
      "estimatedFuel": 1.52,
      "analysis": {
        "highwayDistance": 12000,
        "cityDistance": 3200,
        "highwayPercentage": 78.9,
        "averageSpeed": 76
      },
      "recommendation": "Most fuel efficient - Highway driving optimized"
    },
    {
      "summary": "Via City Route",
      "distance": 13500,
      "duration": 1500,
      "fuelScore": 78,
      "estimatedFuel": 1.73,
      "analysis": {
        "highwayDistance": 5000,
        "cityDistance": 8500,
        "highwayPercentage": 37.0,
        "averageSpeed": 54
      },
      "recommendation": "Less efficient - More city driving"
    }
  ]
}
```

**Fuel Efficiency Factors:**
- Highway vs city driving ratio
- Average speed (optimal: 80-90 km/h)
- Total distance
- Estimated fuel consumption
  - Highway: 7 L/100km
  - City: 10 L/100km

**Fuel Score:**
- 90-100: Excellent efficiency
- 80-89: Good efficiency
- 70-79: Moderate efficiency
- <70: Poor efficiency

---

## ETA Accuracy Improvements

Improve estimated time of arrival accuracy using machine learning on historical trip data.

### Improve ETA
```
POST /api/maps/analytics/improve-eta
```

**Request Body:**
```json
{
  "route": {
    "origin": { "lat": 40.7589, "lng": -73.9851 },
    "destination": { "lat": 40.7489, "lng": -73.9751 }
  },
  "estimatedETA": 1800
}
```

**Response:**
```json
{
  "success": true,
  "improvement": {
    "originalETA": 1800,
    "improvedETA": 1980,
    "adjustment": 180,
    "confidence": 85,
    "sampleSize": 28,
    "historicalData": {
      "averageActual": 1980,
      "averageEstimate": 1800,
      "averageBias": 180
    }
  }
}
```

**ML Features:**
- Analyzes historical trips in same geographic area
- Calculates bias between estimates and actuals
- Adjusts future estimates based on learned patterns
- Confidence scoring based on sample size
- Improves accuracy over time with more data

---

## Integration Examples

### Example 1: Real-Time Geofence Monitoring

```javascript
// Monitor driver location and check geofence triggers
async function monitorDriverLocation(driverId, location) {
  // Get all active geofences
  const geofences = await fetch('/api/maps/geofences?active=true');
  
  // Check each geofence
  for (const geofence of geofences.data) {
    const check = await fetch(`/api/maps/geofences/${geofence.id}/check-point`, {
      method: 'POST',
      body: JSON.stringify({ point: location })
    });
    
    if (check.inside) {
      console.log(`Driver entered ${geofence.name}`);
      // Trigger notifications, update UI, etc.
    }
  }
}
```

### Example 2: Speed Violation Detection

```javascript
// Check driver speed against limit
async function checkDriverSpeed(point1, point2, speedLimit) {
  const speedData = await fetch('/api/maps/speed/calculate', {
    method: 'POST',
    body: JSON.stringify({ point1, point2 })
  });
  
  const violation = await fetch('/api/maps/speed/check-limit', {
    method: 'POST',
    body: JSON.stringify({
      currentSpeed: speedData.speed.kmh,
      speedLimit: speedLimit
    })
  });
  
  if (violation.violation) {
    console.warn(`Speed violation: ${violation.severity}`);
    // Send alert, log event, etc.
  }
}
```

### Example 3: Smart Route Selection

```javascript
// Get fuel-efficient route with traffic prediction
async function planOptimalTrip(origin, destination, departureTime) {
  // Get fuel-efficient routes
  const routes = await fetch('/api/maps/route/fuel-efficient', {
    method: 'POST',
    body: JSON.stringify({ origin, destination })
  });
  
  // Predict traffic for each route
  for (const route of routes.routes) {
    const traffic = await fetch('/api/maps/analytics/predict-traffic', {
      method: 'POST',
      body: JSON.stringify({
        route: { origin, destination },
        targetTime: departureTime
      })
    });
    
    route.trafficPrediction = traffic.prediction;
  }
  
  // Select best route based on fuel efficiency and traffic
  return routes.routes.sort((a, b) => {
    const scoreA = a.fuelScore - (a.trafficPrediction.trafficLevel === 'heavy' ? 20 : 0);
    const scoreB = b.fuelScore - (b.trafficPrediction.trafficLevel === 'heavy' ? 20 : 0);
    return scoreB - scoreA;
  })[0];
}
```

### Example 4: Driver Performance Analytics

```javascript
// Generate comprehensive driver analytics
async function analyzeDriverPerformance(driverId, dateRange) {
  // Get driver heatmap
  const heatmap = await fetch(
    `/api/maps/analytics/heatmap/driver/${driverId}?startDate=${dateRange.start}&endDate=${dateRange.end}`
  );
  
  // Get area analytics for driver's primary area
  const areaAnalytics = await fetch('/api/maps/analytics/area', {
    method: 'POST',
    body: JSON.stringify({
      bounds: heatmap.bounds,
      startDate: dateRange.start,
      endDate: dateRange.end
    })
  });
  
  return {
    heatmap: heatmap.heatmapPoints,
    performance: areaAnalytics.analytics,
    coverage: heatmap.bounds
  };
}
```

---

## Best Practices

### Geofencing
- Use circular geofences for simple zones (more efficient)
- Use polygon geofences for complex shapes
- Set appropriate dwell time thresholds (300-600 seconds)
- Schedule geofences to reduce unnecessary checks
- Limit notifications to avoid alert fatigue

### Traffic Prediction
- Requires at least 5 historical trips for basic prediction
- 20+ trips recommended for high confidence
- Consider time of day and day of week patterns
- Update predictions regularly as data accumulates

### Speed Monitoring
- Calculate speed over reasonable intervals (30-60 seconds)
- Account for GPS accuracy errors
- Set appropriate severity thresholds for your use case
- Log violations for driver coaching

### Route Deviation
- Set threshold based on road types (500m urban, 1km highway)
- Allow grace period after route start
- Consider GPS accuracy in detection
- Provide visual feedback to drivers

### Fuel Efficiency
- Prefer highway routes when distance difference is small
- Consider traffic predictions in route selection
- Update fuel consumption rates based on actual vehicle data
- Factor in vehicle type and load

### ETA Accuracy
- Continuously learn from completed trips
- Segment by time of day for better predictions
- Consider weather and special events
- Provide confidence levels to users

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `GEOFENCE_NOT_FOUND` - Geofence ID not found
- `INVALID_BOUNDS` - Invalid geographic bounds
- `INSUFFICIENT_DATA` - Not enough historical data
- `DOWNLOAD_FAILED` - Map tile download failed
- `INVALID_COORDINATES` - Invalid lat/lng values
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions

---

## Performance Considerations

### Offline Maps
- Download tiles during off-peak hours
- Cache tiles to reduce bandwidth
- Limit zoom levels to reduce storage (10-12 recommended)
- Clean up old tiles periodically

### Geofencing
- Index geofences by geographic area
- Cache active geofences in memory
- Use spatial queries for efficient checking
- Limit polygon complexity (< 50 vertices)

### Analytics
- Aggregate historical data for faster queries
- Use date range limits
- Implement pagination for large result sets
- Cache frequently accessed analytics

### Heatmaps
- Aggregate points to reduce data volume
- Limit date ranges for performance
- Use appropriate clustering algorithms
- Pre-calculate for known time periods

---

## Security & Privacy

### Authentication
All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Authorization
- **Admin**: Full access to all features
- **Dispatcher**: Create/update geofences and parking locations
- **Driver**: View-only access to maps and navigation
- **Rider**: Limited access to public information

### Data Privacy
- GPS tracking data is encrypted at rest
- Historical routes stored with privacy controls
- Heatmaps aggregated to protect individual privacy
- Access logs maintained for all geofence operations

---

## Future Enhancements

Potential improvements for future versions:

1. **Real-time Traffic Integration**
   - Live traffic data from Google Maps
   - Dynamic route rerouting
   - Push notifications for delays

2. **Advanced Geofencing**
   - 3D geofences with altitude
   - Time-based dynamic boundaries
   - Geofence groups and hierarchies

3. **Machine Learning Improvements**
   - Deep learning for traffic prediction
   - Anomaly detection for route deviations
   - Predictive maintenance based on driving patterns

4. **Enhanced Analytics**
   - Carbon footprint tracking
   - Driver behavior scoring
   - Customer satisfaction correlation

5. **Integration APIs**
   - Third-party map providers
   - Weather data integration
   - Event/calendar integration

---

## Support

For questions or issues with the mapping system:
- Review this documentation
- Check the API endpoint responses for detailed errors
- Review activity logs for debugging
- Contact the development team

---

## Changelog

### Version 1.0 (January 2024)
- Initial release with all 12 core features
- Offline map support
- Comprehensive geofencing
- ML-based traffic prediction
- Driver analytics and heatmaps
- Parking location management
- Speed and route monitoring
- Fuel-efficient routing
- ETA accuracy improvements
