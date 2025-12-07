import { useEffect, useCallback, useState } from 'react';
import {
  scrollInputIntoView,
  isMobile,
  handleMobileInputFocus,
  fixIOSKeyboardIssues
} from '../utils/mobileKeyboardHelper';

/**
 * Custom React hook for handling mobile keyboard issues
 * Automatically handles input focus, scrolling, and keyboard visibility
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.autoScroll - Automatically scroll inputs into view (default: true)
 * @param {boolean} options.preventZoom - Prevent iOS zoom on input focus (default: true)
 * @param {number} options.scrollDelay - Delay before scrolling in ms (default: 300)
 * 
 * @returns {Object} - Helper functions and mobile detection
 * 
 * @example
 * const MyForm = () => {
 *   const { handleInputFocus, isMobileDevice } = useMobileKeyboard();
 *   
 *   return (
 *     <Input onFocus={handleInputFocus} />
 *   );
 * };
 */
export const useMobileKeyboard = (options = {}) => {
  const {
    autoScroll = true,
    preventZoom = true,
    scrollDelay = 300
  } = options;

  // Handle input focus with mobile optimizations
  const handleInputFocus = useCallback((event) => {
    if (!isMobile()) return;

    const input = event.target;

    // Prevent iOS zoom if enabled
    if (preventZoom) {
      input.style.fontSize = '16px'; // Prevents iOS zoom
    }

    // Auto-scroll input into view if enabled
    if (autoScroll) {
      setTimeout(() => {
        scrollInputIntoView(input, {
          behavior: 'smooth',
          block: 'center'
        });
      }, scrollDelay);
    }
  }, [autoScroll, preventZoom, scrollDelay]);

  // Handle input blur
  const handleInputBlur = useCallback((event) => {
    if (!isMobile()) return;

    const input = event.target;
    
    // Reset font size if it was changed
    if (preventZoom) {
      input.style.fontSize = '';
    }
  }, [preventZoom]);

  // Setup iOS-specific fixes on mount
  useEffect(() => {
    if (!isMobile()) return;

    const cleanup = fixIOSKeyboardIssues();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return {
    handleInputFocus,
    handleInputBlur,
    isMobileDevice: isMobile(),
    scrollInputIntoView
  };
};

/**
 * Hook for handling form-level mobile keyboard issues
 * Automatically adds handlers to all inputs in a form
 * 
 * @param {Ref} formRef - React ref to the form element
 * 
 * @example
 * const MyForm = () => {
 *   const formRef = useRef(null);
 *   useMobileForm(formRef);
 *   
 *   return (
 *     <form ref={formRef}>
 *       <Input />
 *       <Input />
 *     </form>
 *   );
 * };
 */
export const useMobileForm = (formRef) => {
  useEffect(() => {
    if (!formRef.current || !isMobile()) return;

    const form = formRef.current;
    const inputs = form.querySelectorAll('input, textarea, select');

    const handleFocus = (event) => {
      handleMobileInputFocus(event);
    };

    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
      });
    };
  }, [formRef]);
};

/**
 * Hook for detecting virtual keyboard visibility
 * Useful for adjusting layouts when keyboard is shown/hidden
 * 
 * @returns {boolean} - Whether the virtual keyboard is visible
 * 
 * @example
 * const MyComponent = () => {
 *   const isKeyboardVisible = useKeyboardVisible();
 *   
 *   return (
 *     <Box pb={isKeyboardVisible ? '300px' : '0'}>
 *       Content
 *     </Box>
 *   );
 * };
 */
export const useKeyboardVisible = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;

    let initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      // Keyboard is visible if viewport height decreased significantly
      setIsVisible(currentHeight < initialHeight - 150);
    };

    const handleFocusIn = () => {
      setTimeout(() => {
        const currentHeight = window.innerHeight;
        setIsVisible(currentHeight < initialHeight - 150);
      }, 300);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        setIsVisible(false);
        initialHeight = window.innerHeight;
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isVisible;
};

export default useMobileKeyboard;
