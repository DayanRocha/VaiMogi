import { RouteLocation, RoutePoint } from '@/hooks/useRealTimeTracking';
import { ActiveTrip, Route, School, Student, TripStudent } from '@/types/driver';

interface LocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  accuracy: number;
}

interface RouteSimulationConfig {
  driverId: string;
  routeId: string;
  startTime: string;
  speed: number;
  paused: boolean;
}

interface LocationStatus {
  accuracy: number;
  quality: 'high' | 'medium' | 'low';
  timeSinceUpdate: number;
}

interface LocationQualityStats {
  totalUpdates: number;
  highQualityUpdates: number;
  mediumQualityUpdates: number;
  lowQualityUpdates: number;
  averageAccuracy: number | null;
  highQualityPercentage: number;
  mediumQualityPercentage: number;
  lowQualityPercentage: number;
}

class RealTimeTrackingService {
  private locationHistory: { [driverId: string]: RouteLocation[] } = {};
  private activeRoutes: { [driverId: string]: ActiveTrip } = {};
  private routeSimulationConfigs: { [driverId: string]: RouteSimulationConfig } = {};
  private lastLocationUpdates: { [driverId: string]: { latitude: number; longitude: number; timestamp: number, accuracy: number } } = {};
  private locationStatus: LocationStatus = {
    accuracy: 0,
    quality: 'low',
    timeSinceUpdate: 0,
  };
  private locationQualityStats: LocationQualityStats = {
    totalUpdates: 0,
    highQualityUpdates: 0,
    mediumQualityUpdates: 0,
    lowQualityUpdates: 0,
    averageAccuracy: null,
    highQualityPercentage: 0,
    mediumQualityPercentage: 0,
    lowQualityPercentage: 0,
  };
  private schoolData: { [schoolId: string]: School } = {};
  private studentsData: { [studentId: string]: Student } = {};
  private routesData: { [routeId: string]: Route } = {};

  constructor() {
    // Inicializar dados mock de escolas
    this.schoolData['school-1'] = { id: 'school-1', name: 'Escola A', address: 'Rua X, 123' };
    this.schoolData['school-2'] = { id: 'school-2', name: 'Escola B', address: 'Rua Y, 456' };

    // Inicializar dados mock de estudantes
    this.studentsData['student-1'] = {
      id: 'student-1',
      name: 'Alice',
      address: 'Rua Z, 789',
      guardianId: 'guardian-1',
      guardianPhone: '1111-1111',
      guardianEmail: 'alice@example.com',
      pickupPoint: 'Frente ao portão',
      schoolId: 'school-1',
      status: 'waiting',
      dropoffLocation: 'home'
    };
    this.studentsData['student-2'] = {
      id: 'student-2',
      name: 'Bob',
      address: 'Rua W, 012',
      guardianId: 'guardian-2',
      guardianPhone: '2222-2222',
      guardianEmail: 'bob@example.com',
      pickupPoint: 'Esquina',
      schoolId: 'school-2',
      status: 'waiting',
      dropoffLocation: 'school'
    };

    // Inicializar dados mock de rotas
    this.routesData['route-1'] = {
      id: 'route-1',
      driverId: 'driver-123',
      name: 'Rota da Manhã',
      startTime: '07:00',
      weekDays: ['Seg', 'Qua', 'Sex'],
      students: [this.studentsData['student-1'], this.studentsData['student-2']],
      studentConfigs: [
        { studentId: 'student-1', direction: 'desembarque' },
        { studentId: 'student-2', direction: 'embarque' }
      ]
    };
  }

  updateLocation(locationUpdate: LocationUpdate): void {
    const { driverId, latitude, longitude, timestamp, speed, accuracy } = locationUpdate;

    // Atualizar histórico de localização
    if (!this.locationHistory[driverId]) {
      this.locationHistory[driverId] = [];
    }

    const newLocation: RouteLocation = {
      lat: latitude,
      lng: longitude,
      timestamp: timestamp,
    };

    this.locationHistory[driverId].push(newLocation);

    // Limitar o histórico para os últimos 100 registros
    if (this.locationHistory[driverId].length > 100) {
      this.locationHistory[driverId].shift();
    }

    // Atualizar a última localização conhecida
    this.lastLocationUpdates[driverId] = {
      latitude,
      longitude,
      timestamp: new Date(timestamp).getTime(),
      accuracy
    };

    // Atualizar o status da localização
    this.updateLocationStatus(accuracy);
  }

  private updateLocationStatus(accuracy: number): void {
    this.locationQualityStats.totalUpdates++;

    if (accuracy <= 10) {
      this.locationStatus.quality = 'high';
      this.locationQualityStats.highQualityUpdates++;
    } else if (accuracy <= 30) {
      this.locationStatus.quality = 'medium';
      this.locationQualityStats.mediumQualityUpdates++;
    } else {
      this.locationStatus.quality = 'low';
      this.locationQualityStats.lowQualityUpdates++;
    }

    this.locationStatus.accuracy = accuracy;
    this.locationStatus.timeSinceUpdate = 0; // Será atualizado em outro método

    // Recalcular estatísticas de qualidade
    this.recalculateQualityStats();
  }

  private recalculateQualityStats(): void {
    const { totalUpdates, highQualityUpdates, mediumQualityUpdates, lowQualityUpdates } = this.locationQualityStats;

    // Calcular porcentagens
    this.locationQualityStats.highQualityPercentage = (highQualityUpdates / totalUpdates) * 100;
    this.locationQualityStats.mediumQualityPercentage = (mediumQualityUpdates / totalUpdates) * 100;
    this.locationQualityStats.lowQualityPercentage = (lowQualityUpdates / totalUpdates) * 100;

    // Calcular a média da precisão
    let totalAccuracy = 0;
    for (const driverId in this.lastLocationUpdates) {
      totalAccuracy += this.lastLocationUpdates[driverId].accuracy;
    }
    this.locationQualityStats.averageAccuracy = totalUpdates > 0 ? totalAccuracy / totalUpdates : null;
  }

  getLocationHistory(driverId: string): RouteLocation[] {
    return this.locationHistory[driverId] || [];
  }

  startRouteSimulation(config: RouteSimulationConfig): void {
    this.routeSimulationConfigs[config.driverId] = config;
    this.simulateRoute(config);
  }

  stopRouteSimulation(driverId: string): void {
    delete this.routeSimulationConfigs[driverId];
  }

  pauseRouteSimulation(driverId: string): void {
    if (this.routeSimulationConfigs[driverId]) {
      this.routeSimulationConfigs[driverId].paused = true;
    }
  }

  resumeRouteSimulation(driverId: string): void {
    if (this.routeSimulationConfigs[driverId]) {
      this.routeSimulationConfigs[driverId].paused = false;
      this.simulateRoute(this.routeSimulationConfigs[driverId]);
    }
  }

  private async simulateRoute(config: RouteSimulationConfig): Promise<void> {
    if (!this.routeSimulationConfigs[config.driverId] || this.routeSimulationConfigs[config.driverId].paused) {
      return;
    }

    const route = this.routesData[config.routeId];
    if (!route) {
      console.warn(`Rota ${config.routeId} não encontrada para simulação.`);
      return;
    }

    const waypoints = this.getRouteWaypoints(route);
    let currentIndex = 0;

    const tick = async () => {
      if (!this.routeSimulationConfigs[config.driverId] || this.routeSimulationConfigs[config.driverId].paused) {
        return;
      }

      const currentWaypoint = waypoints[currentIndex];
      const nextWaypoint = waypoints[currentIndex + 1];

      if (!nextWaypoint) {
        console.log('Simulação de rota concluída.');
        return;
      }

      const latDiff = nextWaypoint.lat - currentWaypoint.lat;
      const lngDiff = nextWaypoint.lng - currentWaypoint.lng;

      const steps = 100; // Número de passos entre os waypoints
      let currentStep = 0;

      const interval = setInterval(() => {
        if (!this.routeSimulationConfigs[config.driverId] || this.routeSimulationConfigs[config.driverId].paused) {
          clearInterval(interval);
          return;
        }

        currentStep++;
        const simulatedLatitude = currentWaypoint.lat + (latDiff * currentStep / steps);
        const simulatedLongitude = currentWaypoint.lng + (lngDiff * currentStep / steps);
        const timestamp = new Date().toISOString();
        const accuracy = Math.random() * 15 + 5; // Simula a precisão entre 5 e 20 metros

        this.updateLocation({
          driverId: config.driverId,
          latitude: simulatedLatitude,
          longitude: simulatedLongitude,
          timestamp: timestamp,
          speed: config.speed,
          accuracy: accuracy
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          currentIndex++;
          tick(); // Avança para o próximo waypoint
        }
      }, 100); // Intervalo de 100ms
    };

    tick();
  }

  private getRouteWaypoints(route: Route): RoutePoint[] {
    const waypoints: RoutePoint[] = [];

    // Adicionar estudantes como waypoints
    route.students.forEach(student => {
      waypoints.push({
        id: student.id,
        type: 'student',
        studentName: student.name,
        address: student.address,
        lat: parseFloat(''+student.address.split(',')[0]),
        lng: parseFloat(''+student.address.split(',')[1]),
      });
    });

    return waypoints;
  }

  startTrackingRoute(driverId: string, routeId: string): void {
    const route = this.routesData[routeId];
    if (!route) {
      console.warn(`Rota ${routeId} não encontrada.`);
      return;
    }

    // Criar uma cópia da rota para não modificar a original
    const activeRoute: ActiveTrip = {
      id: 'trip-' + Date.now(),
      routeId: route.id,
      driverId: driverId,
      date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      students: route.students.map(student => ({
        studentId: student.id,
        status: 'waiting',
        direction: 'to_school' // Assumindo 'to_school' como padrão
      }))
    };

    this.activeRoutes[driverId] = activeRoute;
  }

  stopTrackingRoute(driverId: string): void {
    delete this.activeRoutes[driverId];
  }

  getActiveTrackingRoute(driverId?: string): any {
    if (!driverId) {
      // Se nenhum driverId for fornecido, retorna a primeira rota ativa encontrada
      const driverIds = Object.keys(this.activeRoutes);
      if (driverIds.length > 0) {
        const currentDriverId = driverIds[0];
        const activeRoute = this.activeRoutes[currentDriverId];
        const currentLocation = this.lastLocationUpdates[currentDriverId];
        const locationHistory = this.getLocationHistory(currentDriverId);

        if (activeRoute) {
          return {
            ...activeRoute,
            currentLocation: currentLocation ? {
              lat: currentLocation.latitude,
              lng: currentLocation.longitude
            } : null,
            locationHistory: locationHistory,
            currentSpeed: this.getCurrentSpeed(currentDriverId),
            routePoints: this.getRoutePoints(activeRoute)
          };
        }
      }
      return null;
    }

    const activeRoute = this.activeRoutes[driverId];
    const currentLocation = this.lastLocationUpdates[driverId];
    const locationHistory = this.getLocationHistory(driverId);

    if (activeRoute) {
      return {
        ...activeRoute,
        currentLocation: currentLocation ? {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude
        } : null,
        locationHistory: locationHistory,
        currentSpeed: this.getCurrentSpeed(driverId),
        routePoints: this.getRoutePoints(activeRoute)
      };
    }

    return null;
  }

  private getCurrentSpeed(driverId: string): number {
    const history = this.locationHistory[driverId];
    if (!history || history.length < 2) {
      return 0;
    }

    const lastLocation = history[history.length - 1];
    const secondLastLocation = history[history.length - 2];

    const timeDiff = new Date(lastLocation.timestamp).getTime() - new Date(secondLastLocation.timestamp).getTime();
    if (timeDiff === 0) {
      return 0;
    }

    const distance = this.calculateDistance(
      secondLastLocation.lat,
      secondLastLocation.lng,
      lastLocation.lat,
      lastLocation.lng
    );

    return distance / (timeDiff / 3600000); // km/h
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getRoutePoints(activeRoute: ActiveTrip): any[] {
    const route = this.routesData[activeRoute.routeId];
    if (!route) {
      return [];
    }

    const routePoints: any[] = [];
    const studentsByAddress: { [address: string]: any[] } = {};

    // Agrupar estudantes pelo mesmo endereço
    route.students.forEach(student => {
      if (!studentsByAddress[student.address]) {
        studentsByAddress[student.address] = [];
      }
      studentsByAddress[student.address].push(student);
    });

    // Criar pontos da rota
    Object.keys(studentsByAddress).forEach(address => {
      const students = studentsByAddress[address];

      if (students.length === 1) {
        // Se houver apenas um estudante no endereço, criar um ponto normal
        const student = students[0];
        routePoints.push({
          id: student.id,
          type: 'student',
          studentId: student.id,
          studentName: student.name,
          schoolName: this.getSchoolData(student.schoolId).name,
          address: student.address,
          lat: parseFloat(''+student.address.split(',')[0]),
          lng: parseFloat(''+student.address.split(',')[1]),
        });
      } else {
        // Se houver múltiplos estudantes no mesmo endereço, criar um ponto "misto"
        const mixedPoint = {
          id: `mixed-${address}`,
          type: 'mixed',
          address: address,
          lat: parseFloat(''+address.split(',')[0]),
          lng: parseFloat(''+address.split(',')[1]),
          students: students.map(student => ({
            id: student.id,
            name: student.name,
            schoolName: this.getSchoolData(student.schoolId).name
          })),
          schools: students.map(student => this.getSchoolData(student.schoolId))
        };
        routePoints.push(mixedPoint);
      }
    });

    // Adicionar escolas como pontos da rota
    const schools = Object.values(this.schoolData);
    schools.forEach(school => {
      routePoints.push({
        id: school.id,
        type: 'school',
        schoolId: school.id,
        schoolName: school.name,
        address: school.address,
        lat: parseFloat(''+school.address.split(',')[0]),
        lng: parseFloat(''+school.address.split(',')[1]),
      });
    });

    return routePoints;
  }

  getLocationStatus(): LocationStatus {
    return this.locationStatus;
  }

  getLocationQualityStats(): LocationQualityStats {
    return this.locationQualityStats;
  }

  getSchoolData(schoolId: string) {
    return this.schoolData[schoolId] || {
      id: schoolId,
      name: 'Escola Municipal',
      address: 'Rua das Flores, 123'
    };
  }

  // Método para simular o atraso na rota
  async simulateRouteDelay(driverId: string, reason: string, delayInMinutes: number, guardianIds?: string[]) {
    const activeRoute = this.getActiveTrackingRoute(driverId);
    if (!activeRoute) {
      console.warn(`Nenhuma rota ativa encontrada para o motorista ${driverId}.`);
      return;
    }

    const currentEstimatedTime = activeRoute.estimatedArrival;
    if (!currentEstimatedTime) {
      console.warn('Tempo estimado de chegada não definido.');
      return;
    }

    // Adicionar o atraso ao tempo estimado atual
    const newEstimatedTime = new Date(new Date(currentEstimatedTime).getTime() + delayInMinutes * 60000).toISOString();

    // Enviar notificação aos responsáveis
    await this.sendDelayNotification('Nome do Motorista', reason, newEstimatedTime, guardianIds);
  }

  // Método para enviar notificação de atraso
  private async sendDelayNotification(driverName: string, reason: string, newEstimatedTime?: string, guardianIds?: string[]) {
    const notificationData = {
      driverName,
      reason,
      newEstimatedTime,
      guardianIds
    };

    // Simulação de envio de notificação (pode ser substituído por uma implementação real)
    console.log('Notificação de Atraso:', notificationData);
  }

  // Add missing methods for off-route detection and navigation
  getOffRouteStatus() {
    return {
      isOffRoute: false,
      distanceFromRoute: 0,
      lastRecalculation: null
    };
  }

  async forceRouteRecalculation(): Promise<boolean> {
    console.log('Recalculando rota...');
    return true;
  }

  getOffRouteThreshold(): number {
    return 150; // Default 150 meters
  }

  getMinRecalculationInterval(): number {
    return 30; // Default 30 seconds
  }

  setOffRouteThreshold(threshold: number): void {
    console.log(`Setting off-route threshold to ${threshold}m`);
  }

  setMinRecalculationInterval(interval: number): void {
    console.log(`Setting min recalculation interval to ${interval}s`);
  }

  hasActiveRoute(): boolean {
    return Object.keys(this.activeRoutes).length > 0;
  }

  addListener(callback: (route: any) => void): void {
    console.log('Adding route listener');
  }

  // Navigation methods
  isAutoNavigationEnabled(): boolean {
    return false;
  }

  setAutoNavigationEnabled(enabled: boolean): void {
    console.log(`Auto navigation ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Mapbox token methods
  setMapboxToken(token: string): void {
    console.log('Setting Mapbox token');
  }

  reloadMapboxToken(): void {
    console.log('Reloading Mapbox token');
  }

  // Notification methods
  areNotificationsEnabled(): boolean {
    return true;
  }

  getProximityThreshold(): number {
    return 500;
  }

  async requestNotificationPermission(): Promise<boolean> {
    return true;
  }

  setNotificationsEnabled(enabled: boolean): void {
    console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  setProximityThreshold(threshold: number): void {
    console.log(`Setting proximity threshold to ${threshold}m`);
  }

  async testNotification(): Promise<boolean> {
    console.log('Testing notification');
    return true;
  }

  clearProximityNotifications(): void {
    console.log('Clearing proximity notifications');
  }
}

export const realTimeTrackingService = new RealTimeTrackingService();

// Export RoutePoint interface
export type { RoutePoint };
