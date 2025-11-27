import { useState, useEffect } from 'react';

export const useDirections = () => {
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    const initializeDirections = () => {
      if (
        window.google &&
        window.google.maps &&
        typeof window.google.maps.DirectionsService === 'function' &&
        typeof window.google.maps.DirectionsRenderer === 'function' &&
        typeof window.google.maps.TravelMode !== 'undefined'
      ) {
        try {
          const service = new window.google.maps.DirectionsService();
          const renderer = new window.google.maps.DirectionsRenderer({
            draggable: true,
            panel: null,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#2B6CB0',  // Darker blue for better visibility
              strokeOpacity: 0.9,
              strokeWeight: 6,  // Thicker line for better visibility
              zIndex: 100
            },
            markerOptions: {
              zIndex: 200
            }
          });

          setDirectionsService(service);
          setDirectionsRenderer(renderer);

          // Listen for route changes when user drags the route
          renderer.addListener('directions_changed', () => {
            const directions = renderer.getDirections();
            setRoute(directions);
          });
          
          setError(null);
        } catch (err) {
          console.error('Error initializing directions:', err);
          setError('Failed to initialize Google Maps directions');
        }
      } else if (retryCount < maxRetries) {
        // Retry after delay
        retryCount++;
        setTimeout(initializeDirections, retryDelay);
      } else {
        setError('Google Maps DirectionsService or DirectionsRenderer is not available after retries.');
      }
    };

    // Start initialization
    initializeDirections();
  }, []);

  const calculateRoute = async (origin, destination, waypoints = [], travelMode = 'DRIVING') => {
    if (!directionsService) {
      console.warn('Directions service not initialized');
      return;
    }

    // Check if Google Maps is fully loaded
    if (!window.google || !window.google.maps || !window.google.maps.TravelMode) {
      console.warn('Google Maps API not fully loaded, skipping route calculation');
      return;
    }

    // Validate origin and destination
    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      console.warn('Invalid origin or destination coordinates');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request = {
        origin,
        destination,
        waypoints: waypoints.map(wp => ({ location: wp, stopover: true })),
        travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      };

      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      setRoute(result);
      if (directionsRenderer) {
        directionsRenderer.setDirections(result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      console.error('Directions error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoute = () => {
    if (directionsRenderer && typeof directionsRenderer.setDirections === 'function') {
      try {
        directionsRenderer.setDirections({ routes: [] });
      } catch (err) {
        console.warn('Error clearing route:', err);
      }
    }
    setRoute(null);
    setError(null);
  };

  const getRouteInfo = () => {
    if (!route || !route.routes || route.routes.length === 0) {
      return null;
    }

    const leg = route.routes[0].legs[0];
    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      steps: leg.steps
    };
  };

  return {
    directionsService,
    directionsRenderer,
    route,
    isLoading,
    error,
    calculateRoute,
    clearRoute,
    getRouteInfo
  };
};

export default useDirections;