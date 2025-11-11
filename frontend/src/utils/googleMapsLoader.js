// Google Maps API Loader Utility
let isLoading = false;
let isLoaded = false;
let loadPromise = null;

export const loadGoogleMapsAPI = () => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isLoaded) {
    return Promise.resolve();
  }

  // Check if Google Maps is already available
  if (window.google && window.google.maps && window.google.maps.places) {
    isLoaded = true;
    return Promise.resolve();
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script is already added
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          isLoaded = true;
          isLoading = false;
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!isLoaded) {
          isLoading = false;
          reject(new Error('Google Maps API failed to load within timeout'));
        }
      }, 10000);
      return;
    }

    // Create and add script
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      isLoading = false;
      reject(new Error('Google Maps API key not found in environment variables'));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Additional check to ensure places library is loaded
      const checkPlaces = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          isLoaded = true;
          isLoading = false;
          resolve();
        } else {
          setTimeout(checkPlaces, 50);
        }
      };
      checkPlaces();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps && window.google.maps.places;
};

export const waitForGoogleMaps = () => {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }
  return loadGoogleMapsAPI();
};