import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Register new user (admin only)
router.post('/register', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, phone, licenseNumber, vehicleInfo, riderId, dateOfBirth, preferredVehicleType, serviceBalance, contractDetails, pricingDetails, mileageBalance, trips, securityQuestions } = req.body;

    console.log('Registration request body:', req.body);
    console.log('Destructured values:', { username, email, password, firstName, lastName, role, phone });

    // Validate required fields
    if (!username) {
      return res.status(400).json({ 
        success: false,
        message: 'Username is required' 
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false,
        message: 'First name and last name are required' 
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false,
        message: 'A user with this username already exists' 
      });
    }

    // Check if user already exists (only if email is provided)
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'A user with this email already exists' 
        });
      }
    }

    // Check for duplicate phone number
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ 
          success: false,
          message: 'A user with this phone number already exists' 
        });
      }
    }

    // Check for duplicate license number for drivers
    if (role === 'driver' && licenseNumber) {
      const existingLicense = await User.findOne({ 
        licenseNumber,
        roles: 'driver' 
      });
      if (existingLicense) {
        return res.status(400).json({ 
          success: false,
          message: 'A driver with this license number already exists' 
        });
      }
    }

    // Password validation
    let userPassword = req.body.password;
    if (!userPassword || userPassword.trim() === '') {
      if (role === 'rider') {
        // Generate a default password for riders
        userPassword = `Rider${Date.now()}`;
        console.log('Generated default password for rider');
      } else {
        console.log('Password validation failed - req.body.password:', req.body.password);
        return res.status(400).json({ 
          success: false,
          message: 'Password is required' 
        });
      }
    }

    // Create new user
    const userData = {
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      password: userPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      phone: req.body.phone
    };

    // Add security questions if provided
    if (securityQuestions && Array.isArray(securityQuestions) && securityQuestions.length > 0) {
      userData.securityQuestions = securityQuestions;
    }

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

// Login user (supports both username and email)
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Support login with either username or email
    let user;
    if (username) {
      user = await User.findOne({ username: username.toLowerCase() });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      return res.status(400).json({ message: 'Username or email is required' });
    }

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

    // Update last login without triggering full validation
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Log activity
    await logActivity(user._id, 'user_login', 'User logged in successfully');

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        roles: user.roles // Include roles array for multi-role support
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user response
    const userResponse = user.toJSON();
    
    // Add a flag if username is missing (for frontend to prompt setup)
    if (!user.username) {
      userResponse.needsUsernameSetup = true;
    }

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
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

// Password Recovery - Step 1: Get Security Questions
router.post('/forgot-password/questions', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('securityQuestions username');
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(404).json({ message: 'User not found or no security questions set' });
    }

    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(404).json({ 
        message: 'No security questions found. Please contact an administrator for password reset.' 
      });
    }

    // Return questions without answers
    const questions = user.securityQuestions.map((sq, index) => ({
      index,
      question: sq.question
    }));

    res.json({
      username: user.username,
      questions
    });
  } catch (error) {
    console.error('Get security questions error:', error);
    res.status(500).json({ message: 'Server error retrieving security questions' });
  }
});

// Password Recovery - Step 2: Verify Security Answers
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { username, answers } = req.body;

    if (!username || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Username and answers are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(404).json({ message: 'Invalid request' });
    }

    // Verify all answers
    let allCorrect = true;
    for (const answer of answers) {
      const isCorrect = await user.verifySecurityAnswer(answer.index, answer.answer);
      if (!isCorrect) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      // Log failed attempt
      await logActivity(
        user._id,
        'password_recovery_failed',
        'Failed security question verification'
      );
      
      return res.status(401).json({ message: 'Incorrect security answers' });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived token
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Log successful verification
    await logActivity(
      user._id,
      'password_recovery_verified',
      'Security questions verified successfully'
    );

    res.json({
      message: 'Security questions verified',
      resetToken
    });
  } catch (error) {
    console.error('Verify security answers error:', error);
    res.status(500).json({ message: 'Server error verifying security answers' });
  }
});

// Password Recovery - Step 3: Reset Password
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if token matches and hasn't expired
    if (user.resetPasswordToken !== resetToken || 
        !user.resetPasswordExpires || 
        user.resetPasswordExpires < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log password reset
    await logActivity(
      user._id,
      'password_reset',
      'Password reset successfully via security questions'
    );

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// Admin-Initiated Password Reset
router.post('/admin/reset-password/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { newPassword, tempPassword } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set new password or generate temporary one
    const passwordToSet = newPassword || tempPassword || `Temp${Date.now()}`;
    
    user.password = passwordToSet;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log activity
    await logActivity(
      req.user._id,
      'admin_password_reset',
      `Admin reset password for user: ${user.username}`,
      { targetUserId: userId, targetUsername: user.username }
    );

    res.json({
      message: 'Password reset successfully by administrator',
      tempPassword: newPassword ? undefined : passwordToSet // Only return if auto-generated
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// Set Username (for users created before username requirement)
router.post('/set-username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.userId;

    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ 
        message: 'Username must be between 3 and 30 characters' 
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Check if username already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Update user with username
    const user = await User.findByIdAndUpdate(
      userId,
      { username: normalizedUsername },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logActivity(
      userId,
      'username_set',
      `User set username: ${normalizedUsername}`
    );

    res.json({
      message: 'Username set successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Set username error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error setting username' });
  }
});

export default router;