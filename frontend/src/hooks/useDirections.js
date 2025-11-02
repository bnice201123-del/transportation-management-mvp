import { useState, useEffect } from 'react';

export const useDirections = () => {
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      const service = new window.google.maps.DirectionsService();
      const renderer = new window.google.maps.DirectionsRenderer({
        draggable: true,
        panel: null,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4F8EF7',
          strokeOpacity: 1.0,
          strokeWeight: 4
        }
      });

      setDirectionsService(service);
      setDirectionsRenderer(renderer);

      // Listen for route changes when user drags the route
      renderer.addListener('directions_changed', () => {
        const directions = renderer.getDirections();
        setRoute(directions);
      });
    }
  }, []);

  const calculateRoute = async (origin, destination, waypoints = [], travelMode = 'DRIVING') => {
    if (!directionsService) {
      setError('Directions service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request = {
        origin,
        destination,
        waypoints: waypoints.map(wp => ({ location: wp, stopover: true })),
        travelMode: window.google.maps.TravelMode[travelMode],
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
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
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