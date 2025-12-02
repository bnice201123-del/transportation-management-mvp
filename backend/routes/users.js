import express from 'express';
import User from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get all users (for admin, schedulers, and dispatchers)
router.get('/', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { role, isActive = true, page = 1, limit = 10, search } = req.query;
    
    let filter = { isActive };
    
    // If role is specified, match either the primary role field or roles array
    if (role) {
      filter.$or = [
        { role: role },
        { roles: role }
      ];
    }

    // Add search functionality
    if (search) {
      const searchFilter = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
      
      // Combine role filter with search filter
      if (filter.$or) {
        filter = {
          isActive,
          $and: [
            { $or: filter.$or },
            { $or: searchFilter.$or }
          ]
        };
      } else {
        filter = { ...filter, ...searchFilter };
      }
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
    // Find users who have 'driver' in their roles array
    const drivers = await User.find({
      roles: 'driver', // MongoDB will match if 'driver' is in the array
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
    // Find users who have 'driver' in their roles array
    const drivers = await User.find({
      roles: 'driver', // MongoDB will match if 'driver' is in the array
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

// Get all active riders (for trip creation)
router.get('/riders', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    
    let filter = {
      role: 'rider',
      isActive: true
    };

    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { _id: search } // Allow searching by ID
      ];
    }

    const riders = await User.find(filter)
      .select('firstName lastName email phone')
      .sort({ firstName: 1, lastName: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: riders,
      count: riders.length
    });
  } catch (error) {
    console.error('Get riders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching riders' 
    });
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

    // Check for duplicate email (excluding current user)
    if (updateData.email) {
      const existingEmail = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: 'A user with this email already exists' 
        });
      }
    }

    // Check for duplicate phone (excluding current user)
    if (updateData.phone) {
      const existingPhone = await User.findOne({ 
        phone: updateData.phone,
        _id: { $ne: req.params.id }
      });
      if (existingPhone) {
        return res.status(400).json({ 
          success: false,
          message: 'A user with this phone number already exists' 
        });
      }
    }

    // Check for duplicate license number for drivers (excluding current user)
    if (updateData.licenseNumber) {
      const existingLicense = await User.findOne({ 
        licenseNumber: updateData.licenseNumber,
        role: 'driver',
        _id: { $ne: req.params.id }
      });
      if (existingLicense) {
        return res.status(400).json({ 
          success: false,
          message: 'A driver with this license number already exists' 
        });
      }
    }

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

// Update user roles (admin only)
router.patch('/:id/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { roles } = req.body;

    // Validate roles array
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ 
        message: 'Roles must be a non-empty array' 
      });
    }

    const validRoles = ['scheduler', 'dispatcher', 'driver', 'admin', 'rider'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      return res.status(400).json({ 
        message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}` 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store old roles for logging
    const oldRoles = user.roles || [user.role];

    // Update roles
    user.roles = roles;
    
    // Update primary role to the first one in the array
    user.role = roles[0];
    
    await user.save();

    // Log activity
    await logActivity(
      req.user._id,
      'roles_updated',
      `Updated roles for ${user.firstName} ${user.lastName} from [${oldRoles.join(', ')}] to [${roles.join(', ')}]`,
      { oldRoles, newRoles: roles, userId: user._id }
    );

    res.json({
      message: 'User roles updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Update user roles error:', error);
    res.status(500).json({ message: 'Server error updating user roles' });
  }
});

// Update driver availability
router.patch('/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    // Support both single role (legacy) and multiple roles array
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    const isAdmin = userRoles.includes('admin');
    const hasDriverRole = userRoles.includes('driver');
    const isSelf = req.params.id === req.user._id.toString();
    
    // Admin can update anyone's availability, or drivers can update their own
    if (!isAdmin && (!hasDriverRole || !isSelf)) {
      return res.status(403).json({ 
        message: 'Access denied. Only drivers can update their own availability, or admins can update any driver.' 
      });
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

// Update security questions
router.patch('/:id/security-questions', authenticateToken, async (req, res) => {
  try {
    const { securityQuestions } = req.body;
    
    // Users can only update their own security questions, or admin can update anyone's
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    const isAdmin = userRoles.includes('admin');
    const isSelf = req.params.id === req.user._id.toString();
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own security questions.' 
      });
    }

    // Validate security questions
    if (!Array.isArray(securityQuestions) || securityQuestions.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 security questions are required' 
      });
    }

    for (const sq of securityQuestions) {
      if (!sq.question || !sq.answer) {
        return res.status(400).json({ 
          message: 'Each security question must have a question and answer' 
        });
      }
      if (sq.answer.trim().length < 2) {
        return res.status(400).json({ 
          message: 'Security answers must be at least 2 characters long' 
        });
      }
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update security questions (will be hashed by pre-save hook)
    user.securityQuestions = securityQuestions;
    await user.save();

    // Log activity
    await logActivity(
      req.user._id,
      'security_questions_updated',
      `Security questions updated for ${user.username}`,
      { targetUserId: user._id }
    );

    res.json({
      message: 'Security questions updated successfully'
    });
  } catch (error) {
    console.error('Update security questions error:', error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
});

// Update driver location
router.patch('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Support both single role (legacy) and multiple roles array
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    // Only users with driver role can update their own location
    const hasDriverRole = userRoles.includes('driver');
    const isSelf = req.params.id === req.user._id.toString();
    
    if (!hasDriverRole || !isSelf) {
      return res.status(403).json({ 
        message: 'Access denied. Only drivers can update their own location.' 
      });
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

// Update rider balance
router.patch('/:id/balance', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, operation } = req.body;

    if (!type || !amount || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Type, amount, and operation are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'rider') {
      return res.status(400).json({
        success: false,
        message: 'User is not a rider'
      });
    }

    // Update balance based on type
    if (type === 'trips') {
      if (operation === 'add') {
        user.serviceBalance.tripCount = (user.serviceBalance.tripCount || 0) + amount;
      } else if (operation === 'subtract') {
        user.serviceBalance.tripCount = Math.max(0, (user.serviceBalance.tripCount || 0) - amount);
      }
    } else if (type === 'dollars') {
      if (operation === 'add') {
        user.serviceBalance.dollarAmount = (user.serviceBalance.dollarAmount || 0) + amount;
      } else if (operation === 'subtract') {
        user.serviceBalance.dollarAmount = Math.max(0, (user.serviceBalance.dollarAmount || 0) - amount);
      }
    } else if (type === 'mileage') {
      if (operation === 'add') {
        user.mileageBalance.currentBalance = (user.mileageBalance.currentBalance || 0) + amount;
      } else if (operation === 'subtract') {
        user.mileageBalance.currentBalance = Math.max(0, (user.mileageBalance.currentBalance || 0) - amount);
        user.mileageBalance.totalUsed = (user.mileageBalance.totalUsed || 0) + Math.min(amount, (user.mileageBalance.currentBalance || 0));
      }
    }

    await user.save();

    res.json({
      success: true,
      message: `Balance updated successfully`,
      user: {
        _id: user._id,
        serviceBalance: user.serviceBalance,
        mileageBalance: user.mileageBalance
      }
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating balance',
      error: error.message
    });
  }
});

// Upload profile image
router.post('/:id/profile-image', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { profileImage } = req.body;

    // Check if user is updating their own profile or is admin
    const userRoles = req.user.roles || [req.user.role];
    const isAdmin = userRoles.includes('admin');
    
    if (req.user.id !== id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    // Validate base64 image format
    if (!profileImage || !profileImage.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be a valid base64 image (JPEG or PNG)'
      });
    }

    // Check image size (limit to 5MB base64)
    const sizeInBytes = (profileImage.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 5) {
      return res.status(400).json({
        success: false,
        message: 'Image size must be less than 5MB'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profileImage = profileImage;
    await user.save();

    await logActivity(
      req.user.id,
      req.user.role,
      'profile_image_update',
      `Profile image updated for user: ${user.firstName} ${user.lastName}`,
      { userId: user._id }
    );

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile image',
      error: error.message
    });
  }
});

// Delete profile image
router.delete('/:id/profile-image', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is updating their own profile or is admin
    const userRoles = req.user.roles || [req.user.role];
    const isAdmin = userRoles.includes('admin');
    
    if (req.user.id !== id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profileImage = null;
    await user.save();

    await logActivity(
      req.user.id,
      req.user.role,
      'profile_image_delete',
      `Profile image deleted for user: ${user.firstName} ${user.lastName}`,
      { userId: user._id }
    );

    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting profile image',
      error: error.message
    });
  }
});

export default router;