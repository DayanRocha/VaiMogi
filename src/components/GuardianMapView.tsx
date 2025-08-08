
import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { RouteTrackingMap } from './maps/RouteTrackingMap';

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

  return (
    <div className="relative w-full h-full bg-gray-200">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {hasActiveRoute && activeRoute && driverLocation ? (
          <>
            {/* Active Route View - Mapa Limpo */}
            <div className="w-full h-full relative">
              <RouteTrackingMap
                students={activeRoute.studentPickups.map(pickup => ({
                  id: pickup.studentId,
                  name: pickup.studentName,
                  pickupPoint: {
                    address: pickup.address,
                    coordinates: pickup.lat && pickup.lng ? [pickup.lng, pickup.lat] : [0, 0]
                  },
                  dropoffLocation: 'school' as const,
                  status: pickup.status === 'completed' ? 'picked_up' : 
                          pickup.status === 'pending' ? 'waiting' : 'dropped_off'
                }))}
                driverLocation={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
                schoolLocation={[-46.6333, -23.5505]} // Coordenadas padrão de São Paulo
                className="w-full h-full"
              />
              
              {/* Overlay com informações da rota */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-800">Rota Ativa</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Motorista:</strong> {activeRoute.driverName}
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Estudantes:</strong> {activeRoute.studentPickups.length}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Próximo:</strong> {nextDestination?.address || 'Calculando...'}
                </p>
              </div>
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
        )}
      </div>
    </div>
  );
};
