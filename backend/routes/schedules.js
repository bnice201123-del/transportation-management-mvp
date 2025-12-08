import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import Schedule from '../models/Schedule.js';
import TimeOff from '../models/TimeOff.js';
import User from '../models/User.js';
import VacationBalance from '../models/VacationBalance.js';

const router = express.Router();

// Get all schedules with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      driver,
      startDate,
      endDate,
      status,
      shiftType,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    
    if (driver) query.driver = driver;
    if (status) query.status = status;
    if (shiftType) query.shiftType = shiftType;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('driver', 'name email phoneNumber')
      .populate('vehicle', 'make model year licensePlate')
      .populate('createdBy', 'name')
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Schedule.countDocuments(query);

    res.json({
      schedules,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
  }
});

// Get driver's schedule
router.get('/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { driver: driverId };
    
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const schedules = await Schedule.find(query)
      .populate('vehicle', 'make model year licensePlate')
      .sort({ startTime: 1 });

    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching driver schedule:', error);
    res.status(500).json({ message: 'Failed to fetch driver schedule', error: error.message });
  }
});

// Get driver availability
router.get('/driver/:driverId/availability', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const schedules = await Schedule.getDriverAvailability(driverId, start, end);
    const timeOff = await TimeOff.find({
      driver: driverId,
      status: 'approved',
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    res.json({
      schedules,
      timeOff,
      isAvailable: schedules.length === 0 && timeOff.length === 0
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Failed to check availability', error: error.message });
  }
});

// Create schedule
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const schedule = new Schedule(scheduleData);

    // Check for conflicts
    const conflicts = await schedule.checkConflicts();
    if (conflicts.length > 0) {
      schedule.conflicts = conflicts;
    }

    await schedule.save();

    // If recurring, generate future shifts
    if (schedule.isRecurring && schedule.recurringPattern.endDate) {
      const recurringShifts = await schedule.generateRecurringShifts();
      if (recurringShifts.length > 0) {
        await Schedule.insertMany(recurringShifts);
      }
    }

    const populated = await Schedule.findById(schedule._id)
      .populate('driver', 'name email')
      .populate('vehicle', 'make model');

    res.status(201).json({
      schedule: populated,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      message: conflicts.length > 0 ? 'Schedule created with conflicts' : 'Schedule created successfully'
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
});

// Bulk create schedules
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schedules } = req.body;

    const schedulesWithCreator = schedules.map(s => ({
      ...s,
      createdBy: req.user.userId
    }));

    const created = await Schedule.insertMany(schedulesWithCreator);

    res.status(201).json({
      message: `${created.length} schedules created successfully`,
      schedules: created
    });
  } catch (error) {
    console.error('Error bulk creating schedules:', error);
    res.status(500).json({ message: 'Failed to bulk create schedules', error: error.message });
  }
});

// Update schedule
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      modifiedBy: req.user.userId,
      lastModified: new Date()
    };

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('driver', 'name email').populate('vehicle', 'make model');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check for conflicts after update
    const conflicts = await schedule.checkConflicts();
    if (conflicts.length > 0) {
      schedule.conflicts = conflicts;
      await schedule.save();
    }

    res.json({
      schedule,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Failed to update schedule', error: error.message });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
  }
});

// Clock in/out
router.post('/:id/clock-in', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.actualStartTime = new Date();
    schedule.status = 'in-progress';
    await schedule.save();

    res.json({ message: 'Clocked in successfully', schedule });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Failed to clock in', error: error.message });
  }
});

router.post('/:id/clock-out', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.actualEndTime = new Date();
    schedule.status = 'completed';
    await schedule.save();

    res.json({
      message: 'Clocked out successfully',
      schedule,
      totalHours: schedule.totalHours,
      overtimeHours: schedule.overtimeHours
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ message: 'Failed to clock out', error: error.message });
  }
});

// Record break
router.post('/:id/break', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, startTime, endTime } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const breakTime = {
      type: type || 'rest',
      actualStartTime: startTime ? new Date(startTime) : new Date(),
      actualEndTime: endTime ? new Date(endTime) : null,
      taken: !!endTime
    };

    if (breakTime.taken) {
      breakTime.duration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
    }

    schedule.breaks.push(breakTime);
    await schedule.save();

    res.json({ message: 'Break recorded successfully', schedule });
  } catch (error) {
    console.error('Error recording break:', error);
    res.status(500).json({ message: 'Failed to record break', error: error.message });
  }
});

// Find coverage gaps
router.get('/coverage-gaps', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, requiredDrivers = 1 } = req.query;

    const gaps = await Schedule.findCoverageGaps(
      new Date(startDate),
      new Date(endDate),
      parseInt(requiredDrivers)
    );

    res.json({ gaps });
  } catch (error) {
    console.error('Error finding coverage gaps:', error);
    res.status(500).json({ message: 'Failed to find coverage gaps', error: error.message });
  }
});

// Get overtime report
router.get('/overtime-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const overtimeSchedules = await Schedule.aggregate([
      {
        $match: {
          actualEndTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
          overtimeHours: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$driver',
          totalOvertimeHours: { $sum: '$overtimeHours' },
          totalShifts: { $sum: 1 },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      {
        $unwind: '$driverInfo'
      },
      {
        $project: {
          driver: {
            _id: '$driverInfo._id',
            name: '$driverInfo.name',
            email: '$driverInfo.email'
          },
          totalOvertimeHours: 1,
          totalShifts: 1,
          totalHours: 1
        }
      },
      {
        $sort: { totalOvertimeHours: -1 }
      }
    ]);

    res.json({ overtimeReport: overtimeSchedules });
  } catch (error) {
    console.error('Error generating overtime report:', error);
    res.status(500).json({ message: 'Failed to generate overtime report', error: error.message });
  }
});

// Check for conflicts (utility endpoint)
router.post('/check-conflicts', authenticateToken, async (req, res) => {
  try {
    const tempSchedule = new Schedule(req.body);
    const conflicts = await tempSchedule.checkConflicts();

    res.json({ conflicts, hasConflicts: conflicts.length > 0 });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ message: 'Failed to check conflicts', error: error.message });
  }
});

export default router;
