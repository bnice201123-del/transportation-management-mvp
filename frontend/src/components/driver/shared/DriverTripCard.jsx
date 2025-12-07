import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box
} from '@chakra-ui/react';
import {
  ClockIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { getTripStatus, driverTheme } from '../../../theme/driverTheme';
import TripActionButtons from './TripActionButtons';

/**
 * DriverTripCard - Standardized trip card for driver views
 * Ensures consistent trip display across all driver interfaces
 * 
 * @param {Object} props
 * @param {Object} props.trip - Trip object
 * @param {Function} props.onStart - Start trip handler
 * @param {Function} props.onComplete - Complete trip handler
 * @param {Function} props.onCancel - Cancel trip handler
 * @param {Function} props.onView - View details handler
 * @param {Function} props.onContact - Contact rider handler
 * @param {Function} props.onNavigate - Navigate handler
 * @param {boolean} props.compact - Compact display mode
 * @param {Function} props.onClick - Card click handler
 */
const DriverTripCard = ({
  trip,
  onStart,
  onComplete,
  onCancel,
  onView,
  onContact,
  onNavigate,
  compact = false,
  onClick
}) => {
  const statusConfig = getTripStatus(trip.status);
  const iconSize = driverTheme.spacing.iconSize.small;

  // Helper to get rider name from various formats
  const getRiderName = () => {
    if (typeof trip.riderName === 'string') return trip.riderName;
    if (trip.riderName?.firstName) return `${trip.riderName.firstName} ${trip.riderName.lastName}`;
    if (trip.rider?.firstName) return `${trip.rider.firstName} ${trip.rider.lastName}`;
    return 'Unknown Rider';
  };

  // Helper to get location address
  const getLocationAddress = (location) => {
    if (!location) return 'Address not specified';
    if (typeof location === 'string') return location;
    return location.address || 'Address not specified';
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card
      {...driverTheme.card}
      _hover={onClick ? { shadow: 'md', cursor: 'pointer' } : {}}
      onClick={onClick}
      transition="all 0.2s"
    >
      <CardBody p={compact ? 3 : 4}>
        <VStack align="stretch" spacing={compact ? 2 : 3}>
          {/* Header: Status and Time */}
          <HStack justify="space-between" align="start">
            <Badge
              colorScheme={statusConfig.colorScheme}
              variant="subtle"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {statusConfig.label}
            </Badge>
            <HStack spacing={1}>
              <Box as={ClockIcon} {...iconSize} color="gray.500" />
              <Text fontSize="xs" color={driverTheme.typography.tripTime.color}>
                {formatDateTime(trip.scheduledDate || trip.scheduledDateTime)}
              </Text>
            </HStack>
          </HStack>

          {/* Rider Information */}
          <HStack spacing={2}>
            <Box as={UserIcon} {...iconSize} color="blue.500" />
            <VStack align="start" spacing={0} flex={1}>
              <Text {...driverTheme.typography.riderName}>
                {getRiderName()}
              </Text>
              {trip.riderPhone && (
                <Text fontSize="xs" color="gray.500">
                  {trip.riderPhone}
                </Text>
              )}
            </VStack>
          </HStack>

          {!compact && <Divider />}

          {/* Route Information */}
          <VStack align="stretch" spacing={1}>
            {/* Pickup */}
            <HStack spacing={2} align="start">
              <Box as={MapPinIcon} {...iconSize} color="green.500" mt={0.5} />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="xs" fontWeight="medium" color="gray.600">
                  PICKUP
                </Text>
                <Text fontSize="sm" color="gray.700" noOfLines={1}>
                  {getLocationAddress(trip.pickupLocation)}
                </Text>
              </VStack>
            </HStack>

            {/* Dropoff */}
            <HStack spacing={2} align="start">
              <Box as={MapPinIcon} {...iconSize} color="red.500" mt={0.5} />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="xs" fontWeight="medium" color="gray.600">
                  DROPOFF
                </Text>
                <Text fontSize="sm" color="gray.700" noOfLines={1}>
                  {getLocationAddress(trip.dropoffLocation)}
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Additional Info */}
          {!compact && trip.notes && (
            <>
              <Divider />
              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                <Text as="span" fontWeight="medium">Notes:</Text> {trip.notes}
              </Text>
            </>
          )}

          {/* Action Buttons */}
          {(onStart || onComplete || onCancel || onView || onContact || onNavigate) && (
            <>
              {!compact && <Divider />}
              <TripActionButtons
                trip={trip}
                onStart={onStart}
                onComplete={onComplete}
                onCancel={onCancel}
                onView={onView}
                onContact={onContact}
                onNavigate={onNavigate}
                size={compact ? 'xs' : 'sm'}
              />
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DriverTripCard;
