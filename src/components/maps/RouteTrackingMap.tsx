
import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG, isMapboxConfigured } from '../../config/maps';
import { MapPin, Navigation, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  pickupPoint: {
    address: string;
    coordinates: [number, number]; // [lng, lat]
  };
  dropoffLocation: 'school';
  status: 'waiting' | 'picked_up' | 'dropped_off';
}

interface RouteTrackingMapProps {
  students: Student[];
  driverLocation?: [number, number]; // [lng, lat]
  schoolLocation: [number, number]; // [lng, lat]
  className?: string;
}

export const RouteTrackingMap: React.FC<RouteTrackingMapProps> = ({
  students,
  driverLocation,
  schoolLocation,
  className = 'w-full h-96'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Calculate route statistics
  const routeStats = useMemo(() => {
    if (!students.length) return null;
    
    const totalDistance = students.reduce((acc, student, index) => {
      if (index === 0) return 0;
      const prev = students[index - 1];
      const [lng1, lat1] = prev.pickupPoint.coordinates;
      const [lng2, lat2] = student.pickupPoint.coordinates;
      
      // Simple distance calculation (Haversine formula approximation)
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return acc + (6371 * c); // Earth's radius in km
    }, 0);
    
    const estimatedTime = Math.round(totalDistance / 30 * 60); // Assuming 30km/h average speed
    const avgSpeed = totalDistance > 0 ? totalDistance / (estimatedTime / 60) : 0;
    
    return {
      distance: Math.round(totalDistance * 100) / 100,
      timeMinutes: estimatedTime,
      avgSpeed: Math.round(avgSpeed * 10) / 10
    };
  }, [students]);

  useEffect(() => {
    if (!isMapboxConfigured()) {
      setError('Token do MapBox não configurado. Configure VITE_MAPBOX_ACCESS_TOKEN no arquivo .env');
      return;
    }

    if (map.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    try {
      // Calculate bounds to fit all markers
      const bounds = new mapboxgl.LngLatBounds();
      
      students.forEach(student => {
        bounds.extend(student.pickupPoint.coordinates);
      });
      
      if (driverLocation) {
        bounds.extend(driverLocation);
      }
      
      bounds.extend(schoolLocation);

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.style,
        bounds: bounds,
        fitBoundsOptions: {
          padding: 50,
          maxZoom: 15
        }
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Erro no MapBox:', e);
        setError('Erro ao carregar o mapa');
      });

    } catch (err) {
      console.error('Erro ao inicializar MapBox:', err);
      setError('Erro ao inicializar o mapa');
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add student markers
    students.forEach((student, index) => {
      const el = document.createElement('div');
      el.className = 'student-marker';
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${student.status === 'picked_up' ? '#10b981' : student.status === 'dropped_off' ? '#6366f1' : '#ef4444'};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${index + 1}
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(student.pickupPoint.coordinates)
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${student.name}</h3>
            <p class="text-xs text-gray-600 mb-2">${student.pickupPoint.address}</p>
            <div class="flex items-center gap-1 text-xs">
              <span class="inline-block w-2 h-2 rounded-full ${
                student.status === 'picked_up' ? 'bg-green-500' : 
                student.status === 'dropped_off' ? 'bg-blue-500' : 'bg-red-500'
              }"></span>
              ${student.status === 'picked_up' ? 'Embarcado' : 
                student.status === 'dropped_off' ? 'Na escola' : 'Aguardando'}
            </div>
          </div>
        `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
    });

    // Add driver marker if available
    if (driverLocation) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        ">
          🚐
        </div>
      `;

      const driverMarker = new mapboxgl.Marker(el)
        .setLngLat(driverLocation)
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">Van Escolar</h3>
            <p class="text-xs text-gray-600">Localização atual</p>
          </div>
        `);

      driverMarker.setPopup(popup);
      markersRef.current.push(driverMarker);
    }

    // Add school marker
    const schoolEl = document.createElement('div');
    schoolEl.innerHTML = `
      <div style="
        width: 36px;
        height: 36px;
        background-color: #8b5cf6;
        border: 3px solid white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        🏫
      </div>
    `;

    const schoolMarker = new mapboxgl.Marker(schoolEl)
      .setLngLat(schoolLocation)
      .addTo(map.current!);

    const schoolPopup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">Escola</h3>
          <p class="text-xs text-gray-600">Destino final</p>
        </div>
      `);

    schoolMarker.setPopup(schoolPopup);
    markersRef.current.push(schoolMarker);

  }, [students, driverLocation, schoolLocation, isLoaded]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Erro no Mapa</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const pickedUpCount = students.filter(s => s.status === 'picked_up').length;
  const waitingCount = students.filter(s => s.status === 'waiting').length;
  const droppedOffCount = students.filter(s => s.status === 'dropped_off').length;

  return (
    <div className={`${className} relative`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Route Statistics Overlay */}
      {isLoaded && routeStats && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 text-xs">
          <h4 className="font-semibold text-gray-800 mb-2">Estatísticas da Rota</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Navigation className="w-3 h-3 text-blue-600" />
              <span>{routeStats.distance} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-green-600" />
              <span>~{routeStats.timeMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-purple-600" />
              <span>{routeStats.avgSpeed} km/h médio</span>
            </div>
          </div>
        </div>
      )}

      {/* Student Status Summary */}
      {isLoaded && students.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 text-xs">
          <h4 className="font-semibold text-gray-800 mb-2">Status dos Estudantes</h4>
          <div className="space-y-1">
            {waitingCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{waitingCount} aguardando</span>
              </div>
            )}
            {pickedUpCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{pickedUpCount} embarcados</span>
              </div>
            )}
            {droppedOffCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{droppedOffCount} na escola</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteTrackingMap;
