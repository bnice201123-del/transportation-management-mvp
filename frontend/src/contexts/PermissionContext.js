import React, { useContext } from 'react';

// Permission context for global state management
export const PermissionContext = React.createContext({
  userPermissions: [],
  userRole: 'driver',
  checkPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false
});

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};