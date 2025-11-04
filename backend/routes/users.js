import express from 'express';
import User from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get all users (for admin and dispatchers)
router.get('/', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { role, isActive = true, page = 1, limit = 10, search } = req.query;
    
    let filter = { isActive };
    if (role) filter.role = role;

    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get all drivers
router.get('/drivers', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isActive: true
    }).select('firstName lastName phone email vehicleInfo');

    res.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
});

// Get available drivers
router.get('/drivers/available', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isActive: true,
      isAvailable: true
    }).select('firstName lastName phone vehicleInfo currentLocation');

    res.json(drivers);
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ message: 'Server error fetching available drivers' });
  }
});

// Get available dispatchers
router.get('/dispatchers/available', authenticateToken, authorizeRoles('scheduler', 'admin'), async (req, res) => {
  try {
    const dispatchers = await User.find({
      role: 'dispatcher',
      isActive: true
    }).select('firstName lastName phone email');

    res.json(dispatchers);
  } catch (error) {
    console.error('Get available dispatchers error:', error);
    res.status(500).json({ message: 'Server error fetching available dispatchers' });
  }
});

// Get single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin/dispatcher
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Password updates should use separate endpoint
    delete updateData.role; // Role updates should be restricted to admin

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      'profile_updated',
      `Updated profile for ${user.firstName} ${user.lastName}`,
      { updatedFields: Object.keys(updateData) }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Update driver availability
router.patch('/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    // Only drivers can update their own availability, or admin can update anyone's
    if ((req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) ||
        (req.user.role !== 'driver' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      'availability_updated',
      `Driver availability changed to ${isAvailable ? 'available' : 'unavailable'}`,
      { isAvailable }
    );

    res.json({
      message: 'Availability updated successfully',
      user
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
});

// Update driver location
router.patch('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Only drivers can update their own location
    if (req.user.role !== 'driver' || req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        currentLocation: {
          lat,
          lng,
          lastUpdated: new Date()
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Location updated successfully',
      location: user.currentLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      'user_deactivated',
      `Deactivated user ${user.firstName} ${user.lastName}`,
      { deactivatedUserId: user._id }
    );

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error deactivating user' });
  }
});

export default router;