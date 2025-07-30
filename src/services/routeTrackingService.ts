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

  static getInstance(): RouteTrackingService {
    if (!RouteTrackingService.instance) {
      RouteTrackingService.instance = new RouteTrackingService();
    }
    return RouteTrackingService.instance;
  }

  // Adicionar listener para mudanças na rota
  addListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback: (route: ActiveRoute | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notifyListeners(route: ActiveRoute | null) {
    this.listeners.forEach(listener => listener(route));
  }

  // Obter rota ativa atual
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
          console.log('⏰ Rota muito antiga, removendo...');
          this.endRoute();
          return null;
        }
        
        return route;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar rota ativa:', error);
    }
    console.log('❌ Nenhuma rota ativa encontrada');
    return null;
  }

  // Iniciar nova rota
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

    // Salvar rota
    localStorage.setItem('activeRoute', JSON.stringify(route));
    
    // Iniciar rastreamento de localização
    this.startLocationTracking();
    
    // Notificar listeners
    this.notifyListeners(route);
    
    console.log('🚀 Rota iniciada:', route);
    return route;
  }

  // Finalizar rota
  endRoute() {
    const route = this.getActiveRoute();
    if (route) {
      route.isActive = false;
      route.endTime = new Date().toISOString();
      
      // Salvar estado final
      localStorage.setItem('activeRoute', JSON.stringify(route));
      
      // Parar rastreamento
      this.stopLocationTracking();
      
      // Notificar listeners que a rota acabou
      this.notifyListeners(null);
      
      console.log('🏁 Rota finalizada:', route);
      
      // Remover rota após 1 hora para limpeza
      setTimeout(() => {
        localStorage.removeItem('activeRoute');
      }, 60 * 60 * 1000);
    }
  }

  // Atualizar localização atual do motorista
  updateDriverLocation(location: RouteLocation) {
    const route = this.getActiveRoute();
    if (route && route.isActive) {
      route.currentLocation = location;
      localStorage.setItem('activeRoute', JSON.stringify(route));
      this.notifyListeners(route);
      console.log('📍 Localização do motorista atualizada:', location);
    }
  }

  // Atualizar status de um estudante
  updateStudentStatus(studentId: string, status: 'pending' | 'picked_up' | 'dropped_off') {
    const route = this.getActiveRoute();
    if (route) {
      const student = route.studentPickups.find(s => s.studentId === studentId);
      if (student) {
        student.status = status;
        localStorage.setItem('activeRoute', JSON.stringify(route));
        this.notifyListeners(route);
        console.log(`👤 Status do estudante ${student.studentName} atualizado para: ${status}`);
      }
    }
  }

  // Iniciar rastreamento automático de localização
  private startLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    // Atualizar localização a cada 5 segundos para demonstração
    this.locationUpdateInterval = setInterval(() => {
      this.getCurrentLocation().then(location => {
        if (location) {
          this.updateDriverLocation(location);
        }
      });
    }, 5000);

    // Primeira atualização imediata
    this.getCurrentLocation().then(location => {
      if (location) {
        this.updateDriverLocation(location);
      }
    });
  }

  // Parar rastreamento de localização
  private stopLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  // Obter localização atual (real ou simulada)
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

  // Obter localização simulada se disponível
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

  // Calcular distância entre dois pontos (em metros)
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

  // Verificar se o motorista está próximo de um endereço
  isNearLocation(driverLat: number, driverLng: number, targetLat: number, targetLng: number, radiusMeters: number = 100): boolean {
    const distance = this.calculateDistance(driverLat, driverLng, targetLat, targetLng);
    return distance <= radiusMeters;
  }
}

export const routeTrackingService = RouteTrackingService.getInstance();