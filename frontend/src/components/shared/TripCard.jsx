import React from 'react';
import { Box, Text, Badge, Flex } from "@chakra-ui/react";

export const TripCard = ({ 
  tripId, 
  status = "Completed", 
  riderName, 
  pickup, 
  dropoff, 
  onClick,
  ...props 
}) => {
  // Map status to colorScheme
  const getStatusColor = (status) => {
    const statusMap = {
      'Completed': 'success',
      'In Progress': 'info',
      'Scheduled': 'warning',
      'Cancelled': 'error',
      'Pending': 'secondary'
    };
    return statusMap[status] || 'gray';
  };

  return (
    <Box
      bg="bg.card"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.subtle"
      p={4}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={onClick ? { 
        borderColor: "brand.500", 
        shadow: "md",
        transform: "translateY(-2px)",
        transition: "all 0.2s"
      } : {}}
      {...props}
    >
      <Flex justify="space-between" mb={2}>
        <Text fontWeight="semibold">{tripId || "Trip #T-1024"}</Text>
        <Badge colorScheme={getStatusColor(status)}>{status}</Badge>
      </Flex>
      {riderName && (
        <Text color="text.muted">Rider: {riderName}</Text>
      )}
      {(pickup || dropoff) && (
        <Text color="text.muted">
          {pickup && `Pickup: ${pickup}`}
          {pickup && dropoff && " → "}
          {dropoff && dropoff}
        </Text>
      )}
    </Box>
  );
};

export default TripCard;
