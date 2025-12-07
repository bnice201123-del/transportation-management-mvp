import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count from server
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await axios.get('/api/notifications/unread-count');
      const count = response.data.count || 0;
      setUnreadCount(count);
      
      // Store in localStorage for cross-tab sync
      localStorage.setItem('unreadNotificationCount', count.toString());
      localStorage.setItem('unreadNotificationTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Broadcast to other tabs
      const newCount = Math.max(0, unreadCount - 1);
      localStorage.setItem('unreadNotificationCount', newCount.toString());
      localStorage.setItem('unreadNotificationTimestamp', Date.now().toString());
      
      // Trigger storage event manually for same tab
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [unreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      // Broadcast to other tabs
      localStorage.setItem('unreadNotificationCount', '0');
      localStorage.setItem('unreadNotificationTimestamp', Date.now().toString());
      
      // Trigger storage event manually for same tab
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }, []);

  // Refresh notification data
  const refresh = useCallback(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if notification count changed in another tab
      if (e.key === 'unreadNotificationCount' || e.key === 'unreadNotificationTimestamp') {
        const count = parseInt(localStorage.getItem('unreadNotificationCount') || '0', 10);
        setUnreadCount(count);
        // Also refresh notifications list to stay in sync
        fetchNotifications();
      }
    };

    const handleNotificationUpdate = () => {
      // Handle updates from same tab
      const count = parseInt(localStorage.getItem('unreadNotificationCount') || '0', 10);
      setUnreadCount(count);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [fetchNotifications]);

  // Initial fetch and polling
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount, fetchNotifications]);

  // Sync from localStorage on mount
  useEffect(() => {
    if (user) {
      const storedCount = parseInt(localStorage.getItem('unreadNotificationCount') || '0', 10);
      setUnreadCount(storedCount);
    }
  }, [user]);

  const value = {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
    fetchUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
