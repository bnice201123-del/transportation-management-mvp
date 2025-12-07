import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      limit = 50, 
      skip = 0, 
      unreadOnly = false,
      type 
    } = req.query;

    const notifications = await Notification.getUserNotifications(
      req.user.userId,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true',
        type: type || null
      }
    );

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      read: false
    });

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.userId);

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// Delete all read notifications
router.delete('/read/cleanup', authenticateToken, async (req, res) => {
  try {
    const { daysOld = 7 } = req.query;
    
    const result = await Notification.deleteOldReadNotifications(
      req.user.userId,
      parseInt(daysOld)
    );

    res.json({ 
      message: `Deleted old read notifications`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    res.status(500).json({ message: 'Error deleting notifications' });
  }
});

// Create a notification (typically called internally or by admins)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission (admin/dispatcher)
    const userRoles = req.user.roles || [req.user.role];
    const hasPermission = userRoles.some(role => 
      ['admin', 'dispatcher', 'scheduler'].includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const {
      userId,
      type,
      title,
      message,
      relatedData,
      priority
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, type, title, message' 
      });
    }

    const notification = await Notification.createNotification({
      userId,
      type,
      title,
      message,
      relatedData: relatedData || {},
      priority: priority || 'normal'
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

export default router;
