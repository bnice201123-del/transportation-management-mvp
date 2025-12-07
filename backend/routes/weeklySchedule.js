import express from 'express';
import WeeklySchedule from '../models/WeeklySchedule.js';
import TimeOffRequest from '../models/TimeOffRequest.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get weekly schedule for a user (with time-off integration)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { weekStart } = req.query;

    // Authorization check
    const isAuthorized = 
      req.user.userId === userId || 
      ['admin', 'dispatcher', 'scheduler'].some(role => 
        req.user.roles?.includes(role) || req.user.role === role
      );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this schedule' });
    }

    // Parse week start date or default to current week's Sunday
    let weekStartDate;
    if (weekStart) {
      weekStartDate = new Date(weekStart);
    } else {
      weekStartDate = new Date();
      const day = weekStartDate.getDay();
      weekStartDate.setDate(weekStartDate.getDate() - day); // Go to Sunday
    }
    weekStartDate.setHours(0, 0, 0, 0);

    // Get schedule with time-off integration
    const scheduleData = await WeeklySchedule.getScheduleWithTimeOff(userId, weekStartDate);

    if (!scheduleData) {
      return res.status(404).json({ message: 'No weekly schedule found for this user' });
    }

    res.json(scheduleData);
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update weekly schedule for a user (admin only)
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { schedule, isRecurring, effectiveDate, notes } = req.body;

    // Only admins, dispatchers, and schedulers can create/update schedules
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      req.user.roles?.includes(role) || req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to create/update schedules' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find existing schedule or create new one
    let weeklySchedule = await WeeklySchedule.findOne({ userId });

    if (weeklySchedule) {
      // Update existing schedule
      if (schedule) weeklySchedule.schedule = schedule;
      if (isRecurring !== undefined) weeklySchedule.isRecurring = isRecurring;
      if (effectiveDate) weeklySchedule.effectiveDate = effectiveDate;
      if (notes !== undefined) weeklySchedule.notes = notes;

      await weeklySchedule.save();

      await logActivity(
        userId,
        'weekly_schedule_updated',
        `Weekly schedule updated for ${user.name || user.email}`,
        { scheduleId: weeklySchedule._id, updatedBy: req.user.userId }
      );

      res.json({ message: 'Weekly schedule updated', schedule: weeklySchedule });
    } else {
      // Create new schedule
      weeklySchedule = new WeeklySchedule({
        userId,
        schedule: schedule || undefined, // Will use default if not provided
        isRecurring: isRecurring !== undefined ? isRecurring : true,
        effectiveDate: effectiveDate || Date.now(),
        notes
      });

      await weeklySchedule.save();

      await logActivity(
        userId,
        'weekly_schedule_created',
        `Weekly schedule created for ${user.name || user.email}`,
        { scheduleId: weeklySchedule._id, createdBy: req.user.userId }
      );

      res.status(201).json({ message: 'Weekly schedule created', schedule: weeklySchedule });
    }
  } catch (error) {
    console.error('Error creating/updating weekly schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update specific days in the schedule (admin only)
router.patch('/:userId/days', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { dayUpdates } = req.body; // Array of { dayOfWeek, isWorkDay, shiftStart, shiftEnd }

    // Only admins, dispatchers, and schedulers can update schedules
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      req.user.roles?.includes(role) || req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update schedules' });
    }

    const weeklySchedule = await WeeklySchedule.findOne({ userId });

    if (!weeklySchedule) {
      return res.status(404).json({ message: 'Weekly schedule not found' });
    }

    // Update each day specified
    dayUpdates.forEach(update => {
      const dayIndex = weeklySchedule.schedule.findIndex(d => d.dayOfWeek === update.dayOfWeek);
      if (dayIndex !== -1) {
        if (update.isWorkDay !== undefined) weeklySchedule.schedule[dayIndex].isWorkDay = update.isWorkDay;
        if (update.shiftStart !== undefined) weeklySchedule.schedule[dayIndex].shiftStart = update.shiftStart;
        if (update.shiftEnd !== undefined) weeklySchedule.schedule[dayIndex].shiftEnd = update.shiftEnd;
      }
    });

    await weeklySchedule.save();

    const user = await User.findById(userId);
    await logActivity(
      userId,
      'weekly_schedule_days_updated',
      `Schedule days updated for ${user?.name || user?.email}`,
      { scheduleId: weeklySchedule._id, updatedBy: req.user.userId, daysUpdated: dayUpdates.length }
    );

    res.json({ message: 'Schedule days updated', schedule: weeklySchedule });
  } catch (error) {
    console.error('Error updating schedule days:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete weekly schedule (admin only)
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Only admins can delete schedules
    const isAdmin = req.user.roles?.includes('admin') || req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete schedules' });
    }

    const weeklySchedule = await WeeklySchedule.findOneAndDelete({ userId });

    if (!weeklySchedule) {
      return res.status(404).json({ message: 'Weekly schedule not found' });
    }

    const user = await User.findById(userId);
    await logActivity(
      userId,
      'weekly_schedule_deleted',
      `Weekly schedule deleted for ${user?.name || user?.email}`,
      { deletedBy: req.user.userId }
    );

    res.json({ message: 'Weekly schedule deleted' });
  } catch (error) {
    console.error('Error deleting weekly schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users with their weekly schedules (admin only)
router.get('/all/schedules', authenticateToken, async (req, res) => {
  try {
    // Only admins, dispatchers, and schedulers can view all schedules
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      req.user.roles?.includes(role) || req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view all schedules' });
    }

    const schedules = await WeeklySchedule.find()
      .populate('userId', 'name email role')
      .sort({ 'userId.name': 1 });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching all weekly schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
