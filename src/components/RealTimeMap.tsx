import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from '@/config/maps';

interface RealTimeMapProps {
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

export const RealTimeMap: React.FC<RealTimeMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarkers, setDestinationMarkers] = useState<google.maps.Marker[]>([]);
  const [routeRenderer, setRouteRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('🗺️ Inicializando Google Maps...');
        
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_CONFIG.apiKey,
          version: GOOGLE_MAPS_CONFIG.version,
          libraries: GOOGLE_MAPS_CONFIG.libraries
        });

        await loader.load();
        console.log('✅ Google Maps API carregada');

        if (!mapRef.current) {
          console.error('❌ Elemento do mapa não encontrado');
          return;
        }

        // Criar mapa centrado na localização do motorista ou São Paulo
        const center = driverLocation 
          ? { lat: driverLocation.lat, lng: driverLocation.lng }
          : GOOGLE_MAPS_CONFIG.defaultCenter;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: GOOGLE_MAPS_CONFIG.defaultZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          ...GOOGLE_MAPS_CONFIG.mapOptions
        });

        setMap(mapInstance);
        setIsLoading(false);

        console.log('🗺️ Google Maps inicializado com sucesso');
      } catch (err) {
        console.error('❌ Erro ao carregar Google Maps:', err);
        setError(`Erro ao carregar o mapa: ${err}`);
        setIsLoading(false);
      }
    };

    initMap();
  }, [driverLocation]);

  // Atualizar localização do motorista
  useEffect(() => {
    if (!map || !driverLocation) return;

    // Remover marcador anterior
    if (driverMarker) {
      driverMarker.setMap(null);
    }

    // Criar novo marcador do motorista
    const marker = new google.maps.Marker({
      position: { lat: driverLocation.lat, lng: driverLocation.lng },
      map: map,
      title: `Motorista: ${activeRoute.driverName}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#FFFFFF" stroke-width="3"/>
            <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
            <text x="20" y="25" text-anchor="middle" fill="#3B82F6" font-size="12" font-weight="bold">🚐</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      },
      animation: google.maps.Animation.DROP
    });

    // Info window para o motorista
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${activeRoute.driverName}</h3>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            Última atualização: ${new Date(driverLocation.timestamp).toLocaleTimeString()}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
            Precisão: ${driverLocation.accuracy ? Math.round(driverLocation.accuracy) + 'm' : 'N/A'}
          </p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    setDriverMarker(marker);

    // Centralizar mapa na localização do motorista
    map.setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });

    console.log('📍 Localização do motorista atualizada:', driverLocation);
  }, [map, driverLocation, activeRoute.driverName]);

  // Atualizar marcadores dos destinos
  useEffect(() => {
    if (!map || !activeRoute.studentPickups) return;

    // Remover marcadores anteriores
    destinationMarkers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    activeRoute.studentPickups.forEach((student, index) => {
      if (!student.lat || !student.lng) return;

      const isNext = nextDestination?.studentId === student.studentId;
      const color = student.status === 'pending' ? (isNext ? '#F59E0B' : '#EF4444') :
                   student.status === 'picked_up' ? '#3B82F6' : '#10B981';

      const marker = new google.maps.Marker({
        position: { lat: student.lat, lng: student.lng },
        map: map,
        title: student.studentName,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">${index + 1}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Info window para o estudante
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${student.studentName}</h3>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">${student.address}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">
              Status: <span style="color: ${color}; font-weight: bold;">
                ${student.status === 'pending' ? 'Aguardando' :
                  student.status === 'picked_up' ? 'Na Van' : 'Entregue'}
              </span>
            </p>
            ${isNext ? '<p style="margin: 4px 0 0 0; font-size: 12px; color: #F59E0B; font-weight: bold;">📍 Próximo destino</p>' : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setDestinationMarkers(newMarkers);
  }, [map, activeRoute.studentPickups, nextDestination]);

  // Desenhar rota até o próximo destino
  useEffect(() => {
    if (!map || !driverLocation || !nextDestination || !nextDestination.lat || !nextDestination.lng) {
      // Remover rota se não há destino
      if (routeRenderer) {
        routeRenderer.setMap(null);
      }
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    // Remover renderer anterior
    if (routeRenderer) {
      routeRenderer.setMap(null);
    }

    const newRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // Usar nossos próprios marcadores
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    directionsService.route({
      origin: { lat: driverLocation.lat, lng: driverLocation.lng },
      destination: { lat: nextDestination.lat, lng: nextDestination.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      avoidTolls: false,
      avoidHighways: false
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        newRenderer.setDirections(result);
        newRenderer.setMap(map);
        setRouteRenderer(newRenderer);
        
        console.log('🛣️ Rota calculada para:', nextDestination.studentName);
      } else {
        console.error('❌ Erro ao calcular rota:', status);
      }
    });
  }, [map, driverLocation, nextDestination]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600 max-w-md mx-auto p-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no Mapa</h3>
          <p className="text-sm mb-4">{error}</p>
          <div className="bg-red-50 p-3 rounded-lg text-xs text-left">
            <p className="font-semibold mb-2">Informações de Debug:</p>
            <p><strong>API Key:</strong> {isGoogleMapsConfigured() ? 'Configurada ✅' : 'Não configurada ❌'}</p>
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
          <p className="text-lg font-semibold mb-2">Carregando Google Maps</p>
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
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Motorista (Van)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Próximo destino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Concluído</span>
          </div>
        </div>
      </div>

      {/* Informações da rota */}
      {nextDestination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
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