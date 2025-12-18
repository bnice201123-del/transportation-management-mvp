import express from 'express';
import { authenticateToken, requireAdmin, requirePermission } from '../middleware/auth.js';
import Schedule from '../models/Schedule.js';
import ShiftSwap from '../models/ShiftSwap.js';
import TimeOff from '../models/TimeOff.js';
import User from '../models/User.js';
import VacationBalance from '../models/VacationBalance.js';
import ScheduleConflictService from '../services/scheduleConflictService.js';

const router = express.Router();

/**
 * =====================
 * SCHEDULE ENDPOINTS
 * =====================
 */

// Get driver's schedule for date range
router.get('/driver/:driverId/range', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const query = {
      driver: driverId,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (status) {
      query.status = status;
    }

    const schedules = await Schedule.find(query)
      .populate('driver', 'firstName lastName email')
      .populate('vehicle', 'make model licensePlate')
      .sort({ startTime: 1 });

    res.json({
      count: schedules.length,
      schedules
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for conflicts when creating/updating schedule
router.post('/check-conflicts', authenticateToken, async (req, res) => {
  try {
    const { driverId, startTime, duration, shiftId } = req.body;

    if (!driverId || !startTime) {
      return res.status(400).json({ error: 'driverId and startTime are required' });
    }

    // Create temporary shift object for conflict checking
    const tempShift = {
      _id: shiftId || null,
      driver: driverId,
      startTime: new Date(startTime),
      duration: duration || 8
    };

    const conflictReport = await ScheduleConflictService.checkAllConflicts(driverId, tempShift);

    // Get alternative drivers if there are conflicts
    if (conflictReport.hasConflicts) {
      const alternatives = await ScheduleConflictService.findAlternativeDrivers(driverId, tempShift);
      conflictReport.suggestedAlternativeDrivers = alternatives;
    }

    res.json(conflictReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots for a driver on a specific date
router.get('/driver/:driverId/available-slots', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { date, duration = 480 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const availableSlots = await ScheduleConflictService.getAvailableTimeSlots(
      driverId,
      new Date(date),
      parseInt(duration)
    );

    res.json({
      date,
      availableSlots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =====================
 * SHIFT SWAP ENDPOINTS
 * =====================
 */

// Create shift swap request
router.post('/swap-request', authenticateToken, async (req, res) => {
  try {
    const { requestingDriverId, targetDriverId, originalShiftId, proposedShiftId, reason, swapType = 'one-way' } = req.body;

    if (!requestingDriverId || !originalShiftId) {
      return res.status(400).json({ error: 'requestingDriverId and originalShiftId are required' });
    }

    // Verify shifts exist and belong to correct drivers
    const originalShift = await Schedule.findById(originalShiftId);
    if (!originalShift || originalShift.driver.toString() !== requestingDriverId) {
      return res.status(400).json({ error: 'Original shift not found or does not belong to requesting driver' });
    }

    let proposedShift = null;
    if (proposedShiftId) {
      proposedShift = await Schedule.findById(proposedShiftId);
      if (!proposedShift || proposedShift.driver.toString() !== targetDriverId) {
        return res.status(400).json({ error: 'Proposed shift not found or does not belong to target driver' });
      }
    }

    // Create swap request
    const swapRequest = new ShiftSwap({
      requestingDriver: requestingDriverId,
      targetDriver: targetDriverId,
      originalShift: originalShiftId,
      proposedShift: proposedShiftId,
      swapType,
      reason,
      status: 'pending-driver'
    });

    await swapRequest.save();

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('shift_swap_requested', 'shift_swap', swapRequest._id.toString(), {
    //   requestingDriver: requestingDriverId,
    //   targetDriver: targetDriverId,
    //   originalShift: originalShiftId
    // }, 'info');

    res.status(201).json(swapRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to shift swap request (driver response)
router.patch('/swap-request/:swapId/driver-response', authenticateToken, async (req, res) => {
  try {
    const { swapId } = req.params;
    const { status, notes } = req.body; // status: 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted or declined' });
    }

    const swapRequest = await ShiftSwap.findById(swapId);
    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    swapRequest.driverResponse = {
      status,
      timestamp: new Date(),
      notes
    };

    // If driver accepted, move to pending admin approval
    if (status === 'accepted') {
      swapRequest.status = 'pending-admin';
    } else {
      // If driver declined, cancel the request
      swapRequest.status = 'cancelled';
    }

    await swapRequest.save();

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('shift_swap_driver_response', 'shift_swap', swapId, {
    //   driverResponse: status
    // }, status === 'declined' ? 'warning' : 'info');

    res.json(swapRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/deny shift swap request (admin response)
router.patch('/swap-request/:swapId/admin-response', authenticateToken, requirePermission('shift_swap', 'approve'), async (req, res) => {
  try {
    const { swapId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'denied'
    const adminId = req.user.id;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }

    const swapRequest = await ShiftSwap.findById(swapId).populate('originalShift').populate('proposedShift');
    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    // Check conflicts if approving
    if (status === 'approved') {
      // Verify that swapping would not create new conflicts
      const conflictsForTarget = await ScheduleConflictService.checkAllConflicts(
        swapRequest.targetDriver,
        swapRequest.originalShift
      );

      if (conflictsForTarget.hasConflicts) {
        return res.status(400).json({ 
          error: 'Cannot approve: Target driver would have scheduling conflicts',
          conflicts: conflictsForTarget
        });
      }

      // Swap the shifts
      const originalDriver = swapRequest.originalShift.driver;
      const targetDriver = swapRequest.targetDriver;

      swapRequest.originalShift.driver = targetDriver;
      await swapRequest.originalShift.save();

      if (swapRequest.proposedShift) {
        swapRequest.proposedShift.driver = originalDriver;
        await swapRequest.proposedShift.save();
      }
    }

    swapRequest.adminResponse = {
      status,
      respondedBy: adminId,
      respondedAt: new Date(),
      notes
    };
    swapRequest.status = status === 'approved' ? 'approved' : 'denied';

    await swapRequest.save();

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('shift_swap_admin_response', 'shift_swap', swapId, {
    //   adminResponse: status,
    //   respondedBy: adminId
    // }, 'info');

    res.json(swapRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shift swap requests for a driver
router.get('/swap-requests/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, type = 'all' } = req.query; // type: 'sent', 'received', 'all'

    const query = {};

    if (type === 'sent' || type === 'all') {
      // Requests sent by this driver
      if (status) {
        query.$or = [
          { requestingDriver: driverId, status }
        ];
      } else {
        query.requestingDriver = driverId;
      }
    } else if (type === 'received') {
      // Requests received by this driver
      if (status) {
        query.targetDriver = driverId;
        query.status = status;
      } else {
        query.targetDriver = driverId;
      }
    }

    const swapRequests = await ShiftSwap.find(query)
      .populate('requestingDriver', 'firstName lastName email')
      .populate('targetDriver', 'firstName lastName email')
      .populate('originalShift')
      .populate('proposedShift')
      .sort({ createdAt: -1 });

    res.json(swapRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =====================
 * TIME-OFF ENDPOINTS
 * =====================
 */

// Request time off
router.post('/time-off/request', authenticateToken, async (req, res) => {
  try {
    const { driverId, type, startDate, endDate, reason } = req.body;

    if (!driverId || !type || !startDate || !endDate) {
      return res.status(400).json({ error: 'driverId, type, startDate, and endDate are required' });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check vacation balance for vacation requests
    if (type === 'vacation') {
      const balance = await VacationBalance.findOne({ driver: driverId });
      if (balance && balance.available < totalDays) {
        return res.status(400).json({ 
          error: `Insufficient vacation balance. Available: ${balance.available}, Requested: ${totalDays}`
        });
      }
    }

    // Check for conflicts with existing schedules
    const conflicts = [];
    const existingSchedules = await Schedule.find({
      driver: driverId,
      startTime: {
        $gte: start,
        $lte: end
      },
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (existingSchedules.length > 0) {
      conflicts.push({
        type: 'schedule_conflict',
        description: `${existingSchedules.length} scheduled shift(s) during this period`,
        count: existingSchedules.length
      });
    }

    // Create time-off request
    const timeOff = new TimeOff({
      driver: driverId,
      type,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'pending',
      conflicts: conflicts.length > 0 ? conflicts : undefined
    });

    await timeOff.save();

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('time_off_requested', 'time_off', timeOff._id.toString(), {
    //   type,
    //   totalDays,
    //   hasConflicts: conflicts.length > 0
    // }, 'info');

    res.status(201).json(timeOff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/deny time-off request
router.patch('/time-off/:timeOffId/respond', authenticateToken, requirePermission('time_off', 'approve'), async (req, res) => {
  try {
    const { timeOffId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'denied'
    const approverId = req.user.id;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or denied' });
    }

    const timeOff = await TimeOff.findById(timeOffId);
    if (!timeOff) {
      return res.status(404).json({ error: 'Time-off request not found' });
    }

    if (status === 'approved') {
      timeOff.status = 'approved';
      timeOff.approvedBy = approverId;
      timeOff.approvedAt = new Date();

      // Deduct from vacation balance if it's a vacation request
      if (timeOff.type === 'vacation') {
        const balance = await VacationBalance.findOne({ driver: timeOff.driver });
        if (balance) {
          balance.used += timeOff.totalDays;
          balance.available -= timeOff.totalDays;
          await balance.save();
        }
      }
    } else {
      timeOff.status = 'denied';
      timeOff.deniedBy = approverId;
      timeOff.deniedAt = new Date();
      timeOff.denialReason = notes;
    }

    await timeOff.save();

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('time_off_response', 'time_off', timeOffId, {
    //   status,
    //   respondedBy: approverId
    // }, status === 'denied' ? 'warning' : 'info');

    res.json(timeOff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver's vacation balance
router.get('/vacation-balance/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    let balance = await VacationBalance.findOne({ driver: driverId });

    if (!balance) {
      // Create default balance (20 days per year)
      balance = new VacationBalance({
        driver: driverId,
        total: 20,
        used: 0,
        available: 20,
        year: new Date().getFullYear()
      });
      await balance.save();
    }

    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =====================
 * NOTIFICATION ENDPOINTS
 * =====================
 */

// Send shift reminders (email/SMS)
router.post('/send-shift-reminders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { hoursBeforeShift = 24, sendEmail = true, sendSMS = false } = req.body;
    const notificationService = new (await import('../services/notificationService.js')).default();

    const now = new Date();
    const reminderTime = new Date(now.getTime() + hoursBeforeShift * 60 * 60 * 1000);

    // Find schedules that are coming up and haven't been reminded yet
    const upcomingShifts = await Schedule.find({
      startTime: {
        $gte: now,
        $lte: reminderTime
      },
      status: 'scheduled',
      reminderSent: false
    }).populate('driver');

    let sentCount = 0;
    const results = [];

    for (const shift of upcomingShifts) {
      try {
        const driver = shift.driver;
        if (!driver) continue;

        // Send reminder via notification service
        const result = await notificationService.sendShiftReminder(driver, shift, hoursBeforeShift);

        // Mark shift as reminded
        shift.reminderSent = true;
        await shift.save();

        results.push({
          shiftId: shift._id,
          driverId: driver._id,
          driverName: driver.firstName + ' ' + driver.lastName,
          driverEmail: driver.email,
          driverPhone: driver.phoneNumber,
          shiftTime: shift.startTime,
          notificationResult: result,
          sent: true
        });

        sentCount++;
      } catch (err) {
        results.push({
          shiftId: shift._id,
          sent: false,
          error: err.message
        });
      }
    }

    // Log audit action
    // TODO: Implement proper audit logging
    // await logAuditAction('shift_reminders_sent', 'shift', null, {
    //   count: sentCount,
    //   hoursBeforeShift,
    //   sendEmail,
    //   sendSMS
    // }, 'info');

    res.json({
      sentCount,
      failedCount: upcomingShifts.length - sentCount,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =====================
 * ADDITIONAL ENDPOINTS
 * =====================
 */

// Get time-off requests for a driver
router.get('/time-off/driver/:driverId/requests', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const requests = await TimeOff.find({ driver: driverId })
      .populate('driver', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending time-off requests (manager view)
router.get('/time-off/requests/pending', authenticateToken, requirePermission('time_off', 'view'), async (req, res) => {
  try {
    const requests = await TimeOff.find({ status: 'pending' })
      .populate('driver', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all swap requests (manager view)
router.get('/swap-requests/all', authenticateToken, requirePermission('shift_swap', 'view'), async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await ShiftSwap.find(query)
      .populate('requestingDriver', 'firstName lastName email')
      .populate('targetDriver', 'firstName lastName email')
      .populate('originalShift')
      .populate('proposedShift')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
