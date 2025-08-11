import { useState, useCallback, useEffect } from 'react';

interface NotificationData {
  id: string;
  type: 'proximity' | 'arrival' | 'delay';
  title: string;
  message: string;
  studentName?: string;
  driverName?: string;
  distance?: number;
  timestamp: number;
  duration?: number;
}

interface UseNotificationToastsReturn {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  handleNotificationAction: (id: string, action: string) => void;
}

export const useNotificationToasts = (): UseNotificationToastsReturn => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Adicionar nova notificação
  const addNotification = useCallback((
    notification: Omit<NotificationData, 'id' | 'timestamp'>
  ) => {
    const newNotification: NotificationData = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      // Limitar a 3 notificações simultâneas
      const updated = [newNotification, ...prev].slice(0, 3);
      return updated;
    });

    console.log('🔔 Nova notificação toast adicionada:', newNotification.title);
  }, []);

  // Dispensar notificação
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    console.log('❌ Notificação toast dispensada:', id);
  }, []);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    console.log('🧹 Todas as notificações toast foram limpas');
  }, []);

  // Lidar com ações das notificações
  const handleNotificationAction = useCallback((id: string, action: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    console.log('👆 Ação da notificação:', { id, action, notification: notification.title });

    switch (action) {
      case 'view':
        // Navegar para o mapa em tempo real
        if (window.location.hash !== '#/guardian/tracking') {
          window.location.hash = '#/guardian/tracking';
        }
        
        // Focar na janela se necessário
        if (window.focus) {
          window.focus();
        }
        break;
        
      case 'dismiss':
        // Apenas dispensar (já será feito automaticamente)
        break;
        
      default:
        console.log('Ação desconhecida:', action);
    }

    // Dispensar a notificação após a ação
    dismissNotification(id);
  }, [notifications, dismissNotification]);

  // Escutar eventos de notificação do Service Worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { data } = event;
      
      if (data.type === 'notification-received') {
        const { payload } = data;
        
        // Converter dados da notificação para formato do toast
        let toastType: 'proximity' | 'arrival' | 'delay' = 'proximity';
        if (payload.type === 'arrival') toastType = 'arrival';
        if (payload.type === 'delay') toastType = 'delay';
        
        addNotification({
          type: toastType,
          title: payload.title || 'Nova Notificação',
          message: payload.body || 'Você tem uma nova notificação',
          studentName: payload.studentName,
          driverName: payload.driverName,
          distance: payload.distance,
          duration: 8000 // 8 segundos
        });
      }
    };

    // Registrar listener para mensagens do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [addNotification]);

  // Escutar eventos de notificação do sistema de rastreamento
  useEffect(() => {
    const handleTrackingNotification = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'proximity':
          addNotification({
            type: 'proximity',
            title: `🚐 ${data.driverName} está chegando!`,
            message: `O motorista está a ${data.distance}m de ${data.studentName}`,
            studentName: data.studentName,
            driverName: data.driverName,
            distance: data.distance,
            duration: 10000 // 10 segundos para proximidade
          });
          break;
          
        case 'arrival':
          addNotification({
            type: 'arrival',
            title: `🎯 ${data.driverName} chegou!`,
            message: `${data.studentName} pode se dirigir ao ponto de coleta`,
            studentName: data.studentName,
            driverName: data.driverName,
            duration: 12000 // 12 segundos para chegada
          });
          break;
          
        case 'delay':
          addNotification({
            type: 'delay',
            title: `⏰ Atraso na coleta`,
            message: `${data.driverName} está atrasado. Nova previsão: ${data.newEstimatedTime}`,
            studentName: data.studentName,
            driverName: data.driverName,
            duration: 15000 // 15 segundos para atraso
          });
          break;
      }
    };

    // Registrar listener para eventos customizados
    window.addEventListener('tracking-notification', handleTrackingNotification as EventListener);
    
    return () => {
      window.removeEventListener('tracking-notification', handleTrackingNotification as EventListener);
    };
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    handleNotificationAction
  };
};

export default useNotificationToasts;