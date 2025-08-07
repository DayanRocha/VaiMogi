import { useState, useEffect, useCallback } from 'react';
import { realTimeNotificationService, RealTimeNotification } from '@/services/realTimeNotificationService';
import { audioService } from '@/services/audioService';

export const useRealTimeNotifications = (guardianId: string) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar notificações existentes
  useEffect(() => {
    const existingNotifications = realTimeNotificationService.getNotificationsForGuardian(guardianId);
    setNotifications(existingNotifications);
    setUnreadCount(existingNotifications.filter(n => !n.isRead).length);
  }, [guardianId]);

  // Callback para processar nova notificação
  const handleNewNotification = useCallback(async (notification: RealTimeNotification) => {
    console.log('🔔 Nova notificação recebida:', notification.title);

    // Verificar se já existe para evitar duplicação
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Notificação duplicada ignorada:', notification.id);
        return prev;
      }
      
      // Adicionar nova notificação
      setUnreadCount(prevCount => prevCount + 1);
      return [notification, ...prev];
    });

    // Tocar som de notificação
    try {
      await audioService.playNotificationSound();
    } catch (error) {
      console.warn('Não foi possível tocar som de notificação:', error);
    }

    // Mostrar notificação do browser (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Vibrar dispositivo (se suportado)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Inscrever-se para notificações em tempo real
  useEffect(() => {
    const unsubscribe = realTimeNotificationService.subscribe(guardianId, handleNewNotification);
    
    // Solicitar permissão para notificações do browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }

    // Limpeza automática de notificações antigas
    realTimeNotificationService.cleanupOldNotifications();

    return unsubscribe;
  }, [guardianId, handleNewNotification]);

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    realTimeNotificationService.markAsRead(notificationId, guardianId);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [guardianId]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.isRead) {
        realTimeNotificationService.markAsRead(n.id, guardianId);
      }
    });
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [notifications, guardianId]);

  // Excluir notificação
  const deleteNotification = useCallback((notificationId: string) => {
    realTimeNotificationService.deleteNotification(notificationId, guardianId);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
    });
  }, [guardianId, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};