
import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { GuardianMapbox } from '@/components/GuardianMapbox';
import { isMapboxConfigured } from '@/config/maps';

interface GuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
}

export const GuardianMapView = ({ driver, van, students, activeTrip }: GuardianMapViewProps) => {
  const { 
    hasActiveRoute, 
    activeRoute, 
    driverLocation, 
    nextDestination, 
    isLoading 
  } = useRouteTracking();

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

  // Verificar se o Mapbox está configurado
  if (!isMapboxConfigured()) {
    return (
      <div className="relative w-full h-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
          <div className="text-center text-red-500 max-w-md mx-auto p-6">
            <MapPin className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuração do Mapa</h3>
            <p className="text-sm">Token do Mapbox não configurado corretamente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {hasActiveRoute && activeRoute && driverLocation ? (
        /* Mapa ativo com localização */
        <GuardianMapbox
          activeRoute={activeRoute}
          driverLocation={driverLocation}
          nextDestination={nextDestination}
        />
      ) : (
        /* Mapa padrão quando não há rota ativa */
        <GuardianMapbox />
      )}
    </div>
  );
};
