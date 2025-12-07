/**
 * Mobile Keyboard Helper Utilities
 * 
 * Handles mobile keyboard issues:
 * - Inputs being covered by keyboard
 * - Viewport resize issues
 * - Auto-scroll to focused inputs
 * - iOS Safari specific quirks
 */

/**
 * Scroll the focused input into view, accounting for mobile keyboard
 * @param {HTMLElement} element - The input element to scroll into view
 * @param {Object} options - Scroll options
 */
export const scrollInputIntoView = (element, options = {}) => {
  if (!element) return;

  const defaultOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
    ...options
  };

  // Small delay to allow keyboard to appear
  setTimeout(() => {
    // Check if element is still in viewport after keyboard appears
    const rect = element.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );

    if (!isVisible) {
      element.scrollIntoView(defaultOptions);
      
      // Additional scroll for iOS Safari to account for keyboard
      if (isIOS()) {
        window.scrollBy(0, -60); // Offset for iOS keyboard
      }
    }
  }, 300); // Delay to allow keyboard animation
};

/**
 * Detect if device is iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Detect if device is Android
 */
export const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Detect if device is mobile
 */
export const isMobile = () => {
  return isIOS() || isAndroid() || window.innerWidth <= 768;
};

/**
 * Handle input focus with keyboard management
 * @param {Event} event - Focus event
 */
export const handleMobileInputFocus = (event) => {
  const input = event.target;
  
  if (!isMobile()) return;

  // Prevent default iOS zoom on input focus
  if (isIOS()) {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      viewport.setAttribute('content', content + ', maximum-scale=1.0');
      
      // Restore after keyboard closes
      setTimeout(() => {
        viewport.setAttribute('content', content);
      }, 500);
    }
  }

  // Scroll input into view
  scrollInputIntoView(input);
};

/**
 * Handle input blur - cleanup when keyboard closes
 * @param {Event} event - Blur event
 */
export const handleMobileInputBlur = (event) => {
  if (!isMobile()) return;

  // Scroll back to natural position
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

/**
 * Fix iOS Safari fixed position issues when keyboard is open
 * Call this on component mount for forms
 */
export const fixIOSKeyboardIssues = () => {
  if (!isIOS()) return;

  // Prevent body scroll when input is focused
  let lastScrollTop = 0;
  
  const handleFocus = () => {
    lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.position = 'relative';
  };

  const handleBlur = () => {
    document.body.style.position = '';
    window.scrollTo(0, lastScrollTop);
  };

  // Add listeners to all inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
  });

  // Return cleanup function
  return () => {
    inputs.forEach(input => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    });
  };
};

/**
 * Add mobile input focus handlers to a form
 * @param {HTMLFormElement} formElement - The form element
 */
export const addMobileInputHandlers = (formElement) => {
  if (!formElement || !isMobile()) return;

  const inputs = formElement.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    input.addEventListener('focus', handleMobileInputFocus);
  });

  // Return cleanup function
  return () => {
    inputs.forEach(input => {
      input.removeEventListener('focus', handleMobileInputFocus);
    });
  };
};

/**
 * Create a ref callback for mobile input handling
 * Use this with React refs
 * @param {Function} onFocus - Optional additional focus handler
 */
export const createMobileInputRef = (onFocus) => {
  return (element) => {
    if (!element) return;

    const handleFocus = (event) => {
      handleMobileInputFocus(event);
      if (onFocus) onFocus(event);
    };

    element.addEventListener('focus', handleFocus);
    
    // Store cleanup function
    if (!element._mobileCleanup) {
      element._mobileCleanup = () => {
        element.removeEventListener('focus', handleFocus);
      };
    }
  };
};

/**
 * Custom React hook for mobile input handling
 * @param {Ref} inputRef - React ref to the input element
 */
export const useMobileInput = (inputRef) => {
  React.useEffect(() => {
    if (!inputRef.current || !isMobile()) return;

    const element = inputRef.current;
    
    const handleFocus = (event) => {
      handleMobileInputFocus(event);
    };

    element.addEventListener('focus', handleFocus);

    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }, [inputRef]);
};

/**
 * Prevent iOS keyboard from hiding content
 * Add this style to modal/drawer containers
 */
export const getMobileKeyboardStyles = () => {
  if (!isMobile()) return {};

  return {
    position: 'relative',
    minHeight: '100vh',
    paddingBottom: isIOS() ? '60px' : '40px', // Extra space for keyboard
  };
};

/**
 * Get safe area insets for iOS notch/home indicator
 */
export const getSafeAreaInsets = () => {
  if (!isIOS()) return { top: 0, bottom: 0, left: 0, right: 0 };

  return {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  };
};

export default {
  scrollInputIntoView,
  isIOS,
  isAndroid,
  isMobile,
  handleMobileInputFocus,
  handleMobileInputBlur,
  fixIOSKeyboardIssues,
  addMobileInputHandlers,
  createMobileInputRef,
  getMobileKeyboardStyles,
  getSafeAreaInsets,
};
