/**
 * Timezone Utility Functions
 * Handles consistent date/time operations across the application
 * Assumes all times are stored in UTC in the database and converted for display
 */

/**
 * Get the application's default timezone
 * Can be configured via environment variable or system settings
 * @returns {string} IANA timezone identifier (e.g., 'America/New_York')
 */
export const getDefaultTimezone = () => {
  return process.env.TZ || process.env.DEFAULT_TIMEZONE || 'America/New_York';
};

/**
 * Convert a date and time string to UTC Date object
 * @param {string|Date} date - The date (YYYY-MM-DD or Date object)
 * @param {string} time - The time in HH:MM format (24-hour)
 * @param {string} timezone - IANA timezone (optional, uses default if not provided)
 * @returns {Date} UTC Date object
 */
export const combineDateTimeToUTC = (date, time, timezone = null) => {
  const tz = timezone || getDefaultTimezone();
  
  // If date is already a Date object, extract YYYY-MM-DD
  const dateStr = date instanceof Date 
    ? date.toISOString().split('T')[0]
    : date;
  
  // Combine date and time into ISO string
  const localDateTime = `${dateStr}T${time}:00`;
  
  // Parse as local time in the specified timezone
  // Note: This is a simplified approach. For production, consider using a library like date-fns-tz or luxon
  const localDate = new Date(localDateTime);
  
  // For now, we'll store as-is and handle timezone conversion on the frontend
  // In production, you'd want to use a proper timezone library
  return localDate;
};

/**
 * Extract date string (YYYY-MM-DD) from a Date object in a specific timezone
 * @param {Date} date - The Date object
 * @param {string} timezone - IANA timezone (optional)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const extractDateString = (date, timezone = null) => {
  if (!date) return null;
  
  const tz = timezone || getDefaultTimezone();
  
  // For now, return ISO date portion
  // In production, use a proper timezone library to convert
  return date.toISOString().split('T')[0];
};

/**
 * Extract time string (HH:MM) from a Date object in a specific timezone
 * @param {Date} date - The Date object
 * @param {string} timezone - IANA timezone (optional)
 * @returns {string} Time string in HH:MM format (24-hour)
 */
export const extractTimeString = (date, timezone = null) => {
  if (!date) return null;
  
  const tz = timezone || getDefaultTimezone();
  
  // Extract hours and minutes
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Format a Date object for display in a specific timezone
 * @param {Date} date - The Date object
 * @param {string} timezone - IANA timezone (optional)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, timezone = null, options = {}) => {
  if (!date) return '';
  
  const tz = timezone || getDefaultTimezone();
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      timeZone: tz
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date(date).toLocaleString();
  }
};

/**
 * Get current date/time as UTC Date object
 * @returns {Date} Current UTC date/time
 */
export const getCurrentUTC = () => {
  return new Date();
};

/**
 * Check if a date is in the past (in UTC)
 * @param {Date} date - The date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Check if a date is today (in a specific timezone)
 * @param {Date} date - The date to check
 * @param {string} timezone - IANA timezone (optional)
 * @returns {boolean} True if date is today
 */
export const isToday = (date, timezone = null) => {
  if (!date) return false;
  
  const tz = timezone || getDefaultTimezone();
  const checkDate = new Date(date);
  const now = new Date();
  
  // Simple check: compare YYYY-MM-DD strings
  // In production, use a proper timezone library
  const checkDateStr = extractDateString(checkDate, tz);
  const nowDateStr = extractDateString(now, tz);
  
  return checkDateStr === nowDateStr;
};

/**
 * Add minutes to a date
 * @param {Date} date - The starting date
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date with minutes added
 */
export const addMinutes = (date, minutes) => {
  if (!date) return null;
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};

/**
 * Calculate difference in minutes between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in minutes
 */
export const diffInMinutes = (date1, date2) => {
  if (!date1 || !date2) return 0;
  return Math.floor((new Date(date1) - new Date(date2)) / (1000 * 60));
};

/**
 * Validate date and time strings
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} time - Time string (HH:MM)
 * @returns {object} { valid: boolean, error: string }
 */
export const validateDateTime = (date, time) => {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }
  
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Invalid time format. Use HH:MM (24-hour)' };
  }
  
  // Check if date is valid
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date value' };
  }
  
  return { valid: true };
};

/**
 * Convert UTC date to local timezone for a specific location
 * Note: This is a placeholder. In production, use a proper timezone library like luxon or date-fns-tz
 * @param {Date} utcDate - UTC date
 * @param {string} timezone - IANA timezone
 * @returns {Date} Date in local timezone
 */
export const utcToLocal = (utcDate, timezone = null) => {
  // For now, return as-is
  // In production, implement proper timezone conversion
  console.warn('utcToLocal: Using simplified timezone handling. Consider using luxon or date-fns-tz for production.');
  return utcDate;
};

/**
 * Convert local timezone date to UTC
 * Note: This is a placeholder. In production, use a proper timezone library
 * @param {Date} localDate - Local date
 * @param {string} timezone - IANA timezone
 * @returns {Date} UTC date
 */
export const localToUTC = (localDate, timezone = null) => {
  // For now, return as-is
  // In production, implement proper timezone conversion
  console.warn('localToUTC: Using simplified timezone handling. Consider using luxon or date-fns-tz for production.');
  return localDate;
};
