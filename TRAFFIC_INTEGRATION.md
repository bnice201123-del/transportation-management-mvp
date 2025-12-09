# Real-Time Traffic Integration

## Overview

The transportation system now integrates real-time traffic data from Google Maps API to provide accurate ETAs, traffic-aware route optimization, dynamic pricing, and proactive alerts for delays.

## Features

### 1. Real-Time Traffic Information
- Fetches current traffic conditions for any route
- Compares normal duration vs traffic-adjusted duration
- Provides traffic level classifications (light/moderate/heavy/severe)
- Suggests alternative routes during heavy traffic
- Extracts traffic warnings and incidents

### 2. Traffic Monitoring
- Monitors active trips for traffic delays
- Configurable alert thresholds (default: 15 minutes delay)
- Provides recommendations when traffic worsens
- Logs traffic alerts in activity feed
- Notifies dispatchers of significant delays

### 3. Optimal Departure Time
- Calculates best departure time for on-time arrivals
- Tests multiple departure windows (30-min intervals)
- Considers traffic patterns and congestion
- Recommends earliest departure with lightest traffic
- Helps schedulers plan trips efficiently

### 4. Dynamic Traffic Surge Pricing
- Adjusts trip costs based on traffic conditions
- Pricing multipliers:
  - Light traffic: No surge (1.0x)
  - Moderate traffic: +15% (1.15x)
  - Heavy traffic: +30% (1.30x)
  - Severe traffic: +50% (1.50x)
- Additional surge for extreme delays:
  - >30 minutes: +20%
  - >45 minutes: +35%

### 5. Batch ETA Calculations
- Efficient calculation of ETAs for multiple destinations
- Uses Google Maps Distance Matrix API
- Optimizes API usage with batch requests
- Useful for dispatch planning and driver assignments

## API Endpoints

### POST /api/traffic/info
Get real-time traffic information for a route.

**Request Body:**
```json
{
  "origin": {
    "address": "123 Main St",
    "lat": 40.7128,
    "lng": -74.0060
  },
  "destination": {
    "address": "456 Oak Ave",
    "lat": 40.7589,
    "lng": -73.9851
  },
  "waypoints": [
    {
      "location": {
        "address": "789 Elm St",
        "lat": 40.7484,
        "lng": -73.9857
      }
    }
  ],
  "departureTime": "now" // or ISO timestamp
}
```

**Response:**
```json
{
  "success": true,
  "trafficData": {
    "trafficLevel": "moderate",
    "trafficDelay": 12,
    "estimatedDuration": 45,
    "estimatedDurationInTraffic": 57,
    "totalDistance": 15.5,
    "fetchedAt": "2025-01-15T10:30:00Z",
    "alternatives": [
      {
        "summary": "Via I-95",
        "duration": 52,
        "distance": 16.2,
        "savings": {
          "time": 5,
          "distance": -0.7
        }
      }
    ],
    "warnings": [
      "Moderate traffic on FDR Drive"
    ]
  }
}
```

### POST /api/traffic/monitor/:tripId
Monitor traffic conditions for an active trip.

**Request Body:**
```json
{
  "alertThreshold": 15 // minutes
}
```

**Response:**
```json
{
  "success": true,
  "tripId": "TRP-001234",
  "monitoring": {
    "shouldAlert": true,
    "trafficLevel": "heavy",
    "delayMinutes": 22,
    "message": "Traffic delay of 22 minutes detected",
    "recommendation": "Consider alternative route via I-95 (saves 8 minutes)"
  }
}
```

### POST /api/traffic/optimal-departure
Find optimal departure time for on-time arrival.

**Request Body:**
```json
{
  "origin": { "address": "...", "lat": 40.7128, "lng": -74.0060 },
  "destination": { "address": "...", "lat": 40.7589, "lng": -73.9851 },
  "waypoints": [],
  "targetArrivalTime": "2025-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "recommendedDeparture": "2025-01-15T13:00:00Z",
  "estimatedArrival": "2025-01-15T13:55:00Z",
  "trafficLevel": "light",
  "duration": 55,
  "targetArrival": "2025-01-15T14:00:00Z",
  "allOptions": [
    {
      "departureTime": "2025-01-15T12:30:00Z",
      "arrivalTime": "2025-01-15T13:40:00Z",
      "duration": 70,
      "trafficLevel": "moderate"
    }
  ]
}
```

### POST /api/traffic/batch-eta
Get ETAs for multiple origin-destination pairs.

**Request Body:**
```json
{
  "origins": [
    { "lat": 40.7128, "lng": -74.0060 },
    { "lat": 40.7589, "lng": -73.9851 }
  ],
  "destinations": [
    { "lat": 40.7484, "lng": -73.9857 },
    { "lat": 40.7306, "lng": -73.9352 }
  ],
  "departureTime": "now"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "origin": "40.7128,-74.0060",
      "destination": "40.7484,-73.9857",
      "distance": 5.2,
      "duration": 18,
      "durationInTraffic": 25,
      "trafficDelay": 7
    }
  ]
}
```

### POST /api/traffic/surge-pricing
Calculate traffic surge pricing multiplier.

**Request Body:**
```json
{
  "trafficLevel": "heavy",
  "trafficDelay": 35,
  "baseMultiplier": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "surge": {
    "surgeMultiplier": 1.50,
    "reason": "Heavy traffic with 35 minute delay"
  }
}
```

### GET /api/traffic/active-trips
Get traffic data for all active trips (admin/dispatcher only).

**Response:**
```json
{
  "success": true,
  "trips": [
    {
      "tripId": "TRP-001234",
      "_id": "...",
      "driver": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "status": "in_progress",
      "pickupAddress": "123 Main St",
      "dropoffAddress": "456 Oak Ave",
      "scheduledTime": "14:00",
      "traffic": {
        "trafficLevel": "moderate",
        "trafficDelay": 8,
        "estimatedDurationInTraffic": 45
      }
    }
  ],
  "total": 15,
  "fetched": 15
}
```

### PATCH /api/traffic/update-trip/:tripId
Update trip with current traffic data (scheduler/dispatcher/admin only).

**Response:**
```json
{
  "success": true,
  "message": "Trip updated with traffic data",
  "trip": { /* updated trip object */ },
  "trafficData": {
    "trafficLevel": "light",
    "trafficDelay": 3,
    "estimatedDurationInTraffic": 32
  }
}
```

## Integration with Trip Creation

### Multi-Stop Trip Creation
When creating multi-stop trips via `POST /api/trips/multi-stop`, traffic data is automatically fetched and applied:

1. **Traffic Fetch**: Real-time traffic data retrieved for the entire route
2. **Duration Adjustment**: Uses `durationInTraffic` instead of normal duration
3. **Surge Pricing**: Automatically applies traffic-based surge multiplier
4. **Route Storage**: Traffic data stored in `trip.routeOptimization.trafficData`

Example multi-stop trip with traffic:
```json
{
  "rider": "user_id",
  "riderName": "Jane Smith",
  "pickupLocation": { "address": "...", "lat": 40.7128, "lng": -74.0060 },
  "dropoffLocation": { "address": "...", "lat": 40.7589, "lng": -73.9851 },
  "waypoints": [
    { "location": { "address": "...", "lat": 40.7484, "lng": -73.9857 } }
  ],
  "scheduledDate": "2025-01-15",
  "scheduledTime": "14:00",
  "optimizeRoute": true,
  "estimateCost": true
}
```

Response includes traffic-adjusted data:
```json
{
  "success": true,
  "trip": {
    "tripId": "TRP-001234",
    "estimatedDuration": 57, // traffic-adjusted
    "estimatedCost": 45.50, // includes surge
    "routeOptimization": {
      "trafficConsidered": true,
      "trafficData": {
        "trafficLevel": "moderate",
        "trafficDelay": 12,
        "estimatedDurationInTraffic": 57
      }
    },
    "costBreakdown": {
      "baseFare": 5.00,
      "distance": 23.25,
      "time": 14.25,
      "surge": {
        "multiplier": 1.15,
        "reason": "Moderate traffic with 12 minute delay"
      }
    }
  }
}
```

## Traffic Service Functions

### getTrafficInfo(origin, destination, waypoints, departureTime)
Core function that fetches real-time traffic from Google Maps Directions API.

**Parameters:**
- `origin`: Location object with lat/lng
- `destination`: Location object with lat/lng
- `waypoints`: Array of location objects (optional)
- `departureTime`: 'now' or ISO timestamp (optional)

**Returns:**
```javascript
{
  success: true,
  trafficData: {
    trafficLevel: 'moderate',
    trafficDelay: 12,
    estimatedDuration: 45,
    estimatedDurationInTraffic: 57,
    totalDistance: 15.5,
    fetchedAt: '2025-01-15T10:30:00Z',
    alternatives: [...],
    warnings: [...]
  }
}
```

### monitorTrafficConditions(tripId, origin, destination, waypoints, alertThreshold)
Checks if traffic conditions warrant an alert.

**Parameters:**
- `tripId`: Trip identifier
- `origin`, `destination`, `waypoints`: Route locations
- `alertThreshold`: Delay threshold in minutes (default: 15)

**Returns:**
```javascript
{
  shouldAlert: true,
  trafficLevel: 'heavy',
  delayMinutes: 22,
  message: 'Traffic delay of 22 minutes detected',
  recommendation: 'Consider alternative route...'
}
```

### getOptimalDepartureTime(origin, destination, waypoints, targetArrivalTime)
Finds best departure time for on-time arrival.

**Parameters:**
- `origin`, `destination`, `waypoints`: Route locations
- `targetArrivalTime`: Desired arrival time (ISO timestamp)

**Returns:**
```javascript
{
  success: true,
  recommendedDeparture: '2025-01-15T13:00:00Z',
  estimatedArrival: '2025-01-15T13:55:00Z',
  trafficLevel: 'light',
  duration: 55,
  targetArrival: '2025-01-15T14:00:00Z',
  allOptions: [...]
}
```

### calculateTrafficSurge(trafficLevel, trafficDelay, baseMultiplier)
Calculates pricing surge based on traffic.

**Parameters:**
- `trafficLevel`: 'light' | 'moderate' | 'heavy' | 'severe'
- `trafficDelay`: Delay in minutes
- `baseMultiplier`: Starting multiplier (default: 1.0)

**Returns:**
```javascript
{
  surgeMultiplier: 1.30,
  reason: 'Heavy traffic with 22 minute delay'
}
```

### getBatchETAs(origins, destinations, departureTime)
Calculates ETAs for multiple origin-destination pairs using Distance Matrix API.

**Parameters:**
- `origins`: Array of location objects
- `destinations`: Array of location objects
- `departureTime`: 'now' or ISO timestamp (optional)

**Returns:**
```javascript
{
  success: true,
  results: [
    {
      origin: '40.7128,-74.0060',
      destination: '40.7484,-73.9857',
      distance: 5.2,
      duration: 18,
      durationInTraffic: 25,
      trafficDelay: 7
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Required for traffic integration
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### API Requirements

The Google Maps API key must have the following APIs enabled:
- **Directions API**: For route traffic and alternatives
- **Distance Matrix API**: For batch ETA calculations

### Traffic Level Calculation

Traffic levels are determined by comparing delay vs normal duration:
- **Light**: <10% delay
- **Moderate**: 10-30% delay
- **Heavy**: 30-50% delay
- **Severe**: >50% delay

## Usage Examples

### Example 1: Create Trip with Traffic Awareness

```javascript
const response = await fetch('/api/trips/multi-stop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rider: userId,
    riderName: 'Jane Smith',
    pickupLocation: pickup,
    dropoffLocation: dropoff,
    scheduledDate: '2025-01-15',
    scheduledTime: '14:00',
    optimizeRoute: true,
    estimateCost: true
  })
});

// Response includes traffic-adjusted cost and duration
const { trip } = await response.json();
console.log('Traffic level:', trip.routeOptimization.trafficData.trafficLevel);
console.log('Traffic delay:', trip.routeOptimization.trafficData.trafficDelay);
console.log('Surge multiplier:', trip.costBreakdown.surge.multiplier);
```

### Example 2: Monitor Active Trip Traffic

```javascript
const response = await fetch(`/api/traffic/monitor/${tripId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ alertThreshold: 20 })
});

const { monitoring } = await response.json();
if (monitoring.shouldAlert) {
  console.log('Alert:', monitoring.message);
  console.log('Recommendation:', monitoring.recommendation);
  // Notify dispatcher or driver
}
```

### Example 3: Find Optimal Departure Time

```javascript
const response = await fetch('/api/traffic/optimal-departure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: pickup,
    destination: dropoff,
    targetArrivalTime: '2025-01-15T14:00:00Z'
  })
});

const { recommendedDeparture, trafficLevel } = await response.json();
console.log('Depart at:', recommendedDeparture);
console.log('Expected traffic:', trafficLevel);
```

### Example 4: Check Traffic for All Active Trips (Dispatcher View)

```javascript
const response = await fetch('/api/traffic/active-trips');
const { trips } = await response.json();

trips.forEach(trip => {
  if (trip.traffic?.trafficLevel === 'heavy' || trip.traffic?.trafficLevel === 'severe') {
    console.log(`Alert: Trip ${trip.tripId} experiencing ${trip.traffic.trafficLevel} traffic`);
    console.log(`Delay: ${trip.traffic.trafficDelay} minutes`);
  }
});
```

## Activity Logging

All traffic-related actions are logged in the activity feed:

- `traffic_alert`: When traffic monitoring triggers an alert
- `trip_traffic_updated`: When trip is updated with fresh traffic data

Example activity log entry:
```json
{
  "userId": "...",
  "tripId": "...",
  "action": "traffic_alert",
  "description": "Traffic alert for trip TRP-001234: Heavy traffic with 22 minute delay",
  "metadata": {
    "tripId": "TRP-001234",
    "trafficLevel": "heavy",
    "delayMinutes": 22
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Best Practices

1. **Monitor Traffic Regularly**: Set up periodic checks for active trips (every 5-10 minutes)
2. **Alert Thresholds**: Adjust based on route length (longer routes need higher thresholds)
3. **Surge Communication**: Inform riders about traffic-based pricing before confirmation
4. **Alternative Routes**: Present alternatives when traffic is heavy or severe
5. **Optimal Timing**: Use departure time optimization for scheduled recurring trips
6. **API Quotas**: Monitor Google Maps API usage to stay within quotas
7. **Fallback Strategy**: System continues working even if traffic API is unavailable
8. **Batch Operations**: Use batch ETA endpoint for multiple calculations to save quota

## Error Handling

The traffic service includes comprehensive error handling:
- Falls back gracefully when API unavailable
- Returns success: false with error details
- Continues trip creation even if traffic fetch fails
- Logs errors without breaking application flow

## Future Enhancements

Potential improvements for traffic integration:
- Historical traffic patterns for better predictions
- Machine learning for traffic forecasting
- Integration with local traffic incident APIs
- Real-time route re-optimization during trips
- Predictive surge pricing based on demand + traffic
- Traffic heatmap visualization for dispatchers
- Automated trip rescheduling suggestions during severe traffic

## Related Documentation

- [Route Optimization](./ROUTE_OPTIMIZATION.md)
- [Trip Templates](./TRIP_TEMPLATES.md)
- [Cost Estimation](./COST_ESTIMATION.md)
- [Google Maps Setup](./GOOGLE_MAPS_SETUP.md)
