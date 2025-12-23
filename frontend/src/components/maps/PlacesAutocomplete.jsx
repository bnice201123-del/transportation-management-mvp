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

  const handlePlaceSelect = (placeId, description, structured) => {
    // Construct full address from description and structured formatting
    let fullAddress = description?.trim() || '';
    
    // If description is empty, reconstruct from structured formatting
    if (!fullAddress && structured) {
      const main = structured.main_text?.trim() || '';
      const secondary = structured.secondary_text?.trim() || '';
      fullAddress = secondary ? `${main}, ${secondary}` : main;
    }

    // Ensure we have an address
    if (!fullAddress) {
      console.warn('No address text found in prediction');
      return;
    }

    // Update parent form immediately with the address
    if (onChange) {
      onChange(fullAddress);
    }

    // Call onPlaceSelected with basic place data
    if (onPlaceSelected) {
      onPlaceSelected({
        placeId: placeId,
        address: fullAddress,
        name: fullAddress.split(',')[0],
        location: { lat: 0, lng: 0 },
        types: []
      });
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
                onClick={() => handlePlaceSelect(
                  prediction.place_id, 
                  prediction.description,
                  prediction.structured_formatting
                )}
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