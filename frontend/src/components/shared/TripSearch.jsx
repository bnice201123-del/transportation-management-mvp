import React from 'react';
import { Input, VStack, FormControl, FormLabel } from "@chakra-ui/react";

export const TripSearch = ({ 
  label = "Search Trips",
  placeholder = "Search by rider, driver, or trip ID",
  value,
  onChange,
  onSearch,
  spacing = 4,
  ...props 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <VStack align="stretch" spacing={spacing} {...props}>
      <FormControl>
        <FormLabel color="text.main">{label}</FormLabel>
        <Input
          placeholder={placeholder}
          variant="outline"
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
        />
      </FormControl>
    </VStack>
  );
};

export default TripSearch;
