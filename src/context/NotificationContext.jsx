import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/service';

const NotificationContext = createContext();

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const getRole = () => localStorage.getItem('mimatcha_role') || '';

  const fetchNotifications = useCallback(async () => {
    try {
      const role = getRole();
      const result = await api.getNotifications(role);
      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling
  useEffect(() => {
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const role = getRole();
    await api.markAllNotificationsRead(role);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: 1 }))
    );
    setUnreadCount(0);
  };

  const addNotification = async (data) => {
    const result = await api.addNotification(data);
    if (result.success) {
      fetchNotifications(); // refresh immediately
    }
    return result;
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      addNotification,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
