# Live Vehicle Tracking Feature

## Overview
A comprehensive Live Tracking section has been added to the Maps menu, providing real-time monitoring of all vehicles in the transportation management system.

## Features

### 🗺️ Interactive Map View
- **Google Maps Integration**: Full Google Maps integration with custom markers for each vehicle
- **Real-time Positioning**: Each vehicle displays on the map with current location
- **Status-based Markers**: Color-coded markers based on vehicle status (Active: Green, Idle: Yellow, Offline: Red, Maintenance: Orange)

### 📊 Fleet Overview Panel
- **Live Statistics**: Real-time counts of total, active, idle, and offline vehicles
- **Vehicle Search**: Search vehicles by make, model, license plate, or driver name
- **Status Filtering**: Filter vehicles by status (All, Active, Idle, Offline, Maintenance)
- **Auto-refresh**: Configurable auto-refresh (default: 30 seconds) with manual refresh option

### 🚗 Vehicle Details
- **Comprehensive Info**: Vehicle make, model, year, license plate, capacity, type
- **Driver Information**: Current assigned driver with contact details
- **Trip Status**: Current trip information if vehicle is active
- **Real-time Updates**: Last update timestamp and current location

### 📱 Interactive Features
- **Click to Track**: Click any vehicle in the sidebar to center map and zoom to that vehicle
- **Marker Interaction**: Click map markers to view detailed vehicle information
- **Contact Integration**: Direct phone and email links for drivers
- **Route Integration**: Links to Google Maps for detailed navigation

## Technical Implementation

### Frontend Components
- **LiveTracking.jsx**: Main component located at `/src/components/maps/LiveTracking.jsx`
- **Route Integration**: Accessible via `/maps/tracking` route
- **Role-based Access**: Available to schedulers, dispatchers, and administrators

### Backend API Enhancements
- **Enhanced Vehicle Data**: Added current location, driver info, trip status to existing vehicles API
- **Mock Data**: Realistic sample data with NYC coordinates for demonstration
- **Real-time Fields**: Status tracking, last updated timestamps, current trip information

### Data Structure
```javascript
{
  _id: "unique-vehicle-id",
  make: "Toyota",
  model: "Camry", 
  year: 2022,
  licensePlate: "ABC-1234",
  status: "active", // active, idle, offline, maintenance
  currentLocation: {
    lat: 40.7580,
    lng: -73.9855,
    address: "123 Main St, New York, NY"
  },
  driver: {
    name: "John Smith",
    phone: "555-0123", 
    email: "john.smith@company.com"
  },
  currentTrip: {
    tripId: "TRP001",
    destination: "Brooklyn, NY"
  },
  lastUpdated: "2025-11-10T..."
}
```

## Navigation Path
**Main Menu → Maps → Live Tracking**

## Access Control
- **Schedulers**: Full access to vehicle tracking and details
- **Dispatchers**: Full access for dispatch coordination
- **Administrators**: Complete access to all tracking features
- **Drivers**: Not accessible (focused on their own assignments)

## Key Benefits
1. **Real-time Visibility**: Complete fleet overview at a glance
2. **Operational Efficiency**: Quick vehicle location and status identification  
3. **Dispatch Coordination**: Enhanced ability to assign nearest available vehicles
4. **Emergency Response**: Immediate location access for urgent situations
5. **Resource Management**: Better understanding of fleet utilization

## Future Enhancements
- Real GPS integration for actual vehicle tracking
- Historical route playback
- Geofencing and alerts
- Driver check-in/check-out integration
- Vehicle maintenance scheduling based on location
- Traffic and route optimization suggestions

## Usage Instructions
1. Navigate to **Maps → Live Tracking** from the sidebar
2. Use the **Fleet Overview** panel to search and filter vehicles
3. Click any vehicle card to center the map on that vehicle
4. Use status filters to focus on specific vehicle states
5. Toggle **Auto Refresh** for real-time updates
6. Click map markers for detailed vehicle information
7. Access driver contact information directly from vehicle details

The Live Tracking feature provides a comprehensive solution for fleet management, offering both overview and detailed vehicle monitoring capabilities in an intuitive, map-based interface.