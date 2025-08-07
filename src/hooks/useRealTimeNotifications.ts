
import { useState, useEffect, useCallback } from 'react';
import { realTimeNotificationService, RealTimeNotification } from '@/services/realTimeNotificationService';

export const useRealTimeNotifications = (guardianId: string) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar notificações na inicialização
  useEffect(() => {
    const loadNotifications = () => {
      const stored = realTimeNotificationService.getNotificationsForGuardian(guardianId);
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

    const cleanup = realTimeNotificationService.subscribe(guardianId, handleNewNotification);

    return cleanup;
  }, [guardianId]);

  const markAsRead = useCallback((notification: RealTimeNotification) => {
    realTimeNotificationService.markAsRead(notification.id, guardianId);
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
  }, [guardianId]);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    unreadIds.forEach(id => realTimeNotificationService.markAsRead(id, guardianId));
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, [notifications, guardianId]);

  const deleteNotification = useCallback((notification: RealTimeNotification) => {
    realTimeNotificationService.deleteNotification(notification.id, guardianId);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }, [guardianId]);

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
