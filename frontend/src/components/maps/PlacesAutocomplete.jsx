import React, { useRef, useEffect, useState } from 'react';
import { Input, Box, List, ListItem, Text, Spinner } from '@chakra-ui/react';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';

const PlacesAutocomplete = ({ 
  onPlaceSelected, 
  placeholder = "Enter an address...",
  value = "",
  onChange,
  size = "md",
  isRequired = false,
  restrictions = { country: 'us' }, // Restrict to US by default
  ...inputProps 
}) => {
  const inputRef = useRef();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();
        // No need to initialize a service - we'll use the new API directly
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    initializeAutocomplete();
  }, []);

  const handleInputChange = async (e) => {
    const inputValue = e.target.value;
    if (onChange) {
      onChange(inputValue);
    }

    if (inputValue.length > 2 && window.google?.maps?.places) {
      setIsLoading(true);
      
      try {
        // Use the new AutocompleteSuggestion API
        const request = {
          input: inputValue,
          includedRegionCodes: restrictions?.country ? [restrictions.country.toUpperCase()] : ['US'],
          locationRestriction: restrictions?.location || undefined,
        };

        // Use the new fetchAutocompleteSuggestions method
        const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        
        setIsLoading(false);
        if (suggestions && suggestions.length > 0) {
          // Transform suggestions to match our expected format
          const transformedPredictions = suggestions.map(suggestion => ({
            place_id: suggestion.placePrediction.placeId,
            description: suggestion.placePrediction.text.text,
            structured_formatting: {
              main_text: suggestion.placePrediction.text.text.split(',')[0],
              secondary_text: suggestion.placePrediction.text.text.split(',').slice(1).join(',').trim()
            }
          }));
          setPredictions(transformedPredictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        setIsLoading(false);
        setPredictions([]);
        setShowPredictions(false);
      }
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePlaceSelect = async (placeId, description) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    try {
      // Use the new Place API (recommended as of March 2025)
      // This replaces the deprecated PlacesService
      const { Place } = await google.maps.importLibrary('places');
      const place = new Place({
        id: placeId
      });

      // Fetch place details with the new API
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'id', 'types']
      });

      const placeData = {
        placeId: place.id,
        address: place.formattedAddress,
        name: place.displayName,
        location: {
          lat: place.location.lat,
          lng: place.location.lng
        },
        types: place.types || []
      };

      if (onPlaceSelected) {
        onPlaceSelected(placeData);
      }

      if (onChange) {
        onChange(description);
      }
    } catch (error) {
      console.error('Error fetching place details with new Place API:', error);
      
      // Fallback to PlacesService for backward compatibility
      try {
        const service = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );

        service.getDetails(
          {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types']
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const placeData = {
                placeId: place.place_id,
                address: place.formatted_address,
                name: place.name,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                types: place.types
              };

              if (onPlaceSelected) {
                onPlaceSelected(placeData);
              }

              if (onChange) {
                onChange(description);
              }
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback PlacesService also failed:', fallbackError);
      }
    }

    setShowPredictions(false);
    setPredictions([]);
  };

  const handleInputBlur = () => {
    // Delay hiding predictions to allow click events
    setTimeout(() => {
      setShowPredictions(false);
    }, 200);
  };

  return (
    <Box position="relative" w="100%">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={() => {
          if (predictions.length > 0) {
            setShowPredictions(true);
          }
        }}
        placeholder={placeholder}
        size={size}
        isRequired={isRequired}
        {...inputProps}
      />

      {showPredictions && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          zIndex={1000}
          maxH="300px"
          overflowY="auto"
        >
          {isLoading && (
            <Box p={3} display="flex" alignItems="center">
              <Spinner size="sm" mr={2} />
              <Text fontSize="sm">Loading suggestions...</Text>
            </Box>
          )}

          <List spacing={0}>
            {predictions.map((prediction) => (
              <ListItem
                key={prediction.place_id}
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                borderBottom="1px solid"
                borderColor="gray.100"
                _last={{ borderBottom: "none" }}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {prediction.structured_formatting.main_text}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {prediction.structured_formatting.secondary_text}
                </Text>
              </ListItem>
            ))}
          </List>

          {!isLoading && predictions.length === 0 && (
            <Box p={3}>
              <Text fontSize="sm" color="gray.600">
                No addresses found
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlacesAutocomplete;