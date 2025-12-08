import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import ShiftSwap from '../models/ShiftSwap.js';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// Get all shift swap requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, driver } = req.query;

    const query = {};
    if (status) query.status = status;
    if (driver) {
      query.$or = [
        { requestingDriver: driver },
        { targetDriver: driver }
      ];
    }

    const swaps = await ShiftSwap.find(query)
      .populate('requestingDriver', 'name email phoneNumber')
      .populate('targetDriver', 'name email phoneNumber')
      .populate('originalShift')
      .populate('proposedShift')
      .sort({ createdAt: -1 });

    res.json({ swaps });
  } catch (error) {
    console.error('Error fetching shift swaps:', error);
    res.status(500).json({ message: 'Failed to fetch shift swaps', error: error.message });
  }
});

// Get open swap offers
router.get('/open-offers', authenticateToken, async (req, res) => {
  try {
    const offers = await ShiftSwap.findOpenOffers();
    res.json({ offers });
  } catch (error) {
    console.error('Error fetching open offers:', error);
    res.status(500).json({ message: 'Failed to fetch open offers', error: error.message });
  }
});

// Create shift swap request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const swapData = {
      ...req.body,
      requestingDriver: req.user.userId
    };

    const swap = new ShiftSwap(swapData);

    // Check for conflicts
    const conflicts = await swap.checkConflicts();
    if (conflicts.length > 0) {
      swap.conflicts = conflicts;
      
      const highSeverity = conflicts.filter(c => c.severity === 'high');
      if (highSeverity.length > 0) {
        return res.status(400).json({
          message: 'Cannot create swap request due to conflicts',
          conflicts
        });
      }
    }

    await swap.save();

    const populated = await ShiftSwap.findById(swap._id)
      .populate('requestingDriver', 'name email')
      .populate('targetDriver', 'name email')
      .populate('originalShift')
      .populate('proposedShift');

    res.status(201).json({
      swap: populated,
      message: 'Shift swap request created successfully'
    });
  } catch (error) {
    console.error('Error creating shift swap:', error);
    res.status(500).json({ message: 'Failed to create shift swap', error: error.message });
  }
});

// Driver response (accept/decline)
router.post('/:id/driver-response', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'accepted' or 'declined'

    const swap = await ShiftSwap.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Shift swap not found' });
    }

    // Verify this is the target driver
    if (swap.targetDriver && swap.targetDriver.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    swap.driverResponse = {
      status,
      timestamp: new Date(),
      notes
    };

    if (status === 'accepted') {
      swap.status = 'pending-admin';
    } else {
      swap.status = 'denied';
    }

    await swap.save();

    const populated = await ShiftSwap.findById(id)
      .populate('requestingDriver', 'name email')
      .populate('targetDriver', 'name email')
      .populate('originalShift')
      .populate('proposedShift');

    res.json({
      swap: populated,
      message: status === 'accepted' ? 'Swap request accepted, pending admin approval' : 'Swap request declined'
    });
  } catch (error) {
    console.error('Error responding to shift swap:', error);
    res.status(500).json({ message: 'Failed to respond to shift swap', error: error.message });
  }
});

// Admin approval/denial
router.post('/:id/admin-response', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'approved' or 'denied'

    const swap = await ShiftSwap.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Shift swap not found' });
    }

    swap.adminResponse = {
      status,
      respondedBy: req.user.userId,
      timestamp: new Date(),
      notes
    };

    swap.status = status;

    await swap.save();

    // If approved, process the swap
    if (status === 'approved') {
      const result = await swap.processSwap();
      return res.json({
        swap,
        message: 'Shift swap approved and processed',
        schedules: result
      });
    }

    res.json({
      swap,
      message: 'Shift swap denied'
    });
  } catch (error) {
    console.error('Error admin response to shift swap:', error);
    res.status(500).json({ message: 'Failed to process admin response', error: error.message });
  }
});

// Cancel swap request
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const swap = await ShiftSwap.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Shift swap not found' });
    }

    // Only requesting driver can cancel
    if (swap.requestingDriver.toString() !== req.user.userId && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    swap.status = 'cancelled';
    await swap.save();

    res.json({
      swap,
      message: 'Shift swap cancelled'
    });
  } catch (error) {
    console.error('Error cancelling shift swap:', error);
    res.status(500).json({ message: 'Failed to cancel shift swap', error: error.message });
  }
});

// Expire old requests (cron job endpoint)
router.post('/expire-old', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await ShiftSwap.expireOldRequests();
    
    res.json({
      message: `${result.modifiedCount} swap requests expired`,
      result
    });
  } catch (error) {
    console.error('Error expiring swap requests:', error);
    res.status(500).json({ message: 'Failed to expire swap requests', error: error.message });
  }
});

export default router;
