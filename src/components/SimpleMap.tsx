import React, { useEffect, useState } from 'react';
import { Navigation, MapPin, Car, Users } from 'lucide-react';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface SimpleMapProps {
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

export const SimpleMap: React.FC<SimpleMapProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    if (!driverLocation) return;

    // Criar URL do OpenStreetMap com marcadores
    const lat = driverLocation.lat;
    const lng = driverLocation.lng;
    const zoom = 15;

    // URL base do OpenStreetMap
    const baseUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    
    setMapUrl(baseUrl);
    console.log('🗺️ Mapa simples carregado:', { lat, lng });
  }, [driverLocation]);

  if (!driverLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">Aguardando Localização</p>
          <p className="text-sm">Esperando dados do motorista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa via iframe */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title="Mapa da Rota"
        loading="lazy"
      />
      
      {/* Overlay com informações */}
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            {activeRoute.driverName}
          </h3>
          <div className="text-sm text-gray-600">
            {activeRoute.direction === 'to_school' ? '🏫 Para Escola' : '🏠 Para Casa'}
          </div>
        </div>

        {/* Localização atual */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-sm">Localização Atual</span>
          </div>
          <div className="text-xs text-gray-600">
            <p>Lat: {driverLocation.lat.toFixed(6)}</p>
            <p>Lng: {driverLocation.lng.toFixed(6)}</p>
            <p>Atualizado: {new Date(driverLocation.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Próximo destino */}
        {nextDestination && (
          <div className="mb-3 p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-sm text-orange-800">Próximo Destino</span>
            </div>
            <p className="text-sm font-medium text-orange-900">{nextDestination.studentName}</p>
            <p className="text-xs text-orange-700">{nextDestination.address}</p>
          </div>
        )}

        {/* Lista de estudantes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-4 h-4" />
            <span>Estudantes ({activeRoute.studentPickups?.length || 0})</span>
          </div>
          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
            {activeRoute.studentPickups?.map((student, index) => (
              <div key={student.studentId} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    student.status === 'pending' ? (nextDestination?.studentId === student.studentId ? 'bg-yellow-500' : 'bg-red-500') :
                    student.status === 'picked_up' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{student.studentName}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  student.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {student.status === 'pending' ? 'Aguardando' :
                   student.status === 'picked_up' ? 'Na Van' : 'Entregue'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Motorista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Próximo destino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Concluído</span>
          </div>
        </div>
      </div>
    </div>
  );
};