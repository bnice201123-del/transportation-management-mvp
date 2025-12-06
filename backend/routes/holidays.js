import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  getUSFederalHolidays, 
  getHolidaysInRange, 
  getNextHoliday,
  isUSFederalHoliday 
} from '../utils/holidays.js';
import { HOLIDAY_SETTINGS } from '../config/systemConfig.js';

const router = express.Router();

/**
 * @route   GET /api/holidays/federal/:year
 * @desc    Get US Federal holidays for a specific year
 * @access  Private
 */
router.get('/federal/:year', authenticateToken, (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'Invalid year' });
    }
    
    const holidays = getUSFederalHolidays(year);
    
    // Convert to array format
    const holidayArray = Object.entries(holidays).map(([name, date]) => ({
      name: name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
      key: name,
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    }));
    
    res.json({
      year,
      holidays: holidayArray,
      count: holidayArray.length
    });
  } catch (error) {
    console.error('Error fetching federal holidays:', error);
    res.status(500).json({ message: 'Server error fetching holidays' });
  }
});

/**
 * @route   GET /api/holidays/range
 * @desc    Get all holidays in a date range
 * @access  Private
 */
router.get('/range', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const holidays = getHolidaysInRange(start, end, HOLIDAY_SETTINGS.customHolidays);
    
    res.json({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      holidays: holidays.map(h => ({
        ...h,
        date: h.date.toISOString().split('T')[0],
        dayOfWeek: h.date.toLocaleDateString('en-US', { weekday: 'long' })
      })),
      count: holidays.length
    });
  } catch (error) {
    console.error('Error fetching holidays in range:', error);
    res.status(500).json({ message: 'Server error fetching holidays' });
  }
});

/**
 * @route   GET /api/holidays/next
 * @desc    Get the next upcoming holiday
 * @access  Private
 */
router.get('/next', authenticateToken, (req, res) => {
  try {
    const fromDate = req.query.from ? new Date(req.query.from) : new Date();
    
    if (isNaN(fromDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const nextHoliday = getNextHoliday(fromDate, HOLIDAY_SETTINGS.customHolidays);
    
    if (!nextHoliday) {
      return res.json({ message: 'No upcoming holidays found' });
    }
    
    res.json({
      holiday: {
        ...nextHoliday,
        date: nextHoliday.date.toISOString().split('T')[0],
        dayOfWeek: nextHoliday.date.toLocaleDateString('en-US', { weekday: 'long' })
      },
      daysUntil: Math.ceil((nextHoliday.date - fromDate) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    console.error('Error fetching next holiday:', error);
    res.status(500).json({ message: 'Server error fetching next holiday' });
  }
});

/**
 * @route   GET /api/holidays/check/:date
 * @desc    Check if a specific date is a holiday
 * @access  Private
 */
router.get('/check/:date', authenticateToken, (req, res) => {
  try {
    const date = new Date(req.params.date);
    
    if (isNaN(date)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const isHoliday = isUSFederalHoliday(date, HOLIDAY_SETTINGS.customHolidays);
    
    // Find which holiday it is if true
    let holidayName = null;
    if (isHoliday) {
      const year = date.getFullYear();
      const federalHolidays = getUSFederalHolidays(year);
      
      for (const [name, holidayDate] of Object.entries(federalHolidays)) {
        if (holidayDate.toISOString().split('T')[0] === date.toISOString().split('T')[0]) {
          holidayName = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
          break;
        }
      }
      
      // Check custom holidays
      if (!holidayName && HOLIDAY_SETTINGS.customHolidays) {
        const customHoliday = HOLIDAY_SETTINGS.customHolidays.find(h => 
          new Date(h.date).toISOString().split('T')[0] === date.toISOString().split('T')[0]
        );
        if (customHoliday) {
          holidayName = customHoliday.name;
        }
      }
    }
    
    res.json({
      date: date.toISOString().split('T')[0],
      isHoliday,
      holidayName,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
    });
  } catch (error) {
    console.error('Error checking holiday:', error);
    res.status(500).json({ message: 'Server error checking holiday' });
  }
});

/**
 * @route   GET /api/holidays/custom
 * @desc    Get custom holidays
 * @access  Private (Admin only)
 */
router.get('/custom', authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json({
      customHolidays: HOLIDAY_SETTINGS.customHolidays || [],
      count: HOLIDAY_SETTINGS.customHolidays?.length || 0
    });
  } catch (error) {
    console.error('Error fetching custom holidays:', error);
    res.status(500).json({ message: 'Server error fetching custom holidays' });
  }
});

/**
 * @route   POST /api/holidays/custom
 * @desc    Add a custom holiday
 * @access  Private (Admin only)
 */
router.post('/custom', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, date, description } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }
    
    const holidayDate = new Date(date);
    if (isNaN(holidayDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Check if holiday already exists
    const exists = HOLIDAY_SETTINGS.customHolidays?.some(h => 
      h.date === date && h.name === name
    );
    
    if (exists) {
      return res.status(400).json({ message: 'Holiday already exists' });
    }
    
    const newHoliday = {
      name,
      date,
      description: description || '',
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };
    
    if (!HOLIDAY_SETTINGS.customHolidays) {
      HOLIDAY_SETTINGS.customHolidays = [];
    }
    
    HOLIDAY_SETTINGS.customHolidays.push(newHoliday);
    
    res.status(201).json({
      message: 'Custom holiday added successfully',
      holiday: newHoliday
    });
  } catch (error) {
    console.error('Error adding custom holiday:', error);
    res.status(500).json({ message: 'Server error adding custom holiday' });
  }
});

/**
 * @route   DELETE /api/holidays/custom/:date/:name
 * @desc    Delete a custom holiday
 * @access  Private (Admin only)
 */
router.delete('/custom/:date/:name', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { date, name } = req.params;
    
    if (!HOLIDAY_SETTINGS.customHolidays) {
      return res.status(404).json({ message: 'No custom holidays found' });
    }
    
    const initialLength = HOLIDAY_SETTINGS.customHolidays.length;
    HOLIDAY_SETTINGS.customHolidays = HOLIDAY_SETTINGS.customHolidays.filter(h => 
      !(h.date === date && h.name === decodeURIComponent(name))
    );
    
    if (HOLIDAY_SETTINGS.customHolidays.length === initialLength) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    
    res.json({ message: 'Custom holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom holiday:', error);
    res.status(500).json({ message: 'Server error deleting custom holiday' });
  }
});

/**
 * @route   GET /api/holidays/settings
 * @desc    Get holiday settings configuration
 * @access  Private (Admin only)
 */
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json({
      settings: HOLIDAY_SETTINGS
    });
  } catch (error) {
    console.error('Error fetching holiday settings:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

/**
 * @route   PUT /api/holidays/settings
 * @desc    Update holiday settings configuration
 * @access  Private (Admin only)
 */
router.put('/settings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { 
      enableHolidayChecking, 
      includeFederalHolidays,
      skipHolidayTrips,
      rescheduleToNextDay,
      treatWeekendsAsHolidays
    } = req.body;
    
    // Update settings
    if (typeof enableHolidayChecking === 'boolean') {
      HOLIDAY_SETTINGS.enableHolidayChecking = enableHolidayChecking;
    }
    if (typeof includeFederalHolidays === 'boolean') {
      HOLIDAY_SETTINGS.includeFederalHolidays = includeFederalHolidays;
    }
    if (typeof skipHolidayTrips === 'boolean') {
      HOLIDAY_SETTINGS.skipHolidayTrips = skipHolidayTrips;
    }
    if (typeof rescheduleToNextDay === 'boolean') {
      HOLIDAY_SETTINGS.rescheduleToNextDay = rescheduleToNextDay;
    }
    if (typeof treatWeekendsAsHolidays === 'boolean') {
      HOLIDAY_SETTINGS.treatWeekendsAsHolidays = treatWeekendsAsHolidays;
    }
    
    res.json({
      message: 'Holiday settings updated successfully',
      settings: HOLIDAY_SETTINGS
    });
  } catch (error) {
    console.error('Error updating holiday settings:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

export default router;
