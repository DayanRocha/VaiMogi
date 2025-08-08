
import React, { useEffect, useState } from 'react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface CleanMapProps {
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

export const CleanMap: React.FC<CleanMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    if (!driverLocation) return;

    // Criar URL do OpenStreetMap centrado na localização do motorista
    const lat = driverLocation.lat;
    const lng = driverLocation.lng;
    const zoom = 15;

    // Calcular bbox para o mapa (área ao redor da localização)
    const offset = 0.008; // Aproximadamente 1km de raio
    const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;

    // URL do OpenStreetMap sem marcador, usando hash para centralizar no motorista
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik#map=${zoom}/${lat}/${lng}`;
    
    setMapUrl(url);
    console.log('🗺️ Mapa limpo atualizado centralizado no motorista:', { lat, lng });
  }, [driverLocation]);

  if (!driverLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Aguardando localização do motorista...</p>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa centrado na localização do motorista */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title="Localização do Motorista"
        loading="lazy"
        style={{ 
          border: 'none',
          outline: 'none'
        }}
      />
      
      {/* Indicador de status ao vivo */}
      <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg opacity-90">
        🟢 AO VIVO
      </div>
      
      {/* Nome do motorista discreto */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
        {activeRoute.driverName}
      </div>
    </div>
  );
};
