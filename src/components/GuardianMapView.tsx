
import React, { useState, useMemo } from 'react';
import { MapPin, AlertCircle, Settings } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { GuardianRealTimeMap } from '@/components/GuardianRealTimeMap';
import { MapboxConfig } from '@/components/MapboxConfig';
import { Button } from '@/components/ui/button';

interface GuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
  guardianId: string;
}

export const GuardianMapView = React.memo(({ driver, van, students, activeTrip, guardianId }: GuardianMapViewProps) => {
  const { 
    hasActiveRoute, 
    activeRoute, 
    driverLocation, 
    nextDestination, 
    isLoading 
  } = useRouteTracking();
  
  const [mapError, setMapError] = useState(false);
  const [showMapboxConfig, setShowMapboxConfig] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem('mapboxAccessToken') || '';
  });

  // Memoizar dados do mapa para evitar recriações desnecessárias - SEMPRE executar hooks
  const mapData = useMemo(() => {
    try {
      // Usar localização do motorista ou localização padrão de São Paulo
      const defaultLocation = {
        lat: -23.5505,
        lng: -46.6333
      };
      
      const currentDriverLocation = driverLocation || defaultLocation;
      
      // Validar coordenadas antes de usar
      const isValidCoordinate = (lat: number, lng: number) => {
        return typeof lat === 'number' && typeof lng === 'number' &&
               !isNaN(lat) && !isNaN(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
      };
      
      const markers = [];
      
      if (isValidCoordinate(currentDriverLocation.lat, currentDriverLocation.lng)) {
        markers.push({
          id: 'driver',
          coordinates: [currentDriverLocation.lng, currentDriverLocation.lat] as [number, number],
          popup: `<div class="p-2"><strong>${driver?.name || 'Motorista'} - ${van?.plate || 'Veículo'}</strong><br/>Localização ${driverLocation ? 'atual' : 'padrão'} do motorista</div>`,
          color: '#10B981' // Verde para o motorista
        });
      }
      
      // Adicionar marcador do próximo destino se disponível
      if (nextDestination && 
          typeof nextDestination.lng === 'number' && 
          typeof nextDestination.lat === 'number' && 
          isValidCoordinate(nextDestination.lat, nextDestination.lng)) {
        markers.push({
          id: 'next-destination',
          coordinates: [nextDestination.lng, nextDestination.lat] as [number, number],
          popup: `<div class="p-2"><strong>Próximo Destino</strong><br/>${nextDestination.address || nextDestination.studentName || 'Destino da rota'}</div>`,
          color: '#F59E0B' // Laranja para o destino
        });
      }
      
      // Preparar dados da rota se disponível - remover referência a coordinates que não existe
      const routeCoordinates: [number, number][] = [];
      
      // Determinar centro do mapa
      const mapCenter: [number, number] = [currentDriverLocation.lng, currentDriverLocation.lat];
      
      return {
        markers,
        routeCoordinates,
        mapCenter,
        currentDriverLocation,
        isValid: true
      };
    } catch (error) {
      console.error('Erro ao processar dados do mapa:', error);
      return {
        markers: [],
        routeCoordinates: [],
        mapCenter: [-46.6333, -23.5505] as [number, number],
        currentDriverLocation: { lat: -23.5505, lng: -46.6333 },
        isValid: false
      };
    }
  }, [driverLocation, nextDestination, activeRoute, driver?.name, van?.plate]);

  // Renderização condicional APÓS todos os hooks
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Verificando rota ativa...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não há rota ativa, mostrar tela de aguardo
  if (!hasActiveRoute || !activeRoute) {
    return (
      <div className="relative w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Aguardando Rota
            </h3>
            <p className="text-gray-500 mb-4">
              O mapa será exibido quando o motorista <strong>{driver.name}</strong> iniciar uma rota.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Motorista:</span>
                <span className="font-medium text-gray-800">{driver.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Veículo:</span>
                <span className="font-medium text-gray-800">{van.plate}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Status:</span>
                <span className="text-orange-600 font-medium">Aguardando início da rota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback se houver erro no mapa
  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Rota Ativa - Modo Simplificado
            </h3>
            <p className="text-gray-500 mb-4">
              O mapa não pôde ser carregado, mas a rota está ativa.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-800">Rota em Andamento</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Motorista:</span>
                  <span className="font-medium text-gray-800">{driver.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Veículo:</span>
                  <span className="font-medium text-gray-800">{van.plate}</span>
                </div>
                {nextDestination && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Próximo:</span>
                    <span className="font-medium text-gray-800">{nextDestination.studentName || 'Destino'}</span>
                  </div>
                )}
                {mapData.currentDriverLocation && driverLocation && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Localização: {mapData.currentDriverLocation.lat.toFixed(4)}, {mapData.currentDriverLocation.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se os dados do mapa não são válidos, mostrar modo simplificado
  if (!mapData.isValid) {
    return (
      <div className="w-full h-full bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center text-gray-600 max-w-md mx-auto px-6">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              Rota Ativa - Carregando Dados
            </h3>
            <p className="text-gray-500 mb-4">
              Aguardando dados válidos do mapa...
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-800">Rota em Andamento</span>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Motorista:</span>
                  <span className="font-medium text-gray-800">{driver?.name || 'Carregando...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Veículo:</span>
                  <span className="font-medium text-gray-800">{van?.plate || 'Carregando...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full">
        {mapboxToken ? (
          <GuardianRealTimeMap
            guardianId={guardianId}
            mapboxToken={mapboxToken}
            className="w-full h-full"
          />
        ) : (
          // Fallback para o mapa antigo se não houver token
          <MapboxMap
            center={mapData.mapCenter}
            markers={mapData.markers}
            route={mapData.routeCoordinates}
            className="w-full h-full"
            zoom={15}
            onMapLoad={() => setMapError(false)}
            onError={(error) => {
              console.error('Erro no mapa do responsável:', error);
              setMapError(true);
            }}
          />
        )}
        
        {/* Botão de configuração do Mapbox - oculto quando rota está em modo 'desembarque em casa' */}
        {activeRoute?.direction !== 'to_home' && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setShowMapboxConfig(true)}
              size="sm"
              variant="outline"
              className="bg-white shadow-lg"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            {!mapboxToken && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-sm">
                <span className="text-yellow-800">Configure o Mapbox para rastreamento em tempo real</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de configuração do Mapbox */}
      <MapboxConfig
        open={showMapboxConfig}
        onOpenChange={setShowMapboxConfig}
        onTokenSaved={(token) => {
          setMapboxToken(token);
          console.log('✅ Token do Mapbox configurado no painel do responsável');
        }}
      />
    </div>
  );
});

GuardianMapView.displayName = 'GuardianMapView';
