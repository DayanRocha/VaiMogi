import React, { useEffect, useState } from 'react';
import { MapPin, School, Car } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface DynamicMapProps {
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

export const DynamicMap: React.FC<DynamicMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [schoolLocation, setSchoolLocation] = useState<{lat: number, lng: number, name?: string} | null>(null);

  // Buscar dados da escola cadastrada
  useEffect(() => {
    const loadSchoolData = () => {
      try {
        const savedSchools = localStorage.getItem('schools');
        if (savedSchools) {
          const schools = JSON.parse(savedSchools);
          if (schools.length > 0) {
            const school = schools[0]; // Primeira escola cadastrada
            if (school.lat && school.lng) {
              setSchoolLocation({ 
                lat: school.lat, 
                lng: school.lng, 
                name: school.name 
              });
              console.log('🏫 Escola encontrada:', { name: school.name, lat: school.lat, lng: school.lng });
            } else {
              // Se não tem coordenadas, usar localização padrão de escola em SP
              setSchoolLocation({ 
                lat: -23.5558, 
                lng: -46.6396, 
                name: 'Escola Padrão' 
              });
              console.log('🏫 Usando localização padrão da escola');
            }
          }
        } else {
          // Escola padrão se não houver cadastrada
          setSchoolLocation({ 
            lat: -23.5558, 
            lng: -46.6396, 
            name: 'Escola Municipal' 
          });
          console.log('🏫 Usando escola padrão');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados da escola:', error);
        setSchoolLocation({ 
          lat: -23.5558, 
          lng: -46.6396, 
          name: 'Escola (Erro)' 
        });
      }
    };

    loadSchoolData();
  }, []);

  // Atualizar mapa com marcadores dinâmicos
  useEffect(() => {
    if (!driverLocation || !schoolLocation) return;

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;
    const schoolLat = schoolLocation.lat;
    const schoolLng = schoolLocation.lng;

    // Calcular bbox para enquadrar ambos os pontos
    const minLat = Math.min(driverLat, schoolLat) - 0.005;
    const maxLat = Math.max(driverLat, schoolLat) + 0.005;
    const minLng = Math.min(driverLng, schoolLng) - 0.005;
    const maxLng = Math.max(driverLng, schoolLng) + 0.005;

    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

    // URL do OpenStreetMap com marcadores nativos
    // Primeiro marcador (motorista) e segundo marcador (escola)
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${driverLat},${driverLng}&marker=${schoolLat},${schoolLng}`;
    
    setMapUrl(url);
    console.log('🗺️ Mapa com marcadores nativos atualizado:', { 
      motorista: { lat: driverLat, lng: driverLng },
      escola: { lat: schoolLat, lng: schoolLng },
      url: url
    });
  }, [driverLocation, schoolLocation]);

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
          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
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
          <p className="text-sm">Carregando mapa dinâmico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Mapa completamente limpo com APENAS marcadores nativos do OpenStreetMap */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title="Localização do Motorista e Escola"
        loading="lazy"
        style={{ 
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};