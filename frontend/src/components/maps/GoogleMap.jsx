import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Box, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Text, VStack, HStack } from '@chakra-ui/react';
import GoogleMapsError from '../shared/GoogleMapsError';

// Custom render function with better error handling
const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <Box display="flex" justifyContent="center" alignItems="center" h="400px">
          <Spinner size="xl" color="brand.500" />
          <Text ml={3}>Loading Google Maps...</Text>
        </Box>
      );
    case Status.FAILURE:
      return (
        <Alert status="error" flexDirection="column" alignItems="start" borderRadius="md">
          <HStack mb={2}>
            <AlertIcon />
            <AlertTitle>Error loading Google Maps</AlertTitle>
          </HStack>
          <AlertDescription>
            <VStack align="start" spacing={2} fontSize="sm">
              <Text>Please refresh the page. If the problem persists, check:</Text>
              <Text>• Google Maps JavaScript API is enabled</Text>
              <Text>• API key has proper domain restrictions</Text>
              <Text>• Billing is enabled on Google Cloud project</Text>
            </VStack>
          </AlertDescription>
        </Alert>
      );
    case Status.SUCCESS:
      return null;
    default:
      return null;
  }
};

const MapComponent = ({ 
  center = { lat: 40.7589, lng: -73.9851 }, // Default to NYC
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  height = '400px',
  directionsRenderer = null,
  directionsResult = null
}) => {
  const ref = useRef();
  const [map, setMap] = useState();
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Add click listener to map
      if (onMapClick) {
        newMap.addListener('click', (event) => {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        });
      }

      setMap(newMap);
    }
  }, [ref, map, center, zoom, onMapClick]);

  // Update map center when center prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Handle markers
  useEffect(() => {
    if (map && markers) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      
      // Add new markers
      // Note: Using google.maps.Marker (deprecated as of Feb 2024)
      // TODO: Migrate to google.maps.marker.AdvancedMarkerElement
      // See: https://developers.google.com/maps/documentation/javascript/advanced-markers/migration
      const newMarkers = markers.map((markerData, index) => {
        // Process icon to ensure proper Google Maps objects
        let iconConfig = markerData.icon;
        if (iconConfig && iconConfig.scaledSize && !(iconConfig.scaledSize instanceof window.google.maps.Size)) {
          iconConfig = {
            ...iconConfig,
            scaledSize: new window.google.maps.Size(
              iconConfig.scaledSize.width || 30, 
              iconConfig.scaledSize.height || 30
            )
          };
        }

        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title || `Marker ${index + 1}`,
          icon: iconConfig || {
            url: markerData.type === 'pickup' 
              ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIgZmlsbD0iIzRGOEVGNyIvPgo8L3N2Zz4K'
              : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIgZmlsbD0iI0VEOEUzNiIvPgo8L3N2Zz4K',
            scaledSize: new window.google.maps.Size(30, 30),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(15, 30)
          }
        });

        // Add click listener to marker
        if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(markerData, index);
          });
        }

        // Add info window if content provided
        if (markerData.infoWindow) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoWindow
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }

        return marker;
      });

      markersRef.current = newMarkers;
    }
  }, [map, markers, onMarkerClick]);

  // Handle directions
  useEffect(() => {
    if (map && directionsRenderer) {
      // Set the map for the directions renderer
      directionsRenderer.setMap(map);
      directionsRendererRef.current = directionsRenderer;
      
      // If we have a directionsResult, display it
      if (directionsResult) {
        directionsRenderer.setDirections(directionsResult);
        
        // Auto-fit bounds to show the entire route
        if (directionsResult.routes && directionsResult.routes.length > 0) {
          const bounds = directionsResult.routes[0].bounds;
          if (bounds) {
            map.fitBounds(bounds);
            // Add some padding to the bounds
            setTimeout(() => {
              const currentZoom = map.getZoom();
              if (currentZoom > 15) {
                map.setZoom(15); // Max zoom for better overview
              }
            }, 100);
          }
        }
      }
      
      return () => {
        // Cleanup: remove renderer from map when component unmounts
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }
      };
    }
  }, [map, directionsRenderer, directionsResult]);

  return <div ref={ref} style={{ height }} />;
};

const GoogleMap = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return <GoogleMapsError apiKey={apiKey} />;
  }

  return (
    <Wrapper 
      apiKey={apiKey}
      libraries={['places', 'geometry', 'drawing']}
      version="weekly"
      render={render}
      // Use id to prevent duplicate script loading
      id="google-maps-script"
    >
      <MapComponent {...props} />
    </Wrapper>
  );
};

export default GoogleMap;