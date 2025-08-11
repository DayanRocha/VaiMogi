import React from 'react';
import { GuardianRealTimeMap } from './GuardianRealTimeMap';
import { Driver, Van, Student, ActiveTrip } from '@/types/driver';
import { getMapboxToken } from '@/config/maps';

interface GuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: ActiveTrip | null;
  guardianId: string;
}

const GuardianMapView: React.FC<GuardianMapViewProps> = ({
  driver,
  van,
  students,
  activeTrip,
  guardianId
}) => {
  // Obter token do Mapbox (ambiente ou localStorage)
  const mapboxToken = getMapboxToken();

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Token do Mapbox não encontrado</h3>
          <p className="text-gray-600">Configure o token do Mapbox para visualizar o mapa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <GuardianRealTimeMap
        guardianId={guardianId}
        mapboxToken={mapboxToken}
        className="w-full h-full"
      />
    </div>
  );
};

export default GuardianMapView;