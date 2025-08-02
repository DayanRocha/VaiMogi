import { useState, useEffect } from 'react';
import { realTimeNotificationService, RealTimeNotification } from '@/services/realTimeNotificationService';

export const useRealTimeNotifications = (guardianId: string) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Função para marcar uma notificação como lida
  const markAsRead = (notification: RealTimeNotification) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  };

  // Função para deletar uma notificação
  const deleteNotification = (notification: RealTimeNotification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  // Inicialização e listener
  useEffect(() => {
    if (!guardianId) return;

    console.log('🔔 Inicializando notificações em tempo real para:', guardianId);

    const handleNotification = (notification: RealTimeNotification) => {
      console.log('🔔 Nova notificação recebida:', {
        type: notification.type,
        message: notification.message,
        guardianIds: notification.guardianIds
      });

      if (notification.guardianIds.includes(guardianId)) {
        setNotifications(prev => {
          // Verificar se já existe uma notificação similar recente (evitar duplicatas)
          const isDuplicate = prev.some(existing => 
            existing.message === notification.message &&
            Math.abs(new Date(existing.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 10000 // 10 segundos
          );

          if (isDuplicate) {
            console.log('🔕 Notificação duplicada ignorada');
            return prev;
          }

          console.log('✅ Adicionando nova notificação');
          return [notification, ...prev].slice(0, 50); // Limitar a 50 notificações
        });

        // Incrementar contador não lido
        setUnreadCount(prev => prev + 1);

        console.log(`📊 Total de notificações não lidas: ${unreadCount + 1}`);
      }
    };

    // Registrar listener com guardianId
    realTimeNotificationService.addListener(guardianId, handleNotification);

    // Cleanup
    return () => {
      realTimeNotificationService.removeListener(guardianId, handleNotification);
      console.log('🔌 Listener de notificações removido para:', guardianId);
    };
  }, [guardianId, unreadCount]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
