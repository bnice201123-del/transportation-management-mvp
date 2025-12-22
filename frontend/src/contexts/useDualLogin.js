import { useContext } from 'react';
import DualLoginContext from './DualLoginContext';

/**
 * useDualLogin Hook
 * Use this hook to access dual login context in components
 */
export const useDualLogin = () => {
  const context = useContext(DualLoginContext);

  if (!context) {
    throw new Error('useDualLogin must be used within DualLoginProvider');
  }

  return context;
};

export default useDualLogin;
