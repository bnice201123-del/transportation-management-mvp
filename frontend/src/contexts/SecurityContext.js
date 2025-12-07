import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

// Context for security operations
const SecurityContext = createContext({
  securityEvents: [],
  alerts: [],
  threatLevel: 'low',
  securityScore: 0,
  loading: false,
  addSecurityEvent: () => {},
  acknowledgeAlert: () => {},
  updateThreatLevel: () => {},
  refreshSecurityData: () => {},
  getSecurityMetrics: () => ({})
});

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  const toast = useToast();
  
  const [securityEvents, setSecurityEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [threatLevel, setThreatLevel] = useState('low');
  const [securityScore, setSecurityScore] = useState(85);
  const [loading, setLoading] = useState(false);

  // Initialize with mock data
  useEffect(() => {
    const mockEvents = [
      {
        id: 1,
        type: 'login_attempt',
        severity: 'low',
        message: 'Successful login attempt',
        user: 'admin@transportation.com',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        status: 'success'
      },
      {
        id: 2,
        type: 'failed_login',
        severity: 'medium',
        message: 'Failed login attempt - invalid password',
        user: 'unknown@test.com',
        ip: '203.0.113.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        status: 'failed'
      },
      {
        id: 3,
        type: 'suspicious_activity',
        severity: 'high',
        message: 'Multiple failed login attempts from same IP',
        user: 'N/A',
        ip: '203.0.113.1',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        status: 'blocked'
      },
      {
        id: 4,
        type: 'password_change',
        severity: 'low',
        message: 'Password successfully changed',
        user: 'driver@transportation.com',
        ip: '192.168.1.105',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        status: 'success'
      },
      {
        id: 5,
        type: 'session_timeout',
        severity: 'low',
        message: 'User session expired',
        user: 'dispatcher@transportation.com',
        ip: '192.168.1.102',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        status: 'info'
      }
    ];

    setSecurityEvents(mockEvents);
    calculateThreatLevel(mockEvents);
  }, []);

  const addSecurityEvent = useCallback(async (eventData) => {
    try {
      setLoading(true);
      
      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...eventData
      };

      setSecurityEvents(prev => [newEvent, ...prev]);

      // Create alert for high severity events
      if (eventData.severity === 'high' || eventData.severity === 'critical') {
        const alert = {
          id: Date.now() + 1,
          type: 'security_event',
          severity: eventData.severity,
          message: `High priority security event: ${eventData.message}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          eventId: newEvent.id
        };

        setAlerts(prev => [alert, ...prev]);

        toast({
          title: 'Security Alert',
          description: alert.message,
          status: eventData.severity === 'critical' ? 'error' : 'warning',
          duration: 8000,
          isClosable: true,
        });
      }

      // Recalculate threat level
      const updatedEvents = [newEvent, ...securityEvents];
      calculateThreatLevel(updatedEvents);

      return { success: true, event: newEvent };
    } catch (error) {
      console.error('Add security event error:', error);
      toast({
        title: 'Security Event Failed',
        description: 'Failed to add security event',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [securityEvents, toast]);

  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : alert
      ));

      toast({
        title: 'Alert Acknowledged',
        description: 'Security alert has been acknowledged',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      return { success: false, error: error.message };
    }
  }, [toast]);

  const calculateThreatLevel = useCallback((events) => {
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventDate > oneDayAgo;
    });

    const highSeverityCount = recentEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length;
    const mediumSeverityCount = recentEvents.filter(e => e.severity === 'medium').length;
    const failedLoginCount = recentEvents.filter(e => e.type === 'failed_login').length;
    
    let newThreatLevel = 'low';
    let newScore = 85;

    if (highSeverityCount > 3) {
      newThreatLevel = 'critical';
      newScore = 40;
    } else if (highSeverityCount > 1 || failedLoginCount > 10) {
      newThreatLevel = 'high';
      newScore = 55;
    } else if (highSeverityCount > 0 || mediumSeverityCount > 5 || failedLoginCount > 5) {
      newThreatLevel = 'medium';
      newScore = 70;
    }

    setThreatLevel(newThreatLevel);
    setSecurityScore(newScore);
  }, []);

  const updateThreatLevel = useCallback((level) => {
    setThreatLevel(level);
    
    const scores = {
      low: 85,
      medium: 70,
      high: 55,
      critical: 40
    };
    
    setSecurityScore(scores[level] || 85);
  }, []);

  const refreshSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Recalculate metrics
      calculateThreatLevel(securityEvents);

      toast({
        title: 'Security Data Refreshed',
        description: 'Latest security metrics have been loaded',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Refresh security data error:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh security data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [securityEvents, calculateThreatLevel, toast]);

  const getSecurityMetrics = useCallback(() => {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const todayEvents = securityEvents.filter(e => new Date(e.timestamp) > oneDayAgo);
    const weekEvents = securityEvents.filter(e => new Date(e.timestamp) > oneWeekAgo);

    return {
      totalEvents: securityEvents.length,
      todayEvents: todayEvents.length,
      weekEvents: weekEvents.length,
      failedLogins: securityEvents.filter(e => e.type === 'failed_login').length,
      successfulLogins: securityEvents.filter(e => e.type === 'login_attempt' && e.status === 'success').length,
      highSeverityEvents: securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length,
      activeAlerts: alerts.filter(a => !a.acknowledged).length,
      threatLevel,
      securityScore,
      trends: {
        eventsToday: todayEvents.length,
        eventsYesterday: securityEvents.filter(e => {
          const eventDate = new Date(e.timestamp);
          const yesterdayStart = new Date(oneDayAgo - 24 * 60 * 60 * 1000);
          return eventDate > yesterdayStart && eventDate <= oneDayAgo;
        }).length,
        failedLoginsToday: todayEvents.filter(e => e.type === 'failed_login').length,
        alertsToday: alerts.filter(a => new Date(a.timestamp) > oneDayAgo).length
      }
    };
  }, [securityEvents, alerts, threatLevel, securityScore]);

  const clearAlert = useCallback(async (alertId) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: 'Alert Cleared',
        description: 'Security alert has been removed',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Clear alert error:', error);
      return { success: false, error: error.message };
    }
  }, [toast]);

  const bulkAcknowledgeAlerts = useCallback(async (alertIds) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id)
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : alert
      ));

      toast({
        title: 'Alerts Acknowledged',
        description: `${alertIds.length} alerts have been acknowledged`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Bulk acknowledge alerts error:', error);
      return { success: false, error: error.message };
    }
  }, [toast]);

  const value = {
    securityEvents,
    alerts,
    threatLevel,
    securityScore,
    loading,
    setSecurityEvents,
    setAlerts,
    addSecurityEvent,
    acknowledgeAlert,
    clearAlert,
    bulkAcknowledgeAlerts,
    updateThreatLevel,
    refreshSecurityData,
    getSecurityMetrics,
    calculateThreatLevel
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};