import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Register new user (admin only)
router.post('/register', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, licenseNumber, vehicleInfo, riderId, dateOfBirth, preferredVehicleType, serviceBalance, contractDetails, pricingDetails, mileageBalance, trips } = req.body;

    console.log('Registration request body:', req.body);
    console.log('Destructured values:', { email, password, firstName, lastName, role, phone });
    console.log('req.body.password:', req.body.password);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate required fields
    if (!req.body.password || req.body.password.trim() === '') {
      console.log('Password validation failed - req.body.password:', req.body.password);
      return res.status(400).json({ message: 'Password is required' });
    }

    // Create new user
    const userData = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      phone: req.body.phone
    };

    // Add driver-specific fields if role is driver
    if (role === 'driver') {
      userData.licenseNumber = licenseNumber;
      userData.vehicleInfo = vehicleInfo;
    }

    // Add rider-specific fields if role is rider
    if (req.body.role === 'rider') {
      userData.riderId = req.body.riderId;
      userData.dateOfBirth = req.body.dateOfBirth;
      userData.preferredVehicleType = req.body.preferredVehicleType;
      userData.serviceBalance = req.body.serviceBalance;
      userData.contractDetails = req.body.contractDetails;
      userData.pricingDetails = req.body.pricingDetails;
      userData.mileageBalance = req.body.mileageBalance;
      userData.trips = req.body.trips;
    }

    const user = new User(userData);
    await user.save();

    // Log activity
    await logActivity(user._id, 'user_registered', `User registered with role: ${role}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Public registration (only for first admin setup)
router.post('/register-admin', async (req, res) => {
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({ message: 'Admin already exists. Use admin registration.' });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create admin user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      phone
    };

    const user = new User(userData);
    await user.save();

    // Log activity
    await logActivity(user._id, 'admin_registered', 'First admin user registered');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    await logActivity(user._id, 'user_login', 'User logged in successfully');

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }

    res.json({
      valid: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' 
    });
  }
});

// Update FCM token for notifications
router.post('/fcm-token', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fcmToken } = req.body;

    await User.findByIdAndUpdate(decoded.userId, { fcmToken });

    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('FCM token update error:', error);
    res.status(500).json({ message: 'Server error updating FCM token' });
  }
});

export default router;