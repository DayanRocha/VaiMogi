import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useGuardianTracking } from '@/hooks/useRealTimeTracking';
import { MapPin, Clock, Route, AlertCircle } from 'lucide-react';

interface GuardianRealTimeMapProps {
  guardianId: string;
  mapboxToken: string;
  className?: string;
}

export const GuardianRealTimeMap = ({ 
  guardianId, 
  mapboxToken, 
  className = '' 
}: GuardianRealTimeMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const routePointMarkers = useRef<mapboxgl.Marker[]>([]);
  const routeSource = useRef<string>('route-source');
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [navigationMode, setNavigationMode] = useState(false);
  const [followDriver, setFollowDriver] = useState(true);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  const routeInfo = useGuardianTracking(guardianId);

  // Função para criar marcador de ponto da rota
  const createRoutePointMarker = (point: any, index: number) => {
    const isStudent = point.type === 'student';
    const isSchool = point.type === 'school';
    
    const markerElement = document.createElement('div');
    markerElement.className = 'route-point-marker';
    
    if (isStudent) {
      markerElement.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: #3B82F6;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          cursor: pointer;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      `;
    } else if (isSchool) {
      markerElement.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: #10B981;
          border: 2px solid white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          cursor: pointer;
        ">
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
          </svg>
        </div>
      `;
    }

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([point.lng, point.lat]);

    // Adicionar popup com informações
    const popupContent = isStudent 
      ? `
        <div style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%;"></div>
            <strong style="color: #3B82F6;">👤 ${point.studentName}</strong>
          </div>
          <div style="font-size: 12px; color: #666;">
            📍 ${point.address}
          </div>
        </div>
      `
      : `
        <div style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%;"></div>
            <strong style="color: #10B981;">🏫 ${point.schoolName}</strong>
          </div>
          <div style="font-size: 12px; color: #666;">
            📍 ${point.address}
          </div>
        </div>
      `;

    marker.setPopup(
      new mapboxgl.Popup({ offset: 15 })
        .setHTML(popupContent)
    );

    return marker;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505], // São Paulo como centro padrão
        zoom: 12,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('🗺️ Mapa do responsável carregado');
        setMapLoaded(true);
        setMapError(null);
        
        // Adicionar fonte para a rota
        if (map.current) {
          map.current.addSource(routeSource.current, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          // Adicionar camada da rota principal
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: routeSource.current,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF8C00',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });

          // Adicionar camada de sombra da rota (para efeito visual)
          map.current.addLayer({
            id: 'route-line-shadow',
            type: 'line',
            source: routeSource.current,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#000000',
              'line-width': 8,
              'line-opacity': 0.3
            }
          }, 'route-line');
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Erro no mapa do responsável:', e);
        setMapError('Erro ao carregar o mapa');
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar mapa do responsável:', error);
      setMapError('Erro ao inicializar o mapa');
    }

    return () => {
      if (driverMarker.current) {
        driverMarker.current.remove();
      }
      // Remover marcadores dos pontos da rota
      routePointMarkers.current.forEach(marker => marker.remove());
      routePointMarkers.current = [];
      
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  // Ativar modo de navegação automaticamente quando rota iniciar
  useEffect(() => {
    if (routeInfo.hasActiveRoute && !navigationMode) {
      console.log('🧭 Ativando modo de navegação automaticamente');
      setNavigationMode(true);
      setFollowDriver(true);
    } else if (!routeInfo.hasActiveRoute && navigationMode) {
      console.log('🛑 Desativando modo de navegação - rota encerrada');
      setNavigationMode(false);
      setFollowDriver(false);
    }
  }, [routeInfo.hasActiveRoute, navigationMode]);

  // Atualizar posição do motorista e rota
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (routeInfo.hasActiveRoute && routeInfo.driverLocation) {
      const { lat, lng } = routeInfo.driverLocation;

      // Calcular rotação baseada na direção do movimento
      let rotation = 0;
      if (lastPosition) {
        const deltaLat = lat - lastPosition.lat;
        const deltaLng = lng - lastPosition.lng;
        rotation = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
      }

      // Atualizar ou criar marcador do motorista
      if (driverMarker.current) {
        driverMarker.current.setLngLat([lng, lat]);
        
        // Atualizar rotação do marcador existente
        const markerElement = driverMarker.current.getElement();
        const arrowContainer = markerElement.querySelector('.arrow-container') as HTMLElement;
        if (arrowContainer) {
          arrowContainer.style.transform = `rotate(${rotation}deg)`;
        }
      } else {
        // Criar marcador com seta direcional
        const markerElement = document.createElement('div');
        markerElement.className = 'mapboxgl-marker-arrow';
        markerElement.innerHTML = `
          <div class="arrow-container" style="
            width: 36px;
            height: 36px;
            background: #FF8C00;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 140, 0, 0.5);
            animation: navigationPulse 2s infinite;
            transform: rotate(${rotation}deg);
            transition: transform 0.3s ease;
          ">
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M12 2l-1.5 6L4 10l6.5 2L12 22l1.5-10L20 10l-6.5-2L12 2z"/>
            </svg>
          </div>
        `;

        driverMarker.current = new mapboxgl.Marker(markerElement)
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      // Salvar posição atual para próximo cálculo de rotação
      setLastPosition({ lat, lng });

      // Modo de navegação: seguir motorista automaticamente
      if (navigationMode && followDriver) {
        map.current.easeTo({
          center: [lng, lat],
          zoom: 16, // Zoom mais próximo para navegação
          duration: 1500,
          essential: true // Não pode ser interrompido por interação do usuário
        });
      }

      console.log('📍 Posição do motorista atualizada no mapa do responsável:', {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        navigationMode,
        followDriver
      });
    } else {
      // Remover marcador se não há rota ativa
      if (driverMarker.current) {
        driverMarker.current.remove();
        driverMarker.current = null;
      }
    }

    // Atualizar rota no mapa
    if (routeInfo.hasActiveRoute && routeInfo.routeGeometry && map.current.getSource(routeSource.current)) {
      const source = map.current.getSource(routeSource.current) as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: routeInfo.routeGeometry
      });

      console.log('🛣️ Rota atualizada no mapa do responsável (modo navegação:', navigationMode, ')');
    } else if (!routeInfo.hasActiveRoute && map.current.getSource(routeSource.current)) {
      // Limpar rota se não há rota ativa
      const source = map.current.getSource(routeSource.current) as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  }, [routeInfo, mapLoaded, navigationMode, followDriver]);

  // Gerenciar marcadores dos pontos da rota
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remover marcadores existentes
    routePointMarkers.current.forEach(marker => marker.remove());
    routePointMarkers.current = [];

    // Adicionar novos marcadores se há rota ativa
    if (routeInfo.hasActiveRoute) {
      // Obter pontos da rota do serviço de rastreamento
      import('@/services/realTimeTrackingService').then(({ realTimeTrackingService }) => {
        const activeRoute = realTimeTrackingService.getActiveTrackingRoute();
        
        if (activeRoute && activeRoute.routePoints) {
          activeRoute.routePoints.forEach((point, index) => {
            const marker = createRoutePointMarker(point, index);
            marker.addTo(map.current!);
            routePointMarkers.current.push(marker);
          });

          console.log('📍 Marcadores dos pontos da rota adicionados:', {
            totalPoints: activeRoute.routePoints.length,
            studentPoints: activeRoute.routePoints.filter(p => p.type === 'student').length,
            schoolPoints: activeRoute.routePoints.filter(p => p.type === 'school').length
          });
        }
      }).catch(error => {
        console.warn('⚠️ Erro ao carregar pontos da rota:', error);
      });
    }
  }, [routeInfo.hasActiveRoute, mapLoaded]);

  // Adicionar CSS para animações dos marcadores
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .mapboxgl-marker-arrow {
        cursor: pointer;
      }
      
      .route-point-marker {
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .route-point-marker:hover {
        transform: scale(1.1);
      }
      
      @keyframes navigationPulse {
        0% {
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.5);
        }
        50% {
          box-shadow: 0 6px 16px rgba(255, 140, 0, 0.7);
        }
        100% {
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.5);
        }
      }
      
      .arrow-container {
        transition: transform 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Erro ao carregar o mapa</p>
          <p className="text-sm text-gray-500">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Container do mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />

      {/* Controles minimalistas no canto superior direito */}
      {routeInfo.hasActiveRoute && (
        <div className="absolute top-4 right-16 flex gap-2">
          {navigationMode ? (
            <>
              <button
                onClick={() => setFollowDriver(!followDriver)}
                className={`w-10 h-10 rounded-full shadow-lg transition-colors ${
                  followDriver 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-orange-500 hover:bg-orange-50'
                }`}
                title={followDriver ? 'Parar de seguir' : 'Seguir motorista'}
              >
                📍
              </button>
              <button
                onClick={() => setNavigationMode(false)}
                className="w-10 h-10 bg-white text-gray-600 hover:bg-gray-50 rounded-full shadow-lg transition-colors"
                title="Sair do modo navegação"
              >
                ❌
              </button>
            </>
          ) : (
            <button
              onClick={() => setNavigationMode(true)}
              className="w-10 h-10 bg-orange-500 text-white hover:bg-orange-600 rounded-full shadow-lg transition-colors"
              title="Ativar modo navegação"
            >
              🧭
            </button>
          )}
        </div>
      )}

      {/* Indicador de carregamento */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Indicador de status discreto */}
      {routeInfo.hasActiveRoute && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-full px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${navigationMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-gray-700 font-medium">
              {navigationMode ? 'Navegação' : 'Rastreando'}
            </span>
          </div>
        </div>
      )}

      {/* Mensagem quando não há rota ativa */}
      {mapLoaded && !routeInfo.hasActiveRoute && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-white rounded-lg p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Aguardando Rota</p>
            <p className="text-sm text-gray-500">O mapa entrará automaticamente no modo de navegação quando o motorista iniciar uma rota</p>
          </div>
        </div>
      )}
    </div>
  );
};