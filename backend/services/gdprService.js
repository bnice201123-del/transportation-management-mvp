import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import WorkSchedule from '../models/WorkSchedule.js';
import TimeOffRequest from '../models/TimeOffRequest.js';
import RecurringTrip from '../models/RecurringTrip.js';
import GDPRRequest from '../models/GDPRRequest.js';
import AuditLog from '../models/AuditLog.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GDPR Service
 * Handles data export and deletion requests in compliance with GDPR regulations
 */
class GDPRService {
  /**
   * Export all user data in specified format
   */
  static async exportUserData(userId, options = {}) {
    const format = options.format || 'json';
    const includeRelated = options.includeRelated !== false;

    try {
      // Fetch all user data from various collections
      const userData = await this.collectUserData(userId, includeRelated);

      // Generate export file based on format
      let exportData;
      let fileName;
      let mimeType;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(userData, null, 2);
          fileName = `user-data-${userId}-${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          exportData = this.convertToCSV(userData);
          fileName = `user-data-${userId}-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;

        case 'pdf':
          // PDF generation would require additional library (pdfkit, puppeteer)
          throw new Error('PDF format not yet implemented');

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Save export file
      const exportsDir = path.join(__dirname, '..', 'exports', 'gdpr');
      await fs.mkdir(exportsDir, { recursive: true });
      
      const filePath = path.join(exportsDir, fileName);
      await fs.writeFile(filePath, exportData);

      // Get file size
      const stats = await fs.stat(filePath);

      return {
        fileName,
        filePath,
        fileSize: stats.size,
        mimeType,
        dataCollections: Object.keys(userData),
        recordCounts: this.getRecordCounts(userData)
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Collect all user data from database
   */
  static async collectUserData(userId, includeRelated = true) {
    const data = {};

    // Personal information
    const user = await User.findById(userId)
      .select('+twoFactorSecret +twoFactorBackupCodes')
      .lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive fields but document their existence
    data.personalInformation = {
      ...user,
      password: '[REDACTED - Hashed]',
      twoFactorSecret: user.twoFactorSecret ? '[REDACTED]' : null,
      twoFactorBackupCodes: user.twoFactorBackupCodes?.length > 0 ? 
        '[REDACTED - Count: ' + user.twoFactorBackupCodes.length + ']' : null
    };

    if (includeRelated) {
      // Trips (as rider or driver)
      data.trips = {
        asRider: await Trip.find({ rider: userId }).lean(),
        asDriver: await Trip.find({ assignedDriver: userId }).lean()
      };

      // Vehicles (if driver)
      if (user.roles?.includes('driver') || user.role === 'driver') {
        data.vehicles = await Vehicle.find({ currentDriver: userId }).lean();
      }

      // Work schedules
      data.workSchedules = await WorkSchedule.find({ userId }).lean();

      // Time off requests
      data.timeOffRequests = await TimeOffRequest.find({ userId }).lean();

      // Recurring trips (created by user)
      data.recurringTrips = await RecurringTrip.find({ createdBy: userId }).lean();

      // Activity logs
      data.activityLogs = await ActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();

      // Notifications
      data.notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      // GDPR requests history
      data.gdprRequests = await GDPRRequest.find({ userId })
        .select('-verificationToken')
        .lean();

      // Audit logs
      data.auditLogs = await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();
    }

    // Metadata about export
    data.exportMetadata = {
      exportedAt: new Date(),
      userId,
      includeRelated,
      version: '1.0',
      note: 'This export contains all personal data stored in our system as per GDPR Article 15'
    };

    return data;
  }

  /**
   * Delete user data (Right to Erasure - GDPR Article 17)
   */
  static async deleteUserData(userId, options = {}) {
    const anonymize = options.anonymize !== false;
    const createBackup = options.createBackup !== false;
    const retainLegal = options.retainLegal !== false;

    const deletionResult = {
      deletedCollections: [],
      anonymizedCollections: [],
      retainedCollections: [],
      recordCounts: {},
      backupCreated: false
    };

    try {
      // Create backup before deletion
      if (createBackup) {
        const backup = await this.exportUserData(userId, { format: 'json', includeRelated: true });
        deletionResult.backupCreated = true;
        deletionResult.backupLocation = backup.filePath;
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Handle trips - anonymize instead of delete for audit purposes
      if (anonymize) {
        const tripsAsRider = await Trip.updateMany(
          { rider: userId },
          {
            $set: {
              riderName: 'Deleted User',
              riderPhone: null,
              riderEmail: null
            }
          }
        );
        deletionResult.recordCounts.trips_as_rider = tripsAsRider.modifiedCount;
        deletionResult.anonymizedCollections.push('trips_as_rider');

        const tripsAsDriver = await Trip.updateMany(
          { assignedDriver: userId },
          {
            $set: {
              assignedDriver: null
            }
          }
        );
        deletionResult.recordCounts.trips_as_driver = tripsAsDriver.modifiedCount;
        deletionResult.anonymizedCollections.push('trips_as_driver');
      }

      // Delete notifications (safe to delete)
      const notificationsResult = await Notification.deleteMany({ userId });
      deletionResult.recordCounts.notifications = notificationsResult.deletedCount;
      deletionResult.deletedCollections.push('notifications');

      // Delete work schedules
      const schedulesResult = await WorkSchedule.deleteMany({ userId });
      deletionResult.recordCounts.work_schedules = schedulesResult.deletedCount;
      deletionResult.deletedCollections.push('work_schedules');

      // Delete time off requests
      const timeOffResult = await TimeOffRequest.deleteMany({ userId });
      deletionResult.recordCounts.time_off_requests = timeOffResult.deletedCount;
      deletionResult.deletedCollections.push('time_off_requests');

      // Handle vehicles - unassign rather than delete
      const vehiclesResult = await Vehicle.updateMany(
        { currentDriver: userId },
        { $set: { currentDriver: null } }
      );
      deletionResult.recordCounts.vehicles_unassigned = vehiclesResult.modifiedCount;
      deletionResult.anonymizedCollections.push('vehicles');

      // Retain activity logs and audit logs for legal/compliance reasons
      if (retainLegal) {
        if (anonymize) {
          await ActivityLog.updateMany(
            { userId },
            { $set: { userId: null, details: 'User data deleted' } }
          );
          deletionResult.anonymizedCollections.push('activity_logs');
        }
        deletionResult.retainedCollections.push('activity_logs', 'audit_logs');
      } else {
        const activityResult = await ActivityLog.deleteMany({ userId });
        deletionResult.recordCounts.activity_logs = activityResult.deletedCount;
        deletionResult.deletedCollections.push('activity_logs');

        // Note: Audit logs typically should be retained for compliance
        deletionResult.retainedCollections.push('audit_logs');
      }

      // Delete or anonymize recurring trips created by user
      if (anonymize) {
        await RecurringTrip.updateMany(
          { createdBy: userId },
          { $set: { createdBy: null } }
        );
        deletionResult.anonymizedCollections.push('recurring_trips');
      } else {
        const recurringResult = await RecurringTrip.deleteMany({ createdBy: userId });
        deletionResult.recordCounts.recurring_trips = recurringResult.deletedCount;
        deletionResult.deletedCollections.push('recurring_trips');
      }

      // Finally, delete or anonymize the user account
      if (anonymize) {
        user.firstName = 'Deleted';
        user.lastName = 'User';
        user.email = `deleted-${userId}@deleted.local`;
        user.username = `deleted_${userId}`;
        user.phone = null;
        user.isActive = false;
        user.profileImage = null;
        user.securityQuestions = [];
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.twoFactorBackupCodes = [];
        await user.save();
        deletionResult.anonymizedCollections.push('user_account');
      } else {
        await User.findByIdAndDelete(userId);
        deletionResult.deletedCollections.push('user_account');
      }

      return deletionResult;
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Get file path for download
   */
  static getExportFilePath(fileName) {
    return path.join(__dirname, '..', 'exports', 'gdpr', fileName);
  }

  /**
   * Delete export file
   */
  static async deleteExportFile(fileName) {
    try {
      const filePath = this.getExportFilePath(fileName);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting export file:', error);
      return false;
    }
  }

  /**
   * Convert data to CSV format
   */
  static convertToCSV(userData) {
    let csv = '';

    // Personal Information
    csv += '=== PERSONAL INFORMATION ===\n';
    csv += 'Field,Value\n';
    Object.entries(userData.personalInformation).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        csv += `${key},"${JSON.stringify(value)}"\n`;
      } else {
        csv += `${key},"${value}"\n`;
      }
    });
    csv += '\n';

    // Trips as Rider
    if (userData.trips?.asRider?.length > 0) {
      csv += '=== TRIPS AS RIDER ===\n';
      csv += 'Trip ID,Pickup,Dropoff,Status,Date\n';
      userData.trips.asRider.forEach(trip => {
        csv += `${trip.tripId},"${trip.pickupLocation?.address || 'N/A'}","${trip.dropoffLocation?.address || 'N/A'}",${trip.status},${trip.scheduledTime}\n`;
      });
      csv += '\n';
    }

    // Add other sections as needed...
    csv += '=== EXPORT METADATA ===\n';
    csv += `Exported At,${userData.exportMetadata.exportedAt}\n`;
    csv += `User ID,${userData.exportMetadata.userId}\n`;

    return csv;
  }

  /**
   * Get record counts from user data
   */
  static getRecordCounts(userData) {
    const counts = {};

    if (userData.personalInformation) counts.personalInformation = 1;
    if (userData.trips) {
      counts.trips_as_rider = userData.trips.asRider?.length || 0;
      counts.trips_as_driver = userData.trips.asDriver?.length || 0;
    }
    if (userData.vehicles) counts.vehicles = userData.vehicles.length;
    if (userData.workSchedules) counts.workSchedules = userData.workSchedules.length;
    if (userData.timeOffRequests) counts.timeOffRequests = userData.timeOffRequests.length;
    if (userData.recurringTrips) counts.recurringTrips = userData.recurringTrips.length;
    if (userData.activityLogs) counts.activityLogs = userData.activityLogs.length;
    if (userData.notifications) counts.notifications = userData.notifications.length;
    if (userData.gdprRequests) counts.gdprRequests = userData.gdprRequests.length;
    if (userData.auditLogs) counts.auditLogs = userData.auditLogs.length;

    return counts;
  }

  /**
   * Clean up old export files
   */
  static async cleanupOldExports(daysOld = 30) {
    try {
      const exportsDir = path.join(__dirname, '..', 'exports', 'gdpr');
      const files = await fs.readdir(exportsDir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(exportsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old exports:', error);
      return 0;
    }
  }
}

export default GDPRService;
