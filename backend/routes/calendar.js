import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import googleCalendarService from '../services/googleCalendarService.js';
import outlookCalendarService from '../services/outlookCalendarService.js';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// ==================== Google Calendar ====================

/**
 * @route   GET /api/calendar/google/auth
 * @desc    Get Google Calendar OAuth URL
 * @access  Private
 */
router.get('/google/auth', authenticateToken, (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl(req.user.userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

/**
 * @route   GET /api/calendar/google/callback
 * @desc    Google Calendar OAuth callback
 * @access  Public
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).send('Missing authorization code or user ID');
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code);
    
    // Save tokens to user account
    await googleCalendarService.saveUserTokens(userId, tokens);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=google&status=success`);
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=google&status=error`);
  }
});

/**
 * @route   POST /api/calendar/google/sync
 * @desc    Sync schedules to Google Calendar
 * @access  Private
 */
router.post('/google/sync', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Get user's schedules
    const query = { driver: req.user.userId };
    if (startDate) query.startTime = { $gte: new Date(startDate) };
    if (endDate) query.endTime = { $lte: new Date(endDate) };

    const schedules = await Schedule.find(query)
      .populate('vehicle')
      .sort({ startTime: 1 });

    // Sync to Google Calendar
    const results = await googleCalendarService.syncSchedules(req.user.userId, schedules);

    res.json({
      message: 'Sync completed',
      results
    });
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    res.status(500).json({ message: error.message || 'Failed to sync schedules' });
  }
});

/**
 * @route   POST /api/calendar/google/disconnect
 * @desc    Disconnect Google Calendar
 * @access  Private
 */
router.post('/google/disconnect', authenticateToken, async (req, res) => {
  try {
    await googleCalendarService.disconnect(req.user.userId);
    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: 'Failed to disconnect calendar' });
  }
});

// ==================== Outlook Calendar ====================

/**
 * @route   GET /api/calendar/outlook/auth
 * @desc    Get Outlook Calendar OAuth URL
 * @access  Private
 */
router.get('/outlook/auth', authenticateToken, (req, res) => {
  try {
    const authUrl = outlookCalendarService.getAuthUrl(req.user.userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

/**
 * @route   GET /api/calendar/outlook/callback
 * @desc    Outlook Calendar OAuth callback
 * @access  Public
 */
router.get('/outlook/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).send('Missing authorization code or user ID');
    }

    // Exchange code for tokens
    const tokens = await outlookCalendarService.getTokensFromCode(code);
    
    // Save tokens to user account
    await outlookCalendarService.saveUserTokens(userId, tokens);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=outlook&status=success`);
  } catch (error) {
    console.error('Error in Outlook Calendar callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar=outlook&status=error`);
  }
});

/**
 * @route   POST /api/calendar/outlook/sync
 * @desc    Sync schedules to Outlook Calendar
 * @access  Private
 */
router.post('/outlook/sync', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Get user's schedules
    const query = { driver: req.user.userId };
    if (startDate) query.startTime = { $gte: new Date(startDate) };
    if (endDate) query.endTime = { $lte: new Date(endDate) };

    const schedules = await Schedule.find(query)
      .populate('vehicle')
      .sort({ startTime: 1 });

    // Sync to Outlook Calendar
    const results = await outlookCalendarService.syncSchedules(req.user.userId, schedules);

    res.json({
      message: 'Sync completed',
      results
    });
  } catch (error) {
    console.error('Error syncing to Outlook Calendar:', error);
    res.status(500).json({ message: error.message || 'Failed to sync schedules' });
  }
});

/**
 * @route   POST /api/calendar/outlook/disconnect
 * @desc    Disconnect Outlook Calendar
 * @access  Private
 */
router.post('/outlook/disconnect', authenticateToken, async (req, res) => {
  try {
    await outlookCalendarService.disconnect(req.user.userId);
    res.json({ message: 'Outlook Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Outlook Calendar:', error);
    res.status(500).json({ message: 'Failed to disconnect calendar' });
  }
});

export default router;
