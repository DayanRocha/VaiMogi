
import { useState, useEffect } from 'react';
import { routeTrackingService, ActiveRoute } from '@/services/routeTrackingService';

export const useRouteTracking = () => {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar rota ativa inicial
    const loadActiveRoute = () => {
      console.log('🔍 Carregando rota ativa...');
      const route = routeTrackingService.getActiveRoute();
      setActiveRoute(route);
      setIsLoading(false);
      
      if (route) {
        console.log('✅ Rota ativa encontrada:', {
          id: route.id,
          driverName: route.driverName,
          studentsCount: route.studentPickups?.length || 0,
          isActive: route.isActive,
          hasLocation: !!route.currentLocation
        });
      } else {
        console.log('❌ Nenhuma rota ativa encontrada');
      }
    };

    // Carregar imediatamente
    loadActiveRoute();

    // Listener para mudanças na rota
    const handleRouteChange = (route: ActiveRoute | null) => {
      console.log('🔄 Rota alterada:', route ? 'Ativa' : 'Inativa');
      setActiveRoute(route);
      
      if (route === null) {
        console.log('🔴 Rota finalizada');
      } else {
        console.log('🟢 Rota atualizada:', {
          driverName: route.driverName,
          hasLocation: !!route.currentLocation,
          nextStudent: route.studentPickups.find(s => s.status === 'pending')?.studentName
        });
      }
    };

    // Registrar listener
    routeTrackingService.addListener(handleRouteChange);

    // Cleanup
    return () => {
      routeTrackingService.removeListener(handleRouteChange);
    };
  }, []);

  // Verificar se há uma rota ativa
  const hasActiveRoute = activeRoute !== null && activeRoute.isActive;

  // Obter localização atual do motorista
  const driverLocation = activeRoute?.currentLocation;

  // Obter próximo destino (estudante pendente)
  const nextDestination = activeRoute?.studentPickups.find(
    student => student.status === 'pending'
  );

  // Calcular progresso da rota (% de estudantes processados)
  const routeProgress = activeRoute ? 
    (activeRoute.studentPickups.filter(s => s.status !== 'pending').length / 
     activeRoute.studentPickups.length) * 100 : 0;

  // Obter tempo decorrido desde o início da rota
  const getElapsedTime = (): string => {
    if (!activeRoute) return '0min';
    
    const start = new Date(activeRoute.startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  // Calcular distância estimada até o próximo destino
  const getDistanceToNext = (): string | null => {
    if (!driverLocation || !nextDestination || !nextDestination.lat || !nextDestination.lng) {
      return null;
    }

    const distance = routeTrackingService.calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      nextDestination.lat,
      nextDestination.lng
    );

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  // Log de debug periódico
  useEffect(() => {
    const debugInterval = setInterval(() => {
      if (hasActiveRoute) {
        console.log('🐛 Debug - Estado atual:', {
          hasRoute: hasActiveRoute,
          driverLocation: driverLocation ? `${driverLocation.lat}, ${driverLocation.lng}` : 'Ausente',
          nextDestination: nextDestination?.studentName || 'Nenhum',
          progress: `${routeProgress.toFixed(1)}%`
        });
      }
    }, 10000); // Log a cada 10 segundos

    return () => clearInterval(debugInterval);
  }, [hasActiveRoute, driverLocation, nextDestination, routeProgress]);

  return {
    activeRoute,
    hasActiveRoute,
    driverLocation,
    nextDestination,
    routeProgress,
    isLoading,
    elapsedTime: getElapsedTime(),
    distanceToNext: getDistanceToNext()
  };
};
