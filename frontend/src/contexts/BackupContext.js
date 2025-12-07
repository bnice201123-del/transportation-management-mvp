import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

// Context for backup and restore operations
const BackupContext = createContext({
  backups: [],
  restoreHistory: [],
  schedules: [],
  loading: false,
  createBackup: () => {},
  restoreFromBackup: () => {},
  deleteBackup: () => {},
  updateSchedule: () => {},
  getBackupById: () => null,
  getSystemHealth: () => ({})
});

export const useBackupContext = () => {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackupContext must be used within a BackupProvider');
  }
  return context;
};

export const BackupProvider = ({ children }) => {
  const toast = useToast();
  
  const [backups, setBackups] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const createBackup = useCallback(async (config) => {
    try {
      setLoading(true);
      
      // Simulate API call
      const newBackup = {
        id: Date.now(),
        name: config.name || `Backup ${new Date().toLocaleDateString()}`,
        description: config.description || 'System backup',
        type: config.type || 'full',
        status: 'in-progress',
        size: 'Calculating...',
        createdAt: new Date().toISOString(),
        location: config.location || 'local',
        encryption: config.encryptionEnabled || false,
        includes: config.includes || [],
        createdBy: 'system'
      };

      setBackups(prev => [newBackup, ...prev]);

      toast({
        title: 'Backup Started',
        description: `${newBackup.name} backup has been initiated`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Simulate completion
      setTimeout(() => {
        setBackups(prev => prev.map(backup =>
          backup.id === newBackup.id
            ? {
              ...backup,
              status: 'completed',
              size: '1.8 GB',
              completedAt: new Date().toISOString(),
              checksum: 'sha256:' + Math.random().toString(36).substring(2, 15)
            }
            : backup
        ));

        toast({
          title: 'Backup Completed',
          description: `${newBackup.name} backup completed successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }, 30000);

      return { success: true, backupId: newBackup.id };
    } catch (error) {
      console.error('Backup creation error:', error);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const restoreFromBackup = useCallback(async (backupId, options = {}) => {
    try {
      setLoading(true);

      const backup = backups.find(b => b.id === backupId);
      if (!backup || backup.status !== 'completed') {
        throw new Error('Invalid backup for restore operation');
      }

      const restoreRecord = {
        id: Date.now(),
        backupId: backup.id,
        backupName: backup.name,
        restoredAt: new Date().toISOString(),
        status: 'in-progress',
        restoredBy: 'admin@example.com',
        type: backup.type,
        componentsRestored: backup.includes,
        reason: options.reason || 'Manual restore'
      };

      setRestoreHistory(prev => [restoreRecord, ...prev]);

      toast({
        title: 'Restore Started',
        description: `Restoring from ${backup.name}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Simulate restore completion
      setTimeout(() => {
        setRestoreHistory(prev => prev.map(restore =>
          restore.id === restoreRecord.id
            ? {
              ...restore,
              status: 'completed',
              completedAt: new Date().toISOString(),
              duration: '15 minutes'
            }
            : restore
        ));

        toast({
          title: 'Restore Completed',
          description: `Successfully restored from ${backup.name}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }, 15000);

      return { success: true, restoreId: restoreRecord.id };
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [backups, toast]);

  const deleteBackup = useCallback(async (backupId) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBackups(prev => prev.filter(backup => backup.id !== backupId));

      toast({
        title: 'Backup Deleted',
        description: 'Backup has been permanently deleted.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Delete backup error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete backup. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateSchedule = useCallback(async (scheduleId, updates) => {
    try {
      setLoading(true);
      
      setSchedules(prev => prev.map(schedule =>
        schedule.id === scheduleId
          ? { ...schedule, ...updates }
          : schedule
      ));

      toast({
        title: 'Schedule Updated',
        description: 'Backup schedule has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Update schedule error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update schedule. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getBackupById = useCallback((id) => {
    return backups.find(backup => backup.id === id) || null;
  }, [backups]);

  const getSystemHealth = useCallback(() => {
    const totalBackups = backups.length;
    const completedBackups = backups.filter(b => b.status === 'completed').length;
    const failedBackups = backups.filter(b => b.status === 'failed').length;
    const successRate = totalBackups > 0 ? (completedBackups / totalBackups) * 100 : 0;
    
    const activeSchedules = schedules.filter(s => s.enabled).length;
    const recentFailures = restoreHistory.filter(r => 
      r.status === 'failed' && 
      new Date(r.restoredAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalBackups,
      completedBackups,
      failedBackups,
      successRate: Math.round(successRate),
      activeSchedules,
      totalSchedules: schedules.length,
      recentFailures,
      status: successRate > 90 ? 'excellent' : successRate > 70 ? 'good' : 'needs-attention'
    };
  }, [backups, schedules, restoreHistory]);

  const value = {
    backups,
    restoreHistory,
    schedules,
    loading,
    setBackups,
    setRestoreHistory,
    setSchedules,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    updateSchedule,
    getBackupById,
    getSystemHealth
  };

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
};