import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/2fa/setup
 * @desc    Generate 2FA secret and QR code for user
 * @access  Private
 */
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled for this account' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Transportation MVP (${user.username || user.email})`,
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (not enabled yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    res.json({
      message: '2FA setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ message: 'Server error setting up 2FA' });
  }
});

/**
 * @route   POST /api/2fa/verify-setup
 * @desc    Verify 2FA code and enable 2FA
 * @access  Private
 */
router.post('/verify-setup', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated. Please start setup first.' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push({
        code: code,
        used: false
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorEnabledAt = new Date();
    await user.save();

    res.json({
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(bc => bc.code)
    });
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({ message: 'Server error verifying 2FA' });
  }
});

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify 2FA token during login
 * @access  Public (but requires valid user context)
 */
router.post('/verify', async (req, res) => {
  try {
    const { userId, token, isBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and token are required' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    let verified = false;

    if (isBackupCode) {
      // Check backup codes
      const backupCode = user.twoFactorBackupCodes.find(
        bc => bc.code === token.toUpperCase() && !bc.used
      );

      if (backupCode) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        await user.save();
        verified = true;
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({
      message: '2FA verification successful',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    res.status(500).json({ message: 'Server error verifying 2FA' });
  }
});

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA for user account
 * @access  Private
 */
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { password, token } = req.body;
    const userId = req.user._id;

    if (!password || !token) {
      return res.status(400).json({ message: 'Password and verification code are required' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret +password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    user.twoFactorEnabledAt = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ message: 'Server error disabling 2FA' });
  }
});

/**
 * @route   GET /api/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      twoFactorEnabled: user.twoFactorEnabled || false,
      twoFactorEnabledAt: user.twoFactorEnabledAt,
      backupCodesRemaining: user.twoFactorBackupCodes 
        ? user.twoFactorBackupCodes.filter(bc => !bc.used).length 
        : 0
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ message: 'Server error getting 2FA status' });
  }
});

/**
 * @route   POST /api/2fa/regenerate-backup-codes
 * @desc    Regenerate backup codes (requires password + 2FA token)
 * @access  Private
 */
router.post('/regenerate-backup-codes', authenticateToken, async (req, res) => {
  try {
    const { password, token } = req.body;
    const userId = req.user._id;

    if (!password || !token) {
      return res.status(400).json({ message: 'Password and verification code are required' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret +password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push({
        code: code,
        used: false
      });
    }

    user.twoFactorBackupCodes = backupCodes;
    await user.save();

    res.json({
      message: 'Backup codes regenerated successfully',
      backupCodes: backupCodes.map(bc => bc.code)
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ message: 'Server error regenerating backup codes' });
  }
});

export default router;
