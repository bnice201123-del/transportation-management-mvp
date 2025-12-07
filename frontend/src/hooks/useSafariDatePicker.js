import { useEffect, useCallback } from 'react';

/**
 * Detect if browser is Safari
 */
export const isSafari = () => {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
};

/**
 * Detect if device is iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Format date to YYYY-MM-DD format for input[type="date"]
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse date from input[type="date"] value
 * Handles Safari/iOS timezone issues
 * @param {string} dateString - Date string from input
 * @returns {Date|null} Parsed date object
 */
export const parseDateFromInput = (dateString) => {
  if (!dateString) return null;
  
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day) return null;
  
  return new Date(year, month - 1, day);
};

/**
 * Custom hook for Safari-compatible date inputs
 * Handles Safari-specific quirks and iOS date picker issues
 * 
 * @returns {Object} Helper functions for date handling
 */
export const useSafariDatePicker = () => {
  const isSafariBrowser = isSafari();
  const isIOSDevice = isIOS();

  /**
   * Handle date input focus
   * Opens native date picker on Safari/iOS
   */
  const handleDateFocus = useCallback((event) => {
    const input = event.target;

    // Prevent iOS zoom
    if (isIOSDevice) {
      input.style.fontSize = '16px';
    }

    // Trigger native date picker
    if (isSafariBrowser || isIOSDevice) {
      setTimeout(() => {
        try {
          // Modern browsers
          if (input.showPicker) {
            input.showPicker();
          }
        } catch {
          // Fallback - just ensure focus
          input.focus();
        }
      }, 100);
    }
  }, [isSafariBrowser, isIOSDevice]);

  /**
   * Handle date input blur
   * Cleanup after date picker closes
   */
  const handleDateBlur = useCallback((event) => {
    const input = event.target;

    // Reset font size
    if (isIOSDevice) {
      input.style.fontSize = '';
    }
  }, [isIOSDevice]);

  /**
   * Handle date change with proper validation
   * Ensures consistent date format across browsers
   */
  const handleDateChange = useCallback((event, callback) => {
    const value = event.target.value;

    // Validate date format (YYYY-MM-DD)
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Try to parse and reformat
      const parsed = parseDateFromInput(value);
      if (parsed) {
        event.target.value = formatDateForInput(parsed);
      }
    }

    if (callback) callback(event);
  }, []);

  /**
   * Apply Safari-specific styles to date input
   */
  const applySafariStyles = useCallback((inputElement) => {
    if (!inputElement || !(isSafariBrowser || isIOSDevice)) return;

    // Remove default appearance
    inputElement.style.WebkitAppearance = 'none';
    inputElement.style.appearance = 'none';

    // Ensure proper height on iOS
    if (isIOSDevice) {
      inputElement.style.minHeight = '44px';
    }
  }, [isSafariBrowser, isIOSDevice]);

  /**
   * Setup date input with Safari fixes
   */
  useEffect(() => {
    if (!(isSafariBrowser || isIOSDevice)) return;

    // Find all date inputs and apply fixes
    const dateInputs = document.querySelectorAll('input[type="date"]');

    dateInputs.forEach((input) => {
      applySafariStyles(input);

      // Add click handler for better iOS interaction
      const handleClick = (e) => {
        if (document.activeElement !== input) {
          e.preventDefault();
          input.focus();
        }
      };

      input.addEventListener('click', handleClick);

      // Cleanup
      input._safariCleanup = () => {
        input.removeEventListener('click', handleClick);
      };
    });

    return () => {
      dateInputs.forEach((input) => {
        if (input._safariCleanup) {
          input._safariCleanup();
        }
      });
    };
  }, [isSafariBrowser, isIOSDevice, applySafariStyles]);

  return {
    isSafari: isSafariBrowser,
    isIOS: isIOSDevice,
    handleDateFocus,
    handleDateBlur,
    handleDateChange,
    formatDateForInput,
    parseDateFromInput,
    applySafariStyles,
  };
};

export default useSafariDatePicker;
