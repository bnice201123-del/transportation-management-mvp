import express from 'express';
import ApprovalQueue from '../models/ApprovalQueue.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/approvals/queue
 * Get pending approval requests for manager
 * Supports filtering and pagination
 */
router.get(
  '/queue',
  authenticateToken,
  requirePermission('approvals', 'read'),
  adminLimiter,
  async (req, res) => {
    try {
      const {
        status = 'pending',
        approvalType,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'date'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page));
      const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * pageSize;

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (approvalType) filters.approvalType = approvalType;
      if (priority) filters.priority = priority;

      // Determine sort
      let sortOption = { requestedAt: -1 };
      if (sortBy === 'priority') {
        sortOption = { priority: -1, requestedAt: -1 };
      } else if (sortBy === 'deadline') {
        sortOption = { responseDeadline: 1 };
      }

      // Execute query
      const approvals = await ApprovalQueue.find(filters)
        .populate('requestedBy', 'firstName lastName email role')
        .populate('tripId', 'tripId riderName scheduledTime scheduledDate assignedDriver vehicle status')
        .populate('tripId.assignedDriver', 'firstName lastName')
        .populate('tripId.vehicle', 'registrationNumber status')
        .populate('approvalAction.approvedBy', 'firstName lastName')
        .populate('approvalAction.rejectedBy', 'firstName lastName')
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .lean();

      // Count total
      const total = await ApprovalQueue.countDocuments(filters);
      const totalPages = Math.ceil(total / pageSize);

      // Add computed fields
      const enrichedApprovals = approvals.map(approval => ({
        ...approval,
        responseTime: approval.approvalAction?.approvedAt || approval.approvalAction?.rejectedAt
          ? Math.round((
              (approval.approvalAction.approvedAt || approval.approvalAction.rejectedAt) -
              approval.requestedAt
            ) / 1000 / 60)
          : null,
        isOverdue: approval.status === 'pending' && approval.responseDeadline < new Date(),
        minutesRemaining: approval.status === 'pending'
          ? Math.round((approval.responseDeadline - Date.now()) / 1000 / 60)
          : null
      }));

      res.json({
        data: enrichedApprovals,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      res.status(500).json({ message: 'Failed to fetch approvals', error: error.message });
    }
  }
);

/**
 * GET /api/approvals/:id
 * Get specific approval request details
 */
router.get(
  '/:id',
  authenticateToken,
  requirePermission('approvals', 'read'),
  async (req, res) => {
    try {
      const approval = await ApprovalQueue.findById(req.params.id)
        .populate('requestedBy', 'firstName lastName email role avatar')
        .populate('tripId')
        .populate('approvalAction.approvedBy', 'firstName lastName')
        .populate('approvalAction.rejectedBy', 'firstName lastName')
        .populate('approvalAction.appliedBy', 'firstName lastName')
        .populate('escalatedTo', 'firstName lastName');

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      res.json(approval);
    } catch (error) {
      console.error('Error fetching approval details:', error);
      res.status(500).json({ message: 'Failed to fetch approval', error: error.message });
    }
  }
);

/**
 * POST /api/approvals
 * Create new approval request
 */
router.post(
  '/',
  authenticateToken,
  adminLimiter,
  async (req, res) => {
    try {
      const {
        tripId,
        approvalType,
        justification,
        conflictDetails,
        priority = 'medium'
      } = req.body;

      // Validation
      if (!tripId || !approvalType || !justification) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['tripId', 'approvalType', 'justification']
        });
      }

      if (justification.length < 10) {
        return res.status(400).json({
          message: 'Justification must be at least 10 characters'
        });
      }

      // Verify trip exists
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      // Check for existing pending approval for same trip
      const existing = await ApprovalQueue.findOne({
        tripId,
        status: 'pending'
      });

      if (existing) {
        return res.status(409).json({
          message: 'Approval request already exists for this trip',
          existingId: existing._id
        });
      }

      // Create approval request
      const approval = await ApprovalQueue.createApprovalRequest(
        tripId,
        approvalType,
        req.user.id,
        justification,
        conflictDetails,
        priority
      );

      // Populate for response
      const populated = await approval.populate('requestedBy', 'firstName lastName email');

      res.status(201).json({
        message: 'Approval request created successfully',
        approval: populated
      });
    } catch (error) {
      console.error('Error creating approval:', error);
      res.status(500).json({ message: 'Failed to create approval', error: error.message });
    }
  }
);

/**
 * POST /api/approvals/:id/approve
 * Approve an approval request
 */
router.post(
  '/:id/approve',
  authenticateToken,
  requirePermission('approvals', 'approve'),
  adminLimiter,
  async (req, res) => {
    try {
      const { approvalNotes = '' } = req.body;
      const approval = await ApprovalQueue.findById(req.params.id);

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      // Approve the request
      await approval.approve(req.user.id, approvalNotes);

      // Log action
      console.log(`Approval ${approval._id} approved by ${req.user.id}`);

      res.json({
        message: 'Approval request approved successfully',
        approval
      });
    } catch (error) {
      console.error('Error approving request:', error);
      res.status(500).json({ message: 'Failed to approve request', error: error.message });
    }
  }
);

/**
 * POST /api/approvals/:id/reject
 * Reject an approval request
 */
router.post(
  '/:id/reject',
  authenticateToken,
  requirePermission('approvals', 'approve'),
  adminLimiter,
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return res.status(400).json({
          message: 'Rejection reason is required'
        });
      }

      const approval = await ApprovalQueue.findById(req.params.id);

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      // Reject the request
      await approval.reject(req.user.id, rejectionReason);

      console.log(`Approval ${approval._id} rejected by ${req.user.id}`);

      res.json({
        message: 'Approval request rejected successfully',
        approval
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({ message: 'Failed to reject request', error: error.message });
    }
  }
);

/**
 * POST /api/approvals/:id/withdraw
 * Withdraw an approval request (by requester)
 */
router.post(
  '/:id/withdraw',
  authenticateToken,
  adminLimiter,
  async (req, res) => {
    try {
      const { withdrawalReason = '' } = req.body;
      const approval = await ApprovalQueue.findById(req.params.id);

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      // Check if user is the requester or has admin permission
      if (
        approval.requestedBy.toString() !== req.user.id &&
        !req.user.permissions?.includes('approvals:manage')
      ) {
        return res.status(403).json({
          message: 'Only the requester or admin can withdraw this request'
        });
      }

      // Withdraw the request
      await approval.withdraw(req.user.id, withdrawalReason);

      res.json({
        message: 'Approval request withdrawn successfully',
        approval
      });
    } catch (error) {
      console.error('Error withdrawing request:', error);
      res.status(500).json({ message: 'Failed to withdraw request', error: error.message });
    }
  }
);

/**
 * POST /api/approvals/:id/escalate
 * Escalate approval to higher level manager
 */
router.post(
  '/:id/escalate',
  authenticateToken,
  requirePermission('approvals', 'escalate'),
  adminLimiter,
  async (req, res) => {
    try {
      const { escalatedTo } = req.body;

      if (!escalatedTo) {
        return res.status(400).json({
          message: 'Escalation target manager is required',
          field: 'escalatedTo'
        });
      }

      // Verify escalated-to user exists and is a manager
      const targetManager = await User.findById(escalatedTo);
      if (!targetManager || !['admin', 'dispatcher'].includes(targetManager.role)) {
        return res.status(400).json({
          message: 'Invalid escalation target user'
        });
      }

      const approval = await ApprovalQueue.findById(req.params.id);

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({
          message: `Cannot escalate - status is ${approval.status}`
        });
      }

      // Escalate
      await approval.escalate(req.user.id, escalatedTo);

      res.json({
        message: 'Approval request escalated successfully',
        approval
      });
    } catch (error) {
      console.error('Error escalating request:', error);
      res.status(500).json({ message: 'Failed to escalate request', error: error.message });
    }
  }
);

/**
 * GET /api/approvals/statistics
 * Get approval queue statistics
 */
router.get(
  '/stats',
  authenticateToken,
  requirePermission('approvals', 'read'),
  adminLimiter,
  async (req, res) => {
    try {
      const stats = await ApprovalQueue.getStatistics();

      // Additional metrics
      const byType = await ApprovalQueue.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$approvalType', count: { $sum: 1 } } }
      ]);

      const byPriority = await ApprovalQueue.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      res.json({
        ...stats,
        byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
        byPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count]))
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
  }
);

/**
 * DELETE /api/approvals/:id
 * Delete approval request (only if pending and user is requester/admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  adminLimiter,
  async (req, res) => {
    try {
      const approval = await ApprovalQueue.findById(req.params.id);

      if (!approval) {
        return res.status(404).json({ message: 'Approval request not found' });
      }

      // Only allow deletion if pending and user is requester or admin
      if (
        approval.status !== 'pending' ||
        (approval.requestedBy.toString() !== req.user.id &&
          !req.user.permissions?.includes('approvals:manage'))
      ) {
        return res.status(403).json({
          message: 'Cannot delete this approval request'
        });
      }

      await ApprovalQueue.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Approval request deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting approval:', error);
      res.status(500).json({ message: 'Failed to delete approval', error: error.message });
    }
  }
);

export default router;
