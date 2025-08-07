import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { Button } from '@/components/ui/button';
import { MobileDebugPanel } from './MobileDebugPanel';

interface MobileGuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
}

export const MobileGuardianMapView = ({ driver, van, students, activeTrip }: MobileGuardianMapViewProps) => {
  const { 
    hasActiveRoute, 
    activeRoute, 
    driverLocation, 
    nextDestination, 
    isLoading 
  } = useRouteTracking();
  
  const [renderError, setRenderError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Debug específico para mobile
  useEffect(() => {
    const info = `Mobile Debug - hasActiveRoute: ${hasActiveRoute}, activeRoute: ${!!activeRoute}, isLoading: ${isLoading}, driverLocation: ${!!driverLocation}`;
    setDebugInfo(info);
    console.log('📱 MobileGuardianMapView:', info);
    
    if (hasActiveRoute && activeRoute) {
      console.log('📱 Rota ativa detectada no mobile:', {
        routeId: activeRoute.id,
        driverName: activeRoute.driverName,
        studentsCount: activeRoute.studentPickups?.length || 0,
        hasLocation: !!driverLocation
      });
    }
  }, [hasActiveRoute, activeRoute, isLoading, driverLocation]);

  // Detectar erros de renderização e problemas de estado
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('📱 Erro de renderização detectado no mobile:', error);
      setRenderError(true);
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('📱 Promise rejeitada no mobile:', event.reason);
      if (event.reason?.message?.includes('map') || event.reason?.message?.includes('route')) {
        setRenderError(true);
      }
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  // Monitorar mudanças críticas de estado
  useEffect(() => {
    if (hasActiveRoute && !activeRoute) {
      console.warn('📱 Estado inconsistente: hasActiveRoute=true mas activeRoute=null');
    }
    if (activeRoute && !hasActiveRoute) {
      console.warn('📱 Estado inconsistente: activeRoute existe mas hasActiveRoute=false');
    }
  }, [hasActiveRoute, activeRoute]);

  const handleRetry = () => {
    setRenderError(false);
    setRetryCount(prev => prev + 1);
    // Forçar re-render
    window.location.reload();
  };

  // Funções para simular início/parada de rota (apenas para debug)
  const simulateRouteStart = () => {
    console.log('🚌 Simulando início de rota...');
    // Simular dados de rota para teste
    const mockRoute = {
      id: 'test-route-123',
      name: 'Rota Teste Mobile',
      students: [
        { id: '1', name: 'João Silva', status: 'pending', address: 'Rua A, 123' },
        { id: '2', name: 'Maria Santos', status: 'picked_up', address: 'Rua B, 456' }
      ],
      nextDestination: 'Rua A, 123'
    };
    
    // Simular localização do motorista
    const mockDriverLocation = {
      lat: -23.5505,
      lng: -46.6333,
      timestamp: Date.now()
    };
    
    console.log('📍 Mock route data:', mockRoute);
    console.log('📍 Mock driver location:', mockDriverLocation);
  };

  const simulateRouteStop = () => {
    console.log('⏹️ Simulando parada de rota...');
  };

  // Fallback para erro de renderização
  if (renderError) {
    return (
      <div className="relative w-full h-full bg-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-red-700">Erro de Renderização</h2>
          <p className="text-sm text-red-600 mb-4">
            Ocorreu um problema ao carregar a página. Isso pode ser devido a problemas de compatibilidade do navegador.
          </p>
          <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <p className="text-xs text-red-500 mt-2">
            Tentativas: {retryCount}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Verificando rota ativa...</p>
            <p className="text-xs mt-2 text-gray-400">Modo Mobile Otimizado</p>
          </div>
      </div>
      
      {/* Painel de Debug - Remover em produção */}
      <MobileDebugPanel
        onSimulateRouteStart={simulateRouteStart}
        onSimulateRouteStop={simulateRouteStop}
        isRouteActive={hasActiveRoute}
      />
    </div>
  );
  }

  return (
    <div className="relative w-full h-full bg-gray-200">
      {/* Debug Info - Remover em produção */}
      <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-50 max-w-xs">
        <div>📱 Mobile Mode</div>
        <div className="truncate">{debugInfo}</div>
        <div>Retry: {retryCount}</div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {hasActiveRoute && activeRoute && driverLocation ? (
          // Rota Ativa - Interface Simplificada para Mobile
          <div className="w-full h-full flex flex-col">
            {/* Header com informações da rota */}
            <div className="bg-white/95 backdrop-blur-sm p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-800">Rota Ativa</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Motorista:</span>
                  <p className="font-medium text-gray-800">{activeRoute.driverName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Estudantes:</span>
                  <p className="font-medium text-gray-800">{activeRoute.studentPickups.length}</p>
                </div>
              </div>
              {nextDestination && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Próximo destino:</span>
                  <p className="text-xs text-gray-700 truncate">{nextDestination.address}</p>
                </div>
              )}
            </div>

            {/* Área principal - Lista de estudantes em vez de mapa */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Estudantes na Rota</h3>
              <div className="space-y-3">
                {activeRoute.studentPickups.map((pickup, index) => (
                  <div key={pickup.studentId} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{pickup.studentName}</h4>
                        <p className="text-xs text-gray-600 truncate">{pickup.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          pickup.status === 'completed' ? 'bg-green-500' :
                          pickup.status === 'pending' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-600 capitalize">
                          {pickup.status === 'completed' ? 'Embarcou' :
                           pickup.status === 'pending' ? 'Aguardando' :
                           'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer com localização do motorista */}
            {driverLocation && (
              <div className="bg-white/95 backdrop-blur-sm p-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-600">Localização do motorista:</span>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Nenhuma Rota Ativa - Interface Limpa
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="text-center text-gray-500 max-w-md">
              <MapPin className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="text-2xl font-bold mb-3 text-gray-700">Nenhuma Rota Ativa</h2>
              <p className="text-sm mb-6 text-gray-600 leading-relaxed">
                Você será notificado automaticamente quando o motorista iniciar uma rota. 
                A interface será atualizada em tempo real.
              </p>
              
              <div className="bg-white/90 rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-blue-700 mb-2">
                  📱 Modo Mobile Otimizado
                </h3>
                <p className="text-xs text-gray-600">
                  Interface adaptada para dispositivos móveis com melhor performance e usabilidade.
                </p>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Status: {hasActiveRoute ? '🟢 Rota Ativa' : '🔴 Aguardando Rota'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};