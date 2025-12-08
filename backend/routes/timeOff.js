import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import TimeOff from '../models/TimeOff.js';
import VacationBalance from '../models/VacationBalance.js';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// Get all time-off requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      driver,
      status,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};
    
    if (driver) query.driver = driver;
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const requests = await TimeOff.find(query)
      .populate('driver', 'name email phoneNumber')
      .populate('approvedBy', 'name')
      .populate('deniedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await TimeOff.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    res.status(500).json({ message: 'Failed to fetch time-off requests', error: error.message });
  }
});

// Get driver's time-off requests
router.get('/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const requests = await TimeOff.find({ driver: driverId })
      .populate('approvedBy', 'name')
      .populate('deniedBy', 'name')
      .sort({ createdAt: -1 });

    // Get vacation balance
    const balance = await VacationBalance.findOne({ driver: driverId, year: new Date().getFullYear() });

    res.json({ requests, vacationBalance: balance });
  } catch (error) {
    console.error('Error fetching driver time-off:', error);
    res.status(500).json({ message: 'Failed to fetch driver time-off', error: error.message });
  }
});

// Create time-off request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      driver: req.body.driver || req.user.userId
    };

    const request = new TimeOff(requestData);

    // Check for conflicts
    const conflicts = await request.checkConflicts();
    if (conflicts.length > 0) {
      request.conflicts = conflicts;
      
      // If high severity conflicts, return error
      const highSeverity = conflicts.filter(c => c.severity === 'high');
      if (highSeverity.length > 0) {
        return res.status(400).json({
          message: 'Cannot create time-off request due to conflicts',
          conflicts
        });
      }
    }

    await request.save();

    // Update pending balance if vacation
    if (request.type === 'vacation') {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.addPending(request.totalDays);
      }
    }

    // Suggest coverage if needed
    if (request.coverageNeeded) {
      const suggestions = await request.suggestCoverage();
      request.coverageSuggestions = suggestions;
      await request.save();
    }

    const populated = await TimeOff.findById(request._id)
      .populate('driver', 'name email')
      .populate('coverageSuggestions.driver', 'name email phoneNumber');

    res.status(201).json({
      request: populated,
      message: 'Time-off request created successfully'
    });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    res.status(500).json({ message: 'Failed to create time-off request', error: error.message });
  }
});

// Approve time-off request
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const request = await TimeOff.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    request.status = 'approved';
    request.approvedBy = req.user.userId;
    request.approvedAt = new Date();
    if (notes) request.notes = notes;

    await request.save();

    // Update vacation balance
    if (request.type === 'vacation') {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.removePending(request.totalDays);
        await balance.useVacationDays(request.totalDays, request._id);
      }
    } else if (request.type === 'sick') {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.useSickDays(request.totalDays, request._id);
      }
    }

    // Cancel conflicting schedules
    await Schedule.updateMany(
      {
        driver: request.driver,
        status: { $in: ['scheduled', 'confirmed'] },
        startTime: { $lt: request.endDate },
        endTime: { $gt: request.startDate }
      },
      {
        $set: { status: 'cancelled', notes: 'Cancelled due to approved time-off' }
      }
    );

    const populated = await TimeOff.findById(id)
      .populate('driver', 'name email')
      .populate('approvedBy', 'name');

    res.json({
      request: populated,
      message: 'Time-off request approved successfully'
    });
  } catch (error) {
    console.error('Error approving time-off request:', error);
    res.status(500).json({ message: 'Failed to approve time-off request', error: error.message });
  }
});

// Deny time-off request
router.post('/:id/deny', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await TimeOff.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be denied' });
    }

    request.status = 'denied';
    request.deniedBy = req.user.userId;
    request.deniedAt = new Date();
    request.denialReason = reason;

    await request.save();

    // Remove from pending balance
    if (request.type === 'vacation') {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.removePending(request.totalDays);
      }
    }

    const populated = await TimeOff.findById(id)
      .populate('driver', 'name email')
      .populate('deniedBy', 'name');

    res.json({
      request: populated,
      message: 'Time-off request denied'
    });
  } catch (error) {
    console.error('Error denying time-off request:', error);
    res.status(500).json({ message: 'Failed to deny time-off request', error: error.message });
  }
});

// Cancel time-off request
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await TimeOff.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }

    // Only driver who created it or admin can cancel
    if (request.driver.toString() !== req.user.userId && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    const previousStatus = request.status;
    request.status = 'cancelled';
    await request.save();

    // Refund vacation days if it was approved
    if (previousStatus === 'approved') {
      if (request.type === 'vacation') {
        const balance = await VacationBalance.findOne({
          driver: request.driver,
          year: new Date(request.startDate).getFullYear()
        });
        
        if (balance) {
          balance.used = Math.max(0, balance.used - request.totalDays);
          balance.history.push({
            date: new Date(),
            type: 'adjusted',
            amount: request.totalDays,
            reason: 'Time-off request cancelled',
            relatedRequest: request._id
          });
          await balance.save();
        }
      }
    } else if (previousStatus === 'pending') {
      // Remove from pending
      if (request.type === 'vacation') {
        const balance = await VacationBalance.findOne({
          driver: request.driver,
          year: new Date(request.startDate).getFullYear()
        });
        
        if (balance) {
          await balance.removePending(request.totalDays);
        }
      }
    }

    res.json({
      request,
      message: 'Time-off request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling time-off request:', error);
    res.status(500).json({ message: 'Failed to cancel time-off request', error: error.message });
  }
});

// Bulk approve
router.post('/bulk-approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestIds } = req.body;

    const result = await TimeOff.bulkApprove(requestIds, req.user.userId);

    // Update balances for approved vacation requests
    const approvedRequests = await TimeOff.find({ _id: { $in: requestIds }, type: 'vacation' });
    
    for (const request of approvedRequests) {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.removePending(request.totalDays);
        await balance.useVacationDays(request.totalDays, request._id);
      }
    }

    res.json({
      message: `${result.modifiedCount} requests approved`,
      result
    });
  } catch (error) {
    console.error('Error bulk approving:', error);
    res.status(500).json({ message: 'Failed to bulk approve', error: error.message });
  }
});

// Bulk deny
router.post('/bulk-deny', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestIds, reason } = req.body;

    const result = await TimeOff.bulkDeny(requestIds, req.user.userId, reason);

    // Remove from pending balances
    const deniedRequests = await TimeOff.find({ _id: { $in: requestIds }, type: 'vacation' });
    
    for (const request of deniedRequests) {
      const balance = await VacationBalance.findOne({
        driver: request.driver,
        year: new Date(request.startDate).getFullYear()
      });
      
      if (balance) {
        await balance.removePending(request.totalDays);
      }
    }

    res.json({
      message: `${result.modifiedCount} requests denied`,
      result
    });
  } catch (error) {
    console.error('Error bulk denying:', error);
    res.status(500).json({ message: 'Failed to bulk deny', error: error.message });
  }
});

// Check conflicts
router.post('/check-conflicts', authenticateToken, async (req, res) => {
  try {
    const tempRequest = new TimeOff(req.body);
    const conflicts = await tempRequest.checkConflicts();

    res.json({ conflicts, hasConflicts: conflicts.length > 0 });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ message: 'Failed to check conflicts', error: error.message });
  }
});

// Get coverage suggestions
router.get('/:id/coverage-suggestions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await TimeOff.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Time-off request not found' });
    }

    const suggestions = await request.suggestCoverage();

    const populated = suggestions.map(s => ({
      ...s,
      driver: s.driver
    }));

    const fullSuggestions = await TimeOff.populate(populated, {
      path: 'driver',
      select: 'name email phoneNumber'
    });

    res.json({ suggestions: fullSuggestions });
  } catch (error) {
    console.error('Error getting coverage suggestions:', error);
    res.status(500).json({ message: 'Failed to get coverage suggestions', error: error.message });
  }
});

export default router;
