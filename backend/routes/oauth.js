import express from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import { getOAuthStatus } from '../config/passport.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

/**
 * OAuth Configuration Status
 * GET /api/auth/oauth/status
 * Public endpoint to check which OAuth providers are configured
 */
router.get('/oauth/status', (req, res) => {
  try {
    const status = getOAuthStatus();
    res.json({
      success: true,
      providers: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking OAuth status'
    });
  }
});

/**
 * Google OAuth - Initiate Authentication
 * GET /api/auth/google
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * Google OAuth - Callback
 * GET /api/auth/google/callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
          roles: req.user.roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=google_callback_failed`);
    }
  }
);

/**
 * Microsoft OAuth - Initiate Authentication
 * GET /api/auth/microsoft
 */
router.get(
  '/microsoft',
  passport.authenticate('microsoft', {
    prompt: 'select_account'
  })
);

/**
 * Microsoft OAuth - Callback
 * GET /api/auth/microsoft/callback
 */
router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=microsoft_auth_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
          roles: req.user.roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=microsoft`);
    } catch (error) {
      console.error('Microsoft callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=microsoft_callback_failed`);
    }
  }
);

/**
 * Apple OAuth - Initiate Authentication
 * GET /api/auth/apple
 */
router.get(
  '/apple',
  passport.authenticate('apple')
);

/**
 * Apple OAuth - Callback (POST method for Apple)
 * POST /api/auth/apple/callback
 */
router.post(
  '/apple/callback',
  passport.authenticate('apple', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=apple_auth_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
          roles: req.user.roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=apple`);
    } catch (error) {
      console.error('Apple callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=apple_callback_failed`);
    }
  }
);

/**
 * Unlink OAuth Provider
 * DELETE /api/auth/oauth/:provider
 * Requires authentication
 */
router.delete('/oauth/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user._id;

    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OAuth provider'
      });
    }

    const user = await req.user;
    
    // Check if user has a password or other OAuth providers
    const hasPassword = user.password && user.password !== '';
    const otherProviders = user.oauthProviders?.filter(p => p.provider !== provider) || [];
    
    if (!hasPassword && otherProviders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlink the only authentication method. Please set a password first.'
      });
    }

    // Remove the OAuth provider
    user.oauthProviders = otherProviders;
    await user.save();

    // Log audit
    await logAudit({
      userId: user._id,
      action: 'oauth_unlink',
      category: 'authentication',
      details: {
        provider: provider
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`
    });
  } catch (error) {
    console.error('Unlink OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking OAuth provider'
    });
  }
});

/**
 * Get User's Linked OAuth Providers
 * GET /api/auth/oauth/linked
 * Requires authentication
 */
router.get('/oauth/linked', async (req, res) => {
  try {
    const user = req.user;
    
    const linkedProviders = (user.oauthProviders || []).map(provider => ({
      provider: provider.provider,
      linkedAt: provider.linkedAt,
      lastUsed: provider.lastUsed,
      email: provider.profile?.email
    }));

    res.json({
      success: true,
      providers: linkedProviders,
      hasPassword: !!(user.password && user.password !== '')
    });
  } catch (error) {
    console.error('Get linked providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching linked providers'
    });
  }
});

/**
 * Link OAuth Provider to Existing Account
 * This is handled automatically in passport strategies
 * but this endpoint can be used to check linking status
 */
router.post('/oauth/link/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!['google', 'microsoft', 'apple'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OAuth provider'
      });
    }

    // Check if provider is configured
    const oauthStatus = getOAuthStatus();
    if (!oauthStatus[provider]) {
      return res.status(400).json({
        success: false,
        message: `${provider} OAuth is not configured on this server`
      });
    }

    // Return the OAuth URL to initiate linking
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    res.json({
      success: true,
      redirectUrl: `${backendUrl}/api/auth/${provider}`,
      message: `Redirect to this URL to link your ${provider} account`
    });
  } catch (error) {
    console.error('Link OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating OAuth link'
    });
  }
});

export default router;
