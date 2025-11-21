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
    // Check if script is already added (by Wrapper or other components)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      // Script exists, wait for it to load
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          isLoaded = true;
          isLoading = false;
          loadPromise = null;
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          isLoading = false;
          loadPromise = null;
          reject(new Error('Google Maps API failed to load within timeout'));
        }
      }, 100);
      
      return;
    }

    // Create and add script ONLY if no script exists
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      isLoading = false;
      loadPromise = null;
      reject(new Error('Google Maps API key not found in environment variables'));
      return;
    }

    // Use callback method to avoid retry issues
    const callbackName = 'initGoogleMaps';
    window[callbackName] = () => {
      // Wait a bit for places library to be fully ready
      setTimeout(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          isLoaded = true;
          isLoading = false;
          loadPromise = null;
          delete window[callbackName];
          resolve();
        } else {
          isLoading = false;
          loadPromise = null;
          delete window[callbackName];
          reject(new Error('Google Maps places library not available'));
        }
      }, 100);
    };

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      delete window[callbackName];
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