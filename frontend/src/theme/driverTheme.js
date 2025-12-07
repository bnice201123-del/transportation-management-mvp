/**
 * Driver Theme - Standardized Design Tokens for Driver Experience
 * Ensures consistency across all driver-related views and components
 */

export const driverTheme = {
  // Status colors for driver availability
  status: {
    available: {
      color: 'green.500',
      bg: 'green.50',
      borderColor: 'green.200',
      label: 'Available'
    },
    busy: {
      color: 'orange.500',
      bg: 'orange.50',
      borderColor: 'orange.200',
      label: 'Busy'
    },
    offline: {
      color: 'gray.500',
      bg: 'gray.50',
      borderColor: 'gray.200',
      label: 'Offline'
    },
    inTransit: {
      color: 'blue.500',
      bg: 'blue.50',
      borderColor: 'blue.200',
      label: 'In Transit'
    }
  },

  // Action button color schemes
  actions: {
    start: {
      colorScheme: 'green',
      label: 'Start Trip',
      ariaLabel: 'Start trip'
    },
    complete: {
      colorScheme: 'blue',
      label: 'Complete Trip',
      ariaLabel: 'Complete trip'
    },
    cancel: {
      colorScheme: 'red',
      label: 'Cancel Trip',
      ariaLabel: 'Cancel trip'
    },
    view: {
      colorScheme: 'purple',
      label: 'View Details',
      ariaLabel: 'View trip details'
    },
    contact: {
      colorScheme: 'teal',
      label: 'Contact Rider',
      ariaLabel: 'Contact rider'
    },
    navigate: {
      colorScheme: 'blue',
      label: 'Navigate',
      ariaLabel: 'Open navigation'
    }
  },

  // Trip status colors (consistent with main app)
  tripStatus: {
    assigned: {
      colorScheme: 'orange',
      label: 'Assigned'
    },
    in_progress: {
      colorScheme: 'blue',
      label: 'In Progress'
    },
    completed: {
      colorScheme: 'green',
      label: 'Completed'
    },
    cancelled: {
      colorScheme: 'red',
      label: 'Cancelled'
    },
    pending: {
      colorScheme: 'gray',
      label: 'Pending'
    }
  },

  // Typography styles
  typography: {
    driverName: {
      fontSize: 'md',
      fontWeight: 'semibold',
      color: 'gray.800'
    },
    driverNameLight: {
      fontSize: 'md',
      fontWeight: 'semibold',
      color: 'gray.100'
    },
    riderName: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'gray.700'
    },
    tripTime: {
      fontSize: 'sm',
      color: 'gray.600'
    },
    location: {
      fontSize: 'xs',
      color: 'gray.500'
    },
    label: {
      fontSize: 'xs',
      fontWeight: 'medium',
      color: 'gray.600',
      textTransform: 'uppercase',
      letterSpacing: 'wide'
    },
    vehicleInfo: {
      fontSize: 'sm',
      color: 'gray.600'
    }
  },

  // Spacing and sizing
  spacing: {
    cardGap: { base: 4, md: 6 },
    buttonSpacing: 2,
    sectionPadding: { base: 4, md: 6 },
    iconSize: {
      small: { w: 4, h: 4 },
      medium: { w: 5, h: 5 },
      large: { w: 6, h: 6 }
    }
  },

  // Card and container styles
  card: {
    borderRadius: 'lg',
    shadow: 'sm',
    border: '1px solid',
    borderColor: 'gray.200'
  },

  // Responsive breakpoints
  breakpoints: {
    mobile: 'base',
    tablet: 'md',
    desktop: 'lg'
  }
};

/**
 * Helper function to get status configuration
 * @param {string} status - Driver status ('available', 'busy', 'offline', 'inTransit')
 * @returns {Object} Status configuration object
 */
export const getDriverStatus = (status) => {
  return driverTheme.status[status] || driverTheme.status.offline;
};

/**
 * Helper function to get action configuration
 * @param {string} action - Action type ('start', 'complete', 'cancel', 'view', 'contact', 'navigate')
 * @returns {Object} Action configuration object
 */
export const getDriverAction = (action) => {
  return driverTheme.actions[action] || driverTheme.actions.view;
};

/**
 * Helper function to get trip status configuration
 * @param {string} status - Trip status
 * @returns {Object} Trip status configuration object
 */
export const getTripStatus = (status) => {
  return driverTheme.tripStatus[status] || driverTheme.tripStatus.pending;
};

/**
 * Format driver name consistently
 * @param {Object} driver - Driver object
 * @returns {string} Formatted driver name
 */
export const formatDriverName = (driver) => {
  if (!driver) return 'Unknown Driver';
  if (typeof driver === 'string') return driver;
  
  const firstName = driver.firstName || '';
  const lastName = driver.lastName || '';
  
  return `${firstName} ${lastName}`.trim() || driver.email || 'Unknown Driver';
};

/**
 * Format vehicle information consistently
 * @param {Object} vehicle - Vehicle object
 * @returns {string} Formatted vehicle info
 */
export const formatVehicleInfo = (vehicle) => {
  if (!vehicle) return 'No Vehicle Assigned';
  
  const make = vehicle.make || '';
  const model = vehicle.model || '';
  const year = vehicle.year || '';
  const plate = vehicle.licensePlate || '';
  
  let info = `${make} ${model}`.trim();
  if (year) info += ` (${year})`;
  if (plate) info += ` - ${plate}`;
  
  return info || 'Vehicle Info Unavailable';
};

/**
 * Format phone number consistently
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatDriverPhone = (phone) => {
  if (!phone) return 'No Phone';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
};

/**
 * Get driver status from boolean or string
 * @param {boolean|string} isAvailable - Driver availability
 * @returns {string} Status string ('available', 'busy', or 'offline')
 */
export const getDriverStatusKey = (isAvailable) => {
  if (typeof isAvailable === 'boolean') {
    return isAvailable ? 'available' : 'busy';
  }
  if (typeof isAvailable === 'string') {
    return isAvailable.toLowerCase();
  }
  return 'offline';
};

export default driverTheme;
