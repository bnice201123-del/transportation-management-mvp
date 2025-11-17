// Utility to test Google Maps API key validity
export const testGoogleMapsKey = async (apiKey) => {
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return {
      valid: false,
      error: 'API key not configured',
      message: 'Please add a valid Google Maps API key to your .env file'
    };
  }

  try {
    // Test by making a simple geocoding request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return {
        valid: true,
        message: 'API key is valid and working'
      };
    } else if (data.status === 'REQUEST_DENIED') {
      return {
        valid: false,
        error: 'REQUEST_DENIED',
        message: data.error_message || 'API key is invalid or has restrictions. Check your Google Cloud Console.',
        details: [
          'Verify the API key is correct',
          'Enable Maps JavaScript API in Google Cloud Console',
          'Check API key restrictions (HTTP referrers)',
          'Ensure billing is enabled on the project'
        ]
      };
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      return {
        valid: false,
        error: 'OVER_QUERY_LIMIT',
        message: 'API quota exceeded. Check your usage in Google Cloud Console.'
      };
    } else {
      return {
        valid: false,
        error: data.status,
        message: data.error_message || `API returned status: ${data.status}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to test API key. Check your network connection.',
      details: [error.message]
    };
  }
};

export const logGoogleMapsKeyStatus = async () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('🗺️ Testing Google Maps API Key...');
  
  const result = await testGoogleMapsKey(apiKey);
  
  if (result.valid) {
    console.log('✅ Google Maps API Key is valid');
  } else {
    console.error('❌ Google Maps API Key issue:', result.message);
    if (result.details) {
      console.log('💡 Suggestions:');
      result.details.forEach((detail, index) => {
        console.log(`   ${index + 1}. ${detail}`);
      });
    }
  }
  
  return result;
};
