
import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { CleanMap } from '@/components/CleanMap';

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

  // Se há rota ativa, mostrar o mapa limpo
  if (hasActiveRoute && activeRoute) {
    return (
      <CleanMap
        activeRoute={activeRoute}
        driverLocation={driverLocation}
        nextDestination={nextDestination}
      />
    );
  }

  // Se não há rota ativa, mostrar tela de aguardo
  return (
    <div className="relative w-full h-full bg-gray-200">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-500 max-w-md mx-auto p-6">
            <MapPin className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-bold mb-3 text-gray-700">Nenhuma Rota Ativa</h2>
            <p className="text-sm mb-6 text-gray-600 leading-relaxed">
              O mapa será ativado automaticamente quando o motorista iniciar uma rota. 
              Você receberá uma notificação e poderá acompanhar a localização da van em tempo real.
            </p>
            
            <div className="bg-white/90 rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-blue-700 mb-2 text-center">
                Como Funciona
              </h3>
              <p className="text-xs text-gray-600 text-center">
                Quando o motorista iniciar uma rota, você receberá notificações em tempo real 
                e poderá acompanhar o progresso da viagem.
              </p>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Status: {hasActiveRoute ? '🟢 Rota Ativa' : '🔴 Aguardando Rota'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
