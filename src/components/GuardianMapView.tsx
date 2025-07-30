
import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { MapboxMap } from '@/components/MapboxMap';

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
    driverLocation: driverLocation ? 'Presente' : 'Ausente',
    hasValidLocation: driverLocation ? `${driverLocation.lat}, ${driverLocation.lng}` : 'Não'
  });

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

  return (
    <div className="relative w-full h-full bg-gray-200">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {hasActiveRoute && activeRoute && driverLocation ? (
          <>
            {/* Active Route View with Mapbox */}
            <div className="w-full h-full">
              <MapboxMap
                activeRoute={activeRoute}
                driverLocation={driverLocation}
                nextDestination={nextDestination}
              />
            </div>
          </>
        ) : (
          /* No Active Route - Clean Interface */
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500 max-w-md mx-auto p-6">
              <MapPin className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="text-2xl font-bold mb-3 text-gray-700">Nenhuma Rota Ativa</h2>
              <p className="text-sm mb-6 text-gray-600 leading-relaxed">
                O mapa será ativado automaticamente quando o motorista iniciar uma rota. 
                Você receberá uma notificação e poderá acompanhar a localização da van em tempo real.
              </p>
              
              <div className="bg-white/90 rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center justify-center gap-2">
                  <span>🧪</span>
                  Para Testar o Sistema
                </h3>
                <div className="text-xs text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">1</span>
                    <span>Abra o painel do motorista em uma nova aba</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">2</span>
                    <span>Vá em Configurações → Teste de Notificações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">3</span>
                    <span>Clique em "🚀 Iniciar Rota + Mapa"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">✓</span>
                    <span>Retorne aqui para ver o mapa ativo</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Status: {hasActiveRoute ? '🟢 Rota Ativa' : '🔴 Aguardando Rota'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
