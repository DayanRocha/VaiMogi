import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Navigation, AlertCircle } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { MAPBOX_CONFIG, isMapboxConfigured } from '@/config/maps';

// Importar CSS do Mapbox
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  activeRoute: ActiveRoute;
  driverLocation?: RouteLocation;
  nextDestination?: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  };
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverMarker, setDriverMarker] = useState<mapboxgl.Marker | null>(null);
  const [studentMarkers, setStudentMarkers] = useState<mapboxgl.Marker[]>([]);

  // Configurar token do Mapbox
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Inicializando Mapbox...');
        console.log('🔑 Token:', MAPBOX_CONFIG.accessToken.substring(0, 20) + '...');

        // Timeout para evitar travamento
        const timeoutId = setTimeout(() => {
          console.error('⏰ Timeout ao carregar Mapbox');
          setError('Timeout ao carregar o mapa. Verifique sua conexão.');
          setIsLoading(false);
        }, 10000); // 10 segundos

        // Centro inicial - localização do motorista ou São Paulo
        const center: [number, number] = driverLocation 
          ? [driverLocation.lng, driverLocation.lat]
          : [MAPBOX_CONFIG.defaultCenter.lng, MAPBOX_CONFIG.defaultCenter.lat];

        console.log('📍 Centro do mapa:', center);

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: MAPBOX_CONFIG.style,
          center: center,
          zoom: MAPBOX_CONFIG.defaultZoom,
          attributionControl: true
        });

        // Aguardar carregamento do mapa
        mapInstance.on('load', () => {
          clearTimeout(timeoutId);
          console.log('✅ Mapbox carregado com sucesso');
          setIsLoading(false);
        });

        // Tratar erros
        mapInstance.on('error', (e) => {
          clearTimeout(timeoutId);
          console.error('❌ Erro no Mapbox:', e);
          setError(`Erro no Mapbox: ${e.error?.message || 'Erro desconhecido'}`);
          setIsLoading(false);
        });

        // Adicionar controles de navegação
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-left');
        mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.current = mapInstance;

        return () => {
          clearTimeout(timeoutId);
          if (map.current) {
            map.current.remove();
          }
        };
      } catch (err) {
        console.error('❌ Erro ao inicializar Mapbox:', err);
        setError(`Erro de inicialização: ${err}`);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

  // Atualizar marcador do motorista
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    // Remover marcador anterior
    if (driverMarker) {
      driverMarker.remove();
    }

    // Criar elemento HTML personalizado para o motorista
    const driverElement = document.createElement('div');
    driverElement.innerHTML = `
      <div style="
        width: 40px; 
        height: 40px; 
        background: #3B82F6; 
        border: 3px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 20px;
        cursor: pointer;
      ">🚐</div>
    `;

    // Criar marcador do motorista
    const marker = new mapboxgl.Marker(driverElement)
      .setLngLat([driverLocation.lng, driverLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937;">${activeRoute.driverName}</h3>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Última atualização: ${new Date(driverLocation.timestamp).toLocaleTimeString()}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                Precisão: ${driverLocation.accuracy ? Math.round(driverLocation.accuracy) + 'm' : 'N/A'}
              </p>
            </div>
          `)
      )
      .addTo(map.current);

    setDriverMarker(marker);

    // Centralizar mapa na localização do motorista
    map.current.flyTo({
      center: [driverLocation.lng, driverLocation.lat],
      zoom: 15,
      duration: 1000
    });

    console.log('📍 Localização do motorista atualizada:', driverLocation);
  }, [driverLocation, activeRoute.driverName]);

  // Atualizar marcadores dos estudantes
  useEffect(() => {
    if (!map.current || !activeRoute.studentPickups) return;

    // Remover marcadores anteriores
    studentMarkers.forEach(marker => marker.remove());

    const newMarkers: mapboxgl.Marker[] = [];

    activeRoute.studentPickups.forEach((student, index) => {
      if (!student.lat || !student.lng) return;

      const isNext = nextDestination?.studentId === student.studentId;
      const color = student.status === 'pending' ? (isNext ? '#F59E0B' : '#EF4444') :
                   student.status === 'picked_up' ? '#3B82F6' : '#10B981';

      // Criar elemento HTML personalizado para o estudante
      const studentElement = document.createElement('div');
      studentElement.innerHTML = `
        <div style="
          width: 32px; 
          height: 32px; 
          background: ${color}; 
          border: 2px solid white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        ">${index + 1}</div>
      `;

      const statusText = student.status === 'pending' ? 'Aguardando' :
                        student.status === 'picked_up' ? 'Na Van' : 'Entregue';

      // Criar marcador do estudante
      const marker = new mapboxgl.Marker(studentElement)
        .setLngLat([student.lng, student.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937;">${student.studentName}</h3>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">${student.address}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px;">
                  Status: <span style="color: ${color}; font-weight: bold;">${statusText}</span>
                </p>
                ${isNext ? '<p style="margin: 4px 0 0 0; font-size: 12px; color: #F59E0B; font-weight: bold;">📍 Próximo destino</p>' : ''}
              </div>
            `)
        )
        .addTo(map.current);

      newMarkers.push(marker);
    });

    setStudentMarkers(newMarkers);
  }, [activeRoute.studentPickups, nextDestination]);

  // Desenhar rota até o próximo destino
  useEffect(() => {
    if (!map.current || !driverLocation || !nextDestination || !nextDestination.lat || !nextDestination.lng) {
      // Remover rota se não há destino
      if (map.current && map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      return;
    }

    // Aguardar o mapa estar carregado
    if (!map.current.isStyleLoaded()) {
      map.current.on('styledata', () => {
        drawRoute();
      });
    } else {
      drawRoute();
    }

    function drawRoute() {
      if (!map.current || !driverLocation || !nextDestination) return;

      // Remover rota anterior se existir
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Buscar rota usando Mapbox Directions API
      const directionsUrl = `${MAPBOX_CONFIG.directionsApiUrl}/${driverLocation.lng},${driverLocation.lat};${nextDestination.lng},${nextDestination.lat}?geometries=geojson&access_token=${MAPBOX_CONFIG.accessToken}`;

      fetch(directionsUrl)
        .then(response => response.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // Adicionar fonte da rota
            map.current!.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              }
            });

            // Adicionar camada da rota
            map.current!.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3B82F6',
                'line-width': 4,
                'line-opacity': 0.8
              }
            });

            // Ajustar zoom para mostrar toda a rota
            const coordinates = route.geometry.coordinates;
            const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
              return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            map.current!.fitBounds(bounds, {
              padding: 50,
              duration: 1000
            });

            console.log('🛣️ Rota desenhada para:', nextDestination.studentName);
          }
        })
        .catch(error => {
          console.error('❌ Erro ao buscar rota:', error);
          // Fallback: linha direta
          drawStraightLine();
        });
    }

    function drawStraightLine() {
      if (!map.current || !driverLocation || !nextDestination) return;

      // Remover rota anterior se existir
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Linha direta como fallback
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [driverLocation.lng, driverLocation.lat],
              [nextDestination.lng, nextDestination.lat]
            ]
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2]
        }
      });
    }
  }, [driverLocation, nextDestination]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600 max-w-md mx-auto p-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no Mapa</h3>
          <p className="text-sm mb-4">{error}</p>
          <div className="bg-red-50 p-3 rounded-lg text-xs text-left">
            <p className="font-semibold mb-2">Informações de Debug:</p>
            <p><strong>Mapbox Token:</strong> {isMapboxConfigured() ? 'Configurado ✅' : 'Não configurado ❌'}</p>
            <p><strong>Rota Ativa:</strong> {activeRoute ? 'Sim' : 'Não'}</p>
            <p><strong>Localização:</strong> {driverLocation ? 'Disponível' : 'Indisponível'}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold mb-2">Carregando Mapbox</p>
          <p className="text-sm text-gray-500">Inicializando mapa em tempo real...</p>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-xs">
            <p><strong>Motorista:</strong> {activeRoute.driverName}</p>
            <p><strong>Estudantes:</strong> {activeRoute.studentPickups?.length || 0}</p>
            <p><strong>Direção:</strong> {activeRoute.direction === 'to_school' ? 'Para Escola' : 'Para Casa'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-10">
        <h4 className="font-semibold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">🚐</div>
            <span>Motorista (Van)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center font-bold">N</div>
            <span>Próximo destino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">P</div>
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold">✓</div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span>Rota</span>
          </div>
        </div>
      </div>

      {/* Informações da rota */}
      {nextDestination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm">Próximo: {nextDestination.studentName}</span>
          </div>
          <p className="text-xs text-gray-600">{nextDestination.address}</p>
        </div>
      )}
    </div>
  );
};