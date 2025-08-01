// Serviço para notificações em tempo real entre motorista e responsável
export interface RealTimeNotification {
  id: string;
  type: 'route_started' | 'student_picked_up' | 'student_dropped_off' | 'arriving_soon' | 'arrived_at_location' | 'route_completed' | 'route_delayed';
  title: string;
  message: string;
  timestamp: string;
  driverId: string;
  driverName: string;
  studentId?: string;
  studentName?: string;
  location?: string;
  isRead: boolean;
  guardianIds: string[]; // IDs dos responsáveis que devem receber
}

class RealTimeNotificationService {
  private listeners: Map<string, (notification: RealTimeNotification) => void> = new Map();
  private storageKey = 'realTimeNotifications';

  // Enviar notificação (usado pelo motorista)
  sendNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'isRead'>) {
    // Verificar se já existe uma notificação similar recente (últimos 5 segundos)
    const existingNotifications = this.getStoredNotifications();
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    
    const isDuplicate = existingNotifications.some(existing => 
      existing.type === notification.type &&
      existing.message === notification.message &&
      existing.timestamp > fiveSecondsAgo
    );

    if (isDuplicate) {
      console.log('⚠️ Notificação duplicada bloqueada:', notification.title);
      return null;
    }

    const fullNotification: RealTimeNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Salvar no localStorage
    const updatedNotifications = [fullNotification, ...existingNotifications.slice(0, 49)]; // Manter apenas 50
    
    localStorage.setItem(this.storageKey, JSON.stringify(updatedNotifications));

    // Disparar evento customizado para notificar listeners
    window.dispatchEvent(new CustomEvent('realTimeNotification', {
      detail: fullNotification
    }));

    console.log('📡 Notificação enviada em tempo real:', fullNotification.title);
    return fullNotification;
  }

  // Registrar listener (usado pelo responsável)
  subscribe(guardianId: string, callback: (notification: RealTimeNotification) => void) {
    this.listeners.set(guardianId, callback);

    // Listener para eventos do localStorage
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const notifications: RealTimeNotification[] = JSON.parse(event.newValue);
          const latestNotification = notifications[0];
          
          if (latestNotification && latestNotification.guardianIds.includes(guardianId)) {
            callback(latestNotification);
          }
        } catch (error) {
          console.error('Erro ao processar notificação do storage:', error);
        }
      }
    };

    // Listener para eventos customizados (mesma aba)
    const handleCustomEvent = (event: CustomEvent<RealTimeNotification>) => {
      const notification = event.detail;
      if (notification.guardianIds.includes(guardianId)) {
        callback(notification);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('realTimeNotification', handleCustomEvent as EventListener);

    console.log(`🔔 Responsável ${guardianId} inscrito para notificações em tempo real`);

    // Retornar função de cleanup
    return () => {
      this.listeners.delete(guardianId);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('realTimeNotification', handleCustomEvent as EventListener);
      console.log(`🔕 Responsável ${guardianId} desinscrito das notificações`);
    };
  }

  // Obter notificações armazenadas
  private getStoredNotifications(): RealTimeNotification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao ler notificações armazenadas:', error);
      return [];
    }
  }

  // Obter notificações para um responsável específico
  getNotificationsForGuardian(guardianId: string): RealTimeNotification[] {
    const allNotifications = this.getStoredNotifications();
    return allNotifications.filter(n => n.guardianIds.includes(guardianId));
  }

  // Marcar notificação como lida
  markAsRead(notificationId: string, guardianId: string) {
    const notifications = this.getStoredNotifications();
    const updated = notifications.map(n => {
      if (n.id === notificationId && n.guardianIds.includes(guardianId)) {
        return { ...n, isRead: true };
      }
      return n;
    });

    localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }

  // Excluir notificação
  deleteNotification(notificationId: string, guardianId: string) {
    const notifications = this.getStoredNotifications();
    const updated = notifications.filter(n => 
      !(n.id === notificationId && n.guardianIds.includes(guardianId))
    );

    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    console.log(`🗑️ Notificação ${notificationId} excluída para responsável ${guardianId}`);
  }

  // Limpar notificações antigas (mais de 24 horas)
  cleanupOldNotifications() {
    const notifications = this.getStoredNotifications();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const filtered = notifications.filter(n => new Date(n.timestamp) > oneDayAgo);
    
    if (filtered.length !== notifications.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      console.log(`🧹 Limpeza: ${notifications.length - filtered.length} notificações antigas removidas`);
    }
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();