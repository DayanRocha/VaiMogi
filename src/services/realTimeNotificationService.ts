import { GuardianNotification } from '@/hooks/useGuardianData';
import { notificationService } from './notificationService';

/**
 * Serviço de notificações em tempo real que utiliza:
 * - BroadcastChannel para comunicação entre abas
 * - Storage events para sincronização
 * - Polling otimizado para detecção de mudanças
 */
class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: ((notification: GuardianNotification) => void)[] = [];
  private isInitialized = false;

  static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  // Inicializar serviço de tempo real
  init() {
    if (this.isInitialized) return;

    try {
      // Criar canal de broadcast para comunicação entre abas
      this.broadcastChannel = new BroadcastChannel('guardian-notifications');
      
      // Escutar mensagens de outras abas
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data.type === 'new-notification') {
          console.log('📡 Notificação recebida via BroadcastChannel:', event.data.notification);
          this.notifyListeners(event.data.notification);
        }
      });

      // Escutar mudanças no localStorage de outras abas
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('guardianNotifications_')) {
          console.log('💾 Mudança detectada no localStorage:', event.key);
          this.handleStorageChange(event);
        }
      });

      this.isInitialized = true;
      console.log('🚀 Serviço de notificações em tempo real inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de tempo real:', error);
    }
  }

  // Adicionar listener
  addListener(callback: (notification: GuardianNotification) => void) {
    this.listeners.push(callback);
    
    // Inicializar se ainda não foi
    if (!this.isInitialized) {
      this.init();
    }
  }

  // Remover listener
  removeListener(callback: (notification: GuardianNotification) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notifyListeners(notification: GuardianNotification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  // Enviar notificação em tempo real
  sendRealTimeNotification(notification: GuardianNotification) {
    try {
      // Enviar via BroadcastChannel para outras abas
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'new-notification',
          notification,
          timestamp: Date.now()
        });
        console.log('📡 Notificação enviada via BroadcastChannel');
      }

      // Notificar listeners locais
      this.notifyListeners(notification);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação em tempo real:', error);
    }
  }

  // Lidar com mudanças no localStorage
  private handleStorageChange(event: StorageEvent) {
    if (!event.newValue || !event.key) return;

    try {
      const notifications = JSON.parse(event.newValue);
      if (Array.isArray(notifications) && notifications.length > 0) {
        // Pegar a notificação mais recente
        const latestNotification = notifications[0];
        
        // Verificar se é uma notificação nova (últimos 5 segundos)
        const notificationTime = new Date(latestNotification.timestamp).getTime();
        const now = Date.now();
        
        if (now - notificationTime < 5000) {
          console.log('🔄 Nova notificação detectada via storage event');
          this.notifyListeners(latestNotification);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar mudança no storage:', error);
    }
  }

  // Limpar recursos
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    this.listeners = [];
    this.isInitialized = false;
    console.log('🧹 Serviço de notificações em tempo real destruído');
  }
}

export const realTimeNotificationService = RealTimeNotificationService.getInstance();