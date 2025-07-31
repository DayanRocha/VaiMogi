
import { useState, useEffect } from 'react';
import { routeTrackingService, ActiveRoute } from '@/services/routeTrackingService';

export const useRouteTracking = () => {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar rota ativa inicial com verificação de persistência
  useEffect(() => {
    console.log('🔍 Inicializando useRouteTracking - carregando rota ativa...');
    const route = routeTrackingService.getActiveRoute();
    setActiveRoute(route);
    setIsLoading(false);
    
    if (route) {
      console.log('✅ Rota ativa restaurada do localStorage:', {
        id: route.id,
        driverName: route.driverName,
        studentsCount: route.studentPickups?.length || 0,
        isActive: route.isActive,
        hasLocation: !!route.currentLocation,
        startTime: route.startTime
      });
    } else {
      console.log('❌ Nenhuma rota ativa encontrada no localStorage');
    }
  }, []);

  // Listener para mudanças na rota com garantia de persistência
  useEffect(() => {
    const handleRouteChange = (route: ActiveRoute | null) => {
      console.log('🔄 Rota alterada via listener:', route ? 'Ativa' : 'Inativa');
      setActiveRoute(route);
      
      if (route === null) {
        console.log('🔴 Rota finalizada explicitamente pelo motorista');
      } else {
        console.log('🟢 Rota atualizada/restaurada:', {
          driverName: route.driverName,
          hasLocation: !!route.currentLocation,
          nextStudent: route.studentPickups.find(s => s.status === 'pending')?.studentName,
          isActive: route.isActive
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

  // Verificar periodicamente se a rota persiste (para casos onde a aplicação foi reaberta)
  useEffect(() => {
    const persistenceCheck = setInterval(() => {
      const currentStoredRoute = routeTrackingService.getActiveRoute();
      
      // Se encontrou uma rota no localStorage mas não temos uma localmente
      if (currentStoredRoute && currentStoredRoute.isActive && !activeRoute) {
        console.log('🔄 Rota ativa encontrada no localStorage - restaurando...');
        setActiveRoute(currentStoredRoute);
      }
      
      // Se temos uma rota local mas ela não está mais no localStorage
      if (activeRoute && !currentStoredRoute) {
        console.log('⚠️ Rota local não encontrada no localStorage - sincronizando...');
        setActiveRoute(null);
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(persistenceCheck);
  }, [activeRoute]);

  // Log de debug periódico incluindo informações de persistência
  useEffect(() => {
    const debugInterval = setInterval(() => {
      const hasRoute = activeRoute !== null && activeRoute.isActive;
      const storedRoute = routeTrackingService.getActiveRoute();
      
      if (hasRoute) {
        console.log('🐛 Debug - Estado atual da rota:', {
          hasActiveRoute: hasRoute,
          isStoredInLocalStorage: !!storedRoute,
          driverLocation: activeRoute?.currentLocation ? `${activeRoute.currentLocation.lat}, ${activeRoute.currentLocation.lng}` : 'Ausente',
          nextDestination: activeRoute?.studentPickups.find(s => s.status === 'pending')?.studentName || 'Nenhum',
          progress: activeRoute ? `${((activeRoute.studentPickups.filter(s => s.status !== 'pending').length / activeRoute.studentPickups.length) * 100).toFixed(1)}%` : '0%',
          routeId: activeRoute?.id,
          startTime: activeRoute?.startTime
        });
      }
    }, 15000); // Log a cada 15 segundos

    return () => clearInterval(debugInterval);
  }, [activeRoute]);

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
