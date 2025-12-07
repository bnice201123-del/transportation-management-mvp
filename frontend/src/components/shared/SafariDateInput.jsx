import React, { useEffect, useRef } from 'react';
import { Input } from '@chakra-ui/react';

/**
 * Safari-compatible date input component
 * 
 * Handles Safari-specific date picker bugs:
 * - Proper rendering on iOS Safari
 * - Touch interaction issues
 * - Date format inconsistencies
 * - Keyboard issues on mobile
 * 
 * @param {Object} props - Input props
 * @returns {JSX.Element}
 */
const SafariDateInput = ({ value, onChange, onBlur, onFocus, ...props }) => {
  const inputRef = useRef(null);

  // Detect Safari browser
  const isSafari = () => {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua);
  };

  // Detect iOS devices
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  useEffect(() => {
    if (!inputRef.current) return;

    // Apply Safari-specific fixes
    if (isSafari() || isIOS()) {
      const input = inputRef.current;

      // Fix Safari date picker rendering issues
      input.style.WebkitAppearance = 'none';
      input.style.appearance = 'none';
      
      // Ensure proper height on iOS
      if (isIOS()) {
        input.style.minHeight = '44px';
      }

      // Fix date picker triggering on iOS
      const handleClick = (e) => {
        // Ensure the native date picker opens
        if (document.activeElement !== input) {
          e.preventDefault();
          input.focus();
          input.click();
        }
      };

      input.addEventListener('click', handleClick);

      return () => {
        input.removeEventListener('click', handleClick);
      };
    }
  }, []);

  // Handle date change with proper formatting
  const handleChange = (e) => {
    if (!onChange) return;

    const dateValue = e.target.value;
    
    // Ensure date is in YYYY-MM-DD format
    if (dateValue && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Try to parse and reformat if needed
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0];
        e.target.value = formatted;
      }
    }

    onChange(e);
  };

  // Handle focus with Safari-specific adjustments
  const handleFocus = (e) => {
    const input = e.target;

    // Prevent zoom on iOS Safari
    if (isIOS()) {
      input.style.fontSize = '16px';
    }

    // Show date picker on Safari
    if (isSafari() || isIOS()) {
      setTimeout(() => {
        try {
          input.showPicker?.();
        } catch {
          // Fallback if showPicker is not available
          input.focus();
        }
      }, 100);
    }

    if (onFocus) onFocus(e);
  };

  // Handle blur
  const handleBlur = (e) => {
    const input = e.target;

    // Reset font size if changed
    if (isIOS()) {
      input.style.fontSize = '';
    }

    if (onBlur) onBlur(e);
  };

  return (
    <Input
      ref={inputRef}
      type="date"
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      sx={{
        // Safari-specific styles
        WebkitAppearance: 'none',
        appearance: 'none',
        
        // Ensure date picker icon is visible on Safari
        '&::-webkit-calendar-picker-indicator': {
          opacity: 1,
          cursor: 'pointer',
          width: '20px',
          height: '20px',
          padding: '4px',
        },
        
        // iOS-specific styles
        ...(isIOS() && {
          minHeight: '44px',
          fontSize: '16px', // Prevents zoom
          touchAction: 'manipulation',
        }),
        
        // Safari-specific date input styling
        '&::-webkit-date-and-time-value': {
          textAlign: 'left',
          padding: '0 8px',
        },
        
        // Ensure proper layout on all browsers
        display: 'block',
        width: '100%',
      }}
      {...props}
    />
  );
};

export default SafariDateInput;
