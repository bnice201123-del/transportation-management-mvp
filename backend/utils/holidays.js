/**
 * Holiday Utility Module
 * Handles holiday calculations for recurring trip scheduling
 * Supports US Federal Holidays and custom holidays
 */

/**
 * Calculate US Federal Holidays for a given year
 * @param {number} year - The year to calculate holidays for
 * @returns {Object} - Object with holiday dates
 */
export function getUSFederalHolidays(year) {
  const holidays = {};

  // Fixed date holidays
  holidays.newYearsDay = new Date(year, 0, 1); // January 1
  holidays.independenceDay = new Date(year, 6, 4); // July 4
  holidays.veteransDay = new Date(year, 10, 11); // November 11
  holidays.christmasDay = new Date(year, 11, 25); // December 25

  // Martin Luther King Jr. Day - Third Monday in January
  holidays.mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3); // January, Monday, 3rd

  // Presidents' Day - Third Monday in February
  holidays.presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3); // February, Monday, 3rd

  // Memorial Day - Last Monday in May
  holidays.memorialDay = getLastWeekdayOfMonth(year, 4, 1); // May, Monday

  // Labor Day - First Monday in September
  holidays.laborDay = getNthWeekdayOfMonth(year, 8, 1, 1); // September, Monday, 1st

  // Columbus Day - Second Monday in October
  holidays.columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2); // October, Monday, 2nd

  // Thanksgiving - Fourth Thursday in November
  holidays.thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4); // November, Thursday, 4th

  // Juneteenth National Independence Day - June 19 (since 2021)
  if (year >= 2021) {
    holidays.juneteenth = new Date(year, 5, 19); // June 19
  }

  return holidays;
}

/**
 * Get the nth occurrence of a specific weekday in a month
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @param {number} weekday - 0-6 (0 = Sunday, 1 = Monday, etc.)
 * @param {number} occurrence - Which occurrence (1st, 2nd, 3rd, etc.)
 * @returns {Date}
 */
function getNthWeekdayOfMonth(year, month, weekday, occurrence) {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  
  // Calculate days until the first occurrence of the target weekday
  let daysUntilWeekday = (weekday - firstWeekday + 7) % 7;
  
  // Calculate the date of the nth occurrence
  const targetDate = 1 + daysUntilWeekday + (occurrence - 1) * 7;
  
  return new Date(year, month, targetDate);
}

/**
 * Get the last occurrence of a specific weekday in a month
 * @param {number} year
 * @param {number} month - 0-indexed
 * @param {number} weekday - 0-6
 * @returns {Date}
 */
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  
  // Calculate days back from end of month
  let daysBack = (lastWeekday - weekday + 7) % 7;
  
  return new Date(year, month, lastDay.getDate() - daysBack);
}

/**
 * Check if a date is a US Federal Holiday
 * @param {Date} date - The date to check
 * @param {Object} customHolidays - Optional custom holidays object
 * @returns {boolean}
 */
export function isUSFederalHoliday(date, customHolidays = null) {
  if (!(date instanceof Date) || isNaN(date)) {
    return false;
  }

  const year = date.getFullYear();
  const holidays = getUSFederalHolidays(year);
  
  // Check if date matches any federal holiday
  for (const [name, holidayDate] of Object.entries(holidays)) {
    if (isSameDay(date, holidayDate)) {
      return true;
    }
  }
  
  // Check custom holidays if provided
  if (customHolidays && Array.isArray(customHolidays)) {
    for (const customHoliday of customHolidays) {
      const customDate = new Date(customHoliday.date);
      if (isSameDay(date, customDate)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if two dates are the same day (ignoring time)
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get all holidays in a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {Object} customHolidays - Optional custom holidays
 * @returns {Array} - Array of holiday objects with date and name
 */
export function getHolidaysInRange(startDate, endDate, customHolidays = null) {
  const holidays = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  // Get holidays for each year in range
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getUSFederalHolidays(year);
    
    for (const [name, date] of Object.entries(yearHolidays)) {
      if (date >= startDate && date <= endDate) {
        holidays.push({
          name: formatHolidayName(name),
          date: date,
          type: 'federal'
        });
      }
    }
  }
  
  // Add custom holidays in range
  if (customHolidays && Array.isArray(customHolidays)) {
    for (const customHoliday of customHolidays) {
      const customDate = new Date(customHoliday.date);
      if (customDate >= startDate && customDate <= endDate) {
        holidays.push({
          name: customHoliday.name,
          date: customDate,
          type: 'custom'
        });
      }
    }
  }
  
  // Sort by date
  holidays.sort((a, b) => a.date - b.date);
  
  return holidays;
}

/**
 * Format holiday name from camelCase to readable format
 * @param {string} name
 * @returns {string}
 */
function formatHolidayName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Get the next holiday after a given date
 * @param {Date} date
 * @param {Object} customHolidays - Optional custom holidays
 * @returns {Object|null} - Holiday object or null if none found
 */
export function getNextHoliday(date, customHolidays = null) {
  const oneYearLater = new Date(date);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  
  const holidays = getHolidaysInRange(date, oneYearLater, customHolidays);
  
  return holidays.length > 0 ? holidays[0] : null;
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get the next business day (skipping weekends and optionally holidays)
 * @param {Date} date
 * @param {boolean} skipHolidays
 * @param {Object} customHolidays - Optional custom holidays
 * @returns {Date}
 */
export function getNextBusinessDay(date, skipHolidays = true, customHolidays = null) {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  let maxIterations = 10; // Prevent infinite loops
  let iterations = 0;
  
  while (iterations < maxIterations) {
    const isWeekendDay = isWeekend(nextDay);
    const isHolidayDay = skipHolidays ? isUSFederalHoliday(nextDay, customHolidays) : false;
    
    if (!isWeekendDay && !isHolidayDay) {
      return nextDay;
    }
    
    nextDay.setDate(nextDay.getDate() + 1);
    iterations++;
  }
  
  return nextDay;
}

/**
 * Calculate business days between two dates
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} skipHolidays
 * @param {Object} customHolidays - Optional custom holidays
 * @returns {number}
 */
export function countBusinessDays(startDate, endDate, skipHolidays = true, customHolidays = null) {
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const isWeekendDay = isWeekend(currentDate);
    const isHolidayDay = skipHolidays ? isUSFederalHoliday(currentDate, customHolidays) : false;
    
    if (!isWeekendDay && !isHolidayDay) {
      count++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

export default {
  getUSFederalHolidays,
  isUSFederalHoliday,
  isSameDay,
  getHolidaysInRange,
  getNextHoliday,
  isWeekend,
  getNextBusinessDay,
  countBusinessDays
};
