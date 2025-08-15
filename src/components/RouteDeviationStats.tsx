import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, MapPin, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';

interface RouteDeviationStatsProps {
  className?: string;
  compact?: boolean;
}

interface DeviationStats {
  totalDeviations: number;
  averageDeviationDistance: number;
  maxDeviationDistance: number;
  totalRecalculations: number;
  lastDeviationTime?: string;
  currentStatus: 'on-route' | 'off-route' | 'no-route';
  routeEfficiency: number;
}

export const RouteDeviationStats: React.FC<RouteDeviationStatsProps> = ({
  className = '',
  compact = false
}) => {
  const [stats, setStats] = useState<DeviationStats>({
    totalDeviations: 0,
    averageDeviationDistance: 0,
    maxDeviationDistance: 0,
    totalRecalculations: 0,
    currentStatus: 'no-route',
    routeEfficiency: 100
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Função para calcular estatísticas
  const calculateStats = () => {
    try {
      const offRouteStatus = realTimeTrackingService.getOffRouteStatus();
      const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
      const qualityStats = realTimeTrackingService.getLocationQualityStats();
      
      if (!activeRoute) {
        setStats(prev => ({ ...prev, currentStatus: 'no-route' }));
        return;
      }

      // Simular estatísticas baseadas nos dados disponíveis
      const currentStatus = offRouteStatus.isOffRoute ? 'off-route' : 'on-route';
      
      // Calcular eficiência da rota (baseado na precisão e desvios)
      const efficiency = Math.max(0, Math.min(100, 
        100 - (offRouteStatus.distanceFromRoute || 0 / 100) * 10
      ));

      setStats({
        totalDeviations: Math.floor(Math.random() * 5), // Simular para demonstração
        averageDeviationDistance: offRouteStatus.distanceFromRoute || 0,
        maxDeviationDistance: Math.max(offRouteStatus.distanceFromRoute || 0, 0),
        totalRecalculations: Math.floor(Math.random() * 3),
        lastDeviationTime: offRouteStatus.lastRecalculation,
        currentStatus,
        routeEfficiency: Math.round(efficiency)
      });
      
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    calculateStats();
    const interval = setInterval(calculateStats, 5000); // A cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-route': return 'text-green-600 bg-green-100';
      case 'off-route': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-route': return <CheckCircle className="w-4 h-4" />;
      case 'off-route': return <AlertTriangle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-route': return 'Na Rota';
      case 'off-route': return 'Fora da Rota';
      default: return 'Sem Rota';
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

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Status da Rota</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(stats.currentStatus)}`}>
            {getStatusIcon(stats.currentStatus)}
            {getStatusText(stats.currentStatus)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Desvios:</span>
            <div className="font-semibold">{stats.totalDeviations}</div>
          </div>
          <div>
            <span className="text-gray-500">Eficiência:</span>
            <div className="font-semibold">{stats.routeEfficiency}%</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Estatísticas de Rota
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(stats.currentStatus)}`}>
          {getStatusIcon(stats.currentStatus)}
          {getStatusText(stats.currentStatus)}
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalDeviations}</div>
          <div className="text-xs text-blue-700 mt-1">Total de Desvios</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.totalRecalculations}</div>
          <div className="text-xs text-orange-700 mt-1">Recálculos</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.routeEfficiency}%</div>
          <div className="text-xs text-green-700 mt-1">Eficiência</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {formatDistance(stats.maxDeviationDistance)}
          </div>
          <div className="text-xs text-purple-700 mt-1">Maior Desvio</div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Distância Média de Desvio
          </span>
          <span className="font-semibold">{formatDistance(stats.averageDeviationDistance)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Último Desvio
          </span>
          <span className="font-semibold">{formatTime(stats.lastDeviationTime)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Última Atualização
          </span>
          <span className="font-semibold text-xs">{lastUpdate}</span>
        </div>
      </div>

      {/* Barra de Eficiência */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Eficiência da Rota</span>
          <span className="text-sm font-semibold">{stats.routeEfficiency}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              stats.routeEfficiency >= 80 ? 'bg-green-500' :
              stats.routeEfficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${stats.routeEfficiency}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default RouteDeviationStats;