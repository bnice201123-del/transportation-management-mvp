import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import RateLimitViolation from '../models/RateLimitViolation.js';
import { logAudit } from './audit.js';

// Initialize Redis client (optional - falls back to memory store)
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    console.log('✅ Rate limiting using Redis store');
  } else {
    console.log('⚠️  Rate limiting using memory store (Redis URL not configured)');
  }
} catch (error) {
  console.warn('⚠️  Redis connection failed, using memory store for rate limiting:', error.message);
}

/**
 * Rate Limit Configurations
 * Define different rate limits for different endpoint types
 */
export const rateLimitConfig = {
  // Strict limits for authentication endpoints (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Moderate limits for API endpoints (normal usage)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Relaxed limits for read operations
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Too many requests. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Very strict limits for expensive operations
  expensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Rate limit exceeded for this operation. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Strict limits for data export/deletion (GDPR)
  gdpr: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: 'Too many GDPR requests. Please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Moderate limits for file uploads
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 uploads per window
    message: 'Too many upload requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Strict limits for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset requests. Please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Limits for 2FA operations
  twoFactor: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many 2FA attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Limits for admin operations
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Higher limit for admins
    message: 'Admin rate limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Global fallback limit
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window per IP
    message: 'Global rate limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

/**
 * Create rate limiter with optional Redis store
 */
function createRateLimiter(config, name = 'default') {
  const limiterConfig = {
    ...config,
    // Use standard headers and legacy headers for compatibility
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs (e.g., internal services)
      const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      return whitelist.includes(req.ip);
    },
    handler: async (req, res) => {
      // Log rate limit violations to database
      try {
        await RateLimitViolation.logViolation({
          userId: req.user?._id,
          ipAddress: req.ip,
          endpoint: req.path,
          method: req.method,
          limiterType: name,
          userAgent: req.headers['user-agent'],
          username: req.user?.username,
          userRole: req.user?.role,
          isAuthenticated: !!req.user,
          limit: config.max,
          windowMs: config.windowMs,
          current: req.rateLimit?.current,
          responseMessage: config.message,
          headers: {
            'user-agent': req.headers['user-agent'],
            'origin': req.headers.origin,
            'referer': req.headers.referer
          }
        });

        // Log high/critical severity violations to audit log
        const recentViolations = await RateLimitViolation.countDocuments({
          ipAddress: req.ip,
          violatedAt: { $gte: new Date(Date.now() - 3600000) }
        });

        if (recentViolations >= 5) {
          await logAudit({
            userId: req.user?._id,
            username: req.user?.username || 'anonymous',
            userRole: req.user?.role || 'guest',
            action: 'rate_limit_violation',
            category: 'security',
            description: `Multiple rate limit violations detected (${recentViolations} in last hour)`,
            targetType: 'RateLimit',
            targetId: name,
            metadata: {
              ipAddress: req.ip,
              endpoint: req.path,
              method: req.method,
              userAgent: req.headers['user-agent'],
              violationCount: recentViolations
            },
            severity: recentViolations >= 10 ? 'critical' : 'high',
            success: false
          });
        }
      } catch (error) {
        console.error('Error logging rate limit violation:', error);
      }

      // Console log for immediate visibility
      console.warn(`Rate limit exceeded for ${name}:`, {
        ip: req.ip,
        path: req.path,
        method: req.method,
        user: req.user?.username || 'anonymous'
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
    // keyGenerator removed - using default which handles IPv6 properly
  };

  // Add Redis store if available
  if (redisClient) {
    limiterConfig.store = new RedisStore({
      client: redisClient,
      prefix: `rate-limit:${name}:`,
    });
  }

  return rateLimit(limiterConfig);
}

/**
 * Rate Limiters
 */
export const authLimiter = createRateLimiter(rateLimitConfig.auth, 'auth');
export const apiLimiter = createRateLimiter(rateLimitConfig.api, 'api');
export const readLimiter = createRateLimiter(rateLimitConfig.read, 'read');
export const expensiveLimiter = createRateLimiter(rateLimitConfig.expensive, 'expensive');
export const gdprLimiter = createRateLimiter(rateLimitConfig.gdpr, 'gdpr');
export const uploadLimiter = createRateLimiter(rateLimitConfig.upload, 'upload');
export const passwordResetLimiter = createRateLimiter(rateLimitConfig.passwordReset, 'passwordReset');
export const twoFactorLimiter = createRateLimiter(rateLimitConfig.twoFactor, 'twoFactor');
export const adminLimiter = createRateLimiter(rateLimitConfig.admin, 'admin');
export const globalLimiter = createRateLimiter(rateLimitConfig.global, 'global');

/**
 * Conditional rate limiter based on user role
 */
export const createConditionalLimiter = (userLimiter, guestLimiter) => {
  return (req, res, next) => {
    if (req.user) {
      return userLimiter(req, res, next);
    }
    return guestLimiter(req, res, next);
  };
};

/**
 * Custom rate limiter for specific needs
 */
export const createCustomLimiter = (options) => {
  return createRateLimiter(options, options.name || 'custom');
};

/**
 * Rate limit monitoring - Get current rate limit info
 */
export const getRateLimitInfo = async (key) => {
  if (!redisClient) {
    return null;
  }

  try {
    const keys = await redisClient.keys(`rate-limit:*:${key}`);
    const info = {};

    for (const redisKey of keys) {
      const value = await redisClient.get(redisKey);
      const ttl = await redisClient.ttl(redisKey);
      
      const limiterName = redisKey.split(':')[1];
      info[limiterName] = {
        current: parseInt(value) || 0,
        ttl: ttl,
        resetAt: new Date(Date.now() + ttl * 1000)
      };
    }

    return info;
  } catch (error) {
    console.error('Error getting rate limit info:', error);
    return null;
  }
};

/**
 * Reset rate limit for specific key (admin function)
 */
export const resetRateLimit = async (key) => {
  if (!redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(`rate-limit:*:${key}`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
};

/**
 * Get rate limit statistics
 */
export const getRateLimitStats = async () => {
  if (!redisClient) {
    return { error: 'Redis not configured' };
  }

  try {
    const keys = await redisClient.keys('rate-limit:*');
    const stats = {
      totalKeys: keys.length,
      byLimiter: {},
      byType: {}
    };

    for (const key of keys) {
      const parts = key.split(':');
      const limiterName = parts[1];
      const keyType = parts[2]; // 'user' or 'ip'

      // Count by limiter
      stats.byLimiter[limiterName] = (stats.byLimiter[limiterName] || 0) + 1;

      // Count by type
      stats.byType[keyType] = (stats.byType[keyType] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return { error: error.message };
  }
};

export default {
  authLimiter,
  apiLimiter,
  readLimiter,
  expensiveLimiter,
  gdprLimiter,
  uploadLimiter,
  passwordResetLimiter,
  twoFactorLimiter,
  adminLimiter,
  globalLimiter,
  createConditionalLimiter,
  createCustomLimiter,
  getRateLimitInfo,
  resetRateLimit,
  getRateLimitStats
};
