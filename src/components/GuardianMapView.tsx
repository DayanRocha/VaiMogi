import React from 'react';
import { MapPin } from 'lucide-react';
import { Driver, Van, Student, Trip } from '@/types/driver';

interface GuardianMapViewProps {
  driver: Driver;
  van: Van;
  students: Student[];
  activeTrip: Trip | null;
}



export const GuardianMapView = ({ driver, van, students, activeTrip }: GuardianMapViewProps) => {

  return (
    <div className="relative w-full h-full bg-gray-200">
      {/* Clean Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        {/* Aqui seria integrado um mapa real como Google Maps, Mapbox, etc. */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-xl font-semibold mb-2">Mapa da Rota</h2>
            <p className="text-sm">Acompanhe a localização da van em tempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
};