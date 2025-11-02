import React, { useRef, useEffect, useState } from 'react';
import { Input, Box, List, ListItem, Text, Spinner } from '@chakra-ui/react';

const PlacesAutocomplete = ({ 
  onPlaceSelected, 
  placeholder = "Enter an address...",
  value = "",
  onChange,
  size = "md",
  isRequired = false,
  restrictions = { country: 'us' }, // Restrict to US by default
  types = ['geocode'], // address, establishment, geocode
  ...inputProps 
}) => {
  const inputRef = useRef();
  const autocompleteRef = useRef();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      // Initialize autocomplete service
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    if (onChange) {
      onChange(inputValue);
    }

    if (inputValue.length > 2 && autocompleteRef.current) {
      setIsLoading(true);
      
      autocompleteRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: restrictions,
          types: types
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePlaceSelect = (placeId, description) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    // Create a PlacesService to get place details
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