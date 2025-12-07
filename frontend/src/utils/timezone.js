/**
 * Frontend Timezone Utility Functions
 * Handles consistent date/time operations in the browser
 */

/**
 * Get browser's timezone
 * @returns {string} IANA timezone identifier (e.g., 'America/New_York')
 */
export const getBrowserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format date for display in local timezone
 * @param {string|Date} date - Date to format
 * @param {object} options - Format options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Format time for display in local timezone
 * @param {string|Date} date - Date/time to format
 * @param {boolean} use24Hour - Use 24-hour format (default: false)
 * @returns {string} Formatted time string
 */
export const formatTime = (date, use24Hour = false) => {
  if (!date) return '';
  
  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
  } catch (error) {
    console.error('Error formatting time:', error);
    return String(date);
  }
};

/**
 * Format date and time for display in local timezone
 * @param {string|Date} date - Date/time to format
 * @param {boolean} use24Hour - Use 24-hour format (default: false)
 * @returns {string} Formatted date/time string
 */
export const formatDateTime = (date, use24Hour = false) => {
  if (!date) return '';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return String(date);
  }
};

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Format time for input field (HH:MM)
 * @param {string|Date} date - Date/time to format
 * @returns {string} Time string in HH:MM format
 */
export const formatTimeForInput = (date) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time for input:', error);
    return '';
  }
};

/**
 * Combine separate date and time inputs into a Date object
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {Date} Combined date/time
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Create date/time string in local timezone
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    return new Date(dateTimeStr);
  } catch (error) {
    console.error('Error combining date and time:', error);
    return null;
  }
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
  return formatDateForInput(new Date());
};

/**
 * Get current time in HH:MM format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
  return formatTimeForInput(new Date());
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  const today = formatDateForInput(new Date());
  const checkDate = formatDateForInput(new Date(date));
  return today === checkDate;
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = then - now;
  const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';
  
  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${prefix}${diffMins} minute${diffMins > 1 ? 's' : ''}${suffix}`;
  } else if (diffHours < 24) {
    return `${prefix}${diffHours} hour${diffHours > 1 ? 's' : ''}${suffix}`;
  } else if (diffDays < 7) {
    return `${prefix}${diffDays} day${diffDays > 1 ? 's' : ''}${suffix}`;
  } else {
    return formatDate(date);
  }
};

/**
 * Add minutes to a date
 * @param {Date} date - Starting date
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
 * Calculate duration between two dates in minutes
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {number} Duration in minutes
 */
export const getDurationInMinutes = (start, end) => {
  if (!start || !end) return 0;
  return Math.floor((new Date(end) - new Date(start)) / (1000 * 60));
};

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Validate date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid
 */
export const isValidDateString = (dateStr) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Validate time string format (HH:MM)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid
 */
export const isValidTimeString = (timeStr) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeStr);
};
