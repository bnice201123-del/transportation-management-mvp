import cron from 'node-cron';
import Schedule from '../models/Schedule.js';
import ShiftSwap from '../models/ShiftSwap.js';
import VacationBalance from '../models/VacationBalance.js';
import User from '../models/User.js';
import notificationService from './notificationService.js';
import googleCalendarService from './googleCalendarService.js';
import outlookCalendarService from './outlookCalendarService.js';

class CronJobService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize all cron jobs
   */
  init() {
    console.log('🕐 Initializing cron jobs...');

    // Shift reminders - Every 5 minutes
    this.scheduleShiftReminders();

    // Expire old shift swaps - Daily at 2 AM
    this.scheduleExpireShiftSwaps();

    // Vacation carryover expiration - Daily at 3 AM
    this.scheduleVacationCarryoverExpiration();

    // Calendar sync - Daily at 4 AM
    this.scheduleCalendarSync();

    // Coverage gap alerts - Daily at 8 AM
    this.scheduleCoverageGapAlerts();

    // Overtime reports - Weekly on Monday at 9 AM
    this.scheduleOvertimeReports();

    console.log(`✅ ${this.jobs.length} cron jobs scheduled`);
  }

  /**
   * Send shift reminders 1 hour before start time
   * Runs every 5 minutes
   */
  scheduleShiftReminders() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('🔔 Running shift reminder job...');

        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const fiveMinutesFromOneHour = new Date(oneHourFromNow.getTime() + 5 * 60 * 1000);

        // Find shifts starting in approximately 1 hour
        const upcomingShifts = await Schedule.find({
          startTime: {
            $gte: oneHourFromNow,
            $lte: fiveMinutesFromOneHour
          },
          status: { $in: ['scheduled', 'confirmed'] },
          reminderSent: { $ne: true }
        }).populate('driver vehicle');

        console.log(`📨 Found ${upcomingShifts.length} shifts needing reminders`);

        for (const schedule of upcomingShifts) {
          if (!schedule.driver) continue;

          try {
            // Send notification
            const results = await notificationService.sendShiftReminder(
              schedule.driver,
              schedule,
              1 // 1 hour before
            );

            // Mark reminder as sent
            schedule.reminderSent = true;
            schedule.reminderSentAt = new Date();
            await schedule.save();

            console.log(`✅ Reminder sent to ${schedule.driver.name} (Email: ${results.email?.success}, SMS: ${results.sms?.success})`);
          } catch (error) {
            console.error(`❌ Failed to send reminder for schedule ${schedule._id}:`, error.message);
          }
        }

        console.log('✅ Shift reminder job completed');
      } catch (error) {
        console.error('❌ Error in shift reminder job:', error);
      }
    });

    this.jobs.push({ name: 'Shift Reminders', schedule: '*/5 * * * *', job });
    console.log('  ✓ Shift Reminders: Every 5 minutes');
  }

  /**
   * Expire shift swap requests older than 48 hours
   * Runs daily at 2 AM
   */
  scheduleExpireShiftSwaps() {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('⏰ Running shift swap expiration job...');

        const result = await ShiftSwap.expireOldRequests();

        console.log(`✅ Expired ${result.modifiedCount} old shift swap requests`);
      } catch (error) {
        console.error('❌ Error in shift swap expiration job:', error);
      }
    });

    this.jobs.push({ name: 'Expire Shift Swaps', schedule: '0 2 * * *', job });
    console.log('  ✓ Expire Shift Swaps: Daily at 2:00 AM');
  }

  /**
   * Expire vacation carryover days on April 1st
   * Runs daily at 3 AM (only takes effect on April 1st)
   */
  scheduleVacationCarryoverExpiration() {
    const job = cron.schedule('0 3 * * *', async () => {
      try {
        const today = new Date();
        const month = today.getMonth(); // 0-indexed (3 = April)
        const day = today.getDate();

        // Only run on April 1st
        if (month === 3 && day === 1) {
          console.log('📅 Running vacation carryover expiration job (April 1st)...');

          const year = today.getFullYear();
          const result = await VacationBalance.expireCarryovers(year);

          console.log(`✅ Expired carryover days for ${result.modifiedCount} drivers`);

          // Send notification to affected drivers
          const affectedBalances = await VacationBalance.find({
            year,
            'history.type': 'expired'
          }).populate('driver');

          for (const balance of affectedBalances) {
            const expiredEntry = balance.history.find(h => h.type === 'expired' && h.year === year);
            if (expiredEntry && balance.driver && balance.driver.email) {
              try {
                await notificationService.sendEmail({
                  to: balance.driver.email,
                  subject: 'Vacation Carryover Expired',
                  html: `
                    <h2>Vacation Carryover Expired</h2>
                    <p>Hi ${balance.driver.firstName},</p>
                    <p>${Math.abs(expiredEntry.days)} unused carryover vacation days have expired as of April 1st.</p>
                    <p>Your current vacation balance: ${balance.available} days</p>
                    <p>Please plan your time off early this year to avoid future expirations.</p>
                  `,
                  text: `Vacation Carryover Expired\n\nHi ${balance.driver.firstName},\n\n${Math.abs(expiredEntry.days)} unused carryover vacation days have expired as of April 1st.\n\nYour current vacation balance: ${balance.available} days`
                });
              } catch (error) {
                console.error(`Failed to send expiration notice to ${balance.driver.email}:`, error.message);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in vacation carryover expiration job:', error);
      }
    });

    this.jobs.push({ name: 'Expire Vacation Carryover', schedule: '0 3 * * *', job });
    console.log('  ✓ Expire Vacation Carryover: Daily at 3:00 AM (April 1st only)');
  }

  /**
   * Sync schedules to connected calendars
   * Runs daily at 4 AM
   */
  scheduleCalendarSync() {
    const job = cron.schedule('0 4 * * *', async () => {
      try {
        console.log('📅 Running calendar sync job...');

        // Find users with calendar integrations enabled
        const usersWithCalendars = await User.find({
          $or: [
            { 'integrations.googleCalendar.enabled': true },
            { 'integrations.outlookCalendar.enabled': true }
          ]
        });

        console.log(`🔄 Syncing calendars for ${usersWithCalendars.length} users`);

        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        for (const user of usersWithCalendars) {
          try {
            // Get user's upcoming schedules
            const schedules = await Schedule.find({
              driver: user._id,
              startTime: { $gte: today },
              endTime: { $lte: thirtyDaysFromNow },
              status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
            }).populate('vehicle');

            // Sync to Google Calendar
            if (user.integrations?.googleCalendar?.enabled) {
              try {
                const googleResults = await googleCalendarService.syncSchedules(user._id, schedules);
                console.log(`  ✓ Google Calendar sync for ${user.firstName}: ${googleResults.created} created, ${googleResults.updated} updated`);
              } catch (error) {
                console.error(`  ✗ Google Calendar sync failed for ${user.email}:`, error.message);
              }
            }

            // Sync to Outlook Calendar
            if (user.integrations?.outlookCalendar?.enabled) {
              try {
                const outlookResults = await outlookCalendarService.syncSchedules(user._id, schedules);
                console.log(`  ✓ Outlook Calendar sync for ${user.firstName}: ${outlookResults.created} created, ${outlookResults.updated} updated`);
              } catch (error) {
                console.error(`  ✗ Outlook Calendar sync failed for ${user.email}:`, error.message);
              }
            }
          } catch (error) {
            console.error(`Failed to sync calendars for user ${user._id}:`, error.message);
          }
        }

        console.log('✅ Calendar sync job completed');
      } catch (error) {
        console.error('❌ Error in calendar sync job:', error);
      }
    });

    this.jobs.push({ name: 'Calendar Sync', schedule: '0 4 * * *', job });
    console.log('  ✓ Calendar Sync: Daily at 4:00 AM');
  }

  /**
   * Send coverage gap alerts to admins
   * Runs daily at 8 AM
   */
  scheduleCoverageGapAlerts() {
    const job = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('🚨 Running coverage gap alert job...');

        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        // Find coverage gaps in next 7 days
        const gaps = await Schedule.findCoverageGaps(today, sevenDaysFromNow);

        if (gaps.length > 0) {
          console.log(`⚠️  Found ${gaps.length} coverage gaps`);

          // Get all admins
          const admins = await User.find({
            $or: [
              { role: 'admin' },
              { roles: 'admin' }
            ],
            isActive: true
          });

          // Send alert to each admin
          for (const admin of admins) {
            if (admin.email) {
              try {
                await notificationService.sendCoverageGapAlert(admin, gaps);
                console.log(`  ✓ Coverage gap alert sent to ${admin.email}`);
              } catch (error) {
                console.error(`  ✗ Failed to send alert to ${admin.email}:`, error.message);
              }
            }
          }
        } else {
          console.log('✅ No coverage gaps found');
        }

        console.log('✅ Coverage gap alert job completed');
      } catch (error) {
        console.error('❌ Error in coverage gap alert job:', error);
      }
    });

    this.jobs.push({ name: 'Coverage Gap Alerts', schedule: '0 8 * * *', job });
    console.log('  ✓ Coverage Gap Alerts: Daily at 8:00 AM');
  }

  /**
   * Send weekly overtime report to admins
   * Runs every Monday at 9 AM
   */
  scheduleOvertimeReports() {
    const job = cron.schedule('0 9 * * 1', async () => {
      try {
        console.log('📊 Running weekly overtime report job...');

        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        // Get overtime report
        const overtimeReport = await Schedule.aggregate([
          {
            $match: {
              actualEndTime: { $exists: true },
              actualStartTime: { $gte: lastWeek, $lte: today },
              overtimeHours: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: '$driver',
              totalOvertime: { $sum: '$overtimeHours' },
              shiftCount: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'driver'
            }
          },
          {
            $unwind: '$driver'
          },
          {
            $sort: { totalOvertime: -1 }
          }
        ]);

        if (overtimeReport.length > 0) {
          console.log(`📈 ${overtimeReport.length} drivers with overtime this week`);

          // Get admins
          const admins = await User.find({
            $or: [
              { role: 'admin' },
              { roles: 'admin' }
            ],
            isActive: true
          });

          // Create report email
          const reportHtml = `
            <h2>Weekly Overtime Report</h2>
            <p>Week ending ${today.toLocaleDateString()}</p>
            <table border="1" cellpadding="5" cellspacing="0">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Total Overtime Hours</th>
                  <th>Number of Shifts</th>
                </tr>
              </thead>
              <tbody>
                ${overtimeReport.map(r => `
                  <tr>
                    <td>${r.driver.firstName} ${r.driver.lastName}</td>
                    <td>${r.totalOvertime.toFixed(2)}</td>
                    <td>${r.shiftCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p><strong>Total Overtime Hours:</strong> ${overtimeReport.reduce((sum, r) => sum + r.totalOvertime, 0).toFixed(2)}</p>
          `;

          // Send to each admin
          for (const admin of admins) {
            if (admin.email) {
              try {
                await notificationService.sendEmail({
                  to: admin.email,
                  subject: `Weekly Overtime Report - ${today.toLocaleDateString()}`,
                  html: reportHtml,
                  text: `Weekly Overtime Report - ${today.toLocaleDateString()}\n\n` +
                        overtimeReport.map(r => 
                          `${r.driver.firstName} ${r.driver.lastName}: ${r.totalOvertime.toFixed(2)} hours (${r.shiftCount} shifts)`
                        ).join('\n')
                });
                console.log(`  ✓ Overtime report sent to ${admin.email}`);
              } catch (error) {
                console.error(`  ✗ Failed to send report to ${admin.email}:`, error.message);
              }
            }
          }
        } else {
          console.log('✅ No overtime recorded this week');
        }

        console.log('✅ Overtime report job completed');
      } catch (error) {
        console.error('❌ Error in overtime report job:', error);
      }
    });

    this.jobs.push({ name: 'Weekly Overtime Report', schedule: '0 9 * * 1', job });
    console.log('  ✓ Weekly Overtime Report: Mondays at 9:00 AM');
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    console.log('🛑 Stopping all cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`  ✓ Stopped: ${name}`);
    });
    this.jobs = [];
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return this.jobs.map(({ name, schedule }) => ({
      name,
      schedule,
      running: true
    }));
  }
}

// Export singleton instance
const cronJobService = new CronJobService();
export default cronJobService;
