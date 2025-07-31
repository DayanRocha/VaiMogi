import { GuardianNotification } from '@/hooks/useGuardianData';

export interface RouteLocation {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export interface ActiveRoute {
  id: string;
  driverId: string;
  driverName: string;
  direction: 'to_school' | 'to_home';
  startTime: string;
  endTime?: string;
  isActive: boolean;
  currentLocation?: RouteLocation;
  studentPickups: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  }[];
}

class RouteTrackingService {
  private static instance: RouteTrackingService;
  private listeners: ((route: ActiveRoute | null) => void)[] = [];
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private persistenceCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): RouteTrackingService {
    if (!RouteTrackingService.instance) {
      RouteTrackingService.instance = new RouteTrackingService();
    }
    return RouteTrackingService.instance;
  }

  constructor() {
    // Restaurar rota ativa imediatamente ao inicializar
    this.restoreActiveRouteOnInit();
    
    // Iniciar verificação contínua de persistência
    this.startPersistenceCheck();
    
    // Setup de event listeners apenas para logs, NUNCA para encerrar rotas
    this.setupApplicationLifecycleHandlers();
  }

  private setupApplicationLifecycleHandlers() {
    // Apenas para logs - NUNCA encerrar rotas automaticamente
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 Aplicação ficou em background - rota continua ativa');
      } else {
        console.log('📱 Aplicação voltou ao foreground - verificando rota...');
        this.restoreActiveRouteOnInit();
      }
    });

    window.addEventListener('beforeunload', () => {
      console.log('🚪 Motorista saindo da aplicação - rota mantida ativa no localStorage');
      // IMPORTANTE: NUNCA encerrar a rota aqui
    });

    window.addEventListener('focus', () => {
      console.log('🎯 Aplicação recuperou o foco - restaurando rota...');
      this.restoreActiveRouteOnInit();
    });

    // Detectar quando a página é recarregada
    window.addEventListener('load', () => {
      console.log('🔄 Página recarregada - restaurando rota ativa...');
      this.restoreActiveRouteOnInit();
    });
  }

  private restoreActiveRouteOnInit() {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      console.log('✅ Rota ativa restaurada automaticamente:', {
        id: route.id,
        driverName: route.driverName,
        studentsCount: route.studentPickups?.length || 0,
        startTime: route.startTime,
        currentLocation: route.currentLocation ? 'Disponível' : 'Não disponível'
      });
      
      // Reiniciar rastreamento de localização se necessário
      if (!this.locationUpdateInterval) {
        this.startLocationTracking();
      }
      
      // Notificar todos os listeners sobre a rota ativa
      this.notifyListeners(route);
    } else {
      console.log('ℹ️ Nenhuma rota ativa para restaurar');
    }
  }

  private startPersistenceCheck() {
    // Verificar a cada 30 segundos se a rota ainda está persistida
    this.persistenceCheckInterval = setInterval(() => {
      const route = this.getActiveRoute();
      if (route && route.isActive) {
        // Atualizar timestamp para manter a rota "viva"
        route.currentLocation = route.currentLocation || {
          lat: -23.5505,
          lng: -46.6333,
          timestamp: new Date().toISOString(),
          accuracy: 10
        };
        
        // Re-persistir para manter fresca
        this.persistRoute(route);
        console.log('💾 Rota mantida ativa via persistência automática');
      }
    }, 30000); // 30 segundos
  }

  addListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners.push(callback);
    
    // Imediatamente notificar o novo listener sobre qualquer rota ativa
    const activeRoute = this.getActiveRoute();
    if (activeRoute && activeRoute.isActive) {
      callback(activeRoute);
    }
  }

  removeListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(route: ActiveRoute | null) {
    this.listeners.forEach(listener => {
      try {
        listener(route);
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }

  getActiveRoute(): ActiveRoute | null {
    try {
      const stored = localStorage.getItem('activeRoute');
      
      if (stored) {
        const route = JSON.parse(stored);
        
        // Verificar se a rota não é muito antiga (mais de 48 horas)
        const startTime = new Date(route.startTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 48) {
          console.log('⏰ Rota muito antiga (>48h), limpando automaticamente...');
          this.cleanupOldRoute();
          return null;
        }
        
        // Se a rota estava ativa, ela DEVE continuar ativa
        if (route.isActive) {
          console.log('✅ Rota ativa válida encontrada:', {
            id: route.id,
            driverName: route.driverName,
            hoursActive: hoursDiff.toFixed(1)
          });
          return route;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar rota ativa:', error);
    }
    
    return null;
  }

  private cleanupOldRoute() {
    localStorage.removeItem('activeRoute');
    localStorage.removeItem('routeLastSave');
    this.stopLocationTracking();
    this.notifyListeners(null);
    console.log('🧹 Rota antiga removida automaticamente');
  }

  startRoute(driverId: string, driverName: string, direction: 'to_school' | 'to_home', students: any[]) {
    const route: ActiveRoute = {
      id: Date.now().toString(),
      driverId,
      driverName,
      direction,
      startTime: new Date().toISOString(),
      isActive: true,
      studentPickups: students.map(student => ({
        studentId: student.id,
        studentName: student.name,
        address: student.address || 'Endereço não informado',
        lat: student.lat,
        lng: student.lng,
        status: 'pending'
      }))
    };

    // Persistir rota com garantia de durabilidade
    this.persistRoute(route);
    
    // Iniciar rastreamento de localização
    this.startLocationTracking();
    
    // Notificar listeners
    this.notifyListeners(route);
    
    console.log('🚀 Rota iniciada com persistência garantida:', {
      id: route.id,
      driverName: route.driverName,
      studentsCount: route.studentPickups.length,
      direction: route.direction
    });
    
    return route;
  }

  private persistRoute(route: ActiveRoute) {
    try {
      localStorage.setItem('activeRoute', JSON.stringify(route));
      localStorage.setItem('routeLastSave', Date.now().toString());
      localStorage.setItem('routePersistenceFlag', 'true'); // Flag extra de segurança
      console.log('💾 Rota persistida com segurança no localStorage');
    } catch (error) {
      console.error('❌ Erro ao persistir rota:', error);
    }
  }

  // ÚNICO método que pode encerrar uma rota - DEVE ser chamado explicitamente
  endRoute() {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      route.isActive = false;
      route.endTime = new Date().toISOString();
      
      // Salvar estado final
      this.persistRoute(route);
      
      // Parar rastreamento
      this.stopLocationTracking();
      
      // Limpar flags de persistência
      localStorage.removeItem('routePersistenceFlag');
      
      // Notificar listeners que a rota foi EXPLICITAMENTE encerrada
      this.notifyListeners(null);
      
      console.log('🏁 Rota EXPLICITAMENTE finalizada pelo motorista:', {
        id: route.id,
        driverName: route.driverName,
        duration: route.endTime && route.startTime ? 
          `${Math.round((new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / (1000 * 60))} min` : 
          'N/A'
      });
      
      // Limpar dados após 2 horas
      setTimeout(() => {
        localStorage.removeItem('activeRoute');
        localStorage.removeItem('routeLastSave');
        console.log('🧹 Dados da rota finalizada removidos após 2 horas');
      }, 2 * 60 * 60 * 1000);
      
      return true;
    }
    
    console.log('⚠️ Tentativa de encerrar rota, mas nenhuma rota ativa encontrada');
    return false;
  }

  updateDriverLocation(location: RouteLocation) {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      route.currentLocation = location;
      this.persistRoute(route);
      this.notifyListeners(route);
      console.log('📍 Localização do motorista atualizada:', {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        timestamp: location.timestamp
      });
    }
  }

  updateStudentStatus(studentId: string, status: 'pending' | 'picked_up' | 'dropped_off') {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      const student = route.studentPickups.find(s => s.studentId === studentId);
      if (student) {
        student.status = status;
        this.persistRoute(route);
        this.notifyListeners(route);
        console.log(`👤 Status do estudante ${student.studentName} atualizado para: ${status}`);
      }
    }
  }

  private startLocationTracking() {
    // Parar qualquer rastreamento anterior
    this.stopLocationTracking();

    // Atualizar localização a cada 10 segundos
    this.locationUpdateInterval = setInterval(() => {
      const route = this.getActiveRoute();
      if (route && route.isActive) {
        this.getCurrentLocation().then(location => {
          if (location) {
            this.updateDriverLocation(location);
          }
        });
      } else {
        // Se não há rota ativa, parar o rastreamento
        this.stopLocationTracking();
      }
    }, 10000);

    // Primeira atualização imediata
    this.getCurrentLocation().then(location => {
      if (location) {
        this.updateDriverLocation(location);
      }
    });

    console.log('📍 Rastreamento de localização iniciado (intervalo: 10s)');
  }

  private stopLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
      console.log('📍 Rastreamento de localização interrompido');
    }
  }

  private getCurrentLocation(): Promise<RouteLocation | null> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: RouteLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              accuracy: position.coords.accuracy
            };
            resolve(location);
          },
          (error) => {
            console.warn('⚠️ Erro na geolocalização, usando fallback:', error.message);
            // Fallback para localização simulada
            const mockLocation = this.getMockLocation();
            if (mockLocation) {
              resolve({
                lat: mockLocation.lat,
                lng: mockLocation.lng,
                timestamp: new Date().toISOString(),
                accuracy: 10
              });
            } else {
              resolve(null);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 45000
          }
        );
      } else {
        const mockLocation = this.getMockLocation();
        if (mockLocation) {
          resolve({
            lat: mockLocation.lat,
            lng: mockLocation.lng,
            timestamp: new Date().toISOString(),
            accuracy: 10
          });
        } else {
          resolve(null);
        }
      }
    });
  }

  private getMockLocation(): { lat: number; lng: number } | null {
    try {
      const activeRoute = this.getActiveRoute();
      if (activeRoute && activeRoute.isActive) {
        const { mockDriverMovement } = require('@/services/mockLocationService');
        return mockDriverMovement.getCurrentLocation();
      }
    } catch (error) {
      console.warn('⚠️ Erro ao obter localização simulada:', error);
    }
    return null;
  }

  // Método para verificar se há uma rota persistida (útil para debugging)
  hasPersistentRoute(): boolean {
    const route = this.getActiveRoute();
    const flag = localStorage.getItem('routePersistenceFlag');
    return !!(route && route.isActive && flag === 'true');
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  isNearLocation(driverLat: number, driverLng: number, targetLat: number, targetLng: number, radiusMeters: number = 100): boolean {
    const distance = this.calculateDistance(driverLat, driverLng, targetLat, targetLng);
    return distance <= radiusMeters;
  }
}

export const routeTrackingService = RouteTrackingService.getInstance();
