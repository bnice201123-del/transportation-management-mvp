import React from 'react';
import { HStack, IconButton, Tooltip } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import {
  PlayIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PhoneIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { getDriverAction, driverTheme } from '../../../theme/driverTheme';

/**
 * TripActionButtons - Standardized action buttons for driver trips
 * Ensures consistent actions across all trip displays
 * 
 * @param {Object} props
 * @param {Object} props.trip - Trip object
 * @param {Function} props.onStart - Start trip handler
 * @param {Function} props.onComplete - Complete trip handler
 * @param {Function} props.onCancel - Cancel trip handler
 * @param {Function} props.onView - View details handler
 * @param {Function} props.onContact - Contact rider handler
 * @param {Function} props.onNavigate - Navigate handler
 * @param {string} props.size - Button size ('xs', 'sm', 'md')
 */
const TripActionButtons = ({
  trip,
  onStart,
  onComplete,
  onCancel,
  onView,
  onContact,
  onNavigate,
  size = 'sm'
}) => {
  const iconSize = driverTheme.spacing.iconSize.small;
  const buttonSpacing = driverTheme.spacing.buttonSpacing;

  // Determine which buttons to show based on trip status
  const showStart = trip.status === 'assigned' && onStart;
  const showComplete = trip.status === 'in_progress' && onComplete;
  const showCancel = ['assigned', 'in_progress'].includes(trip.status) && onCancel;
  const showView = onView;
  const showContact = onContact;
  const showNavigate = onNavigate;

  return (
    <HStack spacing={buttonSpacing}>
      {/* Start Trip Button */}
      {showStart && (
        <Tooltip label={getDriverAction('start').label} placement="top">
          <IconButton
            icon={<Box as={PlayIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('start').colorScheme}
            onClick={(e) => {
              e.stopPropagation();
              onStart(trip);
            }}
            aria-label={getDriverAction('start').ariaLabel}
          />
        </Tooltip>
      )}

      {/* Complete Trip Button */}
      {showComplete && (
        <Tooltip label={getDriverAction('complete').label} placement="top">
          <IconButton
            icon={<Box as={CheckCircleIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('complete').colorScheme}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(trip);
            }}
            aria-label={getDriverAction('complete').ariaLabel}
          />
        </Tooltip>
      )}

      {/* Cancel Trip Button */}
      {showCancel && (
        <Tooltip label={getDriverAction('cancel').label} placement="top">
          <IconButton
            icon={<Box as={XMarkIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('cancel').colorScheme}
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(trip);
            }}
            aria-label={getDriverAction('cancel').ariaLabel}
          />
        </Tooltip>
      )}

      {/* Navigate Button */}
      {showNavigate && (
        <Tooltip label={getDriverAction('navigate').label} placement="top">
          <IconButton
            icon={<Box as={MapIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('navigate').colorScheme}
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(trip);
            }}
            aria-label={getDriverAction('navigate').ariaLabel}
          />
        </Tooltip>
      )}

      {/* Contact Rider Button */}
      {showContact && (
        <Tooltip label={getDriverAction('contact').label} placement="top">
          <IconButton
            icon={<Box as={PhoneIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('contact').colorScheme}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onContact(trip);
            }}
            aria-label={getDriverAction('contact').ariaLabel}
          />
        </Tooltip>
      )}

      {/* View Details Button */}
      {showView && (
        <Tooltip label={getDriverAction('view').label} placement="top">
          <IconButton
            icon={<Box as={EyeIcon} {...iconSize} />}
            size={size}
            colorScheme={getDriverAction('view').colorScheme}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onView(trip);
            }}
            aria-label={getDriverAction('view').ariaLabel}
          />
        </Tooltip>
      )}
    </HStack>
  );
};

export default TripActionButtons;
