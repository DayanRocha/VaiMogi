import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, MapPin, AlertCircle } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

// Importar CSS do Leaflet
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
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

export const LeafletMap: React.FC<LeafletMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<L.Marker | null>(null);
  const [destinationMarkers, setDestinationMarkers] = useState<L.Marker[]>([]);
  const [routeLine, setRouteLine] = useState<L.Polyline | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Criar ícones personalizados
  const createDriverIcon = () => {
    return L.divIcon({
      html: `
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
        ">🚐</div>
      `,
      className: 'custom-driver-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createStudentIcon = (index: number, status: string, isNext: boolean) => {
    const color = status === 'pending' ? (isNext ? '#F59E0B' : '#EF4444') :
                 status === 'picked_up' ? '#3B82F6' : '#10B981';
    
    return L.divIcon({
      html: `
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
        ">${index + 1}</div>
      `,
      className: 'custom-student-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      // Criar mapa centrado no Brasil (São Paulo)
      const mapInstance = L.map(mapRef.current).setView([-23.5505, -46.6333], 12);

      // Adicionar camada do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);

      setMap(mapInstance);
      setIsLoading(false);

      console.log('🗺️ Leaflet Map inicializado com sucesso');

      return () => {
        mapInstance.remove();
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
      setIsLoading(false);
    }
  }, []);

  // Atualizar localização do motorista
  useEffect(() => {
    if (!map || !driverLocation) return;

    // Remover marcador anterior
    if (driverMarker) {
      map.removeLayer(driverMarker);
    }

    // Criar novo marcador do motorista
    const marker = L.marker([driverLocation.lat, driverLocation.lng], {
      icon: createDriverIcon()
    }).addTo(map);

    // Popup com informações do motorista
    marker.bindPopup(`
      <div style="padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937;">${activeRoute.driverName}</h3>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Última atualização: ${new Date(driverLocation.timestamp).toLocaleTimeString()}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
          Precisão: ${driverLocation.accuracy ? Math.round(driverLocation.accuracy) + 'm' : 'N/A'}
        </p>
      </div>
    `);

    setDriverMarker(marker);

    // Centralizar mapa na localização do motorista
    map.setView([driverLocation.lat, driverLocation.lng], 14);

    console.log('📍 Localização do motorista atualizada:', driverLocation);
  }, [map, driverLocation, activeRoute.driverName]);

  // Atualizar marcadores dos destinos
  useEffect(() => {
    if (!map || !activeRoute.studentPickups) return;

    // Remover marcadores anteriores
    destinationMarkers.forEach(marker => map.removeLayer(marker));

    const newMarkers: L.Marker[] = [];

    activeRoute.studentPickups.forEach((student, index) => {
      if (!student.lat || !student.lng) return;

      const isNext = nextDestination?.studentId === student.studentId;
      
      const marker = L.marker([student.lat, student.lng], {
        icon: createStudentIcon(index, student.status, isNext)
      }).addTo(map);

      // Popup com informações do estudante
      const statusText = student.status === 'pending' ? 'Aguardando' :
                        student.status === 'picked_up' ? 'Na Van' : 'Entregue';
      
      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${student.studentName}</h3>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">${student.address}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px;">
            Status: <span style="font-weight: bold;">${statusText}</span>
          </p>
          ${isNext ? '<p style="margin: 4px 0 0 0; font-size: 12px; color: #F59E0B; font-weight: bold;">📍 Próximo destino</p>' : ''}
        </div>
      `);

      newMarkers.push(marker);
    });

    setDestinationMarkers(newMarkers);
  }, [map, activeRoute.studentPickups, nextDestination]);

  // Desenhar linha da rota até o próximo destino
  useEffect(() => {
    if (!map || !driverLocation || !nextDestination || !nextDestination.lat || !nextDestination.lng) {
      // Remover linha se não há destino
      if (routeLine) {
        map.removeLayer(routeLine);
        setRouteLine(null);
      }
      return;
    }

    // Remover linha anterior
    if (routeLine) {
      map.removeLayer(routeLine);
    }

    // Criar linha direta entre motorista e próximo destino
    const line = L.polyline([
      [driverLocation.lat, driverLocation.lng],
      [nextDestination.lat, nextDestination.lng]
    ], {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 5'
    }).addTo(map);

    setRouteLine(line);

    // Ajustar zoom para mostrar ambos os pontos
    const bounds = L.latLngBounds([
      [driverLocation.lat, driverLocation.lng],
      [nextDestination.lat, nextDestination.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    console.log('🛣️ Linha da rota desenhada para:', nextDestination.studentName);
  }, [map, driverLocation, nextDestination]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando mapa em tempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
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
            <div className="w-4 h-1 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
            <span>Rota</span>
          </div>
        </div>
      </div>

      {/* Informações da rota */}
      {nextDestination && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm">Próximo: {nextDestination.studentName}</span>
          </div>
          <p className="text-xs text-gray-600">{nextDestination.address}</p>
        </div>
      )}

      {/* Controles do mapa */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg z-[1000]">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => map?.zoomIn()}
            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => map?.zoomOut()}
            className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
};