import { GuardianNotification } from '@/hooks/useGuardianData';
import { TripStudent, Student, School } from '@/types/driver';
import { audioService, NotificationSoundType } from '@/services/audioService';

export interface NotificationEvent {
  type: 'route_started' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked' | 'route_finished';
  studentId: string;
  studentName: string;
  direction: 'to_school' | 'to_home';
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  schoolName?: string;
  address?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: GuardianNotification) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Adicionar listener para receber notificações
  addListener(callback: (notification: GuardianNotification) => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback: (notification: GuardianNotification) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Enviar notificação para todos os listeners
  private notifyListeners(notification: GuardianNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // Criar mensagem baseada no tipo de evento
  private createMessage(event: NotificationEvent): string {
    const { type, studentName, direction, schoolName, address } = event;
    
    switch (type) {
      case 'route_started':
        return direction === 'to_school' 
          ? `Rota iniciada! ${studentName} será buscado em casa`
          : `Rota de volta iniciada! ${studentName} será levado para casa`;
          
      case 'van_arrived':
        return direction === 'to_school'
          ? `A van chegou no ponto de embarque de ${studentName}`
          : `A van chegou na escola para buscar ${studentName}`;
          
      case 'embarked':
        return direction === 'to_school'
          ? `${studentName} embarcou na van e está a caminho da escola`
          : `${studentName} embarcou na van e está a caminho de casa`;
          
      case 'at_school':
        return `${studentName} chegou na escola ${schoolName || ''}`;
        
      case 'disembarked':
        return direction === 'to_school'
          ? `${studentName} foi desembarcado na escola ${schoolName || ''}`
          : `${studentName} foi desembarcado em casa`;
          
      case 'route_finished':
        return direction === 'to_school'
          ? `Rota da manhã finalizada. Todos os alunos foram entregues na escola`
          : `Rota da tarde finalizada. Todos os alunos foram entregues em casa`;
          
      default:
        return `Atualização sobre ${studentName}`;
    }
  }

  // Mapear tipo de evento para tipo de notificação
  private mapEventToNotificationType(eventType: NotificationEvent['type']): GuardianNotification['type'] {
    switch (eventType) {
      case 'van_arrived':
        return 'van_arrived';
      case 'embarked':
        return 'embarked';
      case 'at_school':
        return 'at_school';
      case 'disembarked':
        return 'disembarked';
      default:
        return 'van_arrived'; // fallback
    }
  }

  // Método principal para enviar notificação
  async sendNotification(event: NotificationEvent) {
    console.log('📱 Enviando notificação:', event);
    
    const notification: GuardianNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: this.mapEventToNotificationType(event.type),
      studentName: event.studentName,
      message: this.createMessage(event),
      timestamp: event.timestamp,
      isRead: false,
      location: event.location
    };

    // Salvar notificação no localStorage para persistência
    this.saveNotificationToStorage(notification);
    
    // Notificar todos os listeners (componentes que estão escutando)
    // O som será reproduzido apenas do lado do responsável
    this.notifyListeners(notification);
    
    console.log('✅ Notificação enviada:', notification);
  }

  // Reproduzir som baseado no tipo de evento
  private async playNotificationSound(eventType: NotificationEvent['type']) {
    try {
      console.log(`🔊 NotificationService: Reproduzindo som para evento ${eventType}`);
      const soundType: NotificationSoundType = eventType as NotificationSoundType;
      await audioService.playNotificationSound(soundType);
      console.log(`✅ NotificationService: Som reproduzido para ${eventType}`);
    } catch (error) {
      console.warn('❌ NotificationService: Erro ao reproduzir som da notificação:', error);
    }
  }

  // Salvar notificação no localStorage
  private saveNotificationToStorage(notification: GuardianNotification) {
    try {
      const existingNotifications = this.getStoredNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Manter apenas as últimas 50 notificações
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      localStorage.setItem('guardianNotifications', JSON.stringify(limitedNotifications));
      console.log('💾 Notificação salva no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
    }
  }

  // Recuperar notificações do localStorage
  getStoredNotifications(): GuardianNotification[] {
    try {
      const stored = localStorage.getItem('guardianNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  markAsRead(notificationId: string) {
    try {
      const notifications = this.getStoredNotifications();
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      
      localStorage.setItem('guardianNotifications', JSON.stringify(updatedNotifications));
      console.log('✅ Notificação marcada como lida:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  }

  // Limpar todas as notificações
  clearAllNotifications() {
    localStorage.removeItem('guardianNotifications');
    console.log('🗑️ Todas as notificações foram removidas');
  }

  // Métodos de conveniência para eventos específicos
  async notifyRouteStarted(studentId: string, studentName: string, direction: 'to_school' | 'to_home') {
    await this.sendNotification({
      type: 'route_started',
      studentId,
      studentName,
      direction,
      timestamp: new Date().toISOString()
    });
  }

  async notifyVanArrived(studentId: string, studentName: string, direction: 'to_school' | 'to_home', location?: { lat: number; lng: number }) {
    await this.sendNotification({
      type: 'van_arrived',
      studentId,
      studentName,
      direction,
      location,
      timestamp: new Date().toISOString()
    });
  }

  async notifyEmbarked(studentId: string, studentName: string, direction: 'to_school' | 'to_home', location?: { lat: number; lng: number }) {
    await this.sendNotification({
      type: 'embarked',
      studentId,
      studentName,
      direction,
      location,
      timestamp: new Date().toISOString()
    });
  }

  async notifyAtSchool(studentId: string, studentName: string, schoolName: string, location?: { lat: number; lng: number }) {
    await this.sendNotification({
      type: 'at_school',
      studentId,
      studentName,
      direction: 'to_school',
      schoolName,
      location,
      timestamp: new Date().toISOString()
    });
  }

  async notifyDisembarked(studentId: string, studentName: string, direction: 'to_school' | 'to_home', schoolName?: string, address?: string, location?: { lat: number; lng: number }) {
    await this.sendNotification({
      type: 'disembarked',
      studentId,
      studentName,
      direction,
      schoolName,
      address,
      location,
      timestamp: new Date().toISOString()
    });
  }

  async notifyRouteFinished(direction: 'to_school' | 'to_home') {
    await this.sendNotification({
      type: 'route_finished',
      studentId: 'all',
      studentName: 'Todos os alunos',
      direction,
      timestamp: new Date().toISOString()
    });
  }
}

export const notificationService = NotificationService.getInstance();