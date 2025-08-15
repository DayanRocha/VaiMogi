interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

interface ProximityNotification {
  studentId: string;
  studentName: string;
  driverName: string;
  estimatedArrival: string;
  distance: number;
  guardianId: string;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';
  private proximityThreshold = 500; // 500 metros
  private notificationsSent: Set<string> = new Set();

  private constructor() {
    this.checkPermission();
    this.initializeServiceWorker();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Verificar permissão atual
  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      console.log('🔔 Status da permissão de notificação:', this.permission);
    } else {
      console.warn('⚠️ Notificações não suportadas neste navegador');
    }
  }

  // Inicializar Service Worker
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', this.registration);
        
        // Escutar mensagens do Service Worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificações não suportadas');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      console.log('🔔 Permissão de notificação:', permission);
      
      if (permission === 'granted') {
        // Mostrar notificação de boas-vindas
        this.showWelcomeNotification();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  }

  // Mostrar notificação de boas-vindas
  private showWelcomeNotification() {
    this.showNotification({
      title: '🚐 VaiMogi - Notificações Ativadas',
      body: 'Você será notificado quando o motorista estiver se aproximando!',
      icon: '/icon-192x192.png',
      tag: 'welcome'
    });
  }

  // Mostrar notificação
  async showNotification(payload: NotificationPayload): Promise<boolean> {
    if (this.permission !== 'granted') {
      console.warn('⚠️ Permissão de notificação não concedida');
      return false;
    }

    try {
      if (this.registration) {
        // Usar Service Worker para notificações persistentes
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag,
          data: payload.data,
          requireInteraction: true, // Manter visível até interação
          silent: false
        });
      } else {
        // Fallback para notificação simples
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          tag: payload.tag,
          data: payload.data
        });
      }
      
      console.log('✅ Notificação enviada:', payload.title);
      return true;
    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
      return false;
    }
  }

  // Notificação de proximidade
  async sendProximityNotification(data: ProximityNotification): Promise<boolean> {
    const notificationKey = `${data.studentId}-${data.driverName}-proximity`;
    
    // Evitar spam de notificações
    if (this.notificationsSent.has(notificationKey)) {
      console.log('🔕 Notificação de proximidade já enviada para:', data.studentName);
      return false;
    }

    const success = await this.showNotification({
      title: `🚐 ${data.driverName} está chegando!`,
      body: `O motorista está a ${data.distance}m de ${data.studentName}. Chegada estimada: ${data.estimatedArrival}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `proximity-${data.studentId}`,
      data: {
        type: 'proximity',
        studentId: data.studentId,
        studentName: data.studentName,
        driverName: data.driverName,
        distance: data.distance,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '👀 Ver no Mapa',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: '✅ OK',
          icon: '/icon-ok.png'
        }
      ]
    });

    if (success) {
      this.notificationsSent.add(notificationKey);
      
      // Emitir evento customizado para notificação toast
      window.dispatchEvent(new CustomEvent('tracking-notification', {
        detail: {
          type: 'proximity',
          data: {
            studentName: data.studentName,
            driverName: data.driverName,
            distance: data.distance,
            estimatedArrival: data.estimatedArrival
          }
        }
      }));
      
      // Limpar após 5 minutos para permitir nova notificação
      setTimeout(() => {
        this.notificationsSent.delete(notificationKey);
      }, 5 * 60 * 1000);
    }

    return success;
  }

  // Notificação de chegada
  async sendArrivalNotification(studentName: string, driverName: string, location: string): Promise<boolean> {
    const success = await this.showNotification({
      title: `🎯 ${driverName} chegou!`,
      body: `${studentName} pode se dirigir ao ponto de coleta em ${location}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `arrival-${studentName}`,
      data: {
        type: 'arrival',
        studentName,
        driverName,
        location,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '👀 Ver Detalhes',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: '✅ Entendi',
          icon: '/icon-ok.png'
        }
      ]
    });

    if (success) {
      // Emitir evento customizado para notificação toast
      window.dispatchEvent(new CustomEvent('tracking-notification', {
        detail: {
          type: 'arrival',
          data: {
            studentName,
            driverName,
            location
          }
        }
      }));
    }

    return success;
  }

  // Notificação de atraso
  async sendDelayNotification(studentName: string, driverName: string, newEstimatedTime: string, reason?: string): Promise<boolean> {
    const success = await this.showNotification({
      title: `⏰ Atraso na coleta de ${studentName}`,
      body: `${driverName} está atrasado. Nova previsão: ${newEstimatedTime}${reason ? `. Motivo: ${reason}` : ''}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `delay-${studentName}`,
      data: {
        type: 'delay',
        studentName,
        driverName,
        newEstimatedTime,
        reason,
        timestamp: Date.now()
      }
    });

    if (success) {
      // Emitir evento customizado para notificação toast
      window.dispatchEvent(new CustomEvent('tracking-notification', {
        detail: {
          type: 'delay',
          data: {
            studentName,
            driverName,
            newEstimatedTime,
            reason
          }
        }
      }));
    }

    return success;
  }

  // Notificação de atualização de rota
  async sendRouteUpdateNotification(data: {
    driverName: string;
    reason: string;
    newEstimatedTime?: string;
    guardianIds?: string[];
  }): Promise<boolean> {
    const success = await this.showNotification({
      title: `🗺️ Rota atualizada - ${data.driverName}`,
      body: `${data.reason}${data.newEstimatedTime ? `. Nova previsão: ${data.newEstimatedTime}` : ''}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `route-update-${Date.now()}`,
      data: {
        type: 'route_update',
        driverName: data.driverName,
        reason: data.reason,
        newEstimatedTime: data.newEstimatedTime,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '👀 Ver no Mapa',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: '✅ OK',
          icon: '/icon-ok.png'
        }
      ]
    });

    if (success) {
      // Emitir evento customizado para notificação toast
      window.dispatchEvent(new CustomEvent('tracking-notification', {
        detail: {
          type: 'route_update',
          data: {
            driverName: data.driverName,
            reason: data.reason,
            newEstimatedTime: data.newEstimatedTime
          }
        }
      }));
    }

    return success;
  }

  // Verificar proximidade e enviar notificação se necessário
  async checkProximityAndNotify(
    driverLocation: { lat: number; lng: number },
    studentLocation: { lat: number; lng: number },
    studentData: { id: string; name: string; guardianId: string },
    driverName: string,
    estimatedArrival: string
  ): Promise<boolean> {
    const distance = this.calculateDistance(driverLocation, studentLocation);
    
    console.log(`📍 Distância até ${studentData.name}: ${distance.toFixed(0)}m`);
    
    // Se estiver dentro do raio de proximidade
    if (distance <= this.proximityThreshold) {
      console.log(`🔔 Motorista próximo de ${studentData.name}! Enviando notificação...`);
      
      return await this.sendProximityNotification({
        studentId: studentData.id,
        studentName: studentData.name,
        driverName,
        estimatedArrival,
        distance: Math.round(distance),
        guardianId: studentData.guardianId
      });
    }
    
    return false;
  }

  // Calcular distância entre dois pontos (Haversine)
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Configurar threshold de proximidade
  setProximityThreshold(meters: number) {
    this.proximityThreshold = meters;
    console.log(`🎯 Threshold de proximidade definido para: ${meters}m`);
  }

  // Obter threshold atual
  getProximityThreshold(): number {
    return this.proximityThreshold;
  }

  // Limpar notificações enviadas
  clearSentNotifications() {
    this.notificationsSent.clear();
    console.log('🧹 Cache de notificações limpo');
  }

  // Verificar se notificações estão habilitadas
  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  // Lidar com mensagens do Service Worker
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    console.log('📨 Mensagem do Service Worker:', data);
    
    switch (data.type) {
      case 'notification-click':
        this.handleNotificationClick(data.payload);
        break;
      case 'notification-close':
        this.handleNotificationClose(data.payload);
        break;
      default:
        console.log('📨 Tipo de mensagem desconhecido:', data.type);
    }
  }

  // Lidar com clique na notificação
  private handleNotificationClick(payload: any) {
    console.log('👆 Notificação clicada:', payload);
    
    // Focar na janela se estiver aberta
    if (window.focus) {
      window.focus();
    }
    
    // Navegar para a página relevante baseado no tipo
    switch (payload.type) {
      case 'proximity':
      case 'arrival':
        // Navegar para o mapa em tempo real
        window.location.hash = '#/guardian/tracking';
        break;
      case 'delay':
        // Navegar para detalhes da rota
        window.location.hash = '#/guardian/routes';
        break;
    }
  }

  // Lidar com fechamento da notificação
  private handleNotificationClose(payload: any) {
    console.log('❌ Notificação fechada:', payload);
  }

  // Testar notificação
  async testNotification(): Promise<boolean> {
    if (!this.isEnabled()) {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    return await this.showNotification({
      title: '🧪 Teste de Notificação',
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      tag: 'test',
      data: { type: 'test' }
    });
  }
}

// Exportar instância singleton
export const pushNotificationService = PushNotificationService.getInstance();
export default pushNotificationService;