import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { authLimiter, passwordResetLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import Session from '../models/Session.js';
import { hashToken } from '../middleware/sessionTracking.js';
import { processSecureLogin, checkBruteForce, checkCredentialStuffing } from '../services/authSecurityService.js';
import { validateLogin } from '../utils/validation.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for agency logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for logos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed'));
    }
  }
});

// Helper function to hash token
// (imported from sessionTracking middleware)

// Helper function to parse user agent
function parseUA(userAgent) {
  if (!userAgent) return {};
  const deviceInfo = {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown',
    isMobile: false,
    isDesktop: false,
    isTablet: false
  };
  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) deviceInfo.browser = 'Chrome';
  else if (/Firefox/.test(userAgent)) deviceInfo.browser = 'Firefox';
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) deviceInfo.browser = 'Safari';
  else if (/Edg/.test(userAgent)) deviceInfo.browser = 'Edge';
  if (/Windows/.test(userAgent)) deviceInfo.os = 'Windows';
  else if (/Mac OS X/.test(userAgent)) deviceInfo.os = 'macOS';
  else if (/Linux/.test(userAgent)) deviceInfo.os = 'Linux';
  else if (/Android/.test(userAgent)) deviceInfo.os = 'Android';
  else if (/iOS|iPhone|iPad/.test(userAgent)) deviceInfo.os = 'iOS';
  if (/Mobile|Android|iPhone/.test(userAgent)) { deviceInfo.device = 'Mobile'; deviceInfo.isMobile = true; }
  else if (/Tablet|iPad/.test(userAgent)) { deviceInfo.device = 'Tablet'; deviceInfo.isTablet = true; }
  else { deviceInfo.device = 'Desktop'; deviceInfo.isDesktop = true; }
  return deviceInfo;
}

// Register new user (admin only)
router.post('/register', apiLimiter, authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, phone, licenseNumber, vehicleInfo, riderId, dateOfBirth, preferredVehicleType, serviceBalance, contractDetails, pricingDetails, mileageBalance, trips, securityQuestions } = req.body;

    // Registration request received

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
        // Default password generated for rider
      } else {
        // Password validation failed
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
    
    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'user_created',
      category: 'user_management',
      description: `Created new user: ${user.username} (${role})`,
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: `${user.firstName} ${user.lastName}`,
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'info',
      success: true
    });

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
    // Registration error occurred
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
    // Admin registration error occurred
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// Login user (supports both username and email)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, email, password, twoFactorToken } = req.body;

    // Validate login data
    const validation = validateLogin({ username, email, password });
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Support login with either username or email
    let user;
    if (username) {
      user = await User.findOne({ username: username.toLowerCase() }).select('+twoFactorSecret');
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select('+twoFactorSecret');
    } else {
      return res.status(400).json({ message: 'Username or email is required' });
    }

    const loginEmail = user?.email || email;

    // Check for brute force attacks (before revealing if user exists)
    if (loginEmail) {
      const bruteForceCheck = await checkBruteForce(loginEmail);
      if (bruteForceCheck.isBruteForce) {
        await logAudit({
          action: 'brute_force_detected',
          category: 'security',
          description: `Brute force attack detected for ${loginEmail}`,
          metadata: { 
            ipAddress: req.ip, 
            userAgent: req.headers['user-agent'],
            attempts: bruteForceCheck.attemptCount
          },
          severity: 'critical',
          success: false
        });
        return res.status(429).json({ 
          message: 'Too many failed login attempts. Please try again later.',
          retryAfter: 900 // 15 minutes
        });
      }
    }

    // Check for credential stuffing
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceFingerprint = req.body.deviceFingerprint?.fingerprint;
    if (ipAddress || deviceFingerprint) {
      const stuffingCheck = await checkCredentialStuffing(ipAddress, deviceFingerprint);
      if (stuffingCheck.isCredentialStuffing) {
        await logAudit({
          action: 'credential_stuffing_detected',
          category: 'security',
          description: `Credential stuffing attack detected`,
          metadata: { 
            ipAddress,
            deviceFingerprint,
            uniqueAccounts: stuffingCheck.uniqueAccounts
          },
          severity: 'critical',
          success: false
        });
        // Continue but flag as suspicious
      }
    }

    if (!user) {
      await logAudit({
        action: 'login_failed',
        category: 'authentication',
        description: `Failed login attempt for ${username || email}`,
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        severity: 'warning',
        success: false
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Process failed login with security service
      await processSecureLogin(req, user, { success: false, reason: 'invalid_credentials' });
      
      await logAudit({
        userId: user._id,
        username: user.username,
        userRole: user.role,
        action: 'login_failed',
        category: 'authentication',
        description: `Failed login attempt - invalid password`,
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        severity: 'warning',
        success: false
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    let twoFactorVerified = false;
    if (user.twoFactorEnabled) {
      // If 2FA token not provided, return requiresTwoFactor flag
      if (!twoFactorToken) {
        return res.status(200).json({
          requiresTwoFactor: true,
          userId: user._id,
          message: 'Two-factor authentication required'
        });
      }

      // Verify 2FA token
      const speakeasy = await import('speakeasy');
      const verified = speakeasy.default.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      });

      if (!verified) {
        // Check if it's a backup code
        const backupCode = user.twoFactorBackupCodes.find(
          bc => bc.code === twoFactorToken.toUpperCase() && !bc.used
        );

        if (backupCode) {
          // Mark backup code as used
          backupCode.used = true;
          backupCode.usedAt = new Date();
          await user.save();
          twoFactorVerified = true;
        } else {
          // Process failed 2FA attempt
          await processSecureLogin(req, user, { success: false, reason: '2fa_failed' });
          return res.status(401).json({ message: 'Invalid two-factor authentication code' });
        }
      } else {
        twoFactorVerified = true;
      }
    }

    // Process secure login with all security checks
    const securityResult = await processSecureLogin(req, user, {
      twoFactorVerified,
      authMethod: user.twoFactorEnabled ? '2fa' : 'password'
    });

    // Handle security check results
    if (!securityResult.allowed) {
      return res.status(403).json({
        message: securityResult.message,
        reason: securityResult.reason
      });
    }

    if (securityResult.requires2FA && !twoFactorVerified) {
      return res.status(200).json({
        requiresTwoFactor: true,
        userId: user._id,
        message: securityResult.message
      });
    }

    if (securityResult.requiresVerification) {
      return res.status(200).json({
        requiresVerification: true,
        userId: user._id,
        message: securityResult.message,
        verificationType: 'device_changed',
        changes: securityResult.changes
      });
    }

    if (securityResult.requiresChallenge) {
      return res.status(200).json({
        requiresChallenge: true,
        challengeType: securityResult.challengeType,
        userId: user._id,
        message: securityResult.message
      });
    }

    // Update last login without triggering full validation
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Log activity
    await logActivity(user._id, 'user_login', 'User logged in successfully');
    
    // Audit log
    await logAudit({
      userId: user._id,
      username: user.username,
      userRole: user.role,
      action: 'login_success',
      category: 'authentication',
      description: `User logged in successfully`,
      metadata: { 
        ipAddress: req.ip, 
        userAgent: req.headers['user-agent'],
        deviceTrustScore: securityResult.trustScore,
        location: securityResult.location
      },
      severity: 'info',
      success: true
    });

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

    // Create session for tracking
    try {
      const tokenHash = hashToken(token);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo = parseUA(userAgent);
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      const session = await Session.createSession({
        userId: user._id,
        token,
        tokenHash,
        ipAddress,
        userAgent,
        deviceInfo,
        loginMethod: user.twoFactorEnabled ? 'two-factor' : 'password',
        expiresIn: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Pass session ID to security result
      securityResult.sessionId = session._id;

      // Check for anomalies
      const anomalies = await Session.detectAnomalies(user._id);
      if (anomalies.length > 0) {
        // Suspicious login activity detected
        
        await logAudit({
          userId: user._id,
          username: user.username,
          userRole: user.role,
          action: 'suspicious_login',
          category: 'security',
          description: `Suspicious login detected: ${anomalies.join(', ')}`,
          metadata: { 
            ipAddress: req.ip,
            anomalies
          },
          severity: 'warning',
          success: true
        });
      }
    } catch (sessionError) {
      // Session creation error occurred
      // Don't fail login if session creation fails
    }

    // Prepare user response
    const userResponse = user.toJSON();
    
    // Add a flag if username is missing (for frontend to prompt setup)
    if (!user.username) {
      userResponse.needsUsernameSetup = true;
    }

    // Add security info to response
    const response = {
      message: 'Login successful',
      token,
      user: userResponse,
      security: {
        deviceTrusted: securityResult.device?.trustLevel === 'trusted' || securityResult.device?.trustLevel === 'verified',
        trustScore: securityResult.trustScore,
        deviceId: securityResult.device?._id,
        newDevice: securityResult.device?.loginCount === 1,
        location: securityResult.location
      }
    };

    // Add warning if security checks failed but login was allowed
    if (securityResult.securityChecksFailed) {
      response.securityWarning = 'Some security checks could not be completed';
    }

    res.json(response);
  } catch (error) {
    // Login error occurred
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
    // FCM token update error occurred
    res.status(500).json({ message: 'Server error updating FCM token' });
  }
});

// Password Recovery - Step 1: Get Security Questions
router.post('/forgot-password/questions', passwordResetLimiter, async (req, res) => {
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
    // Security questions fetch error occurred
    res.status(500).json({ message: 'Server error retrieving security questions' });
  }
});

// Password Recovery - Step 2: Verify Security Answers
router.post('/forgot-password/verify', passwordResetLimiter, async (req, res) => {
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
    // Security answers verification error occurred
    res.status(500).json({ message: 'Server error verifying security answers' });
  }
});

// Password Recovery - Step 3: Reset Password
router.post('/forgot-password/reset', passwordResetLimiter, async (req, res) => {
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
    // Password reset error occurred
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
    // Admin password reset error occurred
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
    // Set username error occurred
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error setting username' });
  }
});

// Upload agency logo
router.post('/upload-logo', authenticateToken, authorizeRoles('admin'), logoUpload.single('logo'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Construct the file URL (relative path for serving from uploads folder)
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Update user with new logo
    const user = await User.findByIdAndUpdate(
      userId,
      { logoUrl: logoUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logActivity(
      userId,
      'logo_uploaded',
      `Agency logo uploaded: ${req.file.filename}`
    );

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Error uploading logo' });
  }
});

export default router;