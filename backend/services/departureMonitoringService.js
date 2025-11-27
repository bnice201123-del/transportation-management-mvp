import cron from 'node-cron';
import TripDepartureMonitoring from '../models/TripDepartureMonitoring.js';
import { notifyUrgent, notifyAdminsAndDispatchers, createNotification } from '../utils/notificationHelper.js';
import { formatTimeRemaining } from '../utils/departureCalculations.js';

class DepartureMonitoringService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the monitoring service
   */
  start() {
    if (this.isRunning) {
      console.log('Departure monitoring service is already running');
      return;
    }

    console.log('🚀 Starting Departure Monitoring Service...');

    // Check every minute for notifications that need to be sent
    this.jobs.set('checkReminders', cron.schedule('* * * * *', async () => {
      await this.checkFiveMinuteReminders();
      await this.checkDepartureTimeAlerts();
      await this.checkLateDrivers();
    }));

    // Cleanup completed monitoring records daily at 2 AM
    this.jobs.set('cleanup', cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldRecords();
    }));

    this.isRunning = true;
    console.log('✅ Departure Monitoring Service started');
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    console.log('Stopping Departure Monitoring Service...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`  Stopped job: ${name}`);
    });
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Departure Monitoring Service stopped');
  }

  /**
   * Check and send 5-minute reminders
   */
  async checkFiveMinuteReminders() {
    try {
      const monitoringRecords = await TripDepartureMonitoring.getNeedingFiveMinuteReminder();

      for (const record of monitoringRecords) {
        // Double-check that reminder should be sent
        if (!record.shouldSendFiveMinuteReminder()) {
          continue;
        }

        await this.sendFiveMinuteReminder(record);
      }
    } catch (error) {
      console.error('Error checking 5-minute reminders:', error);
    }
  }

  /**
   * Send 5-minute reminder to driver
   */
  async sendFiveMinuteReminder(monitoring) {
    try {
      const trip = monitoring.tripId;
      const driver = monitoring.driverId;

      const message = `Trip #${trip.tripId}: You should start navigating to the pickup location in 5 minutes to arrive on time at ${monitoring.pickupLocation.address || 'the pickup location'}.`;

      // Create notification for driver
      await createNotification({
        userId: driver._id,
        type: 'trip_started',
        title: '🚗 Time to Prepare for Departure',
        message,
        relatedData: {
          tripId: trip._id,
          actionUrl: '/driver'
        },
        priority: 'normal'
      });

      // Update monitoring record
      monitoring.notifications.fiveMinuteReminder.sent = true;
      monitoring.notifications.fiveMinuteReminder.sentAt = new Date();
      await monitoring.save();

      console.log(`✉️  Sent 5-minute reminder to ${driver.firstName} ${driver.lastName} for trip ${trip.tripId}`);
    } catch (error) {
      console.error('Error sending 5-minute reminder:', error);
    }
  }

  /**
   * Check and send departure time alerts
   */
  async checkDepartureTimeAlerts() {
    try {
      const monitoringRecords = await TripDepartureMonitoring.find({
        status: 'monitoring',
        navigationStarted: false,
        'notifications.departureTimeAlert.sent': false
      }).populate('tripId driverId');

      for (const record of monitoringRecords) {
        if (record.hasDepartureTimePassed()) {
          await this.sendDepartureTimeAlert(record);
        }
      }
    } catch (error) {
      console.error('Error checking departure time alerts:', error);
    }
  }

  /**
   * Send departure time alert (it's time to leave NOW)
   */
  async sendDepartureTimeAlert(monitoring) {
    try {
      const trip = monitoring.tripId;
      const driver = monitoring.driverId;

      const message = `Trip #${trip.tripId}: It's time to start navigating NOW! Pickup scheduled for ${new Date(monitoring.scheduledPickupTime).toLocaleTimeString()}.`;

      // Create urgent notification for driver
      await notifyUrgent(
        driver._id,
        '🚨 Start Navigation Now!',
        message,
        {
          tripId: trip._id,
          actionUrl: '/driver'
        }
      );

      // Update monitoring record
      monitoring.notifications.departureTimeAlert.sent = true;
      monitoring.notifications.departureTimeAlert.sentAt = new Date();
      await monitoring.save();

      console.log(`🚨 Sent departure time alert to ${driver.firstName} ${driver.lastName} for trip ${trip.tripId}`);
    } catch (error) {
      console.error('Error sending departure time alert:', error);
    }
  }

  /**
   * Check for late drivers and escalate to dispatch
   */
  async checkLateDrivers() {
    try {
      const lateDrivers = await TripDepartureMonitoring.getLateDrivers();

      for (const record of lateDrivers) {
        if (record.isDriverLate()) {
          await this.escalateToDispatch(record);
        }
      }
    } catch (error) {
      console.error('Error checking late drivers:', error);
    }
  }

  /**
   * Escalate late departure to dispatch
   */
  async escalateToDispatch(monitoring) {
    try {
      const trip = monitoring.tripId;
      const driver = monitoring.driverId;

      // Calculate how late
      const now = new Date();
      const departureTime = new Date(monitoring.recommendedDepartureTime);
      const minutesLate = Math.floor((now - departureTime) / (60 * 1000));

      const message = `Driver ${driver.firstName} ${driver.lastName} has not started navigating for Trip #${trip.tripId}. They are ${minutesLate} minutes late. Pickup scheduled: ${new Date(monitoring.scheduledPickupTime).toLocaleTimeString()}. Please follow up immediately.`;

      // Notify all dispatchers and admins
      await notifyAdminsAndDispatchers(
        '⚠️ Driver Late to Start Trip',
        message,
        'urgent'
      );

      // Send reminder to driver as well
      await notifyUrgent(
        driver._id,
        '⚠️ You\'re Late to Start Trip',
        `You were supposed to start navigating ${minutesLate} minutes ago for Trip #${trip.tripId}. Please start immediately!`,
        {
          tripId: trip._id,
          actionUrl: '/driver'
        }
      );

      // Update monitoring record
      monitoring.notifications.lateStartAlert.sent = true;
      monitoring.notifications.lateStartAlert.sentAt = new Date();
      monitoring.notifications.lateStartAlert.escalatedToDispatch = true;
      monitoring.status = 'late';
      await monitoring.save();

      console.log(`🚨 Escalated late driver ${driver.firstName} ${driver.lastName} to dispatch for trip ${trip.tripId}`);
    } catch (error) {
      console.error('Error escalating to dispatch:', error);
    }
  }

  /**
   * Clean up old completed monitoring records (older than 7 days)
   */
  async cleanupOldRecords() {
    try {
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

      const result = await TripDepartureMonitoring.deleteMany({
        status: { $in: ['completed', 'cancelled', 'skipped'] },
        monitoringCompletedAt: { $lt: sevenDaysAgo }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old monitoring records`);
    } catch (error) {
      console.error('Error cleaning up old records:', error);
    }
  }

  /**
   * Get current status of the service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

// Create singleton instance
const departureMonitoringService = new DepartureMonitoringService();

export default departureMonitoringService;
