import { useCallback } from 'react';

// Utility functions for cross-application use
export const useRolePermissions = () => {
  const checkPermission = useCallback((userPermissions, requiredPermission) => {
    return userPermissions.includes('all') || userPermissions.includes(requiredPermission);
  }, []);

  const getRoleConfig = useCallback((roleName) => {
    const roleConfigs = {
      admin: { level: 'full', color: 'red', permissions: ['all'] },
      scheduler: { level: 'high', color: 'blue', permissions: ['view_trips', 'create_trips', 'edit_trips', 'view_reports'] },
      dispatcher: { level: 'medium', color: 'green', permissions: ['view_trips', 'assign_drivers', 'view_vehicles'] },
      driver: { level: 'basic', color: 'orange', permissions: ['view_assigned_trips', 'update_trip_status'] }
    };
    return roleConfigs[roleName] || { level: 'basic', color: 'gray', permissions: [] };
  }, []);

  const validatePermissions = useCallback((permissions) => {
    const validPermissions = [
      'view_trips', 'create_trips', 'edit_trips', 'delete_trips',
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_vehicles', 'create_vehicles', 'edit_vehicles', 'delete_vehicles',
      'view_riders', 'create_riders', 'edit_riders', 'delete_riders',
      'view_reports', 'generate_reports', 'export_data',
      'system_settings', 'security_settings', 'audit_logs', 'all'
    ];
    return permissions.filter(p => validPermissions.includes(p));
  }, []);

  return { checkPermission, getRoleConfig, validatePermissions };
};