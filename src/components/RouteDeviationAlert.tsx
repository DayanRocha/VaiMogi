import React, { useState, useEffect } from 'react';
import { AlertTriangle, Navigation, RefreshCw, MapPin, Clock, X } from 'lucide-react';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';

interface RouteDeviationData {
  isOffRoute: boolean;
  distance: number;
  lastRecalculation?: string;
  driverName?: string;
  estimatedDelay?: number;
}

interface RouteDeviationAlertProps {
  isVisible: boolean;
  onDismiss: () => void;
  onViewMap: () => void;
}

export const RouteDeviationAlert: React.FC<RouteDeviationAlertProps> = ({
  isVisible,
  onDismiss,
  onViewMap
}) => {
  const [deviationData, setDeviationData] = useState<RouteDeviationData | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Obter dados do desvio
    const status = realTimeTrackingService.getOffRouteStatus();
    const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
    
    if (status.isOffRoute && activeRoute) {
      setDeviationData({
        isOffRoute: status.isOffRoute,
        distance: status.distance,
        lastRecalculation: status.lastRecalculation,
        driverName: activeRoute.driverName,
        estimatedDelay: activeRoute.estimatedDuration ? Math.round(activeRoute.estimatedDuration * 0.1) : undefined
      });
    }
  }, [isVisible]);

  const handleForceRecalculation = async () => {
    setIsRecalculating(true);
    try {
      const success = await realTimeTrackingService.forceRouteRecalculation();
      if (success) {
        console.log('✅ Rota recalculada manualmente');
        // Atualizar dados após recálculo
        setTimeout(() => {
          const status = realTimeTrackingService.getOffRouteStatus();
          if (status.isOffRoute) {
            setDeviationData(prev => prev ? {
              ...prev,
              distance: status.distance,
              lastRecalculation: status.lastRecalculation
            } : null);
          } else {
            onDismiss(); // Fechar alerta se voltou à rota
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao recalcular rota:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distance)} m`;
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible || !deviationData) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h3 className="font-semibold text-sm">Desvio de Rota Detectado</h3>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              🚐
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 mb-1">
                {deviationData.driverName || 'O motorista'} saiu da rota planejada
              </p>
              <p className="text-xs text-gray-600">
                Distância da rota: <span className="font-semibold text-orange-600">{formatDistance(deviationData.distance)}</span>
              </p>
              {deviationData.estimatedDelay && (
                <p className="text-xs text-gray-600 mt-1">
                  Possível atraso: <span className="font-semibold text-red-600">~{deviationData.estimatedDelay} min</span>
                </p>
              )}
            </div>
          </div>

          {/* Status do Recálculo */}
          <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
              <span>Status do Recálculo</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Última atualização:</span>
                <span className="font-medium">{formatTime(deviationData.lastRecalculation)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sistema:</span>
                <span className="text-green-600 font-medium">🟢 Ativo</span>
              </div>
            </div>
          </div>

          {/* Detalhes Expandíveis */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-orange-600 hover:text-orange-700 mb-3 flex items-center gap-1"
          >
            {showDetails ? '▼' : '▶'} {showDetails ? 'Ocultar' : 'Ver'} detalhes técnicos
          </button>

          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Threshold:</span>
                  <div className="font-medium">{realTimeTrackingService.getOffRouteThreshold()}m</div>
                </div>
                <div>
                  <span className="text-gray-500">Intervalo:</span>
                  <div className="font-medium">{realTimeTrackingService.getMinRecalculationInterval()}s</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500">Algoritmo:</span>
                <div className="font-medium">Haversine + Mapbox Directions API</div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={onViewMap}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Ver no Mapa
            </button>
            <button
              onClick={handleForceRecalculation}
              disabled={isRecalculating}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {isRecalculating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
              {isRecalculating ? 'Recalculando...' : 'Recalcular'}
            </button>
          </div>

          {/* Informação Adicional */}
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              O sistema está recalculando automaticamente a rota em tempo real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDeviationAlert;