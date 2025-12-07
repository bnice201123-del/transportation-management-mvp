import { useCallback } from 'react';

// Utility functions for backup and restore operations - for cross-application use
export const useBackupRestore = () => {
  const formatFileSize = useCallback((sizeString) => {
    if (!sizeString || sizeString === 'Calculating...') return sizeString;
    
    const match = sizeString.match(/^([0-9.]+)\s*(GB|MB|KB|Bytes?)$/i);
    if (!match) return sizeString;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    // Convert to bytes for calculations
    let bytes = value;
    switch (unit) {
      case 'GB': bytes = value * 1024 * 1024 * 1024; break;
      case 'MB': bytes = value * 1024 * 1024; break;
      case 'KB': bytes = value * 1024; break;
      default: bytes = value;
    }
    
    // Format back to human readable
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const calculateCompressionRatio = useCallback((original, compressed) => {
    if (!original || !compressed || compressed === 'Calculating...') return 0;
    
    const originalBytes = parseFloat(original.replace(/[^\d.]/g, '')) || 0;
    const compressedBytes = parseFloat(compressed.replace(/[^\d.]/g, '')) || 0;
    
    if (originalBytes === 0) return 0;
    return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
  }, []);

  const getBackupHealth = useCallback((backup) => {
    if (!backup) return 'unknown';
    
    if (backup.status === 'failed') return 'failed';
    if (backup.status === 'in-progress') return 'processing';
    
    const ageInDays = (Date.now() - new Date(backup.createdAt)) / (1000 * 60 * 60 * 24);
    const compressionRatio = backup.compressionRatio || 0;
    
    if (ageInDays < 1 && compressionRatio > 20) return 'excellent';
    if (ageInDays < 7 && compressionRatio > 10) return 'good';
    if (ageInDays < 30) return 'fair';
    return 'poor';
  }, []);

  const validateBackupConfig = useCallback((config) => {
    const errors = [];
    
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Backup name is required');
    }
    
    if (!config.type || !['full', 'database', 'files', 'incremental', 'configuration'].includes(config.type)) {
      errors.push('Valid backup type is required');
    }
    
    if (!config.includeDatabase && !config.includeFiles && !config.includeConfigurations) {
      errors.push('At least one component must be included in the backup');
    }
    
    if (config.compressionLevel < 1 || config.compressionLevel > 9) {
      errors.push('Compression level must be between 1 and 9');
    }
    
    return errors;
  }, []);

  const generateBackupChecksum = useCallback((backup) => {
    // Simulate checksum generation based on backup content
    const content = `${backup.name}-${backup.type}-${backup.createdAt}-${backup.size}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'sha256:' + Math.abs(hash).toString(16).padStart(16, '0');
  }, []);

  const estimateBackupDuration = useCallback((type, sizeGB) => {
    // Rough estimates based on backup type and size
    const baseDurations = {
      full: 45,        // minutes per GB
      database: 15,    // minutes per GB
      files: 25,       // minutes per GB
      incremental: 8,  // minutes per GB
      configuration: 2 // minutes per GB
    };
    
    const baseMinutes = baseDurations[type] || 30;
    const estimatedMinutes = Math.max(2, baseMinutes * (sizeGB || 1));
    
    if (estimatedMinutes < 60) {
      return `~${Math.round(estimatedMinutes)} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = Math.round(estimatedMinutes % 60);
      return `~${hours}h ${minutes}m`;
    }
  }, []);

  return {
    formatFileSize,
    calculateCompressionRatio,
    getBackupHealth,
    validateBackupConfig,
    generateBackupChecksum,
    estimateBackupDuration
  };
};

// Backup scheduling utilities
export const useBackupScheduler = () => {
  const calculateNextRun = useCallback((frequency, time, timezone = 'UTC') => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (frequency) {
      case 'hourly':
        nextRun.setMinutes(0, 0, 0);
        if (nextRun <= now) {
          nextRun.setHours(nextRun.getHours() + 1);
        }
        break;
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setDate(1);
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        return null;
    }
    
    return nextRun.toISOString();
  }, []);

  const validateSchedule = useCallback((schedule) => {
    const errors = [];
    
    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push('Schedule name is required');
    }
    
    if (!schedule.frequency || !['hourly', 'daily', 'weekly', 'monthly'].includes(schedule.frequency)) {
      errors.push('Valid frequency is required');
    }
    
    if (!schedule.time || !/^\d{2}:\d{2}$/.test(schedule.time)) {
      errors.push('Valid time format (HH:MM) is required');
    }
    
    if (schedule.retention < 1 || schedule.retention > 365) {
      errors.push('Retention period must be between 1 and 365 days');
    }
    
    if (schedule.maxBackups < 1 || schedule.maxBackups > 100) {
      errors.push('Maximum backups must be between 1 and 100');
    }
    
    return errors;
  }, []);

  return {
    calculateNextRun,
    validateSchedule
  };
};

// Restore operation utilities
export const useRestoreOperations = () => {
  const validateRestoreOptions = useCallback((backup, options = {}) => {
    const errors = [];
    
    if (!backup || backup.status !== 'completed') {
      errors.push('Only completed backups can be restored');
    }
    
    if (!options.components || options.components.length === 0) {
      errors.push('At least one component must be selected for restore');
    }
    
    const availableComponents = backup.includes || [];
    const invalidComponents = (options.components || []).filter(
      comp => !availableComponents.includes(comp)
    );
    
    if (invalidComponents.length > 0) {
      errors.push(`Components not available in backup: ${invalidComponents.join(', ')}`);
    }
    
    return errors;
  }, []);

  const estimateRestoreDuration = useCallback((backup, components = []) => {
    if (!backup || !components.length) return 'Unknown';
    
    const baseTime = 5; // Base 5 minutes
    const componentTimes = {
      database: 15,
      files: 25,
      configurations: 2,
      'user-data': 10
    };
    
    const totalTime = components.reduce((acc, comp) => {
      return acc + (componentTimes[comp] || 10);
    }, baseTime);
    
    if (totalTime < 60) {
      return `~${totalTime} minutes`;
    } else {
      const hours = Math.floor(totalTime / 60);
      const minutes = totalTime % 60;
      return `~${hours}h ${minutes}m`;
    }
  }, []);

  const checkRestoreCompatibility = useCallback((backup, systemVersion) => {
    // Simulate compatibility checking
    const backupAge = (Date.now() - new Date(backup.createdAt)) / (1000 * 60 * 60 * 24);
    
    if (backupAge > 90) {
      return { 
        compatible: false, 
        reason: 'Backup is too old (>90 days) and may not be compatible with current system version' 
      };
    }
    
    if (backup.health === 'failed' || backup.status !== 'completed') {
      return { 
        compatible: false, 
        reason: 'Backup is incomplete or corrupted' 
      };
    }
    
    return { compatible: true, reason: null };
  }, []);

  return {
    validateRestoreOptions,
    estimateRestoreDuration,
    checkRestoreCompatibility
  };
};

// Storage management utilities
export const useStorageManager = () => {
  const calculateStorageUsage = useCallback((backups) => {
    const usage = {
      total: 0,
      compressed: 0,
      byLocation: {},
      byType: {},
      savings: 0
    };
    
    backups.forEach(backup => {
      if (backup.status !== 'completed') return;
      
      const originalSize = parseFloat(backup.size.replace(/[^\d.]/g, '')) || 0;
      const compressedSize = parseFloat((backup.compressedSize || backup.size).replace(/[^\d.]/g, '')) || 0;
      
      // Convert GB to MB for calculations
      const originalMB = backup.size.includes('GB') ? originalSize * 1024 : originalSize;
      const compressedMB = (backup.compressedSize || backup.size).includes('GB') ? compressedSize * 1024 : compressedSize;
      
      usage.total += originalMB;
      usage.compressed += compressedMB;
      
      // By location
      usage.byLocation[backup.location] = (usage.byLocation[backup.location] || 0) + compressedMB;
      
      // By type
      usage.byType[backup.type] = (usage.byType[backup.type] || 0) + compressedMB;
    });
    
    usage.savings = usage.total - usage.compressed;
    
    return usage;
  }, []);

  const getStorageRecommendations = useCallback((usage, limits = {}) => {
    const recommendations = [];
    
    if (usage.compressed > (limits.maxStorage || 10000)) { // 10GB default limit
      recommendations.push({
        type: 'warning',
        message: 'Storage usage is approaching limits. Consider cleaning up old backups.',
        action: 'cleanup'
      });
    }
    
    if (usage.savings / usage.total < 0.2) { // Less than 20% compression
      recommendations.push({
        type: 'info',
        message: 'Low compression ratio detected. Consider enabling higher compression levels.',
        action: 'compress'
      });
    }
    
    const localUsage = usage.byLocation.local || 0;
    const cloudUsage = usage.byLocation.cloud || 0;
    
    if (localUsage > cloudUsage * 2) {
      recommendations.push({
        type: 'suggestion',
        message: 'Consider moving some backups to cloud storage for better distribution.',
        action: 'migrate'
      });
    }
    
    return recommendations;
  }, []);

  return {
    calculateStorageUsage,
    getStorageRecommendations
  };
};