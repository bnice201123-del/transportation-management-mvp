import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Progress,
  Box,
  useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, InfoIcon } from '@chakra-ui/icons';

const VehicleQuickView = ({ vehicle, children, displayText }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Default display text if not provided
  const defaultDisplayText = vehicle 
    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() 
    : 'Vehicle';

  // Determine fuel level color
  const getFuelColor = (level) => {
    if (level >= 70) return 'green';
    if (level >= 30) return 'yellow';
    return 'red';
  };

  // Handle navigation to vehicle profile
  const handleViewProfile = () => {
    if (vehicle?._id) {
      navigate(`/vehicles/${vehicle._id}`);
    }
  };

  if (!vehicle) {
    return children || <Text>{displayText || defaultDisplayText}</Text>;
  }

  return (
    <Popover placement="auto" trigger="hover">
      <PopoverTrigger>
        <Text
          as="span"
          color="blue.500"
          cursor="pointer"
          textDecoration="underline"
          _hover={{
            color: 'blue.600',
            textDecoration: 'none'
          }}
        >
          {children || displayText || defaultDisplayText}
        </Text>
      </PopoverTrigger>
      <PopoverContent bg={bgColor} borderColor={borderColor} boxShadow="lg" maxW="300px">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="bold" fontSize="md">
          <HStack spacing={2}>
            <InfoIcon color="blue.500" />
            <Text>Vehicle Info</Text>
          </HStack>
        </PopoverHeader>
        <PopoverBody>
          <VStack align="stretch" spacing={3}>
            {/* Vehicle Name */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="gray.500">
                Vehicle
              </Text>
              <Text fontSize="md" fontWeight="semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </Box>

            {/* License Plate */}
            {vehicle.licensePlate && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  License Plate
                </Text>
                <Badge colorScheme="blue" fontSize="sm">
                  {vehicle.licensePlate}
                </Badge>
              </Box>
            )}

            {/* Status */}
            {vehicle.status && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  Status
                </Text>
                <Badge 
                  colorScheme={
                    vehicle.status === 'available' ? 'green' :
                    vehicle.status === 'in_use' ? 'blue' :
                    vehicle.status === 'maintenance' ? 'orange' : 'gray'
                  }
                >
                  {vehicle.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </Box>
            )}

            {/* Fuel Level */}
            {vehicle.fuelLevel !== undefined && vehicle.fuelLevel !== null && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">
                    Fuel Level
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {vehicle.fuelLevel}%
                  </Text>
                </HStack>
                <Progress 
                  value={vehicle.fuelLevel} 
                  size="sm" 
                  colorScheme={getFuelColor(vehicle.fuelLevel)}
                  hasStripe
                  isAnimated
                />
              </Box>
            )}

            {/* Mileage */}
            {vehicle.mileage !== undefined && vehicle.mileage !== null && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  Mileage
                </Text>
                <Text fontSize="sm">
                  {vehicle.mileage?.toLocaleString()} miles
                </Text>
              </Box>
            )}

            {/* View Full Profile Button */}
            <Button
              leftIcon={<ViewIcon />}
              colorScheme="blue"
              size="sm"
              width="full"
              onClick={handleViewProfile}
              mt={2}
            >
              View Full Profile
            </Button>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleQuickView;
