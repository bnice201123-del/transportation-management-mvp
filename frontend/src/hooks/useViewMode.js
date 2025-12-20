import { useState, useEffect } from 'react';

/**
 * Hook to manage view preference with localStorage persistence
 * @param {string} storageKey - Key for localStorage
 * @param {string} defaultView - Default view mode ('table' or 'card')
 * @returns {object} Object with viewMode, setViewMode, and isLoaded
 */
export const useViewMode = (storageKey = 'tableViewPreference', defaultView = 'table') => {
  const [viewMode, setViewMode] = useState(defaultView);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setViewMode(saved);
    }
    setIsLoaded(true);
  }, [storageKey]);

  const updateViewMode = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem(storageKey, newMode);
  };

  return { viewMode, setViewMode: updateViewMode, isLoaded };
};

export default useViewMode;
