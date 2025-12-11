import MaintenanceSchedule from '../models/MaintenanceSchedule.js';
import Vehicle from '../models/Vehicle.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * MaintenanceScheduleService
 * Business logic for automated maintenance scheduling, notifications, and analytics
 */

class MaintenanceScheduleService {
  /**
   * Create a new maintenance schedule
   */
  async createSchedule(scheduleData, createdBy) {
    try {
      const schedule = new MaintenanceSchedule({
        ...scheduleData,
        createdBy,
        lastModifiedBy: createdBy
      });

      await schedule.save();

      // Log activity
      await ActivityLog.create({
        user: createdBy,
        action: 'maintenance_schedule_created',
        target: 'MaintenanceSchedule',
        targetId: schedule._id,
        details: `Created maintenance schedule: ${schedule.scheduleName}`,
        metadata: {
          scheduleId: schedule.scheduleId,
          vehicleId: schedule.vehicle
        }
      });

      return schedule;
    } catch (error) {
      throw new Error(`Failed to create maintenance schedule: ${error.message}`);
    }
  }

  /**
   * Create schedules in bulk for multiple vehicles
   */
  async createBulkSchedules(vehicleIds, scheduleTemplate, createdBy) {
    try {
      const schedules = [];
      
      for (const vehicleId of vehicleIds) {
        const schedule = new MaintenanceSchedule({
          ...scheduleTemplate,
          vehicle: vehicleId,
          createdBy,
          lastModifiedBy: createdBy
        });
        
        schedules.push(schedule);
      }

      const created = await MaintenanceSchedule.insertMany(schedules);

      // Log activity
      await ActivityLog.create({
        user: createdBy,
        action: 'bulk_maintenance_schedules_created',
        target: 'MaintenanceSchedule',
        details: `Created ${created.length} maintenance schedules`,
        metadata: {
          vehicleCount: vehicleIds.length,
          scheduleName: scheduleTemplate.scheduleName
        }
      });

      return created;
    } catch (error) {
      throw new Error(`Failed to create bulk schedules: ${error.message}`);
    }
  }

  /**
   * Update next due date for a schedule
   */
  async updateNextDue(scheduleId, currentMileage, averageDailyMiles) {
    try {
      const schedule = await MaintenanceSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      schedule.calculateNextDue(currentMileage, averageDailyMiles);
      await schedule.save();

      return schedule;
    } catch (error) {
      throw new Error(`Failed to update next due: ${error.message}`);
    }
  }

  /**
   * Get all schedules due for a vehicle
   */
  async getDueSchedules(vehicleId, options = {}) {
    try {
      const { 
        includeUpcoming = true, 
        upcomingDays = 30,
        upcomingMiles = 1000 
      } = options;

      const query = {
        vehicle: vehicleId,
        isActive: true,
        status: 'scheduled'
      };

      let schedules = await MaintenanceSchedule.find(query)
        .populate('vehicle', 'make model year licensePlate mileage')
        .sort({ 'nextDue.date': 1 });

      // Filter based on criteria
      const now = new Date();
      schedules = schedules.filter(schedule => {
        // Include overdue
        if (schedule.nextDue.isOverdue) return true;

        // Include upcoming if requested
        if (includeUpcoming) {
          const daysUntilDue = schedule.nextDue.daysUntilDue || 0;
          const milesUntilDue = schedule.nextDue.milesUntilDue || 0;

          return daysUntilDue <= upcomingDays || milesUntilDue <= upcomingMiles;
        }

        return false;
      });

      return schedules;
    } catch (error) {
      throw new Error(`Failed to get due schedules: ${error.message}`);
    }
  }

  /**
   * Get all overdue schedules across fleet
   */
  async getOverdueSchedules() {
    try {
      const schedules = await MaintenanceSchedule.find({
        isActive: true,
        status: 'scheduled',
        'nextDue.isOverdue': true
      })
        .populate('vehicle', 'make model year licensePlate mileage currentDriver')
        .sort({ 'nextDue.overdueBy.days': -1 });

      return schedules;
    } catch (error) {
      throw new Error(`Failed to get overdue schedules: ${error.message}`);
    }
  }

  /**
   * Mark schedule as completed
   */
  async completeSchedule(scheduleId, completionData, completedBy) {
    try {
      const { maintenanceRecordId, completedDate, completedMileage, actualCost } = completionData;

      const schedule = await MaintenanceSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Mark as completed
      schedule.markCompleted(maintenanceRecordId, completedDate, completedMileage, actualCost);
      
      // Update status
      schedule.status = 'completed';
      schedule.lastModifiedBy = completedBy;
      
      await schedule.save();

      // Update vehicle's next service date
      const vehicle = await Vehicle.findById(schedule.vehicle);
      if (vehicle) {
        vehicle.lastServiceDate = completedDate;
        vehicle.mileage = completedMileage;
        await vehicle.save();
      }

      // Log activity
      await ActivityLog.create({
        user: completedBy,
        action: 'maintenance_schedule_completed',
        target: 'MaintenanceSchedule',
        targetId: schedule._id,
        details: `Completed maintenance schedule: ${schedule.scheduleName}`,
        metadata: {
          scheduleId: schedule.scheduleId,
          vehicleId: schedule.vehicle,
          maintenanceRecordId,
          actualCost
        }
      });

      return schedule;
    } catch (error) {
      throw new Error(`Failed to complete schedule: ${error.message}`);
    }
  }

  /**
   * Reschedule a maintenance
   */
  async rescheduleMaintenance(scheduleId, newDate, newMileage, reason, rescheduledBy) {
    try {
      const schedule = await MaintenanceSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const oldDate = schedule.nextDue.date;
      const oldMileage = schedule.nextDue.mileage;

      schedule.nextDue.date = newDate;
      schedule.nextDue.mileage = newMileage;
      schedule.lastModifiedBy = rescheduledBy;

      // Reset notification flags for new date
      if (schedule.notifications.reminderSchedule) {
        schedule.notifications.reminderSchedule.forEach(reminder => {
          reminder.sent = false;
          reminder.sentAt = null;
        });
        schedule.notifications.lastNotificationSent = null;
      }

      await schedule.save();

      // Log activity
      await ActivityLog.create({
        user: rescheduledBy,
        action: 'maintenance_schedule_rescheduled',
        target: 'MaintenanceSchedule',
        targetId: schedule._id,
        details: `Rescheduled ${schedule.scheduleName}: ${reason}`,
        metadata: {
          scheduleId: schedule.scheduleId,
          oldDate,
          newDate,
          oldMileage,
          newMileage,
          reason
        }
      });

      return schedule;
    } catch (error) {
      throw new Error(`Failed to reschedule maintenance: ${error.message}`);
    }
  }

  /**
   * Check which schedules need notifications
   */
  async getSchedulesNeedingNotification(notificationType = null) {
    try {
      const now = new Date();
      const schedules = await MaintenanceSchedule.find({
        isActive: true,
        status: 'scheduled',
        'notifications.enabled': true
      })
        .populate('vehicle', 'make model year licensePlate mileage currentDriver')
        .populate('notifications.recipients.user', 'firstName lastName email phoneNumber');

      const needingNotification = [];

      for (const schedule of schedules) {
        // Check each reminder type
        for (const reminder of schedule.notifications.reminderSchedule || []) {
          // Skip if already sent
          if (reminder.sent) continue;

          // Skip if filtering by type and this isn't it
          if (notificationType && reminder.type !== notificationType) continue;

          let shouldNotify = false;

          switch (reminder.type) {
            case 'days_before':
              if (schedule.nextDue.daysUntilDue <= reminder.value) {
                shouldNotify = true;
              }
              break;

            case 'miles_before':
              if (schedule.nextDue.milesUntilDue <= reminder.value) {
                shouldNotify = true;
              }
              break;

            case 'at_due':
              if (schedule.nextDue.daysUntilDue <= 0 && !schedule.nextDue.isOverdue) {
                shouldNotify = true;
              }
              break;

            case 'overdue':
              if (schedule.nextDue.isOverdue) {
                shouldNotify = true;
              }
              break;
          }

          if (shouldNotify) {
            needingNotification.push({
              schedule,
              reminderType: reminder.type,
              channels: reminder.channels
            });
          }
        }
      }

      return needingNotification;
    } catch (error) {
      throw new Error(`Failed to get schedules needing notification: ${error.message}`);
    }
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(scheduleId, notificationType) {
    try {
      const schedule = await MaintenanceSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      schedule.markNotificationSent(notificationType);
      await schedule.save();

      return schedule;
    } catch (error) {
      throw new Error(`Failed to mark notification sent: ${error.message}`);
    }
  }

  /**
   * Get maintenance schedule performance analytics
   */
  async getPerformanceAnalytics(vehicleId = null, dateRange = null) {
    try {
      const query = {
        isActive: true
      };

      if (vehicleId) {
        query.vehicle = vehicleId;
      }

      const schedules = await MaintenanceSchedule.find(query)
        .populate('vehicle', 'make model year licensePlate');

      const analytics = {
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.status === 'scheduled').length,
        completedSchedules: schedules.filter(s => s.status === 'completed').length,
        overdueSchedules: schedules.filter(s => s.nextDue.isOverdue).length,
        upcomingSchedules: schedules.filter(s => 
          !s.nextDue.isOverdue && s.nextDue.daysUntilDue <= 30
        ).length,
        
        // Performance metrics
        totalCompletions: 0,
        onTimeCompletions: 0,
        lateCompletions: 0,
        completionRate: 0,
        averageCost: 0,
        averageDelay: 0,
        totalCost: 0,

        // By schedule type
        byType: {},
        byPriority: {},
        byCategory: {},

        // Cost trends
        costTrend: {
          increasing: 0,
          stable: 0,
          decreasing: 0
        }
      };

      schedules.forEach(schedule => {
        // Aggregate performance metrics
        analytics.totalCompletions += schedule.performance.totalCompletions || 0;
        analytics.onTimeCompletions += schedule.performance.onTimeCompletions || 0;
        analytics.lateCompletions += schedule.performance.lateCompletions || 0;
        
        if (schedule.performance.averageCost) {
          analytics.totalCost += schedule.performance.averageCost * (schedule.performance.totalCompletions || 1);
        }

        // Group by type
        const type = schedule.scheduleType;
        if (!analytics.byType[type]) {
          analytics.byType[type] = { count: 0, overdue: 0, upcoming: 0 };
        }
        analytics.byType[type].count++;
        if (schedule.nextDue.isOverdue) analytics.byType[type].overdue++;
        if (!schedule.nextDue.isOverdue && schedule.nextDue.daysUntilDue <= 30) {
          analytics.byType[type].upcoming++;
        }

        // Group by priority
        const priority = schedule.priority;
        if (!analytics.byPriority[priority]) {
          analytics.byPriority[priority] = { count: 0, overdue: 0 };
        }
        analytics.byPriority[priority].count++;
        if (schedule.nextDue.isOverdue) analytics.byPriority[priority].overdue++;

        // Group by category
        const category = schedule.serviceDetails.category;
        if (!analytics.byCategory[category]) {
          analytics.byCategory[category] = { count: 0, avgCost: 0, totalCost: 0 };
        }
        analytics.byCategory[category].count++;
        if (schedule.performance.averageCost) {
          analytics.byCategory[category].totalCost += schedule.performance.averageCost;
        }

        // Cost trends
        if (schedule.performance.costTrend) {
          analytics.costTrend[schedule.performance.costTrend]++;
        }
      });

      // Calculate averages
      if (analytics.totalCompletions > 0) {
        analytics.completionRate = (analytics.onTimeCompletions / analytics.totalCompletions) * 100;
        analytics.averageCost = analytics.totalCost / analytics.totalCompletions;
      }

      // Calculate average cost per category
      Object.keys(analytics.byCategory).forEach(category => {
        const cat = analytics.byCategory[category];
        if (cat.count > 0) {
          cat.avgCost = cat.totalCost / cat.count;
        }
      });

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get performance analytics: ${error.message}`);
    }
  }

  /**
   * Calculate average daily mileage for a vehicle
   */
  async calculateAverageDailyMileage(vehicleId, days = 30) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get maintenance records from the last X days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const records = await MaintenanceRecord.find({
        vehicle: vehicleId,
        completedDate: { $gte: cutoffDate }
      }).sort({ mileage: 1 });

      if (records.length < 2) {
        // Not enough data, estimate from vehicle utilization
        if (vehicle.utilizationMetrics?.totalMilesDriven && vehicle.createdAt) {
          const daysSinceCreation = Math.ceil((new Date() - vehicle.createdAt) / (1000 * 60 * 60 * 24));
          return vehicle.utilizationMetrics.totalMilesDriven / daysSinceCreation;
        }
        return 50; // Default estimate
      }

      // Calculate average from records
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      
      const mileageDiff = lastRecord.mileage - firstRecord.mileage;
      const daysDiff = Math.ceil((lastRecord.completedDate - firstRecord.completedDate) / (1000 * 60 * 60 * 24));

      return daysDiff > 0 ? mileageDiff / daysDiff : 50;
    } catch (error) {
      throw new Error(`Failed to calculate average daily mileage: ${error.message}`);
    }
  }

  /**
   * Update all schedules for a vehicle
   */
  async updateAllVehicleSchedules(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const averageDailyMiles = await this.calculateAverageDailyMileage(vehicleId);
      const currentMileage = vehicle.mileage || 0;

      const schedules = await MaintenanceSchedule.find({
        vehicle: vehicleId,
        isActive: true,
        status: 'scheduled'
      });

      for (const schedule of schedules) {
        schedule.calculateNextDue(currentMileage, averageDailyMiles);
        await schedule.save();
      }

      return schedules;
    } catch (error) {
      throw new Error(`Failed to update vehicle schedules: ${error.message}`);
    }
  }

  /**
   * Deactivate a schedule
   */
  async deactivateSchedule(scheduleId, reason, deactivatedBy) {
    try {
      const schedule = await MaintenanceSchedule.findById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      schedule.isActive = false;
      schedule.status = 'cancelled';
      schedule.lastModifiedBy = deactivatedBy;

      await schedule.save();

      // Log activity
      await ActivityLog.create({
        user: deactivatedBy,
        action: 'maintenance_schedule_deactivated',
        target: 'MaintenanceSchedule',
        targetId: schedule._id,
        details: `Deactivated maintenance schedule: ${schedule.scheduleName} - ${reason}`,
        metadata: {
          scheduleId: schedule.scheduleId,
          reason
        }
      });

      return schedule;
    } catch (error) {
      throw new Error(`Failed to deactivate schedule: ${error.message}`);
    }
  }

  /**
   * Get upcoming maintenance calendar
   */
  async getMaintenanceCalendar(startDate, endDate, vehicleIds = null) {
    try {
      const query = {
        isActive: true,
        status: 'scheduled',
        'nextDue.date': {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (vehicleIds && vehicleIds.length > 0) {
        query.vehicle = { $in: vehicleIds };
      }

      const schedules = await MaintenanceSchedule.find(query)
        .populate('vehicle', 'make model year licensePlate mileage')
        .sort({ 'nextDue.date': 1 });

      // Group by date
      const calendar = {};
      schedules.forEach(schedule => {
        const dateKey = schedule.nextDue.date.toISOString().split('T')[0];
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push(schedule);
      });

      return calendar;
    } catch (error) {
      throw new Error(`Failed to get maintenance calendar: ${error.message}`);
    }
  }
}

export default new MaintenanceScheduleService();
