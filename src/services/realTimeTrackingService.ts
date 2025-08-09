import { RouteLocation, ActiveRoute } from './routeTrackingService';

export interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
  type: 'student' | 'school';
  studentId?: string;
  studentName?: string;
  schoolId?: string;
  schoolName?: string;
}

export interface TrackingRoute {
  id: string;
  driverId: string;
  driverName: string;
  direction: 'to_school' | 'to_home';
  startTime: string;
  endTime?: string;
  isActive: boolean;
  currentLocation?: RouteLocation;
  routePoints: RoutePoint[];
  mapboxRoute?: any; // Dados da rota do Mapbox
  estimatedDuration?: number; // em minutos
  totalDistance?: number; // em metros
}

class RealTimeTrackingService {
  private static instance: RealTimeTrackingService;
  private listeners: ((route: TrackingRoute | null) => void)[] = [];
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private mapboxAccessToken: string = '';
  private constructor() {
    // Configurar token do Mapbox (deve ser configurado via env ou config)
    this.mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    if (!this.mapboxAccessToken) {
      console.warn('⚠️ Token do Mapbox não configurado. Funcionalidades de rota podem não funcionar.');
    }
  }

  static getInstance(): RealTimeTrackingService {
    if (!RealTimeTrackingService.instance) {
      RealTimeTrackingService.instance = new RealTimeTrackingService();
    }
    return RealTimeTrackingService.instance;
  }

  // Configurar token do Mapbox
  setMapboxToken(token: string) {
    this.mapboxAccessToken = token;
    console.log('🗺️ Token do Mapbox configurado');
  }



  // Adicionar listener para atualizações de rota
  addListener(callback: (route: TrackingRoute | null) => void) {
    this.listeners.push(callback);
    
    // Notificar imediatamente se há rota ativa
    const activeRoute = this.getActiveTrackingRoute();
    callback(activeRoute);
  }

  // Remover listener
  removeListener(callback: (route: TrackingRoute | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notifyListeners(route: TrackingRoute | null) {
    this.listeners.forEach(listener => {
      try {
        listener(route);
      } catch (error) {
        console.error('❌ Erro ao notificar listener de tracking:', error);
      }
    });
  }

  // Iniciar rastreamento de rota
  async startRouteTracking(
    driverId: string,
    driverName: string,
    direction: 'to_school' | 'to_home',
    students: any[],
    school: any
  ): Promise<TrackingRoute | null> {
    console.log('🚀 Iniciando rastreamento de rota em tempo real:', {
      driverId,
      driverName,
      direction,
      studentsCount: students.length,
      school: school?.name
    });

    try {
      // Construir pontos da rota
      const routePoints = await this.buildRoutePoints(students, school, direction);
      
      // Obter localização atual do motorista
      const currentLocation = await this.getCurrentLocation();
      
      // Criar rota de rastreamento
      const trackingRoute: TrackingRoute = {
        id: Date.now().toString(),
        driverId,
        driverName,
        direction,
        startTime: new Date().toISOString(),
        isActive: true,
        currentLocation,
        routePoints
      };

      // Calcular rota otimizada usando Mapbox
      if (this.mapboxAccessToken && currentLocation) {
        const mapboxRoute = await this.calculateOptimizedRoute(currentLocation, routePoints);
        if (mapboxRoute) {
          trackingRoute.mapboxRoute = mapboxRoute;
          trackingRoute.estimatedDuration = Math.round(mapboxRoute.duration / 60); // converter para minutos
          trackingRoute.totalDistance = Math.round(mapboxRoute.distance); // metros
        }
      }

      // Salvar no localStorage
      this.saveTrackingRoute(trackingRoute);

      // Iniciar rastreamento de localização
      this.startLocationTracking();

      // 🧭 MODO NAVEGAÇÃO AUTOMÁTICO NO MAPA DO RESPONSÁVEL
      console.log('🧭 Rota iniciada - mapa do responsável entrará automaticamente no modo navegação');

      // Notificar listeners
      this.notifyListeners(trackingRoute);

      console.log('✅ Rastreamento de rota iniciado com sucesso:', {
        id: trackingRoute.id,
        routePointsCount: routePoints.length,
        hasMapboxRoute: !!trackingRoute.mapboxRoute,
        estimatedDuration: trackingRoute.estimatedDuration,
        navigationModeReady: routePoints.length > 0
      });

      return trackingRoute;
    } catch (error) {
      console.error('❌ Erro ao iniciar rastreamento de rota:', error);
      return null;
    }
  }

  // Construir pontos da rota baseado nos estudantes e escola
  private async buildRoutePoints(
    students: any[],
    school: any,
    direction: 'to_school' | 'to_home'
  ): Promise<RoutePoint[]> {
    const points: RoutePoint[] = [];

    if (direction === 'to_school') {
      // Rota para escola: estudantes primeiro, depois escola
      for (const student of students) {
        if (student.lat && student.lng) {
          points.push({
            lat: student.lat,
            lng: student.lng,
            address: student.address || 'Endereço não informado',
            type: 'student',
            studentId: student.id,
            studentName: student.name
          });
        } else if (student.address) {
          // Geocodificar endereço se não tiver coordenadas
          const coords = await this.geocodeAddress(student.address);
          if (coords) {
            points.push({
              lat: coords.lat,
              lng: coords.lng,
              address: student.address,
              type: 'student',
              studentId: student.id,
              studentName: student.name
            });
          }
        }
      }

      // Adicionar escola como destino final
      if (school) {
        if (school.lat && school.lng) {
          points.push({
            lat: school.lat,
            lng: school.lng,
            address: school.address || 'Escola',
            type: 'school',
            schoolId: school.id,
            schoolName: school.name
          });
        } else if (school.address) {
          const coords = await this.geocodeAddress(school.address);
          if (coords) {
            points.push({
              lat: coords.lat,
              lng: coords.lng,
              address: school.address,
              type: 'school',
              schoolId: school.id,
              schoolName: school.name
            });
          }
        }
      }
    } else {
      // Rota para casa: escola primeiro, depois estudantes
      if (school) {
        if (school.lat && school.lng) {
          points.push({
            lat: school.lat,
            lng: school.lng,
            address: school.address || 'Escola',
            type: 'school',
            schoolId: school.id,
            schoolName: school.name
          });
        } else if (school.address) {
          const coords = await this.geocodeAddress(school.address);
          if (coords) {
            points.push({
              lat: coords.lat,
              lng: coords.lng,
              address: school.address,
              type: 'school',
              schoolId: school.id,
              schoolName: school.name
            });
          }
        }
      }

      // Adicionar estudantes
      for (const student of students) {
        if (student.lat && student.lng) {
          points.push({
            lat: student.lat,
            lng: student.lng,
            address: student.address || 'Endereço não informado',
            type: 'student',
            studentId: student.id,
            studentName: student.name
          });
        } else if (student.address) {
          const coords = await this.geocodeAddress(student.address);
          if (coords) {
            points.push({
              lat: coords.lat,
              lng: coords.lng,
              address: student.address,
              type: 'student',
              studentId: student.id,
              studentName: student.name
            });
          }
        }
      }
    }

    console.log('📍 Pontos da rota construídos:', {
      totalPoints: points.length,
      studentPoints: points.filter(p => p.type === 'student').length,
      schoolPoints: points.filter(p => p.type === 'school').length
    });

    return points;
  }

  // Geocodificar endereço usando Mapbox
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.mapboxAccessToken) {
      console.warn('⚠️ Token do Mapbox não disponível para geocodificação');
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxAccessToken}&country=BR&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Erro na geocodificação: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log(`📍 Endereço geocodificado: ${address} -> ${lat}, ${lng}`);
        return { lat, lng };
      }

      console.warn(`⚠️ Endereço não encontrado: ${address}`);
      return null;
    } catch (error) {
      console.error('❌ Erro na geocodificação:', error);
      return null;
    }
  }

  // Calcular rota otimizada usando Mapbox Directions API
  private async calculateOptimizedRoute(
    startLocation: RouteLocation,
    routePoints: RoutePoint[]
  ): Promise<any | null> {
    if (!this.mapboxAccessToken) {
      console.warn('⚠️ Token do Mapbox não disponível para cálculo de rota');
      return null;
    }

    try {
      // Construir coordenadas para a API
      const coordinates = [
        [startLocation.lng, startLocation.lat], // Posição atual do motorista
        ...routePoints.map(point => [point.lng, point.lat])
      ];

      const coordinatesString = coordinates
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';');

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?access_token=${this.mapboxAccessToken}&geometries=geojson&overview=full&steps=true`
      );

      if (!response.ok) {
        throw new Error(`Erro na API de direções: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        console.log('🗺️ Rota calculada pelo Mapbox:', {
          distance: `${(route.distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(route.duration / 60)} min`,
          steps: route.legs?.reduce((total, leg) => total + (leg.steps?.length || 0), 0) || 0
        });
        return route;
      }

      console.warn('⚠️ Nenhuma rota encontrada pelo Mapbox');
      return null;
    } catch (error) {
      console.error('❌ Erro ao calcular rota otimizada:', error);
      return null;
    }
  }

  // Obter localização atual
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
            console.warn('⚠️ Erro na geolocalização:', error.message);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      } else {
        console.warn('⚠️ Geolocalização não suportada');
        resolve(null);
      }
    });
  }

  // Iniciar rastreamento de localização
  private startLocationTracking() {
    // Parar rastreamento anterior
    this.stopLocationTracking();

    console.log('📍 Iniciando rastreamento de localização em tempo real');

    // Atualizar localização a cada 5 segundos para melhor precisão
    this.locationUpdateInterval = setInterval(async () => {
      const route = this.getActiveTrackingRoute();
      if (route && route.isActive) {
        const location = await this.getCurrentLocation();
        if (location) {
          await this.updateDriverLocation(location);
        }
      } else {
        this.stopLocationTracking();
      }
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
      console.log('📍 Rastreamento de localização interrompido');
    }
  }

  // Atualizar localização do motorista
  private async updateDriverLocation(location: RouteLocation) {
    const route = this.getActiveTrackingRoute();
    if (route && route.isActive) {
      route.currentLocation = location;
      
      // Recalcular rota se necessário (opcional, para otimização dinâmica)
      if (this.mapboxAccessToken && route.routePoints.length > 0) {
        const updatedRoute = await this.calculateOptimizedRoute(location, route.routePoints);
        if (updatedRoute) {
          route.mapboxRoute = updatedRoute;
          route.estimatedDuration = Math.round(updatedRoute.duration / 60);
          route.totalDistance = Math.round(updatedRoute.distance);
        }
      }

      this.saveTrackingRoute(route);
      this.notifyListeners(route);

      console.log('📍 Localização do motorista atualizada:', {
        lat: location.lat.toFixed(6),
        lng: location.lng.toFixed(6),
        accuracy: location.accuracy ? `${location.accuracy.toFixed(0)}m` : 'N/A'
      });
    }
  }

  // Salvar rota de rastreamento
  private saveTrackingRoute(route: TrackingRoute) {
    try {
      localStorage.setItem('realTimeTrackingRoute', JSON.stringify(route));
      localStorage.setItem('trackingRouteFlag', 'true');
    } catch (error) {
      console.error('❌ Erro ao salvar rota de rastreamento:', error);
    }
  }

  // Obter rota de rastreamento ativa
  getActiveTrackingRoute(): TrackingRoute | null {
    try {
      const stored = localStorage.getItem('realTimeTrackingRoute');
      const flag = localStorage.getItem('trackingRouteFlag');
      
      if (stored && flag === 'true') {
        const route = JSON.parse(stored);
        
        // Verificar se a rota não é muito antiga (mais de 4 horas)
        const startTime = new Date(route.startTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 4) {
          console.log('⏰ Rota de rastreamento muito antiga, limpando...');
          this.endRouteTracking();
          return null;
        }
        
        if (route.isActive) {
          return route;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar rota de rastreamento:', error);
    }
    
    return null;
  }

  // Encerrar rastreamento de rota
  endRouteTracking(): boolean {
    console.log('🏁 Encerrando rastreamento de rota');
    
    const route = this.getActiveTrackingRoute();
    if (route) {
      route.isActive = false;
      route.endTime = new Date().toISOString();
      
      console.log('✅ Rota de rastreamento encerrada:', {
        id: route.id,
        driverName: route.driverName,
        duration: route.endTime && route.startTime ? 
          `${Math.round((new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / (1000 * 60))} min` : 
          'N/A'
      });
    }

    // Parar rastreamento de localização
    this.stopLocationTracking();

    // Limpar dados
    localStorage.removeItem('realTimeTrackingRoute');
    localStorage.removeItem('trackingRouteFlag');

    // Notificar listeners
    this.notifyListeners(null);

    return true;
  }

  // Verificar se há rota ativa
  hasActiveRoute(): boolean {
    const route = this.getActiveTrackingRoute();
    return !!(route && route.isActive);
  }

  // Obter informações da rota para o painel do responsável
  getRouteInfoForGuardian(guardianId: string): {
    hasActiveRoute: boolean;
    driverLocation?: RouteLocation;
    routeGeometry?: any;
    estimatedArrival?: string;
    nextStop?: RoutePoint;
  } {
    const route = this.getActiveTrackingRoute();
    
    if (!route || !route.isActive) {
      return { hasActiveRoute: false };
    }

    // Encontrar próxima parada
    const nextStop = route.routePoints.find(point => 
      point.type === 'student' && point.studentId // Lógica pode ser refinada
    );

    return {
      hasActiveRoute: true,
      driverLocation: route.currentLocation,
      routeGeometry: route.mapboxRoute?.geometry,
      estimatedArrival: route.estimatedDuration ? 
        `${route.estimatedDuration} minutos` : undefined,
      nextStop
    };
  }
}

export const realTimeTrackingService = RealTimeTrackingService.getInstance();