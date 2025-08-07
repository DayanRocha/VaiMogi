import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG, isMapboxConfigured } from '../../config/maps';

interface MapboxMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    popup?: string;
    color?: string;
  }>;
  route?: Array<[number, number]>;
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
}

export const MapboxMap: React.FC<MapboxMapProps> = ({
  center = [MAPBOX_CONFIG.defaultCenter.lng, MAPBOX_CONFIG.defaultCenter.lat],
  zoom = MAPBOX_CONFIG.defaultZoom,
  markers = [],
  route = [],
  onMapLoad,
  className = 'w-full h-96'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMapboxConfigured()) {
      setError('Token do MapBox não configurado. Configure VITE_MAPBOX_ACCESS_TOKEN no arquivo .env');
      return;
    }

    if (map.current) return; // Evita inicializar múltiplas vezes

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.style,
        center: { lng: center[0], lat: center[1] },
        zoom: zoom
      });

      map.current.on('load', () => {
        setIsLoaded(true);
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Atualizar marcadores
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remover marcadores existentes
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Adicionar novos marcadores
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = marker.color || '#3b82f6';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      if (marker.popup) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(marker.popup);
        mapboxMarker.setPopup(popup);
      }
    });
  }, [markers, isLoaded]);

  // Atualizar rota
  useEffect(() => {
    if (!map.current || !isLoaded || route.length === 0) return;

    // Remover rota existente
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Adicionar nova rota
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });
  }, [route, isLoaded]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Erro no Mapa</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;