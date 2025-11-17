import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/activities
// @desc    Get all activity logs with optional filtering
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      action, 
      userId, 
      startDate, 
      endDate, 
      limit = 100,
      skip = 0 
    } = req.query;

    // Build query
    const query = {};
    
    if (action) {
      query.action = action;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Fetch activities with pagination
    const activities = await ActivityLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Get total count for pagination
    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      },
      activities // Add this for backward compatibility
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message,
      activities: [] // Fallback empty array
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get a single activity log by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await ActivityLog.findById(req.params.id)
      .populate('userId', 'firstName lastName email role');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity log',
      error: error.message
    });
  }
});

// @route   POST /api/activities
// @desc    Create a new activity log
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, description, metadata } = req.body;

    const activity = new ActivityLog({
      userId: req.user._id,
      action,
      description,
      metadata
    });

    await activity.save();

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity log created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity log',
      error: error.message
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity log (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete activity logs'
      });
    }

    const activity = await ActivityLog.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    res.json({
      success: true,
      message: 'Activity log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting activity log',
      error: error.message
    });
  }
});

// @route   GET /api/activities/user/:userId
// @desc    Get activities for a specific user
// @access  Private
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const activities = await ActivityLog.find({ userId: req.params.userId })
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ActivityLog.countDocuments({ userId: req.params.userId });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity logs',
      error: error.message
    });
  }
});

// @route   GET /api/activities/stats/summary
// @desc    Get activity statistics summary
// @access  Private/Admin
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view activity statistics'
      });
    }

    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [totalActivities, actionCounts, userActivity] = await Promise.all([
      ActivityLog.countDocuments(query),
      ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        byAction: actionCounts,
        topUsers: userActivity
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message
    });
  }
});

export default router;
