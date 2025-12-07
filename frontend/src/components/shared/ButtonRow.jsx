import React from 'react';
import { HStack, Button } from "@chakra-ui/react";

export const ButtonRow = ({ buttons, spacing = 4, ...props }) => {
  if (buttons && buttons.length > 0) {
    // If buttons array is provided, render them dynamically
    return (
      <HStack spacing={spacing} {...props}>
        {buttons.map((btn, index) => (
          <Button
            key={index}
            variant={btn.variant || "solid"}
            onClick={btn.onClick}
            isDisabled={btn.isDisabled}
            isLoading={btn.isLoading}
            leftIcon={btn.leftIcon}
            rightIcon={btn.rightIcon}
            colorScheme={btn.colorScheme}
          >
            {btn.label}
          </Button>
        ))}
      </HStack>
    );
  }

  // Default static example
  return (
    <HStack spacing={spacing} {...props}>
      <Button variant="solid">Create Trip</Button>
      <Button variant="secondary">Assign Driver</Button>
      <Button variant="outline">Export</Button>
    </HStack>
  );
};

export default ButtonRow;
