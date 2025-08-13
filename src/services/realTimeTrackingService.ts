import { RouteLocation, ActiveRoute } from './routeTrackingService';
import { pushNotificationService } from './pushNotificationService';

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
  locationHistory?: RouteLocation[]; // Histórico de posições para visualizar movimento
  currentSpeed?: number; // Velocidade atual em m/s
  currentHeading?: number; // Direção atual em graus
  routePoints: RoutePoint[];
  mapboxRoute?: any; // Dados da rota do Mapbox
  estimatedDuration?: number; // em minutos
  totalDistance?: number; // em metros
  notificationsEnabled?: boolean; // Se notificações estão habilitadas para esta rota
  proximityNotificationsSent?: Set<string>; // IDs dos estudantes que já receberam notificação
  offRouteThreshold?: number; // Distância em metros para considerar fora da rota (padrão: 100m)
  lastRouteRecalculation?: string; // Timestamp da última recalculação
  isOffRoute?: boolean; // Se o motorista está fora da rota
  offRouteDistance?: number; // Distância atual da rota em metros
}

class RealTimeTrackingService {
  private static instance: RealTimeTrackingService;
  private listeners: ((route: TrackingRoute | null) => void)[] = [];
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private watchPositionId: number | null = null;
  private mapboxAccessToken: string = '';
  private lastKnownLocation: RouteLocation | null = null;
  private hasRetriedLocation: boolean = false;
  private locationCache: Map<string, { location: RouteLocation; timestamp: number }> = new Map();
  private offRouteThreshold: number = 100; // metros
  private minRecalculationInterval: number = 30000; // 30 segundos entre recalculações
  private autoNavigationEnabled: boolean = true; // Navegação automática habilitada por padrão
  private constructor() {
    // Configurar token do Mapbox automaticamente
    this.updateMapboxToken();
  }

  // Atualizar token do Mapbox automaticamente
  private updateMapboxToken() {
    // Primeiro, tentar buscar do ambiente (.env)
    const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (envToken && envToken.startsWith('pk.') && envToken.length > 20) {
      this.mapboxAccessToken = envToken;
      console.log('✅ Token do Mapbox configurado automaticamente do ambiente (.env)');
      return;
    }
    
    // Se não houver no ambiente, buscar do localStorage
    const savedToken = localStorage.getItem('mapboxAccessToken');
    if (savedToken && savedToken.startsWith('pk.') && savedToken.length > 20) {
      this.mapboxAccessToken = savedToken;
      console.log('✅ Token do Mapbox configurado automaticamente do localStorage');
      return;
    }
    
    this.mapboxAccessToken = '';
    console.warn('⚠️ Token do Mapbox não configurado. Funcionalidades de rota podem não funcionar.');
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
    console.log('🗺️ Token do Mapbox configurado manualmente');
  }

  // Recarregar token do Mapbox automaticamente
  reloadMapboxToken() {
    this.updateMapboxToken();
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

  // Obter localização atual com alta precisão usando técnicas avançadas
  private getCurrentLocation(): Promise<RouteLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalização não suportada');
        resolve(null);
        return;
      }

      // Configurações otimizadas baseadas na documentação MDN mais recente
      const options: PositionOptions = {
        enableHighAccuracy: true,    // Força uso do GPS para máxima precisão
        timeout: 30000,              // 30 segundos - tempo suficiente para GPS obter fix
        maximumAge: 0                // Sempre buscar nova localização (sem cache)
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: RouteLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0
          };

          // Validar qualidade da localização baseado na documentação MDN
          const isHighQuality = this.validateLocationQuality(position.coords);

          console.log('📍 Nova localização obtida:', {
            lat: location.lat.toFixed(6),
            lng: location.lng.toFixed(6),
            accuracy: `${location.accuracy?.toFixed(0)}m`,
            speed: location.speed ? `${(location.speed * 3.6).toFixed(1)} km/h` : 'N/A',
            heading: location.heading ? `${location.heading.toFixed(0)}°` : 'N/A',
            timestamp: location.timestamp,
            source: 'getCurrentPosition',
            quality: isHighQuality ? '🟢 Alta' : '🟡 Média'
          });

          // Se a qualidade não for boa, tentar novamente uma vez
          if (!isHighQuality && !this.hasRetriedLocation) {
            console.log('🔄 Qualidade baixa, tentando novamente...');
            this.hasRetriedLocation = true;
            setTimeout(() => {
              this.getCurrentLocation().then(retryLocation => {
                this.hasRetriedLocation = false;
                resolve(retryLocation || location);
              });
            }, 2000);
            return;
          }

          this.hasRetriedLocation = false;
          resolve(location);
        },
        (error) => {
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada pelo usuário';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informações de localização indisponíveis';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout na obtenção da localização';
              break;
            default:
              errorMessage = 'Erro desconhecido na geolocalização';
              break;
          }

          console.warn('⚠️ Erro na geolocalização:', errorMessage);
          resolve(null);
        },
        options
      );
    });
  }

  // Iniciar rastreamento contínuo com watchPosition otimizado
  private startContinuousLocationTracking(): number | null {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalização não suportada para rastreamento contínuo');
      return null;
    }

    // Configurações otimizadas para rastreamento contínuo de alta precisão
    const options: PositionOptions = {
      enableHighAccuracy: true,    // GPS obrigatório para precisão máxima
      timeout: 25000,              // Timeout generoso para permitir GPS fix
      maximumAge: 0                // Sempre nova localização (crítico para rastreamento)
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: RouteLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        };

        // Validar qualidade da localização contínua
        const isHighQuality = this.validateLocationQuality(position.coords);

        console.log('📍 Localização contínua obtida:', {
          lat: location.lat.toFixed(6),
          lng: location.lng.toFixed(6),
          accuracy: `${location.accuracy?.toFixed(0)}m`,
          speed: location.speed ? `${(location.speed * 3.6).toFixed(1)} km/h` : 'N/A',
          heading: location.heading ? `${location.heading.toFixed(0)}°` : 'N/A',
          timestamp: location.timestamp,
          source: 'watchPosition',
          quality: isHighQuality ? '🟢 Alta' : '🟡 Média'
        });

        // Só atualizar se a qualidade for boa ou se não temos localização anterior
        if (isHighQuality || !this.lastKnownLocation) {
          this.updateDriverLocation(location);
        } else {
          console.log('⚠️ Localização de baixa qualidade ignorada no watchPosition');
        }
      },
      (error) => {
        console.warn('⚠️ Erro no rastreamento contínuo:', error.message);
      },
      options
    );

    console.log('📍 Rastreamento contínuo iniciado com watchPosition ID:', watchId);
    return watchId;
  }

  // Iniciar rastreamento de localização
  private startLocationTracking() {
    // Parar rastreamento anterior
    this.stopLocationTracking();

    console.log('📍 Iniciando rastreamento de localização em tempo real');

    // Backup: Forçar atualização a cada 3 segundos para garantir precisão
    this.locationUpdateInterval = setInterval(async () => {
      const route = this.getActiveTrackingRoute();
      if (route && route.isActive) {
        // Verificar se a última localização é muito antiga (mais de 5 segundos)
        const now = new Date().getTime();
        const lastUpdate = this.lastKnownLocation ? new Date(this.lastKnownLocation.timestamp).getTime() : 0;
        const timeDiff = now - lastUpdate;

        if (timeDiff > 5000 || !this.lastKnownLocation) {
          console.log('📍 Forçando atualização de localização (backup) - última atualização há', Math.round(timeDiff / 1000), 'segundos');
          const location = await this.getCurrentLocation();
          if (location) {
            await this.updateDriverLocation(location);
          }
        } else {
          console.log('📍 Localização recente - última atualização há', Math.round(timeDiff / 1000), 'segundos');
        }
      } else {
        this.stopLocationTracking();
      }
    }, 3000);

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
    if (!route || !route.isActive) return;

    // Atualizar localização atual
    const previousLocation = route.currentLocation;
    route.currentLocation = location;
    this.lastKnownLocation = location;

    // Adicionar ao cache inteligente
    this.addToLocationCache(location);

    // Inicializar controle de notificações se necessário
    if (!route.proximityNotificationsSent) {
      route.proximityNotificationsSent = new Set();
    }
    if (route.notificationsEnabled === undefined) {
      route.notificationsEnabled = true; // Habilitado por padrão
    }

    // Adicionar ao histórico de posições para visualização do movimento
    if (!route.locationHistory) {
      route.locationHistory = [];
    }

    // Manter apenas as últimas 50 posições para performance
    route.locationHistory.push(location);
    if (route.locationHistory.length > 50) {
      route.locationHistory = route.locationHistory.slice(-50);
    }

    // Calcular velocidade se temos posição anterior
    if (previousLocation) {
      const distance = this.calculateDistance(
        { lat: previousLocation.lat, lng: previousLocation.lng },
        { lat: location.lat, lng: location.lng }
      );
      const timeDiff = (new Date(location.timestamp).getTime() - new Date(previousLocation.timestamp).getTime()) / 1000;
      const calculatedSpeed = timeDiff > 0 ? distance / timeDiff : 0; // m/s

      // Usar velocidade do GPS se disponível, senão usar calculada
      route.currentSpeed = location.speed || calculatedSpeed;
      route.currentHeading = location.heading || this.calculateBearing(previousLocation, location);
    }

    // Verificar proximidade e enviar notificações se habilitadas
    if (route.notificationsEnabled) {
      await this.checkProximityNotifications(route, location);
    }

    // Verificar se o motorista está fora da rota e recalcular automaticamente
    let routeWasRecalculated = false;
    if (this.mapboxAccessToken && route.routePoints.length > 0) {
      try {
        routeWasRecalculated = await this.checkOffRouteAndRecalculate(route, location);
        
        // Se não houve recalculação por desvio, fazer recálculo de otimização normal
        if (!routeWasRecalculated) {
          const updatedRoute = await this.calculateOptimizedRoute(location, route.routePoints);
          if (updatedRoute) {
            route.mapboxRoute = updatedRoute;
            route.estimatedDuration = Math.round(updatedRoute.duration / 60);
            route.totalDistance = Math.round(updatedRoute.distance);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar/recalcular rota:', error);
      }
    }

    this.saveTrackingRoute(route);
    this.notifyListeners(route);

    const speedKmh = route.currentSpeed ? (route.currentSpeed * 3.6).toFixed(1) : 'N/A';

    console.log('📍 Localização do motorista atualizada:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      accuracy: location.accuracy ? `${location.accuracy.toFixed(0)}m` : 'N/A',
      speed: `${speedKmh} km/h`,
      heading: route.currentHeading ? `${route.currentHeading.toFixed(0)}°` : 'N/A',
      historyPoints: route.locationHistory.length
    });
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

  // Verificar proximidade e enviar notificações
  private async checkProximityNotifications(route: TrackingRoute, driverLocation: RouteLocation) {
    if (!route.routePoints || route.routePoints.length === 0) return;

    // Verificar cada ponto da rota (estudantes)
    for (const point of route.routePoints) {
      if (point.type === 'student' && point.studentId && point.studentName) {
        const studentLocation = { lat: point.lat, lng: point.lng };

        // Verificar se já foi enviada notificação para este estudante
        const notificationKey = `${point.studentId}-proximity`;
        if (route.proximityNotificationsSent?.has(notificationKey)) {
          continue; // Já foi enviada
        }

        try {
          // Usar o serviço de notificações para verificar proximidade
          const notificationSent = await pushNotificationService.checkProximityAndNotify(
            { lat: driverLocation.lat, lng: driverLocation.lng },
            studentLocation,
            {
              id: point.studentId,
              name: point.studentName,
              guardianId: this.getGuardianIdForStudent(point.studentId) // Implementar se necessário
            },
            route.driverName,
            route.estimatedDuration ? `${route.estimatedDuration} minutos` : 'Em breve'
          );

          if (notificationSent) {
            route.proximityNotificationsSent?.add(notificationKey);
            console.log(`🔔 Notificação de proximidade enviada para ${point.studentName}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar proximidade para ${point.studentName}:`, error);
        }
      }
    }
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

  // Calcular distância de um ponto até uma linha (rota)
  private calculateDistanceToRoute(
    point: { lat: number; lng: number },
    routeGeometry: any
  ): number {
    if (!routeGeometry || !routeGeometry.coordinates || routeGeometry.coordinates.length < 2) {
      return Infinity;
    }

    let minDistance = Infinity;
    const coordinates = routeGeometry.coordinates;

    // Verificar distância para cada segmento da rota
    for (let i = 0; i < coordinates.length - 1; i++) {
      const segmentStart = { lat: coordinates[i][1], lng: coordinates[i][0] };
      const segmentEnd = { lat: coordinates[i + 1][1], lng: coordinates[i + 1][0] };
      
      const distanceToSegment = this.calculateDistanceToLineSegment(
        point,
        segmentStart,
        segmentEnd
      );
      
      minDistance = Math.min(minDistance, distanceToSegment);
    }

    return minDistance;
  }

  // Calcular distância de um ponto até um segmento de linha
  private calculateDistanceToLineSegment(
    point: { lat: number; lng: number },
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number }
  ): number {
    // Converter para coordenadas projetadas (aproximação simples)
    const px = point.lng;
    const py = point.lat;
    const ax = lineStart.lng;
    const ay = lineStart.lat;
    const bx = lineEnd.lng;
    const by = lineEnd.lat;

    // Calcular o ponto mais próximo no segmento
    const A = px - ax;
    const B = py - ay;
    const C = bx - ax;
    const D = by - ay;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = ax;
      yy = ay;
    } else if (param > 1) {
      xx = bx;
      yy = by;
    } else {
      xx = ax + param * C;
      yy = ay + param * D;
    }

    // Calcular distância usando Haversine
    return this.calculateDistance(point, { lat: yy, lng: xx });
  }

  // Verificar se o motorista está fora da rota e recalcular se necessário
  private async checkOffRouteAndRecalculate(
    route: TrackingRoute,
    currentLocation: RouteLocation
  ): Promise<boolean> {
    if (!route.mapboxRoute || !route.mapboxRoute.geometry) {
      return false;
    }

    // Calcular distância até a rota
    const distanceToRoute = this.calculateDistanceToRoute(
      { lat: currentLocation.lat, lng: currentLocation.lng },
      route.mapboxRoute.geometry
    );

    const threshold = route.offRouteThreshold || this.offRouteThreshold;
    const isOffRoute = distanceToRoute > threshold;
    
    // Atualizar status da rota
    route.isOffRoute = isOffRoute;
    route.offRouteDistance = distanceToRoute;

    console.log('🛣️ Verificação de desvio de rota:', {
      distanceToRoute: Math.round(distanceToRoute),
      threshold,
      isOffRoute,
      needsRecalculation: isOffRoute && this.shouldRecalculateRoute(route)
    });

    // Se estiver fora da rota, tentar recalcular
    if (isOffRoute && this.shouldRecalculateRoute(route)) {
      console.log('🔄 Motorista fora da rota! Recalculando automaticamente...');
      
      try {
        const updatedRoute = await this.calculateOptimizedRoute(currentLocation, route.routePoints);
        if (updatedRoute) {
          route.mapboxRoute = updatedRoute;
          route.estimatedDuration = Math.round(updatedRoute.duration / 60);
          route.totalDistance = Math.round(updatedRoute.distance);
          route.lastRouteRecalculation = new Date().toISOString();
          route.isOffRoute = false; // Reset após recalcular
          
          console.log('✅ Rota recalculada com sucesso:', {
            newDuration: route.estimatedDuration,
            newDistance: route.totalDistance
          });
          
          // Notificar responsáveis sobre a nova rota
          await this.notifyGuardiansAboutRouteChange(route);
          
          return true;
        }
      } catch (error) {
        console.error('❌ Erro ao recalcular rota:', error);
      }
    }

    return false;
  }

  // Verificar se deve recalcular a rota (evitar recalculações muito frequentes)
  private shouldRecalculateRoute(route: TrackingRoute): boolean {
    if (!route.lastRouteRecalculation) {
      return true;
    }

    const lastRecalculation = new Date(route.lastRouteRecalculation).getTime();
    const now = new Date().getTime();
    const timeSinceLastRecalculation = now - lastRecalculation;

    return timeSinceLastRecalculation >= this.minRecalculationInterval;
  }

  // Notificar responsáveis sobre mudança na rota
  private async notifyGuardiansAboutRouteChange(route: TrackingRoute): Promise<void> {
    try {
      // Encontrar todos os estudantes na rota
      const studentPoints = route.routePoints.filter(point => point.type === 'student');
      
      for (const studentPoint of studentPoints) {
        if (studentPoint.studentId) {
          const guardianId = this.getGuardianIdForStudent(studentPoint.studentId);
          
          if (guardianId) {
            await pushNotificationService.sendRouteUpdateNotification({
              guardianId,
              studentName: studentPoint.studentName || 'Estudante',
              driverName: route.driverName,
              newEstimatedArrival: this.calculateEstimatedArrival(route),
              reason: 'Rota recalculada automaticamente'
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao notificar responsáveis sobre mudança na rota:', error);
    }
  }

  // Calcular horário estimado de chegada
  private calculateEstimatedArrival(route: TrackingRoute): string {
    if (!route.estimatedDuration) {
      return 'Não disponível';
    }

    const now = new Date();
    const arrivalTime = new Date(now.getTime() + route.estimatedDuration * 60 * 1000);
    
    return arrivalTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calcular direção entre dois pontos (Haversine)
  private calculateBearing(from: RouteLocation, to: RouteLocation): number {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const deltaLng = (to.lng - from.lng) * Math.PI / 180;

    const x = Math.sin(deltaLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = Math.atan2(x, y) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalizar para 0-360
  }

  // Obter ID do responsável para um estudante (implementar conforme necessário)
  private getGuardianIdForStudent(studentId: string): string {
    // Por enquanto, retornar um ID genérico
    // Em uma implementação real, isso viria do banco de dados
    return `guardian-${studentId}`;
  }

  // Habilitar/desabilitar notificações para a rota ativa
  setNotificationsEnabled(enabled: boolean): boolean {
    const route = this.getActiveTrackingRoute();
    if (route) {
      route.notificationsEnabled = enabled;
      this.saveTrackingRoute(route);
      console.log(`🔔 Notificações ${enabled ? 'habilitadas' : 'desabilitadas'} para a rota`);
      return true;
    }
    return false;
  }

  // Verificar se notificações estão habilitadas
  areNotificationsEnabled(): boolean {
    const route = this.getActiveTrackingRoute();
    return route?.notificationsEnabled ?? true;
  }

  // Limpar notificações enviadas (para permitir reenvio)
  clearProximityNotifications(): boolean {
    const route = this.getActiveTrackingRoute();
    if (route) {
      route.proximityNotificationsSent?.clear();
      this.saveTrackingRoute(route);
      console.log('🧹 Cache de notificações de proximidade limpo');
      return true;
    }
    return false;
  }

  // Limpar cache de localização
  clearLocationCache(): void {
    this.locationCache.clear();
    console.log('🧹 Cache de localização limpo');
  }

  // Adicionar localização ao cache inteligente
  private addToLocationCache(location: RouteLocation): void {
    const key = `${location.lat.toFixed(4)}-${location.lng.toFixed(4)}`;
    this.locationCache.set(key, {
      location,
      timestamp: Date.now()
    });

    // Limpar entradas antigas (mais de 5 minutos)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [cacheKey, cached] of this.locationCache.entries()) {
      if (cached.timestamp < fiveMinutesAgo) {
        this.locationCache.delete(cacheKey);
      }
    }
  }

  // Configurar threshold de proximidade
  setProximityThreshold(meters: number): void {
    pushNotificationService.setProximityThreshold(meters);
  }

  // Obter threshold de proximidade atual
  getProximityThreshold(): number {
    return pushNotificationService.getProximityThreshold();
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission(): Promise<boolean> {
    return await pushNotificationService.requestPermission();
  }

  // Validar qualidade da localização baseado na documentação MDN
  private validateLocationQuality(coords: GeolocationCoordinates): boolean {
    // Critérios de qualidade baseados na documentação MDN:
    // 1. Precisão menor que 50m é considerada boa
    // 2. Coordenadas válidas (não 0,0 que pode indicar erro)
    // 3. Timestamp recente (implícito no getCurrentPosition)

    const hasGoodAccuracy = coords.accuracy && coords.accuracy < 50;
    const hasValidCoordinates = coords.latitude !== 0 || coords.longitude !== 0;
    const hasReasonableCoordinates = Math.abs(coords.latitude) <= 90 && Math.abs(coords.longitude) <= 180;

    const isHighQuality = hasGoodAccuracy && hasValidCoordinates && hasReasonableCoordinates;

    console.log('🔍 Validação de qualidade da localização:', {
      accuracy: coords.accuracy ? `${coords.accuracy.toFixed(0)}m` : 'N/A',
      hasGoodAccuracy: hasGoodAccuracy ? '✅' : '❌',
      hasValidCoordinates: hasValidCoordinates ? '✅' : '❌',
      hasReasonableCoordinates: hasReasonableCoordinates ? '✅' : '❌',
      overallQuality: isHighQuality ? '🟢 Alta' : '🟡 Média'
    });

    return isHighQuality;
  }

  // Testar notificação
  async testNotification(): Promise<boolean> {
    return await pushNotificationService.testNotification();
  }

  // Forçar atualização imediata da localização com múltiplas tentativas
  async forceLocationUpdate(): Promise<boolean> {
    console.log('🔄 Forçando atualização imediata da localização...');

    // Tentar múltiplas estratégias de localização
    const location = await this.getLocationWithFallback();

    if (location) {
      await this.updateDriverLocation(location);
      console.log('✅ Localização atualizada com sucesso');
      return true;
    }
    console.warn('❌ Falha ao obter nova localização com todas as estratégias');
    return false;
  }

  // Obter localização com múltiplas estratégias de fallback
  private async getLocationWithFallback(): Promise<RouteLocation | null> {
    console.log('🎯 Tentando obter localização com estratégias múltiplas...');

    // Estratégia 1: Alta precisão com timeout longo
    try {
      const highAccuracyLocation = await this.getLocationWithOptions({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      });

      if (highAccuracyLocation && this.validateLocationQuality(highAccuracyLocation)) {
        console.log('✅ Localização de alta precisão obtida');
        return this.convertToRouteLocation(highAccuracyLocation);
      }
    } catch (error) {
      console.log('⚠️ Estratégia de alta precisão falhou, tentando fallback...');
    }

    // Estratégia 2: Precisão média com timeout menor
    try {
      const mediumAccuracyLocation = await this.getLocationWithOptions({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 5000
      });

      if (mediumAccuracyLocation) {
        console.log('✅ Localização de precisão média obtida');
        return this.convertToRouteLocation(mediumAccuracyLocation);
      }
    } catch (error) {
      console.log('⚠️ Estratégia de precisão média falhou');
    }

    // Estratégia 3: Usar cache recente se disponível
    if (this.lastKnownLocation) {
      const timeSinceLastLocation = Date.now() - new Date(this.lastKnownLocation.timestamp).getTime();
      if (timeSinceLastLocation < 60000) { // Menos de 1 minuto
        console.log('✅ Usando localização em cache (< 1 minuto)');
        return this.lastKnownLocation;
      }
    }

    console.warn('❌ Todas as estratégias de localização falharam');
    return null;
  }

  // Obter localização com opções específicas
  private getLocationWithOptions(options: PositionOptions): Promise<GeolocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          console.warn(`Erro na geolocalização (${error.code}): ${error.message}`);
          resolve(null);
        },
        options
      );
    });
  }

  // Converter GeolocationCoordinates para RouteLocation
  private convertToRouteLocation(coords: GeolocationCoordinates): RouteLocation {
    return {
      lat: coords.latitude,
      lng: coords.longitude,
      timestamp: new Date().toISOString(),
      accuracy: coords.accuracy,
      speed: coords.speed || 0,
      heading: coords.heading || 0
    };
  }

  // Validar qualidade usando GeolocationCoordinates
  private validateLocationQuality(coords: GeolocationCoordinates): boolean {
    const hasGoodAccuracy = coords.accuracy && coords.accuracy < 50;
    const hasValidCoordinates = coords.latitude !== 0 || coords.longitude !== 0;
    const hasReasonableCoordinates = Math.abs(coords.latitude) <= 90 && Math.abs(coords.longitude) <= 180;

    return hasGoodAccuracy && hasValidCoordinates && hasReasonableCoordinates;
  }

  // Obter status detalhado da última localização
  getLocationStatus(): {
    hasLocation: boolean;
    lastUpdate?: string;
    timeSinceUpdate?: number;
    accuracy?: number;
    quality?: 'high' | 'medium' | 'low';
    coordinates?: { lat: number; lng: number };
    speed?: number;
    heading?: number;
  } {
    if (!this.lastKnownLocation) {
      return { hasLocation: false };
    }

    const now = new Date().getTime();
    const lastUpdate = new Date(this.lastKnownLocation.timestamp).getTime();
    const timeSinceUpdate = now - lastUpdate;

    // Determinar qualidade baseada na precisão e idade
    let quality: 'high' | 'medium' | 'low' = 'low';
    if (this.lastKnownLocation.accuracy) {
      if (this.lastKnownLocation.accuracy < 20 && timeSinceUpdate < 10000) {
        quality = 'high';
      } else if (this.lastKnownLocation.accuracy < 50 && timeSinceUpdate < 30000) {
        quality = 'medium';
      }
    }

    return {
      hasLocation: true,
      lastUpdate: this.lastKnownLocation.timestamp,
      timeSinceUpdate: Math.round(timeSinceUpdate / 1000), // em segundos
      accuracy: this.lastKnownLocation.accuracy,
      quality,
      coordinates: {
        lat: this.lastKnownLocation.lat,
        lng: this.lastKnownLocation.lng
      },
      speed: this.lastKnownLocation.speed,
      heading: this.lastKnownLocation.heading
    };
  }

  // Obter estatísticas de qualidade da localização
  getLocationQualityStats(): {
    averageAccuracy?: number;
    bestAccuracy?: number;
    worstAccuracy?: number;
    totalUpdates: number;
    highQualityPercentage: number;
  } {
    const route = this.getActiveTrackingRoute();
    if (!route?.locationHistory || route.locationHistory.length === 0) {
      return {
        totalUpdates: 0,
        highQualityPercentage: 0
      };
    }

    const accuracies = route.locationHistory
      .map(loc => loc.accuracy)
      .filter(acc => acc !== undefined) as number[];

    if (accuracies.length === 0) {
      return {
        totalUpdates: route.locationHistory.length,
        highQualityPercentage: 0
      };
    }

    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const bestAccuracy = Math.min(...accuracies);
    const worstAccuracy = Math.max(...accuracies);
    const highQualityCount = accuracies.filter(acc => acc < 20).length;
    const highQualityPercentage = (highQualityCount / accuracies.length) * 100;

    return {
      averageAccuracy: Math.round(averageAccuracy),
      bestAccuracy: Math.round(bestAccuracy),
      worstAccuracy: Math.round(worstAccuracy),
      totalUpdates: route.locationHistory.length,
      highQualityPercentage: Math.round(highQualityPercentage)
    };
  }

  // Configurar limite de distância para considerar fora da rota
  setOffRouteThreshold(meters: number): void {
    this.offRouteThreshold = Math.max(10, meters); // Mínimo de 10 metros
    console.log('🛣️ Limite de desvio de rota configurado:', this.offRouteThreshold, 'metros');
  }

  // Obter limite atual de desvio de rota
  getOffRouteThreshold(): number {
    return this.offRouteThreshold;
  }

  // Configurar intervalo mínimo entre recalculações
  setMinRecalculationInterval(milliseconds: number): void {
    this.minRecalculationInterval = Math.max(10000, milliseconds); // Mínimo de 10 segundos
    console.log('⏱️ Intervalo mínimo de recalculação configurado:', this.minRecalculationInterval / 1000, 'segundos');
  }

  // Obter intervalo atual entre recalculações
  getMinRecalculationInterval(): number {
    return this.minRecalculationInterval;
  }

  // Obter status de desvio de rota
  getOffRouteStatus(): {
    isOffRoute: boolean;
    distanceFromRoute?: number;
    threshold: number;
    lastRecalculation?: string;
    timeSinceLastRecalculation?: number;
  } {
    const route = this.getActiveTrackingRoute();
    
    if (!route) {
      return {
        isOffRoute: false,
        threshold: this.offRouteThreshold
      };
    }

    let timeSinceLastRecalculation: number | undefined;
    if (route.lastRouteRecalculation) {
      const lastRecalc = new Date(route.lastRouteRecalculation).getTime();
      const now = new Date().getTime();
      timeSinceLastRecalculation = Math.round((now - lastRecalc) / 1000);
    }

    return {
      isOffRoute: route.isOffRoute || false,
      distanceFromRoute: route.offRouteDistance,
      threshold: route.offRouteThreshold || this.offRouteThreshold,
      lastRecalculation: route.lastRouteRecalculation,
      timeSinceLastRecalculation
    };
  }

  // Forçar recalculação da rota (ignorar intervalo mínimo)
  async forceRouteRecalculation(): Promise<boolean> {
    const route = this.getActiveTrackingRoute();
    
    if (!route || !route.isActive || !route.currentLocation) {
      console.warn('⚠️ Não há rota ativa para recalcular');
      return false;
    }

    if (!this.mapboxAccessToken) {
      console.warn('⚠️ Token do Mapbox não configurado');
      return false;
    }

    console.log('🔄 Forçando recalculação da rota...');
    
    try {
      const updatedRoute = await this.calculateOptimizedRoute(route.currentLocation, route.routePoints);
      if (updatedRoute) {
        route.mapboxRoute = updatedRoute;
        route.estimatedDuration = Math.round(updatedRoute.duration / 60);
        route.totalDistance = Math.round(updatedRoute.distance);
        route.lastRouteRecalculation = new Date().toISOString();
        route.isOffRoute = false;
        
        this.saveTrackingRoute(route);
        this.notifyListeners(route);
        
        console.log('✅ Rota recalculada com sucesso (forçada)');
        
        // Notificar responsáveis
        await this.notifyGuardiansAboutRouteChange(route);
        
        return true;
      }
    } catch (error) {
      console.error('❌ Erro ao forçar recalculação da rota:', error);
    }

    return false;
  }

  /**
   * Configura se a navegação automática está habilitada
   */
  setAutoNavigationEnabled(enabled: boolean): void {
    this.autoNavigationEnabled = enabled;
    localStorage.setItem('autoNavigationEnabled', JSON.stringify(enabled));
  }

  /**
   * Verifica se a navegação automática está habilitada
   */
  isAutoNavigationEnabled(): boolean {
    try {
      const stored = localStorage.getItem('autoNavigationEnabled');
      if (stored !== null) {
        this.autoNavigationEnabled = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar configuração de navegação automática:', error);
    }
    return this.autoNavigationEnabled;
  }

}

export const realTimeTrackingService = RealTimeTrackingService.getInstance();