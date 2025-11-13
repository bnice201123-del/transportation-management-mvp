import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

// Security utility functions for cross-application use

// Hook for security operations and monitoring
export const useSecurityOperations = () => {
  const toast = useToast();

  const formatSecurityScore = useCallback((score) => {
    if (score >= 90) return { label: 'Excellent', color: 'green', icon: '🛡️' };
    if (score >= 75) return { label: 'Good', color: 'blue', icon: '🔒' };
    if (score >= 60) return { label: 'Fair', color: 'yellow', icon: '⚠️' };
    return { label: 'Poor', color: 'red', icon: '🚨' };
  }, []);

  const calculateThreatLevel = useCallback((events) => {
    if (!events || events.length === 0) return 'low';
    
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventDate > oneDayAgo;
    });

    const highSeverityCount = recentEvents.filter(e => e.severity === 'high').length;
    const mediumSeverityCount = recentEvents.filter(e => e.severity === 'medium').length;
    
    if (highSeverityCount > 5) return 'critical';
    if (highSeverityCount > 2 || mediumSeverityCount > 10) return 'high';
    if (highSeverityCount > 0 || mediumSeverityCount > 5) return 'medium';
    return 'low';
  }, []);

  const validateSecurityPolicy = useCallback((policy) => {
    const validations = {
      passwordMinLength: policy.passwordMinLength >= 8,
      requireSpecialChars: policy.requireSpecialChars === true,
      sessionTimeout: policy.sessionTimeout > 0 && policy.sessionTimeout <= 480,
      maxLoginAttempts: policy.maxLoginAttempts >= 3 && policy.maxLoginAttempts <= 10,
      mfaRequired: typeof policy.mfaRequired === 'boolean'
    };

    const isValid = Object.values(validations).every(v => v === true);
    return { isValid, validations };
  }, []);

  const generateSecurityReport = useCallback((events, policies, users) => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEvents: events.length,
        threatLevel: calculateThreatLevel(events),
        activeSessions: users.filter(u => u.isActive).length,
        failedLogins: events.filter(e => e.type === 'failed_login').length,
        securityScore: 85 // This would be calculated based on various factors
      },
      recommendations: []
    };

    // Add recommendations based on analysis
    if (report.summary.failedLogins > 10) {
      report.recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'High number of failed login attempts detected. Consider implementing IP blocking or enhanced monitoring.'
      });
    }

    if (report.summary.threatLevel === 'high' || report.summary.threatLevel === 'critical') {
      report.recommendations.push({
        type: 'alert',
        priority: 'critical',
        message: 'Elevated threat level detected. Immediate security review recommended.'
      });
    }

    return report;
  }, [calculateThreatLevel]);

  return {
    formatSecurityScore,
    calculateThreatLevel,
    validateSecurityPolicy,
    generateSecurityReport
  };
};

// Hook for authentication and authorization
export const useAuthSecurity = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    permissions: [],
    mfaEnabled: false,
    sessionExpiry: null
  });

  const checkPermission = useCallback((permission) => {
    if (!authState.permissions) return false;
    return authState.permissions.includes(permission) || authState.permissions.includes('admin');
  }, [authState.permissions]);

  const checkRoleAccess = useCallback((requiredRole) => {
    if (!authState.user) return false;
    return authState.user.roles?.includes(requiredRole) || authState.user.roles?.includes('admin');
  }, [authState.user]);

  const validateSession = useCallback(() => {
    if (!authState.sessionExpiry) return false;
    return new Date() < new Date(authState.sessionExpiry);
  }, [authState.sessionExpiry]);

  const getSessionTimeRemaining = useCallback(() => {
    if (!authState.sessionExpiry) return 0;
    const remaining = new Date(authState.sessionExpiry) - new Date();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // minutes
  }, [authState.sessionExpiry]);

  const refreshSession = useCallback(async () => {
    try {
      // In real app, this would call your API
      const newExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      setAuthState(prev => ({ ...prev, sessionExpiry: newExpiry.toISOString() }));
      return { success: true };
    } catch (error) {
      console.error('Session refresh failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    authState,
    setAuthState,
    checkPermission,
    checkRoleAccess,
    validateSession,
    getSessionTimeRemaining,
    refreshSession
  };
};

// Hook for security monitoring and alerts
export const useSecurityMonitoring = () => {
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [monitoring, setMonitoring] = useState(false);

  const createAlert = useCallback((type, severity, message, metadata = {}) => {
    const alert = {
      id: Date.now(),
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata
    };

    setAlerts(prev => [alert, ...prev]);

    // Show toast for high/critical alerts
    if (severity === 'high' || severity === 'critical') {
      toast({
        title: 'Security Alert',
        description: message,
        status: severity === 'critical' ? 'error' : 'warning',
        duration: 8000,
        isClosable: true,
      });
    }

    return alert;
  }, [toast]);

  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const monitorSecurityEvents = useCallback((events) => {
    if (!monitoring) return;

    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return eventDate > fiveMinutesAgo;
    });

    // Check for suspicious patterns
    const failedLogins = recentEvents.filter(e => e.type === 'failed_login');
    if (failedLogins.length > 3) {
      createAlert(
        'suspicious_activity',
        'high',
        `Multiple failed login attempts detected (${failedLogins.length} in 5 minutes)`,
        { eventCount: failedLogins.length, events: failedLogins }
      );
    }

    // Check for high severity events
    const highSeverityEvents = recentEvents.filter(e => e.severity === 'high');
    if (highSeverityEvents.length > 0) {
      highSeverityEvents.forEach(event => {
        createAlert(
          event.type,
          'high',
          `High severity security event: ${event.message}`,
          { originalEvent: event }
        );
      });
    }
  }, [monitoring, createAlert]);

  const startMonitoring = useCallback(() => {
    setMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setMonitoring(false);
  }, []);

  return {
    alerts,
    monitoring,
    createAlert,
    acknowledgeAlert,
    clearAlert,
    monitorSecurityEvents,
    startMonitoring,
    stopMonitoring
  };
};

// Hook for compliance and audit trails
export const useComplianceManager = () => {
  const [auditTrail, setAuditTrail] = useState([]);
  const [complianceScores, setComplianceScores] = useState({});

  const logAuditEvent = useCallback((action, details, userId, userRole) => {
    const auditEvent = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
      userId,
      userRole,
      ip: '192.168.1.1', // In real app, get from request
      userAgent: navigator.userAgent
    };

    setAuditTrail(prev => [auditEvent, ...prev.slice(0, 999)]); // Keep last 1000 events
    return auditEvent;
  }, []);

  const generateComplianceReport = useCallback((framework = 'SOC2') => {
    const report = {
      framework,
      timestamp: new Date().toISOString(),
      scores: {
        accessControl: calculateAccessControlScore(),
        dataProtection: calculateDataProtectionScore(),
        monitoring: calculateMonitoringScore(),
        incidentResponse: calculateIncidentResponseScore()
      },
      recommendations: [],
      auditTrailSummary: {
        totalEvents: auditTrail.length,
        recentEvents: auditTrail.filter(e => {
          const eventDate = new Date(e.timestamp);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return eventDate > thirtyDaysAgo;
        }).length
      }
    };

    // Calculate overall score
    const scores = Object.values(report.scores);
    report.overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    return report;
  }, [auditTrail]);

  const calculateAccessControlScore = useCallback(() => {
    // Mock calculation - in real app this would analyze actual access controls
    return 85;
  }, []);

  const calculateDataProtectionScore = useCallback(() => {
    // Mock calculation - in real app this would analyze data protection measures
    return 92;
  }, []);

  const calculateMonitoringScore = useCallback(() => {
    // Mock calculation - in real app this would analyze monitoring coverage
    return 78;
  }, []);

  const calculateIncidentResponseScore = useCallback(() => {
    // Mock calculation - in real app this would analyze incident response capabilities
    return 88;
  }, []);

  const exportAuditTrail = useCallback((format = 'json', dateRange = null) => {
    let filteredTrail = auditTrail;

    if (dateRange) {
      filteredTrail = auditTrail.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }

    if (format === 'csv') {
      const headers = ['Timestamp', 'Action', 'User ID', 'User Role', 'IP Address', 'Details'];
      const csvContent = [
        headers.join(','),
        ...filteredTrail.map(event => [
          event.timestamp,
          event.action,
          event.userId,
          event.userRole,
          event.ip,
          JSON.stringify(event.details).replace(/"/g, '""')
        ].join(','))
      ].join('\n');

      return csvContent;
    }

    return JSON.stringify(filteredTrail, null, 2);
  }, [auditTrail]);

  return {
    auditTrail,
    complianceScores,
    logAuditEvent,
    generateComplianceReport,
    exportAuditTrail
  };
};

// Hook for vulnerability assessment
export const useVulnerabilityAssessment = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [scanResults, setScanResults] = useState(null);

  const performSecurityScan = useCallback(async () => {
    try {
      // Mock security scan - in real app this would integrate with security tools
      const mockVulnerabilities = [
        {
          id: 1,
          type: 'weak_password_policy',
          severity: 'medium',
          title: 'Weak Password Requirements',
          description: 'Current password policy may allow weak passwords',
          recommendation: 'Increase minimum password length to 12 characters and require mixed case',
          affectedComponents: ['authentication_system'],
          cvssScore: 5.3
        },
        {
          id: 2,
          type: 'outdated_dependencies',
          severity: 'high',
          title: 'Outdated Security Dependencies',
          description: 'Some security libraries are outdated and may contain vulnerabilities',
          recommendation: 'Update all security-related dependencies to latest versions',
          affectedComponents: ['web_framework', 'authentication_library'],
          cvssScore: 7.2
        }
      ];

      setVulnerabilities(mockVulnerabilities);
      setScanResults({
        timestamp: new Date().toISOString(),
        totalVulnerabilities: mockVulnerabilities.length,
        criticalCount: mockVulnerabilities.filter(v => v.severity === 'critical').length,
        highCount: mockVulnerabilities.filter(v => v.severity === 'high').length,
        mediumCount: mockVulnerabilities.filter(v => v.severity === 'medium').length,
        lowCount: mockVulnerabilities.filter(v => v.severity === 'low').length,
        overallRisk: 'medium'
      });

      return { success: true, results: mockVulnerabilities };
    } catch (error) {
      console.error('Security scan failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const prioritizeVulnerabilities = useCallback(() => {
    return vulnerabilities
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aSeverity = severityOrder[a.severity] || 0;
        const bSeverity = severityOrder[b.severity] || 0;
        
        if (aSeverity !== bSeverity) return bSeverity - aSeverity;
        return b.cvssScore - a.cvssScore;
      });
  }, [vulnerabilities]);

  const markVulnerabilityFixed = useCallback((vulnerabilityId) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vuln.id === vulnerabilityId 
        ? { ...vuln, status: 'fixed', fixedAt: new Date().toISOString() }
        : vuln
    ));
  }, []);

  return {
    vulnerabilities,
    scanResults,
    performSecurityScan,
    prioritizeVulnerabilities,
    markVulnerabilityFixed
  };
};

export default {
  useSecurityOperations,
  useAuthSecurity,
  useSecurityMonitoring,
  useComplianceManager,
  useVulnerabilityAssessment
};