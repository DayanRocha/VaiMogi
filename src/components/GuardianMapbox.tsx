
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '@/config/maps';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface GuardianMapboxProps {
  activeRoute?: ActiveRoute | null;
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

export const GuardianMapbox: React.FC<GuardianMapboxProps> = ({
  activeRoute,
  driverLocation,
  nextDestination
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const schoolMarker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar o mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Configurar token do Mapbox
      mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

      // Criar mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.style,
        center: [MAPBOX_CONFIG.defaultCenter.lng, MAPBOX_CONFIG.defaultCenter.lat],
        zoom: MAPBOX_CONFIG.defaultZoom,
        pitch: 0,
        bearing: 0
      });

      // Adicionar controles de navegação
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Quando o mapa carregar
      map.current.on('load', () => {
        setIsLoading(false);
        console.log('🗺️ Mapa Mapbox carregado para responsável');
      });

      // Tratar erros
      map.current.on('error', (e) => {
        console.error('❌ Erro no mapa Mapbox:', e);
        setError('Erro ao carregar o mapa');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar mapa Mapbox:', error);
      setError('Falha na inicialização do mapa');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (driverMarker.current) {
        driverMarker.current.remove();
      }
      if (schoolMarker.current) {
        schoolMarker.current.remove();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Atualizar localização do motorista
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    try {
      // Remover marcador anterior do motorista
      if (driverMarker.current) {
        driverMarker.current.remove();
      }

      // Criar elemento customizado para o motorista
      const driverEl = document.createElement('div');
      driverEl.className = 'driver-marker';
      driverEl.innerHTML = '🚐';
      driverEl.style.fontSize = '24px';
      driverEl.style.cursor = 'pointer';

      // Adicionar novo marcador do motorista
      driverMarker.current = new mapboxgl.Marker(driverEl)
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .addTo(map.current);

      // Centralizar mapa na localização do motorista
      map.current.flyTo({
        center: [driverLocation.lng, driverLocation.lat],
        zoom: 15,
        duration: 2000
      });

      console.log('📍 Localização do motorista atualizada no mapa:', {
        lat: driverLocation.lat,
        lng: driverLocation.lng
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar localização do motorista:', error);
    }
  }, [driverLocation]);

  // Adicionar marcador da escola
  useEffect(() => {
    if (!map.current) return;

    try {
      // Buscar dados da escola
      const savedSchools = localStorage.getItem('schools');
      if (savedSchools) {
        const schools = JSON.parse(savedSchools);
        if (schools.length > 0) {
          const school = schools[0];
          
          // Remover marcador anterior da escola
          if (schoolMarker.current) {
            schoolMarker.current.remove();
          }

          // Criar elemento customizado para a escola
          const schoolEl = document.createElement('div');
          schoolEl.className = 'school-marker';
          schoolEl.innerHTML = '🏫';
          schoolEl.style.fontSize = '24px';
          schoolEl.style.cursor = 'pointer';

          // Adicionar marcador da escola
          schoolMarker.current = new mapboxgl.Marker(schoolEl)
            .setLngLat([school.lng || -46.6396, school.lat || -23.5558])
            .addTo(map.current);

          console.log('🏫 Marcador da escola adicionado:', school.name);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar marcador da escola:', error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-500">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2 text-gray-400">Verifique sua conexão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
