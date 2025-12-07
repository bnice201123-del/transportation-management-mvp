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
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null; // AdvancedMarkerElement cleanup
        }
      });
      
      // Add new markers using AdvancedMarkerElement (updated Feb 2024)
      const newMarkers = markers.map((markerData, index) => {
        // Create marker content element
        const markerElement = document.createElement('div');
        markerElement.style.width = '30px';
        markerElement.style.height = '30px';
        markerElement.style.cursor = 'pointer';
        
        // Determine marker color based on type
        let markerColor = '#ED8E36'; // default/dropoff color
        if (markerData.type === 'pickup') {
          markerColor = '#4F8EF7';
        } else if (markerData.icon && markerData.icon.url) {
          // Use custom icon if provided
          const img = document.createElement('img');
          img.src = markerData.icon.url;
          img.style.width = '100%';
          img.style.height = '100%';
          markerElement.appendChild(img);
        }
        
        // Create SVG marker if no custom icon
        if (!markerElement.firstChild) {
          markerElement.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${markerColor}"/>
            </svg>
          `;
        }

        // Create AdvancedMarkerElement
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: markerData.position,
          map,
          title: markerData.title || `Marker ${index + 1}`,
          content: markerElement
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
            infoWindow.open({
              anchor: marker,
              map
            });
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
      libraries={['places', 'geometry', 'drawing', 'marker']}
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