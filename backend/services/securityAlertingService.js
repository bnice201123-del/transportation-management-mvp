/**
 * Real-time Security Alerting Service
 * 
 * Monitors security events and creates alerts based on thresholds and patterns.
 * Runs continuously in the background.
 */

import SecurityAlert from '../models/SecurityAlert.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

class SecurityAlertingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkIntervalMs = 5 * 60 * 1000; // 5 minutes
    
    // Thresholds
    this.thresholds = {
      failedLoginsPerIP: 5,           // Failed logins from same IP in 1 hour
      failedLoginsPerUser: 3,         // Failed logins for same user in 1 hour
      rateLimitViolations: 50,        // Rate limit violations in 1 hour
      suspiciousSessionActivity: 10,  // Suspicious session events in 1 hour
      unauthorizedAccess: 5,          // Unauthorized access attempts in 1 hour
      dataExfiltration: 100           // Data export requests in 1 hour (MB)
    };
    
    // Alert suppression to prevent duplicate alerts
    this.alertCache = new Map();
    this.cacheExpiryMs = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Start the alerting service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Security Alerting Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚨 Security Alerting Service started');
    
    // Run immediately
    this.runChecks();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runChecks();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the alerting service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Security Alerting Service stopped');
  }

  /**
   * Run all security checks
   */
  async runChecks() {
    try {
      console.log('🔍 Running security checks...');
      
      const now = new Date();
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      
      await Promise.all([
        this.checkFailedLogins(oneHourAgo),
        this.checkRateLimitViolations(oneHourAgo),
        this.checkUnauthorizedAccess(oneHourAgo),
        this.checkSuspiciousSessions(oneHourAgo),
        this.checkPermissionViolations(oneHourAgo),
        this.checkDataExfiltration(oneHourAgo)
      ]);
      
      // Clean up old cache entries
      this.cleanupCache();
      
      console.log('✅ Security checks completed');
    } catch (error) {
      console.error('❌ Error running security checks:', error);
    }
  }

  /**
   * Check for failed login attempts
   */
  async checkFailedLogins(since) {
    try {
      // Check failed logins by IP address
      const failedLoginsByIP = await AuditLog.aggregate([
        {
          $match: {
            action: 'login_failed',
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
            usernames: { $addToSet: '$metadata.username' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        {
          $match: { count: { $gte: this.thresholds.failedLoginsPerIP } }
        }
      ]);

      for (const login of failedLoginsByIP) {
        const cacheKey = `failed_login_ip_${login._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        await SecurityAlert.createAlert({
          type: 'brute_force_attack',
          severity: login.count >= 10 ? 'critical' : 'high',
          title: 'Potential Brute Force Attack Detected',
          description: `${login.count} failed login attempts from IP ${login._id} in the last hour. Targeted usernames: ${login.usernames.join(', ')}`,
          source: {
            component: 'authentication',
            endpoint: '/api/auth/login',
            method: 'POST'
          },
          actor: {
            ipAddress: login._id
          },
          metrics: {
            count: login.count,
            failureCount: login.count
          },
          detection: {
            method: 'threshold',
            confidence: 95,
            ruleName: 'Failed Logins by IP'
          },
          tags: ['authentication', 'brute-force', 'automated']
        });

        this.cacheAlert(cacheKey);
      }

      // Check failed logins by username
      const failedLoginsByUser = await AuditLog.aggregate([
        {
          $match: {
            action: 'login_failed',
            timestamp: { $gte: since },
            'metadata.username': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$metadata.username',
            count: { $sum: 1 },
            ips: { $addToSet: '$ipAddress' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        {
          $match: { count: { $gte: this.thresholds.failedLoginsPerUser } }
        }
      ]);

      for (const login of failedLoginsByUser) {
        const cacheKey = `failed_login_user_${login._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        await SecurityAlert.createAlert({
          type: 'account_takeover',
          severity: 'high',
          title: 'Potential Account Takeover Attempt',
          description: `${login.count} failed login attempts for user ${login._id} from ${login.ips.length} different IP(s)`,
          source: {
            component: 'authentication',
            endpoint: '/api/auth/login',
            method: 'POST'
          },
          actor: {
            username: login._id
          },
          metrics: {
            count: login.count,
            failureCount: login.count
          },
          detection: {
            method: 'threshold',
            confidence: 85,
            ruleName: 'Failed Logins by User'
          },
          tags: ['authentication', 'account-takeover']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking failed logins:', error);
    }
  }

  /**
   * Check for rate limit violations
   */
  async checkRateLimitViolations(since) {
    try {
      const violations = await AuditLog.aggregate([
        {
          $match: {
            action: 'rate_limit_exceeded',
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
            endpoints: { $addToSet: '$metadata.endpoint' }
          }
        },
        {
          $match: { count: { $gte: this.thresholds.rateLimitViolations } }
        }
      ]);

      for (const violation of violations) {
        const cacheKey = `rate_limit_${violation._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        await SecurityAlert.createAlert({
          type: 'rate_limit_exceeded',
          severity: violation.count >= 100 ? 'critical' : 'high',
          title: 'Excessive Rate Limit Violations',
          description: `${violation.count} rate limit violations from IP ${violation._id} targeting ${violation.endpoints.length} endpoints`,
          source: {
            component: 'rate_limiter'
          },
          actor: {
            ipAddress: violation._id
          },
          metrics: {
            count: violation.count
          },
          detection: {
            method: 'threshold',
            confidence: 100,
            ruleName: 'Rate Limit Violations'
          },
          tags: ['rate-limiting', 'abuse', 'ddos']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking rate limits:', error);
    }
  }

  /**
   * Check for unauthorized access attempts
   */
  async checkUnauthorizedAccess(since) {
    try {
      const unauthorizedAccess = await AuditLog.aggregate([
        {
          $match: {
            action: { $in: ['access_denied', 'authorization_failed', 'permission_denied'] },
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              userId: '$performedBy',
              ipAddress: '$ipAddress'
            },
            count: { $sum: 1 },
            resources: { $addToSet: '$resourceType' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        {
          $match: { count: { $gte: this.thresholds.unauthorizedAccess } }
        }
      ]);

      for (const access of unauthorizedAccess) {
        const cacheKey = `unauthorized_${access._id.userId}_${access._id.ipAddress}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        await SecurityAlert.createAlert({
          type: 'unauthorized_access',
          severity: access.count >= 20 ? 'critical' : 'high',
          title: 'Multiple Unauthorized Access Attempts',
          description: `${access.count} unauthorized access attempts to ${access.resources.length} different resources`,
          source: {
            component: 'authorization'
          },
          actor: {
            userId: access._id.userId,
            ipAddress: access._id.ipAddress
          },
          metrics: {
            count: access.count,
            failureCount: access.count
          },
          detection: {
            method: 'threshold',
            confidence: 90,
            ruleName: 'Unauthorized Access Attempts'
          },
          tags: ['authorization', 'privilege-escalation']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking unauthorized access:', error);
    }
  }

  /**
   * Check for suspicious session activity
   */
  async checkSuspiciousSessions(since) {
    try {
      // Check for sessions with multiple IPs
      const sessionsWithMultipleIPs = await Session.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$userId',
            ipCount: { $addToSet: '$ipAddress' },
            sessionCount: { $sum: 1 }
          }
        },
        {
          $match: {
            $expr: { $gte: [{ $size: '$ipCount' }, 3] }
          }
        }
      ]);

      for (const session of sessionsWithMultipleIPs) {
        const cacheKey = `suspicious_session_${session._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        const user = await User.findById(session._id).select('username email role');

        await SecurityAlert.createAlert({
          type: 'session_anomaly',
          severity: 'medium',
          title: 'Suspicious Session Activity',
          description: `User ${user?.username || session._id} has ${session.sessionCount} active sessions from ${session.ipCount.length} different IPs`,
          source: {
            component: 'session_manager'
          },
          actor: {
            userId: session._id,
            username: user?.username,
            email: user?.email,
            role: user?.role
          },
          metrics: {
            count: session.sessionCount
          },
          detection: {
            method: 'pattern_matching',
            confidence: 70,
            ruleName: 'Multiple IP Sessions'
          },
          tags: ['session', 'anomaly', 'account-sharing']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking suspicious sessions:', error);
    }
  }

  /**
   * Check for permission violations
   */
  async checkPermissionViolations(since) {
    try {
      const violations = await AuditLog.aggregate([
        {
          $match: {
            action: { $in: ['permission_denied', 'permission_violation'] },
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$performedBy',
            count: { $sum: 1 },
            resources: { $addToSet: '$resourceType' }
          }
        },
        {
          $match: { count: { $gte: 5 } }
        }
      ]);

      for (const violation of violations) {
        const cacheKey = `permission_violation_${violation._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        const user = await User.findById(violation._id).select('username email role');

        await SecurityAlert.createAlert({
          type: 'permission_violation',
          severity: 'medium',
          title: 'Multiple Permission Violations',
          description: `User ${user?.username || violation._id} attempted to access ${violation.count} restricted resources`,
          source: {
            component: 'authorization'
          },
          actor: {
            userId: violation._id,
            username: user?.username,
            email: user?.email,
            role: user?.role
          },
          metrics: {
            count: violation.count
          },
          detection: {
            method: 'threshold',
            confidence: 80,
            ruleName: 'Permission Violations'
          },
          tags: ['permissions', 'access-control']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking permission violations:', error);
    }
  }

  /**
   * Check for data exfiltration attempts
   */
  async checkDataExfiltration(since) {
    try {
      const exportActivity = await AuditLog.aggregate([
        {
          $match: {
            action: { $in: ['data_exported', 'gdpr_export_requested', 'bulk_export'] },
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$performedBy',
            count: { $sum: 1 },
            totalSize: { $sum: { $toInt: { $ifNull: ['$metadata.size', '0'] } } }
          }
        },
        {
          $match: { 
            $or: [
              { count: { $gte: 10 } },
              { totalSize: { $gte: this.thresholds.dataExfiltration * 1024 * 1024 } }
            ]
          }
        }
      ]);

      for (const activity of exportActivity) {
        const cacheKey = `data_exfiltration_${activity._id}`;
        if (!this.shouldCreateAlert(cacheKey)) continue;

        const user = await User.findById(activity._id).select('username email role');

        await SecurityAlert.createAlert({
          type: 'data_exfiltration',
          severity: 'critical',
          title: 'Potential Data Exfiltration Detected',
          description: `User ${user?.username || activity._id} performed ${activity.count} data exports (${(activity.totalSize / 1024 / 1024).toFixed(2)} MB)`,
          source: {
            component: 'application'
          },
          actor: {
            userId: activity._id,
            username: user?.username,
            email: user?.email,
            role: user?.role
          },
          metrics: {
            count: activity.count,
            dataVolume: activity.totalSize
          },
          detection: {
            method: 'threshold',
            confidence: 85,
            ruleName: 'Data Exfiltration'
          },
          tags: ['data-loss', 'exfiltration', 'critical']
        });

        this.cacheAlert(cacheKey);
      }
    } catch (error) {
      console.error('Error checking data exfiltration:', error);
    }
  }

  /**
   * Check if alert should be created (avoid duplicates)
   */
  shouldCreateAlert(cacheKey) {
    const cached = this.alertCache.get(cacheKey);
    if (cached && (Date.now() - cached < this.cacheExpiryMs)) {
      return false; // Alert already created recently
    }
    return true;
  }

  /**
   * Cache alert to prevent duplicates
   */
  cacheAlert(cacheKey) {
    this.alertCache.set(cacheKey, Date.now());
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.alertCache.entries()) {
      if (now - timestamp > this.cacheExpiryMs) {
        this.alertCache.delete(key);
      }
    }
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('🔧 Security thresholds updated:', this.thresholds);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      thresholds: this.thresholds,
      cachedAlerts: this.alertCache.size,
      lastCheck: new Date()
    };
  }
}

// Create singleton instance
const securityAlertingService = new SecurityAlertingService();

export default securityAlertingService;
