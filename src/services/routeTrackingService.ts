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
  private isApplicationActive: boolean = true;
  private lastActivityTime: number = Date.now();

  static getInstance(): RouteTrackingService {
    if (!RouteTrackingService.instance) {
      RouteTrackingService.instance = new RouteTrackingService();
    }
    return RouteTrackingService.instance;
  }

  constructor() {
    // Registrar eventos para detectar quando a aplicação fica inativa/ativa
    this.setupApplicationLifecycleHandlers();
    
    // Restaurar rota ativa ao inicializar o serviço
    this.restoreActiveRouteOnInit();
  }

  private setupApplicationLifecycleHandlers() {
    // Detectar quando a aplicação fica inativa (navegador minimizado, aba inativa, etc.)
    document.addEventListener('visibilitychange', () => {
      this.isApplicationActive = !document.hidden;
      this.lastActivityTime = Date.now();
      
      if (this.isApplicationActive) {
        console.log('🔄 Aplicação voltou a ser ativa - verificando rota...');
        this.restoreActiveRouteOnInit();
      } else {
        console.log('⏸️ Aplicação ficou inativa - mantendo rota ativa');
        // NÃO parar o rastreamento quando a aplicação fica inativa
        // A rota deve continuar ativa
      }
    });

    // Detectar quando a janela/aba está perdendo o foco
    window.addEventListener('beforeunload', () => {
      console.log('⚠️ Janela sendo fechada - rota permanece ativa no localStorage');
      // NÃO encerrar a rota quando a janela for fechada
      // A rota deve persistir para quando o motorista voltar
    });

    // Detectar quando a aplicação volta ao foco
    window.addEventListener('focus', () => {
      this.isApplicationActive = true;
      this.lastActivityTime = Date.now();
      console.log('🔄 Aplicação recuperou o foco - verificando rota...');
      this.restoreActiveRouteOnInit();
    });
  }

  private restoreActiveRouteOnInit() {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      console.log('🔄 Restaurando rota ativa encontrada:', {
        id: route.id,
        driverName: route.driverName,
        studentsCount: route.studentPickups?.length || 0,
        startTime: route.startTime
      });
      
      // Reiniciar rastreamento de localização se necessário
      if (!this.locationUpdateInterval) {
        this.startLocationTracking();
        console.log('📍 Rastreamento de localização reiniciado');
      }
      
      // Notificar listeners sobre a rota ativa
      this.notifyListeners(route);
    }
  }

  addListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(route: ActiveRoute | null) {
    this.listeners.forEach(listener => listener(route));
  }

  getActiveRoute(): ActiveRoute | null {
    try {
      const stored = localStorage.getItem('activeRoute');
      console.log('🔍 Verificando rota ativa no localStorage:', stored ? 'Encontrada' : 'Não encontrada');
      
      if (stored) {
        const route = JSON.parse(stored);
        console.log('📋 Dados da rota:', {
          id: route.id,
          isActive: route.isActive,
          driverName: route.driverName,
          direction: route.direction,
          studentsCount: route.studentPickups?.length || 0
        });
        
        // Verificar se a rota ainda está ativa (não passou de 24h)
        const startTime = new Date(route.startTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          // Rota muito antiga, remover
          console.log('⏰ Rota muito antiga (>24h), removendo automaticamente...');
          this.cleanupOldRoute();
          return null;
        }
        
        // Se a rota estava ativa, ela deve continuar ativa
        // independentemente do estado da aplicação
        if (route.isActive) {
          console.log('✅ Rota ativa válida encontrada - mantendo estado');
          return route;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar rota ativa:', error);
    }
    console.log('❌ Nenhuma rota ativa encontrada');
    return null;
  }

  private cleanupOldRoute() {
    localStorage.removeItem('activeRoute');
    this.stopLocationTracking();
    this.notifyListeners(null);
    console.log('🧹 Rota antiga removida do sistema');
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

    // Salvar rota com flag de persistência
    this.persistRoute(route);
    
    // Iniciar rastreamento de localização
    this.startLocationTracking();
    
    // Notificar listeners
    this.notifyListeners(route);
    
    console.log('🚀 Rota iniciada com persistência garantida:', route);
    return route;
  }

  private persistRoute(route: ActiveRoute) {
    try {
      localStorage.setItem('activeRoute', JSON.stringify(route));
      localStorage.setItem('routeLastSave', Date.now().toString());
      console.log('💾 Rota salva com persistência no localStorage');
    } catch (error) {
      console.error('❌ Erro ao persistir rota:', error);
    }
  }

  endRoute() {
    const route = this.getActiveRoute();
    if (route) {
      route.isActive = false;
      route.endTime = new Date().toISOString();
      
      // Salvar estado final
      this.persistRoute(route);
      
      // Parar rastreamento
      this.stopLocationTracking();
      
      // Notificar listeners que a rota acabou
      this.notifyListeners(null);
      
      console.log('🏁 Rota EXPLICITAMENTE finalizada pelo motorista:', route);
      
      // Remover rota após 1 hora para limpeza
      setTimeout(() => {
        localStorage.removeItem('activeRoute');
        localStorage.removeItem('routeLastSave');
        console.log('🧹 Dados da rota finalizada removidos após 1 hora');
      }, 60 * 60 * 1000);
    }
  }

  updateDriverLocation(location: RouteLocation) {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      route.currentLocation = location;
      this.persistRoute(route);
      this.notifyListeners(route);
      console.log('📍 Localização do motorista atualizada e persistida:', location);
    }
  }

  updateStudentStatus(studentId: string, status: 'pending' | 'picked_up' | 'dropped_off') {
    const route = this.getActiveRoute();
    if (route) {
      const student = route.studentPickups.find(s => s.studentId === studentId);
      if (student) {
        student.status = status;
        this.persistRoute(route);
        this.notifyListeners(route);
        console.log(`👤 Status do estudante ${student.studentName} atualizado e persistido para: ${status}`);
      }
    }
  }

  private startLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    // Atualizar localização a cada 5 segundos, mesmo quando a aplicação não estiver ativa
    this.locationUpdateInterval = setInterval(() => {
      // Verificar se ainda há rota ativa antes de atualizar localização
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
    }, 5000);

    // Primeira atualização imediata
    this.getCurrentLocation().then(location => {
      if (location) {
        this.updateDriverLocation(location);
      }
    });

    console.log('📍 Rastreamento de localização iniciado com persistência');
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
      // Tentar localização real primeiro
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: RouteLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: new Date().toISOString(),
              accuracy: position.coords.accuracy
            };
            console.log('📍 Localização real obtida:', location);
            resolve(location);
          },
          (error) => {
            console.warn('⚠️ Erro na geolocalização real, usando simulada:', error);
            // Fallback para localização simulada
            const mockLocation = this.getMockLocation();
            if (mockLocation) {
              const location: RouteLocation = {
                lat: mockLocation.lat,
                lng: mockLocation.lng,
                timestamp: new Date().toISOString(),
                accuracy: 10 // Simular boa precisão
              };
              resolve(location);
            } else {
              resolve(null);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000
          }
        );
      } else {
        // Fallback para localização simulada se geolocalização não disponível
        const mockLocation = this.getMockLocation();
        if (mockLocation) {
          const location: RouteLocation = {
            lat: mockLocation.lat,
            lng: mockLocation.lng,
            timestamp: new Date().toISOString(),
            accuracy: 10
          };
          console.log('📍 Localização simulada usada:', location);
          resolve(location);
        } else {
          console.warn('⚠️ Nenhuma localização disponível');
          resolve(null);
        }
      }
    });
  }

  private getMockLocation(): { lat: number; lng: number } | null {
    try {
      // Verificar se há movimento simulado ativo
      const activeRoute = this.getActiveRoute();
      if (activeRoute && activeRoute.isActive) {
        // Importar dinamicamente para evitar dependência circular
        const { mockDriverMovement } = require('@/services/mockLocationService');
        return mockDriverMovement.getCurrentLocation();
      }
    } catch (error) {
      console.warn('⚠️ Erro ao obter localização simulada:', error);
    }
    return null;
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
