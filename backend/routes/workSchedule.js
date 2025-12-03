import express from 'express';
import WorkSchedule from '../models/WorkSchedule.js';
import TimeOffRequest from '../models/TimeOffRequest.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get work schedule summary for a user
router.get('/:userId/summary', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user exists
    const user = await User.findById(userId).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Authorization: Users can view their own schedule, admins/dispatchers can view all
    const isAuthorized = 
      req.user.userId === userId || 
      ['admin', 'dispatcher', 'scheduler'].some(role => 
        Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
      );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this schedule' });
    }

    // Default to current pay period (bi-weekly, starting from a reference date)
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const summary = await WorkSchedule.getWorkSummary(userId, start, end);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      period: {
        startDate: start,
        endDate: end
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching work schedule summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed work schedule records
router.get('/:userId/records', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Authorization check
    const isAuthorized = 
      req.user.userId === userId || 
      ['admin', 'dispatcher', 'scheduler'].some(role => 
        Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
      );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this schedule' });
    }

    const query = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (status) {
      query.status = status;
    }

    const records = await WorkSchedule.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json(records);
  } catch (error) {
    console.error('Error fetching work schedule records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update work schedule record
router.post('/:userId/records', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, clockIn, clockOut, status, tripsCompleted, earnings, notes } = req.body;

    // Only admins, dispatchers, and schedulers can create/update records
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to modify schedule records' });
    }

    // Check if record exists for this date
    const existingRecord = await WorkSchedule.findOne({ userId, date: new Date(date) });

    if (existingRecord) {
      // Update existing record
      if (clockIn) existingRecord.clockIn = new Date(clockIn);
      if (clockOut) existingRecord.clockOut = new Date(clockOut);
      if (status) existingRecord.status = status;
      if (tripsCompleted !== undefined) existingRecord.tripsCompleted = tripsCompleted;
      if (earnings !== undefined) existingRecord.earnings = earnings;
      if (notes) existingRecord.notes = notes;

      await existingRecord.save();

      await logActivity(
        userId,
        'work_schedule_updated',
        `Work schedule updated for ${date}`,
        { recordId: existingRecord._id, updatedBy: req.user.userId }
      );

      res.json({ message: 'Work schedule updated', record: existingRecord });
    } else {
      // Create new record
      const newRecord = new WorkSchedule({
        userId,
        date: new Date(date),
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        status: status || 'scheduled',
        tripsCompleted: tripsCompleted || 0,
        earnings: earnings || 0,
        notes
      });

      await newRecord.save();

      await logActivity(
        userId,
        'work_schedule_created',
        `Work schedule created for ${date}`,
        { recordId: newRecord._id, createdBy: req.user.userId }
      );

      res.status(201).json({ message: 'Work schedule created', record: newRecord });
    }
  } catch (error) {
    console.error('Error creating/updating work schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get time-off requests for a user
router.get('/:userId/time-off', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Authorization check
    const isAuthorized = 
      req.user.userId === userId || 
      ['admin', 'dispatcher', 'scheduler'].some(role => 
        Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
      );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view time-off requests' });
    }

    const query = { userId };
    if (status) query.status = status;

    const requests = await TimeOffRequest.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create time-off request
router.post('/:userId/time-off', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Authorization: Users can only request for themselves
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Can only request time off for yourself' });
    }

    // Check for overlapping approved requests
    const hasOverlap = await TimeOffRequest.hasOverlap(userId, start, end);
    if (hasOverlap) {
      return res.status(400).json({ 
        message: 'This date range overlaps with an existing approved time-off request' 
      });
    }

    const timeOffRequest = new TimeOffRequest({
      userId,
      startDate: start,
      endDate: end,
      reason: reason || ''
    });

    await timeOffRequest.save();

    await logActivity(
      userId,
      'time_off_requested',
      `Time off requested from ${start.toDateString()} to ${end.toDateString()}`,
      { requestId: timeOffRequest._id }
    );

    // Populate user info for response
    await timeOffRequest.populate('userId', 'name email');

    res.status(201).json({ 
      message: 'Time-off request submitted successfully', 
      request: timeOffRequest 
    });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update time-off request (approve/deny)
router.patch('/time-off/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewNotes } = req.body;

    // Only admins, dispatchers, and schedulers can review requests
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to review time-off requests' });
    }

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "denied"' });
    }

    const request = await TimeOffRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    request.status = status;
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes || '';

    await request.save();

    // If approved, update work schedule records for those dates
    if (status === 'approved') {
      const currentDate = new Date(request.startDate);
      while (currentDate <= request.endDate) {
        await WorkSchedule.findOneAndUpdate(
          { userId: request.userId, date: currentDate },
          { 
            status: 'time-off',
            notes: `Approved time off: ${request.reason}`
          },
          { upsert: true, new: true }
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    await logActivity(
      request.userId,
      'time_off_reviewed',
      `Time off request ${status}`,
      { requestId: request._id, reviewedBy: req.user.userId }
    );

    await request.populate('userId', 'name email');
    await request.populate('reviewedBy', 'name email');

    res.json({ message: `Request ${status}`, request });
  } catch (error) {
    console.error('Error updating time-off request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending time-off requests (for admin/dispatcher dashboard)
router.get('/time-off/pending', authenticateToken, async (req, res) => {
  try {
    // Only admins, dispatchers, and schedulers can view all pending requests
    const isAuthorized = ['admin', 'dispatcher', 'scheduler'].some(role => 
      Array.isArray(req.user.roles) ? req.user.roles.includes(role) : req.user.role === role
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view pending requests' });
    }

    const requests = await TimeOffRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .sort({ requestedAt: 1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending time-off requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
