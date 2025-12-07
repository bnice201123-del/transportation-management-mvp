import React from 'react';
import { Badge } from '@chakra-ui/react';
import { getDriverStatus, getDriverStatusKey } from '../../../theme/driverTheme';

/**
 * DriverStatusBadge - Standardized status badge for driver availability
 * Ensures consistent display across all driver-related views
 * 
 * @param {Object} props
 * @param {string|boolean} props.status - Driver status ('available', 'busy', 'offline', 'inTransit') or boolean
 * @param {string} props.size - Badge size ('sm', 'md', 'lg')
 * @param {Object} props.rest - Additional Chakra Badge props
 */
const DriverStatusBadge = ({ status, size = 'md', ...rest }) => {
  // Normalize status to string key
  const statusKey = getDriverStatusKey(status);
  const statusConfig = getDriverStatus(statusKey);

  return (
    <Badge
      colorScheme={statusConfig.color.split('.')[0]}
      variant="subtle"
      fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
      px={size === 'sm' ? 2 : size === 'lg' ? 4 : 3}
      py={1}
      borderRadius="md"
      fontWeight="semibold"
      textTransform="uppercase"
      {...rest}
    >
      {statusConfig.label}
    </Badge>
  );
};

export default DriverStatusBadge;
