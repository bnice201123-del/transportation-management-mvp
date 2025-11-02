# Google Maps API Setup Guide

This guide will walk you through setting up Google Maps API for your transportation application.

## Prerequisites

1. A Google Cloud Platform account
2. A billing account enabled (Google Maps API requires billing, but includes $200/month in free credits)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Transportation App")
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for address autocomplete)
   - **Directions API** (for route calculations)
   - **Geocoding API** (for address to coordinates conversion)

## Step 3: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click on the key name to configure restrictions (recommended)

## Step 4: Configure API Key Restrictions (Recommended)

### Application Restrictions:
- **HTTP referrers (web sites)**
- Add your domains:
  - `http://localhost:*` (for development)
  - `https://yourdomain.com/*` (for production)

### API Restrictions:
- Restrict key to the APIs you enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Geocoding API

## Step 5: Add API Key to Your Project

1. Copy your API key from the Google Cloud Console
2. Open your `.env` file in the frontend folder
3. Replace `your_google_maps_api_key_here` with your actual API key:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 6: Test the Integration

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to different pages to test:
   - **Trip Scheduler**: Address autocomplete should work
   - **Maps Dashboard**: Should display trip routes and maps
   - **Recurring Trips**: Address inputs should have autocomplete

## Features Included

### 🗺️ Interactive Maps
- **GoogleMap Component**: Full-featured map with markers and routes
- **Custom Markers**: Different icons for pickup/dropoff locations
- **Route Visualization**: Turn-by-turn directions with distance/duration

### 📍 Places Autocomplete
- **Smart Address Input**: Real-time address suggestions
- **Geocoding**: Automatic coordinate conversion
- **US-focused**: Configured for US addresses by default

### 🚗 Trip Mapping
- **TripMap Component**: Complete trip visualization
- **Route Information**: Distance, duration, and step-by-step directions
- **Interactive Controls**: Zoom, recenter, toggle routes

### 📊 Maps Dashboard
- **Trip List**: All trips with coordinates
- **Live Route Calculation**: Real-time distance and duration
- **Trip Details**: Comprehensive trip information display

## Customization Options

### Map Styling
Edit `GoogleMap.jsx` to customize map appearance:
```javascript
styles: [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }]
  }
]
```

### Autocomplete Restrictions
Modify `PlacesAutocomplete.jsx` for different regions:
```javascript
restrictions = { country: ['us', 'ca'] } // US and Canada
types = ['address'] // Only addresses, not businesses
```

### Custom Markers
Update marker icons in `TripMap.jsx`:
```javascript
icon: {
  url: 'your-custom-icon-url',
  scaledSize: new google.maps.Size(40, 40)
}
```

## Troubleshooting

### Common Issues:

1. **"Google Maps API Key Required" message**
   - Check your `.env` file has the correct API key
   - Restart your development server after adding the key

2. **Map not loading**
   - Verify billing is enabled in Google Cloud
   - Check that Maps JavaScript API is enabled
   - Ensure API key restrictions allow your domain

3. **Autocomplete not working**
   - Verify Places API is enabled
   - Check browser console for errors
   - Ensure API key has Places API access

4. **Route calculation failing**
   - Verify Directions API is enabled
   - Check that both pickup and dropoff have coordinates
   - Ensure addresses are valid and geocoded

### Debug Mode:
Add to your component for debugging:
```javascript
console.log('Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
```

## API Usage and Costs

### Free Tier (per month):
- **Maps JavaScript API**: 28,000 loads
- **Places Autocomplete**: 2,500 requests
- **Directions API**: 2,500 requests
- **Geocoding API**: 40,000 requests

### Cost Optimization:
- Use autocomplete session tokens
- Cache geocoding results
- Implement request debouncing
- Use map instance efficiently

## Security Best Practices

1. **Restrict API Keys**: Always use HTTP referrer restrictions
2. **Monitor Usage**: Set up billing alerts
3. **Environment Variables**: Never commit API keys to version control
4. **Production Keys**: Use separate keys for development/production

## Next Steps

1. **Real-time Tracking**: Add live vehicle tracking
2. **Route Optimization**: Implement multi-stop route planning  
3. **Geofencing**: Add pickup/dropoff zone validation
4. **Street View**: Integrate Street View for location verification

For more advanced features, consult the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation).