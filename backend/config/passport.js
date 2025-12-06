import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import AppleStrategy from 'passport-apple';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

/**
 * Configure Passport with OAuth strategies
 * Supports Google, Microsoft, and Apple authentication
 */

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Google OAuth Strategy
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profilePhoto = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user exists with this OAuth provider
          let user = await User.findOne({
            'oauthProviders.provider': 'google',
            'oauthProviders.providerId': profile.id
          });

          if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email });

            if (user) {
              // Link OAuth provider to existing account
              if (!user.oauthProviders) {
                user.oauthProviders = [];
              }
              user.oauthProviders.push({
                provider: 'google',
                providerId: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profile: {
                  email,
                  displayName: profile.displayName,
                  firstName,
                  lastName,
                  photo: profilePhoto
                }
              });
              user.emailVerified = true; // Trust Google verification
              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'oauth_link',
                category: 'authentication',
                details: {
                  provider: 'google',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            } else {
              // Create new user with Google OAuth
              user = new User({
                email,
                username: email.split('@')[0] + '_' + Date.now(),
                firstName,
                lastName,
                role: 'rider', // Default role
                emailVerified: true, // Trust Google verification
                oauthProviders: [
                  {
                    provider: 'google',
                    providerId: profile.id,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    profile: {
                      email,
                      displayName: profile.displayName,
                      firstName,
                      lastName,
                      photo: profilePhoto
                    }
                  }
                ]
              });

              // Set profile photo if available
              if (profilePhoto) {
                user.profileImage = profilePhoto;
              }

              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'user_created',
                category: 'user_management',
                details: {
                  method: 'google_oauth',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            }
          } else {
            // Update existing OAuth connection
            const providerIndex = user.oauthProviders.findIndex(
              p => p.provider === 'google'
            );
            if (providerIndex !== -1) {
              user.oauthProviders[providerIndex].accessToken = accessToken;
              user.oauthProviders[providerIndex].refreshToken = refreshToken;
              user.oauthProviders[providerIndex].lastUsed = new Date();
              await user.save();
            }
          }

          // Log successful login
          await logAudit({
            userId: user._id,
            action: 'login_success',
            category: 'authentication',
            details: {
              method: 'google_oauth',
              email: email
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Microsoft OAuth Strategy
 * Requires: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
 */
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/microsoft/callback`,
        scope: ['user.read'],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract user information
          const email = profile.emails?.[0]?.value || profile.userPrincipalName;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          if (!email) {
            return done(new Error('No email found in Microsoft profile'), null);
          }

          // Check if user exists with this OAuth provider
          let user = await User.findOne({
            'oauthProviders.provider': 'microsoft',
            'oauthProviders.providerId': profile.id
          });

          if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email });

            if (user) {
              // Link OAuth provider to existing account
              if (!user.oauthProviders) {
                user.oauthProviders = [];
              }
              user.oauthProviders.push({
                provider: 'microsoft',
                providerId: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profile: {
                  email,
                  displayName: profile.displayName,
                  firstName,
                  lastName
                }
              });
              user.emailVerified = true; // Trust Microsoft verification
              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'oauth_link',
                category: 'authentication',
                details: {
                  provider: 'microsoft',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            } else {
              // Create new user with Microsoft OAuth
              user = new User({
                email,
                username: email.split('@')[0] + '_' + Date.now(),
                firstName,
                lastName,
                role: 'rider', // Default role
                emailVerified: true, // Trust Microsoft verification
                oauthProviders: [
                  {
                    provider: 'microsoft',
                    providerId: profile.id,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    profile: {
                      email,
                      displayName: profile.displayName,
                      firstName,
                      lastName
                    }
                  }
                ]
              });

              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'user_created',
                category: 'user_management',
                details: {
                  method: 'microsoft_oauth',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            }
          } else {
            // Update existing OAuth connection
            const providerIndex = user.oauthProviders.findIndex(
              p => p.provider === 'microsoft'
            );
            if (providerIndex !== -1) {
              user.oauthProviders[providerIndex].accessToken = accessToken;
              user.oauthProviders[providerIndex].refreshToken = refreshToken;
              user.oauthProviders[providerIndex].lastUsed = new Date();
              await user.save();
            }
          }

          // Log successful login
          await logAudit({
            userId: user._id,
            action: 'login_success',
            category: 'authentication',
            details: {
              method: 'microsoft_oauth',
              email: email
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          return done(null, user);
        } catch (error) {
          console.error('Microsoft OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Apple OAuth Strategy
 * Requires: APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY_PATH
 */
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY_PATH
) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/apple/callback`,
        scope: ['name', 'email'],
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple only provides user info on first sign-in
          const email = profile.email;
          const firstName = profile.name?.firstName || '';
          const lastName = profile.name?.lastName || '';

          if (!email) {
            return done(new Error('No email found in Apple profile'), null);
          }

          // Check if user exists with this OAuth provider
          let user = await User.findOne({
            'oauthProviders.provider': 'apple',
            'oauthProviders.providerId': profile.sub
          });

          if (!user) {
            // Check if user exists with this email
            user = await User.findOne({ email });

            if (user) {
              // Link OAuth provider to existing account
              if (!user.oauthProviders) {
                user.oauthProviders = [];
              }
              user.oauthProviders.push({
                provider: 'apple',
                providerId: profile.sub,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profile: {
                  email,
                  firstName,
                  lastName
                }
              });
              user.emailVerified = true; // Trust Apple verification
              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'oauth_link',
                category: 'authentication',
                details: {
                  provider: 'apple',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            } else {
              // Create new user with Apple OAuth
              user = new User({
                email,
                username: email.split('@')[0] + '_' + Date.now(),
                firstName,
                lastName,
                role: 'rider', // Default role
                emailVerified: true, // Trust Apple verification
                oauthProviders: [
                  {
                    provider: 'apple',
                    providerId: profile.sub,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    profile: {
                      email,
                      firstName,
                      lastName
                    }
                  }
                ]
              });

              await user.save();

              // Log audit
              await logAudit({
                userId: user._id,
                action: 'user_created',
                category: 'user_management',
                details: {
                  method: 'apple_oauth',
                  email: email
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              });
            }
          } else {
            // Update existing OAuth connection
            const providerIndex = user.oauthProviders.findIndex(
              p => p.provider === 'apple'
            );
            if (providerIndex !== -1) {
              user.oauthProviders[providerIndex].accessToken = accessToken;
              user.oauthProviders[providerIndex].refreshToken = refreshToken;
              user.oauthProviders[providerIndex].lastUsed = new Date();
              await user.save();
            }
          }

          // Log successful login
          await logAudit({
            userId: user._id,
            action: 'login_success',
            category: 'authentication',
            details: {
              method: 'apple_oauth',
              email: email
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });

          return done(null, user);
        } catch (error) {
          console.error('Apple OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Get status of configured OAuth providers
 */
export const getOAuthStatus = () => {
  return {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY_PATH
    )
  };
};

export default passport;
