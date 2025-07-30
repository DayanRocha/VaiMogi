import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { MapboxMap } from '@/components/MapboxMap';
import { MapDebugPanel } from '@/components/MapDebugPanel';

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

  // Debug logs
  console.log('🗺️ GuardianMapView - Estado atual:', {
    isLoading,
    hasActiveRoute,
    activeRoute: activeRoute ? 'Presente' : 'Ausente',
    driverLocation: driverLocation ? 'Presente' : 'Ausente'
  });

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm">Carregando mapa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-200">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {hasActiveRoute ? (
          <>
            {/* Active Route View with Route Tracking Map */}
            <div className="w-full h-full">
              {/* Route Tracking Map - Dynamic Trajectory */}
              <MapboxMap
                activeRoute={activeRoute!}
                driverLocation={driverLocation}
                nextDestination={nextDestination}
              />
            </div>
          </>
        ) : (
          /* No Active Route */
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Nenhuma Rota Ativa</h2>
              <p className="text-sm mb-4">O mapa será ativado quando o motorista iniciar uma rota</p>
              
              <div className="mt-6 p-4 bg-white/80 rounded-lg max-w-sm mx-auto">
                <p className="text-xs text-gray-600 mb-3">
                  Você receberá uma notificação quando a rota for iniciada e poderá acompanhar 
                  a localização da van em tempo real.
                </p>
                
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">🧪 Para testar:</p>
                  <p className="text-xs text-gray-600">
                    1. Vá no painel do motorista<br/>
                    2. Configurações → Teste de Notificações<br/>
                    3. Clique "🚀 Iniciar Rota + Mapa"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug Panel - Commented out for clean interface */}
      {/* <MapDebugPanel /> */}
    </div>
  );
};