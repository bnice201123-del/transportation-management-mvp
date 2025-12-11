import { useEffect, useRef } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';

/**
 * Custom hook to close dropdowns/menus when scrolling
 * @param {boolean} isOpen - Whether the dropdown/menu is currently open
 * @param {function} onClose - Function to call to close the dropdown/menu
 * @param {object} options - Configuration options
 * @param {boolean} options.desktopOnly - Only apply on desktop (default: false - applies to all devices)
 * @param {string} options.breakpoint - Breakpoint to consider as desktop (default: 'md')
 */
export const useCloseOnScroll = (isOpen, onClose, options = {}) => {
  const { desktopOnly = false, breakpoint = 'md' } = options;
  const closeRef = useRef(onClose);
  
  // Keep the close function reference updated
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  
  const isDesktop = useBreakpointValue({ 
    base: false, 
    [breakpoint]: true 
  });

  useEffect(() => {
    // Only apply on desktop if desktopOnly is true
    if (desktopOnly && !isDesktop) return;
    
    // Only add listener if the menu is open
    if (!isOpen) return;

    const handleScroll = (e) => {
      // Prevent closing if scrolling within the dropdown itself
      const target = e.target;
      if (target?.closest('[role="menu"]')) {
        return;
      }
      
      closeRef.current();
    };

    // Add scroll listeners to multiple targets for better coverage
    // Window scroll with capture phase to catch all scroll events
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    // Document scroll
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Cleanup on unmount or when dependencies change
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, desktopOnly, isDesktop]);
};

export default useCloseOnScroll;
