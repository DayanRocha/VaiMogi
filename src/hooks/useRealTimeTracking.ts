import { useState, useEffect, useCallback } from 'react';
import { realTimeTrackingService, TrackingRoute, RoutePoint } from '@/services/realTimeTrackingService';
import { RouteLocation } from '@/services/routeTrackingService';

export interface UseRealTimeTrackingReturn {
  // Estado da rota
  activeRoute: TrackingRoute | null;
  isTracking: boolean;
  
  // Informações da rota
  driverLocation: RouteLocation | null;
  routePoints: RoutePoint[];
  routeGeometry: any;
  estimatedDuration: number | null;
  totalDistance: number | null;
  
  // Ações
  startTracking: (
    driverId: string,
    driverName: string,
    direction: 'to_school' | 'to_home',
    students: any[],
    school: any
  ) => Promise<boolean>;
  stopTracking: () => boolean;
  
  // Status
  hasActiveRoute: boolean;
  trackingError: string | null;
}

export const useRealTimeTracking = (): UseRealTimeTrackingReturn => {
  const [activeRoute, setActiveRoute] = useState<TrackingRoute | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Callback para atualização da rota
  const handleRouteUpdate = useCallback((route: TrackingRoute | null) => {
    setActiveRoute(route);
    if (route) {
      setTrackingError(null);
    }
  }, []);

  // Configurar listener na inicialização
  useEffect(() => {
    console.log('🔗 Configurando listener de rastreamento em tempo real');
    
    realTimeTrackingService.addListener(handleRouteUpdate);
    
    return () => {
      console.log('🔗 Removendo listener de rastreamento em tempo real');
      realTimeTrackingService.removeListener(handleRouteUpdate);
    };
  }, [handleRouteUpdate]);

  // Iniciar rastreamento
  const startTracking = useCallback(async (
    driverId: string,
    driverName: string,
    direction: 'to_school' | 'to_home',
    students: any[],
    school: any
  ): Promise<boolean> => {
    try {
      setTrackingError(null);
      console.log('🚀 Iniciando rastreamento via hook:', {
        driverId,
        driverName,
        direction,
        studentsCount: students.length
      });

      const route = await realTimeTrackingService.startRouteTracking(
        driverId,
        driverName,
        direction,
        students,
        school
      );

      if (route) {
        console.log('✅ Rastreamento iniciado com sucesso via hook');
        return true;
      } else {
        setTrackingError('Falha ao iniciar rastreamento');
        console.error('❌ Falha ao iniciar rastreamento via hook');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setTrackingError(errorMessage);
      console.error('❌ Erro ao iniciar rastreamento via hook:', error);
      return false;
    }
  }, []);

  // Parar rastreamento
  const stopTracking = useCallback((): boolean => {
    try {
      setTrackingError(null);
      console.log('🛑 Parando rastreamento via hook');
      
      const success = realTimeTrackingService.endRouteTracking();
      
      if (success) {
        console.log('✅ Rastreamento parado com sucesso via hook');
      } else {
        console.warn('⚠️ Nenhuma rota ativa para parar via hook');
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setTrackingError(errorMessage);
      console.error('❌ Erro ao parar rastreamento via hook:', error);
      return false;
    }
  }, []);

  // Valores derivados
  const isTracking = activeRoute?.isActive ?? false;
  const hasActiveRoute = !!activeRoute && activeRoute.isActive;
  const driverLocation = activeRoute?.currentLocation ?? null;
  const routePoints = activeRoute?.routePoints ?? [];
  const routeGeometry = activeRoute?.mapboxRoute?.geometry ?? null;
  const estimatedDuration = activeRoute?.estimatedDuration ?? null;
  const totalDistance = activeRoute?.totalDistance ?? null;

  return {
    // Estado da rota
    activeRoute,
    isTracking,
    
    // Informações da rota
    driverLocation,
    routePoints,
    routeGeometry,
    estimatedDuration,
    totalDistance,
    
    // Ações
    startTracking,
    stopTracking,
    
    // Status
    hasActiveRoute,
    trackingError
  };
};

// Hook específico para responsáveis
export const useGuardianTracking = (guardianId: string) => {
  const [routeInfo, setRouteInfo] = useState<{
    hasActiveRoute: boolean;
    driverLocation?: RouteLocation;
    routeGeometry?: any;
    estimatedArrival?: string;
    nextStop?: RoutePoint;
  }>({ hasActiveRoute: false });

  // Atualizar informações da rota para o responsável
  const updateRouteInfo = useCallback(() => {
    const info = realTimeTrackingService.getRouteInfoForGuardian(guardianId);
    setRouteInfo(info);
  }, [guardianId]);

  // Configurar listener para atualizações
  useEffect(() => {
    const handleRouteUpdate = (route: TrackingRoute | null) => {
      updateRouteInfo();
    };

    realTimeTrackingService.addListener(handleRouteUpdate);
    
    // Atualização inicial
    updateRouteInfo();
    
    return () => {
      realTimeTrackingService.removeListener(handleRouteUpdate);
    };
  }, [updateRouteInfo]);

  return routeInfo;
};