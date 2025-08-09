import React, { useEffect, useState } from 'react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface CleanDynamicMapProps {
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

export const CleanDynamicMap: React.FC<CleanDynamicMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [schoolLocation, setSchoolLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

  // Buscar dados da escola cadastrada
  useEffect(() => {
    const loadSchoolData = () => {
      try {
        const savedSchools = localStorage.getItem('schools');
        if (savedSchools) {
          const schools = JSON.parse(savedSchools);
          if (schools.length > 0) {
            const school = schools[0];
            if (school.lat && school.lng) {
              setSchoolLocation({
                lat: school.lat,
                lng: school.lng,
                name: school.name || 'Escola Municipal'
              });
              console.log('🏫 Escola carregada:', school.name);
            } else {
              console.log('⚠️ Escola cadastrada sem coordenadas');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar escola:', error);
      }
    };

    loadSchoolData();
  }, []);

  // Atualizar mapa
  useEffect(() => {
    if (!driverLocation || !schoolLocation) return;

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;
    const schoolLat = schoolLocation.lat;
    const schoolLng = schoolLocation.lng;

    // Calcular bbox para enquadrar ambos os pontos
    const minLat = Math.min(driverLat, schoolLat) - 0.008;
    const maxLat = Math.max(driverLat, schoolLat) + 0.008;
    const minLng = Math.min(driverLng, schoolLng) - 0.008;
    const maxLng = Math.max(driverLng, schoolLng) + 0.008;

    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

    // URL do mapa sem marcadores (limpo)
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
    
    setMapUrl(url);
    console.log('🗺️ Mapa limpo atualizado');
  }, [driverLocation, schoolLocation]);

  // Função para calcular posição do ícone no mapa
  const calculateIconPosition = (lat: number, lng: number, isDriver: boolean) => {
    if (!driverLocation || !schoolLocation) return { left: '50%', top: '50%' };

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;
    const schoolLat = schoolLocation.lat;
    const schoolLng = schoolLocation.lng;

    // Calcular limites do bbox
    const minLat = Math.min(driverLat, schoolLat) - 0.008;
    const maxLat = Math.max(driverLat, schoolLat) + 0.008;
    const minLng = Math.min(driverLng, schoolLng) - 0.008;
    const maxLng = Math.max(driverLng, schoolLng) + 0.008;

    // Calcular posição relativa (0-1)
    const relativeX = (lng - minLng) / (maxLng - minLng);
    const relativeY = 1 - (lat - minLat) / (maxLat - minLat); // Inverter Y

    // Converter para porcentagem com margem
    const leftPercent = Math.max(5, Math.min(95, relativeX * 100));
    const topPercent = Math.max(5, Math.min(95, relativeY * 100));

    return {
      left: `${leftPercent}%`,
      top: `${topPercent}%`
    };
  };

  if (!driverLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Obtendo localização do motorista...</p>
        </div>
      </div>
    );
  }

  if (!schoolLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando dados da escola...</p>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  const driverPosition = calculateIconPosition(driverLocation.lat, driverLocation.lng, true);
  const schoolPosition = calculateIconPosition(schoolLocation.lat, schoolLocation.lng, false);

  return (
    <div className="relative w-full h-full">
      {/* Mapa base completamente limpo */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title="Mapa da Rota"
        loading="lazy"
        style={{ 
          border: 'none',
          outline: 'none'
        }}
      />
      
      {/* Ícone do motorista */}
      <div 
        className="absolute pointer-events-none z-10"
        style={{
          left: driverPosition.left,
          top: driverPosition.top,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          {/* Ícone principal */}
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <span className="text-white text-xl">🚐</span>
          </div>
          {/* Pulso animado */}
          <div className="absolute inset-0 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-30"></div>
        </div>
      </div>

      {/* Ícone da escola */}
      <div 
        className="absolute pointer-events-none z-10"
        style={{
          left: schoolPosition.left,
          top: schoolPosition.top,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span className="text-white text-xl">🏫</span>
        </div>
      </div>
      
      {/* Indicador discreto de status */}
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg opacity-90">
        🟢 AO VIVO
      </div>
    </div>
  );
};