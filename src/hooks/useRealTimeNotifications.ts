
import { useState, useEffect, useCallback } from 'react';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';

export interface RealTimeNotification {
  id: string;
  type: 'route_started' | 'student_picked_up' | 'student_dropped_off' | 'arriving_soon' | 'arrived_at_location' | 'route_completed' | 'route_delayed';
  message: string;
  timestamp: string;
  isRead: boolean;
  studentName?: string;
  location?: {
    lat: number;
    lng: number;
  };
  routeId?: string;
  guardianIds: string[];
}

export const useRealTimeNotifications = (guardianId: string) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar notificações do localStorage na inicialização
  useEffect(() => {
    const loadNotifications = () => {
      const stored = realTimeNotificationService.getNotifications(guardianId);
      setNotifications(stored);
      setIsLoading(false);
    };

    loadNotifications();
  }, [guardianId]);

  // Escutar novas notificações
  useEffect(() => {
    const handleNewNotification = (notification: RealTimeNotification) => {
      if (notification.guardianIds.includes(guardianId)) {
        setNotifications(prev => [notification, ...prev]);
      }
    };

    realTimeNotificationService.addListener(handleNewNotification);

    return () => {
      realTimeNotificationService.removeListener(handleNewNotification);
    };
  }, [guardianId]);

  const markAsRead = useCallback((notification: RealTimeNotification) => {
    realTimeNotificationService.markAsRead(notification.id);
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    unreadIds.forEach(id => realTimeNotificationService.markAsRead(id));
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, [notifications]);

  const deleteNotification = useCallback((notification: RealTimeNotification) => {
    realTimeNotificationService.deleteNotification(notification.id);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading
  };
};
