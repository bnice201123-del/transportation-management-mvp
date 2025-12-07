import React from 'react';
import { Box, VStack, HStack, Text, Avatar } from '@chakra-ui/react';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  TruckIcon 
} from '@heroicons/react/24/outline';
import { 
  formatDriverName, 
  formatVehicleInfo, 
  formatDriverPhone,
  driverTheme 
} from '../../../theme/driverTheme';
import DriverStatusBadge from './DriverStatusBadge';

/**
 * DriverInfoDisplay - Standardized driver information display component
 * Ensures consistent formatting across all views
 * 
 * @param {Object} props
 * @param {Object} props.driver - Driver object
 * @param {boolean} props.showVehicle - Show vehicle information
 * @param {boolean} props.showContact - Show contact information
 * @param {boolean} props.showStatus - Show availability status
 * @param {string} props.size - Display size ('sm', 'md', 'lg')
 * @param {boolean} props.horizontal - Horizontal layout
 */
const DriverInfoDisplay = ({ 
  driver, 
  showVehicle = false, 
  showContact = false, 
  showStatus = true,
  size = 'md',
  horizontal = false
}) => {
  if (!driver) {
    return (
      <Text fontSize={driverTheme.typography.location.fontSize} color="gray.500">
        No driver assigned
      </Text>
    );
  }

  const avatarSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const nameFontSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
  const detailFontSize = size === 'sm' ? 'xs' : 'sm';

  const Layout = horizontal ? HStack : VStack;
  const layoutProps = horizontal 
    ? { spacing: 4, align: 'center' }
    : { spacing: 2, align: 'start' };

  return (
    <Layout {...layoutProps} w="full">
      {/* Avatar and Name Section */}
      <HStack spacing={3}>
        <Avatar 
          size={avatarSize}
          name={formatDriverName(driver)}
          bg="blue.500"
        />
        <VStack align="start" spacing={0}>
          <Text 
            fontSize={nameFontSize} 
            fontWeight={driverTheme.typography.driverName.fontWeight}
            color={driverTheme.typography.driverName.color}
          >
            {formatDriverName(driver)}
          </Text>
          {showStatus && (
            <DriverStatusBadge 
              status={driver.isAvailable} 
              size="sm" 
            />
          )}
        </VStack>
      </HStack>

      {/* Contact Information */}
      {showContact && (
        <VStack align="start" spacing={1} pl={horizontal ? 0 : 12}>
          {driver.phone && (
            <HStack spacing={2}>
              <Box as={PhoneIcon} {...driverTheme.spacing.iconSize.small} color="gray.500" />
              <Text fontSize={detailFontSize} color={driverTheme.typography.vehicleInfo.color}>
                {formatDriverPhone(driver.phone)}
              </Text>
            </HStack>
          )}
          {driver.email && (
            <HStack spacing={2}>
              <Box as={EnvelopeIcon} {...driverTheme.spacing.iconSize.small} color="gray.500" />
              <Text fontSize={detailFontSize} color={driverTheme.typography.vehicleInfo.color}>
                {driver.email}
              </Text>
            </HStack>
          )}
        </VStack>
      )}

      {/* Vehicle Information */}
      {showVehicle && driver.vehicleInfo && (
        <HStack spacing={2} pl={horizontal ? 0 : 12}>
          <Box as={TruckIcon} {...driverTheme.spacing.iconSize.small} color="gray.500" />
          <Text fontSize={detailFontSize} color={driverTheme.typography.vehicleInfo.color}>
            {formatVehicleInfo(driver.vehicleInfo)}
          </Text>
        </HStack>
      )}
    </Layout>
  );
};

export default DriverInfoDisplay;
