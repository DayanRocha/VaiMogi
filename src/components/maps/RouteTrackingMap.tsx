import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapboxMap } from './MapboxMap';
import { Navigation, Clock, Users, MapPin } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  pickupPoint: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: 'school' | 'home';
  status: 'waiting' | 'picked_up' | 'dropped_off';
}

interface RouteTrackingMapProps {
  students: Student[];
  driverLocation?: [number, number];
  schoolLocation: [number, number];
  className?: string;
}

const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateRouteStats = (
  driverLocation: [number, number],
  students: Student[],
  schoolLocation: [number, number]
) => {
  let totalDistance = 0;
  let currentLocation = driverLocation;
  
  // Calculate distance to each waiting student
  const waitingStudents = students.filter(s => s.status === 'waiting');
  waitingStudents.forEach(student => {
    totalDistance += calculateDistance(currentLocation, student.pickupPoint.coordinates);
    currentLocation = student.pickupPoint.coordinates;
  });
  
  // Add distance to school
  if (waitingStudents.length > 0) {
    totalDistance += calculateDistance(currentLocation, schoolLocation);
  }
  
  const estimatedSpeed = 25; // km/h average city speed
  const timeMinutes = (totalDistance / estimatedSpeed) * 60;
  
  return {
    distance: totalDistance,
    timeMinutes,
    avgSpeed: estimatedSpeed
  };
};

export const RouteTrackingMap: React.FC<RouteTrackingMapProps> = ({
  students,
  driverLocation,
  schoolLocation,
  className = 'w-full h-96'
}) => {
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinates: [number, number];
    popup?: string;
    color?: string;
  }>>([]);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  
  // Memoizar dados para evitar re-renderizações
  const memoizedStudents = useMemo(() => students, [JSON.stringify(students)]);
  const memoizedDriverLocation = useMemo(() => driverLocation, [driverLocation]);
  const memoizedSchoolLocation = useMemo(() => schoolLocation, [schoolLocation]);

  // Calcular estatísticas da rota
  const routeStats = useMemo(() => {
    if (!memoizedDriverLocation) return null;
    return calculateRouteStats(memoizedDriverLocation, memoizedStudents, memoizedSchoolLocation);
  }, [memoizedDriverLocation, memoizedStudents, memoizedSchoolLocation]);

  useEffect(() => {
    const newMarkers = [];
    const routePoints: Array<[number, number]> = [];

    // Adicionar motorista
    if (memoizedDriverLocation) {
      newMarkers.push({
        id: 'driver',
        coordinates: memoizedDriverLocation,
        popup: `
          <div class="p-3">
            <h3 class="font-bold text-sm mb-1">🚐 Motorista</h3>
            <p class="text-xs text-gray-600">Localização atual da van</p>
            ${routeStats ? `
              <div class="mt-2 text-xs">
                <p><strong>Distância restante:</strong> ${routeStats.distance.toFixed(1)} km</p>
                <p><strong>Tempo estimado:</strong> ${Math.round(routeStats.timeMinutes)} min</p>
                <p><strong>Velocidade média:</strong> ${routeStats.avgSpeed} km/h</p>
              </div>
            ` : ''}
          </div>
        `,
        color: '#3b82f6'
      });
      routePoints.push(memoizedDriverLocation);
    }

    // Adicionar estudantes
    memoizedStudents.forEach(student => {
      const statusColors = {
        waiting: '#ef4444',
        picked_up: '#3b82f6',
        dropped_off: '#10b981'
      };

      const statusText = {
        waiting: 'Aguardando',
        picked_up: 'Na Van',
        dropped_off: 'Entregue'
      };

      newMarkers.push({
        id: student.id,
        coordinates: student.pickupPoint.coordinates,
        popup: `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-sm mb-1">${student.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${student.pickupPoint.address}</p>
            <p class="text-xs">
              <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${statusColors[student.status]}"></span>
              ${statusText[student.status]}
            </p>
          </div>
        `,
        color: statusColors[student.status]
      });

      // Adicionar pontos de estudantes aguardando à rota
      if (student.status === 'waiting') {
        routePoints.push(student.pickupPoint.coordinates);
      }
    });

    // Adicionar escola
    newMarkers.push({
      id: 'school',
      coordinates: memoizedSchoolLocation,
      popup: `
        <div class="p-3">
          <h3 class="font-bold text-sm mb-1">🏫 Escola</h3>
          <p class="text-xs text-gray-600">Destino final</p>
        </div>
      `,
      color: '#10b981'
    });

    // Adicionar escola à rota se houver estudantes aguardando
    const hasWaitingStudents = memoizedStudents.some(s => s.status === 'waiting');
    if (hasWaitingStudents) {
      routePoints.push(memoizedSchoolLocation);
    }

    setMarkers(newMarkers);
    setRoute(routePoints);
  }, [memoizedStudents, memoizedDriverLocation, memoizedSchoolLocation, routeStats]);

  // Determinar centro do mapa
  const mapCenter = useMemo(() => {
    return memoizedDriverLocation || memoizedSchoolLocation;
  }, [memoizedDriverLocation, memoizedSchoolLocation]);

  const waitingStudents = memoizedStudents.filter(s => s.status === 'waiting');
  const pickedUpStudents = memoizedStudents.filter(s => s.status === 'picked_up');

  return (
    <div className={`${className} relative`}>
      <MapboxMap
        center={mapCenter}
        zoom={13}
        markers={markers}
        route={route}
        className="w-full h-full"
      />
      
      {/* Stats Overlay */}
      {routeStats && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            Informações da Rota
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Distância:</span>
              <span className="font-medium">{routeStats.distance.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo estimado:</span>
              <span className="font-medium">{Math.round(routeStats.timeMinutes)} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Velocidade média:</span>
              <span className="font-medium">{routeStats.avgSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* Students Counter */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Aguardando:</span>
            <span className="font-semibold">{waitingStudents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">Na van:</span>
            <span className="font-semibold">{pickedUpStudents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
